import { Router } from 'express';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { User } from '../models/User.js';
import { Folio } from '../models/Folio.js';
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

router.get('/folios', asyncHandler(async (req, res) => {
  const { q, skill } = req.query;
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 12));
  const filter = { visibility: 'public' };
  if (q && String(q).trim()) {
    const regex = new RegExp(escapeRegex(String(q).trim()), 'i');
    const matchingUsers = await User.find({ $or: [{ name: regex }, { username: regex }] }).select('_id');
    filter.$or = [{ title: regex }, { description: regex }, { user: { $in: matchingUsers.map((u) => u._id) } }];
  }
  if (skill && String(skill).trim()) {
    const matchingSkills = await Skill.find({ name: new RegExp(escapeRegex(String(skill).trim()), 'i') }).select('_id');
    filter.skills = { $in: matchingSkills.map((s) => s._id) };
  }
  const total = await Folio.countDocuments(filter);
  const pages = Math.max(1, Math.ceil(total / limit));
  const folios = await Folio.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit)
    .populate({ path: 'user', select: 'name username headline avatarUrl' })
    .populate({ path: 'skills', select: 'name level' });
  res.json({ folios, page, pages, total });
}));

router.get('/folios/:slug', asyncHandler(async (req, res) => {
  let viewerId = null;
  const [scheme, token] = String(req.headers.authorization || '').split(' ');
  if (scheme === 'Bearer' && token) {
    try { viewerId = jwt.verify(token, process.env.JWT_SECRET)?.sub || null; }
    catch { /* Invalid token is anonymous. */ }
  }
  let folio = await Folio.findOne({ slug: String(req.params.slug).toLowerCase() });
  if (!folio) throw new AppError(404, 'Folio not found.');
  const isOwner = Boolean(viewerId && String(folio.user) === String(viewerId));
  if (folio.visibility === 'private' && !isOwner) throw new AppError(404, 'Folio not found.');
  if (folio.visibility === 'public' && !isOwner && !req.query.preview) {
    folio = await Folio.findByIdAndUpdate(folio._id, { $inc: { views: 1 } }, { new: true });
  }
  const populated = await Folio.findById(folio._id)
    .populate({ path: 'user', select: 'name username headline bio location avatarUrl links createdAt' })
    .populate({ path: 'projects', match: { user: folio.user }, options: { sort: { order: 1, createdAt: -1 } } })
    .populate({ path: 'skills', match: { user: folio.user }, options: { sort: { createdAt: 1 } } });
  if (!populated?.user) throw new AppError(404, 'Folio not found.');
  res.json({ folio: populated });
}));

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
    const owner = await User.findOne({ username: handle(req) });
    if (!owner) throw new AppError(404, 'No portfolio found for that username.');
    const folio = await Folio.findOne({ user: owner._id, slug: handle(req) });
    if (!folio) throw new AppError(404, 'This legacy portfolio URL is no longer available.');

    let isOwner = false;
    const [scheme, token] = String(req.headers.authorization || '').split(' ');
    if (scheme === 'Bearer' && token) {
      try { isOwner = String(jwt.verify(token, process.env.JWT_SECRET)?.sub || '') === String(owner._id); }
      catch { /* Invalid token is anonymous. */ }
    }
    if (folio.visibility === 'private' && !isOwner) throw new AppError(404, 'No portfolio found for that username.');

    const user = await User.findById(owner._id).select('-email')
      .populate({ path: 'projects', match: { _id: { $in: folio.projects } }, options: { sort: { order: 1, createdAt: -1 } } })
      .populate({ path: 'skills', match: { _id: { $in: folio.skills } }, options: { sort: { createdAt: 1 } } });
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
