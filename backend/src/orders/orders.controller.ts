import { Body, Controller, Get, Headers, HttpCode, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuthUser } from '../auth/auth.types';
import { CurrentUser, JwtAuthGuard, Roles, RolesGuard } from '../auth/guards';
import { parseIdempotencyKey } from '../common/idempotency';
import { CreateOrderDto, ListCounterOrdersQueryDto, UpdateOrderStatusDto } from './orders.dto';
import { OrdersService } from './orders.service';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateOrderDto,
    @Headers('idempotency-key') key?: string,
  ) {
    return this.orders.create(user.id, dto, parseIdempotencyKey(key, false));
  }

  /** Màn hình quầy của nhân viên: đơn theo nhóm trạng thái, kèm số đơn mỗi nhóm. */
  @Get()
  @UseGuards(RolesGuard)
  @Roles('STAFF')
  listForCounter(@Query() query: ListCounterOrdersQueryDto) {
    return this.orders.listForCounter(query.status);
  }

  @Get('me')
  listMine(@CurrentUser() user: AuthUser) {
    return this.orders.listMine(user.id);
  }

  @Get(':id')
  findMine(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.orders.findMine(user.id, id);
  }

  @Post(':id/cancel')
  @HttpCode(200)
  cancel(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.orders.cancel(user.id, id);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles('STAFF')
  changeStatus(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateOrderStatusDto) {
    return this.orders.changeStatus(id, dto.status);
  }
}
