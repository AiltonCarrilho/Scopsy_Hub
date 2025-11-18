/**
 * Dashboard Routes
 */

const express = require('express');
const router = express.Router();

router.get('/stats', (req, res) => {
  res.json({
    cases_completed: 0,
    practice_hours: 0,
    accuracy: 0,
    streak_days: 0,
    xp_points: 0
  });
});

module.exports = router;