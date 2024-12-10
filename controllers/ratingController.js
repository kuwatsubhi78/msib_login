const pool = require("../config/db");
const { validationResult } = require("express-validator");

// Tambah Rating
const createRating = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    try {
      const { destinasi_id } = req.params;
      const { rating, komentar } = req.body;
      const { username } = req;

      await connection.beginTransaction();

      const [user] = await pool.query(
        "SELECT id FROM users WHERE username = ?",
        [username]
      );
      const user_id = user[0].id;

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const [existingDestinasi] = await pool.query(
        "SELECT * FROM destinasi WHERE id = ?",
        [destinasi_id]
      );

      if (existingDestinasi.length === 0) {
        return res.status(400).json({ message: "Destination not found" });
      }

      const [rows] = await pool.query(
        "INSERT INTO rating (id, user_id, destinasi_id, rating, komentar) VALUES ( UUID(), ?, ?, ?, ?)",
        [user_id, destinasi_id, rating, komentar]
      );

      await pool.query(
        `UPDATE destinasi
        SET 
            jumlah_rating = (
                SELECT COUNT(*)
                FROM rating
                WHERE rating.destinasi_id = destinasi.id AND deleted_at IS NULL
            ),
            average_rating = (
                SELECT IFNULL(AVG(rating), 0)
                FROM rating
                WHERE rating.destinasi_id = destinasi.id AND deleted_at IS NULL
            )
        WHERE id = ?`,
        [destinasi_id]
      );

      await connection.commit();
      res.status(200).json({ message: "Rating created successfully" });
    } catch (error) {
      await connection.rollback();
      console.error(error);
      res.status(500).json({ message: "Internal Server Error" });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Update Rating
const updateRating = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    try {
      const { id } = req.params;
      const { rating, komentar } = req.body;
      const { username } = req;

      await connection.beginTransaction();

      const [user] = await pool.query(
        "SELECT id, role FROM users WHERE username = ?",
        [username]
      );
      const user_id = user[0].id;

      const [existingRating] = await pool.query(
        "SELECT * FROM rating WHERE id = ?",
        [id]
      );
      if (existingRating.length === 0) {
        return res.status(400).json({ message: "Rating not found" });
      }

      const destinasi_id = existingRating[0].destinasi_id;
      if (user_id !== existingRating[0].user_id && user[0].role !== "admin") {
        return res.status(400).json({ message: "Not Valid User" });
      }

      const [rows] = await pool.query(
        "UPDATE rating SET rating = ?, komentar = ? WHERE id = ? AND user_id = ?",
        [rating, komentar, id, user_id]
      );

      await pool.query(
        `UPDATE destinasi
        SET
            jumlah_rating = (
                SELECT COUNT(*)
                FROM rating
                WHERE rating.destinasi_id = destinasi.id  AND rating.deleted_at IS NULL
            ),
            average_rating = (
                SELECT IFNULL(AVG(rating), 0)
                FROM rating
                WHERE rating.destinasi_id = destinasi.id AND rating.deleted_at IS NULL
            )
        WHERE id = ?`,
        [destinasi_id]
      );

      await connection.commit();
      res.status(200).json({ message: "Rating updated successfully" });
    } catch (error) {
      await connection.rollback();
      console.error(error);
      res.status(500).json({ message: "Internal Server Error" });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Hapus Rating
const deleteRating = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    try {
      const { id } = req.params;
      const { username } = req;

      await connection.beginTransaction();

      const [user] = await pool.query(
        "SELECT id, role FROM users WHERE username = ?",
        [username]
      );
      const user_id = user[0].id;

      const [existingRating] = await pool.query(
        "SELECT * FROM rating WHERE id = ? && user_id = ?",
        [id, user_id]
      );
      if (existingRating.length === 0) {
        return res.status(400).json({ message: "Rating not found" });
      }

      const destinasi_id = existingRating[0].destinasi_id;
      if (user_id !== existingRating[0].user_id && user[0].role !== "admin") {
        return res.status(400).json({ message: "Not Valid User" });
      }

      const [rows] = await pool.query(
        "UPDATE rating SET deleted_at = NOW() WHERE id = ? AND user_id = ?",
        [id, user_id]
      );

      await pool.query(
        `UPDATE destinasi
        SET
            jumlah_rating = (
                SELECT COUNT(*)
                FROM rating
                WHERE rating.destinasi_id = destinasi.id AND rating.deleted_at IS NULL
            ),
            average_rating = (
                SELECT IFNULL(AVG(rating), 0)
                FROM rating
                WHERE rating.destinasi_id = destinasi.id AND rating.deleted_at IS NULL
            )
        WHERE id = ?`,
        [destinasi_id]
      );

      await connection.commit();
      res.status(200).json({ message: "Rating deleted successfully" });
    } catch (error) {
      await connection.rollback();
      console.error(error);
      res.status(500).json({ message: "Internal Server Error" });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = { createRating, updateRating, deleteRating };
