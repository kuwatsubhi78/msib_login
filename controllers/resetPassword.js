const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const express = require("express");
const pool = require("../config/db");
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET;

// Change Password
const changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const idUser = req.username;

  console.log(idUser);
  if (!oldPassword || !newPassword) {
    return res
      .status(400)
      .json({ message: "Old password and new password are required" });
  }

  try {
    const [rows] = await pool.query(
      "SELECT password FROM users WHERE username = ?",
      [idUser]
    );
    console.log(rows);
    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = rows[0];
    // Verifikasi password lama
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Old password is incorrect" });
    }

    // Hash password baru
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password di database
    await pool.query("UPDATE users SET password = ? WHERE id = ?", [
      hashedPassword,
      idUser,
    ]);

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Request Reset Password
const requestResetPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const [rows] = await pool.query("SELECT id FROM users WHERE email = ?", [
      email,
    ]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Email not found" });
    }

    const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: "15m" });

    const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${token}`;

    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset Request",
      html: `<p>Click <a href="${resetLink}">here</a> to reset your password. This link will expire in 15 minutes.</p>`,
    });

    res.status(200).json({ message: "Reset link sent to your email" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Reset Password
const resetPassword = async (req, res) => {
  const { newPassword, token } = req.body;

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const email = decoded.email;

    const [rows] = await pool.query(
      "SELECT id, password FROM users WHERE email = ?",
      [email]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = rows[0];

    // Validasi password baru
    if (newPassword.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters long",
      });
    }

    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({
        message: "New password cannot be the same as the old password",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.query("UPDATE users SET password = ? WHERE id = ?", [
      hashedPassword,
      user.id,
    ]);

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(400).json({ message: "Token has expired" });
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(400).json({ message: "Invalid token" });
    }

    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  requestResetPassword,
  resetPassword,
  changePassword,
};
