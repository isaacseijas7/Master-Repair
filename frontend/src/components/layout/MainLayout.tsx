import { Outlet, Link, useLocation, useNavigate, useMatch } from 'react-router-dom';
import { useState } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { useConfirm } from '@/hooks/useConfirm';
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
import { HelpCenterSheet } from '@/components/help/HelpCenterSheet';
import logo from '@/assets/logo.png';
import {
  LayoutDashboard,
  Package,
  Tags,
  Truck,
  Users,
  ShoppingCart,
  LogOut,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Smartphone,
  BadgeCheck,
  Bell,
  CircleHelp,
  MoreHorizontal,
  User,
  UserCog,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Productos', href: '/products', icon: Package },
  { name: 'Categorías', href: '/categories', icon: Tags },
  { name: 'Proveedores', href: '/suppliers', icon: Truck },
  { name: 'Clientes', href: '/clients', icon: Users },
  { name: 'Órdenes', href: '/orders', icon: ShoppingCart },
];

// Menú principal "Catálogo de Pantallas" con sus submenús.
const phoneCatalogNavigation = {
  name: 'Catálogo de Pantallas',
  icon: Smartphone,
  children: [
    { name: 'Marcas', href: '/brands', icon: BadgeCheck },
    { name: 'Pantallas', href: '/phones', icon: Smartphone },
  ],
};

const isPathActive = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(`${href}/`);

// Solo visible para admin: administrar usuarios y roles es la única acción
// del sistema restringida exclusivamente a ese rol (mismo precedente que
// /auth/register en el backend), por eso es el único ítem de navegación que
// necesita ocultarse según el rol en vez de solo ocultar botones dentro de
// una página ya visible para todos.
const adminNavigation = { name: 'Usuarios', href: '/users', icon: UserCog };

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
  const [helpOpen, setHelpOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const confirm = useConfirm();
  const isAdmin = user?.role === 'admin';
  const isCatalogActive = phoneCatalogNavigation.children.some((child) =>
    isPathActive(location.pathname, child.href)
  );
  const [catalogOpen, setCatalogOpen] = useState(isCatalogActive);
  const [wasCatalogActive, setWasCatalogActive] = useState(isCatalogActive);
  // Al entrar a un submenú del catálogo (ej. desde un enlace directo) el
  // grupo debe quedar desplegado; se ajusta durante el render en vez de en
  // un efecto para no provocar un render extra.
  if (isCatalogActive !== wasCatalogActive) {
    setWasCatalogActive(isCatalogActive);
    if (isCatalogActive) setCatalogOpen(true);
  }
  const visibleMoreNavigation = isAdmin
    ? [...moreNavigation, adminNavigation]
    : moreNavigation;

  // Estas rutas ya muestran su propia barra de acción fija en mobile
  // (total + enviar, o guardar/eliminar); mantener también la bottom nav
  // global apilaba dos barras fijas una encima de la otra.
  // Los 4 useMatch se guardan en variables separadas (no encadenados con
  // ||) porque || cortocircuita: si uno ya matchea, los siguientes no se
  // evaluarían, lo que cambia la cantidad de hooks llamados entre renders
  // y rompe las Rules of Hooks ("Rendered fewer hooks than expected").
  const matchOrdersNew = useMatch('/orders/new');
  const matchOrdersEdit = useMatch('/orders/:id/edit');
  const matchProductsNew = useMatch('/products/new');
  const matchProductsId = useMatch('/products/:id');
  const isLongFormRoute = !!(
    matchOrdersNew || matchOrdersEdit || matchProductsNew || matchProductsId
  );

  const handleLogout = async () => {
    const confirmed = await confirm({
      title: 'Cerrar sesión',
      description: '¿Estás seguro de que deseas cerrar sesión?',
      confirmText: 'Cerrar sesión',
    });
    if (!confirmed) return;
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
        <div className="flex items-center justify-between h-24 px-6 border-b border-gray-200">
          <Link to="/" aria-label="Máster Repair - Inicio">
            <img src={logo} alt="Máster Repair C.A" className="h-20 w-auto" />
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

          {/* Catálogo de Pantallas */}
          <div>
            <button
              type="button"
              onClick={() => setCatalogOpen((open) => !open)}
              aria-expanded={catalogOpen}
              className={cn(
                'flex w-full items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                isCatalogActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              )}
            >
              <phoneCatalogNavigation.icon
                className={cn('w-5 h-5', isCatalogActive ? 'text-blue-700' : 'text-gray-500')}
              />
              <span className="flex-1 text-left">{phoneCatalogNavigation.name}</span>
              <ChevronRight
                className={cn('w-4 h-4 transition-transform', catalogOpen && 'rotate-90')}
              />
            </button>
            {catalogOpen && (
              <div className="mt-1 ml-4 space-y-1 border-l border-gray-200 pl-3">
                {phoneCatalogNavigation.children.map((child) => {
                  const isActive = isPathActive(location.pathname, child.href);
                  return (
                    <Link
                      key={child.name}
                      to={child.href}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      )}
                    >
                      <child.icon className={cn('w-4 h-4', isActive ? 'text-blue-700' : 'text-gray-500')} />
                      {child.name}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {isAdmin && (
            <Link
              to={adminNavigation.href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                isPathActive(location.pathname, adminNavigation.href)
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              )}
            >
              <adminNavigation.icon
                className={cn(
                  'w-5 h-5',
                  isPathActive(location.pathname, adminNavigation.href) ? 'text-blue-700' : 'text-gray-500'
                )}
              />
              {adminNavigation.name}
            </Link>
          )}
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
              {/* Ayuda */}
              <button
                onClick={() => setHelpOpen(true)}
                className="p-2 rounded-lg hover:bg-gray-100"
                aria-label="Ayuda"
              >
                <CircleHelp className="w-5 h-5 text-gray-500" />
              </button>

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
            const isMoreActive =
              isCatalogActive ||
              visibleMoreNavigation.some((item) => isPathActive(location.pathname, item.href));
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
            {visibleMoreNavigation.map((item) => {
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
            <p className="px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
              {phoneCatalogNavigation.name}
            </p>
            {phoneCatalogNavigation.children.map((child) => {
              const isActive = isPathActive(location.pathname, child.href);
              return (
                <Link
                  key={child.name}
                  to={child.href}
                  onClick={() => setMoreOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors',
                    isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                  )}
                >
                  <child.icon className={cn('h-5 w-5', isActive ? 'text-blue-700' : 'text-gray-500')} />
                  {child.name}
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

      <HelpCenterSheet open={helpOpen} onOpenChange={setHelpOpen} />
    </div>
  );
}
