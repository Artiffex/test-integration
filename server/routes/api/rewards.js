const express = require('express');
const { calculateRewardsController } = require('../../controllers/rewardsController');

const router = express.Router();

router.post('/calculate-rewards', calculateRewardsController);

module.exports = router;
