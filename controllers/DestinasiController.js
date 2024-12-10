const pool = require("../config/db");
const path = require("path");
const fs = require("fs");
const { validationResult } = require("express-validator");

// Get All Destinasi
const getAllDestinasi = async (req, res) => {
  // try {
  //   const connection = await pool.getConnection();

  //   try {
  //     await connection.beginTransaction();

  //     const [rows] = await connection.query(
  //       `UPDATE destinasi
  //        SET average_rating = (
  //            SELECT IFNULL(AVG(rating), 0)
  //            FROM rating
  //            WHERE rating.destinasi_id = destinasi.id
  //        )`
  //     );

  //     await connection.commit();
  //     res.status(200).json({
  //       message: "Data destinasi berhasil diperbarui.",
  //     });
  //   } catch (error) {
  //     await connection.rollback();
  //     throw error;
  //   } finally {
  //     connection.release();
  //   }
  // } catch (error) {
  //   res.status(500).json({
  //     message: "Terjadi kesalahan pada server.",
  //     error: error.message,
  //   });
  // }

  try {
    const [results] = await pool.query(`
      SELECT 
          d.id AS destinasi_id,
          d.name AS destinasi_name,
          d.description AS destinasi_description,
          d.location AS destinasi_location,
          d.gambar AS destinasi_gambar,
          d.average_rating AS destinasi_average_rating,
          d.jumlah_rating AS destinasi_jumlah_rating,
          d.created_at AS destinasi_created_at,
          d.updated_at AS destinasi_updated_at,
          JSON_OBJECT('id', u.id, 'username', u.username) AS created_by,
          JSON_ARRAYAGG(
            JSON_OBJECT(
              'id', r.id,
              'rating', r.rating,
              'komentar', r.komentar,
              'created_at', r.created_at,
              'updated_at', r.updated_at,
              'user', JSON_OBJECT('id', ru.id, 'username', ru.username)
            )
          ) AS ratings
      FROM destinasi d
      LEFT JOIN users u ON d.created_by = u.id
      LEFT JOIN rating r ON d.id = r.destinasi_id AND r.deleted_at IS NULL
      LEFT JOIN users ru ON r.user_id = ru.id
      WHERE d.deleted_at IS NULL
      GROUP BY d.id;
    `);

    const destinasi = results.map((result) => ({
      destinasi_id: result.destinasi_id,
      destinasi_name: result.destinasi_name,
      destinasi_description: result.destinasi_description,
      destinasi_location: result.destinasi_location,
      destinasi_gambar: result.destinasi_gambar,
      destinasi_average_rating: result.destinasi_average_rating,
      destinasi_jumlah_rating: result.destinasi_jumlah_rating,
      destinasi_created_at: result.destinasi_created_at,
      destinasi_updated_at: result.destinasi_updated_at,
      created_by: JSON.parse(result.created_by), // Parsing JSON string to object
      ratings: JSON.parse(result.ratings), // Parsing JSON string to object
    }));

    res
      .status(200)
      .json({ message: "Data destinasi berhasil dimuat.", data: destinasi });
  } catch (error) {
    console.error(error);
    res.status(500).json("Terjadi kesalahan pada server.");
  }
};

// Get Destinasi by ID
const getDestinasiById = async (req, res) => {
  try {
    const { id } = req.params;
    const [results] = await pool.query(
      `
      SELECT 
          d.id AS destinasi_id,
          d.name AS destinasi_name,
          d.description AS destinasi_description,
          d.location AS destinasi_location,
          d.gambar AS destinasi_gambar, 
          d.average_rating AS destinasi_average_rating,
          d.jumlah_rating AS destinasi_jumlah_rating,
          d.created_at AS destinasi_created_at,
          d.updated_at AS destinasi_updated_at,
          JSON_OBJECT('id', u.id, 'username', u.username) AS created_by,
          JSON_ARRAYAGG(
            JSON_OBJECT(
              'id', r.id,
              'rating', r.rating,
              'komentar', r.komentar,
              'created_at', r.created_at,
              'updated_at', r.updated_at,
              'user', JSON_OBJECT('id', ru.id, 'username', ru.username)
            )
          ) AS ratings
      FROM destinasi d
      LEFT JOIN users u ON d.created_by = u.id
      LEFT JOIN rating r ON d.id = r.destinasi_id AND r.deleted_at IS NULL
      LEFT JOIN users ru ON r.user_id = ru.id
      WHERE d.id = ? AND d.deleted_at IS NULL
      GROUP BY d.id;
    `,
      [id]
    );
    const destinasi = results.map((result) => ({
      destinasi_id: result.destinasi_id,
      destinasi_name: result.destinasi_name,
      destinasi_description: result.destinasi_description,
      destinasi_location: result.destinasi_location,
      destinasi_gambar: result.destinasi_gambar,
      destinasi_average_rating: result.destinasi_average_rating,
      destinasi_jumlah_rating: result.destinasi_jumlah_rating,
      destinasi_created_at: result.destinasi_created_at,
      destinasi_updated_at: result.destinasi_updated_at,
      created_by: JSON.parse(result.created_by), // Parsing JSON string to object
      ratings: JSON.parse(result.ratings), // Parsing JSON string to object
    }));

    res
      .status(200)
      .json({ message: "Data destinasi berhasil dimuat.", data: destinasi });
  } catch (error) {
    console.error(error);
    res.status(500).json("Terjadi kesalahan pada server.");
  }
};

// POST Destinasi
const createDestinasi = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, location } = req.body;
    const { username } = req;

    const [user] = await pool.query("SELECT id FROM users WHERE username = ?", [
      username,
    ]);
    const user_id = user[0].id;

    const imageUrls = req.files.map((file) => `uploads/${file.filename}`);

    const [results] = await pool.query(
      "INSERT INTO destinasi (id, name, description, location, gambar, created_by) VALUES ( UUID(), ?, ?, ?, ?, ?)",
      [name, description, location, JSON.stringify(imageUrls), user_id]
    );
    const [destinasi_id] = await pool.query(
      `SELECT id FROM destinasi 
       WHERE name = ? AND created_by = ? 
       ORDER BY created_at DESC LIMIT 1`,
      [name, user_id]
    );

    const [gambar] = await pool.query(
      `INSERT INTO gambar (id, destinasi_id, gambar) VALUES (UUID(), ?, ?)`,
      [destinasi_id[0].id, JSON.stringify(imageUrls)]
    );
    res.status(201).json({
      message: "Destinasi berhasil ditambahkan.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json("Terjadi kesalahan pada server.");
  }
};

// UPDATE Destinasi
const updateDestinasi = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { name, description, location, oldImages } = req.body;
    const { username } = req;
    const newImageUrls = (req.files || []).map(
      (file) => `uploads/${file.filename}`
    );

    const [destinasi] = await pool.query(
      "SELECT created_by FROM destinasi WHERE id = ?",
      [id]
    );

    const [user] = await pool.query(
      "SELECT id, role FROM users WHERE username = ?",
      [username]
    );
    const user_id = user[0].id;
    const user_role = user[0].role;

    if (destinasi.length === 0) {
      return res.status(404).json({ message: "Destinasi tidak ditemukan." });
    }

    if (destinasi[0].created_by !== user_id && user_role !== "admin") {
      return res.status(403).json({ message: "Unauthorized." });
    }

    const oldImage = oldImages || [];
    const updateNewImageUrls = [...oldImage, ...newImageUrls];

    const [results] = await pool.query(
      `
      UPDATE destinasi
      SET name = ?, description = ?, location = ?, gambar = ?
      WHERE id = ? AND created_by = ?
    `,
      [
        name,
        description,
        location,
        JSON.stringify(updateNewImageUrls),
        id,
        user_id,
      ]
    );

    res.status(200).json({
      message: "Destinasi berhasil diperbarui.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json("Terjadi kesalahan pada server.");
  }
};

// DELETE Destinasi
const deleteDestinasi = async (req, res) => {
  try {
    const { id } = req.params;
    const { username } = req;

    const [destinasi] = await pool.query(
      "SELECT created_by FROM destinasi WHERE id = ?",
      [id]
    );

    const [user] = await pool.query(
      "SELECT id, role FROM users WHERE username = ?",
      [username]
    );
    const user_id = user[0].id;
    const user_role = user[0].role;

    if (destinasi.length === 0) {
      return res.status(404).json({ message: "Destinasi tidak ditemukan." });
    }

    if (destinasi[0].created_by !== user_id && user_role !== "admin") {
      return res.status(403).json({ message: "Unauthorized." });
    }

    const [results] = await pool.query(
      `
      UPDATE destinasi
      SET deleted_at = NOW()
      WHERE id = ? AND created_by = ?`,
      [id, user_id]
    );

    const [gambar] = await pool.query(
      `
      UPDATE gambar
      SET deleted_at = NOW()
      WHERE destinasi_id = ? AND deleted_at IS NULL`,
      [id]
    );

    res.status(200).json({
      message: "Destinasi berhasil dihapus.",
    });
  } catch (error) {}
};

// Delete Gambar Destinasi
const deleteImageDestinasi = async (req, res) => {
  const { id } = req.params;
  const { gambar } = req.body;

  if (!gambar) {
    return res.status(400).json({ message: "Image name is required" });
  }

  try {
    // Hapus file gambar dari sistem
    const imagePath = path.resolve(__dirname, "../", gambar);
    fs.unlinkSync(imagePath);
    // Hapus referensi gambar di database
    const [results] = await pool.query(
      `UPDATE destinasi 
       SET gambar = JSON_REMOVE(gambar, JSON_UNQUOTE(JSON_SEARCH(gambar, 'one', ?))) 
       WHERE id = ? AND JSON_SEARCH(gambar, 'one', ?) IS NOT NULL`,
      [gambar, id, gambar]
    );

    res.status(200).json({
      message: "Image deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  getAllDestinasi,
  getDestinasiById,
  createDestinasi,
  deleteDestinasi,
  updateDestinasi,
  deleteImageDestinasi,
};
