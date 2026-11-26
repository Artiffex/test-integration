const ALLOWED_DURATION_UNITS = new Set(['days', 'years']);
const ALLOWED_FREQUENCIES = new Set([
  'daily',
  'weekly',
  'monthly',
  'annually',
]);

function validateRewardsInput(body) {
  const errors = [];
  const input = body && typeof body === 'object' && !Array.isArray(body)
    ? body
    : {};
  const numericFields = [
    ['principal', { min: 0, max: 1e12, exclusiveMin: true }],
    ['apy', { min: 0, max: 1000 }],
  ];

  numericFields.forEach(([field, bounds]) => {
    const value = input[field];
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      errors.push(`${field} must be a finite number.`);
    } else if (
      value < bounds.min ||
      (bounds.exclusiveMin && value === bounds.min) ||
      value > bounds.max
    ) {
      const minimum = bounds.exclusiveMin ? 'greater than 0' : 'at least 0';
      errors.push(`${field} must be ${minimum} and no greater than ${bounds.max}.`);
    }
  });

  if (!ALLOWED_DURATION_UNITS.has(input.durationUnit)) {
    errors.push('durationUnit must be either "days" or "years".');
  }
  if (typeof input.duration !== 'number' || !Number.isFinite(input.duration)) {
    errors.push('duration must be a finite number.');
  } else if (input.duration <= 0) {
    errors.push('duration must be greater than 0.');
  } else if (ALLOWED_DURATION_UNITS.has(input.durationUnit)) {
    const maxDuration = input.durationUnit === 'days' ? 36500 : 100;
    if (input.duration > maxDuration) {
      errors.push(
        `duration cannot exceed ${maxDuration} ${input.durationUnit}.`
      );
    }
  }
  if (!ALLOWED_FREQUENCIES.has(input.compoundingFrequency)) {
    errors.push(
      'compoundingFrequency must be "daily", "weekly", "monthly", or "annually".'
    );
  }
  if (
    input.tokenPrice !== undefined &&
    (typeof input.tokenPrice !== 'number' ||
      !Number.isFinite(input.tokenPrice) ||
      input.tokenPrice < 0 ||
      input.tokenPrice > 1e12)
  ) {
    errors.push('tokenPrice must be a finite number between 0 and 1000000000000.');
  }

  return {
    errors,
    value: {
      principal: input.principal,
      apy: input.apy,
      duration: input.duration,
      durationUnit: input.durationUnit,
      compoundingFrequency: input.compoundingFrequency,
      tokenPrice: input.tokenPrice,
    },
  };
}

module.exports = { validateRewardsInput };
