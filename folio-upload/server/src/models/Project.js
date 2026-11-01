import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: [true, 'Project title is required.'], trim: true, maxlength: [80, 'Title is too long (max 80).'] },
    description: { type: String, trim: true, maxlength: [600, 'Description is too long (max 600).'], default: '' },
    tags: { type: [String], default: [] },
    order: { type: Number, default: 0, index: true },
    liveUrl: { type: String, trim: true, default: '' },
    repoUrl: { type: String, trim: true, default: '' },
    imageUrl: { type: String, trim: true, default: '' },
  },
  { timestamps: true, toJSON: { versionKey: false } }
);

export const Project = mongoose.model('Project', projectSchema);
