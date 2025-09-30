// index.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./src/routes/auth.routes.js";
import { PrismaClient } from "@prisma/client";

dotenv.config();
const app = express();
const prisma = new PrismaClient();

// 🛰️ Logger de Requests
app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.url} | Origin: ${req.headers.origin || "N/A"}`);
  next();
});

// 🔓 CORS LIBRE PARA PRUEBAS (LOCAL + RENDER)
app.use(
  cors({
    origin: "*", // ⚠️ SOLO PARA DESARROLLO - LUEGO CAMBIAR A ["http://localhost:3000", "https://tu-vercel.com"]
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ✅ Manejo preflight
app.options("*", cors());

// ✅ Body parser
app.use(express.json({ limit: "10mb" }));

// ✅ Rutas de autenticación
app.use("/api/auth", authRoutes);

// ✅ Endpoint de prueba
app.get("/ping", (req, res) => {
  res.json({ message: "Backend vivo ✅" });
});

// ✅ Manejador de errores global
app.use((err, req, res, next) => {
  console.error("🔥 ERROR NO MANEJADO:", err);
  res.status(500).json({ message: "Error interno del servidor" });
});

// 🚀 Inicio del servidor
async function start() {
  try {
    console.log("🧠 Conectando a MySQL...");
    await prisma.$connect();
    console.log("✅ Conectado a MySQL");
  } catch (err) {
    console.error("❌ Error conexión MySQL:", err);
    process.exit(1);
  }

  const PORT = Number(process.env.PORT) || 5000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Backend corriendo en http://localhost:${PORT}`);
  });
}

start();
