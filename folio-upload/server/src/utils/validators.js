import { AppError } from './AppError.js';

export const isEmail = (v) => /^\S+@\S+\.\S+$/.test(String(v));

export function cleanUrl(value, label = 'Link') {
  const v = String(value ?? '').trim();
  if (!v) return '';
  const fail = () => new AppError(400, `${label} must be a full link starting with http:// or https://`);
  if (v.length > 300) throw fail();
  let url;
  try {
    url = new URL(v);
  } catch {
    throw fail();
  }
  if (!['http:', 'https:'].includes(url.protocol)) throw fail();
  return v;
}

export function cleanTags(value) {
  const list = Array.isArray(value) ? value : String(value ?? '').split(',');
  const tags = list.map((t) => String(t).trim().slice(0, 30)).filter(Boolean);
  return [...new Set(tags)].slice(0, 8);
}
