import assert from "node:assert/strict";
import test from "node:test";
import { authHeaders, loadBuildModule, makeRuntime, MemoryR2 } from "./helpers.mjs";

const STATE_KEY = "r2-usage-state";

function previousMonthState(month, overrides = {}) {
  return {
    month,
    classAOperations: 900,
    classBOperations: 5000,
    storageBytes: 12345,
    localClassAOperations: 0,
    localClassBOperations: 0,
    localStorageBytes: 0,
    reconciledAt: null,
    reconciledClassAOperations: 0,
    reconciledClassBOperations: 0,
    reconciledStorageBytes: 0,
    ...overrides,
  };
}

test("month rollover resets operation counts but keeps the stored-bytes estimate", async () => {
  const { monthKey } = await loadBuildModule("src/monitor/quota.js");
  const { state, store, usage } = await makeRuntime();
  state.values.set(STATE_KEY, previousMonthState("2000-01"));

  const summary = await usage.summary();
  assert.equal(summary.state.month, monthKey(new Date()));
  assert.equal(summary.state.classAOperations, 0);
  assert.equal(summary.state.classBOperations, 0);
  assert.equal(summary.state.storageBytes, 12345);

  state.values.set(STATE_KEY, previousMonthState("2000-01"));
  await usage.commit(10, 1, 0);
  assert.equal(state.values.get(STATE_KEY).storageBytes, 12355);
  assert.equal(state.values.get(STATE_KEY).classAOperations, 1);

  state.values.set(STATE_KEY, previousMonthState("2000-01"));
  await store.alarm();
  assert.equal(state.values.get(STATE_KEY).storageBytes, 12345);
  assert.equal(state.values.get(STATE_KEY).classAOperations, 0);

  // An alarm that fires after a request already rolled the month over must not wipe new counts.
  await usage.commit(0, 7, 0);
  await store.alarm();
  assert.equal(state.values.get(STATE_KEY).classAOperations, 7);
  assert.equal(state.values.get(STATE_KEY).storageBytes, 12345);
});

test("downloads only render script-free types inline and force everything else to attachment", async () => {
  const [{ default: worker }, { handleWebDav }, { parseDavPath }] = await Promise.all([
    loadBuildModule("src/index.js"),
    loadBuildModule("src/webdav/handler.js"),
    loadBuildModule("src/http/path.js"),
  ]);
  const { env: config, namespace, usage } = await makeRuntime();
  const bucket = new MemoryR2();
  await bucket.put("page.html", "<script>alert(1)</script>", { httpMetadata: { contentType: "text/html" } });
  await bucket.put("logo.svg", "<svg/>", {
    httpMetadata: { contentType: "image/svg+xml", contentDisposition: 'inline; filename="logo.svg"' },
  });
  await bucket.put("notes.txt", "hello", { httpMetadata: { contentType: "text/plain; charset=utf-8" } });
  await bucket.put("photo.png", "png", { httpMetadata: { contentType: "image/png" } });
  const env = { ...config, FILES: bucket, USAGE_STORE: namespace };
  const call = (key, method = "GET") => handleWebDav(
    new Request(`https://example.test/dav/${key}`, { method }), env, parseDavPath(`/dav/${key}`), usage,
  );

  const html = await call("page.html");
  assert.equal(html.headers.get("content-disposition"), "attachment");
  assert.equal(html.headers.get("x-content-type-options"), "nosniff");
  assert.equal((await call("page.html", "HEAD")).headers.get("content-disposition"), "attachment");
  assert.equal((await call("logo.svg")).headers.get("content-disposition"), 'attachment; filename="logo.svg"');
  assert.equal((await call("notes.txt")).headers.get("content-disposition"), null);
  const png = await call("photo.png");
  assert.equal(png.headers.get("content-disposition"), null);
  assert.equal(png.headers.get("x-content-type-options"), "nosniff");

  const shareResponse = await worker.fetch(new Request("https://example.test/api/share", {
    method: "POST",
    headers: { ...authHeaders(), "content-type": "application/json" },
    body: JSON.stringify({ path: "page.html", ttlHours: 1 }),
  }), env);
  const shared = await worker.fetch(new Request((await shareResponse.json()).url), env);
  assert.equal(shared.status, 200);
  assert.equal(shared.headers.get("content-disposition"), "attachment");
});

test("state-changing management APIs reject cross-site requests", async () => {
  const { default: worker } = await loadBuildModule("src/index.js");
  const { env: config, namespace } = await makeRuntime();
  const bucket = new MemoryR2();
  await bucket.put("public.txt", "hello", { httpMetadata: { contentType: "text/plain" } });
  const env = { ...config, FILES: bucket, USAGE_STORE: namespace };
  const share = (headers) => worker.fetch(new Request("https://example.test/api/share", {
    method: "POST",
    headers: { ...authHeaders(), "content-type": "text/plain", ...headers },
    body: JSON.stringify({ path: "public.txt", ttlHours: 1 }),
  }), env);

  assert.equal((await share({ "sec-fetch-site": "cross-site" })).status, 403);
  assert.equal((await share({ "sec-fetch-site": "same-site" })).status, 403);
  assert.equal((await share({ origin: "https://evil.test" })).status, 403);
  assert.equal((await worker.fetch(new Request("https://example.test/api/galleries", {
    method: "POST",
    headers: { ...authHeaders(), "sec-fetch-site": "cross-site" },
    body: JSON.stringify({ folder: "", mode: "files" }),
  }), env)).status, 403);
  assert.equal((await share({ "sec-fetch-site": "same-origin", origin: "https://example.test" })).status, 200);
  assert.equal((await share({})).status, 200);

  const read = await worker.fetch(new Request("https://example.test/api/shares", {
    headers: { ...authHeaders(), "sec-fetch-site": "cross-site" },
  }), env);
  assert.equal(read.status, 200);
});

test("file listing accepts folder names that contain percent signs", async () => {
  const { default: worker } = await loadBuildModule("src/index.js");
  const { env: config, namespace } = await makeRuntime();
  const bucket = new MemoryR2();
  await bucket.put("100%/", "");
  await bucket.put("100%/inside.txt", "a");
  await bucket.put("a%41/", "");
  await bucket.put("a%41/literal.txt", "b");
  await bucket.put("aA/decoded.txt", "c");
  const env = { ...config, FILES: bucket, USAGE_STORE: namespace };
  const list = async (path) => worker.fetch(new Request(
    `https://example.test/api/files?path=${encodeURIComponent(path)}`, { headers: authHeaders() },
  ), env);

  const percent = await list("100%");
  assert.equal(percent.status, 200);
  assert.deepEqual((await percent.json()).entries.map((entry) => entry.key), ["100%/inside.txt"]);
  const literal = await list("a%41");
  assert.equal(literal.status, 200);
  assert.deepEqual((await literal.json()).entries.map((entry) => entry.key), ["a%41/literal.txt"]);
});
