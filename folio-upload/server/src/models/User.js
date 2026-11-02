import mongoose from 'mongoose';

const RESERVED = ['api', 'login', 'register', 'dashboard', 'u', 'admin', 'explore', 'about'];
const url = { type: String, trim: true, maxlength: 300, default: '' };

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required.'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9_-]{3,20}$/, 'Username must be 3-20 characters: letters, numbers, - or _.'],
      validate: { validator: (v) => !RESERVED.includes(v), message: 'That username is reserved.' },
    },
    email: {
      type: String,
      required: [true, 'Email is required.'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Enter a valid email address.'],
    },
    passwordHash: { type: String, required: true, select: false },
    name: { type: String, trim: true, maxlength: [60, 'Name is too long (max 60).'], default: '' },
    headline: { type: String, trim: true, maxlength: [100, 'Headline is too long (max 100).'], default: '' },
    bio: { type: String, trim: true, maxlength: [600, 'Bio is too long (max 600).'], default: '' },
    location: { type: String, trim: true, maxlength: [60, 'Location is too long (max 60).'], default: '' },
    avatarUrl: url,
    links: { github: url, linkedin: url, twitter: url, website: url },
    theme: {
      type: String,
      enum: { values: ['vellum', 'blueprint', 'minimal', 'atelier', 'editorial', 'terminal'], message: 'Unknown template.' },
      default: 'vellum',
    },
    views: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    id: false,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform(doc, ret) {
        delete ret.passwordHash;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

// Virtual populate: user.projects / user.skills are filled by .populate() (see routes/public.js).
userSchema.virtual('projects', { ref: 'Project', localField: '_id', foreignField: 'user' });
userSchema.virtual('skills', { ref: 'Skill', localField: '_id', foreignField: 'user' });

export const User = mongoose.model('User', userSchema);
