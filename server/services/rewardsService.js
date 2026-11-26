const {
  DAYS_PER_YEAR,
  calculateRewards,
} = require('../utils/rewardsCalculator');

function getRewardsProjection(input) {
  const years =
    input.durationUnit === 'days'
      ? input.duration / DAYS_PER_YEAR
      : input.duration;
  const result = calculateRewards({
    principal: input.principal,
    apy: input.apy,
    years,
    compoundingFrequency: input.compoundingFrequency,
  });

  return {
    ...result,
    normalizedDuration: {
      years,
      days: years * DAYS_PER_YEAR,
      unit: 'years',
    },
    ...(input.tokenPrice === undefined
      ? {}
      : {
          usdProjection: {
            projectedBalance: result.projectedBalance * input.tokenPrice,
            rewardsEarned: result.rewardsEarned * input.tokenPrice,
            currency: 'USD',
          },
        }),
  };
}

module.exports = { getRewardsProjection };
