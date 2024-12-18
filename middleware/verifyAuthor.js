const pool = require("../config/db");

const verifyAuthor = async (req, res, next) => {
  const { username } = req; // Username dari token

  try {
    // Query untuk mendapatkan author_id dari tabel artikel berdasarkan username
    const [rows] = await pool.query(
      `SELECT 
          a.author_id, 
          u.role 
       FROM 
          artikel a
       JOIN 
          users u 
       ON 
          a.author_id = u.id
       WHERE 
          u.username = ?`,
      [username]
    );

    // Jika tidak ada data atau user bukan admin, akses ditolak
    // if (rows.length === 0) {
    //   const [adminCheck] = await pool.query(
    //     `SELECT role FROM users WHERE username = ? AND role = 'admin'`,
    //     [username]
    //   );
    //   if (adminCheck.length === 0) {
    //     return res.status(403).json({ message: "Access denied." });
    //   }
    // }

    // Jika user adalah admin atau valid author, lanjutkan
    req.user = {
      role: rows[0]?.role || "admin",
    };
    next();
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = verifyAuthor;
