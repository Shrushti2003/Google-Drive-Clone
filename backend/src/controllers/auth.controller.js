import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { z } from 'zod';
import { databaseStatus, describeMongoTarget } from '../config/db.js';
import { env } from '../config/env.js';
import { Activity } from '../models/Activity.js';
import { File } from '../models/File.js';
import { Folder } from '../models/Folder.js';
import { SharedLink } from '../models/SharedLink.js';
import { Subscription } from '../models/Subscription.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { clearRefreshCookie, setRefreshCookie } from '../utils/cookies.js';
import { hashToken, randomToken, signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/tokens.js';
import { recordActivity } from '../services/activity.service.js';
import { permanentlyDeleteFile } from '../services/trash.service.js';

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().email().toLowerCase(),
  password: z.string().min(8).max(128)
});

export const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1),
  remember: z.boolean().optional().default(true)
});

export const forgotSchema = z.object({ email: z.string().email().toLowerCase() });
export const resetSchema = z.object({ token: z.string().min(20), password: z.string().min(8).max(128) });
export const googleCredentialSchema = z.object({
  credential: z.string().min(20)
});

const oauthCookieOptions = {
  httpOnly: true,
  sameSite: env.nodeEnv === 'production' ? 'none' : 'lax',
  secure: env.nodeEnv === 'production',
  signed: true,
  maxAge: 10 * 60 * 1000,
  path: '/'
};

function getGoogleOAuthClient() {
  return new OAuth2Client(env.google.clientId, env.google.clientSecret, env.google.callbackUrl);
}

function redirectOAuthError(res, reason) {
  res.clearCookie('oauthState', oauthCookieOptions);
  return res.redirect(`${env.clientUrl}/oauth/callback?status=error&reason=${encodeURIComponent(reason)}`);
}

function issueSession(res, user, remember = true) {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user, user.tokenVersion);
  user.refreshTokenHash = hashToken(refreshToken);
  setRefreshCookie(res, refreshToken, remember);
  return accessToken;
}

async function upsertGoogleUser(profile) {
  if (!profile.email || !profile.sub) {
    throw new AppError('Google profile did not include a verified identity', 401);
  }

  let user = await User.findOne({ $or: [{ googleId: profile.sub }, { email: profile.email.toLowerCase() }] }).select('+refreshTokenHash');
  if (!user) {
    user = await User.create({
      name: profile.name || profile.email.split('@')[0],
      email: profile.email.toLowerCase(),
      avatarUrl: profile.picture,
      authProvider: 'google',
      googleId: profile.sub,
      emailVerified: Boolean(profile.email_verified)
    });
  } else {
    user.googleId = user.googleId || profile.sub;
    user.authProvider = user.authProvider === 'local' ? 'local' : 'google';
    user.emailVerified = user.emailVerified || Boolean(profile.email_verified);
    user.avatarUrl = user.avatarUrl || profile.picture;
    await user.save();
  }
  return user;
}

export const register = asyncHandler(async (req, res) => {
  const exists = await User.exists({ email: req.body.email });
  if (exists) throw new AppError('An account with this email already exists', 409);

  const verificationToken = randomToken();
  const user = await User.create({
    name: req.body.name,
    email: req.body.email,
    passwordHash: await bcrypt.hash(req.body.password, 12),
    verificationTokenHash: hashToken(verificationToken)
  });

  const accessToken = issueSession(res, user);
  await user.save();
  await recordActivity(user.id, 'login', 'Account created and signed in');
  res.status(201).json({ user: user.toSafeJSON(), accessToken, verificationToken });
});

export const login = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email }).select('+passwordHash +refreshTokenHash');
  if (!user || !(await user.comparePassword(req.body.password))) {
    throw new AppError('Invalid email or password', 401);
  }
  const accessToken = issueSession(res, user, req.body.remember);
  await user.save();
  await recordActivity(user.id, 'login', 'Signed in');
  res.json({ user: user.toSafeJSON(), accessToken });
});

export const refresh = asyncHandler(async (req, res) => {
  const token = req.signedCookies.refreshToken;
  if (!token) throw new AppError('Refresh token missing', 401);
  const payload = verifyRefreshToken(token);
  const user = await User.findById(payload.sub).select('+refreshTokenHash');
  if (!user || user.tokenVersion !== payload.tokenVersion || user.refreshTokenHash !== hashToken(token)) {
    throw new AppError('Invalid refresh session', 401);
  }
  const accessToken = issueSession(res, user, true);
  await user.save();
  res.json({ user: user.toSafeJSON(), accessToken });
});

export const logout = asyncHandler(async (req, res) => {
  const token = req.signedCookies.refreshToken;
  if (token) {
    try {
      const payload = verifyRefreshToken(token);
      await User.findByIdAndUpdate(payload.sub, { $unset: { refreshTokenHash: 1 }, $inc: { tokenVersion: 1 } });
    } catch {
      // Expired or malformed refresh tokens can still be cleared client-side.
    }
  }
  clearRefreshCookie(res);
  res.status(204).end();
});

export const me = asyncHandler(async (req, res) => {
  res.json({ user: req.user.toSafeJSON() });
});

export const deleteAccount = asyncHandler(async (req, res) => {
  const files = await File.find({ owner: req.user.id });
  for (const file of files) {
    await permanentlyDeleteFile(file);
  }

  await Promise.all([
    Folder.deleteMany({ owner: req.user.id }),
    SharedLink.deleteMany({ owner: req.user.id }),
    Subscription.deleteOne({ user: req.user.id }),
    Activity.deleteMany({ actor: req.user.id })
  ]);

  await User.findByIdAndDelete(req.user.id);
  clearRefreshCookie(res);
  res.status(204).end();
});

export const googleStatus = asyncHandler(async (_req, res) => {
  res.json({
    google: {
      configured: Boolean(env.google.clientId && env.google.clientSecret),
      hasClientId: Boolean(env.google.clientId),
      hasClientSecret: Boolean(env.google.clientSecret),
      callbackUrl: env.google.callbackUrl,
      clientUrl: env.clientUrl,
      serverUrl: env.serverUrl
    },
    database: databaseStatus(),
    mongo: describeMongoTarget()
  });
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const tokenHash = hashToken(req.body.token || '');
  const user = await User.findOneAndUpdate(
    { verificationTokenHash: tokenHash },
    { emailVerified: true, $unset: { verificationTokenHash: 1 } },
    { new: true }
  );
  if (!user) throw new AppError('Verification token is invalid or expired', 400);
  res.json({ user: user.toSafeJSON() });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  const resetToken = randomToken();
  if (user) {
    user.resetPasswordTokenHash = hashToken(resetToken);
    user.resetPasswordExpiresAt = new Date(Date.now() + 30 * 60 * 1000);
    await user.save();
  }
  res.json({ message: 'If an account exists, a reset link has been prepared.', resetToken: user ? resetToken : undefined });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({
    resetPasswordTokenHash: hashToken(req.body.token),
    resetPasswordExpiresAt: { $gt: new Date() }
  });
  if (!user) throw new AppError('Reset token is invalid or expired', 400);
  user.passwordHash = await bcrypt.hash(req.body.password, 12);
  user.tokenVersion += 1;
  user.resetPasswordTokenHash = undefined;
  user.resetPasswordExpiresAt = undefined;
  await user.save();
  res.json({ message: 'Password updated successfully' });
});

export const googleStart = asyncHandler(async (_req, res) => {
  if (!env.google.clientId || !env.google.clientSecret) {
    return res.status(503).send(`
      <!doctype html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>CloudNest Google OAuth Setup</title>
          <style>
            body{margin:0;min-height:100vh;display:grid;place-items:center;background:#05070b;color:#e8f7ff;font-family:Inter,system-ui,sans-serif}
            main{max-width:560px;margin:24px;padding:28px;border:1px solid rgba(103,232,249,.18);border-radius:18px;background:rgba(255,255,255,.055);box-shadow:0 30px 100px rgba(0,0,0,.45);backdrop-filter:blur(20px)}
            h1{margin:0 0 12px;font-size:28px} p{color:#9aa9bd;line-height:1.6} code{color:#67e8f9}
          </style>
        </head>
        <body>
          <main>
            <h1>Google OAuth is not configured</h1>
            <p>Add <code>GOOGLE_CLIENT_ID</code>, <code>GOOGLE_CLIENT_SECRET</code>, and <code>GOOGLE_OAUTH_CALLBACK_URL</code> to <code>backend/.env</code>, then restart the backend.</p>
            <p>If Google shows a different app name, create a new OAuth Client for CloudNest Drive in Google Cloud Console and use that client ID.</p>
          </main>
        </body>
      </html>
    `);
  }

  const state = randomToken();
  res.cookie('oauthState', state, oauthCookieOptions);

  const oauthClient = getGoogleOAuthClient();
  const url = oauthClient.generateAuthUrl({
    access_type: 'offline',
    prompt: 'select_account',
    scope: ['openid', 'email', 'profile'],
    state
  });

  res.redirect(url);
});

export const googleCallback = asyncHandler(async (req, res) => {
  if (req.query.error) {
    return res.redirect(`${env.clientUrl}/oauth/callback?status=error&reason=${encodeURIComponent(req.query.error)}`);
  }
  if (!env.google.clientId || !env.google.clientSecret) {
    return redirectOAuthError(res, 'google_oauth_not_configured');
  }
  if (!req.query.code || !req.query.state || req.signedCookies.oauthState !== req.query.state) {
    return redirectOAuthError(res, 'invalid_oauth_state');
  }

  try {
    const oauthClient = getGoogleOAuthClient();
    const { tokens } = await oauthClient.getToken(String(req.query.code));
    if (!tokens.id_token) {
      return redirectOAuthError(res, 'missing_google_id_token');
    }

    const ticket = await oauthClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: env.google.clientId
    });
    const payload = ticket.getPayload();
    if (!payload?.email_verified) {
      return redirectOAuthError(res, 'google_email_not_verified');
    }

    const user = await upsertGoogleUser({
      sub: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      email_verified: payload.email_verified
    });

    issueSession(res, user, true);
    await user.save();
    await recordActivity(user.id, 'login', 'Signed in with Google');
    res.clearCookie('oauthState', oauthCookieOptions);
    return res.redirect(`${env.clientUrl}/oauth/callback?status=success`);
  } catch (error) {
    console.error('Google OAuth callback failed:', {
      message: error.message,
      code: error.code,
      response: error.response?.data?.error || error.response?.data?.error_description
    });
    return redirectOAuthError(res, error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' ? 'google_network_failed' : 'google_token_exchange_failed');
  }
});

export const googleCredential = asyncHandler(async (req, res) => {
  if (!env.google.clientId) {
    throw new AppError('Google OAuth is not configured. Add GOOGLE_CLIENT_ID to the backend environment.', 503);
  }

  const client = new OAuth2Client(env.google.clientId);
  const ticket = await client.verifyIdToken({
    idToken: req.body.credential,
    audience: env.google.clientId
  });
  const payload = ticket.getPayload();
  if (!payload?.email_verified) {
    throw new AppError('Google account email is not verified', 401);
  }

  const user = await upsertGoogleUser({
    sub: payload.sub,
    email: payload.email,
    name: payload.name,
    picture: payload.picture,
    email_verified: payload.email_verified
  });
  const accessToken = issueSession(res, user, true);
  await user.save();
  await recordActivity(user.id, 'login', 'Signed in with Google');
  res.json({ user: user.toSafeJSON(), accessToken });
});
