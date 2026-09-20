import { Brand } from "../models/Brand";
import { Phone } from "../models/Phone";
import mongoose from "mongoose";

export const seedBrands = async (): Promise<
  Record<string, mongoose.Types.ObjectId>
> => {
  // Los teléfonos referencian a las marcas: se limpian primero para no
  // dejar registros huérfanos.
  await Phone.deleteMany({});
  await Brand.deleteMany({});
  console.log("🗑️  Colecciones de marcas y teléfonos limpiadas");

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
