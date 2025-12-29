/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma.service';
import { RpcException } from '@nestjs/microservices';
import { OrderPaginationDto } from './dto/order-pagination.dto';
import { ChangeOrderDto, CreateOrderDto } from './dto';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}
  async create(createOrderDto: CreateOrderDto) {
    return await this.prisma.order.create({
      data: createOrderDto,
    });
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
    });
    if (!order) {
      throw new RpcException({
        statusCode: HttpStatus.NOT_FOUND,
        message: `Order with id ${id} not found`,
      });
    }
    return order;
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
        data: { ...order, status },
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
