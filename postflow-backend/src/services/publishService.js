const axios = require('axios');
const { TwitterApi } = require('twitter-api-v2');
const { decrypt } = require('../utils/encryption');

// ── Facebook ──────────────────────────────────────────────────────────────────
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

// ── Instagram ─────────────────────────────────────────────────────────────────
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

  const containerRes = await axios.post(`https://graph.facebook.com/v18.0/${igId}/media`, {
    [isVideo ? 'video_url' : 'image_url']: fileUrl,
    caption: content,
    media_type: isVideo ? 'REELS' : 'IMAGE',
    access_token: token,
  });

  const creationId = containerRes.data.id;

  if (isVideo) {
    await pollInstagramStatus(creationId, token);
  }

  const publishRes = await axios.post(`https://graph.facebook.com/v18.0/${igId}/media_publish`, {
    creation_id: creationId,
    access_token: token,
  });

  return publishRes.data.id;
};

// ── Twitter ───────────────────────────────────────────────────────────────────
const postToTwitter = async (account, content, fileUrl) => {
  const accessToken = decrypt(account.access_token);
  const client = new TwitterApi(accessToken);

  let tweetText = content;
  if (fileUrl) {
    tweetText = `${content}\n\n${fileUrl}`;
  }

  const tweet = tweetText.length > 280 ? tweetText.slice(0, 277) + '...' : tweetText;

  try {
    const { data } = await client.v2.tweet(tweet);
    return data.id;
  } catch (err) {
    const details = err.data || err.message;
    console.error('🐦 Twitter API Error:', JSON.stringify(details, null, 2));
    throw err;
  }
};

// ── LinkedIn ──────────────────────────────────────────────────────────────────

/**
 * Step 1: Register image upload with LinkedIn → get uploadUrl + image URN
 */
const registerLinkedInImage = async (token, authorUrn) => {
  const res = await axios.post(
    'https://api.linkedin.com/v2/assets?action=registerUpload',
    {
      registerUploadRequest: {
        recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
        owner: authorUrn,
        serviceRelationships: [
          {
            relationshipType: 'OWNER',
            identifier: 'urn:li:userGeneratedContent',
          },
        ],
      },
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
    }
  );

  const uploadUrl = res.data.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl;
  const imageUrn = res.data.value.asset;
  return { uploadUrl, imageUrn };
};

/**
 * Step 2: Download image from Supabase URL and upload binary to LinkedIn
 */
const uploadImageToLinkedIn = async (uploadUrl, fileUrl, token) => {
  // Download image as binary buffer
  const imageRes = await axios.get(fileUrl, { responseType: 'arraybuffer' });
  const imageBuffer = Buffer.from(imageRes.data);

  // Upload binary to LinkedIn's upload URL
  await axios.put(uploadUrl, imageBuffer, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/octet-stream',
    },
  });
};

const postToLinkedIn = async (account, content, fileUrl) => {
  const token = decrypt(account.access_token);
  const authorUrn = `urn:li:person:${account.page_id}`;

  let postBody;

  if (fileUrl) {
    const isVideo = fileUrl.match(/\.(mp4|mov|avi)$/i);

    if (isVideo) {
      // Video: append URL to text for MVP (native video upload is complex)
      postBody = {
        author: authorUrn,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: { text: `${content}\n\n${fileUrl}` },
            shareMediaCategory: 'NONE',
          },
        },
        visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
      };
    } else {
      // ✅ FIX: Image requires 3-step upload — register → upload binary → post with URN
      console.log('📸 LinkedIn: Registering image upload...');
      const { uploadUrl, imageUrn } = await registerLinkedInImage(token, authorUrn);

      console.log('📤 LinkedIn: Uploading image binary...');
      await uploadImageToLinkedIn(uploadUrl, fileUrl, token);

      console.log('📝 LinkedIn: Creating post with image URN:', imageUrn);
      postBody = {
        author: authorUrn,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: { text: content },
            shareMediaCategory: 'IMAGE',
            media: [
              {
                status: 'READY',
                description: { text: content.slice(0, 200) },
                media: imageUrn, // ✅ URN not URL
                title: { text: 'Image' },
              },
            ],
          },
        },
        visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
      };
    }
  } else {
    // Text-only post
    postBody = {
      author: authorUrn,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text: content },
          shareMediaCategory: 'NONE',
        },
      },
      visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
    };
  }

  try {
    const res = await axios.post(
      'https://api.linkedin.com/v2/ugcPosts',
      postBody,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
        },
      }
    );

    const postId = res.headers['x-restli-id'] || res.data.id || 'posted';
    console.log(`✅ LinkedIn post created: ${postId}`);
    return postId;
  } catch (err) {
    const details = err.response?.data || err.message;
    console.error('💼 LinkedIn API Error:', JSON.stringify(details, null, 2));
    throw err;
  }
};

// ── Main Router ───────────────────────────────────────────────────────────────
const publish = async (platform, account, content, fileUrl = null) => {
  switch (platform) {
    case 'facebook':  return postToFacebook(account, content, fileUrl);
    case 'instagram': return postToInstagram(account, content, fileUrl);
    case 'twitter':   return postToTwitter(account, content, fileUrl);
    case 'linkedin':  return postToLinkedIn(account, content, fileUrl);
    default: throw new Error(`Unknown platform: ${platform}`);
  }
};

module.exports = { publish };