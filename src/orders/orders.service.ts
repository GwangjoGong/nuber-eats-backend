import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DishRepository } from 'src/restaurants/repositories/dish.repository';
import { RestaurantRepository } from 'src/restaurants/repositories/restaurant.repository';
import { User, UserRole } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { CreateOrderInput, CreateOrderOutput } from './dtos/create-order.dto';
import { EditOrderInput, EditOrderOutput } from './dtos/edit-order.dto';
import { GetOrderInput, GetOrderOutput } from './dtos/get-order.dto';
import { GetOrdersInput, GetOrdersOutput } from './dtos/get-orders.dto';
import { OrderItem } from './entities/order-item.entity';
import { Order, OrderStatus } from './entities/order.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order) private readonly orders: Repository<Order>,
    private readonly restaurants: RestaurantRepository,
    private readonly dishes: DishRepository,
    @InjectRepository(OrderItem)
    private readonly orderItems: Repository<OrderItem>,
  ) {}

  async createOrder(
    user: User,
    createOrderInput: CreateOrderInput,
  ): Promise<CreateOrderOutput> {
    try {
      const restaurant = await this.restaurants.findOne({
        id: createOrderInput.restaurantId,
      });
      if (!restaurant) {
        return {
          ok: false,
          error: 'Restaurant not found',
        };
      }

      const items: OrderItem[] = [];
      let total = 0;

      for (const item of createOrderInput.items) {
        const dish = await this.dishes.findOne({ id: item.dishId });
        if (!dish) {
          return {
            ok: false,
            error: 'Dish not found',
          };
        }
        total += dish.price;

        if (item.options) {
          for (const option of item.options) {
            const dishOption = dish.options.find(op => op.name === option.name);
            if (!dishOption) {
              return {
                ok: false,
                error: 'DishOption not found',
              };
            }

            if (option.choice) {
              const dishChoice = dishOption.choices.find(
                ch => ch.item === option.choice,
              );
              if (!dishChoice) {
                return {
                  ok: false,
                  error: 'DishChoice not found',
                };
              }

              if (dishChoice.cost) {
                total += dishChoice.cost;
              }
            }

            if (dishOption.cost) {
              total += dishOption.cost;
            }
          }
        }

        const orderItem = await this.orderItems.save(
          this.orderItems.create({ dish, options: item.options }),
        );
        items.push(orderItem);
      }

      await this.orders.save(
        this.orders.create({
          customer: user,
          restaurant,
          items,
          total,
        }),
      );

      return {
        ok: true,
      };
    } catch {
      return {
        ok: false,
        error: 'Cannot create order',
      };
    }
  }

  async getOrders(
    user: User,
    { status }: GetOrdersInput,
  ): Promise<GetOrdersOutput> {
    try {
      let orders: Order[];

      switch (user.role) {
        case UserRole.Client:
          orders = await this.orders.find({
            where: {
              customer: user,
              ...(status && { status }),
            },
          });
          break;
        case UserRole.Owner:
          const restaurants = await this.restaurants.find({
            where: {
              owner: user,
            },
            relations: ['orders'],
          });
          orders = restaurants.map(restaurant => restaurant.orders).flat(1);
          if (status) {
            orders = orders.filter(order => order.status === status);
          }
          break;
        case UserRole.Delivery:
          orders = await this.orders.find({
            where: {
              driver: user,
              ...(status && { status }),
            },
          });
          break;
      }

      return {
        ok: true,
        orders,
      };
    } catch {
      return {
        ok: false,
        error: 'Cannot get orders',
      };
    }
  }

  isAuthorized(user: User, order: Order) {
    let authorized = true;

    if (user.role === UserRole.Client && order.customerId !== user.id) {
      authorized = false;
    }

    if (user.role === UserRole.Owner && order.restaurant.ownerId !== user.id) {
      authorized = false;
    }

    if (user.role === UserRole.Delivery && order.driverId !== user.id) {
      authorized = false;
    }

    return authorized;
  }

  async getOrder(
    user: User,
    { id: orderId }: GetOrderInput,
  ): Promise<GetOrderOutput> {
    try {
      const order = await this.orders.findOne(
        { id: orderId },
        { relations: ['restaurant'] },
      );
      if (!order) {
        return {
          ok: false,
          error: 'Order not found',
        };
      }

      if (!this.isAuthorized(user, order)) {
        return {
          ok: false,
          error: 'Not authorized',
        };
      }

      return {
        ok: true,
        order,
      };
    } catch {
      return {
        ok: false,
        error: 'Cannot get order',
      };
    }
  }

  isValidStatus(user: User, status: OrderStatus) {
    if (user.role === UserRole.Owner) {
      if (status !== OrderStatus.Cooked && status !== OrderStatus.Cooking) {
        return false;
      }
    }

    if (user.role === UserRole.Delivery) {
      if (status !== OrderStatus.PickedUp && status !== OrderStatus.Delivered) {
        return false;
      }
    }

    return true;
  }

  async editOrder(
    user: User,
    { id, status }: EditOrderInput,
  ): Promise<EditOrderOutput> {
    try {
      const { ok, error } = await this.getOrder(user, { id });
      if (!ok) {
        return {
          ok,
          error,
        };
      }

      if (!this.isValidStatus(user, status)) {
        return {
          ok: false,
          error: 'Invalid status',
        };
      }

      await this.orders.save([
        {
          id,
          status,
        },
      ]);

      return {
        ok: true,
      };
    } catch {
      return {
        ok: false,
        error: 'Cannot edit order',
      };
    }
  }
}
