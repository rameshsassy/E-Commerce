export const errorHandler = (err, req, res, next) => {
  console.error("ERROR 💥:", err);

  let error = { ...err };
  error.message = err.message;

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    const message = `Resource not found with id of ${err.value}`;
    return res.status(404).json({ message });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = "Duplicate field value entered";
    return res.status(400).json({ message });
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors).map((val) => val.message);
    return res.status(400).json({ message });
  }

  const status =
    err.status ||
    err.statusCode ||
    (err.name === "MulterError" ? 400 : undefined) ||
    500;

  const payload = {
    message: err.message || "Server Error",
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  };
  if (err.code) payload.code = err.code;
  if (err.upgradeFeature) payload.upgradeFeature = err.upgradeFeature;

  res.status(status).json(payload);
};