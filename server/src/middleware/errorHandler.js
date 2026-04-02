// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  console.error('[Error]', err.message || err);

  if (err.name === 'ZodError') {
    return res.status(422).json({
      error: 'Validation failed',
      details: err.errors,
    });
  }

  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: err.message || 'Internal server error',
  });
};

module.exports = errorHandler;
