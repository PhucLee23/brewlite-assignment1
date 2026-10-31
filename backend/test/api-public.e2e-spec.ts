import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { PrismaService } from '../src/prisma/prisma.service';

/** Mục 4.2 của đề: thời gian phản hồi API < 500ms với dữ liệu mẫu. */
const MAX_RESPONSE_MS = 500;

describe('BrewLite – API sản phẩm, đăng ký/đăng nhập và thời gian phản hồi (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let productId: number;
  let seq = 0;

  const uniq = () => `${Date.now()}-${++seq}`;
  const api = () => request(app.getHttpServer());

  function register(email: string, password = 'matkhau123', fullName = 'Khách Test') {
    return api().post('/auth/register').send({ email, password, fullName });
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);

    // CSDL test không có dữ liệu mẫu nên tự tạo một món
    // Món có 1 nguyên liệu riêng, mỗi ly 1 phần: còn 20 ly
    const ingredient = await prisma.ingredient.create({
      data: { name: `Nguyên liệu test ${uniq()}`, unit: 'cái', stock: 20, scalesWithSize: false },
    });
    const product = await prisma.product.create({
      data: {
        name: `Món test ${uniq()}`,
        price: 45000,
        imageUrl: '/images/latte.jpg',
        recipe: { create: [{ ingredientId: ingredient.id, amount: 1 }] },
      },
    });
    productId = product.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Task 2 – API sản phẩm', () => {
    it('GET /products trả danh sách có id, tên, giá, ảnh, tồn kho', async () => {
      const res = await api().get('/products').expect(200);
      expect(Array.isArray(res.body)).toBe(true);

      const item = res.body.find((p: { id: number }) => p.id === productId);
      expect(item).toMatchObject({ id: productId, price: 45000, imageUrl: '/images/latte.jpg', stock: 20 });
      expect(typeof item.name).toBe('string');
    });

    it('không trả công thức và cột nội bộ ra ngoài', async () => {
      const res = await api().get('/products').expect(200);
      for (const p of res.body) {
        expect(p).not.toHaveProperty('version');
        expect(p).not.toHaveProperty('recipe');
      }
    });

    it('GET /products/:id trả chi tiết kèm 3 size (số ly còn theo size) và danh sách topping', async () => {
      const res = await api().get(`/products/${productId}`).expect(200);
      expect(res.body.id).toBe(productId);
      expect(res.body.sizes).toEqual([
        { size: 'S', surcharge: 0, stock: 20 },
        { size: 'M', surcharge: 5000, stock: 20 },
        { size: 'L', surcharge: 10000, stock: 20 },
      ]);
      expect(Array.isArray(res.body.toppings)).toBe(true);
    });

    it('món không tồn tại trả 404, id không phải số trả 400', async () => {
      await api().get('/products/999999').expect(404);
      await api().get('/products/abc').expect(400);
    });
  });

  describe('Task 7 – Đăng ký / Đăng nhập', () => {
    it('đăng ký trả JWT và thông tin người dùng, không trả mật khẩu', async () => {
      const email = `dangky-${uniq()}@test.vn`;
      const res = await register(email).expect(201);
      expect(typeof res.body.accessToken).toBe('string');
      expect(res.body.user).toMatchObject({ email, role: 'CUSTOMER', loyaltyPoints: 0 });
      expect(res.body.user).not.toHaveProperty('passwordHash');
    });

    it('đăng ký trùng email trả 409, kể cả khi viết hoa khác', async () => {
      const email = `trung-${uniq()}@test.vn`;
      await register(email).expect(201);
      await register(email).expect(409);
      await register(email.toUpperCase()).expect(409);
    });

    it('dữ liệu đăng ký sai trả 400', async () => {
      await register('khong-phai-email').expect(400);
      await register(`ngan-${uniq()}@test.vn`, '123').expect(400);
      await register(`ten-${uniq()}@test.vn`, 'matkhau123', 'A').expect(400);
    });

    it('đăng nhập đúng trả JWT, dùng được cho GET /auth/me', async () => {
      const email = `dangnhap-${uniq()}@test.vn`;
      await register(email).expect(201);

      const login = await api().post('/auth/login').send({ email, password: 'matkhau123' }).expect(200);
      const me = await api().get('/auth/me').set('Authorization', `Bearer ${login.body.accessToken}`).expect(200);
      expect(me.body.email).toBe(email);
    });

    it('sai mật khẩu và email chưa đăng ký đều trả 401 cùng một thông báo', async () => {
      const email = `sai-${uniq()}@test.vn`;
      await register(email).expect(201);

      const wrongPassword = await api().post('/auth/login').send({ email, password: 'saimatkhau' }).expect(401);
      const unknownEmail = await api()
        .post('/auth/login')
        .send({ email: `chuaco-${uniq()}@test.vn`, password: 'matkhau123' })
        .expect(401);
      // Không để lộ email nào đã đăng ký
      expect(wrongPassword.body.message).toBe(unknownEmail.body.message);
    });

    it('GET /auth/me không có token hoặc token sai trả 401', async () => {
      await api().get('/auth/me').expect(401);
      await api().get('/auth/me').set('Authorization', 'Bearer token-gia').expect(401);
    });
  });

  describe('Yêu cầu phi chức năng – thời gian phản hồi < 500ms', () => {
    async function timeMs(send: () => request.Test) {
      const start = Date.now();
      await send();
      return Date.now() - start;
    }

    it('các API chính trả về dưới 500ms', async () => {
      const email = `nhanh-${uniq()}@test.vn`;
      const token = (await register(email).expect(201)).body.accessToken;
      const checks: Record<string, () => request.Test> = {
        'GET /products': () => api().get('/products').expect(200),
        'GET /products/:id': () => api().get(`/products/${productId}`).expect(200),
        'POST /auth/login': () => api().post('/auth/login').send({ email, password: 'matkhau123' }).expect(200),
        'POST /orders': () =>
          api()
            .post('/orders')
            .set('Authorization', `Bearer ${token}`)
            .send({ items: [{ productId, size: 'M', qty: 1 }] })
            .expect(201),
        'GET /orders/me': () => api().get('/orders/me').set('Authorization', `Bearer ${token}`).expect(200),
      };

      for (const [name, send] of Object.entries(checks)) {
        const ms = await timeMs(send);
        expect({ name, ms, ok: ms < MAX_RESPONSE_MS }).toEqual({ name, ms, ok: true });
      }
    });
  });
});
