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

  describe('(b) Idempotency-Key: gửi lặp chỉ tạo 1 đơn và chỉ trừ tiền 1 lần', () => {
    it('gửi POST /orders 2 lần cùng key chỉ tạo 1 đơn', async () => {
      const product = await createProduct(10);
      const key = `order-${uniq()}`;
      const first = await placeOrder(product.id, 1, key).expect(201);
      const second = await placeOrder(product.id, 1, key).expect(201);
      expect(second.body.id).toBe(first.body.id);
      expect(await prisma.order.count({ where: { items: { some: { productId: product.id } } } })).toBe(1);
      expect((await stockOf(product))).toBe(9);
    });

    it('5 request POST /orders song song cùng key vẫn chỉ tạo 1 đơn', async () => {
      const product = await createProduct(10);
      const key = `order-${uniq()}`;
      const results = await Promise.all(Array.from({ length: 5 }, () => placeOrder(product.id, 1, key)));
      const ids = new Set(results.map((r) => r.body.id));
      expect(results.every((r) => r.status === 201)).toBe(true);
      expect(ids.size).toBe(1);
      expect(await prisma.order.count({ where: { items: { some: { productId: product.id } } } })).toBe(1);
    });

    it('gửi POST /payments 2 lần (cả tuần tự lẫn song song) cùng key chỉ mở 1 phiên, gọi MoMo tạo giao dịch 1 lần', async () => {
      const product = await createProduct(10, 40000);
      const order = (await placeOrder(product.id).expect(201)).body;
      const key = `pay-${uniq()}`;
      const createsBefore = gateways.momoCreates;

      const [a, b] = await Promise.all([pay(order.id, key, 'MOMO'), pay(order.id, key, 'MOMO')]);
      const third = await pay(order.id, key, 'MOMO').expect(201);
      expect([a.status, b.status]).toEqual([201, 201]);
      expect(new Set([a.body.payment.id, b.body.payment.id, third.body.payment.id]).size).toBe(1);
      expect(third.body.replayed).toBe(true);
      expect(third.body.paymentUrl).toContain(third.body.payment.gatewayOrderId);
      expect(gateways.momoCreates - createsBefore).toBe(1);
      expect(await prisma.payment.count({ where: { orderId: order.id } })).toBe(1);
    });

    it('cổng báo thành công nhiều lần (IPN gửi lặp song song, khách quay về cùng lúc) chỉ cộng điểm 1 lần', async () => {
      const product = await createProduct(10, 40000);
      const order = (await placeOrder(product.id).expect(201)).body;
      const before = await prisma.user.findFirstOrThrow({ where: { orders: { some: { id: order.id } } } });
      const session = (await pay(order.id, `pay-${uniq()}`).expect(201)).body;
      const transId = gateways.resolve(session.payment, 'SUCCESS');
      const callback = vnpayCallback(session.payment, 'SUCCESS', transId);

      const sent = await Promise.all([vnpayIpn(callback), vnpayIpn(callback), vnpayIpn(callback)]);
      const back = await returnFromGateway(session.payment.id, callback).expect(200);
      const codes = sent.map((r) => r.body.RspCode).sort();
      expect(codes).toEqual(['00', '02', '02']);
      expect(back.body.order.status).toBe('PAID');
      expect((await vnpayIpn(callback)).body.RspCode).toBe('02');

      const after = await prisma.user.findUniqueOrThrow({ where: { id: before.id } });
      expect(after.loyaltyPoints - before.loyaltyPoints).toBe(45); // 45.000đ → 45 điểm
    });

    it('bấm thanh toán lại khi phiên cũ còn hạn thì dùng tiếp phiên cũ, không mở phiên thứ hai', async () => {
      const product = await createProduct(10);
      const order = (await placeOrder(product.id).expect(201)).body;
      const first = (await pay(order.id, `pay-${uniq()}`).expect(201)).body;
      const second = (await pay(order.id, `pay-${uniq()}`).expect(201)).body;
      expect(second.payment.id).toBe(first.payment.id);
      expect(second.paymentUrl).toBe(first.paymentUrl);
      expect(await prisma.payment.count({ where: { orderId: order.id } })).toBe(1);
    });

    it('đang có phiên VNPay chưa xong thì không mở thêm phiên MoMo (409)', async () => {
      const product = await createProduct(10);
      const order = (await placeOrder(product.id).expect(201)).body;
      await pay(order.id, `pay-${uniq()}`, 'VNPAY').expect(201);
      const res = await pay(order.id, `pay-${uniq()}`, 'MOMO').expect(409);
      expect(res.body.message).toContain('VNPay');
      expect(await prisma.payment.count({ where: { orderId: order.id } })).toBe(1);
    });

    it('dùng lại key cho một đơn khác bị từ chối (409)', async () => {
      const product = await createProduct(10);
      const o1 = (await placeOrder(product.id).expect(201)).body;
      const o2 = (await placeOrder(product.id).expect(201)).body;
      const key = `pay-${uniq()}`;
      await pay(o1.id, key).expect(201);
      await pay(o2.id, key).expect(409);
    });

    it('không thể thanh toán lại đơn đã PAID bằng key mới', async () => {
      const product = await createProduct(10);
      const order = (await placeOrder(product.id).expect(201)).body;
      await payAndConfirm(order.id);
      await pay(order.id, `pay-${uniq()}`).expect(409);
      expect(await prisma.payment.count({ where: { orderId: order.id } })).toBe(1);
    });
  });

  describe('Thanh toán qua cổng MoMo, VNPay (bên thứ ba, sandbox)', () => {
    async function openSession(provider: 'MOMO' | 'VNPAY' = 'VNPAY') {
      const product = await createProduct(10);
      const order = (await placeOrder(product.id).expect(201)).body;
      const session = (await pay(order.id, `pay-${uniq()}`, provider).expect(201)).body;
      return { order, session, payment: session.payment as Session['payment'] };
    }
    const statusOf = async (orderId: number) => (await prisma.order.findUniqueOrThrow({ where: { id: orderId } })).status;

    it('VNPay: trả link sandbox có chữ ký đúng số tiền, hết hạn sau 5 phút; đơn vẫn PENDING', async () => {
      const { order, session } = await openSession('VNPAY');
      expect(session.order.status).toBe('PENDING');
      expect(session.payment).toMatchObject({ status: 'PROCESSING', provider: 'VNPAY' });
      expect(session.payment).not.toHaveProperty('idempotencyKey');
      expect(Date.parse(session.expiresAt) - Date.parse(session.payment.createdAt)).toBe(5 * 60_000);

      const url = new URL(session.paymentUrl);
      expect(url.host).toBe('sandbox.vnpayment.vn');
      const params = Object.fromEntries(url.searchParams);
      expect(params).toMatchObject({
        vnp_Amount: String(order.total * 100),
        vnp_TxnRef: session.payment.gatewayOrderId,
        vnp_ReturnUrl: `http://localhost:3000/payments/${session.payment.id}`,
      });
      const vnTime = (t: string) => Date.parse(`${t.slice(0, 4)}-${t.slice(4, 6)}-${t.slice(6, 8)}T${t.slice(8, 10)}:${t.slice(10, 12)}:${t.slice(12)}+07:00`);
      expect(vnTime(params.vnp_ExpireDate) - vnTime(params.vnp_CreateDate)).toBe(5 * 60_000);
      // Khách sửa số tiền trên link thì chữ ký không còn khớp
      expect(vnpayCallback({ ...session.payment, amount: 1000 }, 'SUCCESS').vnp_SecureHash).not.toBe(params.vnp_SecureHash);
    });

    it('MoMo: gọi API tạo giao dịch lấy link; MoMo từ chối thì 502 và bấm thanh toán lại được ngay', async () => {
      const product = await createProduct(10);
      const order = (await placeOrder(product.id).expect(201)).body;
      gateways.failNextCreate = true;
      const failed = await pay(order.id, `pay-${uniq()}`, 'MOMO').expect(502);
      expect(failed.body.message).toContain('MoMo');
      expect(await statusOf(order.id)).toBe('PENDING');

      const ok = (await pay(order.id, `pay-${uniq()}`, 'MOMO').expect(201)).body;
      expect(new URL(ok.paymentUrl).host).toBe('test-payment.momo.vn');
    });

    it('khách quay về với kết quả có chữ ký: backend tra cứu lại cổng rồi mới chuyển PAID và lưu mã giao dịch', async () => {
      const { order, payment } = await openSession('VNPAY');
      const transId = gateways.resolve(payment, 'SUCCESS');
      const back = await returnFromGateway(payment.id, vnpayCallback(payment, 'SUCCESS', transId)).expect(200);
      expect(back.body.order.status).toBe('PAID');
      expect(back.body.paymentUrl).toBeNull();
      expect(await prisma.payment.findUniqueOrThrow({ where: { id: payment.id } })).toMatchObject({
        status: 'SUCCESS',
        gatewayRef: transId,
        bankCode: 'NCB',
      });
      expect(await statusOf(order.id)).toBe('PAID');
    });

    it('kết quả quay về sai chữ ký, của giao dịch khác hoặc của người khác bị từ chối; đơn không đổi', async () => {
      const { order, payment } = await openSession('VNPAY');
      const other = await openSession('VNPAY');
      const forged = { ...vnpayCallback(payment, 'SUCCESS'), vnp_SecureHash: 'f'.repeat(128) };
      await returnFromGateway(payment.id, forged).expect(400);
      await returnFromGateway(payment.id, vnpayCallback(other.payment, 'SUCCESS')).expect(400);
      await returnFromGateway(payment.id, vnpayCallback(payment, 'SUCCESS'), staffToken).expect(404);
      // Tự sửa số tiền trên link quay về thì chữ ký sai
      await returnFromGateway(payment.id, { ...vnpayCallback(payment, 'SUCCESS'), vnp_Amount: '100' }).expect(400);
      expect(await statusOf(order.id)).toBe('PENDING');
    });

    it('trả bằng app trên điện thoại: trang chờ hỏi GET /payments/:id, backend tự tra cứu MoMo và cập nhật', async () => {
      const { order, payment } = await openSession('MOMO');
      const waiting = (await request(app.getHttpServer()).get(`/payments/${payment.id}`).set(auth()).expect(200)).body;
      expect(waiting.payment.status).toBe('PROCESSING');
      expect(waiting.paymentUrl).toContain('test-payment.momo.vn');
      await request(app.getHttpServer()).get(`/payments/${payment.id}`).set(auth(staffToken)).expect(404);

      gateways.resolve(payment, 'SUCCESS');
      // Backend chỉ hỏi cổng mỗi 4 giây một lần cho mỗi giao dịch
      await new Promise((r) => setTimeout(r, 4100));
      const done = (await request(app.getHttpServer()).get(`/payments/${payment.id}`).set(auth()).expect(200)).body;
      expect(done.payment).toMatchObject({ status: 'SUCCESS', payType: 'napas' });
      expect(done.paymentUrl).toBeNull();
      expect(await statusOf(order.id)).toBe('PAID');
    });

    it('IPN VNPay: sai chữ ký 97, không có giao dịch 01, sai số tiền 04, đúng 00, gửi lại 02', async () => {
      const { order, payment } = await openSession('VNPAY');
      expect((await vnpayIpn({ ...vnpayCallback(payment, 'SUCCESS'), vnp_SecureHash: '0'.repeat(128) })).body.RspCode).toBe('97');
      expect((await vnpayIpn(vnpayCallback({ ...payment, gatewayOrderId: 'BLKHONGCO' }, 'SUCCESS'))).body.RspCode).toBe('01');
      expect((await vnpayIpn(vnpayCallback(payment, 'SUCCESS', undefined, 1000))).body.RspCode).toBe('04');
      expect(await statusOf(order.id)).toBe('PENDING');
      const ok = vnpayCallback(payment, 'SUCCESS');
      expect((await vnpayIpn(ok)).body).toEqual({ RspCode: '00', Message: 'Confirm Success' });
      expect((await vnpayIpn(ok)).body.RspCode).toBe('02');
      expect(await statusOf(order.id)).toBe('PAID');
    });

    it('IPN MoMo: sai chữ ký 400, đúng chữ ký 204 và đơn sang PAID', async () => {
      const { order, payment } = await openSession('MOMO');
      const ipn = (body: object) => request(app.getHttpServer()).post('/payments/momo/ipn').send(body);
      await ipn({ ...momoCallback(payment, 'SUCCESS'), amount: '1000' }).expect(400);
      expect(await statusOf(order.id)).toBe('PENDING');
      await ipn(momoCallback(payment, 'SUCCESS')).expect(204);
      expect(await statusOf(order.id)).toBe('PAID');
    });

    it('khách bấm hủy trên cổng → PAYMENT_FAILED, thanh toán lại bằng cổng khác → PAID', async () => {
      const { order, payment } = await openSession('VNPAY');
      gateways.resolve(payment, 'FAILED');
      await returnFromGateway(payment.id, vnpayCallback(payment, 'FAILED')).expect(200);
      expect(await statusOf(order.id)).toBe('PAYMENT_FAILED');
      expect((await prisma.payment.findUniqueOrThrow({ where: { id: payment.id } })).status).toBe('FAILED');

      const retry = (await pay(order.id, `pay-${uniq()}`, 'MOMO').expect(201)).body;
      expect(retry.payment.id).not.toBe(payment.id);
      expect(retry.order.status).toBe('PENDING');
      gateways.resolve(retry.payment, 'SUCCESS');
      await returnFromGateway(retry.payment.id, momoCallback(retry.payment, 'SUCCESS')).expect(200);
      expect(await statusOf(order.id)).toBe('PAID');
    });

    it('cổng báo đã trừ tiền sau khi phiên hết hạn: đơn còn chờ thì PAID, đơn đã hủy vẫn ghi nhận giao dịch', async () => {
      const waiting = await openSession('VNPAY');
      await prisma.$executeRaw`UPDATE "Payment" SET "createdAt" = now() - interval '6 minutes' WHERE id = ${waiting.payment.id}`;
      expect((await vnpayIpn(vnpayCallback(waiting.payment, 'SUCCESS'))).body.RspCode).toBe('00');
      expect(await statusOf(waiting.order.id)).toBe('PAID');

      const cancelled = await openSession('VNPAY');
      await prisma.$executeRaw`UPDATE "Payment" SET "createdAt" = now() - interval '6 minutes' WHERE id = ${cancelled.payment.id}`;
      await request(app.getHttpServer()).post(`/orders/${cancelled.order.id}/cancel`).set(auth()).expect(200);
      expect((await vnpayIpn(vnpayCallback(cancelled.payment, 'SUCCESS'))).body.RspCode).toBe('00');
      expect(await statusOf(cancelled.order.id)).toBe('CANCELLED');
      expect((await prisma.payment.findUniqueOrThrow({ where: { id: cancelled.payment.id } })).status).toBe('SUCCESS');
    });
  });

  describe('Tồn kho theo nguyên liệu và công thức', () => {
    it('hai món dùng chung nguyên liệu: bán món này thì số ly món kia giảm theo', async () => {
      const shared = await createIngredient(100);
      const cup = await createIngredient(50, false);
      const a = await createRecipeProduct([[shared.id, 20], [cup.id, 1]]);
      const b = await createRecipeProduct([[shared.id, 10], [cup.id, 1]]);
      expect((await productStock(b.id)).stock).toBe(10);

      await request(app.getHttpServer())
        .post('/orders')
        .set(auth())
        .send({ items: [{ productId: a.id, size: 'S', qty: 2 }] })
        .expect(201);
      expect(await ingredientStock(shared.id)).toBe(60);
      expect((await productStock(a.id)).stock).toBe(3);
      expect((await productStock(b.id)).stock).toBe(6);
      const list = (await request(app.getHttpServer()).get('/products').expect(200)).body as { id: number; stock: number }[];
      expect(list.find((p) => p.id === b.id)?.stock).toBe(6);
    });

    it('size lớn tốn nhiều nguyên liệu hơn, ly nhựa thì mỗi ly vẫn 1 cái', async () => {
      const coffee = await createIngredient(300);
      const cup = await createIngredient(50, false);
      const product = await createRecipeProduct([[coffee.id, 20], [cup.id, 1]]);
      // S cần 20, M cần 25, L cần 30
      const sizes = (await productStock(product.id)).sizes as { size: string; stock: number }[];
      expect(sizes.map((s) => s.stock)).toEqual([15, 12, 10]);

      await request(app.getHttpServer())
        .post('/orders')
        .set(auth())
        .send({ items: [{ productId: product.id, size: 'L', qty: 2 }] })
        .expect(201);
      expect(await ingredientStock(coffee.id)).toBe(240);
      expect(await ingredientStock(cup.id)).toBe(48);
    });

    it('topping trừ nguyên liệu riêng; không đủ nguyên liệu topping thì báo 409', async () => {
      const product = await createProduct(10);
      const pearl = await createIngredient(60);
      const topping = await prisma.topping.create({
        data: { name: `Topping test ${uniq()}`, price: 5000, recipe: { create: [{ ingredientId: pearl.id, amount: 50 }] } },
      });
      const detail = await productStock(product.id);
      expect(detail.toppings.find((t: { id: number }) => t.id === topping.id).stock).toBe(1);

      const order = (qty: number) =>
        request(app.getHttpServer())
          .post('/orders')
          .set(auth())
          .send({ items: [{ productId: product.id, size: 'M', toppingIds: [topping.id], qty }] });
      const rejected = await order(2).expect(409);
      expect(rejected.body.message).toContain('chỉ còn 1 ly');
      expect(await stockOf(product)).toBe(10);
      await order(1).expect(201);
      expect(await ingredientStock(pearl.id)).toBe(10);
      expect(await stockOf(product)).toBe(9);
    });

    it('hủy đơn trả lại đúng lượng nguyên liệu đã trừ, kể cả theo size và topping', async () => {
      const milk = await createIngredient(1000);
      const cup = await createIngredient(10, false);
      const product = await createRecipeProduct([[milk.id, 100], [cup.id, 1]]);
      const extra = await createIngredient(500);
      const topping = await prisma.topping.create({
        data: { name: `Topping test ${uniq()}`, price: 7000, recipe: { create: [{ ingredientId: extra.id, amount: 30 }] } },
      });
      const order = (
        await request(app.getHttpServer())
          .post('/orders')
          .set(auth())
          .send({ items: [{ productId: product.id, size: 'L', toppingIds: [topping.id], qty: 2 }] })
          .expect(201)
      ).body;
      expect([await ingredientStock(milk.id), await ingredientStock(cup.id), await ingredientStock(extra.id)]).toEqual([700, 8, 440]);

      await request(app.getHttpServer()).post(`/orders/${order.id}/cancel`).set(auth()).expect(200);
      expect([await ingredientStock(milk.id), await ingredientStock(cup.id), await ingredientStock(extra.id)]).toEqual([1000, 10, 500]);
    });

    it('hai món trong đơn cộng lại vượt nguyên liệu dùng chung: báo 409 và không trừ gì', async () => {
      const shared = await createIngredient(50);
      const a = await createRecipeProduct([[shared.id, 20]]);
      const b = await createRecipeProduct([[shared.id, 20]]);
      const res = await request(app.getHttpServer())
        .post('/orders')
        .set(auth())
        .send({ items: [{ productId: a.id, size: 'S', qty: 2 }, { productId: b.id, size: 'S', qty: 1 }] })
        .expect(409);
      expect(res.body.message).toContain('Không đủ');
      expect(await ingredientStock(shared.id)).toBe(50);
    });

    it('chỉ nhân viên xem được trang Kho: tồn nguyên liệu và nguyên liệu hết trước của từng món', async () => {
      const shared = await createIngredient(100);
      const cup = await createIngredient(3, false);
      const product = await createRecipeProduct([[shared.id, 20], [cup.id, 1]]);
      await request(app.getHttpServer()).get('/ingredients').set(auth()).expect(403);

      const res = await request(app.getHttpServer()).get('/ingredients').set(auth(staffToken)).expect(200);
      const ingredient = res.body.ingredients.find((i: { id: number }) => i.id === shared.id);
      expect(ingredient).toMatchObject({ stock: 100, unit: 'g', servings: 5, usedBy: [product.name] });
      expect(ingredient).not.toHaveProperty('version');
      expect(res.body.products.find((p: { id: number }) => p.id === product.id)).toMatchObject({
        stock: 3,
        limitedBy: cup.name,
      });
    });

    it('nhân viên nhập thêm hàng: tồn nguyên liệu và số ly của món tăng theo', async () => {
      const milk = await createIngredient(30);
      const product = await createRecipeProduct([[milk.id, 20]]);
      expect((await productStock(product.id)).stock).toBe(1);
      const restock = (amount: unknown, t?: string, id = milk.id) =>
        request(app.getHttpServer()).post(`/ingredients/${id}/restock`).set(auth(t)).send({ amount });

      await restock(70).expect(403);
      await restock(0, staffToken).expect(400);
      await restock(1.5, staffToken).expect(400);
      await restock(10, staffToken, 999999).expect(404);
      expect(await ingredientStock(milk.id)).toBe(30);

      const res = await restock(70, staffToken).expect(200);
      expect(res.body).toMatchObject({ id: milk.id, stock: 100, unit: 'g' });
      expect((await productStock(product.id)).stock).toBe(5);
      await request(app.getHttpServer())
        .post('/orders')
        .set(auth())
        .send({ items: [{ productId: product.id, size: 'S', qty: 5 }] })
        .expect(201);
      expect(await ingredientStock(milk.id)).toBe(0);
    });
  });
});
