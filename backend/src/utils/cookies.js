import { env } from '../config/env.js';

const cookieBase = {
  httpOnly: true,
  sameSite: env.nodeEnv === 'production' ? 'none' : 'lax',
  secure: env.nodeEnv === 'production',
  signed: true,
  path: '/'
};

export function setRefreshCookie(res, token, remember = true) {
  res.cookie('refreshToken', token, {
    ...cookieBase,
    maxAge: remember ? 30 * 24 * 60 * 60 * 1000 : undefined
  });
}

export function clearRefreshCookie(res) {
  res.clearCookie('refreshToken', cookieBase);
}
