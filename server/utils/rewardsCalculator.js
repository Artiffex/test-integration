const PERIODS_PER_YEAR = Object.freeze({
  daily: 365,
  weekly: 52,
  monthly: 12,
  annually: 1,
});

const CHART_POINTS = 61;
const DAYS_PER_YEAR = 365;

/**
 * APY is an effective annual yield, not a nominal annual rate. Convert it to
 * an equivalent per-period rate, then allow fractional periods when sampling
 * the chart. This preserves the effective annual yield for every frequency.
 */
function calculateBalance(principal, apy, years, compoundingFrequency) {
  const periodsPerYear = PERIODS_PER_YEAR[compoundingFrequency];
  if (!periodsPerYear) {
    throw new RangeError('Unsupported compounding frequency.');
  }

  const annualGrowth = 1 + apy / 100;
  const periodicRate = Math.pow(annualGrowth, 1 / periodsPerYear) - 1;
  return principal * Math.pow(1 + periodicRate, periodsPerYear * years);
}

function calculateRewards({
  principal,
  apy,
  years,
  compoundingFrequency,
}) {
  const projectedBalance = calculateBalance(
    principal,
    apy,
    years,
    compoundingFrequency
  );
  const chartData = Array.from({ length: CHART_POINTS }, (_, index) => {
    const elapsedYears = (years * index) / (CHART_POINTS - 1);
    return {
      day: Math.round(elapsedYears * DAYS_PER_YEAR),
      year: elapsedYears,
      balance: calculateBalance(
        principal,
        apy,
        elapsedYears,
        compoundingFrequency
      ),
    };
  });

  return {
    projectedBalance,
    rewardsEarned: projectedBalance - principal,
    chartData,
  };
}

module.exports = {
  CHART_POINTS,
  DAYS_PER_YEAR,
  PERIODS_PER_YEAR,
  calculateBalance,
  calculateRewards,
};
