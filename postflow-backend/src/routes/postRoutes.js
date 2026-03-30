const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/authMiddleware');
const { getDB } = require('../config/database');
const { transformPost } = require('../services/aiService');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

/**
 * POST /api/posts/schedule
 */
router.post('/schedule', protect, upload.any(), async (req, res) => {
  try {
    const supabase = getDB();

    let { original_content, platform_versions, schedules } = req.body;
    const versions      = typeof platform_versions === 'string' ? JSON.parse(platform_versions) : platform_versions;
    const scheduleArray = typeof schedules === 'string' ? JSON.parse(schedules) : schedules;

    if (!original_content?.trim())
      return res.status(400).json({ error: 'Content is required' });
    if (!scheduleArray || scheduleArray.length === 0)
      return res.status(400).json({ error: 'Add at least one schedule' });

    for (const s of scheduleArray) {
      if (new Date(s.scheduled_at) <= new Date())
        return res.status(400).json({ error: `${s.platform} time must be in the future` });
    }

    // ── Media upload ──────────────────────────────────────────────────────────
    const mediaUrls = {};
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const platformKey = file.fieldname.replace('media_', '');
        const fileExt     = file.originalname.split('.').pop();
        const fileName    = `${req.user.id}/${Date.now()}-${platformKey}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('post-media')
          .upload(fileName, file.buffer, { contentType: file.mimetype, upsert: true });

        if (uploadError) throw new Error(`Media upload failed: ${uploadError.message}`);

        const { data: { publicUrl } } = supabase.storage.from('post-media').getPublicUrl(fileName);
        mediaUrls[platformKey] = publicUrl;
      }
    }

    // ── Insert post ───────────────────────────────────────────────────────────
    const { data: post, error: postError } = await supabase
      .from('scheduled_posts')
      .insert({
        user_id:           req.user.id,
        original_content:  original_content,
        version_facebook:  versions?.facebook  || null,
        version_instagram: versions?.instagram || null,
        version_twitter:   versions?.twitter   || null,
        version_linkedin:  versions?.linkedin  || null,  // ✅ LinkedIn
        media_facebook:    mediaUrls.facebook  || null,
        media_instagram:   mediaUrls.instagram || null,
        media_twitter:     mediaUrls.twitter   || null,
        media_linkedin:    mediaUrls.linkedin  || null,  // ✅ LinkedIn
      })
      .select()
      .single();

    if (postError) throw new Error(postError.message);

    // ── Insert schedules ──────────────────────────────────────────────────────
    const { error: schedErr } = await supabase.from('post_schedules').insert(
      scheduleArray.map(s => ({
        post_id:      post.id,
        user_id:      req.user.id,
        platform:     s.platform,
        scheduled_at: new Date(s.scheduled_at).toISOString(),
        status:       'pending',
      }))
    );

    if (schedErr) throw new Error(schedErr.message);

    res.status(201).json({
      message: 'Post scheduled successfully!',
      post_id: post.id,
      media:   mediaUrls,
    });

  } catch (err) {
    console.error('❌ Schedule Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/posts
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
 */
router.delete('/:id', protect, async (req, res) => {
  try {
    const supabase = getDB();

    const { data: published } = await supabase
      .from('post_schedules')
      .select('id')
      .eq('post_id', req.params.id)
      .eq('status', 'published')
      .limit(1);

    if (published && published.length > 0)
      return res.status(400).json({ error: 'Cannot delete a post that has already been published' });

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