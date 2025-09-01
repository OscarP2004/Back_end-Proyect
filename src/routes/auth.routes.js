// src/routes/auth.routes.js
import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const router = Router();
const prisma = new PrismaClient();

// Registro
router.post("/register", async (req, res) => {
  try {
    const { name, document, role, email, password } = req.body;

    if (!name || !document || !email || !password) {
      return res.status(400).json({ message: "Todos los campos son obligatorios" });
    }

    // Validar duplicados
    const existingUser = await prisma.usuarios.findUnique({
      where: { emaUsuario: email },
    });
    if (existingUser) {
      return res.status(400).json({ message: "El correo ya está registrado" });
    }

    const existingDoc = await prisma.usuarios.findUnique({
      where: { docUsuario: document },
    });
    if (existingDoc) {
      return res.status(400).json({ message: "El documento ya está registrado" });
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario
    const user = await prisma.usuarios.create({
      data: {
        nomUsuario: name,
        docUsuario: document,
        emaUsuario: email,
        pasUsuario: hashedPassword,
        rol_idUsuario: role || 2, // Si no se envía, queda "usuario normal"
      },
    });

    res.status(201).json({ message: "✅ Usuario registrado con éxito", user });
  } catch (err) {
    console.error("❌ Error en /register:", err);
    res.status(500).json({ message: "Error al registrar usuario" });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.usuarios.findUnique({
      where: { emaUsuario: email },
    });
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.pasUsuario);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Contraseña incorrecta" });
    }

    res.json({ message: "✅ Login exitoso", user });
  } catch (err) {
    console.error("❌ Error en /login:", err);
    res.status(500).json({ message: "Error al iniciar sesión" });
  }
});

export default router;
