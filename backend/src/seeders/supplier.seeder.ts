import { Supplier } from "../models/Supplier";
import mongoose from "mongoose";

export const seedSuppliers = async (): Promise<mongoose.Types.ObjectId[]> => {
  await Supplier.deleteMany({});
  console.log("🗑️  Colección de proveedores limpiada");

  const suppliersData = [
    {
      name: "TechParts México",
      contactName: "Roberto Sánchez",
      email: "ventas@techparts.mx",
      phone: "+52 55 1234 5678",
      address: "Av. Tecnología 123, Col. Centro, Ciudad de México, CDMX",
      taxId: "TPM123456ABC",
      isActive: true,
      createdAt: new Date("2023-01-10"),
    },
    {
      name: "Celular Components SA",
      contactName: "María González",
      email: "contacto@celularcomp.com",
      phone: "+52 81 8765 4321",
      address: "Calle Industria 456, Monterrey, NL",
      taxId: "CCS987654XYZ",
      isActive: true,
      createdAt: new Date("2023-02-15"),
    },
    {
      name: "Importadora Digital",
      contactName: "Fernando López",
      email: "importaciones@digital.com",
      phone: "+52 33 2345 6789",
      address: "Blvd. Comercio 789, Guadalajara, Jal",
      taxId: "IDG456789DEF",
      isActive: true,
      createdAt: new Date("2023-03-20"),
    },
    {
      name: "Repuestos Express",
      contactName: "Patricia Ruiz",
      email: "ventas@repuestosexpress.com",
      phone: "+52 999 888 7777",
      address: "Calle Velocidad 321, Mérida, Yuc",
      taxId: "REX321654GHI",
      isActive: true,
      createdAt: new Date("2023-04-05"),
    },
    {
      name: "Global Mobile Parts",
      contactName: "Alejandro Torres",
      email: "info@globalmobile.com",
      phone: "+52 222 333 4444",
      address: "Av. Internacional 555, Puebla, Pue",
      taxId: "GMP789123JKL",
      isActive: true,
      createdAt: new Date("2023-05-12"),
    },
    {
      name: "Mayorista Celular MX",
      contactName: "Diana Flores",
      email: "ventas@mayoristacel.mx",
      phone: "+52 686 123 4567",
      address: "Av. de las Torres 890, Tijuana, BC",
      taxId: "MCM456789MNO",
      isActive: true,
      createdAt: new Date("2023-06-18"),
    },
    {
      name: "Componentes del Norte",
      contactName: "Jorge Ramírez",
      email: "contacto@compnorte.com",
      phone: "+52 844 987 6543",
      address: "Calle Saltillo 234, Saltillo, Coah",
      taxId: "CDN987654PQR",
      isActive: true,
      createdAt: new Date("2023-07-22"),
    },
    {
      name: "Pantallas y Más",
      contactName: "Sofía Castillo",
      email: "ventas@pantallasymas.com",
      phone: "+52 477 456 7890",
      address: "Blvd. Hidalgo 567, León, Gto",
      taxId: "PYM123456STU",
      isActive: true,
      createdAt: new Date("2023-08-30"),
    },
  ];

  const suppliers = await Supplier.insertMany(suppliersData);
  console.log(`✅ ${suppliers.length} proveedores creados`);

  return suppliers.map((s) => s._id);
};