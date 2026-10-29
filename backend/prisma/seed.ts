import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const PRODUCTS = [
  { id: 1, name: 'Cà phê sữa đá', price: 35000, imageUrl: '/images/ca-phe-sua.jpg', description: 'Cà phê phin truyền thống với sữa đặc, đậm vị.' },
  { id: 2, name: 'Americano', price: 40000, imageUrl: '/images/americano.jpg', description: 'Espresso pha loãng với nước nóng, thanh và nhẹ.' },
  { id: 3, name: 'Cappuccino', price: 45000, imageUrl: '/images/cappuccino.jpg', description: 'Espresso, sữa nóng và lớp bọt sữa mịn.' },
  { id: 4, name: 'Latte', price: 45000, imageUrl: '/images/latte.jpg', description: 'Espresso với nhiều sữa tươi, vị béo nhẹ.' },
  { id: 5, name: 'Bạc xỉu', price: 35000, imageUrl: '/images/bac-xiu.jpg', description: 'Nhiều sữa, ít cà phê, ngọt dịu.' },
  { id: 6, name: 'Trà đào cam sả', price: 39000, imageUrl: '/images/tra-dao.jpg', description: 'Trà đen, đào miếng, cam và sả tươi.' },
  { id: 7, name: 'Matcha latte', price: 49000, imageUrl: '/images/matcha.jpg', description: 'Matcha Nhật Bản với sữa tươi.' },
  { id: 8, name: 'Cold brew', price: 50000, imageUrl: '/images/cold-brew.jpg', description: 'Ủ lạnh 16 giờ. Số lượng có hạn mỗi ngày.' },
  { id: 9, name: 'Espresso', price: 35000, imageUrl: '/images/espresso.jpg', description: 'Một shot cà phê đậm đặc, lớp crema dày.' },
  { id: 10, name: 'Latte caramel muối', price: 55000, imageUrl: '/images/latte-caramel-muoi.jpg', description: 'Latte với sốt caramel và chút muối biển, ngọt mặn hài hòa.' },
  { id: 11, name: 'Americano cam', price: 45000, imageUrl: '/images/americano-cam.jpg', description: 'Americano pha nước cam tươi, chua nhẹ và thơm.' },
  { id: 12, name: 'Trà vải lài', price: 45000, imageUrl: '/images/tra-vai-lai.jpg', description: 'Trà hoa lài với vải tươi, thanh mát.' },
  { id: 13, name: 'Trà xoài chanh dây', price: 45000, imageUrl: '/images/tra-xoai-chanh-day.jpg', description: 'Trà trái cây với xoài chín và chanh dây.' },
  { id: 14, name: 'Trà bưởi hồng', price: 49000, imageUrl: '/images/tra-buoi-hong.jpg', description: 'Trà trái cây với bưởi hồng, vị chua ngọt.' },
  { id: 15, name: 'Trà sữa oolong', price: 45000, imageUrl: '/images/tra-sua-oolong.jpg', description: 'Trà oolong rang với sữa tươi, béo thơm.' },
];

const TOPPINGS = [
  { name: 'Trân châu', price: 5000 },
  { name: 'Kem cheese', price: 7000 },
  { name: 'Thạch cà phê', price: 5000 },
  { name: 'Thêm shot espresso', price: 10000 },
];

// Tồn ban đầu của nguyên liệu; số ly còn bán được của từng món tính từ đây
const INGREDIENTS = [
  { name: 'Hạt espresso', unit: 'g', stock: 2000 },
  { name: 'Cà phê phin', unit: 'g', stock: 2500 },
  { name: 'Cold brew ủ sẵn', unit: 'ml', stock: 1000 },
  { name: 'Sữa đặc', unit: 'ml', stock: 3000 },
  { name: 'Sữa tươi', unit: 'ml', stock: 10000 },
  { name: 'Bột matcha', unit: 'g', stock: 160 },
  { name: 'Trà đen', unit: 'g', stock: 250 },
  { name: 'Trà lài', unit: 'g', stock: 250 },
  { name: 'Trà oolong', unit: 'g', stock: 360 },
  { name: 'Đào ngâm', unit: 'g', stock: 3000 },
  { name: 'Vải ngâm', unit: 'g', stock: 2500 },
  { name: 'Mứt xoài chanh dây', unit: 'ml', stock: 2000 },
  { name: 'Tép bưởi hồng', unit: 'g', stock: 2000 },
  { name: 'Nước cam', unit: 'ml', stock: 5000 },
  { name: 'Sốt caramel', unit: 'ml', stock: 800 },
  { name: 'Đường nước', unit: 'ml', stock: 3000 },
  { name: 'Ly nhựa', unit: 'cái', stock: 500, scalesWithSize: false },
  { name: 'Trân châu', unit: 'g', stock: 2000 },
  { name: 'Kem cheese', unit: 'g', stock: 1500 },
  { name: 'Thạch cà phê', unit: 'g', stock: 2000 },
];

// Công thức 1 ly size S (theo id món); size M, L dùng nhiều hơn, xem SIZE_RECIPE_PERCENT
const RECIPES: Record<number, Record<string, number>> = {
  1: { 'Cà phê phin': 25, 'Sữa đặc': 30, 'Ly nhựa': 1 },
  2: { 'Hạt espresso': 18, 'Ly nhựa': 1 },
  3: { 'Hạt espresso': 18, 'Sữa tươi': 150, 'Ly nhựa': 1 },
  4: { 'Hạt espresso': 18, 'Sữa tươi': 200, 'Ly nhựa': 1 },
  5: { 'Cà phê phin': 15, 'Sữa đặc': 40, 'Sữa tươi': 60, 'Ly nhựa': 1 },
  6: { 'Trà đen': 5, 'Đào ngâm': 60, 'Nước cam': 20, 'Đường nước': 20, 'Ly nhựa': 1 },
  7: { 'Bột matcha': 4, 'Sữa tươi': 200, 'Ly nhựa': 1 },
  8: { 'Cold brew ủ sẵn': 200, 'Ly nhựa': 1 },
  9: { 'Hạt espresso': 18, 'Ly nhựa': 1 },
  10: { 'Hạt espresso': 18, 'Sữa tươi': 180, 'Sốt caramel': 20, 'Ly nhựa': 1 },
  11: { 'Hạt espresso': 18, 'Nước cam': 100, 'Ly nhựa': 1 },
  12: { 'Trà lài': 5, 'Vải ngâm': 50, 'Đường nước': 20, 'Ly nhựa': 1 },
  13: { 'Trà đen': 5, 'Mứt xoài chanh dây': 40, 'Đường nước': 20, 'Ly nhựa': 1 },
  14: { 'Trà đen': 5, 'Tép bưởi hồng': 50, 'Đường nước': 20, 'Ly nhựa': 1 },
  15: { 'Trà oolong': 6, 'Sữa tươi': 150, 'Đường nước': 20, 'Ly nhựa': 1 },
};

// Một phần topping, không đổi theo size
const TOPPING_RECIPES: Record<string, Record<string, number>> = {
  'Trân châu': { 'Trân châu': 50 },
  'Kem cheese': { 'Kem cheese': 30 },
  'Thạch cà phê': { 'Thạch cà phê': 50 },
  'Thêm shot espresso': { 'Hạt espresso': 18 },
};

const PROMOTIONS = [
  { code: 'BREW10', percentOff: 10, minTotal: 50000, active: true, expiresAt: null },
  { code: 'WELCOME20', percentOff: 20, minTotal: 100000, active: true, expiresAt: null },
  { code: 'HETHAN', percentOff: 50, minTotal: 0, active: true, expiresAt: new Date('2025-01-01') },
];

async function main() {
  // Backend chạy seed mỗi lần khởi động: chỉ cập nhật thông tin nguyên liệu, giữ nguyên tồn kho hiện tại
  const ingredientId = new Map<string, number>();
  for (const i of INGREDIENTS) {
    const { stock, ...info } = i;
    const row = await prisma.ingredient.upsert({ where: { name: i.name }, update: info, create: { ...info, stock } });
    ingredientId.set(i.name, row.id);
  }
  const recipeRows = (recipe: Record<string, number>) =>
    Object.entries(recipe).map(([name, amount]) => {
      const id = ingredientId.get(name);
      if (!id) throw new Error(`Công thức dùng nguyên liệu chưa khai báo: ${name}`);
      return { ingredientId: id, amount };
    });

  for (const p of PRODUCTS) {
    await prisma.product.upsert({ where: { id: p.id }, update: p, create: p });
    // Ghi lại toàn bộ công thức để sửa công thức trong file này là có hiệu lực ở lần khởi động sau
    await prisma.productIngredient.deleteMany({ where: { productId: p.id } });
    await prisma.productIngredient.createMany({ data: recipeRows(RECIPES[p.id]).map((r) => ({ ...r, productId: p.id })) });
  }
  // Đồng bộ sequence sau khi chèn id cố định
  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('"Product"', 'id'), (SELECT MAX(id) FROM "Product"))`,
  );
  for (const t of TOPPINGS) {
    const topping = await prisma.topping.upsert({ where: { name: t.name }, update: t, create: t });
    await prisma.toppingIngredient.deleteMany({ where: { toppingId: topping.id } });
    await prisma.toppingIngredient.createMany({
      data: recipeRows(TOPPING_RECIPES[t.name]).map((r) => ({ ...r, toppingId: topping.id })),
    });
  }
  for (const promo of PROMOTIONS) {
    await prisma.promotion.upsert({ where: { code: promo.code }, update: promo, create: promo });
  }

  const passwordHash = await bcrypt.hash('123456', 10);
  await prisma.user.upsert({
    where: { email: 'khach@brewlite.vn' },
    update: {},
    create: { email: 'khach@brewlite.vn', fullName: 'Khách Demo', passwordHash },
  });
  await prisma.user.upsert({
    where: { email: 'barista@brewlite.vn' },
    update: {},
    create: { email: 'barista@brewlite.vn', fullName: 'Barista Demo', passwordHash, role: 'STAFF' },
  });
  console.log(
    `Seed xong: ${PRODUCTS.length} sản phẩm, ${INGREDIENTS.length} nguyên liệu, ${TOPPINGS.length} topping, ${PROMOTIONS.length} mã giảm giá, 2 tài khoản.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
