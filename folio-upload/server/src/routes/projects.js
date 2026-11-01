import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import { requireFields } from '../middleware/validate.js';
import { Project } from '../models/Project.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import { cleanTags, cleanUrl } from '../utils/validators.js';

const router = Router();
router.use(verifyToken);

const fromBody = (b) => ({
  title: String(b.title ?? ''),
  description: String(b.description ?? ''),
  tags: cleanTags(b.tags),
  liveUrl: cleanUrl(b.liveUrl, 'Live link'),
  repoUrl: cleanUrl(b.repoUrl, 'Source link'),
  imageUrl: cleanUrl(b.imageUrl, 'Image link'),
});

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const projects = await Project.find({ user: req.user._id }).sort({ order: 1, createdAt: -1 });
    res.json({ projects });
  })
);

router.put(
  '/reorder',
  requireFields('projectIds'),
  asyncHandler(async (req, res) => {
    const { projectIds } = req.body;
    if (!Array.isArray(projectIds)) throw new AppError(400, 'projectIds must be an array.');

    const updates = projectIds.map((id, index) =>
      Project.updateOne({ _id: id, user: req.user._id }, { order: index })
    );
    await Promise.all(updates);

    const projects = await Project.find({ user: req.user._id }).sort({ order: 1, createdAt: -1 });
    res.json({ projects });
  })
);

router.post(
  '/',
  requireFields('title'),
  asyncHandler(async (req, res) => {
    const count = await Project.countDocuments({ user: req.user._id });
    const project = await Project.create({
      ...fromBody(req.body),
      order: count,
      user: req.user._id,
    });
    res.status(201).json({ project });
  })
);

router.put(
  '/:id',
  requireFields('title'),
  asyncHandler(async (req, res) => {
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      fromBody(req.body),
      { new: true, runValidators: true }
    );
    if (!project) throw new AppError(404, 'Project not found.');
    res.json({ project });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const project = await Project.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!project) throw new AppError(404, 'Project not found.');
    res.status(204).end();
  })
);

export default router;
