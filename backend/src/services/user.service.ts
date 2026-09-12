import { User, UserRole } from "../models/User";
import { LeanUser, UserDocument } from "../types/user.types";

export class UserService {
  async getUsers(
    filters: any = {},
  ): Promise<{ data: LeanUser[]; pagination: any }> {
    const { page = 1, limit = 10, search, role, isActive } = filters;

    const query: any = {};
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive;

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: users as LeanUser[],
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

  async getUserById(id: string): Promise<UserDocument> {
    const user = await User.findById(id);
    if (!user) throw new Error("Usuario no encontrado");
    return user as UserDocument;
  }

  async createUser(data: any): Promise<UserDocument> {
    const existingUser = await User.findOne({
      email: data.email.toLowerCase(),
    });
    if (existingUser) throw new Error("Ya existe un usuario con ese email");

    const user = new User(data);
    await user.save();
    return user as UserDocument;
  }

  async updateUser(
    id: string,
    data: any,
    currentUserId: string,
  ): Promise<UserDocument> {
    const user = await User.findById(id);
    if (!user) throw new Error("Usuario no encontrado");

    const isSelf = id === currentUserId;
    const wasActiveAdmin =
      user.role === UserRole.ADMIN && user.isActive;

    if (isSelf) {
      if (data.isActive === false) {
        throw new Error("No puede desactivar su propia cuenta desde este módulo");
      }
      if (data.role && data.role !== UserRole.ADMIN && user.role === UserRole.ADMIN) {
        throw new Error("No puede cambiar el rol de su propia cuenta desde este módulo");
      }
    }

    // Si el usuario objetivo es hoy un admin activo y esta actualización lo
    // desactivaría o le quitaría el rol de admin, verificar que quede al
    // menos otro admin activo antes de aplicar el cambio.
    const willLoseAdminStatus =
      wasActiveAdmin &&
      ((data.isActive === false) ||
        (data.role && data.role !== UserRole.ADMIN));

    if (willLoseAdminStatus) {
      const otherActiveAdmins = await User.countDocuments({
        role: UserRole.ADMIN,
        isActive: true,
        _id: { $ne: id },
      });
      if (otherActiveAdmins === 0) {
        throw new Error(
          "No puede quedar el sistema sin al menos un administrador activo",
        );
      }
    }

    if (data.email && data.email.toLowerCase() !== user.email) {
      const existingUser = await User.findOne({
        email: data.email.toLowerCase(),
      });
      if (existingUser) throw new Error("Ya existe un usuario con ese email");
    }

    Object.assign(user, data);
    await user.save();
    return user as UserDocument;
  }

  async deleteUser(id: string, currentUserId: string): Promise<void> {
    const user = await User.findById(id);
    if (!user) throw new Error("Usuario no encontrado");

    if (id === currentUserId) {
      throw new Error("No puede eliminar su propia cuenta desde este módulo");
    }

    if (user.role === UserRole.ADMIN && user.isActive) {
      const otherActiveAdmins = await User.countDocuments({
        role: UserRole.ADMIN,
        isActive: true,
        _id: { $ne: id },
      });
      if (otherActiveAdmins === 0) {
        throw new Error(
          "No puede quedar el sistema sin al menos un administrador activo",
        );
      }
    }

    await User.findByIdAndDelete(id);
  }
}

export const userService = new UserService();
