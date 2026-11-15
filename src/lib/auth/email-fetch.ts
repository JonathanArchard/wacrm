/** Guard SDK requests that can cause hosted Auth to send mail.
 * This is an application guard, not a replacement for the hosted Send Email Hook.
 */
export function guardedAuthFetch(
  allowed: () => boolean | Promise<boolean>,
  transport: typeof fetch = (...args) => fetch(...args),
): typeof fetch {
  return async (input, init) => {
    const request = new Request(input, init);
    const path = new URL(request.url).pathname.replace(/\/+$/, '');
    const route = path.split('/auth/v1/')[1];
    let maySend = false;
    if (route !== undefined) {
      if (['signup', 'recover', 'otp', 'resend', 'magiclink', 'invite', 'reauthenticate', 'admin/invite'].includes(route)) {
        maySend = true;
      } else if (route === 'user' && ['PUT', 'PATCH', 'POST'].includes(request.method)) {
        // Password changes can send security notifications, too. Keep
        // password-only updates available once the provider hook is installed.
        try {
          const body = await request.clone().json();
          maySend = !body || typeof body !== 'object' || 'email' in body || 'phone' in body;
        } catch { maySend = true; }
      } else if (route.startsWith('admin/users') && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
        maySend = true;
      }
    }
    if (maySend) {
      let enabled = false;
      try { enabled = (await allowed()) === true; } catch { /* fail closed */ }
      if (!enabled) return new Response(JSON.stringify({
        message: 'External email is disabled in this environment',
        code: 'email_environment_disabled',
        error_code: 'email_environment_disabled',
      }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }
    return transport(input, init);
  };
}
