import { User, UserRole } from "../models/User";
import mongoose from "mongoose";

export const seedUsers = async (): Promise<mongoose.Types.ObjectId[]> => {
  await User.deleteMany({});
  console.log("🗑️  Colección de usuarios limpiada");

  const password = "Admin123!";

  const usersData = [
    {
      email: "admin@masterrepair.com",
      password,
      firstName: "Nelyuri",
      lastName: "Longa",
      role: UserRole.ADMIN,
      isActive: true,
      createdAt: new Date("2023-01-15"),
    },
    // {
    //   email: "gerente@masterrepair.com",
    //   password,
    //   firstName: "Carlos",
    //   lastName: "Gómez",
    //   role: UserRole.MANAGER,
    //   isActive: true,
    //   createdAt: new Date("2023-02-01"),
    // },
    // {
    //   email: "cajero1@masterrepair.com",
    //   password,
    //   firstName: "Ana",
    //   lastName: "Martínez",
    //   role: UserRole.CASHIER,
    //   isActive: true,
    //   createdAt: new Date("2023-03-10"),
    // },
    // {
    //   email: "cajero2@masterrepair.com",
    //   password,
    //   firstName: "Luis",
    //   lastName: "Hernández",
    //   role: UserRole.CASHIER,
    //   isActive: true,
    //   createdAt: new Date("2023-06-01"),
    // },
    // {
    //   email: "taller@masterrepair.com",
    //   password,
    //   firstName: "Miguel",
    //   lastName: "Sánchez",
    //   role: UserRole.CASHIER,
    //   isActive: true,
    //   createdAt: new Date("2023-08-15"),
    // },
  ];

  // Crear usuarios uno por uno con .save() para que ejecute el middleware pre('save')
  const createdUsers: mongoose.Types.ObjectId[] = [];

  for (const userData of usersData) {
    const user = new User(userData);
    await user.save(); // Esto ejecuta el middleware pre('save') que encripta la contraseña
    createdUsers.push(user._id);
  }

  console.log(
    `✅ ${createdUsers.length} usuarios creados con contraseñas encriptadas`,
  );

  return createdUsers;
};
