import { Body, Controller, Get, HttpCode, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, Roles, RolesGuard } from '../auth/guards';
import { RestockDto } from './ingredients.dto';
import { IngredientsService } from './ingredients.service';

@Controller('ingredients')
export class IngredientsController {
  constructor(private readonly ingredients: IngredientsService) {}

  /** Tồn kho nguyên liệu và số ly còn bán được, chỉ nhân viên xem. */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('STAFF')
  overview() {
    return this.ingredients.overview();
  }

  /** Nhân viên nhập thêm hàng vào kho. */
  @Post(':id/restock')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('STAFF')
  restock(@Param('id', ParseIntPipe) id: number, @Body() dto: RestockDto) {
    return this.ingredients.restock(id, dto.amount);
  }
}
