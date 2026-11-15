import { Controller, Get, Param } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ParseIdPipe } from '../common/parse-id.pipe';

@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  findAll() {
    return this.products.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIdPipe) id: number) {
    return this.products.findOne(id);
  }
}
