const jwt = require('jsonwebtoken');
const { getDB } = require('../config/database');

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Debug — remove after fixing
    console.log('Auth header received:', authHeader || 'NONE');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token. Please login.' });
    }

    const token = authHeader.split(' ')[1];

    if (!token || token === 'null' || token === 'undefined') {
      return res.status(401).json({ error: 'Invalid token value.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const supabase = getDB();
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('id', decoded.id)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'User not found.' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('Auth error:', err.message);
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

module.exports = { protect, generateToken };