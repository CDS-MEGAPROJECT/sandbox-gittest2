import request from 'supertest';
import { app, server } from '../src/index';

afterAll((done) => {
  server.close(done);
});

describe('GET /api/health', () => {
  it('returns 200 with correct shape', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'healthy');
    expect(res.body).toHaveProperty('version');
    expect(typeof res.body.version).toBe('string');
    expect(res.body).toHaveProperty('uptime');
    expect(typeof res.body.uptime).toBe('number');
  });
});
