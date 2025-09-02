/*
  Warnings:

  - You are about to drop the column `meaning` on the `Word` table. All the data in the column will be lost.
  - You are about to drop the column `term` on the `Word` table. All the data in the column will be lost.
  - You are about to drop the column `usage` on the `Word` table. All the data in the column will be lost.
  - Added the required column `category` to the `Course` table without a default value. This is not possible if the table is not empty.
  - Added the required column `community` to the `Course` table without a default value. This is not possible if the table is not empty.
  - Added the required column `discussions` to the `Course` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hours` to the `Course` table without a default value. This is not possible if the table is not empty.
  - Added the required column `info` to the `Course` table without a default value. This is not possible if the table is not empty.
  - Added the required column `language` to the `Course` table without a default value. This is not possible if the table is not empty.
  - Added the required column `level` to the `Course` table without a default value. This is not possible if the table is not empty.
  - Added the required column `public` to the `Course` table without a default value. This is not possible if the table is not empty.
  - Added the required column `content` to the `Word` table without a default value. This is not possible if the table is not empty.
  - Added the required column `duration` to the `Word` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `Word` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Word` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Course" ADD COLUMN     "category" TEXT NOT NULL,
ADD COLUMN     "community" TEXT NOT NULL,
ADD COLUMN     "discussions" TEXT NOT NULL,
ADD COLUMN     "hours" TEXT NOT NULL,
ADD COLUMN     "info" TEXT NOT NULL,
ADD COLUMN     "language" TEXT NOT NULL,
ADD COLUMN     "level" TEXT NOT NULL,
ADD COLUMN     "public" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."Word" DROP COLUMN "meaning",
DROP COLUMN "term",
DROP COLUMN "usage",
ADD COLUMN     "content" TEXT NOT NULL,
ADD COLUMN     "duration" TEXT NOT NULL,
ADD COLUMN     "title" TEXT NOT NULL,
ADD COLUMN     "type" TEXT NOT NULL;
