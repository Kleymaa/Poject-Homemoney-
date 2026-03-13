import request from 'supertest';
import app from '../src/app';

describe('Auth validation', () => {
  it('POST /auth/register should require confirmPassword', async () => {
    const response = await request(app).post('/auth/register').send({
      login: 'user123',
      email: 'user@test.com',
      password: 'StrongPass123',
    });

    expect(response.status).toBe(400);
  });

  it('POST /auth/register should reject different passwords', async () => {
    const response = await request(app).post('/auth/register').send({
      login: 'user123',
      email: 'user@test.com',
      password: 'StrongPass123',
      confirmPassword: 'WrongPass123',
    });

    expect(response.status).toBe(400);
  });
});