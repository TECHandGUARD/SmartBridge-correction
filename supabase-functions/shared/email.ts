// Preserve the live templates and provider contract, with stable retry keys and bounded calls.
export async function emailFetch(options: RequestInit): Promise<Response> {
  const body = String(options.body || '');
  const payload = JSON.parse(body);
  const recipients = Array.isArray(payload.to) ? payload.to : [payload.to];
  if (!recipients.length || recipients.some((address: unknown) => typeof address !== 'string' || !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(address))) throw new Error('Email recipient is invalid');
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(body)));
  const headers = new Headers(options.headers);
  headers.set('Idempotency-Key', `smartbridge-${Array.from(digest, byte=>byte.toString(16).padStart(2,'0')).join('')}`);
  let response: Response | undefined;
  for (let attempt = 0; attempt < 3; attempt++) {
    response = await fetch('https://api.resend.com/emails', { ...options, headers, signal: AbortSignal.timeout(15000) });
    if (response.ok) {
      const accepted = await response.clone().json();
      if (!accepted.id) throw new Error('Email provider returned no message ID');
      return response;
    }
    if ((response.status !== 429 && response.status < 500) || attempt === 2) return response;
    await response.body?.cancel();
    await new Promise(resolve=>setTimeout(resolve, 500 * 2 ** attempt));
  }
  return response!;
}
