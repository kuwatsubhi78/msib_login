const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  // Mengambil token dari cookie
  const token = req.cookies.TajaMentawai;

  // Jika tidak ada token, kembalikan respon 403
  if (!token) {
    return res.status(403).json({ message: "No token provided" });
  }

  // Verifikasi token
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      // Tangani jenis error tertentu
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Token expired" });
      }
      if (err.name === "JsonWebTokenError") {
        return res.status(401).json({ message: "Invalid token" });
      }
      // Default untuk error lainnya
      return res.status(401).json({ message: "Failed to authenticate token" });
    }

    // Tetapkan ID pengguna di request untuk digunakan di rute selanjutnya
    req.username = decoded.username;
    next();
  });
};

module.exports = verifyToken;
