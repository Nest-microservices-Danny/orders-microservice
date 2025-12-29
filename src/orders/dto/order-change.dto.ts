import { IsEnum, IsUUID } from 'class-validator';

import { OrderStatusList } from '../enum/order.enum';
import { OrderStatus } from 'generated/prisma/enums';

export class ChangeOrderDto {
  @IsUUID(4)
  id: string;

  @IsEnum(OrderStatusList, {
    message: `Status must be one of the following values: ${Object.values(
      OrderStatusList,
    ).join(', ')}`,
  })
  status: OrderStatus;
}
