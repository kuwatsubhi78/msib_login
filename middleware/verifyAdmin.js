const pool = require("../config/db");

const verifyAdmin = async (req, res, next) => {
  try {
    const [users] = await pool.query("SELECT role FROM users WHERE id = ?", [
      req.userId,
    ]);

    if (users.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = users[0];
    if (user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }

    next();
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = verifyAdmin;
