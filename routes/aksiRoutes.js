const express = require("express");
const router = express.Router();
const aksiController = require("../controllers/aksiController");
const verifyToken = require("../middleware/verifyToken");

// Swagger
/**
 * @swagger
 * tags:
 *   name: Aksi
 *   description: Endpoint untuk LIKE artikel atau destinasi
 */

// Aksi like
/**
 * @swagger
 * /suka/{id}:
 *   post:
 *     tags:
 *       - Aksi
 *     summary: Memberi respon LIKE artikel atau destinasi
 *     description: Endpoint untuk memberi respon LIKE artikel atau destinasi
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Aksi berhasil ditambahkan
 *       500:
 *         description: Internal Server Error
 */
router.post("/suka/:id", verifyToken, aksiController.aksiLike);

// Aksi Saves
/**
 * @swagger
 * /save/{id}:
 *   post:
 *     tags:
 *       - Aksi
 *     summary: Memberi respon SIMPAN artikel atau destinasi
 *     description: Endpoint untuk memberi respon SIMPAN artikel atau destinasi
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Aksi berhasil ditambahkan
 *       403:
 *         description: Unauthorized
 *       500:
 *         description: Internal Server Error
 */
router.post("/save/:id", verifyToken, aksiController.aksiSave);

module.exports = router;
