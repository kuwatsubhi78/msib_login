const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
require("dotenv").config();

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
      url: process.env.URL_BACKEND, // Ganti dengan base URL API Anda
      description: "Development server",
    },
    {
      url: "http://localhost:5000", // Contoh URL untuk pengujian
      description: "Local development server",
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
