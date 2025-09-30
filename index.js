// index.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./src/routes/auth.routes.js";
import { PrismaClient } from "@prisma/client";

dotenv.config();
const app = express();
const prisma = new PrismaClient();

// CORS (ajusta si añades dominio de frontend desplegado)
const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];
app.use(cors({
  origin: ["*"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

app.use(express.json({ limit: "10mb" }));

// Logging simple de peticiones
app.use((req, res, next) => {
  console.log(new Date().toISOString(), req.method, req.url);
  next();
});

// Rutas
app.use("/api/auth", authRoutes);

// Endpoint de prueba
app.get("/api/auth/ping", (req, res) => {
  res.json({ message: "Backend conectado 🚀" });
});

// Error handler básico
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err);
  res.status(500).json({ message: "Internal Server Error" });
});

// START: conecta a la DB primero (fallar rápido si DB inaccesible)
async function start() {
  try {
    console.log("🔌 Intentando conectar a la base de datos...");
    await prisma.$connect();
    console.log("✅ Conectado a MySQL con Prisma");
  } catch (err) {
    console.error("❌ Error al conectar a MySQL:", err);
    // si no puedes conectar a la DB en producción, mejor salir con código != 0
    process.exit(1);
  }

  const portEnv = process.env.PORT;
  const PORT = portEnv ? Number(portEnv) : 5000;
  if (!Number.isFinite(PORT)) {
    console.error("❌ PORT inválido:", process.env.PORT);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://0.0.0.0:${PORT}`);
  });
}

// Mejores logs para errores no capturados
process.on("uncaughtException", (err) => {
  console.error("uncaughtException:", err);
  process.exit(1);
});
process.on("unhandledRejection", (reason) => {
  console.error("unhandledRejection:", reason);
  process.exit(1);
});

start();
