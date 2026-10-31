import { Module } from '@nestjs/common';
import { GatewayHttp } from './gateways/gateway';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, GatewayHttp],
})
export class PaymentsModule {}
