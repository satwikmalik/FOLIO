import 'dotenv/config';
import app from './app.js';
import { connectDB } from './config/db.js';

const { PORT = 5000, JWT_SECRET } = process.env;

if (!JWT_SECRET) {
  console.error('JWT_SECRET is not set. Copy .env.example to .env and fill it in.');
  process.exit(1);
}

await connectDB();
app.listen(PORT, () => console.log(`Folio API running on http://localhost:${PORT}`));
