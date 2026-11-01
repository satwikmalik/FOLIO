import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import { Message } from '../models/Message.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';

const router = Router();
router.use(verifyToken);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const limit = req.query.limit !== undefined ? Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10)) : undefined;
    const skip = Math.max(0, parseInt(req.query.skip, 10) || 0);

    const query = Message.find({ user: req.user._id }).sort({ createdAt: -1 });
    if (skip > 0) query.skip(skip);
    if (limit !== undefined) query.limit(limit);

    const [messages, total] = await Promise.all([
      query,
      Message.countDocuments({ user: req.user._id }),
    ]);

    const hasMore = limit !== undefined ? skip + messages.length < total : false;
    res.json({ messages, total, hasMore });
  })
);

router.patch(
  '/:id/read',
  asyncHandler(async (req, res) => {
    const message = await Message.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { read: true },
      { new: true }
    );
    if (!message) throw new AppError(404, 'Message not found.');
    res.json({ message });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const message = await Message.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!message) throw new AppError(404, 'Message not found.');
    res.status(204).end();
  })
);

export default router;
