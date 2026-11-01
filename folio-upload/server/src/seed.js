import 'dotenv/config';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import { User } from './models/User.js';
import { Project } from './models/Project.js';
import { Skill } from './models/Skill.js';

const DEMO_USERS = [
  {
    username: 'asha',
    name: 'Asha Roy',
    email: 'asha.demo@example.com',
    headline: 'Fullstack developer & engineering student',
    bio: 'Third-year CS student passionate about building accessible web applications and developer tools. Currently exploring distributed systems and web performance.',
    location: 'Bengaluru, India',
    theme: 'vellum',
    links: {
      github: 'https://github.com',
      linkedin: 'https://linkedin.com',
      website: 'https://example.com',
    },
    projects: [
      {
        title: 'Folio Portfolio Engine',
        description: 'A minimal portfolio generator for developers with custom drawing-sheet styling.',
        tags: ['React', 'Node.js', 'Express', 'MongoDB'],
        liveUrl: 'https://example.com',
        repoUrl: 'https://github.com/example/folio',
      },
      {
        title: 'Transit Pulse',
        description: 'Real-time public transit tracking dashboard with route arrival predictions.',
        tags: ['TypeScript', 'React', 'WebSocket'],
        liveUrl: 'https://example.com',
        repoUrl: 'https://github.com/example/transit',
      },
    ],
    skills: [
      { name: 'JavaScript', level: 'strong' },
      { name: 'React', level: 'strong' },
      { name: 'Node.js', level: 'comfortable' },
      { name: 'MongoDB', level: 'comfortable' },
    ],
  },
  {
    username: 'marcus',
    name: 'Marcus Chen',
    email: 'marcus@example.com',
    headline: 'Systems programmer & backend architect',
    bio: 'Focused on low-latency microservices, database internals, and API infrastructure. Love writing clean, testable code with minimal dependencies.',
    location: 'Singapore',
    theme: 'blueprint',
    links: {
      github: 'https://github.com',
      website: 'https://example.com',
    },
    projects: [
      {
        title: 'KiteDB',
        description: 'An in-memory key-value database engine implementing a subset of Redis commands.',
        tags: ['Go', 'TCP', 'Algorithms'],
        liveUrl: 'https://example.com',
        repoUrl: 'https://github.com/example/kitedb',
      },
      {
        title: 'LogStream',
        description: 'High-throughput log aggregator with tail-sampling and structured filtering.',
        tags: ['Node.js', 'Express', 'Streams'],
        liveUrl: 'https://example.com',
        repoUrl: 'https://github.com/example/logstream',
      },
    ],
    skills: [
      { name: 'Go', level: 'strong' },
      { name: 'Distributed Systems', level: 'comfortable' },
      { name: 'Docker', level: 'comfortable' },
      { name: 'Rust', level: 'learning' },
    ],
  },
  {
    username: 'elena',
    name: 'Elena Rostova',
    email: 'elena@example.com',
    headline: 'Frontend engineer & design systems enthusiast',
    bio: 'Crafting fast, accessible user interfaces with clean CSS and semantic HTML. Advocate for web standards, typography, and responsive ergonomics.',
    location: 'Berlin, Germany',
    theme: 'vellum',
    links: {
      github: 'https://github.com',
      linkedin: 'https://linkedin.com',
    },
    projects: [
      {
        title: 'Specimen Type Tool',
        description: 'Browser-based typography tester and modular scale calculator for designers.',
        tags: ['React', 'CSS', 'Canvas'],
        liveUrl: 'https://example.com',
        repoUrl: 'https://github.com/example/specimen',
      },
      {
        title: 'CanvasFlow',
        description: 'Interactive flowchart editor with SVG export and keyboard-first navigation.',
        tags: ['React', 'SVG', 'State Machines'],
        liveUrl: 'https://example.com',
        repoUrl: 'https://github.com/example/canvasflow',
      },
    ],
    skills: [
      { name: 'CSS & Responsive Design', level: 'strong' },
      { name: 'React', level: 'strong' },
      { name: 'TypeScript', level: 'comfortable' },
      { name: 'Web Accessibility', level: 'comfortable' },
    ],
  },
];

export async function seedDatabase() {
  for (const demo of DEMO_USERS) {
    const existing = await User.findOne({
      $or: [{ username: demo.username }, { email: demo.email }],
    });
    if (existing) {
      console.log(`User @${demo.username} (${demo.email}) already exists; skipping.`);
      continue;
    }

    // Generate a secure random password unknown to anyone
    const randomPassword = crypto.randomBytes(32).toString('hex');
    const passwordHash = await bcrypt.hash(randomPassword, 10);

    const user = await User.create({
      username: demo.username,
      email: demo.email,
      passwordHash,
      name: demo.name,
      headline: demo.headline,
      bio: demo.bio,
      location: demo.location,
      theme: demo.theme,
      links: demo.links,
    });

    for (let i = 0; i < demo.projects.length; i++) {
      const p = demo.projects[i];
      await Project.create({
        user: user._id,
        title: p.title,
        description: p.description,
        tags: p.tags,
        liveUrl: p.liveUrl,
        repoUrl: p.repoUrl,
        order: i,
      });
    }

    for (const s of demo.skills) {
      await Skill.create({
        user: user._id,
        name: s.name,
        level: s.level,
      });
    }

    console.log(`Seeded user @${demo.username} (${demo.name})`);
  }
}

// When executed directly:
if (process.argv[1]?.endsWith('seed.js')) {
  await connectDB();
  await seedDatabase();
  await mongoose.disconnect();
  console.log('Seeding complete.');
}
