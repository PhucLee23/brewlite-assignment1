import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { assertTransition } from './order-state-machine';

export const ORDER_INCLUDE = {
  items: { orderBy: { id: 'asc' } },
} satisfies Prisma.OrderInclude;

const TX_OPTIONS = { maxWait: 10_000, timeout: 20_000 };

type Tx = Prisma.TransactionClient;

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  listMine(userId: number) {
    return this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: ORDER_INCLUDE,
    });
  }

  async findMine(userId: number, id: number) {
    const order = await this.prisma.order.findFirst({ where: { id, userId }, include: ORDER_INCLUDE });
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');
    return order;
  }

  async cancel(userId: number, id: number) {
    await this.findMine(userId, id);
    return this.changeStatus(id, 'CANCELLED');
  }

  /**
   * Dùng cho nhân viên quầy (PAID → PREPARING → READY → COMPLETED) và khi khách hủy đơn.
   * Từ PREPARING trở đi assertTransition chặn việc hủy.
   */
  changeStatus(id: number, to: OrderStatus) {
    return this.prisma.$transaction(async (tx) => {
      // Khóa dòng đơn hàng để hai yêu cầu đổi trạng thái cùng một đơn không chạy chồng nhau
      await tx.$queryRaw`SELECT id FROM "Order" WHERE id = ${id} FOR UPDATE`;
      const order = await tx.order.findUnique({ where: { id } });
      if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');
      await transitionOrder(tx, id, order.status, to);
      if (to === 'CANCELLED') {
        // Trả lại đúng lượng nguyên liệu đã trừ lúc đặt, cùng thứ tự id tăng dần như lúc trừ
        const used = await tx.orderIngredient.findMany({ where: { orderId: id }, orderBy: { ingredientId: 'asc' } });
        for (const u of used) {
          await tx.ingredient.update({
            where: { id: u.ingredientId },
            data: { stock: { increment: u.amount }, version: { increment: 1 } },
          });
        }
      }
      return tx.order.findUniqueOrThrow({ where: { id }, include: ORDER_INCLUDE });
    }, TX_OPTIONS);
  }
}

/**
 * Chuyển trạng thái có kiểm tra state machine; điều kiện `status: from` trong WHERE
 * đảm bảo không ghi đè nếu một request khác vừa đổi trạng thái đơn.
 */
export async function transitionOrder(tx: Tx, orderId: number, from: OrderStatus, to: OrderStatus) {
  assertTransition(from, to);
  const { count } = await tx.order.updateMany({ where: { id: orderId, status: from }, data: { status: to } });
  if (count !== 1) throw new ConflictException('Đơn hàng vừa được cập nhật bởi một yêu cầu khác');
}
