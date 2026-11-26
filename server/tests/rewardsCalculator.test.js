const test = require('node:test');
const assert = require('node:assert/strict');
const {
  CHART_POINTS,
  calculateBalance,
  calculateRewards,
} = require('../utils/rewardsCalculator');
const { getRewardsProjection } = require('../services/rewardsService');
const { validateRewardsInput } = require('../validation/rewardsValidation');

test('effective 5% APY returns the same annual balance for all compounding options', () => {
  for (const frequency of ['daily', 'weekly', 'monthly', 'annually']) {
    assert.ok(
      Math.abs(calculateBalance(1000, 5, 1, frequency) - 1050) < 1e-9
    );
  }
});

test('supports fractional years and zero APY', () => {
  assert.ok(Math.abs(calculateBalance(1000, 5, 1.5, 'monthly') - 1000 * 1.05 ** 1.5) < 1e-9);
  assert.equal(calculateBalance(1000, 0, 1.5, 'daily'), 1000);
});

test('returns chart points from the initial stake through the final balance', () => {
  const result = calculateRewards({
    principal: 1000,
    apy: 5,
    years: 1.5,
    compoundingFrequency: 'monthly',
  });

  assert.equal(result.chartData.length, CHART_POINTS);
  assert.equal(result.chartData[0].balance, 1000);
  assert.equal(result.chartData[CHART_POINTS - 1].balance, result.projectedBalance);
  assert.equal(result.rewardsEarned, result.projectedBalance - 1000);
});

test('normalizes days and adds optional USD projections', () => {
  const result = getRewardsProjection({
    principal: 1000,
    apy: 5,
    duration: 365,
    durationUnit: 'days',
    compoundingFrequency: 'daily',
    tokenPrice: 2,
  });

  assert.equal(result.normalizedDuration.years, 1);
  assert.ok(Math.abs(result.usdProjection.projectedBalance - 2100) < 1e-8);
});

test('rejects invalid values and unsupported options', () => {
  const { errors } = validateRewardsInput({
    principal: -1,
    apy: 5,
    duration: 365,
    durationUnit: 'months',
    compoundingFrequency: 'hourly',
  });

  assert.equal(errors.length, 3);
});

test('rejects durations outside the supported range', () => {
  const { errors } = validateRewardsInput({
    principal: 100,
    apy: 0,
    duration: 101,
    durationUnit: 'years',
    compoundingFrequency: 'annually',
  });

  assert.ok(errors.some((error) => error.includes('100 years')));
});
