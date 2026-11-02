import mongoose from 'mongoose';

const folioSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 80 },
  slug: {
    type: String, required: true, unique: true, lowercase: true, trim: true,
    match: [/^[a-z0-9-]{3,40}$/, 'Slug must be 3-40 characters using letters, numbers and hyphens.'],
  },
  description: { type: String, trim: true, maxlength: 240, default: '' },
  visibility: { type: String, enum: ['public', 'private'], default: 'private', index: true },
  theme: {
    type: String,
    enum: ['vellum', 'blueprint', 'minimal', 'atelier', 'editorial', 'terminal'],
    default: 'vellum',
  },
  projects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }],
  skills: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Skill' }],
}, { timestamps: true, toJSON: { versionKey: false } });

folioSchema.index({ user: 1, createdAt: -1 });
folioSchema.index({ visibility: 1, createdAt: -1 });

export const Folio = mongoose.model('Folio', folioSchema);
