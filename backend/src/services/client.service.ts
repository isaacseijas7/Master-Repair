import { Client, IClient } from "../models/Client";
import { Order } from "../models/Order";

const normalizeOptionalString = (value?: string): string | undefined => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

export class ClientService {
  async getClients(filters: any = {}): Promise<{ data: IClient[]; pagination: any }> {
    const { page = 1, limit = 10, search, isActive } = filters;

    const query: any = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    if (isActive !== undefined) {
      query.isActive = isActive;
    }

    const skip = (page - 1) * limit;

    const [clients, total] = await Promise.all([
      Client.find(query).sort({ name: 1 }).skip(skip).limit(limit).lean(),
      Client.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: clients as IClient[],
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async getClientById(id: string): Promise<IClient> {
    const client = await Client.findById(id);
    if (!client) throw new Error("Cliente no encontrado");
    return client;
  }

  async createClient(data: any): Promise<IClient> {
    const name = normalizeOptionalString(data.name);
    const email = normalizeOptionalString(data.email)?.toLowerCase();
    const phone = normalizeOptionalString(data.phone);

    if (!name) {
      throw new Error("El nombre del cliente es requerido");
    }

    const duplicatedName = await Client.findOne({
      name: { $regex: new RegExp(`^${this.escapeRegex(name)}$`, "i") },
    });

    if (duplicatedName) {
      throw new Error("Ya existe un cliente con ese nombre");
    }

    if (email) {
      const duplicatedEmail = await Client.findOne({
        email: { $regex: new RegExp(`^${this.escapeRegex(email)}$`, "i") },
      });

      if (duplicatedEmail) {
        throw new Error("Ya existe un cliente con ese email");
      }
    }

    const client = new Client({ name, email, phone });
    await client.save();
    return client;
  }

  async assertClientExists(id: string): Promise<IClient> {
    const client = await Client.findById(id);

    if (!client || !client.isActive) {
      throw new Error("Cliente no encontrado o inactivo");
    }

    return client;
  }

  async deleteClient(id: string): Promise<void> {
    const client = await Client.findById(id);
    if (!client) throw new Error("Cliente no encontrado");

    const relatedOrders = await Order.countDocuments({ client: id });
    if (relatedOrders > 0) {
      throw new Error(
        `No se puede eliminar el cliente porque tiene ${relatedOrders} órdenes asociadas`,
      );
    }

    await Client.findByIdAndDelete(id);
  }

  private escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
}

export const clientService = new ClientService();