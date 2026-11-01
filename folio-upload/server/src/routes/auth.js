import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { requireFields } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import { signToken } from '../utils/token.js';

const router = Router();

router.post(
  '/register',
  requireFields('username', 'email', 'password'),
  asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;
    if (String(password).length < 8) throw new AppError(400, 'Password must be at least 8 characters.');

    const passwordHash = await bcrypt.hash(String(password), 10);
    const user = await User.create({ username, email, passwordHash, name: username });
    res.status(201).json({ token: signToken(user._id), user });
  })
);

router.post(
  '/login',
  requireFields('email', 'password'),
  asyncHandler(async (req, res) => {
    const email = String(req.body.email).trim().toLowerCase();
    const user = await User.findOne({ email }).select('+passwordHash');
    const ok = user && (await bcrypt.compare(String(req.body.password), user.passwordHash));
    if (!ok) throw new AppError(401, 'Email or password is incorrect.');
    res.json({ token: signToken(user._id), user });
  })
);

export default router;
