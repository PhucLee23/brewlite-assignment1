import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { GatewayHttp } from '../src/payments/gateways/gateway';
import { PrismaService } from '../src/prisma/prisma.service';
import { FakeGateways, momoCallback, vnpayCallback } from './fake-gateways';

describe('BrewLite – luồng đặt hàng và nghiệp vụ Task 10 (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let token: string;
  let customerEmail: string;
  let staffToken: string;
  let seq = 0;
  const gateways = new FakeGateways();

  const uniq = () => `${Date.now()}-${++seq}`;
  const auth = (t = token) => ({ Authorization: `Bearer ${t}` });

  function createIngredient(stock: number, scalesWithSize = true) {
    return prisma.ingredient.create({ data: { name: `Nguyên liệu test ${uniq()}`, unit: 'g', stock, scalesWithSize } });
  }

  /** Món test theo công thức [nguyên liệu, lượng cho 1 ly size S]. */
  function createRecipeProduct(recipe: [ingredientId: number, amount: number][], price = 40000) {
    return prisma.product.create({
      data: {
        name: `Test drink ${uniq()}`,
        price,
        imageUrl: '/images/latte.jpg',
        recipe: { create: recipe.map(([ingredientId, amount]) => ({ ingredientId, amount })) },
      },
      include: { recipe: true },
    });
  }

  /** Món test dùng riêng một nguyên liệu, mỗi ly 1 phần bất kể size: tồn nguyên liệu chính là số ly còn lại. */
  async function createProduct(stock: number, price = 40000) {
    const ingredient = await createIngredient(stock, false);
    return createRecipeProduct([[ingredient.id, 1]], price);
  }

  async function ingredientStock(id: number) {
    return (await prisma.ingredient.findUniqueOrThrow({ where: { id } })).stock;
  }

  /** Số ly còn lại của món tạo bằng createProduct. */
  function stockOf(product: { recipe: { ingredientId: number }[] }) {
    return ingredientStock(product.recipe[0].ingredientId);
  }

  async function productStock(id: number) {
    return (await request(app.getHttpServer()).get(`/products/${id}`).expect(200)).body;
  }

  function placeOrder(productId: number, qty = 1, key?: string, t = token) {
    const req = request(app.getHttpServer()).post('/orders').set(auth(t));
    if (key) req.set('Idempotency-Key', key);
    return req.send({ items: [{ productId, size: 'M', toppingIds: [], qty }] });
  }

  /** Mở phiên thanh toán: backend trả link sang trang thanh toán của cổng, đơn vẫn PENDING. */
  function pay(orderId: number, key: string, provider: 'MOMO' | 'VNPAY' = 'VNPAY', t = token) {
    return request(app.getHttpServer())
      .post('/payments')
      .set(auth(t))
      .set('Idempotency-Key', key)
      .send({ orderId, provider });
  }

  /** VNPay gọi IPN về backend (server gọi server). */
  function vnpayIpn(params: Record<string, string>) {
    return request(app.getHttpServer()).get('/payments/vnpay/ipn').query(params).expect(200);
  }

  /** Khách được cổng chuyển về BrewLite, trang BrewLite gửi tham số trên link lên backend. */
  function returnFromGateway(paymentId: number, params: Record<string, string>, t = token) {
    return request(app.getHttpServer()).post(`/payments/${paymentId}/return`).set(auth(t)).send({ params });
  }

  type Session = { payment: { id: number; amount: number; gatewayOrderId: string } };

  /** Khách thanh toán thành công trọn vẹn trên VNPay: mở phiên, trả tiền, VNPay gọi IPN. */
  async function payAndConfirm(orderId: number): Promise<Session> {
    const session = (await pay(orderId, `pay-${uniq()}`).expect(201)).body;
    const transId = gateways.resolve(session.payment, 'SUCCESS');
    expect((await vnpayIpn(vnpayCallback(session.payment, 'SUCCESS', transId))).body.RspCode).toBe('00');
    return session;
  }

  beforeAll(async () => {
    // Cổng MoMo, VNPay giả: test không gọi Internet
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(GatewayHttp)
      .useValue(gateways)
      .compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    // Listen trên cổng ngẫu nhiên để các request song song dùng chung một server
    await app.listen(0);
    prisma = app.get(PrismaService);

    customerEmail = `khach-${uniq()}@test.vn`;
    const reg = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: customerEmail, password: 'matkhau123', fullName: 'Khách Test' })
      .expect(201);
    token = reg.body.accessToken;

    const staffEmail = `staff-${uniq()}@test.vn`;
    await prisma.user.create({
      data: { email: staffEmail, fullName: 'Barista', role: 'STAFF', passwordHash: await bcrypt.hash('matkhau123', 10) },
    });
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: staffEmail, password: 'matkhau123' })
      .expect(200);
    staffToken = login.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Auth và validate', () => {
    it('lưu mật khẩu dạng băm bcrypt, không lưu bản rõ', async () => {
      const user = await prisma.user.findUniqueOrThrow({ where: { email: customerEmail } });
      expect(user.passwordHash).not.toBe('matkhau123');
      expect(user.passwordHash.startsWith('$2')).toBe(true);
    });

    it('chặn đặt đơn khi chưa đăng nhập (401)', async () => {
      await request(app.getHttpServer()).post('/orders').send({ items: [] }).expect(401);
    });

    it('từ chối giỏ hàng rỗng hoặc dữ liệu sai (400)', async () => {
      await request(app.getHttpServer()).post('/orders').set(auth()).send({ items: [] }).expect(400);
      await request(app.getHttpServer())
        .post('/orders')
        .set(auth())
        .send({ items: [{ productId: 1, size: 'XL', qty: 0 }] })
        .expect(400);
    });
  });

  describe('Tạo đơn, khuyến mãi và lịch sử', () => {
    it('tính giá ở server và lưu đơn ở trạng thái PENDING', async () => {
      const product = await createProduct(10, 40000);
      const res = await placeOrder(product.id, 2).expect(201);
      expect(res.body.status).toBe('PENDING');
      // Size M phụ thu 5.000đ → (40.000 + 5.000) × 2
      expect(res.body.total).toBe(90000);
      const me = await request(app.getHttpServer()).get('/orders/me').set(auth()).expect(200);
      expect(me.body.map((o: { id: number }) => o.id)).toContain(res.body.id);
    });

    it('áp mã giảm giá hợp lệ và từ chối mã không hợp lệ', async () => {
      await prisma.promotion.upsert({
        where: { code: 'TEST10' },
        update: {},
        create: { code: 'TEST10', percentOff: 10, minTotal: 0 },
      });
      const product = await createProduct(10, 40000);
      const ok = await request(app.getHttpServer())
        .post('/orders')
        .set(auth())
        .send({ items: [{ productId: product.id, size: 'S', qty: 1 }], promoCode: 'test10' })
        .expect(201);
      expect(ok.body.discount).toBe(4000);
      expect(ok.body.total).toBe(36000);

      await request(app.getHttpServer())
        .post('/orders')
        .set(auth())
        .send({ items: [{ productId: product.id, size: 'S', qty: 1 }], promoCode: 'KHONGCO' })
        .expect(400);
    });
  });

  describe('(a) Order State Machine chặn chuyển trạng thái sai', () => {
    it('không cho đơn PENDING nhảy thẳng sang PREPARING', async () => {
      const product = await createProduct(5);
      const order = (await placeOrder(product.id).expect(201)).body;
      await request(app.getHttpServer())
        .patch(`/orders/${order.id}/status`)
        .set(auth(staffToken))
        .send({ status: 'PREPARING' })
        .expect(409);
      expect((await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).status).toBe('PENDING');
    });

    it('đi đúng luồng PAID → PREPARING → READY → COMPLETED, sau đó không thể hủy', async () => {
      const product = await createProduct(5);
      const order = (await placeOrder(product.id).expect(201)).body;
      await payAndConfirm(order.id);
      for (const status of ['PREPARING', 'READY', 'COMPLETED']) {
        await request(app.getHttpServer())
          .patch(`/orders/${order.id}/status`)
          .set(auth(staffToken))
          .send({ status })
          .expect(200);
      }
      await request(app.getHttpServer()).post(`/orders/${order.id}/cancel`).set(auth()).expect(409);
    });

    it('khách không có quyền đổi trạng thái pha chế (403)', async () => {
      const product = await createProduct(5);
      const order = (await placeOrder(product.id).expect(201)).body;
      await request(app.getHttpServer())
        .patch(`/orders/${order.id}/status`)
        .set(auth())
        .send({ status: 'PAID' })
        .expect(403);
    });

    it('nhân viên không thể tự đặt đơn sang PAID khi chưa thanh toán (400)', async () => {
      const product = await createProduct(5);
      const order = (await placeOrder(product.id).expect(201)).body;
      await request(app.getHttpServer())
        .patch(`/orders/${order.id}/status`)
        .set(auth(staffToken))
        .send({ status: 'PAID' })
        .expect(400);
      expect((await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).status).toBe('PENDING');
    });

    it('hủy đơn trả lại nguyên liệu về kho', async () => {
      const product = await createProduct(5);
      const order = (await placeOrder(product.id, 2).expect(201)).body;
      expect((await stockOf(product))).toBe(3);
      await request(app.getHttpServer()).post(`/orders/${order.id}/cancel`).set(auth()).expect(200);
      expect((await stockOf(product))).toBe(5);
    });

    it('khách tự hủy đơn đã PAID chưa pha: trả nguyên liệu và thu hồi điểm thưởng', async () => {
      const product = await createProduct(5, 40000);
      const order = (await placeOrder(product.id).expect(201)).body;
      const before = (await prisma.user.findUniqueOrThrow({ where: { email: customerEmail } })).loyaltyPoints;
      await payAndConfirm(order.id);
      expect((await prisma.user.findUniqueOrThrow({ where: { email: customerEmail } })).loyaltyPoints).toBeGreaterThan(before);

      await request(app.getHttpServer()).post(`/orders/${order.id}/cancel`).set(auth()).expect(200);
      expect((await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).status).toBe('CANCELLED');
      expect((await stockOf(product))).toBe(5);
      expect((await prisma.user.findUniqueOrThrow({ where: { email: customerEmail } })).loyaltyPoints).toBe(before);
    });

    it('khách không hủy được đơn đã bắt đầu pha (409)', async () => {
      const product = await createProduct(5);
      const order = (await placeOrder(product.id).expect(201)).body;
      await payAndConfirm(order.id);
      const setStatus = (status: string) =>
        request(app.getHttpServer()).patch(`/orders/${order.id}/status`).set(auth(staffToken)).send({ status });
      await setStatus('PREPARING').expect(200);
      await request(app.getHttpServer()).post(`/orders/${order.id}/cancel`).set(auth()).expect(409);
      expect((await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).status).toBe('PREPARING');
    });

    it('không cho hủy đơn khi khách đang ở trang cổng thanh toán (409)', async () => {
      const product = await createProduct(5);
      const order = (await placeOrder(product.id).expect(201)).body;
      await pay(order.id, `pay-${uniq()}`).expect(201);
      await request(app.getHttpServer()).post(`/orders/${order.id}/cancel`).set(auth()).expect(409);
      expect((await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).status).toBe('PENDING');
    });

    it('phiên thanh toán bỏ dở quá hạn không còn chặn hủy đơn', async () => {
      const product = await createProduct(5);
      const order = (await placeOrder(product.id).expect(201)).body;
      const session = (await pay(order.id, `pay-${uniq()}`).expect(201)).body;
      await prisma.$executeRaw`UPDATE "Payment" SET "createdAt" = now() - interval '6 minutes' WHERE id = ${session.payment.id}`;
      await request(app.getHttpServer()).post(`/orders/${order.id}/cancel`).set(auth()).expect(200);
      expect((await prisma.payment.findUniqueOrThrow({ where: { id: session.payment.id } })).status).toBe('FAILED');
    });

    it('đơn chưa thanh toán quá hạn tự hủy và trả nguyên liệu về kho', async () => {
      const product = await createProduct(5);
      const stale = (await placeOrder(product.id, 2).expect(201)).body;
      await prisma.$executeRaw`UPDATE "Order" SET "updatedAt" = now() - interval '6 minutes' WHERE id = ${stale.id}`;
      await placeOrder(product.id, 1).expect(201);
      expect((await prisma.order.findUniqueOrThrow({ where: { id: stale.id } })).status).toBe('CANCELLED');
      // 5 − 2 (đơn cũ) + 2 (tự hủy) − 1 (đơn mới)
      expect((await stockOf(product))).toBe(4);
    });
  });
});
