const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');

const issueToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

const register = async ({ full_name, email, password, role }) => {
  // Check duplicate
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (existing) throw { status: 409, message: 'Email already registered' };

  const password_hash = await bcrypt.hash(password, 12);

  const { data: user, error } = await supabase
    .from('users')
    .insert({ full_name, email, password_hash, role })
    .select('id, email, full_name, role')
    .single();

  if (error) throw error;

  // Create seller profile for clients
  if (role === 'client' || !role) {
    await supabase.from('seller_profiles').insert({ user_id: user.id });
  }

  const token = issueToken(user);
  return { user, token };
};

const login = async ({ email, password }) => {
  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, full_name, role, password_hash, is_active')
    .eq('email', email)
    .maybeSingle();

  if (error || !user) throw { status: 401, message: 'Invalid credentials' };
  if (!user.is_active) throw { status: 403, message: 'Account is deactivated' };

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw { status: 401, message: 'Invalid credentials' };

  const { password_hash: _, ...safeUser } = user;
  const token = issueToken(safeUser);
  return { user: safeUser, token };
};

const demoLogin = async (role) => {
  const email = `${role}_demo@adflow.com`;
  let { data: user } = await supabase
    .from('users')
    .select('id, email, full_name, role, is_active')
    .eq('email', email)
    .maybeSingle();

  if (!user) {
    const password_hash = await bcrypt.hash('demo123', 12);
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({ full_name: `Demo ${role.toUpperCase()}`, email, password_hash, role })
      .select('id, email, full_name, role')
      .single();
    if (error) throw error;
    user = newUser;
    if (role === 'client') {
      await supabase.from('seller_profiles').insert({ user_id: user.id });
    }
  }

  const token = issueToken(user);
  return { user, token };
};

module.exports = { register, login, demoLogin };
