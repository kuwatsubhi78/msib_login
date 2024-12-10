const { validationResult } = require("express-validator");
const path = require("path");
const fs = require("fs");
const pool = require("../config/db");

// Controller untuk menambah artikel
const addArticle = async (req, res) => {
  const { title, content, author_id } = req.body;

  // Cek apakah ada file gambar yang di-upload
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "At least one image is required." });
  }

  try {
    // Simpan URL gambar dalam array
    const imageUrls = req.files.map((file) => `uploads/${file.filename}`);

    // Simpan artikel ke database
    const [result] = await pool.query(
      "INSERT INTO artikel (id, title, content, author_id, gambar) VALUES (UUID(), ?, ?, ?, ?)",
      [title, content, author_id, JSON.stringify(imageUrls)]
    );

    res.status(200).json({
      message: "Article added successfully!",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Controller untuk mengambil semua artikel
const getAllArticles = async (req, res) => {
  try {
    // Query untuk mendapatkan artikel dan komentar terkait
    const [rows] = await pool.query(`
      SELECT 
        a.id AS artikel_id,
        a.title AS artikel_title,
        a.content AS artikel_content,
        a.gambar AS artikel_gambar,
        a.created_at AS artikel_created_at,
        a.updated_at AS artikel_updated_at,
        u.id AS author_id,
        u.username AS author_username,
        k.id AS komentar_id,
        k.content AS komentar_content,
        k.created_at AS komentar_created_at,
        k.updated_at AS komentar_updated_at,
        ku.username AS commenter_username
      FROM artikel a
      LEFT JOIN users u ON a.author_id = u.id
      LEFT JOIN komentar k ON a.id = k.article_id AND k.deleted_at IS NULL
      LEFT JOIN users ku ON k.user_id = ku.id
      ORDER BY a.created_at DESC, k.created_at ASC
    `);

    // Struktur data untuk artikel dan komentar
    const artikel = {};

    rows.forEach((row) => {
      // Jika artikel belum ada di objek, tambahkan
      if (!artikel[row.artikel_id]) {
        artikel[row.artikel_id] = {
          artikel_id: row.artikel_id,
          artikel_title: row.artikel_title,
          artikel_content: row.artikel_content,
          artikel_gambar: row.artikel_gambar,
          artikel_created_at: row.artikel_created_at,
          artikel_updated_at: row.artikel_updated_at,
          author: {
            id: row.author_id,
            username: row.author_username,
          },
          komentar: [],
        };
      }

      // Tambahkan komentar jika ada
      if (row.komentar_id) {
        artikel[row.artikel_id].komentar.push({
          id: row.komentar_id,
          content: row.komentar_content,
          created_at: row.komentar_created_at,
          updated_at: row.komentar_updated_at,
          commenter: {
            id: row.commenter_id,
            username: row.commenter_username,
          },
        });
      }
    });

    // Ubah ke array untuk respons
    const artikelArray = Object.values(artikel);

    res.status(200).json({ artikel: artikelArray });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Controller untuk mengambil artikel berdasarkan Author
const getArticlesByAuthor = async (req, res) => {
  const { author_id } = req.params;

  // Validasi Input
  if (!author_id) {
    return res.status(400).json({ error: "Invalid author ID" });
  }

  try {
    // Query Artikel Berdasarkan author_id
    const [rows] = await pool.query(
      `SELECT 
        a.id AS artikel_id,
        a.title AS artikel_title,
        a.content AS artikel_content,
        a.gambar AS artikel_gambar,
        a.created_at AS artikel_created_at,
        a.updated_at AS artikel_updated_at,
        u.id AS author_id,
        u.username AS author_username,
        k.id AS komentar_id,
        k.content AS komentar_content,
        k.created_at AS komentar_created_at,
        ku.id AS commenter_id,
        ku.username AS commenter_username
      FROM artikel a
      LEFT JOIN users u ON a.author_id = u.id
      LEFT JOIN komentar k ON a.id = k.article_id
      LEFT JOIN users ku ON k.user_id = ku.id
      WHERE a.author_id = ?
      ORDER BY a.created_at DESC, k.created_at ASC`,
      [author_id]
    );

    // Jika Tidak Ada Artikel
    if (rows.length === 0) {
      return res
        .status(404)
        .json({ error: "No articles found for this author" });
    }

    // Kirim Respons
    res.status(200).json({ artikel: rows });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Controller untuk mengambil artikel berdasarkan ID
const getArticleById = async (req, res) => {
  const { id } = req.params;
  try {
    const [artikel] = await pool.query(
      `SELECT 
      a.id AS artikel_id,
      a.title AS artikel_title,
      a.content AS artikel_content,
      a.gambar AS artikel_gambar,
      a.created_at AS artikel_created_at,
      a.updated_at AS artikel_updated_at,
      u.id AS author_id,
      u.username AS author_username,
      k.id AS komentar_id,
      k.content AS komentar_content,
      k.created_at AS komentar_created_at,
      ku.id AS commenter_id,
      ku.username AS commenter_username
    FROM artikel a
    LEFT JOIN users u ON a.author_id = u.id
    LEFT JOIN komentar k ON a.id = k.article_id
    LEFT JOIN users ku ON k.user_id = ku.id
    WHERE a.id = ?
    ORDER BY a.created_at DESC, k.created_at ASC`,
      [id]
    );
    res.status(200).json({ artikel });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Controller untuk memperbarui artikel
const updateArtikel = async (req, res) => {
  try {
    // Validasi input menggunakan express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params; // ID artikel dari URL
    const { title, content, oldImages } = req.body; // Mengambil title, content, dan gambar lama dari body
    const newImages =
      req.files?.map((file) => "uploads/" + file.filename) || []; // Semua gambar baru yang diunggah

    // Ambil artikel dari database
    const [article] = await pool.query("SELECT * FROM artikel WHERE id = ?", [
      id,
    ]);
    if (article.length === 0) {
      return res.status(404).json({ message: "Article not found" });
    }

    // Proses gambar: gabungkan gambar lama yang dipertahankan dan gambar baru
    const updatedImages = [
      ...(Array.isArray(oldImages) ? oldImages : JSON.parse(oldImages || "[]")),
      ...newImages,
    ];

    // Simpan perubahan ke database
    await pool.query(
      "UPDATE artikel SET title = ?, content = ?, gambar = ? WHERE id = ?",
      [title, content, JSON.stringify(updatedImages), id]
    );

    // Kirimkan respon berhasil
    res.status(200).json({ message: "Article updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// Controller untuk menghapus artikel
const deleteArticle = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id, author_id } = req.body;

  try {
    // Cek apakah pengguna dengan username yang diberikan ada
    const [article] = await pool.query("SELECT * FROM artikel WHERE id = ?", [
      id,
    ]);

    if (author_id !== article[0].author_id) {
      return res.status(404).json({ message: "Gagal menghapus artikel" });
    }
    // Ambil array path gambar dari artikel
    const imageUrls = article[0].gambar ? JSON.parse(article[0].gambar) : [];

    // Hapus gambar dari folder penyimpanan
    imageUrls.forEach((imageUrl) => {
      const fullPath = path.join(__dirname, "../", imageUrl);
      fs.unlink(fullPath, (err) => {
        if (err) {
          res.json(`Failed to delete image ${imageUrl}:`, err.message);
        }
      });
    });

    // Menghapus pengguna
    await pool.query("DELETE FROM artikel WHERE id = ?", [id]);

    res.status(200).json({ message: "Article deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Controller untuk menghapus gambar artikel
const deleteArticleImage = async (req, res) => {
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
    const [result] = await pool.query(
      `UPDATE artikel 
       SET gambar = JSON_REMOVE(gambar, JSON_UNQUOTE(JSON_SEARCH(gambar, 'one', ?))) 
       WHERE id = ? AND JSON_SEARCH(gambar, 'one', ?) IS NOT NULL`,
      [gambar, id, gambar]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Image or article not found" });
    }

    res.status(200).json({ message: "Image deleted successfully" });
  } catch (error) {
    console.error("Error deleting image:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  getAllArticles,
  addArticle,
  deleteArticle,
  updateArtikel,
  getArticlesByAuthor,
  getArticleById,
  deleteArticleImage,
};
