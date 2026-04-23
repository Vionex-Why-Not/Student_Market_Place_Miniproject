const errorHandler = (err, req, res, _next) => {
  let status  = err.statusCode || 500;
  let message = err.message    || "Something went wrong";

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
    status  = 409;
  }
  if (err.name === "ValidationError") {
    message = Object.values(err.errors).map(e => e.message).join(", ");
    status  = 400;
  }
  if (err.name === "CastError") {
    message = `Invalid ${err.path}: ${err.value}`;
    status  = 400;
  }
  if (err.code === "LIMIT_FILE_SIZE") {
    message = "Image must be under 5 MB";
    status  = 400;
  }

  if (process.env.NODE_ENV === "development") console.error("💥", err);

  if (req.path.startsWith("/api")) {
    return res.status(status).json({ success: false, error: message });
  }
  res.status(status).render("error", { title: "Error", message, status });
};

module.exports = errorHandler;
