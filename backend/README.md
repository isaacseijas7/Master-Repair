# Máster Repair API

API REST del Sistema ERP de Gestión de Inventario desarrollada con Fastify, TypeScript y MongoDB.

## 🚀 Tecnologías

- **Runtime**: Node.js 20+
- **Framework**: Fastify 4.x
- **Lenguaje**: TypeScript 5.x
- **Base de Datos**: MongoDB con Mongoose
- **Autenticación**: JWT (JSON Web Tokens)
- **Validación**: Zod

## 📋 Requisitos

- Node.js 20 o superior
- MongoDB 6.0 o superior
- npm o yarn

## 🛠️ Instalación

1. Instalar dependencias:
```bash
npm install
```

2. Configurar variables de entorno:
```bash
cp .env.example .env
# Editar .env con tus configuraciones
```

3. Iniciar servidor de desarrollo:
```bash
npm run dev
```

El servidor estará disponible en `http://localhost:3001`

## 📦 Scripts

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Inicia el servidor en modo desarrollo con hot reload |
| `npm run build` | Compila el proyecto a JavaScript |
| `npm start` | Inicia el servidor en modo producción |
| `npm run lint` | Ejecuta ESLint |
| `npm run typecheck` | Verifica tipos de TypeScript |

## 🔐 Variables de Entorno

| Variable | Descripción | Default |
|----------|-------------|---------|
| `PORT` | Puerto del servidor | 3001 |
| `NODE_ENV` | Entorno (development/production) | development |
| `MONGODB_URI` | URI de conexión a MongoDB | mongodb://localhost:27017/master-repair |
| `JWT_SECRET` | Clave secreta para JWT | - |
| `JWT_EXPIRES_IN` | Tiempo de expiración del token | 7d |
| `CORS_ORIGIN` | Origen permitido para CORS | http://localhost:5173 |

## 📚 Estructura de Carpetas

```
src/
├── config/         # Configuración (base de datos, etc.)
├── controllers/    # Controladores HTTP
├── middleware/     # Middleware (autenticación, errores)
├── models/         # Modelos de Mongoose
├── routes/         # Definición de rutas
├── services/       # Lógica de negocio
├── types/          # Tipos TypeScript
└── server.ts       # Punto de entrada
```

## 🔑 Credenciales por Defecto

Al iniciar por primera vez, se crea automáticamente:

- **Email**: admin@masterrepair.com
- **Contraseña**: Admin123!

## 📡 API Endpoints

### Autenticación
- `POST /api/v1/auth/login` - Iniciar sesión
- `POST /api/v1/auth/register` - Registrar usuario
- `GET /api/v1/auth/profile` - Obtener perfil

### Productos
- `GET /api/v1/products` - Listar productos (paginado)
- `GET /api/v1/products/:id` - Obtener producto
- `POST /api/v1/products` - Crear producto
- `PUT /api/v1/products/:id` - Actualizar producto
- `DELETE /api/v1/products/:id` - Eliminar producto
- `GET /api/v1/products/low-stock` - Productos con stock bajo

### Categorías
- `GET /api/v1/categories` - Listar categorías
- `GET /api/v1/categories/active` - Categorías activas
- `POST /api/v1/categories` - Crear categoría
- `PUT /api/v1/categories/:id` - Actualizar categoría
- `DELETE /api/v1/categories/:id` - Eliminar categoría

### Proveedores
- `GET /api/v1/suppliers` - Listar proveedores
- `GET /api/v1/suppliers/active` - Proveedores activos
- `POST /api/v1/suppliers` - Crear proveedor
- `PUT /api/v1/suppliers/:id` - Actualizar proveedor
- `DELETE /api/v1/suppliers/:id` - Eliminar proveedor

### Órdenes
- `GET /api/v1/orders` - Listar órdenes
- `GET /api/v1/orders/:id` - Obtener orden
- `POST /api/v1/orders` - Crear orden
- `PATCH /api/v1/orders/:id/status` - Actualizar estado

### Dashboard
- `GET /api/v1/dashboard` - Datos completos del dashboard
- `GET /api/v1/dashboard/metrics` - Métricas principales
- `GET /api/v1/dashboard/stock-alerts` - Alertas de stock
- `GET /api/v1/dashboard/top-products` - Productos más vendidos

## 📝 Licencia

MIT
