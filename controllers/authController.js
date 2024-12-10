const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const { validationResult } = require("express-validator");
const { google } = require("googleapis");
dotenv.config();

// Register Route
const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, email, role, password } = req.body;
  const userRole = role || "user";

  try {
    const [existingUser] = await pool.query(
      "SELECT * FROM users WHERE email = ? OR username = ? LIMIT 1",
      [email, username]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({
        message:
          existingUser[0].email === email
            ? "Email already exists"
            : "Username already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      "INSERT INTO users (id, username, email, password, role) VALUES (UUID(), ?, ?, ?, ?)",
      [username, email, hashedPassword, userRole]
    );

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error("Error in register route:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Login Route
const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, password } = req.body;

  try {
    const [users] = await pool.query(`SELECT * FROM users WHERE username = ?`, [
      username,
    ]);

    if (users.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = users[0];
    const passwordIsValid = await bcrypt.compare(password, user.password);

    if (!passwordIsValid) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const token = jwt.sign(
      { username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.cookie("TajaMentawai", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.status(200).json({ message: "Login successful" });
  } catch (err) {
    console.error("Error in login route:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Login Google
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);
const loginGoogle = async (req, res) => {
  const { code } = req.query;

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({
      auth: oauth2Client,
      version: "v2",
    });

    const { data } = await oauth2.userinfo.get();

    if (!data.email || !data.name) {
      return res.status(404).send("User not found");
    }

    const [users] = await pool.query("SELECT * FROM users WHERE email = ?", [
      data.email,
    ]);

    if (users.length === 0) {
      await pool.query(
        "INSERT INTO users (id, username, email, password, role) VALUES (UUID(), ?, ?, ?, ?)",
        [data.name, data.email, "Password@123", "user"]
      );
    }
    const token = jwt.sign({ username: data.name }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });

    res.cookie("TajaMentawai", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.json({ message: "Login successful", user: data });
    // res.redirect("http://localhost:5173/protected");
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Error");
  }
};

// Mengambil data pengguna yang login
const getProfile = async (req, res) => {
  try {
    // Query database untuk mencari pengguna berdasarkan ID
    const [rows] = await pool.query(
      "SELECT * FROM users WHERE username = ? LIMIT 1",
      [req.username] // req.userId berasal dari middleware verifyToken
    );

    // Jika tidak ada hasil, kembalikan respons 404
    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // Ambil data pengguna pertama
    const user = rows[0];

    // Kirim data pengguna
    return res.status(200).json(user);
  } catch (err) {
    console.error("Error fetching profile:", err.message); // Logging untuk debugging
    return res.status(500).json({ message: "Failed to fetch user data" });
  }
};

// Mengambil semua data pengguna
const getUsers = async (req, res) => {
  try {
    const [users] = await pool.query(`
      SELECT * FROM users`);
    res.json({
      message: "Access granted!",
      users: users,
    });
  } catch (err) {
    console.error("Error in protected route:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Mengupdate role pengguna
const updateRole = async (req, res) => {
  const { id } = req.params;
  const { role, idAdmin } = req.body;

  // Validasi role yang diterima
  const validRoles = ["user", "admin", "author"];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ message: "Invalid role provided." });
  }

  // Cegah admin mengubah rolenya sendiri
  if (id === idAdmin) {
    return res
      .status(403)
      .json({ message: "You cannot change your own role." });
  }

  try {
    // Eksekusi query untuk memperbarui role pengguna
    const [result] = await pool.query(
      "UPDATE users SET role = ? WHERE id = ?",
      [role, id]
    );

    // Cek apakah ada baris yang diupdate
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    res.json({ message: "Role updated successfully." });
  } catch (err) {
    console.error("Error updating role:", err.message);
    res
      .status(500)
      .json({ message: "An error occurred while updating the role." });
  }
};

// Menghapus pengguna (admin-only)
const deleteUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: "Invalid request" });
  }

  const { id } = req.body;

  try {
    // Cek apakah pengguna dengan username yang diberikan ada
    const [users] = await pool.query("SELECT * FROM users WHERE id = ?", [id]);

    if (users.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // Menghapus pengguna
    await pool.query("DELETE FROM users WHERE id = ?", [id]);

    res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("Error in delete-user route:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Logout
const logout = (req, res) => {
  res.clearCookie("TajaMentawai", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 0,
  });
  res.status(200).json({ message: "Logged out successfully" });
};

module.exports = {
  getProfile,
  getUsers,
  register,
  login,
  loginGoogle,
  updateRole,
  deleteUser,
  logout,
};
