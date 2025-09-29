/*
  Warnings:

  - You are about to drop the column `paswUsuario` on the `Usuarios` table. All the data in the column will be lost.
  - Added the required column `pasUsuario` to the `Usuarios` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Usuarios` DROP COLUMN `paswUsuario`,
    ADD COLUMN `pasUsuario` VARCHAR(250) NOT NULL;
