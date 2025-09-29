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
 * Nota: require document (según tu schema docUsuario es UNIQUE y no nulo)
 */
router.post("/register", async (req, res) => {
  try {
    console.log("➡️ /register request body:", req.body);

    const name = normalizeString(req.body.name);
    const document = normalizeString(req.body.document);
    const role = req.body.role; // string ("admin"/"usuario") o number (1/2)
    const email = normalizeString(req.body.email)?.toLowerCase();
    const password = req.body.password;
    const photo = req.body.photo ?? null;

    // Validaciones
    if (!name || !document || !email || !password) {
      console.log("❗ /register missing fields:", { name, document, email, password: !!password });
      return res.status(400).json({ message: "name, document, email y password son obligatorios" });
    }

    // Validar duplicados (email y doc)
    const existingEmail = await prisma.Usuarios.findUnique({ where: { emaUsuario: email } });
    if (existingEmail) {
      console.log("❌ /register email ya registrado:", email);
      return res.status(400).json({ message: "El correo ya está registrado" });
    }

    const existingDoc = await prisma.Usuarios.findUnique({ where: { docUsuario: document } });
    if (existingDoc) {
      console.log("❌ /register documento ya registrado:", document);
      return res.status(400).json({ message: "El documento ya está registrado" });
    }

    // Hash de contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Mapear rol a id numérico si viene como string (ajusta ids si tu DB usa otros)
    let rol_idUsuario = 3; // default "USUARIO" por tu schema si 3 es usuario
    if (role === "admin" || role === "ADMIN" || role === 1) rol_idUsuario = 2; // ajustar si tu tabla roles difiere
    if (role === "usuario" || role === "USUARIO" || role === 3) rol_idUsuario = 3;

    const user = await prisma.Usuarios.create({
      data: {
        nomUsuario: name,
        docUsuario: document,
        emaUsuario: email,
        pasUsuario: hashedPassword,
        rol_idUsuario,
      },
    });

    console.log("✅ /register Usuario creado:", { id: user.idUsuario, email: user.emaUsuario, rol_idUsuario: user.rol_idUsuario });
    return res.status(201).json({ message: "Usuario registrado con éxito", user });
  } catch (err) {
    console.error("❌ Error en /register:", err);
    // devolver detail para depuración (puedes quitar detail en prod)
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

    if (!email || !password) {
      console.log("❗ /login missing fields:", { email, password: !!password });
      return res.status(400).json({ message: "email y password son obligatorios" });
    }

    const user = await prisma.Usuarios.findUnique({
      where: { emaUsuario: email },
    });

    console.log("🔎 /login user found?", !!user, user ? { id: user.idUsuario, emaUsuario: user.emaUsuario } : null);

    if (!user) {
      console.log("❌ /login Usuario no encontrado:", email);
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // Aseguramos que la propiedad de contraseña coincide con el schema (paswUsuario)
    if (!user.pasUsuario) {
      console.error("❌ /login Usuario sin campo de contraseña (paswUsuario) en DB:", { id: user.idUsuario });
      return res.status(500).json({ message: "Usuario inválido en BD (sin contraseña)" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.pasUsuario);
    console.log("🔐 Password válida?", isPasswordValid);

    if (!isPasswordValid) {
      console.log("❌ /login Contraseña incorrecta para userId:", user.idUsuario);
      return res.status(401).json({ message: "Contraseña incorrecta" });
    }

    console.log("✅ /login Login OK userId:", user.idUsuario);
    return res.json({ message: "Login exitoso", user });
  } catch (err) {
    console.error("❌ Error en /login:", err);
    return res.status(500).json({ message: "Error al iniciar sesión", detail: err?.message ?? null });
  }
});

export default router;
