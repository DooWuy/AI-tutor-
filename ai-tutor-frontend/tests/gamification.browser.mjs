import { createRequire } from "node:module";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import assert from "node:assert/strict";
const { chromium } = createRequire(import.meta.url)(
  process.env.PLAYWRIGHT_MODULE_PATH || "playwright",
);
const base = process.env.TASK5_BASE_URL || "http://localhost:13000";
const dir = resolve("../ai-tutor-service/build/issue5-task5-runtime");
const fixtures = JSON.parse(
  readFileSync(resolve(dir, "fixtures.json"), "utf8"),
);
mkdirSync(dir, { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true });
const evidence = [],
  errors = [];
async function check(name, work) {
  await work();
  evidence.push({ name, status: "PASS" });
  console.log("PASS", name);
}
async function session(account, viewport = { width: 1440, height: 1000 }) {
  const context = await browser.newContext({
    viewport,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(`${base}/login`);
  await page.locator("#identifier").fill(account.username);
  await page.locator("#password").fill(account.password);
  await page.locator("form button[type=submit]").click();
  await page.waitForURL("**/student/dashboard");
  await page.locator(".home-progress-link").waitFor();
  return { page, context };
}
async function progress(page) {
  await page.goto(`${base}/student/progress`);
  await page.locator(".learning-metrics").waitFor();
  await page.locator(".learning-me").waitFor();
}
async function noOverflow(page) {
  const result = await page.evaluate(() => ({
    width: innerWidth,
    scroll: document.documentElement.scrollWidth,
  }));
  assert.ok(result.scroll <= result.width + 1, JSON.stringify(result));
}
async function submitUI(page, account, correct = true) {
  await page.goto(`${base}/student/quiz-attempt/${account.quizId}`);
  await Promise.race([
    page.getByRole("radio").first().waitFor(),
    page.locator(".quiz-summary").waitFor(),
  ]);
  if (await page.locator(".quiz-summary").count()) {
    await page.getByRole("button", { name: "Làm lại đề", exact: true }).click();
  }
  await page.getByRole("radio").nth(correct ? 0 : 1).check();
  await page
    .getByRole("button", { name: "Nộp bài", exact: true })
    .first()
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Xác nhận nộp", exact: true })
    .click();
  await page.waitForURL("**/student/quiz-results/*");
  await page.locator(".quiz-summary").waitFor();
}
try {
  const { page, context } = await session(fixtures.student);
  await check("Home is a study launchpad; detailed analytics are reserved for Progress", async () => {
    assert.equal(await page.locator('.home-hero').count(), 1);
    assert.equal(await page.locator('.learning-metrics,.learning-activity,.learning-leaderboard').count(), 0);
    await noOverflow(page);
    await page.screenshot({path:resolve(dir,'home-redesign-desktop.png'),fullPage:true});
    for (const width of [390,768,1024,1440]) {
      await page.setViewportSize({width,height:844}); await noOverflow(page);
    }
    await page.setViewportSize({width:390,height:844});
    await page.screenshot({path:resolve(dir,'home-redesign-mobile.png'),fullPage:true});
    await page.setViewportSize({width:1440,height:1000});
  });
  await check("Desktop real API and me outside global top20", async () => {
    await progress(page);
    const data = await (
      await context.request.get(`${base}/api/v1/students/me/progress`)
    ).json();
    assert.equal(data.data.summary.totalXp, 90);
    assert.match(
      await page.locator(".learning-metric").first().innerText(),
      /90/,
    );
    assert.equal(await page.locator(".learning-ranking-list li").count(), 20);
    assert.ok(
      Number(
        (await page.locator(".learning-me .learning-rank").innerText()).replace(
          /\D/g,
          "",
        ),
      ) > 20,
    );
    await noOverflow(page);
    await page.screenshot({
      path: resolve(dir, "progress-desktop.png"),
      fullPage: true,
    });
  });
  await check(
    "Class scope, keyboard data table, server level progress",
    async () => {
      await page
        .getByRole("button", { name: "Lớp của tôi", exact: true })
        .click();
      assert.equal(await page.locator(".learning-ranking-list li").count(), 4);
      await page.locator("summary").focus();
      await page.keyboard.press("Enter");
      await page.getByRole("table").waitFor({ state: "visible" });
      assert.equal(
        await page.getByRole("table").locator("tbody tr").count(),
        7,
      );
      assert.equal(await page.locator("progress").getAttribute("value"), "90");
    },
  );
  await check(
    "Real submit refreshes Header, Profile, Dashboard and Progress across level boundary",
    async () => {
      await submitUI(page, fixtures.student);
      assert.match(
        await page.locator(".quiz-notice").innerText(),
        /nhận 10 XP/,
      );
      await page
        .getByRole("link", { name: "Xem tiến độ và thứ hạng mới nhất" })
        .click();
      await page.locator(".learning-metrics").waitFor();
      assert.match(
        await page.locator(".learning-metric").nth(0).innerText(),
        /100/,
      );
      assert.match(
        await page.locator(".learning-metric").nth(1).innerText(),
        /2/,
      );
      assert.match(
        await page.locator(".learning-metric").nth(2).innerText(),
        /1/,
      );
      assert.equal(await page.locator("progress").getAttribute("value"), "0");
      assert.match(await page.locator("header").first().innerText(), /100 XP/);
      await page
        .getByRole("button", { name: "Lớp của tôi", exact: true })
        .click();
      assert.match(
        await page.locator(".learning-me .learning-rank").innerText(),
        /3/,
      );
      await page.goto(`${base}/student/profile`);
      await page.getByText("100 XP", { exact: true }).last().waitFor();
      assert.match(await page.locator("main").innerText(), /Level 2/);
      await page.goto(`${base}/student/dashboard`);
      await page.locator(".home-progress-link").waitFor();
      assert.match(
        await page.locator(".home-progress-link").innerText(),
        /100/,
      );
      await page.screenshot({
        path: resolve(dir, "dashboard-desktop.png"),
        fullPage: true,
      });
    },
  );
  await check("Retake clearly explains no additional XP", async () => {
    await submitUI(page, fixtures.student);
    assert.match(
      await page.locator(".quiz-notice").innerText(),
      /làm lại không nhận thêm XP/,
    );
    const r = await (
      await context.request.get(`${base}/api/v1/students/me/progress`)
    ).json();
    assert.equal(r.data.summary.totalXp, 100);
    assert.equal(r.data.summary.currentStreak, 1);
  });
  await check(
    "390x844 navigation, refresh, dark theme and responsive widths",
    async () => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(`${base}/student/dashboard`);
      await page.getByRole("button", { name: "Mở menu điều hướng" }).click();
      await page
        .getByRole("link", { name: "Tiến độ", exact: true })
        .last()
        .click();
      await page.locator(".learning-metrics").waitFor();
      await noOverflow(page);
    await page.locator('.learning-main-grid').scrollIntoViewIfNeeded();
    await page.locator('.learning-me').waitFor();
    await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({
        path: resolve(dir, "progress-mobile.png"),
        fullPage: true,
      });
      await page.reload();
      await page.locator(".learning-metrics").waitFor();
      await noOverflow(page);
      await page.evaluate(() => localStorage.setItem("ai-tutor.theme", "dark"));
      await page.reload();
      await page.locator(".learning-metrics").waitFor();
      assert.equal(
        await page.locator("html").getAttribute("data-theme"),
        "dark",
      );
      await noOverflow(page);
      await page.screenshot({
        path: resolve(dir, "progress-mobile-dark.png"),
        fullPage: true,
      });
      for (const width of [375, 768, 1024, 1280, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        await noOverflow(page);
      }
    },
  );
  await check(
    "Loading, failure and retry do not display fabricated balances (fault injection)",
    async () => {
      let mode = "loading",
        release;
      const gate = new Promise((r) => {
        release = r;
      });
      const pattern = "**/api/v1/students/me/progress";
      await page.route(pattern, async (route) => {
        if (mode === "loading") await gate;
        if (mode === "error")
          await route.fulfill({
            status: 500,
            contentType: "application/json",
            body: JSON.stringify({
              success: false,
              message: "Máy chủ tạm gián đoạn",
            }),
          });
        else await route.continue();
      });
      await page.goto(`${base}/student/progress`);
      await page
        .getByText("Đang tải tiến độ học tập…", { exact: true })
        .waitFor();
      assert.equal(await page.locator(".learning-metrics").count(), 0);
      mode = "error";
      release();
      await page
        .getByText("Chưa tải được tiến độ học tập", { exact: true })
        .waitFor();
      assert.equal(await page.locator(".learning-metrics").count(), 0);
      await page.screenshot({
        path: resolve(dir, "progress-error.png"),
        fullPage: true,
      });
      mode = "success";
      await page
        .getByRole("button", { name: "Thử lại", exact: true })
        .first()
        .click();
      await page.locator(".learning-metrics").waitFor();
      await page.unroute(pattern);
    },
  );
  await check('A second student sees the committed rank and public allowlist', async () => {
    const peer = await session(fixtures.peer);
    await progress(peer.page);
    await peer.page.getByRole('button', { name: 'Lớp của tôi', exact: true }).click();
    assert.match(await peer.page.locator('.learning-me .learning-rank').innerText(), /4/);
    const data = await (await peer.context.request.get(`${base}/api/v1/leaderboard?scope=CLASS`)).json();
    assert.deepEqual(Object.keys(data.data.me).sort(), ['rank','displayName','avatarUrl','totalXp','currentLevel'].sort());
    assert.equal(data.data.me.totalXp, 95);
    await peer.context.close();
  });
  await check('Logout/account switch rejects an old in-flight response', async () => {
    let hold = true, captured, release;
    const capturedPromise = new Promise(resolve => { captured = resolve; });
    const gate = new Promise(resolve => { release = resolve; });
    const pattern = '**/api/v1/students/me/progress';
    await page.route(pattern, async route => {
      if (!hold) { await route.continue(); return; }
      hold = false;
      const response = await route.fetch();
      captured(); await gate;
      await route.fulfill({ response }).catch(() => {}); // logout deliberately aborts this request
    });
    await page.getByRole('button', {name:'Làm mới',exact:true}).click();
    await capturedPromise;
    const menu = page.getByRole('button',{name:'Mở menu tài khoản'});
    await menu.focus(); await page.keyboard.press('Enter');
    await page.getByRole('button',{name:/Đăng xuất/}).click();
    await page.waitForURL('**/login');
    await page.locator('#identifier').fill(fixtures.empty.username);
    await page.locator('#password').fill(fixtures.empty.password);
    await page.locator('form button[type=submit]').click();
    await page.waitForURL('**/student/dashboard');
    await page.locator('.home-progress-link').waitFor();
    release();
    await page.unroute(pattern);
    assert.match(await page.locator('.home-progress-link').innerText(), /\b0\b/);
    assert.doesNotMatch(await page.locator('.home-progress-link').innerText(), /100/);
  });
  const empty = await session(fixtures.empty, { width: 390, height: 844 });
  await check(
    "Real empty activity and unassigned class, isolated account state",
    async () => {
      await progress(empty.page);
      assert.match(
        await empty.page.locator(".learning-metric").first().innerText(),
        /0/,
      );
      await empty.page
        .getByText("Hành trình đang chờ bạn", { exact: true })
        .waitFor();
      await empty.page
        .getByRole("button", { name: "Lớp của tôi", exact: true })
        .click();
      await empty.page
        .getByRole("heading", { name: "Bạn chưa được xếp lớp" })
        .waitFor();
      await noOverflow(empty.page);
      await empty.page.screenshot({
        path: resolve(dir, "progress-empty-no-class.png"),
        fullPage: true,
      });
      await empty.page
        .getByRole("button", { name: "Xem toàn hệ thống" })
        .click();
      await empty.page.locator(".learning-me").waitFor();
    },
  );
  await check('A zero-score first completion shows the actual no-XP reason', async () => {
    await submitUI(empty.page, fixtures.empty, false);
    assert.match(await empty.page.locator('.quiz-notice').innerText(), /chưa có câu đúng/);
    const data = await (await empty.context.request.get(`${base}/api/v1/students/me/progress`)).json();
    assert.equal(data.data.summary.totalXp, 0);
    assert.equal(data.data.summary.currentStreak, 1);
    await progress(empty.page);
  });
  await check(
    "Expired authorization presents re-login guidance (fault injection)",
    async () => {
      await empty.page.route("**/api/v1/students/me/progress", (route) =>
        route.fulfill({
          status: 401,
          contentType: "application/json",
          body: JSON.stringify({ success: false }),
        }),
      );
      await empty.page
        .getByRole("button", { name: "Làm mới", exact: true })
        .click();
      await empty.page
        .getByText("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.", {
          exact: true,
        })
        .first()
        .waitFor();
    },
  );
  await check("Real partial-cap and cap-reached submit messages", async () => {
    for (const [name, pattern] of [
      ["partial", /nhận 5 XP.*500\/500/],
      ["capped", /đạt hạn mức 500 XP/],
    ]) {
      const c = await session(fixtures[name]);
      await submitUI(c.page, fixtures[name]);
      assert.match(await c.page.locator(".quiz-notice").innerText(), pattern);
      await c.context.close();
    }
  });
  assert.deepEqual(errors, []);
  evidence.push({ name: "No uncaught browser exceptions", status: "PASS" });
  writeFileSync(
    resolve(dir, "browser-results.json"),
    JSON.stringify({ base, evidence, errors }, null, 2),
  );
  console.log(JSON.stringify({ passed: evidence.length, errors }));
} catch (error) {
  for (const c of browser.contexts())
    for (const p of c.pages()) {
      await p
        .screenshot({ path: resolve(dir, "failure.png"), fullPage: true })
        .catch(() => {});
      console.log((await p.locator("body").innerText()).slice(0, 2000));
    }
  writeFileSync(
    resolve(dir, "browser-results.json"),
    JSON.stringify({ base, evidence, error: String(error), errors }, null, 2),
  );
  throw error;
} finally {
  await browser.close();
}
