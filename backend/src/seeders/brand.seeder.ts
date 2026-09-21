import { Brand } from "../models/Brand";
import { Screen } from "../models/Screen";
import mongoose from "mongoose";

export const seedBrands = async (): Promise<
  Record<string, mongoose.Types.ObjectId>
> => {
  // Las pantallas referencian a las marcas: se limpian primero para no
  // dejar registros huérfanos.
  await Screen.deleteMany({});
  await Brand.deleteMany({});
  console.log("🗑️  Colecciones de marcas y pantallas limpiadas");

  const brandsData = [
    { name: "Samsung" },
    { name: "Xiaomi" },
    { name: "Redmi" },
    { name: "Spark" },
    { name: "iPhone" },
  ];

  const brands = await Brand.insertMany(brandsData);
  console.log(`✅ ${brands.length} marcas creadas`);

  return Object.fromEntries(brands.map((b) => [b.name, b._id]));
};
