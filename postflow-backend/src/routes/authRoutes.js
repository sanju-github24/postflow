const express = require('express');
const router = express.Router();
const axios = require('axios');
const bcrypt = require('bcryptjs');
const { getDB } = require('../config/database');
const { protect, generateToken } = require('../middleware/authMiddleware');
const { encrypt } = require('../utils/encryption');

// POST /auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: 'Name, email and password are required' });

    const supabase = getDB();

    const { data: existing } = await supabase
      .from('users').select('id').eq('email', email.toLowerCase()).single();
    if (existing)
      return res.status(400).json({ error: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 12);
    const { data: user, error } = await supabase
      .from('users')
      .insert({ name, email: email.toLowerCase(), password: hashed })
      .select('id, name, email')
      .single();

    if (error) throw new Error(error.message);

    res.status(201).json({
      message: 'Account created!',
      token: generateToken(user.id),
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password are required' });

    const supabase = getDB();
    const { data: user } = await supabase
      .from('users').select('*').eq('email', email.toLowerCase()).single();

    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ error: 'Invalid email or password' });

    res.json({
      token: generateToken(user.id),
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /auth/me
router.get('/me', protect, async (req, res) => {
  try {
    const supabase = getDB();
    const { data: accounts } = await supabase
      .from('connected_accounts')
      .select('platform, username, connected_at')
      .eq('user_id', req.user.id);

    res.json({ ...req.user, connected_platforms: accounts || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Facebook ──────────────────────────────────────────────────────────────────

// GET /auth/facebook
router.get('/facebook', (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(401).json({ error: 'Authentication required' });

  const scopes = 'pages_manage_posts,pages_read_engagement,instagram_basic,instagram_content_publish';
  res.redirect(
    `https://www.facebook.com/v18.0/dialog/oauth` +
    `?client_id=${process.env.FACEBOOK_APP_ID}` +
    `&redirect_uri=${encodeURIComponent(process.env.FACEBOOK_CALLBACK_URL)}` +
    `&scope=${scopes}&state=${userId}`
  );
});

// GET /auth/facebook/callback
router.get('/facebook/callback', async (req, res) => {
  try {
    const { code, state: userId } = req.query;
    if (!code) return res.redirect(`${process.env.FRONTEND_URL}/accounts?error=facebook_denied`);

    const tokenRes = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
      params: {
        client_id: process.env.FACEBOOK_APP_ID,
        client_secret: process.env.FACEBOOK_APP_SECRET,
        redirect_uri: process.env.FACEBOOK_CALLBACK_URL,
        code
      },
    });
    const { access_token } = tokenRes.data;

    const pagesRes = await axios.get('https://graph.facebook.com/v18.0/me/accounts', { params: { access_token } });
    const page = pagesRes.data.data?.[0];
    const pageToken = page?.access_token || access_token;
    const pageId = page?.id;

    const fbUser = await axios.get('https://graph.facebook.com/v18.0/me', { params: { access_token, fields: 'id,name' } });

    const supabase = getDB();
    await supabase.from('connected_accounts').upsert({
      user_id: userId, platform: 'facebook',
      access_token: encrypt(pageToken), platform_user_id: fbUser.data.id,
      username: fbUser.data.name, page_id: pageId, connected_at: new Date().toISOString(),
    }, { onConflict: 'user_id,platform' });

    // Try to link Instagram
    try {
      const igRes = await axios.get(`https://graph.facebook.com/v18.0/${pageId}`, {
        params: { fields: 'instagram_business_account', access_token: pageToken },
      });
      const igId = igRes.data?.instagram_business_account?.id;
      if (igId) {
        const igInfo = await axios.get(`https://graph.facebook.com/v18.0/${igId}`, {
          params: { fields: 'username', access_token: pageToken },
        });
        await supabase.from('connected_accounts').upsert({
          user_id: userId, platform: 'instagram',
          access_token: encrypt(pageToken), platform_user_id: igId,
          username: igInfo.data?.username || '', page_id: igId, connected_at: new Date().toISOString(),
        }, { onConflict: 'user_id,platform' });
      }
    } catch (_) {}

    res.redirect(`${process.env.FRONTEND_URL}/accounts?connected=facebook`);
  } catch (err) {
    console.error('Facebook OAuth error:', err.message);
    res.redirect(`${process.env.FRONTEND_URL}/accounts?error=facebook_failed`);
  }
});

// ── Twitter ───────────────────────────────────────────────────────────────────

// GET /auth/twitter
router.get('/twitter', (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(401).json({ error: 'Authentication required' });

  const verifier = Math.random().toString(36).repeat(3).slice(2, 50);

  res.redirect(
    `https://twitter.com/i/oauth2/authorize?response_type=code` +
    `&client_id=${process.env.TWITTER_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(process.env.TWITTER_CALLBACK_URL)}` +
    `&scope=tweet.read%20tweet.write%20users.read%20offline.access` +
    `&state=${encodeURIComponent(`${userId}::${verifier}`)}` +
    `&code_challenge=${verifier}&code_challenge_method=plain`
  );
});

// GET /auth/twitter/callback
router.get('/twitter/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    if (!code) return res.redirect(`${process.env.FRONTEND_URL}/accounts?error=twitter_denied`);

    const [userId, verifier] = decodeURIComponent(state).split('::');
    const tokenRes = await axios.post(
      'https://api.twitter.com/2/oauth2/token',
      new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        redirect_uri: process.env.TWITTER_CALLBACK_URL,
        code_verifier: verifier
      }),
      {
        auth: {
          username: process.env.TWITTER_CLIENT_ID,
          password: process.env.TWITTER_CLIENT_SECRET
        },
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );
    const { access_token, refresh_token } = tokenRes.data;

    const userRes = await axios.get('https://api.twitter.com/2/users/me', {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    const twitterUser = userRes.data.data;

    const supabase = getDB();
    await supabase.from('connected_accounts').upsert({
      user_id: userId, platform: 'twitter',
      access_token: encrypt(access_token),
      refresh_token: refresh_token ? encrypt(refresh_token) : null,
      platform_user_id: twitterUser.id,
      username: twitterUser.username,
      connected_at: new Date().toISOString(),
    }, { onConflict: 'user_id,platform' });

    res.redirect(`${process.env.FRONTEND_URL}/accounts?connected=twitter`);
  } catch (err) {
    console.error('Twitter OAuth error:', err.message);
    res.redirect(`${process.env.FRONTEND_URL}/accounts?error=twitter_failed`);
  }
});

// ── LinkedIn ──────────────────────────────────────────────────────────────────

// GET /auth/linkedin
router.get('/linkedin', (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(401).json({ error: 'Authentication required' });

  const scopes = 'openid profile email w_member_social';
  res.redirect(
    `https://www.linkedin.com/oauth/v2/authorization?response_type=code` +
    `&client_id=${process.env.LINKEDIN_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(process.env.LINKEDIN_CALLBACK_URL)}` +
    `&scope=${encodeURIComponent(scopes)}` +
    `&state=${userId}`
  );
});

// GET /auth/linkedin/callback
// GET /auth/linkedin/callback
router.get('/linkedin/callback', async (req, res) => {
  try {
    const { code, state: userId } = req.query;

    console.log('🔵 LinkedIn callback fired');
    console.log('🔵 code:', code ? 'EXISTS' : 'MISSING');
    console.log('🔵 userId from state:', userId, '| type:', typeof userId);

    if (!code) return res.redirect(`${process.env.FRONTEND_URL}/accounts?error=linkedin_denied`);

    const tokenRes = await axios.post(
      'https://www.linkedin.com/oauth/v2/accessToken',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.LINKEDIN_CALLBACK_URL,
        client_id: process.env.LINKEDIN_CLIENT_ID,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET,
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    const { access_token } = tokenRes.data;
    console.log('🔵 access_token:', access_token ? 'EXISTS' : 'MISSING');

    const profileRes = await axios.get('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const profile = profileRes.data;
    console.log('🔵 profile:', JSON.stringify(profile));

    const supabase = getDB();

    // ── Direct INSERT first to isolate upsert issues ──
    const { data, error } = await supabase
      .from('connected_accounts')
      .upsert({
        user_id:          userId,
        platform:         'linkedin',
        access_token:     encrypt(access_token),
        platform_user_id: profile.sub,
        username:         profile.name || profile.email,
        page_id:          profile.sub,
        connected_at:     new Date().toISOString(),
      }, { onConflict: 'user_id,platform' })
      .select(); // ← .select() forces Supabase to return the row + any error

    console.log('🔵 upsert data:', JSON.stringify(data));
    console.log('🔵 upsert error:', error ? JSON.stringify(error) : 'NONE');

    if (error) throw new Error(error.message);

    res.redirect(`${process.env.FRONTEND_URL}/accounts?connected=linkedin`);
  } catch (err) {
    console.error('❌ LinkedIn OAuth error:', err.message);
    if (err.response?.data) {
      console.error('❌ LinkedIn error details:', JSON.stringify(err.response.data, null, 2));
    }
    res.redirect(`${process.env.FRONTEND_URL}/accounts?error=linkedin_failed`);
  }
});
// ── Disconnect ────────────────────────────────────────────────────────────────

// DELETE /auth/disconnect/:platform
router.delete('/disconnect/:platform', protect, async (req, res) => {
  try {
    await getDB().from('connected_accounts').delete()
      .eq('user_id', req.user.id).eq('platform', req.params.platform);
    res.json({ message: `${req.params.platform} disconnected` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;