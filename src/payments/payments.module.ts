import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RestaurantRepository } from 'src/restaurants/repositories/restaurant.repository';
import { Payment } from './entities/payment.entity';
import { PaymentsResolver } from './payments.resolver';
import { PaymentsService } from './payments.service';

@Module({
  imports: [TypeOrmModule.forFeature([Payment, RestaurantRepository])],
  providers: [PaymentsService, PaymentsResolver],
})
export class PaymentsModule {}
