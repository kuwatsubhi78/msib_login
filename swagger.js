const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

// Definisi Swagger
const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Express API Documentation",
    version: "1.0.0",
    description: "Dokumentasi API untuk aplikasi Express.js Anda",
  },
  servers: [
    {
      url: "http://localhost:5000", // Ganti dengan base URL API Anda
      description: "Development server",
    },
  ],
  tags: [
    {
      name: "Auth",
      description: "Endpoints untuk autentikasi pengguna",
    },
    {
      name: "Article",
      description: "Endpoints untuk artikel",
    },
  ],
};

const options = {
  swaggerDefinition,
  apis: ["./routes/*.js"], // Lokasi file dengan anotasi Swagger
};
const swaggerSpec = swaggerJsdoc(options);

module.exports = { swaggerUi, swaggerSpec };
