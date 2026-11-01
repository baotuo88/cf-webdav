import { fileMapStyle } from "./file-map.js";

// Light and dark palettes share one set of tokens; components only reference tokens.
export const themeTokens = `
  :root {
    color-scheme: light dark;
    --canvas: #f3f6fb; --canvas-glow: #e4edff; --surface: #fff; --surface-2: #f8fafd; --surface-3: #f1f4f9;
    --hover: #f5f8fe; --line: #e5eaf2; --line-soft: #edf0f5; --line-strong: #d6dfeb;
    --text: #17243a; --text-2: #3b4a60; --muted: #64748b; --faint: #8b98aa;
    --accent: #2563eb; --accent-hover: #1d4ed8; --accent-text: #245ac0; --accent-soft: #edf3ff; --accent-line: #c9d8f6; --on-accent: #fff;
    --ring: #93b4ff; --ring-soft: #dce8ff;
    --red: #d63f45; --red-soft: #fff1f1; --red-line: #f4caca;
    --amber: #a76a07; --amber-soft: #fff4da; --green: #16865b; --green-soft: #e6f6ef;
    --folder: #d89622; --file: #7890ad;
    --shadow-sm: 0 1px 2px #1e3a5f0d, 0 2px 8px #1e3a5f08; --shadow-md: 0 10px 30px #1e3a5f12; --shadow-lg: 0 24px 64px #14233b2e;
    --overlay: #17243a59; --toast: #17243a; --on-toast: #fff;
    --radius-sm: 8px; --radius: 12px; --radius-lg: 18px;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --canvas: #0c1220; --canvas-glow: #15233f; --surface: #131b2c; --surface-2: #172034; --surface-3: #1c263b;
      --hover: #1a2439; --line: #243049; --line-soft: #1e293e; --line-strong: #31405c;
      --text: #e6ecf5; --text-2: #c3cddc; --muted: #93a1b6; --faint: #6d7c93;
      --accent: #4c86f5; --accent-hover: #6497f7; --accent-text: #8fb3ff; --accent-soft: #1a2a4a; --accent-line: #2f4675; --on-accent: #fff;
      --ring: #5d8ff5; --ring-soft: #1f3460;
      --red: #f07a7f; --red-soft: #3a1c22; --red-line: #6b2f37;
      --amber: #f0bb5e; --amber-soft: #3a2c12; --green: #4cc493; --green-soft: #133126;
      --folder: #e5ad4a; --file: #8fa5c2;
      --shadow-sm: 0 1px 2px #0006; --shadow-md: 0 10px 30px #0007; --shadow-lg: 0 24px 64px #000a;
      --overlay: #050913b3; --toast: #e6ecf5; --on-toast: #0c1220;
    }
  }
  * { box-sizing: border-box; }
  [hidden] { display: none !important; }
  body { margin: 0; min-width: 320px; min-height: 100vh; background: radial-gradient(ellipse 60rem 32rem at 12% -6%, var(--canvas-glow), transparent 70%), var(--canvas); color: var(--text); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif; -webkit-font-smoothing: antialiased; }
  button, input, select, textarea { font: inherit; color: inherit; }
  button, a, label { -webkit-tap-highlight-color: transparent; }
  ::selection { background: var(--ring-soft); }
`;

export const pageStyle = `
  ${themeTokens}
  .app { max-width: 1280px; margin: auto; padding: 36px 32px 64px; }
  .page-header { display: flex; align-items: center; justify-content: space-between; gap: 28px; margin-bottom: 26px; }
  .brand { display: flex; align-items: center; gap: 15px; min-width: 0; }
  .brand-mark { display: grid; place-items: center; width: 50px; height: 50px; flex: 0 0 auto; border-radius: 15px; background: linear-gradient(145deg, #3b82f6, #1d4ed8); color: #fff; box-shadow: 0 8px 20px #2563eb40, inset 0 1px 0 #ffffff40; }
  .brand-mark svg { width: 26px; height: 26px; }
  .eyebrow { margin: 0 0 6px; color: var(--muted); font-size: 11px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; }
  h1 { margin: 0; color: var(--text); font-size: clamp(22px, 3vw, 28px); font-weight: 720; letter-spacing: -.035em; line-height: 1.15; }
  .sub { margin-top: 6px; color: var(--muted); font-size: 14px; line-height: 1.55; }
  .actions { display: flex; align-items: center; gap: 9px; flex-wrap: wrap; }
  .logout-form { margin: 0; }
  button, .upload-label { display: inline-flex; justify-content: center; align-items: center; gap: 7px; min-height: 40px; padding: 0 14px; border: 1px solid var(--line-strong); border-radius: 10px; background: var(--surface); color: var(--text-2); font-size: 13px; font-weight: 620; cursor: pointer; white-space: nowrap; box-shadow: var(--shadow-sm); transition: background-color .16s ease, border-color .16s ease, box-shadow .16s ease, color .16s ease, transform .16s ease; }
  button svg, .upload-label svg { width: 16px; height: 16px; flex: 0 0 auto; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.8; }
  button:hover, .upload-label:hover { border-color: var(--accent-line); background: var(--hover); color: var(--text); }
  button:active, .upload-label:active { transform: translateY(1px); }
  button:disabled, .upload input:disabled + .upload-label { opacity: .55; cursor: wait; transform: none; }
  button:focus-visible, a:focus-visible, select:focus-visible, input:focus-visible + .upload-label { outline: 3px solid var(--ring); outline-offset: 2px; }
  .primary { border-color: var(--accent); background: var(--accent); color: var(--on-accent); box-shadow: 0 6px 16px #2563eb33; }
  .primary:hover { border-color: var(--accent-hover); background: var(--accent-hover); color: var(--on-accent); }
  .ghost { border-color: transparent; background: transparent; color: var(--muted); box-shadow: none; }
  .ghost:hover { border-color: var(--line); background: var(--surface); color: var(--text); }
  .btn-icon { width: 16px; height: 16px; }
  .overview { margin-bottom: 22px; }
  .section-heading { display: flex; align-items: end; justify-content: space-between; gap: 12px; margin: 0 2px 12px; }
  .section-heading h2 { margin: 0; font-size: 15px; font-weight: 700; letter-spacing: -.01em; }
  .section-heading p { margin: 0; color: var(--muted); font-size: 12px; }
  .quota-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
  .quota { min-width: 0; padding: 18px 20px 16px; border: 1px solid var(--line); border-radius: var(--radius-lg); background: var(--surface); box-shadow: var(--shadow-sm); transition: border-color .16s ease, box-shadow .16s ease; }
  .quota:hover { border-color: var(--line-strong); box-shadow: var(--shadow-md); }
  .quota-top { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
  .quota-label { display: flex; align-items: center; gap: 9px; color: var(--text-2); font-size: 13px; font-weight: 640; }
  .quota-icon { display: grid; place-items: center; width: 32px; height: 32px; border-radius: 10px; background: var(--accent-soft); color: var(--accent-text); }
  .quota-icon svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
  .quota-percent { padding: 4px 8px; border-radius: 999px; background: var(--surface-3); color: var(--muted); font: 650 11px ui-monospace, SFMono-Regular, Menlo, monospace; }
  .quota-percent.warn { background: var(--amber-soft); color: var(--amber); }
  .quota-percent.danger { background: var(--red-soft); color: var(--red); }
  .quota-value { margin-top: 15px; color: var(--text); font-size: 25px; font-weight: 720; letter-spacing: -.04em; line-height: 1.15; overflow-wrap: anywhere; font-variant-numeric: tabular-nums; }
  .quota-limit { margin-top: 4px; color: var(--muted); font-size: 12px; }
  .bar { height: 6px; margin: 15px 0 11px; overflow: hidden; border-radius: 99px; background: var(--surface-3); }
  .fill { width: 0; height: 100%; border-radius: inherit; background: linear-gradient(90deg, #5b8ff7, #2563eb); transition: width .35s ease; }
  .fill.warn { background: linear-gradient(90deg, #f0c164, #d68d1b); }
  .fill.danger { background: linear-gradient(90deg, #f08585, #d94343); }
  .quota-trend, .quota-foot { display: flex; justify-content: space-between; gap: 8px; color: var(--muted); font-size: 11px; }
  .quota-trend { margin: 12px 0 4px; }
  .quota-trend strong, .quota-foot strong { color: var(--text-2); font-weight: 650; font-variant-numeric: tabular-nums; }
  .quota-skeleton { height: 154px; background: linear-gradient(90deg, var(--surface) 0%, var(--surface-2) 50%, var(--surface) 100%); background-size: 200% 100%; animation: shimmer 1.4s ease infinite; }
  @keyframes shimmer { from { background-position: 100% 0; } to { background-position: -100% 0; } }
  .panel { overflow: hidden; border: 1px solid var(--line); border-radius: var(--radius-lg); background: var(--surface); box-shadow: var(--shadow-md); }
  .panel-heading { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 18px 22px 14px; }
  .panel-title { display: flex; align-items: center; gap: 10px; min-width: 0; }
  .panel-title h2 { margin: 0; font-size: 16px; font-weight: 700; letter-spacing: -.02em; }
  #entry-count { padding: 3px 8px; border-radius: 999px; background: var(--surface-3); color: var(--muted); font-size: 11px; white-space: nowrap; font-variant-numeric: tabular-nums; }
  .status { display: inline-flex; align-items: center; gap: 7px; color: var(--green); font-size: 11px; font-weight: 600; white-space: nowrap; }
  .status-dot { width: 7px; height: 7px; border-radius: 50%; background: currentColor; box-shadow: 0 0 0 3px var(--green-soft); }
  .status.loading { color: var(--amber); }
  .status.loading .status-dot { box-shadow: 0 0 0 3px var(--amber-soft); animation: pulse 1.2s ease infinite; }
  .status.error { color: var(--red); }
  .status.error .status-dot { box-shadow: 0 0 0 3px var(--red-soft); }
  @keyframes pulse { 50% { opacity: .35; } }
  .view-tabs { display: flex; gap: 4px; margin: 0 22px 14px; padding: 4px; width: fit-content; max-width: calc(100% - 44px); overflow-x: auto; border: 1px solid var(--line); border-radius: 11px; background: var(--surface-2); scrollbar-width: none; }
  .view-tabs button { min-height: 32px; padding: 0 13px; border-color: transparent; border-radius: 8px; background: transparent; color: var(--muted); font-size: 12px; box-shadow: none; }
  .view-tabs button:hover { border-color: transparent; background: var(--surface-3); color: var(--text); }
  .view-tabs button.active { border-color: var(--line); background: var(--surface); color: var(--accent-text); box-shadow: var(--shadow-sm); }
  .toolbar { display: flex; align-items: center; gap: 12px; padding: 11px 22px; border-top: 1px solid var(--line-soft); border-bottom: 1px solid var(--line-soft); background: var(--surface-2); }
  .breadcrumbs { display: flex; align-items: center; flex: 1; min-width: 0; gap: 2px; overflow: auto; color: var(--faint); white-space: nowrap; scrollbar-width: thin; }
  .breadcrumbs a { padding: 6px 8px; border-radius: 7px; color: var(--muted); font-size: 12px; text-decoration: none; }
  .breadcrumbs a:hover { background: var(--accent-soft); color: var(--accent-text); }
  .breadcrumbs a:last-child { color: var(--text); font-weight: 650; }
  .toolbar-tools { display: flex; align-items: center; gap: 8px; flex: 0 0 auto; }
  .toolbar select, .limit-field select { height: 38px; padding: 0 28px 0 11px; border: 1px solid var(--line-strong); border-radius: 9px; background: var(--surface); color: var(--text-2); font-size: 12px; }
  .toolbar button, .toolbar .upload-label { min-height: 38px; }
  .bulk-actions { display: none; align-items: center; flex-wrap: wrap; gap: 8px; padding: 10px 22px; border-bottom: 1px solid var(--accent-line); background: var(--accent-soft); color: var(--accent-text); font-size: 12px; }
  .bulk-actions.show { display: flex; }
  .bulk-actions span { margin-right: auto; font-weight: 680; }
  .bulk-actions button { min-height: 32px; padding: 0 11px; }
  .danger { color: var(--red) !important; }
  button.danger:hover { border-color: var(--red-line); background: var(--red-soft); }
  .search { position: relative; display: flex; align-items: center; }
  .search svg { position: absolute; left: 11px; width: 15px; height: 15px; color: var(--faint); fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; pointer-events: none; }
  .search input { width: 200px; height: 38px; padding: 0 12px 0 34px; border: 1px solid var(--line-strong); border-radius: 10px; outline: none; background: var(--surface); color: var(--text); font-size: 12px; transition: border-color .16s ease, box-shadow .16s ease, width .2s ease; }
  .search input::placeholder { color: var(--faint); }
  .search input:focus { width: 240px; border-color: var(--ring); box-shadow: 0 0 0 3px var(--ring-soft); }
  .upload { position: relative; }
  .upload input { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; clip-path: inset(50%); border: 0; }
  .upload-label { border-color: var(--accent); background: var(--accent); color: var(--on-accent); }
  .upload-label:hover { border-color: var(--accent-hover); background: var(--accent-hover); color: var(--on-accent); }
  .tablewrap { max-height: 62vh; overflow: auto; transition: background-color .16s ease; }
  .table { width: 100%; border-collapse: collapse; }
  th, td { padding: 12px 20px; border-bottom: 1px solid var(--line-soft); text-align: left; font-size: 13px; }
  th { position: sticky; top: 0; z-index: 1; background: var(--surface-2); color: var(--muted); font-size: 11px; font-weight: 680; letter-spacing: .03em; white-space: nowrap; }
  td { color: var(--muted); font-variant-numeric: tabular-nums; }
  td:nth-child(2) { min-width: 240px; color: var(--text); font-weight: 560; }
  td:last-child, th:last-child { width: 1%; text-align: right; white-space: nowrap; }
  .row td { transition: background-color .12s ease; }
  .row:hover td { background: var(--hover); }
  .row:has(.row-check:checked) td { background: var(--accent-soft); }
  td a { color: inherit; text-decoration: none; }
  td a:hover { color: var(--accent-text); }
  .icon { display: inline-block; width: 18px; height: 18px; margin-right: 9px; vertical-align: -4px; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.7; }
  td a[data-dir] .icon { color: var(--folder); }
  .file-icon { color: var(--file); }
  .row button { min-height: 30px; padding: 0 9px; border-color: transparent; background: transparent; color: var(--muted); font-size: 12px; font-weight: 560; box-shadow: none; opacity: .75; }
  .row:hover button, .row button:focus-visible { opacity: 1; }
  .row button:hover { border-color: var(--line); background: var(--surface); color: var(--accent-text); }
  .row button[data-delete]:hover, .row button[data-purge]:hover, .row button[data-revoke]:hover, .row button[data-revoke-inbox]:hover, .row button.danger:hover { border-color: var(--red-line); background: var(--red-soft); color: var(--red); }
  .row button:disabled { color: var(--faint); cursor: not-allowed; }
  .row-check, #select-page { width: 16px; height: 16px; accent-color: var(--accent); vertical-align: middle; cursor: pointer; }
  .subline { display: block; margin-top: 4px; color: var(--faint); font-size: 10px; font-weight: 450; overflow-wrap: anywhere; }
  .empty-cell { padding: 64px 24px !important; text-align: center !important; color: var(--muted) !important; font-weight: 450 !important; }
  .empty-icon { display: block; width: 40px; height: 40px; margin: 0 auto 12px; color: var(--faint); fill: none; stroke: currentColor; stroke-width: 1.4; stroke-linecap: round; stroke-linejoin: round; }
  #message { position: fixed; z-index: 100; left: 50%; bottom: 24px; max-width: calc(100vw - 32px); padding: 11px 16px; transform: translate(-50%, 8px); border-radius: 12px; background: var(--toast); color: var(--on-toast); font-size: 13px; font-weight: 550; box-shadow: var(--shadow-lg); opacity: 0; pointer-events: none; transition: opacity .2s ease, transform .2s ease; }
  #message.show { opacity: 1; transform: translate(-50%, 0); }
  #message.error { background: #c2373f; color: #fff; }
  .dialog-backdrop { position: fixed; inset: 0; z-index: 30; display: none; place-items: center; padding: 20px; background: var(--overlay); backdrop-filter: blur(4px); }
  .dialog-backdrop.show { display: grid; animation: fade-in .16s ease; }
  .dialog-backdrop.show > .dialog { animation: rise-in .2s ease; }
  @keyframes fade-in { from { opacity: 0; } }
  @keyframes rise-in { from { opacity: 0; transform: translateY(8px) scale(.98); } }
  .dialog { width: min(440px, 100%); padding: 24px; border: 1px solid var(--line); border-radius: var(--radius-lg); background: var(--surface); box-shadow: var(--shadow-lg); }
  .dialog h3 { margin: 0 0 4px; font-size: 17px; letter-spacing: -.02em; }
  .dialog .dialog-sub { margin: 0 0 18px; color: var(--muted); font-size: 12px; line-height: 1.55; overflow-wrap: anywhere; }
  .ttl-group { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 16px; }
  .ttl-group label { position: relative; display: grid; place-items: center; min-height: 40px; border: 1px solid var(--line-strong); border-radius: 10px; background: var(--surface); color: var(--text-2); font-size: 12px; font-weight: 620; cursor: pointer; transition: border-color .16s ease, background-color .16s ease; }
  .ttl-group label:hover { border-color: var(--accent-line); }
  .ttl-group input { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
  .ttl-group input:checked + span { display: contents; }
  .ttl-group label:has(input:checked) { border-color: var(--accent); background: var(--accent-soft); color: var(--accent-text); }
  .ttl-group label:has(input:focus-visible) { outline: 3px solid var(--ring); outline-offset: 2px; }
  .dialog-actions { display: flex; justify-content: flex-end; gap: 9px; margin-top: 4px; }
  .limit-field { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin: 0 0 14px; color: var(--text-2); font-size: 12px; }
  .limit-field input, .text-field input { border: 1px solid var(--line-strong); border-radius: 9px; outline: none; background: var(--surface); color: var(--text); transition: border-color .16s ease, box-shadow .16s ease; }
  .limit-field input:focus, .text-field input:focus { border-color: var(--ring); box-shadow: 0 0 0 3px var(--ring-soft); }
  .limit-field input { width: 120px; height: 38px; padding: 0 10px; }
  .limit-note { margin: -8px 0 14px; color: var(--faint); font-size: 11px; line-height: 1.5; }
  .preview-dialog { display: flex; flex-direction: column; width: min(920px, 100%); max-height: min(88vh, 920px); }
  #preview-content { display: grid; place-items: center; min-height: 140px; max-height: 72vh; overflow: auto; border-radius: var(--radius); background: var(--surface-3); }
  #preview-content img, #preview-content video { max-width: 100%; max-height: 70vh; object-fit: contain; }
  #preview-content audio { width: min(520px, 100%); margin: 24px; }
  #preview-content pre { width: 100%; margin: 0; padding: 18px; color: var(--text); font: 12px/1.65 ui-monospace, SFMono-Regular, Menlo, monospace; white-space: pre-wrap; overflow-wrap: anywhere; }
  .preview-heading { display: flex; align-items: start; justify-content: space-between; gap: 12px; margin-bottom: 14px; }
  .preview-heading h3 { overflow-wrap: anywhere; }
  .load-more { display: block; margin: 14px auto; }
  .share-result { display: none; margin-bottom: 16px; }
  .share-result.show { display: block; animation: fade-in .2s ease; }
  .share-result textarea { width: 100%; min-height: 76px; padding: 10px 12px; border: 1px solid var(--accent-line); border-radius: 10px; background: var(--accent-soft); color: var(--text); font: 500 11px/1.55 ui-monospace, SFMono-Regular, Menlo, monospace; resize: vertical; }
  .inbox-links { padding: 18px 22px; border-top: 1px solid var(--line-soft); }
  .inbox-links h3 { margin: 0 0 10px; font-size: 13px; }
  .inbox-link-row { display: grid; grid-template-columns: minmax(0,1fr) auto auto; align-items: center; gap: 12px; min-height: 56px; padding: 8px 0; border-top: 1px solid var(--line-soft); color: var(--muted); font-size: 12px; }
  .inbox-link-row strong { display: block; color: var(--text); font-size: 12px; }
  .inbox-link-row small { display: block; margin-top: 3px; color: var(--faint); font-size: 10px; }
  .inbox-link-row button { min-height: 32px; }
  .inbox-link-actions { display: flex; gap: 5px; }
  .gallery-link { max-width: 280px; overflow-wrap: anywhere; color: var(--accent-text); font-size: 11px; }
  .text-field { display: block; margin: 0 0 14px; color: var(--text-2); font-size: 12px; }
  .text-field input { display: block; width: 100%; height: 40px; margin-top: 6px; padding: 0 11px; }
  .mode-options { display: flex; gap: 8px; margin: 0 0 16px; }
  .mode-options label { display: flex; align-items: center; gap: 7px; min-height: 40px; padding: 0 13px; border: 1px solid var(--line-strong); border-radius: 10px; color: var(--text-2); font-size: 12px; cursor: pointer; }
  .mode-options label:has(input:checked) { border-color: var(--accent); background: var(--accent-soft); color: var(--accent-text); }
  .mode-options input { accent-color: var(--accent); }
  .upload-progress { display: none; align-items: center; gap: 10px; padding: 10px 22px; border-bottom: 1px solid var(--line-soft); color: var(--text-2); font-size: 12px; }
  .upload-progress.show { display: flex; }
  .upload-progress .bar { flex: 1; height: 6px; margin: 0; }
  .tablewrap.dragover { outline: 2px dashed var(--ring); outline-offset: -8px; background: var(--accent-soft); }
  .footer-note { margin: 14px 4px 0; color: var(--faint); font-size: 11px; line-height: 1.6; }
  ${fileMapStyle}
  /* Star map: map its fixed palette onto the shared theme tokens. */
  #star-map-backdrop { background: var(--overlay); }
  .dialog.map-dialog { border-color: var(--line); background: var(--surface); box-shadow: var(--shadow-lg); }
  .map-heading, .map-list-heading { border-color: var(--line-soft); }
  .map-brand-icon { border-color: var(--accent-line); background: var(--accent-soft); color: var(--accent-text); }
  .map-heading p, .map-summary-label, #map-count, .map-reading, #map-list-count, .map-list-meta, .map-footer, .map-state { color: var(--muted); }
  #star-map-close { color: var(--muted); }
  #star-map-close:hover { background: var(--surface-3); color: var(--text); }
  #map-total, .map-list-heading h4, .map-list-name, .map-state strong, .map-breadcrumbs button[aria-current] { color: var(--text); }
  .map-modes { border-color: var(--line); background: var(--surface-2); }
  .map-modes button { color: var(--muted); }
  .map-modes button:hover { color: var(--text); }
  .map-modes button.active { border-color: var(--line); background: var(--surface); color: var(--accent-text); box-shadow: var(--shadow-sm); }
  .map-breadcrumbs { color: var(--faint); }
  .map-breadcrumbs button { color: var(--muted); }
  .map-breadcrumbs button:hover { background: var(--accent-soft); color: var(--accent-text); }
  #star-map { border-color: var(--line); background: var(--surface-2); }
  .map-list-item { border-color: var(--line-soft); color: var(--text-2); }
  .map-list-item:hover, .map-list-item.is-highlighted { border-color: var(--line-soft); background: var(--hover); }
  .map-list-icon { background: var(--surface-3); color: var(--file); }
  .map-list-share { color: var(--text-2); }
  .map-list-more { background: var(--surface-3); color: var(--text-2); }
  .map-state svg { stroke: var(--faint); }
  @media (prefers-color-scheme: dark) {
    .map-tile-surface { border-color: #ffffff14; color: #dbe6f5; }
    .map-tile-meta, .map-tile-share { color: #a9bad0; }
    .map-tile:hover .map-tile-surface, .map-tile.is-highlighted .map-tile-surface { box-shadow: inset 0 0 0 1.5px #7ea3d8; filter: brightness(1.12); }
    .map-tone-0 { --map-fill: #18263d; } .map-tone-1 { --map-fill: #1c2f4d; } .map-tone-2 { --map-fill: #213a5f; }
    .map-tone-3 { --map-fill: #264672; } .map-tone-4 { --map-fill: #2c5287; }
    .map-kind-image { --map-fill: #173a2f; } .map-kind-video { --map-fill: #3d2d1c; } .map-kind-audio { --map-fill: #2c2645; }
    .map-kind-document { --map-fill: #1c3150; } .map-kind-archive { --map-fill: #402531; } .map-kind-other { --map-fill: #232c3b; }
  }
  @media (max-width: 900px) {
    .app { padding: 28px 22px 48px; }
    .quota { padding: 16px; }
    .quota-value { font-size: 22px; }
    .search input, .search input:focus { width: 170px; }
    .toolbar { flex-wrap: wrap; }
    #search-tools, #file-tools { flex: 1 1 100%; }
    #file-tools { flex-wrap: wrap; }
  }
  @media (max-width: 680px) {
    .app { padding: 20px 14px 36px; }
    .page-header { align-items: flex-start; flex-direction: column; gap: 16px; margin-bottom: 22px; }
    .brand { gap: 12px; }
    .brand-mark { width: 44px; height: 44px; border-radius: 13px; }
    .brand-mark svg { width: 23px; height: 23px; }
    .sub { max-width: 32ch; font-size: 13px; }
    .actions { width: 100%; }
    .actions > button, .logout-form { flex: 1; }
    .logout-form button { width: 100%; }
    .overview { margin-bottom: 18px; }
    .section-heading { align-items: flex-start; flex-direction: column; gap: 4px; }
    .quota-grid { grid-template-columns: 1fr; gap: 10px; }
    .quota { padding: 14px 15px; }
    .quota-value { display: inline-block; margin-top: 12px; font-size: 22px; }
    .quota-limit { display: inline-block; margin: 0 0 0 7px; }
    .bar { margin: 11px 0 8px; }
    .quota-skeleton { height: 120px; }
    .panel { border-radius: 15px; }
    .panel-heading { padding: 15px 15px 12px; }
    .view-tabs { margin: 0 13px 12px; max-width: calc(100% - 26px); }
    .toolbar { align-items: stretch; flex-direction: column; padding: 11px 13px 13px; }
    .toolbar-tools { flex-wrap: wrap; width: 100%; }
    .toolbar select { flex: 0 0 100%; }
    .search { flex: 1; min-width: 0; }
    .search input, .search input:focus { width: 100%; }
    .upload-label { min-width: 82px; }
    .bulk-actions, .upload-progress, .inbox-links { padding-right: 13px; padding-left: 13px; }
    .tablewrap { max-height: none; overflow: visible; padding-top: 10px; }
    .table, .table tbody { display: block; width: 100%; }
    .table thead { display: none; }
    .table tr.row { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 0 14px; margin: 0 10px 10px; padding: 10px 12px; border: 1px solid var(--line); border-radius: var(--radius); background: var(--surface); box-shadow: var(--shadow-sm); }
    .table tr.row:has(.row-check:checked) { border-color: var(--accent-line); background: var(--accent-soft); }
    .row td, .row:hover td, .row:has(.row-check:checked) td { background: transparent; }
    .table td { min-width: 0; padding: 7px 0; border: 0; font-size: 11px; overflow-wrap: anywhere; }
    .table td::before { display: block; margin-bottom: 4px; color: var(--faint); content: attr(data-label); font-size: 10px; font-weight: 600; }
    .table td:nth-child(1) { grid-column: 1 / -1; justify-self: start; padding: 2px 0; }
    .table td:nth-child(1)::before, .table td:nth-child(6)::before { display: none; }
    .table td:nth-child(2) { grid-column: 1 / -1; min-width: 0; padding-bottom: 10px; font-size: 14px; }
    .table td:nth-child(2)::before { margin-bottom: 6px; }
    .table td:nth-child(6) { grid-column: 1 / -1; width: auto; padding-top: 6px; border-top: 1px solid var(--line-soft); text-align: right; }
    .table[data-view="files"] td:nth-child(4) { display: none; }
    .row button { min-height: 36px; padding: 0 10px; opacity: 1; }
    .inbox-link-row { grid-template-columns: minmax(0,1fr) auto; }
    .inbox-link-row > span:nth-child(2) { grid-column: 1; }
    .inbox-link-row button { grid-column: 2; grid-row: 1 / span 2; }
    .inbox-link-row .inbox-link-actions { grid-column: 2; grid-row: 1 / span 2; flex-direction: column; }
    .empty-cell { display: block !important; padding: 48px 20px !important; border: 0 !important; }
    .dialog { padding: 20px; }
    .ttl-group { grid-template-columns: repeat(2, 1fr); }
    .footer-note { margin-top: 10px; }
  }
  @media (max-width: 380px) {
    .actions { gap: 7px; }
    button, .upload-label { padding-right: 10px; padding-left: 10px; font-size: 12px; }
    .quota-foot { font-size: 10px; }
  }
  @media (hover: none) { .row button { opacity: 1; } }
  @media (prefers-reduced-motion: reduce) { *, *::before, *::after { scroll-behavior: auto !important; transition-duration: .01ms !important; animation-duration: .01ms !important; animation-iteration-count: 1 !important; } }
`;
