<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

# Orders Microservice

Microservicio de gestión de órdenes construido con NestJS y NATS para comunicación con otros microservicios.

## Características

- Gestión de órdenes (crear, listar, actualizar estado)
- Comunicación con microservicio de productos vía NATS
- Validación de productos antes de crear órdenes
- Cálculo automático de totales
- Persistencia con Prisma + PostgreSQL

## Requisitos

- Node.js v22.18.0+
- PostgreSQL
- NATS Server (local o remoto)

## Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
# Puerto del microservicio (opcional, no se usa en modo microservicio puro)
PORT=3002

# Base de datos PostgreSQL
DATABASE_URL="postgresql://postgres:123456@localhost:5432/ordersdb?schema=public"

# Servidor(es) NATS - REQUERIDO
# Para un servidor: nats://localhost:4222
# Para varios: nats://host1:4222,nats://host2:4222
NATS_SERVERS="nats://127.0.0.1:4222"
```

## Instalación

```bash
# Instalar dependencias
npm install

# Configurar base de datos
npx prisma generate
npx prisma migrate dev
```

## Ejecutar NATS Server

### Opción 1: Docker (recomendado)
```bash
docker run -d --name nats-server -p 4222:4222 nats:latest
```

### Opción 2: Local
```bash
# Instalar NATS
brew install nats-server  # macOS

# Ejecutar
nats-server
```

## Ejecución

```bash
# Desarrollo
npm run start:dev

# Producción
npm run build
npm run start:prod
```

## Arquitectura

### Transporte
- **NATS**: Sistema de mensajería para comunicación entre microservicios
- **Token de inyección**: `NATS_SERVICES` para acceder al ClientProxy

### Endpoints (Patrones NATS)

```typescript
// Crear orden
{ cmd: 'create_order' }

// Listar órdenes
{ cmd: 'find_all_orders' }

// Obtener orden por ID
{ cmd: 'find_one_order' }

// Cambiar estado de orden
{ cmd: 'change_order_status' }
```

### Comunicación con Products MS

El servicio se comunica con el microservicio de productos mediante:

```typescript
// Validar productos
this.client.send({ cmd: 'validate_products' }, productIds)
```

## Estructura de Datos

### Order
```typescript
{
  id: string;
  totalAmount: number;
  totalItems: number;
  status: OrderStatus;
  paid: boolean;
  createdAt: Date;
  updatedAt: Date;
  OrderItem: OrderItem[];
}
```

### OrderItem
```typescript
{
  productId: number;
  quantity: number;
  price: number;
  name: string; // Agregado desde Products MS
}
```

## Solución de Problemas

### Error: "NATS_SERVERS" is required
- Asegúrate de tener la variable `NATS_SERVERS` en tu `.env`
- Verifica que el archivo `.env` esté en la raíz del proyecto

### Error de conexión NATS
- Verifica que NATS Server esté corriendo: `docker ps` o `ps aux | grep nats`
- Confirma que el puerto 4222 esté disponible
- Revisa la URL en `NATS_SERVERS` (debe incluir el protocolo `nats://`)

### Products MS no responde
- Asegúrate de que el microservicio de productos esté corriendo
- Verifica que ambos servicios usen la misma configuración de NATS_SERVERS
- Confirma que los patrones de mensaje coincidan entre servicios

## Scripts Disponibles

```bash
npm run start          # Ejecutar en modo producción
npm run start:dev      # Ejecutar en modo desarrollo
npm run build          # Compilar el proyecto
npm run lint           # Ejecutar linter
npm run test           # Ejecutar tests
```

## Notas Técnicas

- El token `NATS_SERVICES` es interno de cada aplicación NestJS
- `NATS_SERVERS` debe apuntar al mismo broker en todos los microservicios
- Los patrones de mensaje (cmd) deben estar sincronizados entre servicios
- Las transacciones de base de datos garantizan consistencia en creación de órdenes