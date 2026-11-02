import { Router } from 'express';
import mongoose from 'mongoose';
import { verifyToken } from '../middleware/auth.js';
import { Folio } from '../models/Folio.js';
import { User } from '../models/User.js';
import { Project } from '../models/Project.js';
import { Skill } from '../models/Skill.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';

const router = Router();
router.use(verifyToken);

const slugify = (value) => String(value || '').toLowerCase().trim()
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);

async function ensureDefaultFolio(user) {
  let folio = await Folio.findOne({ user: user._id }).sort({ createdAt: 1 });
  if (folio) return folio;
  const [projects, skills] = await Promise.all([
    Project.find({ user: user._id }).select('_id'),
    Skill.find({ user: user._id }).select('_id'),
  ]);
  const base = slugify(user.username) || 'my-folio';
  let slug = base;
  let suffix = 2;
  while (await Folio.exists({ slug })) {
    slug = `${base.slice(0, 36)}-${suffix++}`;
  }
  folio = await Folio.create({
    user: user._id,
    title: `${user.name || user.username}'s Portfolio`,
    slug,
    visibility: 'public',
    theme: user.theme || 'vellum',
    projects: projects.map((item) => item._id),
    skills: skills.map((item) => item._id),
  });
  return folio;
}

async function ownedIds(ids, Model, userId, label) {
  if (!Array.isArray(ids)) throw new AppError(400, `${label} must be an array.`);
  if (ids.some((id) => !mongoose.isValidObjectId(id))) throw new AppError(400, `Invalid ${label.toLowerCase()} selection.`);
  const found = await Model.countDocuments({ _id: { $in: ids }, user: userId });
  if (found !== new Set(ids.map(String)).size) throw new AppError(400, `One or more selected ${label.toLowerCase()} do not belong to your account.`);
  return ids;
}

router.get('/', asyncHandler(async (req, res) => {
  await ensureDefaultFolio(req.user);
  const folios = await Folio.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ folios });
}));

router.post('/', asyncHandler(async (req, res) => {
  const title = String(req.body.title || '').trim();
  if (!title) throw new AppError(400, 'Give your Folio a title.');
  const base = slugify(req.body.slug || title);
  if (base.length < 3) throw new AppError(400, 'Folio URL must be at least 3 characters.');
  const slug = base;
  if (await Folio.exists({ slug })) throw new AppError(409, 'That Folio URL is already taken. Choose another.');
  const [projects, skills] = await Promise.all([
    ownedIds(req.body.projects || [], Project, req.user._id, 'Projects'),
    ownedIds(req.body.skills || [], Skill, req.user._id, 'Skills'),
  ]);
  const folio = await Folio.create({
    user: req.user._id, title, slug,
    description: String(req.body.description || ''),
    visibility: req.body.visibility === 'public' ? 'public' : 'private',
    theme: req.body.theme || 'vellum', projects, skills,
  });
  res.status(201).json({ folio });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const folio = await Folio.findOne({ _id: req.params.id, user: req.user._id });
  if (!folio) throw new AppError(404, 'Folio not found.');
  res.json({ folio });
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const folio = await Folio.findOne({ _id: req.params.id, user: req.user._id });
  if (!folio) throw new AppError(404, 'Folio not found.');
  if (req.body.title !== undefined) folio.title = String(req.body.title).trim();
  if (req.body.description !== undefined) folio.description = String(req.body.description);
  if (req.body.visibility !== undefined) {
    if (!['public', 'private'].includes(req.body.visibility)) throw new AppError(400, 'Visibility must be public or private.');
    folio.visibility = req.body.visibility;
  }
  if (req.body.theme !== undefined) folio.theme = req.body.theme;
  if (req.body.slug !== undefined) {
    const slug = slugify(req.body.slug);
    if (slug.length < 3) throw new AppError(400, 'Folio URL must be at least 3 characters.');
    if (await Folio.exists({ slug, _id: { $ne: folio._id } })) throw new AppError(409, 'That Folio URL is already taken.');
    folio.slug = slug;
  }
  if (req.body.projects !== undefined) folio.projects = await ownedIds(req.body.projects, Project, req.user._id, 'Projects');
  if (req.body.skills !== undefined) folio.skills = await ownedIds(req.body.skills, Skill, req.user._id, 'Skills');
  await folio.save();
  res.json({ folio });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const count = await Folio.countDocuments({ user: req.user._id });
  if (count <= 1) throw new AppError(400, 'Keep at least one Folio in your account.');
  const folio = await Folio.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!folio) throw new AppError(404, 'Folio not found.');
  res.status(204).end();
}));

export { ensureDefaultFolio };
export default router;
