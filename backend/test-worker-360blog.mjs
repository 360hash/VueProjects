// 生产后端 Worker 的本地测试：node backend/test-worker-360blog.mjs
// 直接加载仓库根目录的 worker.js，用假 D1 + 真的 Request/Response 跑
import crypto from "node:crypto";
import worker from "../worker.js";

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "s3cret-pw";
const ADMIN_TOKEN_SECRET = "test-sign-secret";
// 仅测试用的假密钥（真正的 STORE_VIEW_KEY 在 Dashboard 的 Secrets 里）
const VIEW_KEY = "test-view-key-not-a-real-secret";

const DAY = 24 * 60 * 60 * 1000;
const BJ = 8 * 60 * 60 * 1000;

// ---------- 假 D1 ----------
function makeEnv(extra = {}) {
  const articles = [];
  const stored = [];
  let lastId = 0;
  let lastStoredId = 0;

  const DATA = {
    prepare(sql) {
      const s = sql.replace(/\s+/g, " ");
      return {
        async run() {
          // 不带 WHERE 的清空操作
          if (s.includes("DELETE FROM stored_texts")) {
            const n = stored.length;
            stored.length = 0;
            return { success: true, meta: { changes: n } };
          }
          throw new Error("unexpected SQL (no bind): " + s);
        },
        bind(...args) {
          return {
            async run() {
              if (s.includes("INSERT INTO articles")) {
                articles.push({
                  id: articles.length + 1,
                  title: args[0],
                  content: args[1],
                  cover_image: args[2],
                  views: 0,
                  created_at: new Date().toISOString(),
                });
                return { success: true, meta: { changes: 1 } };
              }
              if (s.includes("INSERT INTO stored_texts")) {
                lastStoredId += 1;
                stored.push({
                  id: lastStoredId,
                  ip: args[0],
                  content: args[1],
                  created_at: args[2],
                });
                return { success: true, meta: { changes: 1, last_row_id: lastStoredId } };
              }
              if (s.includes("SET views = views + 1")) {
                const a = articles.find((x) => x.id === Number(args[0]));
                if (a) a.views += 1;
                return { success: true, meta: { changes: a ? 1 : 0 } };
              }
              if (s.includes("UPDATE articles SET title")) {
                const a = articles.find((x) => x.id === Number(args[3]));
                if (!a) return { success: true, meta: { changes: 0 } };
                a.title = args[0];
                a.content = args[1];
                a.cover_image = args[2];
                return { success: true, meta: { changes: 1 } };
              }
              if (s.includes("DELETE FROM stored_texts WHERE id")) {
                const i = stored.findIndex((x) => x.id === Number(args[0]));
                if (i === -1) return { success: true, meta: { changes: 0 } };
                stored.splice(i, 1);
                return { success: true, meta: { changes: 1 } };
              }
              if (s.includes("DELETE FROM stored_texts")) {
                const n = stored.length;
                stored.length = 0;
                return { success: true, meta: { changes: n } };
              }
              if (s.includes("DELETE FROM articles")) {
                const i = articles.findIndex((x) => x.id === Number(args[0]));
                if (i === -1) return { success: true, meta: { changes: 0 } };
                articles.splice(i, 1);
                return { success: true, meta: { changes: 1 } };
              }
              throw new Error("unexpected SQL: " + s);
            },
            async first() {
              if (s.includes("FROM articles WHERE id")) {
                return (
                  articles.find((x) => x.id === Number(args[0])) || null
                );
              }
              throw new Error("unexpected SQL: " + s);
            },
            async all() {
              if (s.includes("FROM stored_texts")) {
                return { results: [...stored].sort((a, b) => b.id - a.id) };
              }
              if (s.includes("FROM articles")) {
                return { results: [...articles] };
              }
              throw new Error("unexpected SQL: " + s);
            },
          };
        },
        async all() {
          if (s.includes("FROM stored_texts")) {
            return { results: [...stored].sort((a, b) => b.id - a.id) };
          }
          if (s.includes("FROM articles")) {
            return { results: [...articles] };
          }
          throw new Error("unexpected SQL: " + s);
        },
        async first() {
          if (s.includes("FROM articles WHERE id")) {
            return articles.find((x) => x.id === Number(args[0])) || null;
          }
          throw new Error("unexpected SQL: " + s);
        },
      };
    },
  };

  return {
    env: {
      DATA,
      ADMIN_USERNAME,
      ADMIN_PASSWORD,
      ADMIN_TOKEN_SECRET,
      STORE_VIEW_KEY: VIEW_KEY,
      ...extra,
    },
    articles,
    stored,
  };
}

const call = (env, path, opts = {}) =>
  worker.fetch(
    new Request("https://blog360.ccwu.cc" + path, opts),
    env
  );

const b64 = (obj) => Buffer.from(JSON.stringify(obj)).toString("base64");
const sign = (payload) =>
  crypto
    .createHmac("sha256", ADMIN_TOKEN_SECRET)
    .update(payload)
    .digest("hex");

let pass = 0;
let fail = 0;
function check(name, cond, extra = "") {
  if (cond) {
    pass++;
    console.log(`  ok   ${name}`);
  } else {
    fail++;
    console.log(`  FAIL ${name} ${extra}`);
  }
}

const authJson = (obj) => ({
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(obj),
});

console.log("\n[1] 登录");
{
  const { env } = makeEnv();

  const bad = await call(env, "/api/login", authJson({ username: "admin", password: "nope" }));
  check("错误密码 401", bad.status === 401, `got ${bad.status}`);

  const ok = await call(env, "/api/login", authJson({ username: "admin", password: ADMIN_PASSWORD }));
  const data = await ok.json();
  check("正确密码 200", ok.status === 200, `got ${ok.status}`);
  check("返回 token", typeof data.token === "string" && data.token.includes("."));

  const payload = JSON.parse(Buffer.from(data.token.split(".")[0], "base64").toString());
  const expect = (Math.floor((Date.now() + BJ) / DAY) + 1) * DAY - BJ - 1;
  check("expiresAt = 北京时间当天 23:59:59.999", payload.expiresAt === expect, `${payload.expiresAt} vs ${expect}`);
  check("payload 里有 username", payload.username === ADMIN_USERNAME);

  // 签名能对上
  check("签名正确", data.token.split(".")[1] === sign(data.token.split(".")[0]));
}

console.log("\n[2] 伪造 / 过期 Token 一律拒绝");
{
  const { env, articles } = makeEnv();

  const noAuth = await call(env, "/api/articles", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "x", content: "y" }),
  });
  check("没有 Token -> 401", noAuth.status === 401, `got ${noAuth.status}`);

  // 旧版那种裸 base64 Token（知道用户名就能造）
  const legacy = b64({ username: ADMIN_USERNAME, createdAt: Date.now() });
  const r1 = await call(env, "/api/articles", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${legacy}` },
    body: JSON.stringify({ title: "x", content: "y" }),
  });
  check("旧版裸 base64 Token -> 401", r1.status === 401, `got ${r1.status}`);

  // 签名错的
  const badSig = b64({ username: ADMIN_USERNAME, createdAt: Date.now(), expiresAt: Date.now() + 1000 }) + "." + "deadbeef";
  const r2 = await call(env, "/api/articles", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${badSig}` },
    body: JSON.stringify({ title: "x", content: "y" }),
  });
  check("错误签名 -> 401", r2.status === 401, `got ${r2.status}`);

  // 签名对但已过期
  const expiredPayload = b64({ username: ADMIN_USERNAME, createdAt: Date.now() - DAY, expiresAt: Date.now() - 1000 });
  const expired = expiredPayload + "." + sign(expiredPayload);
  const r3 = await call(env, "/api/articles", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${expired}` },
    body: JSON.stringify({ title: "x", content: "y" }),
  });
  check("已过期 Token -> 401", r3.status === 401, `got ${r3.status}`);

  // 改 payload 但签名不变（把 username 换成 hacker，签名沿用原来的）
  const goodSig = sign(b64({ username: ADMIN_USERNAME, createdAt: 1111111111111, expiresAt: Date.now() + 100000 }));
  const tamperedPayload = b64({ username: "hacker", createdAt: 1111111111111, expiresAt: Date.now() + 100000 });
  const tampered = tamperedPayload + "." + goodSig;
  const r4 = await call(env, "/api/articles", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${tampered}` },
    body: JSON.stringify({ title: "x", content: "y" }),
  });
  check("篡改内容 -> 401", r4.status === 401, `got ${r4.status}`);

  // 签名对、未过期 -> 放行
  const goodPayload = b64({ username: ADMIN_USERNAME, createdAt: Date.now(), expiresAt: Date.now() + 100000 });
  const good = goodPayload + "." + sign(goodPayload);
  const r5 = await call(env, "/api/articles", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${good}` },
    body: JSON.stringify({ title: "标题", content: "正文" }),
  });
  check("有效 Token -> 200", r5.status === 200, `got ${r5.status}`);
  check("文章真的写进去了", articles.length === 1);

  // 老 Token（没有 expiresAt）按 createdAt 当天末尾算
  const oldToday = b64({ username: ADMIN_USERNAME, createdAt: Date.now() });
  const r6 = await call(env, "/api/articles", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${oldToday}.${sign(oldToday)}` },
    body: JSON.stringify({ title: "标题", content: "正文" }),
  });
  check("老 Token（今天登录）-> 200", r6.status === 200, `got ${r6.status}`);

  const oldYesterday = b64({ username: ADMIN_USERNAME, createdAt: Date.now() - 2 * DAY });
  const r7 = await call(env, "/api/articles", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${oldYesterday}.${sign(oldYesterday)}` },
    body: JSON.stringify({ title: "标题", content: "正文" }),
  });
  check("老 Token（前天登录）-> 401", r7.status === 401, `got ${r7.status}`);
}

console.log("\n[3] 存储空间：上传");
{
  const { env, stored } = makeEnv();

  const r = await call(env, "/api/store", {
    method: "POST",
    headers: { "Content-Type": "text/plain; charset=utf-8", "CF-Connecting-IP": "113.87.24.106" },
    body: "今天的第一条内容",
  });
  const d = await r.json();
  check("上传 200", r.status === 200, `got ${r.status}`);
  check("返回 id=1", d.id === 1, `got ${d.id}`);
  check("记录了来源 IP", stored[0].ip === "113.87.24.106");
  check("内容原样保存", stored[0].content === "今天的第一条内容");
  check("北京时间字段", /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(d.time), d.time);

  const r2 = await call(env, "/api/store", {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: "第二条",
  });
  check("第二次发送 id=2", (await r2.json()).id === 2);
  check("两次发送两行", stored.length === 2);

  const empty = await call(env, "/api/store", { method: "POST", body: "  " });
  check("空白内容 400", empty.status === 400, `got ${empty.status}`);

  const big = await call(env, "/api/store", { method: "POST", body: "a".repeat(90 * 1024) });
  check("超过 80KB 413", big.status === 413, `got ${big.status}`);
}

console.log("\n[4] 存储空间：查看");
{
  const { env } = makeEnv();
  await call(env, "/api/store", {
    method: "POST",
    headers: { "Content-Type": "text/plain", "CF-Connecting-IP": "8.8.8.8" },
    body: "查看用的一条",
  });

  const none = await call(env, "/api/stored");
  check("无 token 无 key -> 403", none.status === 403, `got ${none.status}`);

  const badKey = await call(env, "/api/stored?key=wrong");
  check("错误 key -> 403", badKey.status === 403, `got ${badKey.status}`);

  const ok = await call(env, `/api/stored?key=${VIEW_KEY}`);
  const text = await ok.text();
  check("正确 key -> 200", ok.status === 200, `got ${ok.status}`);
  check("返回 text/plain", (ok.headers.get("Content-Type") || "").includes("text/plain"));
  check("输出含 IP", text.includes("8.8.8.8"));
  check("输出含内容", text.includes("查看用的一条"));

  // 管理员 Token 也能看
  const payload = b64({ username: ADMIN_USERNAME, createdAt: Date.now(), expiresAt: Date.now() + 100000 });
  const token = payload + "." + sign(payload);
  const withToken = await call(env, "/api/stored", { headers: { Authorization: `Bearer ${token}` } });
  check("管理员 Token -> 200", withToken.status === 200, `got ${withToken.status}`);

  const json = await call(env, `/api/stored?key=${VIEW_KEY}&format=json`);
  const jd = await json.json();
  check("format=json 返回 items", Array.isArray(jd.items) && jd.items.length === 1);
}

console.log("\n[5] 存储空间：可选写入密钥");
{
  const { env, stored } = makeEnv({ STORE_WRITE_KEY: "wkey" });
  const denied = await call(env, "/api/store", { method: "POST", body: "x" });
  check("没带 X-Store-Key -> 403", denied.status === 403, `got ${denied.status}`);
  const allowed = await call(env, "/api/store", {
    method: "POST",
    headers: { "X-Store-Key": "wkey" },
    body: "x",
  });
  check("带对 X-Store-Key -> 200", allowed.status === 200, `got ${allowed.status}`);
  check("确实落库", stored.length === 1);
}

console.log("\n[6] 其它");
{
  const { env } = makeEnv();
  const nf = await call(env, "/api/nope");
  const body = await nf.json();
  check("未知 API 404", nf.status === 404, `got ${nf.status}`);
  check("404 带 path/method", body.path === "/api/nope" && body.method === "GET");

  const opt = await call(env, "/api/articles", { method: "OPTIONS" });
  check("OPTIONS 预检 200", opt.status === 200, `got ${opt.status}`);
  const allow = opt.headers.get("Access-Control-Allow-Headers") || "";
  check("CORS 允许 Authorization", allow.includes("Authorization"), allow);
}

console.log("\n[7] 存储空间：删除");
{
  const { env, stored } = makeEnv();
  await call(env, "/api/store", { method: "POST", body: "第一条" });
  await call(env, "/api/store", { method: "POST", body: "第二条" });

  const noAuth = await call(env, "/api/stored/1", { method: "DELETE" });
  check("无 token 无 key 删单条 -> 403", noAuth.status === 403, `got ${noAuth.status}`);

  const badId = await call(env, "/api/stored/abc", {
    method: "DELETE",
    headers: { "X-Store-Key": VIEW_KEY },
  });
  check("非法 ID -> 400", badId.status === 400, `got ${badId.status}`);

  const del = await call(env, "/api/stored/1", {
    method: "DELETE",
    headers: { "X-Store-Key": VIEW_KEY },
  });
  check("带密钥删单条 -> 200", del.status === 200, `got ${del.status}`);
  check("确实删掉了", stored.length === 1 && stored[0].content === "第二条");

  const missing = await call(env, "/api/stored/999", {
    method: "DELETE",
    headers: { "X-Store-Key": VIEW_KEY },
  });
  check("删不存在的 -> 404", missing.status === 404, `got ${missing.status}`);

  // 清空全部：密钥不行，必须管理员 Token
  const clearByKey = await call(env, "/api/stored?key=" + VIEW_KEY, { method: "DELETE" });
  check("用密钥清空全部 -> 403", clearByKey.status === 403, `got ${clearByKey.status}`);
  check("没被清掉", stored.length === 1);

  const payload = b64({ username: ADMIN_USERNAME, createdAt: Date.now(), expiresAt: Date.now() + 100000 });
  const token = payload + "." + sign(payload);
  const clear = await call(env, "/api/stored", {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  check("管理员 Token 清空全部 -> 200", clear.status === 200, `got ${clear.status}`);
  check("全部清空", stored.length === 0);
}

console.log("\n[8] 没配 STORE_VIEW_KEY 时（fail closed）");
{
  const { env } = makeEnv({ STORE_VIEW_KEY: "" });
  await call(env, "/api/store", { method: "POST", body: "一条" });

  const withKey = await call(env, `/api/stored?key=${VIEW_KEY}`, {
    headers: { "X-Store-Key": VIEW_KEY },
  });
  check("没配密钥时用 key 访问 -> 403", withKey.status === 403, `got ${withKey.status}`);

  const payload = b64({ username: ADMIN_USERNAME, createdAt: Date.now(), expiresAt: Date.now() + 100000 });
  const token = payload + "." + sign(payload);
  const withToken = await call(env, "/api/stored", {
    headers: { Authorization: `Bearer ${token}` },
  });
  check("没配密钥时管理员 Token 仍可用 -> 200", withToken.status === 200, `got ${withToken.status}`);
}

console.log(`\n结果：${pass} 通过，${fail} 失败\n`);
process.exit(fail === 0 ? 0 : 1);
