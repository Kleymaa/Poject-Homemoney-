import request from 'supertest';
import app from '../src/app';

describe('Health', () => {
  it('GET /health should return OK', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});