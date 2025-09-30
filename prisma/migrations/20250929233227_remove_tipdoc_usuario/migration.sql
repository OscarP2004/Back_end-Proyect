/*
  Warnings:

  - You are about to drop the column `apeUsuario` on the `Usuarios` table. All the data in the column will be lost.
  - You are about to drop the column `tipdocUsuario` on the `Usuarios` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Usuarios` DROP COLUMN `apeUsuario`,
    DROP COLUMN `tipdocUsuario`;
