import { Outlet, Link, useLocation, useNavigate, useMatch } from 'react-router-dom';
import { useState } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { cn, getInitials } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  LayoutDashboard,
  Package,
  Tags,
  Truck,
  Users,
  ShoppingCart,
  BarChart3,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Bell,
  MoreHorizontal,
  User,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Productos', href: '/products', icon: Package },
  { name: 'Categorías', href: '/categories', icon: Tags },
  { name: 'Proveedores', href: '/suppliers', icon: Truck },
  { name: 'Clientes', href: '/clients', icon: Users },
  { name: 'Órdenes', href: '/orders', icon: ShoppingCart },
];

const mobileNavigation = [
  { name: 'Inicio', href: '/', icon: LayoutDashboard },
  { name: 'Productos', href: '/products', icon: Package },
  { name: 'Órdenes', href: '/orders', icon: ShoppingCart },
  { name: 'Proveedores', href: '/suppliers', icon: Truck },
];

const moreNavigation = [
  { name: 'Categorías', href: '/categories', icon: Tags },
  { name: 'Clientes', href: '/clients', icon: Users },
  { name: 'Perfil', href: '/profile', icon: User },
];

export function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  // Estas rutas ya muestran su propia barra de acción fija en mobile
  // (total + enviar, o guardar/eliminar); mantener también la bottom nav
  // global apilaba dos barras fijas una encima de la otra.
  const isLongFormRoute = !!(
    useMatch('/orders/new') ||
    useMatch('/orders/:id/edit') ||
    useMatch('/products/new') ||
    useMatch('/products/:id')
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-900/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200 transition-transform duration-200 ease-in-out lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Máster Repair</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href || 
                           location.pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <item.icon className={cn('w-5 h-5', isActive ? 'text-blue-700' : 'text-gray-500')} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        {/* <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <Link
            to="/settings"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <Settings className="w-5 h-5 text-gray-500" />
            Configuración
          </Link>
        </div> */}
      </aside>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Header */}
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between h-full px-4 sm:px-6 lg:px-8">
            {/* Left side */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-4">
              {/* Notifications */}
              {/* TODO: conectar a un sistema de notificaciones real antes de mostrar un indicador */}
              <button className="relative p-2 rounded-lg hover:bg-gray-100">
                <Bell className="w-5 h-5 text-gray-500" />
              </button>

              {/* User menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-blue-100 text-blue-700 text-sm font-medium">
                        {user ? getInitials(user.firstName, user.lastName) : 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden sm:block text-left">
                      <p className="text-sm font-medium text-gray-900">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    Perfil
                  </DropdownMenuItem>
                  {/* <DropdownMenuItem onClick={() => navigate('/settings')}>
                    Configuración
                  </DropdownMenuItem> */}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <LogOut className="w-4 h-4 mr-2" />
                    Cerrar Sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main
          className={cn(
            'p-4 sm:p-6 lg:p-8',
            isLongFormRoute ? 'pb-4 sm:pb-6' : 'pb-24 sm:pb-6'
          )}
        >
          <Outlet />
        </main>
      </div>

      <nav
        className={cn(
          'fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white/95 backdrop-blur lg:hidden',
          isLongFormRoute && 'hidden'
        )}
      >
        <div className="grid grid-cols-5 gap-1 px-2 py-2">
          {mobileNavigation.map((item) => {
            const isActive =
              location.pathname === item.href ||
              (item.href !== '/' && location.pathname.startsWith(`${item.href}/`));

            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'flex min-h-14 flex-col items-center justify-center rounded-xl px-2 text-[11px] font-medium transition-colors',
                  isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:bg-gray-100'
                )}
              >
                <item.icon className="mb-1 h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
          {(() => {
            const isMoreActive = moreNavigation.some(
              (item) => location.pathname === item.href || location.pathname.startsWith(`${item.href}/`)
            );
            return (
              <button
                type="button"
                onClick={() => setMoreOpen(true)}
                className={cn(
                  'flex min-h-14 flex-col items-center justify-center rounded-xl px-2 text-[11px] font-medium transition-colors',
                  isMoreActive ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:bg-gray-100'
                )}
              >
                <MoreHorizontal className="mb-1 h-5 w-5" />
                <span>Más</span>
              </button>
            );
          })()}
        </div>
      </nav>

      {/* Mobile "more" drawer */}
      <Drawer open={moreOpen} onOpenChange={setMoreOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Más opciones</DrawerTitle>
          </DrawerHeader>
          <nav className="space-y-1 px-4 pb-6">
            {moreNavigation.map((item) => {
              const isActive =
                location.pathname === item.href || location.pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setMoreOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors',
                    isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                  )}
                >
                  <item.icon className={cn('h-5 w-5', isActive ? 'text-blue-700' : 'text-gray-500')} />
                  {item.name}
                </Link>
              );
            })}
            <button
              type="button"
              onClick={() => {
                setMoreOpen(false);
                handleLogout();
              }}
              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
            >
              <LogOut className="h-5 w-5" />
              Cerrar Sesión
            </button>
          </nav>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
