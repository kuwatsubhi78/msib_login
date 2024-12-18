const express = require("express");
const router = express.Router();
const DestinasiController = require("../controllers/DestinasiController");
const verifyAuthor = require("../middleware/verifyAuthor");
const verifyToken = require("../middleware/verifyToken");
const { body, validationResult } = require("express-validator");
const { upload } = require("../middleware/multer");

// Swagger
/**
 * @swagger
 * tags:
 *   name: Destinasi
 *   description: Endpoint untuk destinasi
 */

// Rute untuk mendapatkan semua destinasi
/**
 * @swagger
 * /destinasi:
 *   get:
 *     tags:
 *       - Destinasi
 *     summary: Mendapatkan semua destinasi
 *     description: Endpoint untuk mendapatkan semua destinasi
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan semua destinasi
 *       500:
 *         description: Internal Server Error
 */
router.get("/destinasi", DestinasiController.getAllDestinasi);

// Rute untuk mendapatkan destinasi berdasarkan ID
/**
 * @swagger
 * /destinasi/{id}:
 *   get:
 *     tags:
 *       - Destinasi
 *     summary: Mendapatkan destinasi berdasarkan ID
 *     description: Endpoint untuk mendapatkan destinasi berdasarkan ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan destinasi berdasarkan ID
 *       404:
 *         description: Destinasi tidak ditemukan
 *       500:
 *         description: Internal Server Error
 */
router.get("/destinasi/:id", DestinasiController.getDestinasiById);

// Rute untuk menambahkan destinasi
/**
 * @swagger
 * /destinasi:
 *   post:
 *     tags:
 *       - Destinasi
 *       - Admin
 *     summary: Menambahkan destinasi baru
 *     description: Endpoint untuk menambahkan destinasi baru
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nama destinasi
 *               description:
 *                 type: string
 *                 description: Deskripsi destinasi
 *               location:
 *                 type: string
 *                 description: Lokasi destinasi
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Gambar destinasi
 *     responses:
 *       201:
 *         description: Destinasi berhasil ditambahkan
 *       400:
 *         description: Bad Request
 *       403:
 *         description: Unauthorized
 *       500:
 *         description: Internal Server Error
 */
router.post(
  "/destinasi",
  upload.array("images", 5),
  [
    body("name")
      .isString()
      .trim()
      .notEmpty()
      .withMessage("Name is required")
      .bail()
      .isLength({ min: 1, max: 100 })
      .withMessage("Name must be between 1 and 100 characters"),
    body("description")
      .isString()
      .trim()
      .notEmpty()
      .withMessage("Description is required")
      .bail(),
    body("location")
      .isString()
      .trim()
      .notEmpty()
      .withMessage("Location is required")
      .bail()
      .isLength({ min: 1, max: 100 })
      .withMessage("Location must be between 1 and 100 characters"),
  ],
  verifyToken,
  verifyAuthor,
  DestinasiController.createDestinasi
);

// Rute untuk mengupdate destinasi berdasarkan ID
/**
 * @swagger
 * /update-destinasi/{id}:
 *   patch:
 *     tags:
 *       - Destinasi
 *       - Admin
 *     summary: Mengupdate destinasi berdasarkan ID
 *     description: Endpoint untuk mengupdate destinasi berdasarkan ID
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
 *               name:
 *                 type: string
 *                 description: Nama destinasi
 *               description:
 *                 type: string
 *                 description: Deskripsi destinasi
 *               location:
 *                 type: string
 *                 description: Lokasi destinasi
 *               oldImages:
 *                 type: array
 *                 items:
 *                   type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Gambar destinasi
 *     responses:
 *       200:
 *         description: Destinasi berhasil diupdate
 *       400:
 *         description: Bad Request
 *       404:
 *         description: Destinasi tidak ditemukan
 *       500:
 *         description: Terjadi Kesalahan di Server
 */
router.patch(
  "/update-destinasi/:id",
  upload.array("images", 5),
  [
    body("name")
      .isString()
      .trim()
      .notEmpty()
      .withMessage("Name is required")
      .bail()
      .isLength({ min: 1, max: 100 })
      .withMessage("Name must be between 1 and 100 characters"),
    body("description")
      .isString()
      .trim()
      .notEmpty()
      .withMessage("Description is required")
      .bail(),
    body("location")
      .isString()
      .trim()
      .notEmpty()
      .withMessage("Location is required")
      .bail()
      .isLength({ min: 1, max: 100 })
      .withMessage("Location must be between 1 and 100 characters"),
  ],
  verifyToken,
  verifyAuthor,
  DestinasiController.updateDestinasi
);

// Rute untuk menghapus destinasi berdasarkan ID
/**
 * @swagger
 * /destinasi/{id}:
 *   put:
 *     tags:
 *       - Destinasi
 *       - Admin
 *     summary: Menghapus destinasi berdasarkan ID
 *     description: Endpoint untuk menghapus destinasi berdasarkan ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Destinasi berhasil dihapus
 *       404:
 *         description: Destinasi tidak ditemukan
 *       403:
 *         description: Unauthorized
 *       500:
 *         description: Internal Server Error
 */
router.put(
  "/destinasi/:id",
  verifyToken,
  verifyAuthor,
  DestinasiController.deleteDestinasi
);

// rute untuk mmenghapus gambar destinasi
/**
 * @swagger
 * /destinasi/{id}/image:
 *   put:
 *     tags:
 *       - Destinasi
 *       - Admin
 *     summary: Menghapus gambar destinasi berdasarkan ID
 *     description: Endpoint untuk menghapus gambar destinasi berdasarkan ID
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
 *         description: Gambar destinasi berhasil dihapus
 *       404:
 *         description: Gambar destinasi tidak ditemukan
 *       403:
 *         description: Unauthorized
 *       500:
 *         description: Internal Server Error
 */
router.put(
  "/destinasi/:id/image",
  verifyToken,
  verifyAuthor,
  DestinasiController.deleteImageDestinasi
);

module.exports = router;
