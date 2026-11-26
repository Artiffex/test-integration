const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../../server');

test('POST /api/calculate-rewards returns a projection and validates requests', async (context) => {
  const server = app.listen(0);
  context.after(() => new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  }));
  await new Promise((resolve) => server.once('listening', resolve));
  const address = server.address();
  const endpoint = `http://127.0.0.1:${address.port}/api/calculate-rewards`;

  const success = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      principal: 1000,
      apy: 5,
      duration: 365,
      durationUnit: 'days',
      compoundingFrequency: 'daily',
    }),
  });
  const projection = await success.json();
  assert.equal(success.status, 200);
  assert.ok(Math.abs(projection.projectedBalance - 1050) < 1e-9);
  assert.equal(projection.normalizedDuration.years, 1);
  assert.equal(projection.chartData.length, 61);

  const invalid = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      principal: 0,
      apy: 5,
      duration: 365,
      durationUnit: 'days',
      compoundingFrequency: 'daily',
    }),
  });
  assert.equal(invalid.status, 400);
  assert.ok((await invalid.json()).details.length > 0);

  const malformed = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{"principal":',
  });
  assert.equal(malformed.status, 400);
});
