function notFoundHandler(req, res) {
  res.status(404).json({ error: "Recurso no encontrado" });
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  console.error("ERROR NO MANEJADO:", err);

  const statusCode = Number.isInteger(err.statusCode) ? err.statusCode : 500;
  const message = statusCode < 500
    ? err.message
    : "Ocurrió un error interno. Inténtalo nuevamente más tarde.";

  res.status(statusCode).json({ error: message });
}

module.exports = { notFoundHandler, errorHandler };
