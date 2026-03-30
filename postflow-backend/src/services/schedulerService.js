const cron = require('node-cron');
const { getDB } = require('../config/database');
const { publish } = require('./publishService');

let running = false;

/**
 * Deletes media from Supabase Storage after a successful post
 */
const cleanupStorage = async (supabase, publicUrl) => {
  if (!publicUrl) return;
  try {
    const path = publicUrl.split('/post-media/')[1]?.split('?')[0];
    if (path) {
      const { error } = await supabase.storage.from('post-media').remove([path]);
      if (error) throw error;
      console.log(`🧹 Storage Cleaned: ${path}`);
    }
  } catch (err) {
    console.error('⚠️ Cleanup error:', err.message);
  }
};

/**
 * Generates a short-lived signed URL for private Supabase buckets.
 */
const getAccessibleUrl = async (supabase, fileUrl) => {
  if (!fileUrl) return null;
  try {
    const pathMatch = fileUrl.split('/post-media/')[1]?.split('?')[0];
    if (!pathMatch) return fileUrl;

    const { data, error } = await supabase.storage
      .from('post-media')
      .createSignedUrl(pathMatch, 900); // 15 minutes

    if (error) {
      console.warn('⚠️ Could not create signed URL, using original:', error.message);
      return fileUrl;
    }

    console.log(`🔗 Signed URL generated for: ${pathMatch}`);
    return data.signedUrl;
  } catch (err) {
    console.warn('⚠️ Signed URL generation failed, using original URL:', err.message);
    return fileUrl;
  }
};

const checkAndPublish = async () => {
  if (running) return;
  running = true;

  try {
    const supabase = getDB();
    const now = new Date().toISOString();

    // ✅ SELECT includes all 4 platforms including linkedin
    const { data: due, error: fetchError } = await supabase
      .from('post_schedules')
      .select(`
        id,
        platform,
        post_id,
        scheduled_posts(
          id,
          user_id,
          version_facebook,
          version_instagram,
          version_twitter,
          version_linkedin,
          media_facebook,
          media_instagram,
          media_twitter,
          media_linkedin
        )
      `)
      .eq('status', 'pending')
      .lte('scheduled_at', now);

    if (fetchError) {
      console.error('❌ Scheduler query error:', fetchError.message);
      return;
    }

    if (!due || due.length === 0) return;

    console.log(`⏰ Scheduler: Processing ${due.length} due post(s)...`);

    for (const schedule of due) {
      const post = schedule.scheduled_posts;
      if (!post) continue;

      // ✅ Dynamically maps content + media for all 4 platforms
      const content    = post[`version_${schedule.platform}`];
      const rawFileUrl = post[`media_${schedule.platform}`];

      if (!content) {
        await supabase.from('post_schedules')
          .update({ status: 'failed', error: 'No content found for this platform' })
          .eq('id', schedule.id);
        continue;
      }

      // Fetch connected account
      const { data: account, error: accError } = await supabase
        .from('connected_accounts')
        .select('access_token, refresh_token, page_id')
        .eq('user_id', post.user_id)
        .eq('platform', schedule.platform)
        .maybeSingle();

      if (accError || !account) {
        await supabase.from('post_schedules')
          .update({ status: 'failed', error: 'Account not connected' })
          .eq('id', schedule.id);
        console.error(`❌ No ${schedule.platform} account for user ${post.user_id}`);
        continue;
      }

      try {
        const fileUrl = await getAccessibleUrl(supabase, rawFileUrl);
        const platformPostId = await publish(schedule.platform, account, content, fileUrl);

        await supabase.from('post_schedules')
          .update({
            status:               'posted',
            posted_at:            new Date().toISOString(),
            post_id_on_platform:  String(platformPostId),
          })
          .eq('id', schedule.id);

        console.log(`✅ Posted to ${schedule.platform} (ID: ${platformPostId})`);

        if (rawFileUrl) await cleanupStorage(supabase, rawFileUrl);

      } catch (err) {
        const errorMsg = err.response?.data?.error?.message || err.message;
        await supabase.from('post_schedules')
          .update({ status: 'failed', error: errorMsg })
          .eq('id', schedule.id);
        console.error(`❌ Failed to post to ${schedule.platform}:`, errorMsg);
        if (err.response?.data) {
          console.error('📋 API Error Details:', JSON.stringify(err.response.data, null, 2));
        }
      }
    }
  } catch (err) {
    console.error('🔥 Global Worker Error:', err.message);
  } finally {
    running = false;
  }
};

const start = () => {
  cron.schedule('* * * * *', checkAndPublish);
  console.log('✅ Scheduler active: Monitoring post_schedules every minute.');
};

module.exports = { start };