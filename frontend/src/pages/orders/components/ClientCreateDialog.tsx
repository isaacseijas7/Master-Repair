import { useEffect, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { ResponsiveDialog } from "@/components/ResponsiveDialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { clientService } from "@/services/client.service";
import type { Client } from "@/types";

const phoneRegex = /^[+]?[\d\s().-]{7,20}$/;

const createClientSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio"),
  email: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || z.email().safeParse(value).success, {
      message: "Email inválido",
    }),
  phone: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || phoneRegex.test(value), {
      message: "Teléfono inválido",
    }),
});

type CreateClientFormData = z.infer<typeof createClientSchema>;

interface ClientCreateDialogProps {
  onClientCreated: (client: Client) => void;
}

export function ClientCreateDialog({ onClientCreated }: ClientCreateDialogProps) {
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateClientFormData>({
    resolver: zodResolver(createClientSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
    },
  });

  useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open, reset]);

  const onSubmit = async (data: CreateClientFormData) => {
    try {
      const client = await clientService.createClient({
        name: data.name.trim(),
        email: data.email?.trim() || undefined,
        phone: data.phone?.trim() || undefined,
      });

      onClientCreated(client);
      toast.success("Cliente registrado exitosamente");
      setOpen(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "No se pudo registrar el cliente");
    }
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={setOpen}
      trigger={
        <Button
          data-tour="orders.form.client-create-button"
          type="button"
          variant="outline"
          className="w-full gap-2 md:w-auto"
        >
          <Plus className="h-4 w-4" />
          Registrar nuevo cliente
        </Button>
      }
      title={
        <span className="flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-blue-600" />
          Registrar cliente
        </span>
      }
      description="Crea un cliente y selecciónalo automáticamente para la orden en curso."
      contentClassName="sm:max-w-lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="client-name">Nombre *</Label>
          <Input
            id="client-name"
            {...register("name")}
            placeholder="Nombre completo del cliente"
            className={errors.name ? "border-red-500" : ""}
          />
          {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="client-email">Email</Label>
            <Input
              id="client-email"
              type="email"
              {...register("email")}
              placeholder="cliente@email.com"
              className={errors.email ? "border-red-500" : ""}
            />
            {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="client-phone">Teléfono</Label>
            <Input
              id="client-phone"
              {...register("phone")}
              placeholder="(555) 123-4567"
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Guardar cliente
          </Button>
        </DialogFooter>
      </form>
    </ResponsiveDialog>
  );
}