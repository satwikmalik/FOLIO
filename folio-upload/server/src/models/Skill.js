import mongoose from 'mongoose';

export const SKILL_LEVELS = ['learning', 'comfortable', 'strong'];

const skillSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: [true, 'Skill name is required.'], trim: true, maxlength: [40, 'Skill name is too long (max 40).'] },
    level: { type: String, enum: { values: SKILL_LEVELS, message: 'Unknown skill level.' }, default: 'comfortable' },
  },
  { timestamps: true, toJSON: { versionKey: false } }
);

export const Skill = mongoose.model('Skill', skillSchema);
