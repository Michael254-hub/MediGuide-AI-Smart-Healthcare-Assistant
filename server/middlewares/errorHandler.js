const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);

  if (statusCode >= 500) {
    console.error('[API ERROR]', {
      message: err.message,
      code: err.code || null,
      path: req.originalUrl,
      method: req.method,
      stack: err.stack,
    });
  }

  res.status(statusCode);
  res.json({
    success: false,
    message: err.message,
    code: err.code || null,
    data: err.details || null,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = { notFound, errorHandler };
