const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const authRoutes = require("./routes/authRoutes");
const aksiRoutes = require("./routes/aksiRoutes");
const articleRoutes = require("./routes/articleRoutes");
const commentRoutes = require("./routes/commentRoutes");
const ratingRoutes = require("./routes/ratingRoutes");
const destinasiRoutes = require("./routes/DestinasiRoutes");
const { swaggerUi, swaggerSpec } = require("./swagger");

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

// Routes
app.use("/", (req, res) => res.send("Hello World!"));
app.use("/", authRoutes);
app.use("/", aksiRoutes);
app.use("/", articleRoutes);
app.use("/", commentRoutes);
app.use("/", ratingRoutes);
app.use("/", destinasiRoutes);

// Swagger
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: "TajaMentawai API Documentation", // Mengubah title
    customfavIcon: "/uploads/logo2.png", // Path ke favicon
    customCss: `
      .swagger-ui .topbar { 
        display: none; 
      }
    `,
  })
);

app.use("/uploads", express.static("uploads"));

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
