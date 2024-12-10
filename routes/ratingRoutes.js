const express = require("express");
const router = express.Router();
const ratingController = require("../controllers/ratingController");
const verifyToken = require("../middleware/verifyToken");

// Swagger
/**
 * @swagger
 * tags:
 *   name: Rating
 *   description: Endpoint untuk rating dan komentar destinasi
 */

// Tambah Rating
/**
 * @swagger
 * /tambah-rating/{destinasi_id}:
 *   post:
 *     tags:
 *       - Rating
 *     summary: Membuat rating baru
 *     description: Endpoint untuk membuat rating baru
 *     parameters:
 *       - in: path
 *         name: destinasi_id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: number
 *                 description: Nilai rating 1-5
 *               komentar:
 *                 type: string
 *                 description: Ulasan pengguna
 *     responses:
 *       200:
 *         description: Rating berhasil ditambahkan
 *       400:
 *         description: Artikel tidak ditemukan
 *       500:
 *         description: Internal Server Error
 */
router.post(
  "/tambah-rating/:destinasi_id",
  verifyToken,
  ratingController.createRating
);

// Update Rating
/**
 * @swagger
 * /update-rating/{id}:
 *   put:
 *     tags:
 *       - Rating
 *     summary: Memperbarui rating
 *     description: Endpoint untuk memperbarui rating
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: number
 *                 description: Nilai rating 1-5
 *               komentar:
 *                 type: string
 *                 description: Ulasan pengguna
 *     responses:
 *       200:
 *         description: Rating berhasil diperbarui
 *       400:
 *         description: Rating tidak ditemukan
 *       401:
 *         description: Token tidak valid/expired
 *       500:
 *         description: Internal Server Error
 */
router.put("/update-rating/:id", verifyToken, ratingController.updateRating);

// Hapus Rating
/**
 * @swagger
 * /hapus-rating/{id}:
 *   put:
 *     tags:
 *       - Rating
 *     summary: Menghapus rating
 *     description: Endpoint untuk menghapus rating
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Rating berhasil dihapus
 *       400:
 *         description: Rating tidak ditemukan
 *       401:
 *         description: Token tidak valid/expired
 *       500:
 *         description: Internal Server Error
 */
router.put("/hapus-rating/:id", verifyToken, ratingController.deleteRating);

module.exports = router;
