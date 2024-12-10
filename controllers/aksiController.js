const pool = require("../config/db");

// Aksi Like
async function aksiLike(req, res) {
  try {
    const connection = await pool.getConnection();
    try {
      const { id } = req.params;
      const { username } = req;

      await connection.beginTransaction();

      const [user] = await connection.query(
        "SELECT id FROM users WHERE username = ?",
        [username]
      );
      const user_id = user[0].id;

      const [rows] = await pool.query(
        `
        SELECT *
          FROM (
              SELECT id, 'artikel' AS source_table
              FROM artikel
              WHERE id = ?
              UNION ALL
              SELECT id, 'destinasi' AS source_table
              FROM destinasi
              WHERE id = ?
          ) AS combined
          LIMIT 1;
        `,
        [id, id]
      );

      if (rows.length === 0) {
        return res.status(404).json({ message: "Aksi not found" });
      }
      const tabel = rows[0].source_table;
      const collumnName = `${tabel}_id`;
      const like_id = rows[0].id;

      const [existingLike] = await connection.query(
        `SELECT id FROM aksi WHERE ${collumnName} = ? AND user_id = ? AND type = 'SUKA'`,
        [id, user_id]
      );

      if (!existingLike.length > 0) {
        // memasukkan like ke artikel atau destinasi
        const [result] = await connection.query(
          `INSERT INTO aksi (user_id, ${collumnName}, type) VALUES (?, ?, 'SUKA')`,
          [user_id, like_id]
        );

        const [result2] = await connection.query(
          `
        UPDATE ${tabel}
        SET likes = (
        SELECT COUNT(*) FROM aksi WHERE ${collumnName} = ? AND type = 'SUKA'
      )
        WHERE id = ?
      `,
          [like_id, id]
        );

        await connection.commit();
        return res.status(200).json({ message: "Berhasil menambahkan like" });
      } else {
        // menghapus like dari artikel atau destinasi
        const [result] = await connection.query(
          `DELETE FROM aksi WHERE ${collumnName} = ? AND user_id = ? AND type = 'SUKA'`,
          [like_id, user_id]
        );

        const [result2] = await connection.query(
          `
        UPDATE ${tabel}
        SET likes = (
        SELECT COUNT(*) FROM aksi WHERE ${collumnName} = ? AND type = 'SUKA'
      )
        WHERE id = ?
      `,
          [like_id, id]
        );

        await connection.commit();
        return res.status(200).json({ message: "Berhasil menghapus like" });
      }
    } catch (error) {
      await connection.rollback();
      console.error("Error:", error);
      res.status(500).json({ message: "Internal Server Error" });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

// Aksi Saves
const aksiSave = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    try {
      const { id } = req.params;
      const { username } = req;

      await connection.beginTransaction();

      const [user] = await connection.query(
        "SELECT id FROM users WHERE username = ?",
        [username]
      );
      const user_id = user[0].id;

      const [rows] = await pool.query(
        `
        SELECT *
          FROM (
              SELECT id, 'artikel' AS source_table
              FROM artikel
              WHERE id = ?
              UNION ALL
              SELECT id, 'destinasi' AS source_table
              FROM destinasi
              WHERE id = ?
          ) AS combined
          LIMIT 1;
        `,
        [id, id]
      );

      if (rows.length === 0) {
        return res.status(404).json({ message: "Aksi not found" });
      }
      const tabel = rows[0].source_table;
      const collumnName = `${tabel}_id`;
      const save_id = rows[0].id;

      const [existingLike] = await connection.query(
        `SELECT id FROM aksi WHERE ${collumnName} = ? AND user_id = ? AND type = 'SAVE'`,
        [id, user_id]
      );

      if (!existingLike.length > 0) {
        // memasukkan like ke artikel atau destinasi
        const [result] = await connection.query(
          `INSERT INTO aksi (user_id, ${collumnName}, type) VALUES (?, ?, 'SAVE')`,
          [user_id, save_id]
        );

        const [result2] = await connection.query(
          `
        UPDATE ${tabel}
        SET saves = COALESCE(saves, 0) + 1
        WHERE id = ?
      `,
          [save_id]
        );

        await connection.commit();
        return res.status(200).json({ message: "Berhasil menambahkan save" });
      } else {
        // menghapus like dari artikel atau destinasi
        const [result] = await connection.query(
          `DELETE FROM aksi WHERE ${collumnName} = ? AND user_id = ? AND type = 'SAVE'`,
          [save_id, user_id]
        );

        const [result2] = await connection.query(
          `
        UPDATE ${tabel}
        SET saves = COALESCE(saves, 0) - 1
        WHERE id = ?
      `,
          [save_id]
        );

        await connection.commit();
        return res.status(200).json({ message: "Berhasil menghapus save" });
      }
    } catch (error) {
      await connection.rollback();
      console.error("Error:", error);
      res.status(500).json({ message: "Internal Server Error" });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = { aksiLike, aksiSave };
