import { Router } from 'express';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { User } from '../models/User.js';
import '../models/Project.js';
import { Skill } from '../models/Skill.js';
import { Message } from '../models/Message.js';
import { requireFields } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import { isEmail } from '../utils/validators.js';

const router = Router();
const handle = (req) => String(req.params.username).toLowerCase();
const escapeRegex = (s) => s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many messages sent. Please wait an hour before trying again.' },
  skip: (req) => process.env.NODE_ENV === 'test' && !req.headers['x-test-rate-limit'],
});

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { q, skill, sort } = req.query;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));

    const filter = {};

    if (q && String(q).trim()) {
      const escaped = escapeRegex(String(q).trim());
      const regex = new RegExp(escaped, 'i');
      filter.$or = [{ name: regex }, { username: regex }];
    }

    if (skill && String(skill).trim()) {
      const escapedSkill = escapeRegex(String(skill).trim());
      const matchingSkills = await Skill.find({
        name: new RegExp(escapedSkill, 'i'),
      }).select('user');
      const userIds = matchingSkills.map((s) => s.user);
      filter._id = { $in: userIds };
    }

    const sortOption = sort === 'views' ? { views: -1, createdAt: -1 } : { createdAt: -1 };

    const total = await User.countDocuments(filter);
    const pages = Math.max(1, Math.ceil(total / limit));
    const skip = (page - 1) * limit;

    const users = await User.find(filter)
      .select('-email')
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .populate({ path: 'skills', options: { sort: { createdAt: 1 } } });

    res.json({ users, page, pages, total });
  })
);

router.get(
  '/:username',
  asyncHandler(async (req, res) => {
    let isOwner = false;
    const authHeader = req.headers.authorization || '';
    const [scheme, token] = authHeader.split(' ');
    if (scheme === 'Bearer' && token) {
      try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        if (payload?.sub) {
          const viewer = await User.findById(payload.sub).select('_id username');
          if (viewer && viewer.username.toLowerCase() === handle(req)) {
            isOwner = true;
          }
        }
      } catch {
        // Ignore invalid/expired token on public endpoint
      }
    }

    const isPreview = req.query.preview === '1' || req.query.preview === 'true';
    const shouldCount = !isOwner && !isPreview;

    const query = shouldCount
      ? User.findOneAndUpdate(
          { username: handle(req) },
          { $inc: { views: 1 } },
          { new: true, timestamps: false }
        )
      : User.findOne({ username: handle(req) });

    const user = await query
      .select('-email')
      .populate({ path: 'projects', options: { sort: { order: 1, createdAt: -1 } } })
      .populate({ path: 'skills', options: { sort: { createdAt: 1 } } });

    if (!user) throw new AppError(404, 'No portfolio found for that username.');
    res.json({ user });
  })
);

router.post(
  '/:username/contact',
  contactLimiter,
  requireFields('senderName', 'senderEmail', 'body'),
  asyncHandler(async (req, res) => {
    const { senderName, senderEmail, body } = req.body;
    if (!isEmail(senderEmail)) throw new AppError(400, 'Enter a valid email address.');

    const owner = await User.findOne({ username: handle(req) }).select('_id');
    if (!owner) throw new AppError(404, 'No portfolio found for that username.');

    await Message.create({ user: owner._id, senderName, senderEmail, body });
    res.status(201).json({ message: 'Message sent.' });
  })
);

export default router;
