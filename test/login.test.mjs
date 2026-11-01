import assert from "node:assert/strict";
import test from "node:test";
import { authHeaders, loadBuildModule, makeRuntime, MemoryR2 } from "./helpers.mjs";

async function setup(envOverrides = {}) {
  const { default: worker } = await loadBuildModule("src/index.js");
  const { env: config, namespace } = await makeRuntime(envOverrides);
  const bucket = new MemoryR2();
  await bucket.put("notes.txt", "hello", { httpMetadata: { contentType: "text/plain" } });
  const env = { ...config, FILES: bucket, USAGE_STORE: namespace };
  const fetch = (path, init = {}) => worker.fetch(new Request(`https://example.test${path}`, init), env);
  const login = (username, password, headers = {}) => fetch("/login", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", "sec-fetch-site": "same-origin", ...headers },
    body: new URLSearchParams({ username, password }).toString(),
  });
  return { worker, env, fetch, login };
}

function cookieFrom(response) {
  return response.headers.get("set-cookie").split(";")[0];
}

test("login page replaces the browser Basic Auth prompt and issues a session cookie", async () => {
  const { fetch, login } = await setup();

  const anonymous = await fetch("/");
  assert.equal(anonymous.status, 303);
  assert.equal(anonymous.headers.get("location"), "/login");
  // A browser that cached Basic Auth credentials must still go through the login page.
  assert.equal((await fetch("/", { headers: authHeaders() })).status, 303);

  const page = await fetch("/login");
  assert.equal(page.status, 200);
  const html = await page.text();
  assert.match(html, /<form id="login-form" method="post" action="\/login">/);
  assert.match(html, /autocomplete="current-password"/);
  const nonce = page.headers.get("content-security-policy").match(/script-src 'nonce-([^']+)'/)[1];
  assert.match(html, new RegExp(`<script nonce="${nonce.replace(/[+/=]/g, "\\$&")}">`));

  const wrong = await login("webdav", "nope");
  assert.equal(wrong.status, 401);
  assert.equal(wrong.headers.get("set-cookie"), null);
  assert.equal(wrong.headers.get("www-authenticate"), null);
  assert.match(await wrong.text(), /用户名或密码不正确/);
  assert.equal((await login("someone", "test-password")).status, 401);

  const ok = await login("webdav", "test-password");
  assert.equal(ok.status, 303);
  assert.equal(ok.headers.get("location"), "/");
  const setCookie = ok.headers.get("set-cookie");
  assert.match(setCookie, /^__Host-cfwd_session=v1\./);
  for (const attribute of ["Path=/", "HttpOnly", "Secure", "SameSite=Lax"]) assert.ok(setCookie.includes(attribute), attribute);
  const cookie = cookieFrom(ok);

  const home = await fetch("/", { headers: { cookie } });
  assert.equal(home.status, 200);
  assert.match(await home.text(), /action="\/logout"/);
  assert.equal((await fetch("/login", { headers: { cookie } })).headers.get("location"), "/");
  const files = await fetch("/api/files?path=", { headers: { cookie } });
  assert.equal(files.status, 200);
  assert.deepEqual((await files.json()).entries.map((entry) => entry.key), ["notes.txt"]);
  const download = await fetch("/dav/notes.txt", { headers: { cookie } });
  assert.equal(await download.text(), "hello");

  // Flip a character in the middle: the last base64url character also carries ignored padding bits.
  const middle = cookie.length - 10;
  const tampered = cookie.slice(0, middle) + (cookie[middle] === "A" ? "B" : "A") + cookie.slice(middle + 1);
  assert.equal((await fetch("/", { headers: { cookie: tampered } })).status, 303);
  assert.equal((await fetch("/api/files?path=", { headers: { cookie: tampered, "sec-fetch-site": "same-origin" } })).status, 401);
});

test("login rejects malformed and cross-site submissions", async () => {
  const { fetch, login } = await setup();
  assert.equal((await login("webdav", "test-password", { "sec-fetch-site": "cross-site" })).status, 403);
  assert.equal((await login("webdav", "test-password", { "content-type": "application/json" })).status, 400);
  assert.equal((await fetch("/login", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", "content-length": "99999" },
    body: "x".repeat(10),
  })).status, 400);
  assert.equal((await fetch("/login", { method: "PUT" })).status, 405);
});

test("logout clears the session and only accepts same-origin POST", async () => {
  const { fetch, login } = await setup();
  const cookie = cookieFrom(await login("webdav", "test-password"));
  assert.equal((await fetch("/logout", { headers: { cookie } })).status, 405);
  assert.equal((await fetch("/logout", { method: "POST", headers: { cookie, "sec-fetch-site": "cross-site" } })).status, 403);
  const logout = await fetch("/logout", { method: "POST", headers: { cookie, "sec-fetch-site": "same-origin" } });
  assert.equal(logout.status, 303);
  assert.equal(logout.headers.get("location"), "/login");
  assert.match(logout.headers.get("set-cookie"), /^__Host-cfwd_session=; .*Max-Age=0/);
});

test("browsers are redirected or get a challenge-free 401 while WebDAV clients keep Basic Auth", async () => {
  const { fetch } = await setup();
  const davClient = await fetch("/dav/", { method: "PROPFIND", headers: { depth: "1" } });
  assert.equal(davClient.status, 401);
  assert.match(davClient.headers.get("www-authenticate"), /^Basic /);
  assert.equal((await fetch("/dav/", { method: "PROPFIND", headers: { depth: "1", ...authHeaders() } })).status, 207);
  assert.equal((await fetch("/api/files?path=", { headers: authHeaders() })).status, 200);

  const navigation = await fetch("/dav/notes.txt", { headers: { "sec-fetch-site": "none", "sec-fetch-mode": "navigate" } });
  assert.equal(navigation.status, 303);
  assert.equal(navigation.headers.get("location"), "/login");
  const pageFetch = await fetch("/api/files?path=", { headers: { "sec-fetch-site": "same-origin", "sec-fetch-mode": "cors" } });
  assert.equal(pageFetch.status, 401);
  assert.equal(pageFetch.headers.get("www-authenticate"), null);
  const pageUpload = await fetch("/dav/new.txt", { method: "PUT", headers: { "x-cfwd-ui": "1" }, body: "x" });
  assert.equal(pageUpload.status, 401);
  assert.equal(pageUpload.headers.get("www-authenticate"), null);
});

test("sessions expire and are invalidated by a password change", async () => {
  const { createSessionToken, verifySessionToken, SESSION_TTL_SECONDS } = await loadBuildModule("src/auth/session.js");
  const now = Date.UTC(2026, 0, 1);
  const token = await createSessionToken("webdav", "secret", now);
  assert.equal(await verifySessionToken(token, "webdav", "secret", now), true);
  assert.equal(await verifySessionToken(token, "webdav", "secret", now + SESSION_TTL_SECONDS * 1000), false);
  assert.equal(await verifySessionToken(token, "webdav", "changed", now), false);
  assert.equal(await verifySessionToken(token, "other", "secret", now), false);
  assert.equal(await verifySessionToken(`${token}.extra`, "webdav", "secret", now), false);
  assert.equal(await verifySessionToken("v1.99999999999.%%%", "webdav", "secret", now), false);

  const { login } = await setup();
  const cookie = cookieFrom(await login("webdav", "test-password"));
  const rotated = await setup({ WEBDAV_PASSWORD: "rotated-password" });
  assert.equal((await rotated.fetch("/", { headers: { cookie } })).status, 303);
});

test("management page markup has no inline style attributes, which the CSP would block", async () => {
  const [{ webPage }, { loginPage }] = await Promise.all([
    loadBuildModule("src/web/page.js"),
    loadBuildModule("src/web/login.js"),
  ]);
  for (const html of [webPage("n"), loginPage("n", { origin: "https://example.test", error: "<b>x</b>" })]) {
    const body = html.replace(/<style nonce="n">[\s\S]*?<\/style>/, "").replace(/<script nonce="n">[\s\S]*?<\/script>/, "");
    assert.doesNotMatch(body, /\sstyle="/);
  }
  assert.match(loginPage("n", { origin: "https://example.test", error: "<b>x</b>" }), /&lt;b&gt;x&lt;\/b&gt;/);
  const inlineScript = loginPage("n", { origin: "https://example.test" }).match(/<script nonce="n">([\s\S]*?)<\/script>/)[1];
  assert.doesNotThrow(() => new Function(inlineScript));
});
