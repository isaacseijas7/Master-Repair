import { connectDatabase, disconnectDatabase } from "../config/database";
import { seedUsers } from "./user.seeder";
import { seedCategories } from "./category.seeder";
import { seedSuppliers } from "./supplier.seeder";
import { seedProducts } from "./product.seeder";
import { seedOrders } from "./order.seeder";

const runSeeders = async (): Promise<void> => {
  try {
    console.log("🌱 Iniciando proceso de seeding...\n");

    await connectDatabase();

    console.log("--- USUARIOS ---");
    const userIds = await seedUsers();

    console.log("\n--- CATEGORÍAS ---");
    const categoryIds = await seedCategories();

    console.log("\n--- PROVEEDORES ---");
    const supplierIds = await seedSuppliers();

    console.log("\n--- PRODUCTOS ---");
    const productIds = await seedProducts(categoryIds, supplierIds);

    console.log("\n--- ÓRDENES HISTÓRICAS (6 MESES) ---");
    const stats = await seedOrders(productIds, userIds);

    console.log("\n✨ Seeding completado exitosamente");
    console.log("\n📊 Resumen de datos creados:");
    console.log("• 4 usuarios (admin, manager, 2 cashiers)");
    console.log("• 10 categorías de productos");
    console.log("• 8 proveedores");
    console.log("• 50+ productos con stock realista");
    console.log(`• ${stats.totalOrders} órdenes (${stats.sales} ventas, ${stats.purchases} compras, ${stats.returns} devoluciones)`);
    console.log(`• Período: ${stats.dateRange}`);
    console.log(`• Ventas totales: $${stats.totalRevenue.toLocaleString()} MXN`);
  } catch (error) {
    console.error("\n❌ Error durante el seeding:", error);
    process.exit(1);
  } finally {
    await disconnectDatabase();
    process.exit(0);
  }
};

if (require.main === module) {
  runSeeders();
}

export { runSeeders };