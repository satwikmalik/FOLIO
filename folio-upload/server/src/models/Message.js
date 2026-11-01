import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    senderName: { type: String, required: true, trim: true, maxlength: [80, 'Name is too long (max 80).'] },
    senderEmail: { type: String, required: true, trim: true, lowercase: true, maxlength: 120 },
    body: { type: String, required: true, trim: true, maxlength: [2000, 'Message is too long (max 2000).'] },
    read: { type: Boolean, default: false },
  },
  { timestamps: true, toJSON: { versionKey: false } }
);

export const Message = mongoose.model('Message', messageSchema);
