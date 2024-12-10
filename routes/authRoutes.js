const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const verifyToken = require("../middleware/verifyToken");
const verifyAdmin = require("../middleware/verifyAdmin");
const authController = require("../controllers/authController");
const resetPassword = require("../controllers/resetPassword");
require("dotenv").config();
const { google } = require("googleapis");

// Swagger
/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Endpoint untuk autentikasi pengguna
 */

// Register Route
/**
 * @swagger
 * /register:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Mendaftar pengguna baru
 *     description: Endpoint untuk mendaftar pengguna baru
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *             required:
 *               - username
 *               - email
 *               - password
 *     responses:
 *       201:
 *         description: Pengguna berhasil terdaftar
 *       400:
 *         description: Username Already Exists
 *       500:
 *         description: Internal Server Error
 */
router.post(
  "/register",
  [
    body("username")
      .trim()
      .escape()
      .isString()
      .withMessage("Username must be a string")
      .notEmpty()
      .withMessage("Username is required"),
    body("email")
      .isEmail()
      .trim()
      .escape()
      .withMessage("Email must be a valid email address")
      .notEmpty()
      .withMessage("Email is required")
      .normalizeEmail(),
    body("password")
      .isString()
      .withMessage("Password must be a string")
      .trim()
      .isLength({ min: 8 })
      .withMessage("Password harus memiliki minimal 8 karakter.")
      .matches(/[A-Z]/)
      .withMessage("Password harus mengandung setidaknya satu huruf besar.")
      .matches(/[a-z]/)
      .withMessage("Password harus mengandung setidaknya satu huruf kecil.")
      .matches(/\d/)
      .withMessage("Password harus mengandung setidaknya satu angka.")
      .matches(/[@$!%*?&#]/)
      .withMessage(
        "Password harus mengandung setidaknya satu karakter spesial."
      ),
  ],
  authController.register
);

// Login Route
/**
 * @swagger
 * /login:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Login pengguna
 *     description: Endpoint untuk login pengguna
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login berhasil
 *       401:
 *         description: Invalid Password
 *       500:
 *         description: Internal Server Error
 */
router.post(
  "/login",
  [
    body("username")
      .isString()
      .escape()
      .withMessage("Username must be a string"),
    body("password").isString().withMessage("Password must be a string"),
  ],
  authController.login
);

/**
 * @swagger
 * /auth/google:
 *   get:
 *     tags:
 *       - Auth
 *     summary: Login pengguna menggunakan Google
 *     description: Endpoint untuk login pengguna menggunakan Google (Swagger tidak dapat menangani proses redirect dan pertukaran authorization code secara otomatis)
 *     responses:
 *       302:
 *         description: Redirect ke halaman Google untuk login
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Server Error
 */

// Login Google
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

const scopes = [
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
];

const authorizationUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  scope: scopes,
  include_granted_scopes: true,
});

/**
 * @swagger
 * /auth/google:
 *   get:
 *     tags:
 *       - Auth
 *     summary: Login pengguna menggunakan Google
 *     description: Endpoint untuk login pengguna menggunakan Google (Swagger tidak dapat menangani proses redirect dan pertukaran authorization code secara otomatis)
 *     responses:
 *       302:
 *         description: Redirect ke halaman Google untuk login
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Server Error
 */
router.get("/auth/google", async (req, res) => {
  res.redirect(authorizationUrl);
});

router.get("/auth/google/callback", authController.loginGoogle);

// Profil
/**
 * @swagger
 * /users/me:
 *   get:
 *     tags:
 *       - Auth
 *     summary: Mendapatkan profil pengguna
 *     description: Endpoint untuk mendapatkan informasi profil pengguna yang sedang login
 *     responses:
 *       200:
 *         description: Profil pengguna berhasil diambil
 *       401:
 *         description: Token tidak valid atau tidak ada
 *       404:
 *         description: User tidak ditemukan
 *       500:
 *         description: Internal Server Error
 */
router.get("/users/me", verifyToken, authController.getProfile);

// Mengubah  pengguna (admin-only)
/**
 * @swagger
 * /users/{id}/role:
 *   put:
 *     tags:
 *       - Admin
 *     summary: Mengubah role pengguna
 *     description: Endpoint untuk mengubah role pengguna oleh admin
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID pengguna yang akan diubah role-nya
 *         schema:
 *           type: string
 *     requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 role:
 *                   type: string
 *                   enum: [user, admin, author]
 *                   description: Role pengguna yang akan diubah
 *                   example: user
 *     responses:
 *       200:
 *         description: Role pengguna berhasil diubah
 *       401:
 *         description: Token tidak valid atau tidak ada
 *       403:
 *         description: Akses ditolak, hanya admin yang dapat melakukan ini
 */
router.put(
  "/users/:id/role",
  verifyToken,
  verifyAdmin,
  authController.updateRole
);

// Menghapus pengguna (admin-only)
/**
 * @swagger
 * /delete-user:
 *   delete:
 *     tags:
 *       - Admin
 *     summary: Menghapus pengguna
 *     description: Endpoint untuk menghapus pengguna oleh admin
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Pengguna berhasil dihapus
 *       400:
 *         description: ID pengguna tidak diberikan
 *       401:
 *         description: Token tidak valid atau tidak ada
 *       403:
 *         description: Akses ditolak, hanya admin yang dapat melakukan ini
 */
router.delete(
  "/delete-user",
  [body("id").notEmpty().withMessage("ID is required")],
  verifyToken,
  verifyAdmin,
  authController.deleteUser
);

// Logout Route
/**
 * @swagger
 * /logout:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Logout pengguna
 *     description: Endpoint untuk logout pengguna dan menghapus token
 *     responses:
 *       200:
 *         description: Pengguna berhasil logout
 */
router.post("/logout", authController.logout);

// Protected Route
router.get("/protected", verifyToken, authController.getUsers);

// Request Change Password
/**
 * @swagger
 * /change-password:
 *   put:
 *     tags:
 *       - Auth
 *     summary: Mengubah password pengguna
 *     description: Endpoint untuk mengubah password pengguna yang sudah login
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               oldPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password berhasil diubah
 *       400:
 *         description: Password lama tidak sesuai
 *       403:
 *         description: Token tidak valid atau tidak ada
 *       404:
 *         description: User tidak ditemukan
 *       500:
 *         description: Internal Server Error
 */
router.put(
  "/change-password",
  [
    body("password")
      .isString()
      .withMessage("Password must be a string")
      .trim()
      .isLength({ min: 8 })
      .withMessage("Password harus memiliki minimal 8 karakter.")
      .matches(/[A-Z]/)
      .withMessage("Password harus mengandung setidaknya satu huruf besar.")
      .matches(/[a-z]/)
      .withMessage("Password harus mengandung setidaknya satu huruf kecil.")
      .matches(/\d/)
      .withMessage("Password harus mengandung setidaknya satu angka.")
      .matches(/[@$!%*?&#]/)
      .withMessage(
        "Password harus mengandung setidaknya satu karakter spesial."
      ),
  ],
  verifyToken,
  resetPassword.changePassword
);

// Request Reset Password
/**
 * @swagger
 * /request-password:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Meminta reset password
 *     description: Endpoint untuk meminta reset password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Link reset password berhasil dikirim
 *       404:
 *         description: Email tidak ditemukan
 *       500:
 *         description: Internal Server Error
 */
router.post("/request-password", resetPassword.requestResetPassword);

// Reset Password
/**
 * @swagger
 * /reset-password:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Melakukan reset password
 *     description: Endpoint untuk melakukan reset password
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         description: Token yang dikirimkan melalui email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password berhasil direset
 *       400:
 *         description: Token tidak valid atau tidak ada
 *       404:
 *         description: User tidak ditemukan
 *       500:
 *         description: Internal Server Error
 */
router.post(
  "/reset-password",
  [
    body("password")
      .isString()
      .withMessage("Password must be a string")
      .trim()
      .isLength({ min: 8 })
      .withMessage("Password harus memiliki minimal 8 karakter.")
      .matches(/[A-Z]/)
      .withMessage("Password harus mengandung setidaknya satu huruf besar.")
      .matches(/[a-z]/)
      .withMessage("Password harus mengandung setidaknya satu huruf kecil.")
      .matches(/\d/)
      .withMessage("Password harus mengandung setidaknya satu angka.")
      .matches(/[@$!%*?&#]/)
      .withMessage(
        "Password harus mengandung setidaknya satu karakter spesial."
      ),
  ],
  resetPassword.resetPassword
);

module.exports = router;
