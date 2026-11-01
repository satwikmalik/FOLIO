import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const verifyToken = asyncHandler(async (req, res, next) => {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) throw new AppError(401, 'Log in to continue.');

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    throw new AppError(401, err.name === 'TokenExpiredError' ? 'Session expired. Log in again.' : 'Invalid session.');
  }

  const user = await User.findById(payload.sub);
  if (!user) throw new AppError(401, 'This account no longer exists.');
  req.user = user;
  next();
});
