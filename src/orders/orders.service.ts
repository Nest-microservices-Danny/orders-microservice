/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma.service';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { OrderPaginationDto } from './dto/order-pagination.dto';
import { ChangeOrderDto, CreateOrderDto } from './dto';
import { NATS_SERVICES } from 'src/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    @Inject(NATS_SERVICES) private readonly client: ClientProxy,
  ) {}
  async create(createOrderDto: CreateOrderDto) {
    try {
      // 1. confirmar los ids de los productos
      const productIds = createOrderDto.items.map((item) => item.productId);
      const products: any[] = await firstValueFrom(
        this.client.send(
          {
            cmd: 'validate_products',
          },
          productIds,
        ),
      );
      //2 .calculados de los valores
      const totalAmount = createOrderDto.items.reduce((acc, orderItem) => {
        const price = products.find(
          (product) => product.id === orderItem.productId,
        ).price;
        return acc + price * orderItem.quantity;
      }, 0);
      const totalItems = createOrderDto.items.reduce(
        (acumulador, orderItem) => {
          return acumulador + orderItem.quantity;
        },
        0,
      );

      // 3. transaccion de la base de datos
      const order = await this.prisma.order.create({
        data: {
          totalAmount: totalAmount,
          totalItems: totalItems,
          OrderItem: {
            createMany: {
              data: createOrderDto.items.map((orderItem) => ({
                quantity: orderItem.quantity,
                productId: orderItem.productId,
                price: products.find(
                  (product) => product.id === orderItem.productId,
                ).price,
              })),
            },
          },
        },
        include: {
          OrderItem: {
            select: {
              price: true,
              quantity: true,
              productId: true,
            },
          },
        },
      });
      return {
        ...order,
        OrderItem: order.OrderItem.map((item) => ({
          ...item,
          name: products.find((product) => product.id === item.productId).name,
        })),
      };
    } catch (error) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: `Check logs ${error}`,
      });
    }

    // return {
    //   service: 'Create order SERVICE',
    //   createOrderDTO: createOrderDto.items.map((data) => data.productId),
    // };
    // return await this.prisma.order.create({
    //   data: createOrderDto,
    // });
  }

  async findAll(orderPagination: OrderPaginationDto) {
    const { status, limit, page } = orderPagination;
    const totalPages = await this.prisma.order.count({
      where: {
        status,
      },
    });

    return {
      data: await this.prisma.order.findMany({
        skip: ((page ?? 1) - 1) * (limit ?? 10),
        take: limit ?? 10,
        where: {
          status,
        },
      }),
      meta: {
        totalItems: totalPages,
        page: page ?? 1,
        lastPage: Math.ceil(totalPages / (limit ?? 10)),
      },
    };
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        id,
      },
      include: {
        OrderItem: {
          select: {
            price: true,
            quantity: true,
            productId: true,
          },
        },
      },
    });
    if (!order) {
      throw new RpcException({
        statusCode: HttpStatus.NOT_FOUND,
        message: `Order with id ${id} not found`,
      });
    }

    const productIds = order.OrderItem.map((item) => item.productId);
    const products: any[] = await firstValueFrom(
      this.client.send(
        {
          cmd: 'validate_products',
        },
        productIds,
      ),
    );
    return {
      ...order,
      OrderItem: order.OrderItem.map((item) => ({
        ...item,
        name: products.find((product) => product.id === item.productId).name,
      })),
    };
  }

  async changeOrderStatus(changeOrderDto: ChangeOrderDto) {
    const { id, status } = changeOrderDto;
    try {
      const order = await this.findOne(id);
      if (order.status === status) {
        return order;
      }
      return await this.prisma.order.update({
        where: { id },
        data: { status },
      });
    } catch (error) {
      throw new RpcException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: `Error updating order status: ${error.message}`,
      });
    }
  }

  remove(id: number) {
    return `This action removes a #${id} order`;
  }
}
