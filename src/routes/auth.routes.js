// src/routes/auth.routes.js
import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const router = Router();
const prisma = new PrismaClient();

console.log("Prisma client keys:", Object.keys(prisma));
console.log("Has 'usuarios' model?:", typeof prisma.usuarios !== "undefined");

function normalizeString(v) {
  return typeof v === "string" ? v.trim() : v;
}

/** Registro */
router.post("/register", async (req, res) => {
  try {
    console.log("➡️ /register request body:", req.body);

    const name = normalizeString(req.body.name);
    const document = normalizeString(req.body.document);
    const role = req.body.role;
    const email = normalizeString(req.body.email)?.toLowerCase();
    const password = req.body.password;
    const photo = req.body.photo ?? null;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "name, email y password son obligatorios" });
    }

    if (!prisma.usuarios) {
      console.error("Prisma model 'usuarios' no disponible. Modelos:", Object.keys(prisma));
      return res.status(500).json({ message: "Prisma model 'usuarios' no disponible" });
    }

    const existingEmail = await prisma.usuarios.findUnique({ where: { emaUsuario: email } });
    if (existingEmail) return res.status(400).json({ message: "El correo ya está registrado" });

    if (document) {
      const existingDoc = await prisma.usuarios.findUnique({ where: { docUsuario: document } });
      if (existingDoc) return res.status(400).json({ message: "El documento ya está registrado" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let rol_idUsuario = 2;
    if (role === "admin" || role === "ADMIN" || role === 1) rol_idUsuario = 1;
    if (role === "usuario" || role === "USUARIO" || role === 2) rol_idUsuario = 2;

    const user = await prisma.usuarios.create({
      data: {
        nomUsuario: name,
        docUsuario: document || "",
        emaUsuario: email,
        pasUsuario: hashedPassword, // <-- USAR pasUsuario
        rol_idUsuario,
      },
    });

    return res.status(201).json({ message: "Usuario registrado con éxito", user });
  } catch (err) {
    console.error("❌ Error en /register:", err);
    return res.status(500).json({ message: "Error al registrar usuario", detail: err?.message ?? null });
  }
});

/** Login */
router.post("/login", async (req, res) => {
  try {
    console.log("➡️ /login request body RAW:", req.body);

    const email = normalizeString(req.body.email)?.toLowerCase();
    const password = req.body.password;
    if (!email || !password) return res.status(400).json({ message: "email y password son obligatorios" });

    if (!prisma.usuarios) {
      console.error("Prisma model 'usuarios' no disponible. Modelos:", Object.keys(prisma));
      return res.status(500).json({ message: "Prisma model 'usuarios' no disponible" });
    }

    const user = await prisma.usuarios.findUnique({ where: { emaUsuario: email } });

    console.log("🔎 /login user found?", !!user, user ? { id: user.idUsuario, emaUsuario: user.emaUsuario } : null);

    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    // <-- USAR exactamente pasUsuario
    const dbPassword = user.pasUsuario ?? null;
    const isPasswordValid = dbPassword ? await bcrypt.compare(password, dbPassword) : false;

    console.log("🔐 Password válida?", isPasswordValid);

    if (!isPasswordValid) return res.status(401).json({ message: "Contraseña incorrecta" });

    return res.json({ message: "Login exitoso", user });
  } catch (err) {
    console.error("❌ Error en /login:", err);
    return res.status(500).json({ message: "Error al iniciar sesión", detail: err?.message ?? null });
  }
});

export default router;
