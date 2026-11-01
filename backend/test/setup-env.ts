import { testDatabaseUrl } from './test-db';

process.env.DATABASE_URL = testDatabaseUrl();
process.env.JWT_SECRET ??= 'test-secret';
// Test dùng cổng MoMo, VNPay giả (test/fake-gateways.ts) và khóa VNPay riêng, không đọc khóa thật trong .env
process.env.VNPAY_TMN_CODE = 'TESTTMN1';
process.env.VNPAY_HASH_SECRET = 'test-vnpay-secret';
process.env.FRONTEND_URL = 'http://localhost:3000';
