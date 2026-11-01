import { fileMapMarkup, fileMapScript } from "./file-map.js";
import { pageStyle } from "./page-style.js";

const script = `
  const el = (id) => document.getElementById(id);
  let currentPath = [];
  let currentEntries = [];
  let currentTrash = [];
  let currentShares = [];
  let currentInboxes = [];
  let currentInboxItems = [];
  let currentGalleries = [];
  let trendDays = [];
  let currentUsage = null;
  let currentView = 'files';
  let searchCursor = null;
  let searchController = null;
  let searchTimer = 0;
  let currentSort = 'name';
  let selected = new Set();
  let viewRequest = 0;
  const dirIcon = '<svg class="icon" viewBox="0 0 24 24"><path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H10l2 2h6.5A2.5 2.5 0 0 1 21 9.5v8a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5z"/><path d="M3.5 10h17"/></svg>';
  const fileIcon = '<svg class="icon file-icon" viewBox="0 0 24 24"><path d="M6 3.5h7l5 5v12H6a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2Z"/><path d="M13 3.5v5h5M8 13h8M8 16.5h8"/></svg>';

  // Mark requests from this page so the server answers 401 without a Basic Auth challenge,
  // and send the user back to the login page when the session expires.
  const UI_HEADER = 'x-cfwd-ui';
  const toLogin = () => { location.href = '/login'; };
  const nativeFetch = window.fetch.bind(window);
  window.fetch = async (input, init = {}) => {
    const headers = new Headers(init.headers || (input instanceof Request ? input.headers : undefined));
    headers.set(UI_HEADER, '1');
    const response = await nativeFetch(input, { ...init, headers, credentials: 'same-origin' });
    if (response.status === 401) toLogin();
    return response;
  };
  const esc = (value) => { const div = document.createElement('div'); div.textContent = value; return div.innerHTML; };
  const attr = (value) => esc(value).replace(/"/g, '&quot;');
  const apiPath = (segments) => '/api/files?path=' + encodeURIComponent(segments.join('/'));
  const davPath = (segments) => '/dav/' + segments.map(encodeURIComponent).join('/');
  const previewPath = (key) => '/api/preview?' + new URLSearchParams({ path: key });
  const isPreviewable = (item) => {
    const type = (item.contentType || '').toLowerCase();
    const mime = type.split(';')[0].trim();
    return ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/avif', 'text/plain'].includes(mime) || mime.startsWith('audio/') || mime.startsWith('video/');
  };

  async function davRequest(segments, method, options = {}) {
    const response = await fetch(davPath(segments), { method, ...options });
    if (!response.ok) throw new Error((await response.text()) || '操作失败');
    return response;
  }

  function fmtSize(value) {
    if (!Number.isFinite(value) || value < 0) return '—';
    if (value < 1024) return value + ' B';
    const units = ['KiB', 'MiB', 'GiB', 'TiB'];
    let size = value / 1024; let index = 0;
    while (size >= 1024 && index < units.length - 1) { size /= 1024; index += 1; }
    return size.toLocaleString('zh-CN', { maximumFractionDigits: size < 10 ? 2 : 1 }) + ' ' + units[index];
  }

  function fmtDate(value) {
    return new Date(value).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });
  }

  // Folders without a real marker object have no timestamp; show a dash instead of 1970.
  function fmtMod(value) {
    const time = new Date(value).getTime();
    return Number.isFinite(time) && time > 0 ? fmtDate(value) : '—';
  }

  function signed(value, format) {
    const symbol = value > 0 ? '+' : value < 0 ? '−' : '±';
    return symbol + format(Math.abs(value));
  }

  // 额度卡片趋势行：今日增量 + 近 7 日日均，替代低用量下没有信息量的折线图
  function trendRow(days, pick, format) {
    if (days.length < 2) return '';
    const last = pick(days[days.length - 1]) - pick(days[days.length - 2]);
    const span = Math.min(7, days.length - 1);
    let sum = 0;
    for (let i = days.length - span; i < days.length; i++) sum += pick(days[i]) - pick(days[i - 1]);
    return '<div class="quota-trend"><span>今日 <strong>' + signed(last, format) + '</strong></span>' +
      '<span>近 7 日日均 <strong>' + signed(sum / span, format) + '</strong></span></div>';
  }

  async function loadTrend() {
    try {
      const response = await fetch('/api/trend', { cache: 'no-store' });
      if (!response.ok) return;
      const data = await response.json();
      trendDays = data.days || [];
      if (currentUsage) renderQuota(currentUsage);
    } catch { /* 趋势图加载失败不影响主界面 */ }
  }

  function notify(text, error = false) {
    const box = el('message');
    box.textContent = text;
    box.className = error ? 'show error' : 'show';
    clearTimeout(notify.timer);
    notify.timer = setTimeout(() => { box.className = ''; }, 3200);
  }

  function daysUntilReset() {
    const now = new Date();
    const next = Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1);
    return Math.max(1, Math.ceil((next - now.getTime()) / 86400000));
  }

  function quotaCard(title, used, total, unit, icon, trend) {
    const ratio = total > 0 ? Math.min(1, used / total) : 0;
    const percent = Math.round(ratio * 100);
    const tone = percent >= 90 ? 'danger' : percent >= 75 ? 'warn' : '';
    const format = unit === '字节' ? fmtSize : (value) => value.toLocaleString('zh-CN');
    const remaining = Math.max(0, total - used);
    const days = daysUntilReset();
    const resetLabel = days === 1 ? '明天' : days + ' 天后';
    return '<article class="quota"><div class="quota-top"><div class="quota-label"><span class="quota-icon">' + icon + '</span>' + title + '</div>' +
      '<span class="quota-percent ' + tone + '">' + percent + '% 已用</span></div>' +
      '<div class="quota-value">' + format(used) + '</div><div class="quota-limit">上限 ' + format(total) + '</div>' +
      '<div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + percent + '"><div class="fill ' + tone + '" data-width="' + percent + '"></div></div>' +
      (trend || '') +
      '<div class="quota-foot"><span>' + resetLabel + '重置</span><span>剩余 <strong>' + format(remaining) + '</strong></span></div></article>';
  }

  function renderQuota(usage) {
    currentUsage = usage;
    const limits = usage.limits;
    const days = trendDays.slice(-31);
    const trendFor = (pick, format) => trendRow(days, pick, format);
    el('quota').innerHTML = quotaCard('存储空间', usage.state.storageBytes, limits.storageBytes, '字节', '<svg viewBox="0 0 24 24"><ellipse cx="12" cy="5.5" rx="7.5" ry="3"/><path d="M4.5 5.5v6c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3v-6M4.5 11.5v6c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3v-6"/></svg>', trendFor((day) => day.storageBytes, fmtSize)) +
      quotaCard('A 类操作', usage.state.classAOperations, limits.classAOperations, '次', '<svg viewBox="0 0 24 24"><path d="M12 3v18M17 7.5c0-1.7-2-3-5-3S7 6 7 8s1.7 3 5 4 5 2.3 5 4-2 3.5-5 3.5-5-1.4-5-3.5"/></svg>', trendFor((day) => day.classAOperations, (value) => Math.round(value).toLocaleString('zh-CN'))) +
      quotaCard('B 类操作', usage.state.classBOperations, limits.classBOperations, '次', '<svg viewBox="0 0 24 24"><path d="M4 18V6M4 18h16M8 15l3-4 3 2 5-7"/><path d="M16 6h3v3"/></svg>', trendFor((day) => day.classBOperations, (value) => Math.round(value).toLocaleString('zh-CN')));
    // The CSP blocks inline style attributes, so bar widths are set through the CSSOM.
    el('quota').removeAttribute('aria-busy');
    el('quota').querySelectorAll('.fill[data-width]').forEach((fill) => { fill.style.width = fill.dataset.width + '%'; });
    document.title = usage.blocked ? 'CF Free WebDAV - 熔断' : 'CF Free WebDAV';
  }

  function renderBreadcrumbs(segments) {
    let html = '<a href="#" data-empty="1">根目录</a>';
    segments.forEach((part, index) => { html += '<span>/</span><a href="#" data-index="' + index + '">' + esc(part) + '</a>'; });
    el('breadcrumbs').innerHTML = html;
    el('breadcrumbs').querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', (event) => {
        event.preventDefault();
        const next = link.dataset.empty === undefined ? segments.slice(0, Number(link.dataset.index) + 1) : [];
        navigate(next);
      });
    });
  }

  // Navigate with pushState instead of assigning location.hash: clearing the hash
  // (the root breadcrumb) makes the browser scroll back to the top of the document,
  // which throws the file list out of view. pushState never scrolls. Back/forward and
  // manual hash edits are still handled by the popstate/hashchange listeners.
  function navigate(segments) {
    const hash = encodeURIComponent(segments.join('/'));
    const url = location.pathname + location.search + (hash ? '#' + hash : '');
    if (url === location.pathname + location.search + location.hash) return;
    history.pushState(null, '', url);
    initialize();
  }

  function renderEntries(entries) {
    currentEntries = entries;
    if (currentView === 'files') {
      const visibleKeys = new Set(entries.map((item) => item.key));
      selected = new Set([...selected].filter((key) => visibleKeys.has(key)));
    }
    const visibleEntries = [...entries].sort((a, b) => {
      if (currentSort === 'size') return (b.size || 0) - (a.size || 0);
      if (currentSort === 'updated') return new Date(b.uploaded) - new Date(a.uploaded);
      if (currentSort === 'created') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      if (currentSort === 'type') return (a.contentType || '').localeCompare(b.contentType || '') || a.name.localeCompare(b.name, 'zh-CN');
      return a.collection !== b.collection ? Number(b.collection) - Number(a.collection) : a.name.localeCompare(b.name, 'zh-CN');
    });
    el('entry-count').textContent = visibleEntries.length + ' 个项目' + (searchCursor ? ' · 可继续加载' : '');
    el('table').dataset.view = 'files';
    el('table-head').innerHTML = '<tr><th><input id="select-page" type="checkbox" aria-label="选择当前页"></th><th>名称</th><th>大小</th><th>创建时间</th><th>修改时间</th><th>操作</th></tr>';
    if (!visibleEntries.length) {
      const message = el('search').value.trim() ? '没有找到匹配的文件' : '此目录还没有文件';
      el('rows').innerHTML = '<tr><td colspan="6" class="empty-cell"><svg class="empty-icon" viewBox="0 0 24 24"><path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H10l2 2h5.5A2.5 2.5 0 0 1 20 9.5v8a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 7.5z"/><path d="M8 13h8"/></svg>' + message + '</td></tr>';
      renderBulkState();
      return;
    }
    el('rows').innerHTML = visibleEntries.map((item) => {
      const safeHref = attr(item.href);
      const safeKey = attr(item.key);
      const checked = selected.has(item.key) ? ' checked' : '';
      const name = item.collection
        ? '<a href="#" data-dir="' + safeKey + '">' + dirIcon + esc(item.name) + '</a>'
        : '<a href="' + safeHref + '" target="_blank" rel="noopener">' + fileIcon + esc(item.name) + '</a>';
      const shareButton = item.collection ? '' : '<button data-share="' + safeKey + '" aria-label="分享 ' + attr(item.name) + '">分享</button>';
      const previewButton = !item.collection && isPreviewable(item) ? '<button data-preview="' + safeKey + '" aria-label="预览 ' + attr(item.name) + '">预览</button>' : '';
      const action = previewButton + shareButton + '<button data-rename="' + safeKey + '" aria-label="重命名 ' + attr(item.name) + '">重命名</button>' +
        '<button data-delete="' + safeKey + '" aria-label="移至回收站 ' + attr(item.name) + '">删除</button>';
      return '<tr class="row"><td data-label="选择"><input class="row-check" type="checkbox" data-select="' + safeKey + '"' + checked + ' aria-label="选择 ' + attr(item.name) + '"></td><td data-label="名称">' + name + '</td><td data-label="大小">' + (item.collection ? '—' : fmtSize(item.size)) + '</td><td data-label="创建时间">' +
        (item.createdAt ? fmtDate(item.createdAt) : '—') + '</td><td data-label="修改时间">' + fmtMod(item.uploaded) + '</td><td data-label="操作">' + action + '</td></tr>';
    }).join('');
    renderBulkState();
  }

  async function upload(file) {
    await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', davPath([...currentPath, file.name]));
      xhr.setRequestHeader('content-type', file.type || 'application/octet-stream');
      xhr.setRequestHeader(UI_HEADER, '1');
      xhr.upload.onprogress = (event) => {
        if (!event.lengthComputable) return;
        const percent = Math.round((event.loaded / event.total) * 100);
        el('upload-label-text').textContent = '上传中 ' + percent + '%';
        el('upload-bar').style.width = percent + '%';
      };
      xhr.onload = () => {
        if (xhr.status === 401) toLogin();
        return xhr.status < 400 ? resolve() : reject(new Error(xhr.responseText || '上传失败'));
      };
      xhr.onerror = () => reject(new Error('上传失败'));
      xhr.send(file);
    });
    el('upload-label-text').textContent = '已上传 ' + file.name;
    notify('已上传：' + file.name);
  }

  function setUploadProgress(show) {
    el('upload-progress').className = show ? 'upload-progress show' : 'upload-progress';
    if (!show) { el('upload-bar').style.width = '0'; el('upload-label-text').textContent = '上传文件'; }
  }

  async function remove(key) {
    if (!confirm('将 ' + key.split('/').pop() + ' 移至回收站？')) return false;
    await davRequest(key.split('/'), 'DELETE');
    notify('已删除');
    return true;
  }

  async function rename(key) {
    const oldName = key.split('/').pop();
    const newName = prompt('重命名为：', oldName);
    if (!newName || newName === oldName) return;
    if (newName.includes('/') || newName.includes(String.fromCharCode(92))) { notify('名称不能包含 / 或反斜杠', true); return; }
    const segments = key.split('/');
    const destination = [...segments.slice(0, -1), newName];
    await davRequest(segments, 'MOVE', { headers: { destination: new URL(davPath(destination), location.origin).href } });
    notify('已重命名');
  }

  async function mkdir() {
    const name = prompt('新建文件夹名称：');
    if (!name) return;
    if (name.includes('/') || name.includes(String.fromCharCode(92))) { notify('名称不能包含 / 或反斜杠', true); return; }
    await davRequest([...currentPath, name], 'MKCOL');
    notify('文件夹已创建');
  }

  async function share(key) {
    el('share-file').textContent = key.split('/').pop();
    el('share-result').className = 'share-result';
    el('share-url').value = '';
    el('share-limit').value = '';
    el('share-backdrop').classList.add('show');
    el('share-create').dataset.shareKey = key;
    const checked = el('share-ttl').querySelector('input:checked');
    if (checked) checked.checked = false;
    el('share-ttl').querySelector('input').checked = true;
  }

  async function createShare(key, ttlHours) {
    const response = await fetch('/api/share', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ path: key, ttlHours, maxDownloads: el('share-limit').value ? Number(el('share-limit').value) : null }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || '生成失败');
    return data.url;
  }

  function openInboxDialog() {
    el('inbox-result').className = 'share-result';
    el('inbox-url').value = '';
    el('inbox-context').textContent = '目标目录：/' + currentPath.join('/') + '。上传内容需手动确认，已有文件不会被覆盖。';
    el('inbox-backdrop').classList.add('show');
  }

  async function createInboxLink() {
    const ttlHours = Number(el('inbox-ttl').value);
    const data = await apiAction('/api/inboxes', 'POST', { folder: currentPath.join('/'), ttlHours });
    el('inbox-url').value = data.url;
    el('inbox-result').className = 'share-result show';
    el('inbox-url').select();
    document.execCommand('copy');
    notify('收件链接已生成并复制');
  }

  function openGalleryDialog() {
    el('gallery-result').className = 'share-result';
    el('gallery-url').value = '';
    el('gallery-title-input').value = currentPath[currentPath.length - 1] || '';
    el('gallery-context').textContent = '发布目录：/' + currentPath.join('/') + '。HTML、脚本和 SVG 不会公开。';
    el('gallery-backdrop').classList.add('show');
  }

  async function createGallery() {
    const mode = el('gallery-mode').querySelector('input:checked').value;
    const data = await apiAction('/api/galleries', 'POST', {
      folder: currentPath.join('/'), mode, title: el('gallery-title-input').value.trim(),
    });
    el('gallery-url').value = data.url;
    el('gallery-result').className = 'share-result show';
    el('gallery-url').select();
    document.execCommand('copy');
    notify('公开主页已生成并复制');
  }

  function renderBulkState() {
    const bar = el('bulk-actions');
    if (!['files', 'trash', 'shares'].includes(currentView)) { bar.className = 'bulk-actions'; bar.innerHTML = ''; return; }
    if (!selected.size) { bar.className = 'bulk-actions'; bar.innerHTML = ''; return; }
    let actions = '';
    if (currentView === 'files') actions = '<button class="danger" data-bulk="trash">移至回收站</button>';
    else if (currentView === 'trash') actions = '<button data-bulk="restore">恢复</button><button class="danger" data-bulk="purge">永久删除</button>';
    else actions = '<button class="danger" data-bulk="revoke">撤销链接</button>';
    bar.className = 'bulk-actions show';
    bar.innerHTML = '<span>已选 ' + selected.size + ' 项</span><button data-bulk="select-all">全选当前页</button>' + actions + '<button data-bulk="clear">取消选择</button>';
  }

  function showViewLoading(message) {
    el('entry-count').textContent = '正在加载';
    el('table-head').innerHTML = '';
    el('rows').innerHTML = '<tr><td colspan="6" class="empty-cell">' + message + '</td></tr>';
    renderBulkState();
  }

  function renderTrash(items) {
    currentTrash = items;
    el('table').dataset.view = 'trash';
    const visibleIds = new Set(items.map((item) => item.id));
    selected = new Set([...selected].filter((id) => visibleIds.has(id)));
    el('entry-count').textContent = items.length + ' 个项目';
    el('table-head').innerHTML = '<tr><th><input id="select-page" type="checkbox" aria-label="选择当前页"></th><th>名称 / 路径</th><th>类别</th><th>大小</th><th>保留至</th><th>操作</th></tr>';
    if (!items.length) {
      el('rows').innerHTML = '<tr><td colspan="6" class="empty-cell">回收站为空</td></tr>';
      renderBulkState();
      return;
    }
    el('rows').innerHTML = items.map((item) => {
      const key = attr(item.id);
      const checked = selected.has(item.id) ? ' checked' : '';
      const kind = item.kind === 'version' ? '历史版本' : '已删除';
      return '<tr class="row"><td data-label="选择"><input class="row-check" type="checkbox" data-select="' + key + '"' + checked + ' aria-label="选择 ' + attr(item.name) + '"></td>' +
        '<td data-label="名称 / 路径"><strong>' + esc(item.name) + '</strong><small class="subline">' + esc(item.key) + '</small></td>' +
        '<td data-label="类别">' + kind + '<small class="subline">' + fmtDate(item.createdAt) + '</small></td>' +
        '<td data-label="大小">' + fmtSize(item.size) + '</td><td data-label="保留至">' + fmtDate(item.expiresAt) + '</td>' +
        '<td data-label="操作"><button data-restore="' + key + '">恢复</button><button data-purge="' + key + '">永久删除</button></td></tr>';
    }).join('');
    renderBulkState();
  }

  function renderShares(items) {
    currentShares = items;
    el('table').dataset.view = 'shares';
    const visibleIds = new Set(items.map((item) => item.id));
    selected = new Set([...selected].filter((id) => visibleIds.has(id)));
    el('entry-count').textContent = items.length + ' 个链接';
    el('table-head').innerHTML = '<tr><th><input id="select-page" type="checkbox" aria-label="选择当前页"></th><th>文件</th><th>创建时间</th><th>有效期</th><th>访问次数</th><th>操作</th></tr>';
    if (!items.length) {
      el('rows').innerHTML = '<tr><td colspan="6" class="empty-cell">暂无分享链接</td></tr>';
      renderBulkState();
      return;
    }
    el('rows').innerHTML = items.map((item) => {
      const key = attr(item.id);
      const checked = selected.has(item.id) ? ' checked' : '';
      const status = item.revoked ? '已撤销' : Date.parse(item.expiresAt) < Date.now() ? '已过期' : '有效';
      const access = item.maxDownloads === null ? item.downloads + ' 次 · 不限' : item.downloads + ' / ' + item.maxDownloads;
      const revoke = item.revoked || status === '已过期' ? '' : '<button data-revoke="' + key + '">撤销</button>';
      return '<tr class="row"><td data-label="选择"><input class="row-check" type="checkbox" data-select="' + key + '"' + checked + ' aria-label="选择分享链接"></td>' +
        '<td data-label="文件"><strong>' + esc(item.name) + '</strong><small class="subline">' + esc(item.fileKey) + '</small></td>' +
        '<td data-label="创建时间">' + fmtDate(item.createdAt) + '</td><td data-label="有效期">' + fmtDate(item.expiresAt) + '<small class="subline">' + status + '</small></td>' +
        '<td data-label="访问次数">' + access + '<small class="subline">Range 请求也会计次</small></td>' +
        '<td data-label="操作"><button data-copy-share="' + key + '">复制链接</button>' + revoke + '</td></tr>';
    }).join('');
    renderBulkState();
  }

  function renderInboxes(data) {
    currentInboxes = data.inboxes || [];
    currentInboxItems = data.items || [];
    selected.clear();
    el('table').dataset.view = 'inbox';
    el('entry-count').textContent = currentInboxItems.length + ' 个待确认文件';
    el('table-head').innerHTML = '<tr><th>文件</th><th>收件目录</th><th>大小</th><th>上传时间</th><th>操作</th></tr>';
    if (!currentInboxItems.length) {
      el('rows').innerHTML = '<tr><td colspan="5" class="empty-cell">暂无待确认文件</td></tr>';
    } else {
      el('rows').innerHTML = currentInboxItems.map((item) => '<tr class="row"><td data-label="文件"><strong>' + esc(item.name) + '</strong></td>' +
        '<td data-label="收件目录">' + (item.folder ? esc(item.folder) : '根目录') + '</td><td data-label="大小">' + fmtSize(item.size) + '</td>' +
        '<td data-label="上传时间">' + fmtDate(item.uploadedAt) + '</td><td data-label="操作"><button data-inbox-keep="' + attr(item.id) + '" data-inbox-owner="' + attr(item.linkId) + '">保留</button>' +
        '<button data-inbox-delete="' + attr(item.id) + '" data-inbox-owner="' + attr(item.linkId) + '" class="danger">删除</button></td></tr>').join('');
    }
    el('inbox-links-list').innerHTML = currentInboxes.length ? currentInboxes.map((item) => {
      const expiresAt = typeof item.expiresAt === 'number' ? item.expiresAt * 1000 : Date.parse(item.expiresAt);
      const status = item.revoked ? '已撤销' : expiresAt < Date.now() ? '已过期' : '有效';
      const count = item.uploadCount + ' / 100 次上传 · ' + item.pendingCount + ' 个待确认';
      const action = status === '有效' ? '<span class="inbox-link-actions"><button data-copy-inbox="' + attr(item.id) + '" data-inbox-url="' + attr(item.url) + '">复制</button><button data-revoke-inbox="' + attr(item.id) + '">撤销</button></span>' : '<button disabled>已结束</button>';
      return '<div class="inbox-link-row"><span><strong>' + (item.folder ? esc(item.folder) : '根目录') + '</strong><small>' + esc(count) + ' · ' + status + '</small></span>' +
        '<span>有效至 ' + fmtDate(new Date(expiresAt).toISOString()) + '</span>' + action + '</div>';
    }).join('') : '<p class="subline">尚未生成收件链接</p>';
    renderBulkState();
  }

  function renderGalleries(items) {
    currentGalleries = items;
    selected.clear();
    el('table').dataset.view = 'galleries';
    el('entry-count').textContent = items.length + ' 个公开主页';
    el('table-head').innerHTML = '<tr><th>页面</th><th>目录</th><th>项目数</th><th>发布时间</th><th>状态</th><th>操作</th></tr>';
    if (!items.length) {
      el('rows').innerHTML = '<tr><td colspan="6" class="empty-cell">暂无公开主页</td></tr>';
    } else {
      el('rows').innerHTML = items.map((item) => {
        const url = location.origin + '/gallery/' + item.id;
        return '<tr class="row"><td data-label="页面"><strong>' + esc(item.title) + '</strong><small class="subline">' + (item.mode === 'photos' ? '照片墙' : '文件展示') + '</small></td>' +
          '<td data-label="目录">' + (item.folder ? esc(item.folder) : '根目录') + '</td><td data-label="项目数">' + item.fileCount + '</td>' +
          '<td data-label="发布时间">' + fmtDate(item.createdAt) + '</td><td data-label="状态">' + (item.revoked ? '已撤销' : '公开') + '</td>' +
          '<td data-label="操作"><a class="gallery-link" href="' + attr(url) + '" target="_blank" rel="noopener">打开</a>' +
          '<button data-copy-gallery="' + attr(item.id) + '">复制链接</button>' + (item.revoked ? '' : '<button data-revoke-gallery="' + attr(item.id) + '" class="danger">撤销</button>') + '</td></tr>';
      }).join('');
    }
    renderBulkState();
  }

  async function loadTrash() {
    const requestView = ++viewRequest;
    const response = await fetch('/api/trash', { cache: 'no-store' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || '回收站加载失败');
    if (requestView !== viewRequest) return;
    renderTrash(data.items || []);
  }

  async function loadShares() {
    const requestView = ++viewRequest;
    const response = await fetch('/api/shares', { cache: 'no-store' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || '分享链接加载失败');
    if (requestView !== viewRequest) return;
    renderShares(data.shares || []);
  }

  async function loadInboxes() {
    const requestView = ++viewRequest;
    const response = await fetch('/api/inboxes', { cache: 'no-store' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || '收件箱加载失败');
    if (requestView !== viewRequest) return;
    renderInboxes(data);
  }

  async function loadGalleries() {
    const requestView = ++viewRequest;
    const response = await fetch('/api/galleries', { cache: 'no-store' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || '公开主页加载失败');
    if (requestView !== viewRequest) return;
    renderGalleries(data.galleries || []);
  }

  async function loadRecursiveSearch(append = false) {
    const requestView = ++viewRequest;
    const query = el('search').value.trim();
    if (!query) { searchCursor = null; return loadFiles(); }
    if (searchController) searchController.abort();
    searchController = new AbortController();
    const params = new URLSearchParams({ q: query, path: currentPath.join('/') });
    if (append && searchCursor) params.set('cursor', searchCursor);
    const response = await fetch('/api/search?' + params, { cache: 'no-store', signal: searchController.signal });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || '搜索失败');
    if (requestView !== viewRequest) return;
    currentEntries = append
      ? [...new Map(currentEntries.concat(data.entries || []).map((entry) => [entry.key, entry])).values()]
      : (data.entries || []);
    searchCursor = data.cursor || null;
    renderEntries(currentEntries);
    el('load-more').hidden = !searchCursor;
  }

  async function switchView(view) {
    currentView = view;
    viewRequest++;
    if (searchController) searchController.abort();
    searchController = null;
    selected.clear();
    document.querySelectorAll('[data-view]').forEach((button) => button.classList.toggle('active', button.dataset.view === view));
    el('breadcrumbs').hidden = view !== 'files';
    el('search-tools').hidden = view !== 'files';
    el('file-tools').hidden = view !== 'files';
    el('empty-trash').hidden = view !== 'trash';
    el('inbox-links').hidden = view !== 'inbox';
    el('search').value = '';
    searchCursor = null;
    el('load-more').hidden = true;
    showViewLoading(view === 'files' ? '正在加载文件列表…' : view === 'trash' ? '正在加载回收站…' : view === 'shares' ? '正在加载分享链接…' : view === 'inbox' ? '正在加载待确认文件…' : '正在加载公开主页…');
    try {
      if (view === 'files') await loadFiles();
      if (view === 'trash') await loadTrash();
      if (view === 'shares') await loadShares();
      if (view === 'inbox') await loadInboxes();
      if (view === 'galleries') await loadGalleries();
    } catch (error) { notify(error.message || '加载失败', true); }
  }

  async function openPreview(item) {
    const content = el('preview-content');
    el('preview-title').textContent = item.name;
    content.replaceChildren();
    el('preview-backdrop').classList.add('show');
    const type = (item.contentType || '').toLowerCase();
    const src = previewPath(item.key);
    if (type.startsWith('text/plain')) {
      try {
        const response = await fetch(src, { cache: 'no-store' });
        if (!response.ok) throw new Error((await response.text()) || '预览失败');
        const pre = document.createElement('pre');
        pre.textContent = await response.text();
        content.append(pre);
      } catch (error) { notify(error.message || '预览失败', true); }
      return;
    }
    const media = document.createElement(type.startsWith('image/') ? 'img' : type.startsWith('audio/') ? 'audio' : 'video');
    media.src = src;
    if (media instanceof HTMLImageElement) media.alt = item.name;
    else media.controls = true;
    content.append(media);
  }

  async function apiAction(path, method, body) {
    const response = await fetch(path, {
      method,
      ...(body === undefined ? {} : { headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || '操作失败');
    return data;
  }

  async function runBulk(action) {
    const ids = [...selected];
    if (!ids.length) return;
    if (action === 'trash' && !confirm('将选中的 ' + ids.length + ' 个项目移至回收站？')) return;
    if (action === 'purge' && !confirm('永久删除选中的 ' + ids.length + ' 个项目？此操作无法恢复。')) return;
    if (action === 'revoke' && !confirm('撤销选中的 ' + ids.length + ' 个分享链接？')) return;
    try {
      for (const id of ids) {
        if (action === 'trash') await davRequest(id.split('/'), 'DELETE');
        else if (action === 'restore') await apiAction('/api/trash/' + encodeURIComponent(id) + '/restore', 'POST');
        else if (action === 'purge') await apiAction('/api/trash/' + encodeURIComponent(id), 'DELETE');
        else if (action === 'revoke') await apiAction('/api/shares/' + encodeURIComponent(id), 'DELETE');
      }
      selected.clear();
      showViewLoading('正在加载');
      notify(action === 'trash' ? '已移至回收站' : action === 'restore' ? '已恢复' : action === 'purge' ? '已永久删除' : '分享链接已撤销');
      if (currentView === 'files') await loadFiles();
      else if (currentView === 'trash') await loadTrash();
      else if (currentView === 'shares') await loadShares();
    } catch (error) {
      notify(error.message || '批量操作失败，已完成部分项目', true);
      if (currentView === 'files') await loadFiles();
      else if (currentView === 'trash') await loadTrash();
      else if (currentView === 'shares') await loadShares();
    }
  }

  async function loadFiles() {
    const status = el('status');
    const requestView = ++viewRequest;
    status.className = 'status loading';
    status.lastChild.textContent = '正在连接';
    try {
      const response = await fetch(apiPath(currentPath), { cache: 'no-store' });
      if (response.status === 401) { notify('认证失败，请刷新后重新登录', true); status.className = 'status error'; status.lastChild.textContent = '认证失败'; return; }
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '加载失败');
      if (requestView !== viewRequest) return;
      currentPath = data.path || [];
      renderQuota(data.usage);
      if (currentView === 'files') {
        renderBreadcrumbs(data.path || []);
        if (el('search').value.trim()) {
          await loadRecursiveSearch();
        } else {
          searchCursor = null;
          el('load-more').hidden = true;
          renderEntries(data.entries);
        }
      }
      status.className = 'status';
      status.lastChild.textContent = '存储服务正常';
      loadTrend();
    } catch (error) {
      if (requestView !== viewRequest) return;
      notify(error.message || '加载失败', true);
      status.className = 'status error';
      status.lastChild.textContent = '连接失败';
    }
  }

  function initialize() {
    const value = decodeURIComponent(location.hash.slice(1));
    currentPath = value ? value.split('/') : [];
    selected.clear();
    loadFiles();
  }

  el('refresh').addEventListener('click', async () => {
    try {
      if (currentView === 'files') await loadFiles();
      else if (currentView === 'trash') await loadTrash();
      else if (currentView === 'shares') await loadShares();
      else if (currentView === 'inbox') await loadInboxes();
      else if (currentView === 'galleries') await loadGalleries();
    } catch (error) { notify(error.message || '刷新失败', true); }
  });
  el('search').addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => loadRecursiveSearch().catch((error) => {
      if (error.name !== 'AbortError') notify(error.message || '搜索失败', true);
    }), 220);
  });
  el('mkdir').addEventListener('click', () => {
    mkdir().then(loadFiles).catch((error) => notify(error.message || '创建失败', true));
  });
  el('sort').addEventListener('change', () => { currentSort = el('sort').value; renderEntries(currentEntries); });
  document.querySelectorAll('[data-view]').forEach((button) => button.addEventListener('click', () => switchView(button.dataset.view)));
  el('load-more').addEventListener('click', () => loadRecursiveSearch(true).catch((error) => notify(error.message || '加载失败', true)));
  el('empty-trash').addEventListener('click', async () => {
    if (!confirm('永久删除回收站中的所有项目？此操作无法恢复。')) return;
    try {
      await apiAction('/api/trash', 'DELETE');
      selected.clear();
      await loadTrash();
      const usageResponse = await fetch(apiPath(currentPath), { cache: 'no-store' });
      if (usageResponse.ok) renderQuota((await usageResponse.json()).usage);
      notify('回收站已清空');
    } catch (error) { notify(error.message || '清空失败', true); }
  });
  el('sync').addEventListener('click', async () => {
    el('sync').disabled = true;
    try {
      const response = await fetch('/usage/reconcile-official', { method: 'POST' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '同步失败');
      notify('官方用量已同步');
      loadFiles();
    } catch (error) { notify(error.message || '同步失败', true); }
    finally { el('sync').disabled = false; }
  });
  el('file').addEventListener('change', async (event) => {
    const files = [...event.target.files];
    if (!files.length) return;
    el('file').disabled = true;
    setUploadProgress(true);
    try { for (const file of files) await upload(file); loadFiles(); }
    catch (error) { notify(error.message || '上传失败', true); }
    finally { el('file').disabled = false; setUploadProgress(false); event.target.value = ''; }
  });
  el('rows').addEventListener('click', async (event) => {
    const dir = event.target.closest('[data-dir]');
    const del = event.target.closest('[data-delete]');
    const ren = event.target.closest('[data-rename]');
    const shareButton = event.target.closest('[data-share]');
    const preview = event.target.closest('[data-preview]');
    const restore = event.target.closest('[data-restore]');
    const purge = event.target.closest('[data-purge]');
    const revoke = event.target.closest('[data-revoke]');
    const copyShare = event.target.closest('[data-copy-share]');
    const inboxKeep = event.target.closest('[data-inbox-keep]');
    const inboxDelete = event.target.closest('[data-inbox-delete]');
    const copyInbox = event.target.closest('[data-copy-inbox]');
    const revokeInbox = event.target.closest('[data-revoke-inbox]');
    const revokeGallery = event.target.closest('[data-revoke-gallery]');
    const copyGallery = event.target.closest('[data-copy-gallery]');
    if (dir) { event.preventDefault(); navigate(dir.dataset.dir.split('/')); }
    else if (del) { event.preventDefault(); try { if (await remove(del.dataset.delete)) loadFiles(); } catch (error) { notify(error.message || '删除失败', true); } }
    else if (ren) { event.preventDefault(); try { await rename(ren.dataset.rename); loadFiles(); } catch (error) { notify(error.message || '重命名失败', true); } }
    else if (shareButton) { event.preventDefault(); share(shareButton.dataset.share).catch((error) => notify(error.message || '分享失败', true)); }
    else if (preview) { event.preventDefault(); const item = currentEntries.find((entry) => entry.key === preview.dataset.preview); if (item) openPreview(item); }
    else if (restore) { try { await apiAction('/api/trash/' + encodeURIComponent(restore.dataset.restore) + '/restore', 'POST'); await loadTrash(); const response = await fetch(apiPath(currentPath), { cache: 'no-store' }); if (response.ok) renderQuota((await response.json()).usage); notify('已恢复'); } catch (error) { notify(error.message || '恢复失败', true); } }
    else if (purge) { if (confirm('永久删除此项目？此操作无法恢复。')) try { await apiAction('/api/trash/' + encodeURIComponent(purge.dataset.purge), 'DELETE'); await loadTrash(); const response = await fetch(apiPath(currentPath), { cache: 'no-store' }); if (response.ok) renderQuota((await response.json()).usage); notify('已永久删除'); } catch (error) { notify(error.message || '删除失败', true); } }
    else if (revoke) { if (confirm('撤销此分享链接？')) try { await apiAction('/api/shares/' + encodeURIComponent(revoke.dataset.revoke), 'DELETE'); await loadShares(); notify('分享链接已撤销'); } catch (error) { notify(error.message || '撤销失败', true); } }
    else if (copyShare) { const item = currentShares.find((shareItem) => shareItem.id === copyShare.dataset.copyShare); if (item) { await navigator.clipboard.writeText(item.url); notify('链接已复制'); } }
    else if (inboxKeep) { try { const result = await apiAction('/api/inboxes/' + encodeURIComponent(inboxKeep.dataset.inboxOwner) + '/items/' + encodeURIComponent(inboxKeep.dataset.inboxKeep) + '/keep', 'POST'); await loadInboxes(); notify('已保留到云盘：' + result.name); } catch (error) { notify(error.message || '保留失败', true); } }
    else if (inboxDelete) { if (confirm('永久删除此待确认文件？')) try { await apiAction('/api/inboxes/' + encodeURIComponent(inboxDelete.dataset.inboxOwner) + '/items/' + encodeURIComponent(inboxDelete.dataset.inboxDelete) + '/delete', 'DELETE'); await loadInboxes(); notify('待确认文件已删除'); } catch (error) { notify(error.message || '删除失败', true); } }
    else if (copyInbox) { await navigator.clipboard.writeText(copyInbox.dataset.inboxUrl); notify('收件链接已复制'); }
    else if (revokeInbox) { if (confirm('撤销此收件链接？待确认文件仍会保留。')) try { await apiAction('/api/inboxes/' + encodeURIComponent(revokeInbox.dataset.revokeInbox), 'DELETE'); await loadInboxes(); notify('收件链接已撤销'); } catch (error) { notify(error.message || '撤销失败', true); } }
    else if (revokeGallery) { if (confirm('撤销此公开主页？')) try { await apiAction('/api/galleries/' + encodeURIComponent(revokeGallery.dataset.revokeGallery), 'DELETE'); await loadGalleries(); notify('公开主页已撤销'); } catch (error) { notify(error.message || '撤销失败', true); } }
    else if (copyGallery) { await navigator.clipboard.writeText(location.origin + '/gallery/' + copyGallery.dataset.copyGallery); notify('公开主页链接已复制'); }
  });
  el('table').addEventListener('change', (event) => {
    const checkbox = event.target.closest('[data-select]');
    if (checkbox) {
      if (checkbox.checked) selected.add(checkbox.dataset.select);
      else selected.delete(checkbox.dataset.select);
      renderBulkState();
    }
    if (event.target.id === 'select-page') {
      const entries = currentView === 'files' ? currentEntries : currentView === 'trash' ? currentTrash : currentShares;
      for (const item of entries) {
        const key = currentView === 'files' ? item.key : item.id;
        if (event.target.checked) selected.add(key);
        else selected.delete(key);
      }
      if (currentView === 'files') renderEntries(currentEntries);
      if (currentView === 'trash') renderTrash(currentTrash);
      if (currentView === 'shares') renderShares(currentShares);
    }
  });
  el('bulk-actions').addEventListener('click', (event) => {
    const button = event.target.closest('[data-bulk]');
    if (!button) return;
    if (button.dataset.bulk === 'select-all') {
      const entries = currentView === 'files' ? currentEntries : currentView === 'trash' ? currentTrash : currentShares;
      for (const item of entries) selected.add(currentView === 'files' ? item.key : item.id);
      if (currentView === 'files') renderEntries(currentEntries);
      if (currentView === 'trash') renderTrash(currentTrash);
      if (currentView === 'shares') renderShares(currentShares);
    } else if (button.dataset.bulk === 'clear') {
      selected.clear();
      if (currentView === 'files') renderEntries(currentEntries);
      if (currentView === 'trash') renderTrash(currentTrash);
      if (currentView === 'shares') renderShares(currentShares);
    } else runBulk(button.dataset.bulk);
  });
  el('share-ttl').addEventListener('change', () => { el('share-result').className = 'share-result'; });
  el('share-create').addEventListener('click', async () => {
    const key = el('share-create').dataset.shareKey;
    if (!key) return;
    el('share-create').disabled = true;
    try {
      const ttl = Number(el('share-ttl').querySelector('input:checked').value);
      el('share-url').value = await createShare(key, ttl);
      el('share-result').className = 'share-result show';
      el('share-url').select();
      document.execCommand('copy');
      notify('链接已生成并复制');
    } catch (error) { notify(error.message || '生成失败', true); }
    finally { el('share-create').disabled = false; }
  });
  el('share-cancel').addEventListener('click', () => { el('share-backdrop').classList.remove('show'); });
  el('share-backdrop').addEventListener('click', (event) => {
    if (event.target === el('share-backdrop')) el('share-backdrop').classList.remove('show');
  });
  el('share-copy').addEventListener('click', async () => {
    await navigator.clipboard.writeText(el('share-url').value);
    notify('已复制');
  });
  el('preview-close').addEventListener('click', () => { el('preview-backdrop').classList.remove('show'); el('preview-content').replaceChildren(); });
  el('preview-backdrop').addEventListener('click', (event) => {
    if (event.target === el('preview-backdrop')) { el('preview-backdrop').classList.remove('show'); el('preview-content').replaceChildren(); }
  });
  el('inbox-create-open').addEventListener('click', openInboxDialog);
  el('inbox-create').addEventListener('click', async () => {
    el('inbox-create').disabled = true;
    try { await createInboxLink(); } catch (error) { notify(error.message || '收件链接生成失败', true); }
    finally { el('inbox-create').disabled = false; }
  });
  el('inbox-copy').addEventListener('click', async () => { await navigator.clipboard.writeText(el('inbox-url').value); notify('收件链接已复制'); });
  el('inbox-close').addEventListener('click', () => el('inbox-backdrop').classList.remove('show'));
  el('inbox-backdrop').addEventListener('click', (event) => { if (event.target === el('inbox-backdrop')) el('inbox-backdrop').classList.remove('show'); });
  el('gallery-create-open').addEventListener('click', openGalleryDialog);
  el('gallery-create').addEventListener('click', async () => {
    el('gallery-create').disabled = true;
    try { await createGallery(); } catch (error) { notify(error.message || '公开主页生成失败', true); }
    finally { el('gallery-create').disabled = false; }
  });
  el('gallery-copy').addEventListener('click', async () => { await navigator.clipboard.writeText(el('gallery-url').value); notify('公开主页链接已复制'); });
  el('gallery-close').addEventListener('click', () => el('gallery-backdrop').classList.remove('show'));
  el('gallery-backdrop').addEventListener('click', (event) => { if (event.target === el('gallery-backdrop')) el('gallery-backdrop').classList.remove('show'); });
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      el('share-backdrop').classList.remove('show');
      el('preview-backdrop').classList.remove('show');
      el('preview-content').replaceChildren();
      el('inbox-backdrop').classList.remove('show');
      el('gallery-backdrop').classList.remove('show');
    }
  });
  const tablewrap = document.querySelector('.tablewrap');
  ['dragenter', 'dragover'].forEach((type) => tablewrap.addEventListener(type, (event) => {
    event.preventDefault();
    tablewrap.classList.add('dragover');
  }));
  ['dragleave', 'drop'].forEach((type) => tablewrap.addEventListener(type, (event) => {
    event.preventDefault();
    if (type === 'dragleave' && tablewrap.contains(event.relatedTarget)) return;
    tablewrap.classList.remove('dragover');
  }));
  tablewrap.addEventListener('drop', async (event) => {
    if (currentView !== 'files') return;
    const files = [...(event.dataTransfer ? event.dataTransfer.files : [])];
    if (!files.length) return;
    el('file').disabled = true;
    setUploadProgress(true);
    try { for (const file of files) await upload(file); loadFiles(); }
    catch (error) { notify(error.message || '上传失败', true); }
    finally { el('file').disabled = false; setUploadProgress(false); }
  });
  ${fileMapScript}
  window.addEventListener('hashchange', initialize);
  window.addEventListener('popstate', initialize);
  initialize();
`;

export function webPage(nonce: string): string {
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light dark">
  <meta name="theme-color" media="(prefers-color-scheme: light)" content="#f3f6fb">
  <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#0c1220">
  <title>CF Free WebDAV</title>
  <style nonce="${nonce}">${pageStyle}</style>
</head>
<body>
<main class="app">
  <header class="page-header">
    <div class="brand"><div class="brand-mark" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 7.5A2.5 2.5 0 0 1 7.5 5H11l2 2h3.5A2.5 2.5 0 0 1 19 9.5v7a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 5 16.5z"/><path d="M5 10h14"/><path d="M9 14h6"/></svg></div><div><p class="eyebrow">OBJECT STORAGE · CONTROL CENTER</p><h1>CF Free WebDAV</h1><div class="sub">浏览和管理 R2 文件，随时掌握存储用量</div></div></div>
    <div class="actions"><button id="refresh"><svg class="btn-icon" viewBox="0 0 24 24"><path d="M20 11a8 8 0 0 0-14.8-3L4 10"/><path d="M4 5v5h5M4 13a8 8 0 0 0 14.8 3L20 14"/><path d="M20 19v-5h-5"/></svg>刷新列表</button><button id="sync" class="primary"><svg class="btn-icon" viewBox="0 0 24 24"><path d="M20 7v5h-5M4 17v-5h5"/><path d="M5.6 9A7 7 0 0 1 18 6l2 6M4 12l2 6a7 7 0 0 0 12.4-3"/></svg>同步官方用量</button><form class="logout-form" method="post" action="/logout"><button type="submit" class="ghost" aria-label="退出登录"><svg class="btn-icon" viewBox="0 0 24 24"><path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4"/><path d="M10 16l-4-4 4-4M6 12h10"/></svg>退出</button></form></div>
  </header>
  <section class="overview" aria-labelledby="usage-title">
    <div class="section-heading"><h2 id="usage-title">用量概览</h2><p>当前周期的额度使用情况</p></div>
    <div id="quota" class="quota-grid" aria-busy="true"><article class="quota quota-skeleton" aria-label="正在加载用量"></article><article class="quota quota-skeleton" aria-hidden="true"></article><article class="quota quota-skeleton" aria-hidden="true"></article></div>
  </section>
  <section class="panel" aria-labelledby="files-title">
    <div class="panel-heading"><div class="panel-title"><h2 id="files-title">文件管理</h2><span id="entry-count">正在加载</span></div><div id="status" class="status loading" role="status" aria-live="polite"><span class="status-dot"></span><span>正在连接</span></div></div>
    <nav class="view-tabs" aria-label="文件视图">
      <button class="active" data-view="files">文件</button>
      <button data-view="inbox">收件箱</button>
      <button data-view="trash">回收站</button>
      <button data-view="shares">分享链接</button>
      <button data-view="galleries">公开主页</button>
    </nav>
    <div class="toolbar">
      <nav id="breadcrumbs" class="breadcrumbs" aria-label="目录路径"></nav>
      <div class="toolbar-tools" id="search-tools"><label class="search"><svg viewBox="0 0 24 24"><circle cx="10.8" cy="10.8" r="6.3"/><path d="m16 16 4.5 4.5"/></svg><input id="search" type="search" placeholder="递归搜索当前目录" aria-label="递归搜索当前目录"></label>
        <select id="sort" aria-label="排序"><option value="name">按名称</option><option value="updated">最近修改</option><option value="created">最近创建</option><option value="size">文件大小</option><option value="type">文件类型</option></select></div>
      <div class="toolbar-tools" id="file-tools"><button id="mkdir" aria-label="新建文件夹"><svg viewBox="0 0 24 24"><path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H10l2 2h6.5A2.5 2.5 0 0 1 21 9.5v8a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5z"/><path d="M12 10.5v6M9 13.5h6"/></svg>新建文件夹</button><div class="upload"><input id="file" type="file" multiple><label class="upload-label" for="file"><svg viewBox="0 0 24 24"><path d="M12 16V4M7.5 8.5 12 4.5"/><path d="M5 14v5h14v-5"/></svg><span id="upload-label-text">上传文件</span></label></div><button id="star-map-open" aria-label="打开文件星图">文件星图</button><button id="inbox-create-open">生成收件链接</button><button id="gallery-create-open">发布目录主页</button></div>
      <button id="empty-trash" class="danger" hidden>清空回收站</button>
    </div>
    <div id="bulk-actions" class="bulk-actions"></div>
    <div id="upload-progress" class="upload-progress"><span>正在上传</span><div class="bar"><div id="upload-bar" class="fill"></div></div></div>
    <div class="tablewrap">
      <table id="table" class="table"><thead id="table-head"><tr><th></th><th>名称</th><th>大小</th><th>创建时间</th><th>修改时间</th><th>操作</th></tr></thead><tbody id="rows"><tr><td colspan="6" class="empty-cell">正在加载文件列表…</td></tr></tbody></table>
    </div>
    <button id="load-more" class="load-more" hidden>加载更多搜索结果</button>
    <section id="inbox-links" class="inbox-links" hidden><h3>收件链接</h3><div id="inbox-links-list"></div></section>
  </section>
  <p class="footer-note">用量数据为 Worker 侧统计估算；点击“同步官方用量”可与 Cloudflare 官方数据校准。</p>
</main>
<div id="message"></div>
<div id="share-backdrop" class="dialog-backdrop">
  <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="share-title">
    <h3 id="share-title">生成分享链接</h3>
    <p class="dialog-sub" id="share-file"></p>
    <div id="share-ttl" class="ttl-group">
      <label><input type="radio" name="share-ttl" value="1" checked><span>1 小时</span></label>
      <label><input type="radio" name="share-ttl" value="24"><span>1 天</span></label>
      <label><input type="radio" name="share-ttl" value="168"><span>7 天</span></label>
      <label><input type="radio" name="share-ttl" value="720"><span>30 天</span></label>
    </div>
    <label class="limit-field">访问次数上限 <input id="share-limit" type="number" min="1" max="10000" placeholder="不限"></label>
    <p class="limit-note">播放或下载产生的每个请求都会计数，Range 分段请求也包含在内。</p>
    <div id="share-result" class="share-result">
      <textarea id="share-url" readonly aria-label="分享链接"></textarea>
    </div>
    <div class="dialog-actions">
      <button id="share-copy">复制</button>
      <button id="share-cancel">关闭</button>
      <button id="share-create" class="primary">生成链接</button>
    </div>
  </div>
</div>
<div id="preview-backdrop" class="dialog-backdrop">
  <div class="dialog preview-dialog" role="dialog" aria-modal="true" aria-labelledby="preview-title">
    <div class="preview-heading"><h3 id="preview-title">文件预览</h3><button id="preview-close" aria-label="关闭预览">关闭</button></div>
    <div id="preview-content"></div>
  </div>
</div>
${fileMapMarkup}
<div id="inbox-backdrop" class="dialog-backdrop">
  <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="inbox-title">
    <h3 id="inbox-title">生成收件链接</h3><p id="inbox-context" class="dialog-sub">文件将进入待确认区，不会覆盖已有文件。</p>
    <label class="limit-field">有效期<select id="inbox-ttl"><option value="24">1 天</option><option value="168" selected>7 天</option><option value="720">30 天</option></select></label>
    <div id="inbox-result" class="share-result"><textarea id="inbox-url" readonly aria-label="收件链接"></textarea></div>
    <div class="dialog-actions"><button id="inbox-copy">复制</button><button id="inbox-close">关闭</button><button id="inbox-create" class="primary">生成链接</button></div>
  </div>
</div>
<div id="gallery-backdrop" class="dialog-backdrop">
  <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="gallery-title">
    <h3 id="gallery-title">发布目录主页</h3><p id="gallery-context" class="dialog-sub">公开内容会固定为当前文件快照；HTML、脚本和 SVG 不会公开。</p>
    <label class="text-field">页面标题<input id="gallery-title-input" type="text" maxlength="120"></label>
    <div id="gallery-mode" class="mode-options"><label><input type="radio" name="gallery-mode" value="photos" checked>照片墙</label><label><input type="radio" name="gallery-mode" value="files">文件展示</label></div>
    <div id="gallery-result" class="share-result"><textarea id="gallery-url" readonly aria-label="公开主页链接"></textarea></div>
    <div class="dialog-actions"><button id="gallery-copy">复制</button><button id="gallery-close">关闭</button><button id="gallery-create" class="primary">生成主页</button></div>
  </div>
</div>
<script nonce="${nonce}">${script}</script>
</body>
</html>`;
}
