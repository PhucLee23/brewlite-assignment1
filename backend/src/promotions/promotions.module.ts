import { Controller, Get, Module, Param, ParseIntPipe, Query } from '@nestjs/common';
import { evaluatePromotion } from '../orders/pricing';
import { PrismaService } from '../prisma/prisma.service';

@Controller('promotions')
export class PromotionsController {
  constructor(private readonly prisma: PrismaService) {}

  /** Kiểm tra trước một mã giảm giá cho giỏ hàng có tạm tính `subtotal`. */
  @Get(':code')
  async check(@Param('code') code: string, @Query('subtotal', ParseIntPipe) subtotal: number) {
    const promo = await this.prisma.promotion.findUnique({ where: { code: code.trim().toUpperCase() } });
    const result = evaluatePromotion(promo, subtotal);
    return result.ok
      ? { valid: true, code: promo!.code, percentOff: promo!.percentOff, discount: result.discount }
      : { valid: false, reason: result.reason };
  }
}

@Module({ controllers: [PromotionsController] })
export class PromotionsModule {}
