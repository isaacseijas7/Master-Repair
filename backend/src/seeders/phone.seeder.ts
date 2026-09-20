import { Phone } from "../models/Phone";
import mongoose from "mongoose";

// `salePrice` es el precio de venta al por mayor, en USD (datos de prueba).
const phonesByBrand: Record<string, Array<{ phoneModel: string; salePrice: number }>> = {
  Samsung: [
    { phoneModel: "Galaxy S24", salePrice: 799.99 },
    { phoneModel: "Galaxy S24 Ultra", salePrice: 1299.99 },
    { phoneModel: "Galaxy A55", salePrice: 449.0 },
    { phoneModel: "Galaxy A15", salePrice: 199.5 },
    { phoneModel: "Galaxy Z Flip5", salePrice: 999.0 },
  ],
  Xiaomi: [
    { phoneModel: "Xiaomi 14", salePrice: 749.0 },
    { phoneModel: "Xiaomi 13T", salePrice: 549.0 },
    { phoneModel: "Poco X6 Pro", salePrice: 329.99 },
    { phoneModel: "Poco M6", salePrice: 149.0 },
  ],
  Redmi: [
    { phoneModel: "Redmi Note 13", salePrice: 209.5 },
    { phoneModel: "Redmi Note 13 Pro", salePrice: 289.0 },
    { phoneModel: "Redmi 13C", salePrice: 129.99 },
    { phoneModel: "Redmi A3", salePrice: 89.0 },
  ],
  Spark: [
    { phoneModel: "Spark 20", salePrice: 139.0 },
    { phoneModel: "Spark 20 Pro", salePrice: 169.99 },
    { phoneModel: "Spark Go 2024", salePrice: 99.0 },
  ],
  iPhone: [
    { phoneModel: "iPhone 15", salePrice: 799.0 },
    { phoneModel: "iPhone 15 Pro", salePrice: 999.0 },
    { phoneModel: "iPhone 15 Pro Max", salePrice: 1199.0 },
    { phoneModel: "iPhone 14", salePrice: 699.0 },
    { phoneModel: "iPhone 13", salePrice: 599.0 },
  ],
};

export const seedPhones = async (
  brandIds: Record<string, mongoose.Types.ObjectId>,
): Promise<mongoose.Types.ObjectId[]> => {
  await Phone.deleteMany({});
  console.log("🗑️  Colección de teléfonos limpiada");

  // Mongoose crea índices pero nunca elimina los obsoletos: si la colección
  // conserva un índice de una versión anterior del esquema, los inserts
  // fallan con E11000. syncIndexes deja solo los índices del esquema actual.
  await Phone.syncIndexes();

  const phonesData = Object.entries(phonesByBrand).flatMap(([brandName, phones]) => {
    const brandId = brandIds[brandName];
    if (!brandId) {
      throw new Error(`Marca "${brandName}" no encontrada; ejecuta antes el seeder de marcas`);
    }
    return phones.map((phone) => ({
      brandId,
      ...phone,
      // Datos de prueba derivados del precio al por mayor (`salePrice`):
      // compra al proveedor ≈ 10% menos, venta unitaria ≈ 12% más.
      purchasePrice: Math.round(phone.salePrice * 0.9 * 100) / 100,
      unitSalePrice: Math.round(phone.salePrice * 1.12 * 100) / 100,
    }));
  });

  const phones = await Phone.insertMany(phonesData);
  console.log(`✅ ${phones.length} teléfonos creados`);

  return phones.map((p) => p._id);
};
