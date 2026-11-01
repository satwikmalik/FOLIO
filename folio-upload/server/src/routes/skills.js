import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import { requireFields } from '../middleware/validate.js';
import { Skill } from '../models/Skill.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';

const router = Router();
router.use(verifyToken);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const skills = await Skill.find({ user: req.user._id }).sort({ createdAt: 1 });
    res.json({ skills });
  })
);

router.post(
  '/',
  requireFields('name'),
  asyncHandler(async (req, res) => {
    const skill = await Skill.create({ user: req.user._id, name: req.body.name, level: req.body.level });
    res.status(201).json({ skill });
  })
);

router.put(
  '/:id',
  requireFields('level'),
  asyncHandler(async (req, res) => {
    const skill = await Skill.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { level: req.body.level },
      { new: true, runValidators: true }
    );
    if (!skill) throw new AppError(404, 'Skill not found.');
    res.json({ skill });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const skill = await Skill.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!skill) throw new AppError(404, 'Skill not found.');
    res.status(204).end();
  })
);

export default router;
