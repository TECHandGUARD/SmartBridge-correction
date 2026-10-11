export function requiredEnv(name: string): string {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}
export function appUrl(path = ''): string {
  const url = new URL(requiredEnv('APP_BASE_URL'));
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if ((url.protocol !== 'https:' && !(local && url.protocol === 'http:')) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw new Error('APP_BASE_URL must be an HTTPS origin');
  return new URL(path || '/', url.origin).href;
}
export function geminiSettings(): { url: string; apiKey: string } {
  const model = requiredEnv('GEMINI_MODEL');
  if (!/^[a-zA-Z0-9._-]+$/.test(model)) throw new Error('GEMINI_MODEL must be a model ID');
  return {
    url: `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    apiKey: requiredEnv('GEMINI_API_KEY'),
  };
}
