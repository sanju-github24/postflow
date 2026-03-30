const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/authMiddleware');
const { getDB } = require('../config/database');
const { transformPost } = require('../services/aiService');

// 1. Configure Multer to handle memory storage for files
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit (adjust as needed)
});

/**
 * POST /api/posts/schedule
 * Handles Multi-platform scheduling with AI versions and Media uploads
 */
router.post('/schedule', protect, upload.any(), async (req, res) => {
  try {
    const supabase = getDB();
    
    // FormData sends everything as strings, so we parse JSON fields back to objects
    let { original_content, platform_versions, schedules } = req.body;
    const versions = typeof platform_versions === 'string' ? JSON.parse(platform_versions) : platform_versions;
    const scheduleArray = typeof schedules === 'string' ? JSON.parse(schedules) : schedules;

    // --- VALIDATION ---
    if (!original_content?.trim()) return res.status(400).json({ error: 'Content is required' });
    if (!scheduleArray || scheduleArray.length === 0) return res.status(400).json({ error: 'Add at least one schedule' });

    // Validate future dates
    for (const s of scheduleArray) {
      if (new Date(s.scheduled_at) <= new Date()) {
        return res.status(400).json({ error: `${s.platform} time must be in the future` });
      }
    }

    // --- MEDIA UPLOAD ---
    const mediaUrls = {};
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        // Field name is 'media_facebook', 'media_twitter', etc.
        const platformKey = file.fieldname.replace('media_', '');
        const fileExt = file.originalname.split('.').pop();
        const fileName = `${req.user.id}/${Date.now()}-${platformKey}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('post-media')
          .upload(fileName, file.buffer, { 
            contentType: file.mimetype,
            upsert: true 
          });

        if (uploadError) throw new Error(`Media upload failed: ${uploadError.message}`);

        // Get the Public URL to store in the DB
        const { data: { publicUrl } } = supabase.storage.from('post-media').getPublicUrl(fileName);
        mediaUrls[platformKey] = publicUrl;
      }
    }

    // --- DATABASE INSERT: MAIN POST ---
    // Target the 'scheduled_posts' table
const { data: post, error: postError } = await supabase
  .from('scheduled_posts') 
  .insert({
    user_id: req.user.id,
    original_content: original_content,
    // These are the columns we just added:
    version_facebook: versions.facebook || null,
    version_instagram: versions.instagram || null,
    version_twitter: versions.twitter || null,
    media_facebook: mediaUrls.facebook || null,
    media_instagram: mediaUrls.instagram || null,
    media_twitter: mediaUrls.twitter || null,
  })
  .select().single();

    if (postError) throw new Error(postError.message);

    // --- DATABASE INSERT: INDIVIDUAL SCHEDULES ---
    const { error: schedErr } = await supabase.from('post_schedules').insert(
      scheduleArray.map(s => ({
        post_id: post.id,
        user_id: req.user.id,
        platform: s.platform,
        scheduled_at: new Date(s.scheduled_at).toISOString(),
        status: 'pending',
      }))
    );

    if (schedErr) throw new Error(schedErr.message);

    res.status(201).json({ 
      message: 'Post scheduled successfully!', 
      post_id: post.id,
      media: mediaUrls 
    });

  } catch (err) {
    console.error("❌ Schedule Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/posts
 * Fetch all scheduled posts with their individual platform statuses
 */
router.get('/', protect, async (req, res) => {
  try {
    const { data, error } = await getDB()
      .from('scheduled_posts')
      .select('*, post_schedules(*)')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/posts/:id
 * Only allows deletion if none of the schedules have been 'published' yet
 */
router.delete('/:id', protect, async (req, res) => {
  try {
    const supabase = getDB();
    
    // Check if any part of the post is already published
    const { data: published } = await supabase
      .from('post_schedules')
      .select('id')
      .eq('post_id', req.params.id)
      .eq('status', 'published')
      .limit(1);

    if (published && published.length > 0) {
      return res.status(400).json({ error: 'Cannot delete a post that has already been published' });
    }

    const { error } = await supabase
      .from('scheduled_posts')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.json({ message: 'Post and schedules deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;