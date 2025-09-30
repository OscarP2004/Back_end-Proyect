// index.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./src/routes/auth.routes.js";
import { PrismaClient } from "@prisma/client";

dotenv.config();
const app = express();
const prisma = new PrismaClient();

// ✅ Lista de orígenes permitidos (agregarás el de Vercel después)
const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "https://tu-dominio-frontend.com" // <-- reemplazar cuando despliegues en Vercel
];

// ✅ Logger para ver desde qué ORIGIN llegan las peticiones
app.use((req, res, next) => {
  console.log("🔎 CORS-Origin recibido:", req.headers.origin);
  next();
});

// ✅ Configuración robusta de CORS
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      console.warn("❌ Bloqueado por CORS:", origin);
      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// ✅ Preflight (OPTIONS) habilitado
app.options("*", cors());

// ✅ Body parser
app.use(express.json({ limit: "10mb" }));

// ✅ Rutas
app.use("/api/auth", authRoutes);

// ✅ Endpoint de prueba
app.get("/api/auth/ping", (req, res) => {
  res.json({ message: "Backend conectado 🚀" });
});

// ✅ Manejador de errores global
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err);
  res.status(500).json({ message: "Internal Server Error" });
});

// ✅ Inicio del servidor
async function start() {
  try {
    console.log("🔌 Intentando conectar a la base de datos...");
    await prisma.$connect();
    console.log("✅ Conectado a MySQL con Prisma");
  } catch (err) {
    console.error("❌ Error al conectar a MySQL:", err);
    process.exit(1);
  }

  const PORT = Number(process.env.PORT) || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://0.0.0.0:${PORT}`);
  });
}

process.on("uncaughtException", (err) => {
  console.error("uncaughtException:", err);
  process.exit(1);
});
process.on("unhandledRejection", (reason) => {
  console.error("unhandledRejection:", reason);
  process.exit(1);
});

start();
