const pool = require("../config/db");
const { validationResult } = require("express-validator");

// Controller untuk menambahkan komentars
const addComment = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: "Invalid request" });
  }
  const { article_id } = req.params;
  const { content } = req.body;
  const { username } = req;

  try {
    if (!article_id || !content) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const [existingUser] = await pool.query(
      `SELECT * FROM users WHERE username = ?`,
      [username]
    );

    if (existingUser.length === 0) {
      return res.status(400).json({ message: "Not Valid User" });
    }
    const user_id = existingUser[0].id;

    const [existingArticle] = await pool.query(
      `SELECT * FROM artikel WHERE id = ?`,
      [article_id]
    );
    if (existingArticle.length === 0) {
      return res.status(400).json({ message: "Article not found" });
    }

    const [rows] = await pool.query(
      `INSERT INTO komentar (id, content, article_id, user_id) VALUES (UUID(), ?, ?, ?)`,
      [content, article_id, user_id]
    );
    res.status(200).json({ message: "Comment added successfully" });
  } catch (err) {
    console.error("Error adding comment:", err);
    res.status(500).json({ message: "Failed to add comment" });
  }
};

// Controller untuk menghapus komentar
const deleteComment = async (req, res) => {
  const { id } = req.params;
  const { username } = req;

  try {
    const [existingComment] = await pool.query(
      `SELECT * FROM komentar WHERE id = ?`,
      [id]
    );
    if (existingComment.length === 0) {
      return res.status(400).json({ message: "Comment not found" });
    }

    const [matchUser] = await pool.query(
      `SELECT * FROM users WHERE username = ?`,
      [username]
    );

    if (
      matchUser.length === 0 ||
      (matchUser[0].id !== existingComment[0].user_id &&
        matchUser[0].role !== "admin")
    ) {
      return res.status(400).json({ message: "Not Valid User" });
    }

    const [rows] = await pool.query(
      "UPDATE komentar SET deleted_at = NOW() WHERE id = ?",
      [id]
    );
    res.status(200).json({ message: "Comment deleted successfully" });
  } catch (err) {
    console.error("Error deleting comment:", err);
    res.status(500).json({ message: "Failed to delete comment" });
  }
};

const updateComment = async (req, res) => {
  const { id } = req.params;
  const { username } = req;
  const { content } = req.body;

  try {
    const [existingComment] = await pool.query(
      `SELECT * FROM komentar WHERE id = ?`,
      [id]
    );
    if (existingComment.length === 0) {
      return res.status(400).json({ message: "Comment not found" });
    }

    const [matchUser] = await pool.query(
      `SELECT * FROM users WHERE username = ?`,
      [username]
    );

    if (
      matchUser.length === 0 ||
      (matchUser[0].id !== existingComment[0].user_id &&
        matchUser[0].role !== "admin")
    ) {
      return res.status(400).json({ message: "Not Valid User" });
    }

    const [rows] = await pool.query(
      `UPDATE komentar SET content = ? WHERE id = ?`,
      [content, id]
    );
    res.status(200).json({ message: "Comment updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to update comment" });
  }
};

module.exports = { addComment, deleteComment, updateComment };
