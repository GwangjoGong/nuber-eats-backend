import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RestaurantRepository } from 'src/restaurants/repositories/restaurant.repository';
import { User } from 'src/users/entities/user.entity';
import { LessThan, Repository } from 'typeorm';
import {
  CreatePaymentInput,
  CreatePaymentOutput,
} from './dtos/create-payment.dto';
import { GetPaymentsOutput } from './dtos/get-payments.dto';
import { Payment } from './entities/payment.entity';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment) private readonly payments: Repository<Payment>,
    private readonly restaurants: RestaurantRepository,
  ) {}

  async createPayment(
    user: User,
    { transactionId, restaurantId }: CreatePaymentInput,
  ): Promise<CreatePaymentOutput> {
    try {
      const { ok, error, restaurant } = await this.restaurants.findAndValidate(
        restaurantId,
        user,
      );
      if (!ok) {
        return {
          ok,
          error,
        };
      }

      restaurant.isPromoted = true;
      const date = new Date();
      date.setDate(date.getDate() + 7);
      restaurant.promotedUntil = date;

      await this.restaurants.save(restaurant);

      await this.payments.save(
        this.payments.create({
          transactionId,
          user,
          restaurant,
        }),
      );

      return {
        ok: true,
      };
    } catch {
      return {
        ok: false,
        error: 'Cannot create payment',
      };
    }
  }

  async getPayments(user: User): Promise<GetPaymentsOutput> {
    try {
      const payments = await this.payments.find({
        user,
      });
      return {
        ok: true,
        payments,
      };
    } catch {
      return {
        ok: false,
        error: 'Cannot get payments',
      };
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkPromotedRestaurant() {
    const now = new Date();
    const promotionExpired = await this.restaurants.find({
      isPromoted: true,
      promotedUntil: LessThan(now),
    });
    for (const restaurant of promotionExpired) {
      restaurant.isPromoted = false;
      restaurant.promotedUntil = null;
      await this.restaurants.save(restaurant);
    }
  }
}
