<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

# Orders Microservice

Microservice de ordenes construido con NestJS, Prisma y PostgreSQL. Expone
operaciones via TCP usando `@MessagePattern` para crear, listar, obtener y
actualizar el estado de ordenes.

## Stack

- NestJS (microservices + validation)
- Prisma ORM (adapter pg)
- PostgreSQL 16 (docker-compose)

## Configuracion

1) Instalar dependencias:

```bash
npm install
```

2) Levantar Postgres con Docker:

```bash
docker-compose up -d
```

3) Crear `.env` con las variables:

```bash
PORT=3000
DATABASE_URL=postgresql://postgres:123456@localhost:5432/ordersdb
```

4) Aplicar esquema y generar cliente de Prisma:

```bash
npx prisma migrate dev
npx prisma generate
```

5) Iniciar el microservicio:

```bash
npm run start:dev
```

## Transporte y mensajes

El microservicio usa transporte TCP y escucha en `PORT` (ver `src/main.ts`).
El payload se valida con `class-validator` y `ValidationPipe` en modo
`whitelist` + `forbidNonWhitelisted`.

### MessagePattern disponibles

`createOrder`

```json
{
  "totalAmount": 150,
  "totalItems": 3,
  "status": "PENDING",
  "paid": false
}
```

`findAllOrders`

```json
{
  "page": 1,
  "limit": 10,
  "status": "CANCELLED"
}
```

Respuesta:

```json
{
  "data": [/* orders */],
  "meta": {
    "totalItems": 8,
    "page": 1,
    "lastPage": 1
  }
}
```

`findOneOrder`

```json
{
  "id": "c9e43f2b-ee88-48ad-97cd-df8bbf7dccbf"
}
```

`changeOrderStatus`

```json
{
  "id": "c9e43f2b-ee88-48ad-97cd-df8bbf7dccbf",
  "status": "DELIVERED"
}
```

## Dominio de datos

`Order` en Prisma (`prisma/schema.prisma`):

- `id` UUID
- `totalAmount` float
- `totalItems` int
- `status` enum `OrderStatus` (`PENDING`, `DELIVERED`, `CANCELLED`)
- `paid` boolean (default false)
- `paidAt` datetime nullable
- `createdAt`/`updatedAt` timestamps

## Estructura del proyecto

```
src/
  app.module.ts
  main.ts
  common/
    prisma.service.ts
    dto/pagination.dto.ts
    exception/rpc-custom-exceptions.filter.ts
  orders/
    orders.controller.ts
    orders.service.ts
    dto/
    enum/
prisma/
  schema.prisma
  migrations/
```

## Scripts utiles

```bash
npm run start
npm run start:dev
npm run build
npm run test
npm run test:e2e
```

## Notas

- `RpcCustomExceptionFilter` existe pero no esta registrado globalmente.
- El cliente de Prisma se genera en `generated/prisma`.
