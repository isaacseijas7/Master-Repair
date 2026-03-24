// frontend/src/pages/profile/Profile.tsx
import { useEffect } from "react";
import { useProfileStore } from "@/stores/profile.store";
import { useAuthStore } from "@/stores/auth.store";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { User, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { User as UserType } from "@/services/profile.service";
import { ProfileForm } from "./ProfileForm";
import { PasswordForm } from "./PasswordForm";

export function Profile() {
  const { user, isLoading, error, fetchProfile, clearError } =
    useProfileStore();
  const { user: authUser, updateUser } = useAuthStore();

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  const handleProfileUpdateSuccess = (updatedUser: UserType) => {
    // Actualizar también el usuario en el store de auth para mantener sincronización
    if (authUser) {
      updateUser({ ...authUser, ...updatedUser });
    }
    toast.success("Perfil actualizado exitosamente");
  };

  const handlePasswordChangeSuccess = () => {
    toast.success("Contraseña cambiada exitosamente");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getRoleBadgeVariant = (
    role: string,
  ): "default" | "destructive" | "secondary" | "outline" => {
    switch (role) {
      case "admin":
        return "destructive";
      case "manager":
        return "default";
      default:
        return "secondary";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin":
        return "Administrador";
      case "manager":
        return "Gerente";
      case "cashier":
        return "Cajero";
      default:
        return role;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Mi Perfil</h1>
        <p className="text-muted-foreground">
          Gestiona tu información personal y seguridad de la cuenta
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* Sidebar con info del usuario */}
        <Card className="h-fit">
          <CardHeader className="text-center">
            <Avatar className="h-24 w-24 mx-auto mb-4">
              <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                {user ? getInitials(user.firstName, user.lastName) : "U"}
              </AvatarFallback>
            </Avatar>
            <CardTitle className="text-xl">
              {user ? `${user.firstName} ${user.lastName}` : "Usuario"}
            </CardTitle>
            <CardDescription className="flex justify-center mt-2">
              <Badge variant={getRoleBadgeVariant(user?.role || "")}>
                {getRoleLabel(user?.role || "")}
              </Badge>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Separator />
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p className="text-sm">{user?.email}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Estado
              </p>
              <Badge variant={user?.isActive ? "default" : "secondary"}>
                {user?.isActive ? "Activo" : "Inactivo"}
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Miembro desde
              </p>
              <p className="text-sm">
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString("es-ES", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "-"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Tabs para editar perfil y contraseña */}
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
            <TabsTrigger value="general" className="gap-2">
              <User className="h-4 w-4" />
              Información General
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Lock className="h-4 w-4" />
              Seguridad
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Información Personal</CardTitle>
                <CardDescription>
                  Actualiza tus datos personales. Estos cambios se reflejarán
                  inmediatamente en tu cuenta.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProfileForm onSuccess={handleProfileUpdateSuccess} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Cambiar Contraseña</CardTitle>
                <CardDescription>
                  Actualiza tu contraseña para mantener tu cuenta segura. Debes
                  ingresar tu contraseña actual para confirmar los cambios.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PasswordForm onSuccess={handlePasswordChangeSuccess} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
