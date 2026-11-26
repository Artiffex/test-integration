function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({
      error: 'Invalid JSON request body.',
      details: ['Request body must contain valid JSON.'],
    });
  }

  console.error(error);
  return res.status(500).json({
    error: 'Internal server error.',
    details: ['An unexpected error occurred while calculating rewards.'],
  });
}

module.exports = errorHandler;
