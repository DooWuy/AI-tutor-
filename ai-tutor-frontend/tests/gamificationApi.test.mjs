import { readFileSync } from "node:fs";
import { createContext, runInContext } from "node:vm";
import assert from "node:assert/strict";
import { test } from "node:test";
import ts from "typescript";

function moduleAt(path, globals = {}) {
  const source = readFileSync(new URL(path, import.meta.url), "utf8").replace(
    /import\.meta\.env\.\w+/g,
    "undefined",
  );
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const context = createContext({ exports: {}, AbortSignal, ...globals });
  runInContext(compiled, context);
  return context.exports;
}
const response = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

test("progress and scoped leaderboard use cookie auth, bounded query and unwrap API response", async () => {
  const calls = [];
  const { gamificationApi } = moduleAt("../src/services/gamificationApi.ts", {
    fetch: async (url, init) => {
      calls.push({ url, init });
      return response({ success: true, data: { marker: 7 } });
    },
  });
  assert.equal((await gamificationApi.progress()).marker, 7);
  await gamificationApi.leaderboard("CLASS");
  assert.equal(
    calls[0].url,
    "http://localhost:8088/api/v1/students/me/progress",
  );
  assert.equal(
    calls[1].url,
    "http://localhost:8088/api/v1/leaderboard?scope=CLASS&limit=20",
  );
  assert.ok(
    calls.every(
      (call) =>
        call.init.credentials === "include" &&
        call.init.cache === "no-store" &&
        call.init.signal,
    ),
  );
});
test("class-required code survives error parsing for the dedicated empty state", async () => {
  const { gamificationApi } = moduleAt("../src/services/gamificationApi.ts", {
    fetch: async () =>
      response(
        {
          success: false,
          message: "Chưa xếp lớp",
          error: { code: "STUDENT_CLASS_REQUIRED" },
        },
        400,
      ),
  });
  await assert.rejects(
    gamificationApi.leaderboard("CLASS"),
    (error) => error.status === 400 && error.code === "STUDENT_CLASS_REQUIRED",
  );
});
test("unauthorized, forbidden and non-json failures never become fake empty data", async () => {
  for (const status of [401, 403, 503]) {
    const { gamificationApi } = moduleAt("../src/services/gamificationApi.ts", {
      fetch: async () => new Response("", { status }),
    });
    await assert.rejects(
      gamificationApi.progress(),
      (error) => error.status === status && error.message.length > 0,
    );
  }
});
test("failed logical envelope is rejected even with HTTP 200", async () => {
  const { gamificationApi } = moduleAt("../src/services/gamificationApi.ts", {
    fetch: async () => response({ success: false, message: "Không thể tải" }),
  });
  await assert.rejects(gamificationApi.progress(), /Không thể tải/);
});
test("aborted transport does not produce a successful stale payload", async () => {
  const { gamificationApi } = moduleAt("../src/services/gamificationApi.ts", {
    fetch: async (_url, init) => {
      init.signal.throwIfAborted();
      return response({ success: true, data: {} });
    },
  });
  const abort = new AbortController();
  abort.abort();
  await assert.rejects(gamificationApi.progress(abort.signal));
});
test("each XP status explains the real reason, including legacy unknown", () => {
  const { xpAwardMessage } = moduleAt(
    "../src/pages/Student/Progress/xpAwardMessage.ts",
  );
  assert.match(
    xpAwardMessage("ALREADY_REWARDED", 0, 20, 500),
    /làm lại không nhận thêm XP/,
  );
  assert.match(
    xpAwardMessage("DAILY_CAP_REACHED", 0, 500, 500),
    /hạn mức 500 XP/,
  );
  assert.match(
    xpAwardMessage("PARTIALLY_CAPPED", 5, 500, 500),
    /5 XP.*500\/500/,
  );
  assert.match(xpAwardMessage("NO_XP_EARNED", 0, 0, 500), /chưa có câu đúng/);
  assert.match(xpAwardMessage("AWARDED", 10, 10, 500), /nhận 10 XP/);
  assert.match(
    xpAwardMessage("LEGACY_UNKNOWN", 10, null, null),
    /chưa có thông tin/,
  );
});
