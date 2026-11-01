process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-super-secure';

import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import app from '../src/app.js';
import { User } from '../src/models/User.js';
import { Project } from '../src/models/Project.js';
import { Skill } from '../src/models/Skill.js';
import { seedDatabase } from '../src/seed.js';

let mongod;

before(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
  // Ensure indexes are built
  await User.init();
});

after(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

describe('Authentication API', () => {
  test('POST /api/register creates user and returns token', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({
        username: 'asha_dev',
        email: 'asha@example.com',
        password: 'password123',
      });

    assert.equal(res.status, 201);
    assert.ok(res.body.token);
    assert.equal(res.body.user.username, 'asha_dev');
    assert.equal(res.body.user.email, 'asha@example.com');
    assert.equal(res.body.user.passwordHash, undefined);
  });

  test('POST /api/register rejects duplicate username or email', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({
        username: 'asha_dev',
        email: 'other@example.com',
        password: 'password123',
      });

    assert.equal(res.status, 409);
    assert.match(res.body.message, /already taken/i);
  });

  test('POST /api/login succeeds with valid credentials', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({
        email: 'asha@example.com',
        password: 'password123',
      });

    assert.equal(res.status, 200);
    assert.ok(res.body.token);
    assert.equal(res.body.user.username, 'asha_dev');
  });

  test('POST /api/login fails with wrong password', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({
        email: 'asha@example.com',
        password: 'wrongpassword',
      });

    assert.equal(res.status, 401);
  });
});

describe('Projects and Ownership', () => {
  let tokenA;
  let tokenB;
  let projectAId;

  before(async () => {
    const resA = await request(app)
      .post('/api/register')
      .send({
        username: 'alice',
        email: 'alice@example.com',
        password: 'password123',
      });
    tokenA = resA.body.token;

    const resB = await request(app)
      .post('/api/register')
      .send({
        username: 'bob_builder',
        email: 'bob@example.com',
        password: 'password123',
      });
    tokenB = resB.body.token;
  });

  test('POST /api/projects creates a project for Alice', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        title: 'Folio Portfolio',
        description: 'A developer portfolio engine',
        tags: ['react', 'node', 'express'],
        liveUrl: 'https://example.com',
        repoUrl: 'https://github.com/alice/folio',
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.project.title, 'Folio Portfolio');
    projectAId = res.body.project._id;
  });

  test('GET /api/projects lists only Alice projects', async () => {
    const res = await request(app)
      .get('/api/projects')
      .set('Authorization', `Bearer ${tokenA}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.projects.length, 1);
    assert.equal(res.body.projects[0]._id, projectAId);
  });

  test('Bob cannot modify Alice project (returns 404)', async () => {
    const res = await request(app)
      .put(`/api/projects/${projectAId}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({
        title: 'Hacked Title',
      });

    assert.equal(res.status, 404);
  });

  test('Bob cannot delete Alice project (returns 404)', async () => {
    const res = await request(app)
      .delete(`/api/projects/${projectAId}`)
      .set('Authorization', `Bearer ${tokenB}`);

    assert.equal(res.status, 404);
  });

  test('Alice can update her project', async () => {
    const res = await request(app)
      .put(`/api/projects/${projectAId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        title: 'Folio Portfolio Updated',
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.project.title, 'Folio Portfolio Updated');
  });

  test('Alice can reorder projects via PUT /api/projects/reorder', async () => {
    // Create a second project for Alice
    const res2 = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: 'Second Project' });
    const project2Id = res2.body.project._id;

    // Reorder: put project2 first, projectA second
    const reorderRes = await request(app)
      .put('/api/projects/reorder')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ projectIds: [project2Id, projectAId] });

    assert.equal(reorderRes.status, 200);
    assert.equal(reorderRes.body.projects[0]._id, project2Id);
    assert.equal(reorderRes.body.projects[1]._id, projectAId);
  });

  test('Alice can delete her project', async () => {
    const res = await request(app)
      .delete(`/api/projects/${projectAId}`)
      .set('Authorization', `Bearer ${tokenA}`);

    assert.equal(res.status, 204);
  });
});

describe('Public Endpoint and Contact Messages', () => {
  let userToken;

  before(async () => {
    const res = await request(app)
      .post('/api/register')
      .send({
        username: 'charlie',
        email: 'charlie@example.com',
        password: 'password123',
      });
    userToken = res.body.token;

    // Add a skill
    await request(app)
      .post('/api/skills')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'JavaScript', level: 'strong' });

    // Add a project
    await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'Charlie App' });
  });

  test('GET /api/public/:username returns user details with projects and skills', async () => {
    const res = await request(app).get('/api/public/charlie');

    assert.equal(res.status, 200);
    assert.equal(res.body.user.username, 'charlie');
    assert.equal(res.body.user.email, undefined);
    assert.equal(res.body.user.passwordHash, undefined);
    assert.equal(res.body.user.views, 1);
    assert.equal(res.body.user.skills.length, 1);
    assert.equal(res.body.user.skills[0].name, 'JavaScript');
    assert.equal(res.body.user.projects.length, 1);
    assert.equal(res.body.user.projects[0].title, 'Charlie App');
  });

  test('GET /api/public/:username returns 404 for unknown user', async () => {
    const res = await request(app).get('/api/public/unknown_user_999');
    assert.equal(res.status, 404);
  });

  test('POST /api/public/:username/contact creates a message for the user', async () => {
    const res = await request(app)
      .post('/api/public/charlie/contact')
      .send({
        senderName: 'Recruiter Jane',
        senderEmail: 'jane@recruiters.com',
        body: 'We would love to interview you for a developer role!',
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.message, 'Message sent.');

    // Check Charlie inbox
    const inboxRes = await request(app)
      .get('/api/messages')
      .set('Authorization', `Bearer ${userToken}`);

    assert.equal(inboxRes.status, 200);
    assert.equal(inboxRes.body.messages.length, 1);
    const msg = inboxRes.body.messages[0];
    assert.equal(msg.senderName, 'Recruiter Jane');
    assert.equal(msg.read, false);

    // Mark as read
    const readRes = await request(app)
      .patch(`/api/messages/${msg._id}/read`)
      .set('Authorization', `Bearer ${userToken}`);
    assert.equal(readRes.status, 200);
    assert.equal(readRes.body.message.read, true);

    // Delete message
    const deleteRes = await request(app)
      .delete(`/api/messages/${msg._id}`)
      .set('Authorization', `Bearer ${userToken}`);
    assert.equal(deleteRes.status, 204);
  });

  test('GET /api/public returns paginated users for Explore', async () => {
    const res = await request(app).get('/api/public');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.users));
    assert.ok(res.body.total >= 1);
    assert.equal(res.body.page, 1);
    // Ensure emails and passwords are not leaked
    res.body.users.forEach((u) => {
      assert.equal(u.email, undefined);
      assert.equal(u.passwordHash, undefined);
    });
  });

  test('GET /api/public?q=charlie filters by query', async () => {
    const res = await request(app).get('/api/public?q=charlie');
    assert.equal(res.status, 200);
    assert.ok(res.body.users.some((u) => u.username === 'charlie'));
  });

  test('GET /api/public?skill=JavaScript filters by skill', async () => {
    const res = await request(app).get('/api/public?skill=JavaScript');
    assert.equal(res.status, 200);
    assert.ok(res.body.users.some((u) => u.username === 'charlie'));
  });

  test('GET /api/public?sort=views sorts by view count', async () => {
    const res = await request(app).get('/api/public?sort=views');
    assert.equal(res.status, 200);
    if (res.body.users.length > 1) {
      assert.ok(res.body.users[0].views >= res.body.users[1].views);
    }
  });

  test('POST /api/public/:username/contact enforces rate limit (429)', async () => {
    for (let i = 0; i < 5; i++) {
      const res = await request(app)
        .post('/api/public/charlie/contact')
        .set('x-test-rate-limit', 'true')
        .send({
          senderName: `Tester ${i}`,
          senderEmail: `tester${i}@example.com`,
          body: `Hello ${i}`,
        });
      assert.equal(res.status, 201);
    }

    const blockedRes = await request(app)
      .post('/api/public/charlie/contact')
      .set('x-test-rate-limit', 'true')
      .send({
        senderName: 'Spammer',
        senderEmail: 'spammer@example.com',
        body: 'Spam content',
      });

    assert.equal(blockedRes.status, 429);
    assert.match(blockedRes.body.message, /Too many messages sent/i);
  });

  test('Owner view is not counted', async () => {
    // Current views of charlie
    const initialRes = await request(app).get('/api/public/charlie?preview=1');
    const initialViews = initialRes.body.user.views;

    // Fetch with Charlie's owner token
    const ownerRes = await request(app)
      .get('/api/public/charlie')
      .set('Authorization', `Bearer ${userToken}`);
    assert.equal(ownerRes.status, 200);
    assert.equal(ownerRes.body.user.views, initialViews);

    // Fetch with ?preview=1
    const previewRes = await request(app).get('/api/public/charlie?preview=1');
    assert.equal(previewRes.status, 200);
    assert.equal(previewRes.body.user.views, initialViews);

    // Fetch without token as visitor should increment
    const visitorRes = await request(app).get('/api/public/charlie');
    assert.equal(visitorRes.status, 200);
    assert.equal(visitorRes.body.user.views, initialViews + 1);
  });
});

describe('Account Settings API', () => {
  let userToken;

  before(async () => {
    const res = await request(app)
      .post('/api/register')
      .send({
        username: 'dave_acc',
        email: 'dave@example.com',
        password: 'initialpassword123',
      });
    userToken = res.body.token;

    // Create a project and skill for Dave
    await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'Dave Project' });

    await request(app)
      .post('/api/skills')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Docker', level: 'learning' });
  });

  test('PUT /api/profile/password rejects wrong current password', async () => {
    const res = await request(app)
      .put('/api/profile/password')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        currentPassword: 'wrongpassword',
        newPassword: 'newsecurepassword123',
      });

    assert.equal(res.status, 400);
    assert.match(res.body.message, /Current password is incorrect/i);
  });

  test('PUT /api/profile/password updates password on valid credentials', async () => {
    const res = await request(app)
      .put('/api/profile/password')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        currentPassword: 'initialpassword123',
        newPassword: 'newsecurepassword123',
      });

    assert.equal(res.status, 200);

    // Verify login with new password
    const loginRes = await request(app)
      .post('/api/login')
      .send({
        email: 'dave@example.com',
        password: 'newsecurepassword123',
      });

    assert.equal(loginRes.status, 200);
    assert.ok(loginRes.body.token);
  });

  test('DELETE /api/profile/account requires username confirmation', async () => {
    const res = await request(app)
      .delete('/api/profile/account')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ username: 'wrong_username' });

    assert.equal(res.status, 400);
  });

  test('DELETE /api/profile/account cascades delete and removes account', async () => {
    const res = await request(app)
      .delete('/api/profile/account')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ username: 'dave_acc' });

    assert.equal(res.status, 204);

    // Subsequent authenticated request fails with 401
    const checkRes = await request(app)
      .get('/api/projects')
      .set('Authorization', `Bearer ${userToken}`);

    assert.equal(checkRes.status, 401);
  });
});

describe('Inbox Pagination API', () => {
  let userToken;

  before(async () => {
    const res = await request(app)
      .post('/api/register')
      .send({
        username: 'eva_inbox',
        email: 'eva@example.com',
        password: 'password123',
      });
    userToken = res.body.token;

    // Send 3 messages to Eva
    for (let i = 1; i <= 3; i++) {
      await request(app)
        .post('/api/public/eva_inbox/contact')
        .send({
          senderName: `Sender ${i}`,
          senderEmail: `sender${i}@example.com`,
          body: `Message body ${i}`,
        });
    }
  });

  test('GET /api/messages supports limit and skip pagination', async () => {
    // Page 1: limit 2
    const res1 = await request(app)
      .get('/api/messages?limit=2&skip=0')
      .set('Authorization', `Bearer ${userToken}`);

    assert.equal(res1.status, 200);
    assert.equal(res1.body.messages.length, 2);
    assert.equal(res1.body.total, 3);
    assert.equal(res1.body.hasMore, true);

    // Page 2: skip 2
    const res2 = await request(app)
      .get('/api/messages?limit=2&skip=2')
      .set('Authorization', `Bearer ${userToken}`);

    assert.equal(res2.status, 200);
    assert.equal(res2.body.messages.length, 1);
    assert.equal(res2.body.total, 3);
    assert.equal(res2.body.hasMore, false);
  });
});

describe('Database Seeder', () => {
  test('seedDatabase creates 3 demo users without duplicates on rerun', async () => {
    // Run seed first time
    await seedDatabase();

    const asha = await User.findOne({ username: 'asha' });
    const marcus = await User.findOne({ username: 'marcus' });
    const elena = await User.findOne({ username: 'elena' });

    assert.ok(asha);
    assert.ok(marcus);
    assert.ok(elena);

    assert.equal(marcus.theme, 'blueprint');

    const ashaProjects = await Project.find({ user: asha._id });
    const ashaSkills = await Skill.find({ user: asha._id });
    assert.equal(ashaProjects.length, 2);
    assert.equal(ashaSkills.length, 4);

    const totalUsersBefore = await User.countDocuments();
    const totalProjectsBefore = await Project.countDocuments();
    const totalSkillsBefore = await Skill.countDocuments();

    // Run seed second time to verify idempotency
    await seedDatabase();

    const totalUsersAfter = await User.countDocuments();
    const totalProjectsAfter = await Project.countDocuments();
    const totalSkillsAfter = await Skill.countDocuments();

    assert.equal(totalUsersAfter, totalUsersBefore);
    assert.equal(totalProjectsAfter, totalProjectsBefore);
    assert.equal(totalSkillsAfter, totalSkillsBefore);
  });
});
