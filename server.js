const express = require("express");
const cors = require("cors");
const path = require("path");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const authRoutes = require("./routes/authRoutes");
const aksiRoutes = require("./routes/aksiRoutes");
const articleRoutes = require("./routes/articleRoutes");
const commentRoutes = require("./routes/commentRoutes");
const ratingRoutes = require("./routes/ratingRoutes");
const destinasiRoutes = require("./routes/DestinasiRoutes");
const { swaggerSpec, swaggerUi } = require("./swagger");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cookieParser());
app.use(express.json());
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

// Swagger
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: "Dokumentasi API TajaMentawai",
    customfavIcon: "/uploads/logo2.png", // Path ke favicon yang akan ditampilkan
    customCss: `
    .swagger-ui .topbar { 
      display: none; 
    }
  `,
  })
);
// Routes
app.use("/", authRoutes);
app.use("/", aksiRoutes);
app.use("/", articleRoutes);
app.use("/", commentRoutes);
app.use("/", ratingRoutes);
app.use("/", destinasiRoutes);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
