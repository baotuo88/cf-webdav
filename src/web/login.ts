import { themeTokens } from "./page-style.js";

const style = `
  ${themeTokens}
  body { display: grid; place-items: center; padding: 24px 16px; background:
    radial-gradient(ellipse 50rem 30rem at 50% -10%, var(--canvas-glow), transparent 70%), var(--canvas); }
  .login { width: min(400px, 100%); }
  .card { padding: 34px 32px 28px; border: 1px solid var(--line); border-radius: 22px; background: var(--surface); box-shadow: var(--shadow-lg); animation: rise-in .28s ease; }
  @keyframes rise-in { from { opacity: 0; transform: translateY(10px); } }
  .brand-mark { display: grid; place-items: center; width: 54px; height: 54px; margin-bottom: 22px; border-radius: 16px; background: linear-gradient(145deg, #3b82f6, #1d4ed8); color: #fff; box-shadow: 0 10px 24px #2563eb45, inset 0 1px 0 #ffffff40; }
  .brand-mark svg { width: 28px; height: 28px; }
  .eyebrow { margin: 0 0 7px; color: var(--muted); font-size: 11px; font-weight: 700; letter-spacing: .12em; }
  h1 { margin: 0; font-size: 25px; font-weight: 720; letter-spacing: -.035em; }
  .sub { margin: 8px 0 26px; color: var(--muted); font-size: 14px; line-height: 1.55; }
  label { display: block; margin-bottom: 7px; color: var(--text-2); font-size: 13px; font-weight: 600; }
  .field { position: relative; margin-bottom: 18px; }
  input { display: block; width: 100%; height: 46px; padding: 0 14px; border: 1px solid var(--line-strong); border-radius: 12px; outline: none; background: var(--surface-2); color: var(--text); font-size: 15px; transition: border-color .16s ease, box-shadow .16s ease, background-color .16s ease; }
  input::placeholder { color: var(--faint); }
  input:focus { border-color: var(--ring); background: var(--surface); box-shadow: 0 0 0 4px var(--ring-soft); }
  .field-password input { padding-right: 50px; }
  .toggle { position: absolute; right: 5px; bottom: 5px; display: grid; place-items: center; width: 38px; height: 36px; padding: 0; border: 0; border-radius: 9px; background: transparent; color: var(--muted); cursor: pointer; }
  .toggle:hover { background: var(--surface-3); color: var(--text); }
  .toggle:focus-visible, .submit:focus-visible { outline: 3px solid var(--ring); outline-offset: 2px; }
  .toggle svg { width: 19px; height: 19px; fill: none; stroke: currentColor; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }
  .toggle .eye-off, .toggle[aria-pressed="true"] .eye { display: none; }
  .toggle[aria-pressed="true"] .eye-off { display: block; }
  .error { display: flex; align-items: center; gap: 9px; margin: 0 0 18px; padding: 11px 13px; border: 1px solid var(--red-line); border-radius: 11px; background: var(--red-soft); color: var(--red); font-size: 13px; font-weight: 550; }
  .error svg { width: 17px; height: 17px; flex: 0 0 auto; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; }
  .submit { display: flex; justify-content: center; align-items: center; gap: 8px; width: 100%; height: 48px; margin-top: 8px; border: 0; border-radius: 12px; background: var(--accent); color: var(--on-accent); font-size: 15px; font-weight: 680; cursor: pointer; box-shadow: 0 8px 20px #2563eb40; transition: background-color .16s ease, transform .16s ease; }
  .submit:hover { background: var(--accent-hover); }
  .submit:active { transform: translateY(1px); }
  .submit:disabled { opacity: .7; cursor: wait; }
  .spinner { display: none; width: 16px; height: 16px; border: 2px solid #ffffff66; border-top-color: #fff; border-radius: 50%; animation: spin .7s linear infinite; }
  .submit:disabled .spinner { display: block; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .hint { margin: 20px 0 0; padding-top: 18px; border-top: 1px solid var(--line-soft); color: var(--muted); font-size: 12px; line-height: 1.6; }
  .hint code { padding: 2px 6px; border-radius: 6px; background: var(--surface-3); color: var(--text-2); font: 12px ui-monospace, SFMono-Regular, Menlo, monospace; overflow-wrap: anywhere; }
  .foot { margin: 18px 0 0; color: var(--faint); font-size: 11px; text-align: center; }
  @media (max-width: 440px) { .card { padding: 28px 22px 24px; border-radius: 18px; } h1 { font-size: 23px; } }
  @media (prefers-reduced-motion: reduce) { *, *::before, *::after { transition-duration: .01ms !important; animation-duration: .01ms !important; } }
`;

const script = `
  const form = document.getElementById('login-form');
  const password = document.getElementById('password');
  const toggle = document.getElementById('toggle');
  toggle.addEventListener('click', () => {
    const visible = password.type === 'password';
    password.type = visible ? 'text' : 'password';
    toggle.setAttribute('aria-pressed', String(visible));
    toggle.setAttribute('aria-label', visible ? '隐藏密码' : '显示密码');
    password.focus();
  });
  form.addEventListener('submit', () => { document.getElementById('submit').disabled = true; });
`;

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[character]!);
}

export function loginPage(nonce: string, options: { origin: string; username?: string; error?: string }): string {
  const error = options.error
    ? `<p class="error" role="alert"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5M12 16.5v.01"/></svg>${escapeHtml(options.error)}</p>`
    : "";
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light dark">
  <meta name="robots" content="noindex">
  <title>登录 · CF Free WebDAV</title>
  <style nonce="${nonce}">${style}</style>
</head>
<body>
<main class="login">
  <div class="card">
    <div class="brand-mark" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 7.5A2.5 2.5 0 0 1 7.5 5H11l2 2h3.5A2.5 2.5 0 0 1 19 9.5v7a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 5 16.5z"/><path d="M5 10h14"/><path d="M9 14h6"/></svg></div>
    <p class="eyebrow">OBJECT STORAGE · CONTROL CENTER</p>
    <h1>CF Free WebDAV</h1>
    <p class="sub">登录以管理你的 R2 文件与用量</p>
    ${error}
    <form id="login-form" method="post" action="/login">
      <div class="field">
        <label for="username">用户名</label>
        <input id="username" name="username" type="text" autocomplete="username" autocapitalize="none" spellcheck="false" required maxlength="256" value="${escapeHtml(options.username || "")}"${options.username ? "" : " autofocus"}>
      </div>
      <div class="field field-password">
        <label for="password">密码</label>
        <input id="password" name="password" type="password" autocomplete="current-password" required maxlength="1024"${options.username ? " autofocus" : ""}>
        <button id="toggle" class="toggle" type="button" aria-label="显示密码" aria-pressed="false"><svg class="eye" viewBox="0 0 24 24"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/></svg><svg class="eye-off" viewBox="0 0 24 24"><path d="M3 3l18 18M10.6 6a9.6 9.6 0 0 1 1.4-.1c6 0 9.5 6.1 9.5 6.1a17 17 0 0 1-3 3.7M6.6 6.7C3.9 8.4 2.5 12 2.5 12S6 18.5 12 18.5c1.6 0 3-.4 4.2-1M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg></button>
      </div>
      <button id="submit" class="submit" type="submit"><span class="spinner" aria-hidden="true"></span>登录</button>
    </form>
    <p class="hint">WebDAV 客户端请直接连接 <code>${escapeHtml(options.origin)}/dav/</code>，使用相同的用户名和密码。</p>
  </div>
  <p class="foot">登录状态保留 7 天 · 仅在本设备有效</p>
</main>
<script nonce="${nonce}">${script}</script>
</body>
</html>`;
}
