import { Category } from "../models/Category";
import mongoose from "mongoose";

export const seedCategories = async (): Promise<mongoose.Types.ObjectId[]> => {
  await Category.deleteMany({});
  console.log("🗑️  Colección de categorías limpiada");

  const categoriesData = [
    {
      name: "Pantallas",
      description: "Pantallas LCD, OLED y táctiles para smartphones",
      color: "#EF4444",
      isActive: true,
    },
    {
      name: "Baterías",
      description: "Baterías originales y genéricas para todas las marcas",
      color: "#10B981",
      isActive: true,
    },
    {
      name: "Cargadores",
      description: "Cargadores, cables y adaptadores de carga",
      color: "#F59E0B",
      isActive: true,
    },
    {
      name: "Carcasas",
      description: "Carcasas, tapas traseras y protectores",
      color: "#3B82F6",
      isActive: true,
    },
    {
      name: "Cámaras",
      description: "Módulos de cámara frontal y trasera",
      color: "#8B5CF6",
      isActive: true,
    },
    {
      name: "Botones",
      description: "Botones de encendido, volumen y home",
      color: "#EC4899",
      isActive: true,
    },
    {
      name: "Conectores",
      description: "Puertos de carga, jacks de audio y SIM",
      color: "#06B6D4",
      isActive: true,
    },
    {
      name: "Herramientas",
      description: "Herramientas de reparación y desarme",
      color: "#6366F1",
      isActive: true,
    },
    {
      name: "Accesorios",
      description: "Protectores de pantalla, fundas y otros accesorios",
      color: "#84CC16",
      isActive: true,
    },
    {
      name: "Componentes Internos",
      description: "Placas base, chips y componentes electrónicos",
      color: "#14B8A6",
      isActive: true,
    },
  ];

  const categories = await Category.insertMany(categoriesData);
  console.log(`✅ ${categories.length} categorías creadas`);

  return categories.map((c) => c._id);
};
