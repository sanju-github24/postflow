const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { transformPost } = require('../services/aiService');

// POST /api/ai/transform
router.post('/transform', protect, async (req, res) => {
  try {
    const { content, platforms } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'Content is required' });

    const selected = platforms || ['facebook', 'instagram', 'twitter'];
    const versions = await transformPost(content.trim(), selected);
    res.json({ original: content, versions });
  } catch (err) {
    res.status(500).json({ error: 'AI failed: ' + err.message });
  }
});

module.exports = router;
