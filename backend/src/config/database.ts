import mongoose from "mongoose";

export const connectDatabase = async (): Promise<void> => {
  try {
    const mongoUri =
      process.env.MONGODB_URI || "mongodb+srv://isaacseijas7_db_user:UcAFO6i0pkcEHKA0@cluster0.kmdthdj.mongodb.net/?appName=Cluster0/master-repair";

    await mongoose.connect(mongoUri);

    console.log("✅ MongoDB conectado exitosamente");
  } catch (error) {
    console.error("❌ Error conectando a MongoDB:", error);
    process.exit(1);
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    console.log("✅ MongoDB desconectado");
  } catch (error) {
    console.error("❌ Error desconectando MongoDB:", error);
  }
};
