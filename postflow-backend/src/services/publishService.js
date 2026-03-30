const axios = require('axios');
const { TwitterApi } = require('twitter-api-v2');
const { decrypt } = require('../utils/encryption');

// ── Facebook: Supports Link-based uploads ─────────────────────────────────────
const postToFacebook = async (account, content, fileUrl) => {
  const token = decrypt(account.access_token);
  const pageId = account.page_id;

  let endpoint = `https://graph.facebook.com/v18.0/${pageId}/feed`;
  let payload = { message: content, access_token: token };

  if (fileUrl) {
    const isVideo = fileUrl.match(/\.(mp4|mov|avi)$/i);
    endpoint = `https://graph.facebook.com/v18.0/${pageId}/${isVideo ? 'videos' : 'photos'}`;
    payload = {
      ...(isVideo
        ? { description: content, file_url: fileUrl, published: true }
        : { caption: content, url: fileUrl }),
      access_token: token,
    };
  }

  const res = await axios.post(endpoint, payload);
  return res.data.id || res.data.post_id;
};

// ── Instagram: Two-step Container Process with Polling ────────────────────────
/**
 * Polls Instagram media status until it's FINISHED or errors out.
 * Required for videos/reels before publishing.
 */
const pollInstagramStatus = async (creationId, token, retries = 10, interval = 5000) => {
  for (let i = 0; i < retries; i++) {
    const { data } = await axios.get(
      `https://graph.facebook.com/v18.0/${creationId}`,
      { params: { fields: 'status_code', access_token: token } }
    );

    console.log(`📡 Instagram media status [${i + 1}/${retries}]: ${data.status_code}`);

    if (data.status_code === 'FINISHED') return;
    if (data.status_code === 'ERROR') throw new Error('Instagram media processing failed');

    await new Promise((r) => setTimeout(r, interval));
  }
  throw new Error('Instagram media processing timed out');
};

const postToInstagram = async (account, content, fileUrl) => {
  const token = decrypt(account.access_token);
  const igId = account.page_id;

  if (!fileUrl) throw new Error('Instagram requires an image or video');

  const isVideo = fileUrl.match(/\.(mp4|mov|avi)$/i);

  // 1. Create Media Container
  const containerRes = await axios.post(`https://graph.facebook.com/v18.0/${igId}/media`, {
    [isVideo ? 'video_url' : 'image_url']: fileUrl,
    caption: content,
    media_type: isVideo ? 'REELS' : 'IMAGE',
    access_token: token,
  });

  const creationId = containerRes.data.id;

  // 2. Poll until media is ready (critical for videos)
  if (isVideo) {
    await pollInstagramStatus(creationId, token);
  }

  // 3. Publish Container
  const publishRes = await axios.post(`https://graph.facebook.com/v18.0/${igId}/media_publish`, {
    creation_id: creationId,
    access_token: token,
  });

  return publishRes.data.id;
};

// ── Twitter: OAuth 2.0 User Access Token ─────────────────────────────────────
const postToTwitter = async (account, content, fileUrl) => {
  // ✅ Uses OAuth 2.0 user access token — matches what your Twitter OAuth
  // callback saves to connected_accounts.access_token in the DB
  const accessToken = decrypt(account.access_token);

  const client = new TwitterApi(accessToken);

  let tweetText = content;
  if (fileUrl) {
    tweetText = `${content}\n\n${fileUrl}`;
  }

  // Enforce 280 char limit
  const tweet = tweetText.length > 280 ? tweetText.slice(0, 277) + '...' : tweetText;

  try {
    const { data } = await client.v2.tweet(tweet);
    return data.id;
  } catch (err) {
    // Log full Twitter error details for easier debugging
    const details = err.data || err.message;
    console.error('🐦 Twitter API Error:', JSON.stringify(details, null, 2));
    throw err;
  }
};

// ── Main Router ───────────────────────────────────────────────────────────────
const publish = async (platform, account, content, fileUrl = null) => {
  switch (platform) {
    case 'facebook':  return postToFacebook(account, content, fileUrl);
    case 'instagram': return postToInstagram(account, content, fileUrl);
    case 'twitter':   return postToTwitter(account, content, fileUrl);
    default: throw new Error(`Unknown platform: ${platform}`);
  }
};

module.exports = { publish };