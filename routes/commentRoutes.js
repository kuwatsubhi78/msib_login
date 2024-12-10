const express = require("express");
const router = express.Router();
const commentController = require("../controllers/commentController");
const verifyToken = require("../middleware/verifyToken");
const { body } = require("express-validator");

// Swagger
/**
 * @swagger
 * tags:
 *   name: Comment
 *   description: Endpoint untuk komentar
 */

// Tambah Komentar
/**
 * @swagger
 * /tambah-komentar/{article_id}:
 *   post:
 *     tags:
 *       - Comment
 *       - Admin
 *     summary: Membuat komentar baru
 *     description: Endpoint untuk membuat komentar baru
 *     parameters:
 *       - in: path
 *         name: article_id
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
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Berhasil membuat komentar baru
 *       400:
 *         description: ID Artikel/User tidak valid
 *       403:
 *         description: Token tidak valid atau tidak ada
 *       500:
 *         description: Terjadi kesalahan pada server
 */
router.post(
  "/tambah-komentar/:article_id",
  [
    body("content")
      .isString()
      .escape()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage("Content must be between 1 and 100 characters"),
  ],
  verifyToken,
  commentController.addComment
);

// Hapus Komentar
/**
 * @swagger
 * /hapus-komentar/{id}:
 *   put:
 *     tags:
 *       - Comment
 *       - Admin
 *     summary: Menghapus komentar
 *     description: Endpoint untuk menghapus komentar
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Komentar berhasil dihapus
 *       400:
 *         description: Komentar tidak ditemukan
 *       401:
 *         description: Token tidak valid atau tidak ada
 *       500:
 *         description: Terjadi kesalahan pada server
 */
router.put("/hapus-komentar/:id", verifyToken, commentController.deleteComment);

// Update Komentar
/**
 * @swagger
 * /update-komentar/{id}:
 *   patch:
 *     tags:
 *       - Comment
 *       - Admin
 *     summary: Mengupdate komentar
 *     description: Endpoint untuk mengupdate komentar
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
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Komentar berhasil diupdate
 *       400:
 *         description: Komentar tidak ditemukan
 *       401:
 *         description: Token tidak valid atau tidak ada
 *       500:
 *         description: Terjadi kesalahan pada server
 */
router.patch(
  "/update-komentar/:id",
  [
    body("content")
      .isString()
      .escape()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage("Content must be between 1 and 100 characters"),
  ],
  verifyToken,
  commentController.updateComment
);

module.exports = router;
