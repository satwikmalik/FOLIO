import { AppError } from '../utils/AppError.js';

export const notFound = (req, res, next) =>
  next(new AppError(404, `No route for ${req.method} ${req.originalUrl}`));

// Four parameters: Express treats this as the global error handler.
export const errorHandler = (err, req, res, next) => {
  let status = err.status || 500;
  let message = err.message;

  if (err.name === 'ValidationError') {
    status = 400;
    message = Object.values(err.errors).map((e) => e.message).join(' ');
  } else if (err.code === 11000) {
    status = 409;
    message = `That ${Object.keys(err.keyPattern || {})[0] || 'value'} is already taken.`;
  } else if (err.name === 'CastError') {
    status = 400;
    message = 'Invalid id.';
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Request body is not valid JSON.';
  }

  if (status >= 500) {
    console.error(err);
    message = 'Something went wrong on the server.';
  }
  res.status(status).json({ message });
};
