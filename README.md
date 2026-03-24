# Máster Repair - Sistema ERP de Gestión de Inventario

Sistema de Gestión de Inventario (ERP) especializado en retail tecnológico (accesorios y smartphones). Desarrollado con arquitectura limpia, escalable y principios de Clean Architecture.

## 🚀 Características

### Funcionalidades Principales

- **📦 Gestión de Inventario**: CRUD completo de productos, categorías y proveedores
- **💰 Lógica de Precios**: Soporte para precio unitario, precio por mayor y tiers de precios
- **⚠️ Control de Stock**: Alertas automáticas cuando el inventario es inferior al stock mínimo
- **📝 Módulo de Movimientos**: Gestión de Órdenes de Compra (entradas) y Ventas (salidas)
- **📊 Dashboard**: Panel visual con métricas clave, productos más vendidos, ingresos mensuales y alertas

### Tecnologías Utilizadas

#### Backend
- **Runtime**: Node.js 20+
- **Framework**: Fastify 4.x con TypeScript
- **Base de Datos**: MongoDB con Mongoose
- **Autenticación**: JWT (JSON Web Tokens)
- **Validación**: Zod para esquemas y DTOs
- **Documentación**: Swagger/OpenAPI

#### Frontend
- **Framework**: React 19+ con TypeScript
- **Build Tool**: Vite 7+
- **Estado Global**: Zustand
- **Routing**: React Router DOM v6
- **UI Components**: shadcn/ui + Tailwind CSS
- **Formularios**: React Hook Form + Zod
- **Gráficos**: Recharts

## 📁 Estructura del Proyecto

```
master-repair/
├── backend/                 # API REST con Fastify
│   ├── src/
│   │   ├── config/         # Configuración (DB, etc.)
│   │   ├── controllers/    # Controladores HTTP
│   │   ├── middleware/     # Middleware (auth, errores)
│   │   ├── models/         # Modelos Mongoose
│   │   ├── routes/         # Definición de rutas
│   │   ├── services/       # Lógica de negocio
│   │   ├── types/          # Tipos TypeScript
│   │   └── utils/          # Utilidades
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/               # Aplicación React
    ├── src/
    │   ├── components/     # Componentes React
    │   │   ├── forms/      # Formularios
    │   │   ├── layout/     # Layouts
    │   │   └── ui/         # Componentes UI (shadcn)
    │   ├── hooks/          # Custom hooks
    │   ├── lib/            # Utilidades
    │   ├── pages/          # Páginas
    │   ├── services/       # Servicios API
    │   ├── stores/         # Zustand stores
    │   └── types/          # Tipos TypeScript
    ├── package.json
    └── vite.config.ts
```

## 🛠️ Instalación y Configuración

### Prerrequisitos

- Node.js 20+
- MongoDB 6.0+
- npm o yarn

### Backend

1. Navegar al directorio del backend:
```bash
cd backend
```

2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno:
```bash
cp .env.example .env
# Editar .env con tus configuraciones
```

4. Iniciar el servidor de desarrollo:
```bash
npm run dev
```

El servidor estará disponible en `http://localhost:3001`

### Frontend

1. Navegar al directorio del frontend:
```bash
cd frontend
```

2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno:
```bash
cp .env.example .env
# Editar .env con la URL del backend
```

4. Iniciar el servidor de desarrollo:
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

## 🔐 Credenciales por Defecto

Al iniciar el backend por primera vez, se creará automáticamente un usuario administrador:

- **Email**: admin@masterrepair.com
- **Contraseña**: Admin123!

## 📚 API Endpoints

### Autenticación
- `POST /api/v1/auth/login` - Iniciar sesión
- `POST /api/v1/auth/register` - Registrar usuario
- `GET /api/v1/auth/profile` - Obtener perfil

### Productos
- `GET /api/v1/products` - Listar productos (con paginación y filtros)
- `GET /api/v1/products/:id` - Obtener producto
- `POST /api/v1/products` - Crear producto
- `PUT /api/v1/products/:id` - Actualizar producto
- `DELETE /api/v1/products/:id` - Eliminar producto
- `GET /api/v1/products/low-stock` - Productos con stock bajo

### Categorías
- `GET /api/v1/categories` - Listar categorías
- `POST /api/v1/categories` - Crear categoría
- `PUT /api/v1/categories/:id` - Actualizar categoría
- `DELETE /api/v1/categories/:id` - Eliminar categoría

### Proveedores
- `GET /api/v1/suppliers` - Listar proveedores
- `POST /api/v1/suppliers` - Crear proveedor
- `PUT /api/v1/suppliers/:id` - Actualizar proveedor
- `DELETE /api/v1/suppliers/:id` - Eliminar proveedor

### Órdenes
- `GET /api/v1/orders` - Listar órdenes
- `POST /api/v1/orders` - Crear orden
- `PATCH /api/v1/orders/:id/status` - Actualizar estado
- `GET /api/v1/orders/stats/today` - Ventas de hoy

### Dashboard
- `GET /api/v1/dashboard` - Datos completos del dashboard
- `GET /api/v1/dashboard/metrics` - Métricas principales
- `GET /api/v1/dashboard/stock-alerts` - Alertas de stock

## 🎯 Funcionalidades Destacadas

### Paginación Server-Side
Todas las listas implementan paginación desde el servidor con:
- Parámetros: `page`, `limit`, `sortBy`, `sortOrder`
- Búsqueda global con `search`
- Filtros específicos por campo

### Filtros con Debounce
Los filtros de búsqueda implementan debounce de 500ms para optimizar las peticiones al servidor.

### Control de Acceso Basado en Roles (RBAC)
- **Admin**: Acceso completo
- **Manager**: Gestión de productos, categorías, proveedores y órdenes
- **Cashier**: Solo creación de ventas y gestión de stock

### Alertas de Stock
- Notificación automática cuando el stock es inferior al mínimo configurado
- Indicadores visuales en el dashboard y lista de productos

## 🧪 Testing

### Backend
```bash
cd backend
npm run test
```

### Frontend
```bash
cd frontend
npm run test
```

## 📦 Construcción para Producción

### Backend
```bash
cd backend
npm run build
npm start
```

### Frontend
```bash
cd frontend
npm run build
```

Los archivos de producción se generarán en la carpeta `dist/`.

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 👥 Autores

- **Máster Repair** - *Desarrollo inicial*

## 🙏 Agradecimientos

- [Fastify](https://www.fastify.io/)
- [React](https://reactjs.org/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)
