import { Injectable, NotFoundException } from '@nestjs/common';
import { Size } from '@prisma/client';
import { cupNeeds, RECIPE_SELECT, RecipeLine, servingsLeft, stockMap } from '../ingredients/inventory';
import { SIZE_SURCHARGE } from '../orders/pricing';
import { PrismaService } from '../prisma/prisma.service';

const PUBLIC_FIELDS = { id: true, name: true, description: true, price: true, imageUrl: true, recipe: RECIPE_SELECT } as const;

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const products = await this.prisma.product.findMany({ select: PUBLIC_FIELDS, orderBy: { id: 'asc' } });
    return products.map(withStock);
  }

  async findOne(id: number) {
    const product = await this.prisma.product.findUnique({ where: { id }, select: PUBLIC_FIELDS });
    if (!product) throw new NotFoundException('Không tìm thấy sản phẩm');
    const toppings = await this.prisma.topping.findMany({
      select: { id: true, name: true, price: true, recipe: RECIPE_SELECT },
      orderBy: { id: 'asc' },
    });
    const stock = stockMap(product.recipe);
    // Size lớn tốn nhiều nguyên liệu hơn nên số ly còn lại tính riêng cho từng size
    const sizes = (Object.entries(SIZE_SURCHARGE) as [Size, number][]).map(([size, surcharge]) => ({
      size,
      surcharge,
      stock: servingsLeft(cupNeeds(product.recipe, size), stock),
    }));
    return {
      ...withStock(product),
      sizes,
      toppings: toppings.map(({ recipe, ...t }) => ({
        ...t,
        stock: servingsLeft(cupNeeds([], 'S', [recipe]), stockMap(recipe)),
      })),
    };
  }
}

/** `stock` là số ly size S còn bán được, tính từ nguyên liệu; công thức không trả ra ngoài. */
function withStock<T extends { recipe: RecipeLine[] }>({ recipe, ...product }: T) {
  return { ...product, stock: servingsLeft(cupNeeds(recipe, 'S'), stockMap(recipe)) };
}
