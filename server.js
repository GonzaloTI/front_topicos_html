const express = require("express");
const path = require("path");

const app = express();
const PORT = 4000;

// Servir archivos estáticos (HTML, JS, CSS) desde la carpeta "public"
app.use(express.static(path.join(__dirname, "public")));

// Página principal (login)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Página del home
app.get("/home.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "home.html"));
});

app.get("/inscripcion", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "/inscripcion.html"));
});

app.get("/procesando", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "/procesando.html"));
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor frontend corriendo en http://localhost:${PORT}`);
});
