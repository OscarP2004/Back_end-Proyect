// index.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./src/routes/auth.routes.js";
import { PrismaClient } from "@prisma/client";

dotenv.config();
const app = express();
const prisma = new PrismaClient();

app.use((req, res, next) => {
  console.log("🛰️ Request:", req.method, req.url, "Origin:", req.headers.origin);
  next();
});

// 🔓 CORS LIBRE (PRUEBA)
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ✅ Preflight
app.options("*", cors());

app.use(express.json({ limit: "10mb" }));

app.use("/api/auth", authRoutes);

app.get("/api/auth/ping", (req, res) => {
  res.json({ message: "Backend conectado 🚀" });
});

app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err);
  res.status(500).json({ message: "Internal Server Error" });
});

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

start();
