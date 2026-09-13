const path = require("path");
const express = require("express");
const methodOverride = require("method-override");

const taskRoutes = require("./routes/taskRoutes");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Разбор данных, отправленных обычной HTML-формой (application/x-www-form-urlencoded).
app.use(express.urlencoded({ extended: true }));

// Позволяет формам "притвориться" PUT/DELETE через скрытое поле _method,
// оставаясь при этом обычными <form method="POST">
app.use(
  methodOverride((req) => {
    if (req.body && typeof req.body === "object" && "_method" in req.body) {
      const method = req.body._method;
      delete req.body._method; // чтобы _method не попал в валидацию/модель
      return method;
    }
    if (req.query && "_method" in req.query) {
      return req.query._method;
    }
  }),
);

app.use(express.static(path.join(__dirname, "..", "public")));

app.get("/", (req, res) => res.redirect("/tasks"));
app.use("/tasks", taskRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
