const ErrorResponse = require('../utils/errorResponse');

/**
 * Custom error handler middleware
 * Handles various types of errors and sends appropriate responses
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.stack = err.stack;

  // Log error for debugging
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error('❌ ERROR OCCURRED:');
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error('Message:', err.message);
  console.error('Name:', err.name);
  console.error('Path:', req.path);
  console.error('Method:', req.method);
  if (process.env.NODE_ENV === 'development') {
    console.error('Stack:', err.stack);
  }
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = `Resource not found`;
    error = new ErrorResponse(message, 404);
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    const message = `Duplicate value entered for ${field}: '${value}'. Please use another value.`;
    error = new ErrorResponse(message, 400);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors)
      .map(val => val.message)
      .join(', ');
    error = new ErrorResponse(message, 400);
  }

  // JWT Authentication errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid authentication token. Please log in again.';
    error = new ErrorResponse(message, 401);
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Your session has expired. Please log in again.';
    error = new ErrorResponse(message, 401);
  }

  // Multer file upload errors
  if (err.name === 'MulterError') {
    let message = 'File upload error occurred';
    
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        message = 'File size is too large. Maximum size allowed is 5MB.';
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files. Maximum 10 files allowed.';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Unexpected file field name.';
        break;
      case 'LIMIT_PART_COUNT':
        message = 'Too many parts in the multipart form.';
        break;
      case 'LIMIT_FIELD_KEY':
        message = 'Field name is too long.';
        break;
      case 'LIMIT_FIELD_VALUE':
        message = 'Field value is too long.';
        break;
      case 'LIMIT_FIELD_COUNT':
        message = 'Too many fields.';
        break;
    }
    
    error = new ErrorResponse(message, 400);
  }

  // MongoDB connection errors
  if (err.name === 'MongoError' || err.name === 'MongoServerError') {
    const message = 'Database operation failed. Please try again.';
    error = new ErrorResponse(message, 500);
  }

  // SyntaxError (usually from JSON parsing)
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    const message = 'Invalid JSON format in request body';
    error = new ErrorResponse(message, 400);
  }

  // Custom application errors
  if (err.isOperational) {
    // Operational errors are known and expected
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }

  // Programming or unknown errors
  // Don't leak error details in production
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message: statusCode === 500 && process.env.NODE_ENV === 'production' 
      ? 'Something went wrong. Please try again later.' 
      : message,
    ...(process.env.NODE_ENV === 'development' && {
      error: {
        message: err.message,
        stack: err.stack,
        name: err.name,
        code: err.code
      }
    })
  });
};

/**
 * Handle 404 errors for routes that don't exist
 */
const notFound = (req, res, next) => {
  const error = new ErrorResponse(
    `Route not found: ${req.method} ${req.originalUrl}`,
    404
  );
  next(error);
};

/**
 * Async error handler wrapper
 * Wraps async functions to catch errors and pass to error handler
 */
const asyncHandler = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  errorHandler,
  notFound,
  asyncHandler
};