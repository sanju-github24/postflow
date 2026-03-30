const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getDB } = require('../config/database');

/**
 * GET /api/platforms/status
 * Fetches connection status for all supported social media platforms
 */
router.get('/status', protect, async (req, res) => {
  try {
    const supabase = getDB();

    const { data: accounts, error } = await supabase
      .from('connected_accounts')
      .select('platform, username, platform_user_id, connected_at')
      .eq('user_id', req.user.id);

    if (error) {
      console.error('❌ Supabase Query Error:', error.message);
      throw error;
    }

    // ✅ FIX: Added 'linkedin' to supported platforms
    const supportedPlatforms = ['facebook', 'instagram', 'twitter', 'linkedin'];

    const status = supportedPlatforms.map(platformName => {
      const found = (accounts || []).find(
        a => a.platform.toLowerCase() === platformName.toLowerCase()
      );

      return {
        platform: platformName,
        connected: !!found,
        username: found ? (found.username || found.platform_user_id || 'Connected') : null,
        connected_at: found?.connected_at || null,
      };
    });

    console.log(`📊 [Status] Sent for User ${req.user.id}:`, JSON.stringify(status));

    res.json(status);
  } catch (err) {
    console.error('❌ Status Route Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;