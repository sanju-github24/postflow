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
    
    // 1. Fetch data using the actual column names from your Supabase table
    const { data: accounts, error } = await supabase
      .from('connected_accounts')
      .select('platform, platform_user_id, connected_at') // Fixed: used platform_user_id
      .eq('user_id', req.user.id);

    if (error) {
      console.error('❌ Supabase Query Error:', error.message);
      throw error;
    }

    // 2. Map through our supported platforms to create a consistent response
    const supportedPlatforms = ['facebook', 'instagram', 'twitter'];
    
    const status = supportedPlatforms.map(platformName => {
      // Find if this platform exists in the database results
      const found = (accounts || []).find(
        a => a.platform.toLowerCase() === platformName.toLowerCase()
      );

      return {
        platform: platformName,
        // If a row exists, it is connected
        connected: !!found, 
        // Use platform_user_id as the username if the 'username' column is empty
        username: found ? (found.username || found.platform_user_id || 'Connected User') : null,
        connected_at: found?.connected_at || null
      };
    });

    // Debugging: Log what the backend is actually sending
    console.log(`📊 [Status] Sent for User ${req.user.id}:`, JSON.stringify(status));

    res.json(status);
  } catch (err) {
    console.error('❌ Status Route Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;