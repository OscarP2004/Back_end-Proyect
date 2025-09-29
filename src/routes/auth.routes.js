// src/routes/auth.routes.js
import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const router = Router();
const prisma = new PrismaClient();

// Helper: normalizar datos entrantes
function normalizeString(v) {
  return typeof v === "string" ? v.trim() : v;
}

/**
 * Registro
 * Espera: { name, document, role, email, password, photo? }
 */
router.post("/register", async (req, res) => {
  try {
    console.log("➡️ /register request body:", req.body);

    const name = normalizeString(req.body.name);
    const document = normalizeString(req.body.document);
    const role = req.body.role; // puede ser string ("admin"/"usuario") o number (1/2)
    const email = normalizeString(req.body.email)?.toLowerCase();
    const password = req.body.password;
    const photo = req.body.photo ?? null;

    if (!name || !email || !password) {
      console.log("❗ /register missing fields:", { name, email, password: !!password });
      return res.status(400).json({ message: "name, email y password son obligatorios" });
    }

    // Validar duplicados (email y doc)
    const existingEmail = await prisma.usuarios.findUnique({ where: { emaUsuario: email } });
    if (existingEmail) {
      console.log("❌ /register email ya registrado:", email);
      return res.status(400).json({ message: "El correo ya está registrado" });
    }

    if (document) {
      const existingDoc = await prisma.usuarios.findUnique({ where: { docUsuario: document } });
      if (existingDoc) {
        console.log("❌ /register documento ya registrado:", document);
        return res.status(400).json({ message: "El documento ya está registrado" });
      }
    }

    // Hash de contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Mapear rol a id numérico si viene como string
    let rol_idUsuario = 2; // default "usuario"
    if (role === "admin" || role === "ADMIN" || role === 1) rol_idUsuario = 1;
    if (role === "usuario" || role === "USUARIO" || role === 2) rol_idUsuario = 2;

    const user = await prisma.usuarios.create({
      data: {
        nomUsuario: name,
        docUsuario: document || "", // si DB requiere unique, pasar vacío si no viene (mejor proveer document)
        emaUsuario: email,
        pasUsuario: hashedPassword,
        rol_idUsuario,
        // fecha_creacionUsuario se llena por defecto en BD si está en schema
      },
    });

    console.log("✅ /register Usuario creado:", { id: user.idUsuario, email: user.emaUsuario, rol_idUsuario: user.rol_idUsuario });
    return res.status(201).json({ message: "Usuario registrado con éxito", user });
  } catch (err) {
    console.error("❌ Error en /register:", err);
    return res.status(500).json({ message: "Error al registrar usuario", detail: err?.message ?? null });
  }
});

/**
 * Login
 * Espera: { email, password }
 */
router.post("/login", async (req, res) => {
  try {
    console.log("➡️ /login request body RAW:", req.body);
    const email = normalizeString(req.body.email)?.toLowerCase();
    const password = req.body.password;

    console.log("🧪 Email recibido:", email, "Password recibido:", password ? "SI" : "NO");

    const user = await prisma.usuarios.findUnique({
      where: { emaUsuario: email },
    });

    console.log("🔎 /login user found?", !!user);

    const isPasswordValid = user ? await bcrypt.compare(password, user.pasUsuario) : null;
    console.log("🔐 Password válida?", isPasswordValid);

    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });
    if (!isPasswordValid) return res.status(401).json({ message: "Contraseña incorrecta" });

    return res.json({ message: "Login exitoso", user });
  } catch (err) {
    console.error("❌ Error en /login:", err);
    return res.status(500).json({ message: "Error al iniciar sesión", detail: err?.message ?? null });
  }
})
;
