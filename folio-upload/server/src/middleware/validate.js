import { AppError } from '../utils/AppError.js';

export const requireFields = (...fields) => (req, res, next) => {
  const missing = fields.filter((f) => req.body?.[f] === undefined || String(req.body[f]).trim() === '');
  if (missing.length) return next(new AppError(400, `Missing required field: ${missing.join(', ')}`));
  next();
};
