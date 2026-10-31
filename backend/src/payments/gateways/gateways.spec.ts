import { GatewayHttp } from './gateway';
import { VnpayGateway, vnpaySign, vnpaySignedQuery, vnpayTime } from './vnpay';

describe('cổng VNPay', () => {
  beforeAll(() => {
    process.env.VNPAY_TMN_CODE = 'TESTTMN1';
    process.env.VNPAY_HASH_SECRET = 'test-secret';
  });

  it('giờ gửi VNPay là giờ Việt Nam dạng yyyyMMddHHmmss', () => {
    expect(vnpayTime(new Date('2026-10-27T08:42:09.500Z'))).toBe('20261027154209');
  });

  it('ký các tham số vnp_ đã xếp theo tên và mã hóa URL (dấu cách thành +)', () => {
    const query = vnpaySignedQuery({ vnp_TxnRef: 'BL1', vnp_Amount: '4500000', vnp_OrderInfo: 'Thanh toan don 1', other: 'x', vnp_SecureHash: 'h' });
    expect(query).toBe('vnp_Amount=4500000&vnp_OrderInfo=Thanh+toan+don+1&vnp_TxnRef=BL1');
  });

  it('link thanh toán có chữ ký khớp; kết quả gửi về bị sửa thì bị từ chối', async () => {
    const vnpay = new VnpayGateway(new GatewayHttp());
    const url = new URL(
      await vnpay.createSession({
        gatewayOrderId: 'BL1',
        amount: 45000,
        orderInfo: 'Thanh toan don 1 BrewLite',
        returnUrl: 'http://localhost:3000/payments/1',
        createdAt: new Date('2026-10-27T08:40:00Z'),
        expiresAt: new Date('2026-10-27T08:45:00Z'),
        clientIp: '127.0.0.1',
      }),
    );
    const params = Object.fromEntries(url.searchParams);
    expect(params).toMatchObject({ vnp_Amount: '4500000', vnp_CreateDate: '20261027154000', vnp_ExpireDate: '20261027154500' });
    expect(vnpaySign(params)).toBe(params.vnp_SecureHash);

    const back = { vnp_Amount: '4500000', vnp_ResponseCode: '00', vnp_TransactionStatus: '00', vnp_TxnRef: 'BL1', vnp_TransactionNo: '15716289' };
    const signed = { ...back, vnp_SecureHash: vnpaySign(back) };
    expect(vnpay.parseCallback(signed)).toMatchObject({ status: 'SUCCESS', amount: 45000, transactionNo: '15716289' });
    expect(vnpay.parseCallback({ ...signed, vnp_Amount: '100' })).toBeNull();
  });
});
