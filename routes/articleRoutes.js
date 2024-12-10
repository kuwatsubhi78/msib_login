const express = require("express");
const articleController = require("../controllers/articleController");
const router = express.Router();
const verifyToken = require("../middleware/verifyToken");
const { upload } = require("../middleware/multer");
const verifyAuthor = require("../middleware/verifyAuthor");
const { body } = require("express-validator");

// swagger
/**
 * @swagger
 * tags:
 *   name: Article
 *   description: Endpoint untuk artikel
 */

// Tambah Artikel
/**
 * @swagger
 * /tambah-artikel:
 *   post:
 *     tags:
 *       - Article
 *       - Admin
 *     summary: Membuat artikel baru
 *     description: Endpoint untuk membuat artikel baru
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               author_id:
 *                 type: string
 *                 description: ID author
 *               title:
 *                 type: string
 *                 description: Judul artikel
 *               content:
 *                 type: string
 *                 description: Konten artikel
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Gambar artikel
 *     responses:
 *       200:
 *         description: Artikel berhasil ditambahkan
 *       401:
 *         description: Token tidak valid atau tidak ada
 *       403:
 *         description: Akses ditolak, hanya author yang dapat melakukan ini
 *       500:
 *         description: Internal Server Error
 */
router.post(
  "/tambah-artikel",
  [
    body("title")
      .isString()
      .escape()
      .notEmpty()
      .withMessage("Title is required"),
    body("content")
      .isString()
      .escape()
      .notEmpty()
      .withMessage("Content is required"),
  ],
  verifyToken, // Middleware JWT
  verifyAuthor,
  upload.array("images", 5), // Maksimal 5 file
  articleController.addArticle
);

// Semua Artikel
/**
 * @swagger
 * /artikel:
 *   get:
 *     tags:
 *       - Article
 *     summary: Mendapatkan semua artikel
 *     description: Endpoint untuk mendapatkan semua artikel
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan semua artikel
 *       500:
 *         description: Internal Server Error
 */
router.get("/artikel", articleController.getAllArticles);

// Menampilkan Artikel berdasarkan Author
/**
 * @swagger
 * /artikel/author/{author_id}:
 *   get:
 *     tags:
 *       - Article
 *     summary: Mendapatkan artikel berdasarkan author
 *     description: Endpoint untuk mendapatkan artikel berdasarkan author
 *     parameters:
 *       - in: path
 *         name: author_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan artikel berdasarkan author
 *       404:
 *         description: Artikel tidak ditemukan
 *       500:
 *         description: Internal Server Error
 */
router.get("/artikel/author/:author_id", articleController.getArticlesByAuthor);

// Detail Artikel berdasarkan ID
/**
 * @swagger
 * /artikel/{id}:
 *   get:
 *     tags:
 *       - Article
 *     summary: Mendapatkan artikel berdasarkan ID
 *     description: Endpoint untuk mendapatkan artikel berdasarkan ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan artikel berdasarkan ID
 *       404:
 *         description: Artikel tidak ditemukan
 *       500:
 *         description: Internal Server Error
 */
router.get("/artikel/:id", articleController.getArticleById);

// Update Artikel
/**
 * @swagger
 * /update-artikel/{id}:
 *   patch:
 *     tags:
 *       - Article
 *       - Admin
 *     summary: Mengupdate artikel
 *     description: Endpoint untuk mengupdate artikel
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               oldImages:
 *                 type: array
 *                 items:
 *                   type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Artikel berhasil diupdate
 *       400:
 *         description: Artikel tidak ditemukan
 *       404:
 *         description: Gagal mengupdate artikel
 *       500:
 *         description: Internal Server Error
 */
router.patch(
  "/update-artikel/:id",
  verifyToken, // Middleware JWT
  verifyAuthor,
  upload.array("images", 5), // Maksimal 5 file
  articleController.updateArtikel
);

// Hapus Artikel
/**
 * @swagger
 * /delete-artikel:
 *   delete:
 *     tags:
 *       - Article
 *       - Admin
 *     summary: Menghapus artikel
 *     description: Endpoint untuk menghapus artikel
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               author_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Artikel berhasil dihapus
 *       400:
 *         description: Artikel tidak ditemukan
 *       404:
 *         description: Gagal menghapus artikel
 *       500:
 *         description: Internal Server Error
 */
router.delete(
  "/delete-artikel",
  verifyToken,
  verifyAuthor,
  articleController.deleteArticle
);

// Hapus Gambar Artikel
/**
 * @swagger
 * /artikel/{id}/delete-image:
 *   delete:
 *     tags:
 *       - Article
 *       - Admin
 *     summary: Menghapus gambar artikel
 *     description: Endpoint untuk menghapus gambar artikel
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
 *               gambar:
 *                 type: string
 *     responses:
 *       200:
 *         description: Gambar artikel berhasil dihapus
 *       400:
 *         description: Gambar artikel tidak ditemukan
 *       500:
 *         description: Internal Server Error
 */
router.delete(
  "/artikel/:id/delete-image",
  verifyToken, // Middleware JWT
  verifyAuthor,
  articleController.deleteArticleImage
);

module.exports = router;
