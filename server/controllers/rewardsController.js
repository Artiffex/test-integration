const { getRewardsProjection } = require('../services/rewardsService');
const { validateRewardsInput } = require('../validation/rewardsValidation');

function calculateRewardsController(req, res, next) {
  try {
    const { errors, value } = validateRewardsInput(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Invalid reward calculation request.',
        details: errors,
      });
    }

    return res.json(getRewardsProjection(value));
  } catch (error) {
    return next(error);
  }
}

module.exports = { calculateRewardsController };
