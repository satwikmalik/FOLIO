import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { verifyToken } from '../middleware/auth.js';
import { User } from '../models/User.js';
import { Project } from '../models/Project.js';
import { Skill } from '../models/Skill.js';
import { Message } from '../models/Message.js';
import { requireFields } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import { cleanUrl } from '../utils/validators.js';

const router = Router();
router.use(verifyToken);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const owner = { user: req.user._id };
    const [projects, skills, unread] = await Promise.all([
      Project.countDocuments(owner),
      Skill.countDocuments(owner),
      Message.countDocuments({ ...owner, read: false }),
    ]);
    res.json({ user: req.user, stats: { projects, skills, unread } });
  })
);

router.put(
  '/',
  asyncHandler(async (req, res) => {
    const body = req.body;
    const user = req.user;

    for (const field of ['name', 'headline', 'bio', 'location']) {
      if (body[field] !== undefined) user[field] = String(body[field]);
    }
    if (body.avatarUrl !== undefined) user.avatarUrl = cleanUrl(body.avatarUrl, 'Photo link');
    if (body.links) {
      for (const key of ['github', 'linkedin', 'twitter', 'website']) {
        if (body.links[key] !== undefined) user.links[key] = cleanUrl(body.links[key], `${key} link`);
      }
    }
    if (body.theme !== undefined) user.theme = body.theme;

    await user.save();
    res.json({ user });
  })
);

router.put(
  '/password',
  requireFields('currentPassword', 'newPassword'),
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+passwordHash');
    const ok = await bcrypt.compare(String(currentPassword), user.passwordHash);
    if (!ok) throw new AppError(400, 'Current password is incorrect.');
    if (String(newPassword).length < 8) {
      throw new AppError(400, 'New password must be at least 8 characters.');
    }
    user.passwordHash = await bcrypt.hash(String(newPassword), 10);
    await user.save();
    res.json({ message: 'Password updated.' });
  })
);

const deleteAccount = asyncHandler(async (req, res) => {
  const { username } = req.body || {};
  if (username !== req.user.username) {
    throw new AppError(400, 'Type your username to confirm deletion.');
  }
  const owner = { user: req.user._id };
  await Promise.all([
    Project.deleteMany(owner),
    Skill.deleteMany(owner),
    Message.deleteMany(owner),
    User.findByIdAndDelete(req.user._id),
  ]);
  res.status(204).end();
});

router.delete('/', deleteAccount);
router.delete('/account', deleteAccount);

export default router;
