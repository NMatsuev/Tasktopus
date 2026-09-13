const multer = require("multer");

function notFoundHandler(req, res) {
  res.status(404).render("errors/404");
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Ошибки загрузки файлов (multer) возвращаем прямо на страницу задачи
  // в виде понятного сообщения
  if (err instanceof multer.MulterError && req.params.id) {
    const code =
      err.code === "LIMIT_FILE_SIZE" ? "file_too_large" : "file_rejected";
    return res.redirect(`/tasks/${req.params.id}?err=${code}`);
  }

  console.error(err);
  res.status(500).render("errors/500", {
    message: process.env.NODE_ENV === "production" ? null : err.message,
  });
}

module.exports = { notFoundHandler, errorHandler };
