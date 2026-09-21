import { Screen } from "../models/Screen";
import mongoose from "mongoose";

// `salePrice` es el precio de venta al por mayor, en USD (datos de prueba).
const screensByBrand: Record<string, Array<{ screenModel: string; salePrice: number }>> = {
  Samsung: [
    { screenModel: "Galaxy S24", salePrice: 799.99 },
    { screenModel: "Galaxy S24 Ultra", salePrice: 1299.99 },
    { screenModel: "Galaxy A55", salePrice: 449.0 },
    { screenModel: "Galaxy A15", salePrice: 199.5 },
    { screenModel: "Galaxy Z Flip5", salePrice: 999.0 },
  ],
  Xiaomi: [
    { screenModel: "Xiaomi 14", salePrice: 749.0 },
    { screenModel: "Xiaomi 13T", salePrice: 549.0 },
    { screenModel: "Poco X6 Pro", salePrice: 329.99 },
    { screenModel: "Poco M6", salePrice: 149.0 },
  ],
  Redmi: [
    { screenModel: "Redmi Note 13", salePrice: 209.5 },
    { screenModel: "Redmi Note 13 Pro", salePrice: 289.0 },
    { screenModel: "Redmi 13C", salePrice: 129.99 },
    { screenModel: "Redmi A3", salePrice: 89.0 },
  ],
  Spark: [
    { screenModel: "Spark 20", salePrice: 139.0 },
    { screenModel: "Spark 20 Pro", salePrice: 169.99 },
    { screenModel: "Spark Go 2024", salePrice: 99.0 },
  ],
  iPhone: [
    { screenModel: "iPhone 15", salePrice: 799.0 },
    { screenModel: "iPhone 15 Pro", salePrice: 999.0 },
    { screenModel: "iPhone 15 Pro Max", salePrice: 1199.0 },
    { screenModel: "iPhone 14", salePrice: 699.0 },
    { screenModel: "iPhone 13", salePrice: 599.0 },
  ],
};

export const seedScreens = async (
  brandIds: Record<string, mongoose.Types.ObjectId>,
): Promise<mongoose.Types.ObjectId[]> => {
  await Screen.deleteMany({});
  console.log("🗑️  Colección de pantallas limpiada");

  // Mongoose crea índices pero nunca elimina los obsoletos: si la colección
  // conserva un índice de una versión anterior del esquema, los inserts
  // fallan con E11000. syncIndexes deja solo los índices del esquema actual.
  await Screen.syncIndexes();

  const screensData = Object.entries(screensByBrand).flatMap(([brandName, screens]) => {
    const brandId = brandIds[brandName];
    if (!brandId) {
      throw new Error(`Marca "${brandName}" no encontrada; ejecuta antes el seeder de marcas`);
    }
    return screens.map((screen) => ({
      brandId,
      ...screen,
      // Datos de prueba derivados del precio al por mayor (`salePrice`):
      // compra al proveedor ≈ 10% menos, venta unitaria ≈ 12% más.
      purchasePrice: Math.round(screen.salePrice * 0.9 * 100) / 100,
      unitSalePrice: Math.round(screen.salePrice * 1.12 * 100) / 100,
    }));
  });

  const screens = await Screen.insertMany(screensData);
  console.log(`✅ ${screens.length} pantallas creadas`);

  return screens.map((p) => p._id);
};
