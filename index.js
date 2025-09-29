// index.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./src/routes/auth.routes.js";
import { PrismaClient } from "@prisma/client";

dotenv.config();
const app = express();
const prisma = new PrismaClient();

// CORS: permitir frontend de dev (ajusta si tu frontend corre en otra URL)
const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];
app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true); // allow server-to-server, curl, etc
    if (allowedOrigins.indexOf(origin) !== -1) return callback(null, true);
    console.warn("CORS origin blocked:", origin);
    return callback(null, true); // en dev permitimos, en prod cambia a false
  },
  credentials: true,
}));

// Middlewares
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

// Manejo simple de errores (por si algo pasa fuera de rutas)
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err);
  res.status(500).json({ message: "Internal Server Error" });
});

// Iniciar servidor
const PORT = process.env.PORT ? Number(process.env.PORT) : 5000;
app.listen(PORT, async () => {
  try {
    await prisma.$connect();
    console.log("✅ Conectado a MySQL con Prisma");
  } catch (err) {
    console.error("❌ Error al conectar a MySQL:", err);
  }
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
