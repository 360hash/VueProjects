// =====================================================
// 生产后端 Worker（Cloudflare Workers → 360blog）
// 自定义域名：https://blog360.ccwu.cc
//
// 相比旧版修了两处：
//   1) 登录 Token 现在带过期时间（北京时间当天 23:59:59.999）+ HMAC 签名，
//      旧版 Token 是裸 base64，任何人知道用户名就能伪造、且永不过期。
//   2) 新增存储空间：POST /api/store（发裸文本）、GET /api/stored（查看）
//
// 环境变量（Dashboard → Settings → Variables and Secrets）：
//   ADMIN_USERNAME      管理员用户名（Secret）
//   ADMIN_PASSWORD      管理员密码（Secret）
//   ADMIN_TOKEN_SECRET  Token 签名密钥（Secret，可选；没配就用 ADMIN_PASSWORD 兜底）
//   CLOUDINARY_*        图床（/api/upload 用）
//   STORE_VIEW_KEY      存储空间查看密钥（Secret，可选；没配就用下面写死的）
//   STORE_WRITE_KEY     存储空间写入密钥（Secret，可选；设了之后写入需要带 X-Store-Key）
// =====================================================

const DAY = 24 * 60 * 60 * 1000;
const BEIJING_OFFSET = 8 * 60 * 60 * 1000;

// 存储空间查看密钥：只从环境变量读，绝不写死在代码里
// （这份代码在 GitHub 公开仓库里，写死等于公开）
// 没配 STORE_VIEW_KEY 时，查看/删除只能用管理员 Token
const STORE_VIEW_KEY = "";

// 单条内容上限 80KB（D1 单条 SQL 语句上限 100KB，留余量）
const STORE_MAX_BYTES = 80 * 1024;

// 北京时间当天 23:59:59.999 的毫秒时间戳
function endOfBeijingDay(ts) {
  const t = ts === undefined ? Date.now() : ts;
  return (Math.floor((t + BEIJING_OFFSET) / DAY) + 1) * DAY - BEIJING_OFFSET - 1;
}

// ISO 时间 -> 北京时间字符串
function beijingTime(iso) {
  const t = new Date(iso).getTime();
  if (isNaN(t)) return String(iso);
  return new Date(t + BEIJING_OFFSET).toISOString().replace("T", " ").slice(0, 19);
}

// 签名用的密钥
function signSecret(env) {
  return env.ADMIN_TOKEN_SECRET || env.ADMIN_PASSWORD || "";
}

// HMAC-SHA256 签名
async function signPayload(payload, env) {
  const secret = signSecret(env);
  if (!secret) return "";
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload)
  );
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// 恒定时间比较，避免逐字符提前返回
function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // =========================
    // CORS
    // =========================
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Store-Key",
    };

    // =========================
    // CORS 预检
    // =========================
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: corsHeaders,
      });
    }

    try {
      // =====================================================
      // 0. 管理员登录
      // POST /api/login
      // =====================================================
      if (url.pathname === "/api/login" && request.method === "POST") {
        const body = await request.json();

        const username = body.username || "";
        const password = body.password || "";

        const adminUsername = env.ADMIN_USERNAME;
        const adminPassword = env.ADMIN_PASSWORD;

        if (!adminUsername || !adminPassword) {
          return Response.json(
            {
              success: false,
              message: "Worker 尚未配置管理员账号或密码",
            },
            {
              status: 500,
              headers: corsHeaders,
            }
          );
        }

        if (username !== adminUsername || password !== adminPassword) {
          return Response.json(
            {
              success: false,
              message: "用户名或密码错误",
            },
            {
              status: 401,
              headers: corsHeaders,
            }
          );
        }

        // Token 里带上过期时间：北京时间当天 23:59:59.999
        const now = Date.now();
        const expiresAt = endOfBeijingDay(now);

        const payload = btoa(
          JSON.stringify({
            username: username,
            createdAt: now,
            expiresAt: expiresAt,
          })
        );

        const signature = await signPayload(payload, env);

        // 没有可用密钥时直接拒绝，而不是发一个"谁都能伪造"的 Token
        if (!signature) {
          return Response.json(
            {
              success: false,
              message: "Worker 尚未配置 ADMIN_TOKEN_SECRET",
            },
            {
              status: 500,
              headers: corsHeaders,
            }
          );
        }

        return Response.json(
          {
            success: true,
            message: "登录成功",
            token: payload + "." + signature,
            expiresAt: expiresAt,
          },
          {
            headers: corsHeaders,
          }
        );
      }

      // =====================================================
      // Token 验证
      // 校验：签名 + 用户名 + 过期时间
      // =====================================================
      const requireAuth = async () => {
        const authHeader = request.headers.get("Authorization");

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return false;
        }

        const token = authHeader.substring(7);
        if (!token) return false;

        // 格式：base64(payload).signature
        const dot = token.lastIndexOf(".");
        if (dot <= 0) return false;

        const payload = token.slice(0, dot);
        const signature = token.slice(dot + 1);

        // 1) 验签
        const expected = await signPayload(payload, env);
        if (!expected || !safeEqual(signature, expected)) {
          return false;
        }

        // 2) 解内容
        let decoded;
        try {
          decoded = JSON.parse(atob(payload));
        } catch (error) {
          return false;
        }

        // 3) 用户名必须一致
        if (!decoded.username || decoded.username !== env.ADMIN_USERNAME) {
          return false;
        }

        // 4) 过期时间（老 Token 没有 expiresAt 时按 createdAt 推当天末尾）
        let expiresAt = decoded.expiresAt;
        if (typeof expiresAt !== "number") {
          expiresAt =
            typeof decoded.createdAt === "number"
              ? endOfBeijingDay(decoded.createdAt)
              : 0;
        }
        if (Date.now() > expiresAt) {
          return false;
        }

        return true;
      };

      // =====================================================
      // 图片上传
      // POST /api/upload
      //
      // 需要登录
      // =====================================================
      if (url.pathname === "/api/upload" && request.method === "POST") {
        if (!(await requireAuth())) {
          return Response.json(
            {
              success: false,
              message: "未登录或登录失效",
            },
            {
              status: 401,
              headers: corsHeaders,
            }
          );
        }

        try {
          const formData = await request.formData();
          const file = formData.get("file");

          if (!file) {
            return Response.json(
              {
                success: false,
                message: "没有上传文件",
              },
              {
                status: 400,
                headers: corsHeaders,
              }
            );
          }

          if (!file.type.startsWith("image/")) {
            return Response.json(
              {
                success: false,
                message: "只能上传图片",
              },
              {
                status: 400,
                headers: corsHeaders,
              }
            );
          }

          if (file.size > 5 * 1024 * 1024) {
            return Response.json(
              {
                success: false,
                message: "图片不能超过5MB",
              },
              {
                status: 400,
                headers: corsHeaders,
              }
            );
          }

          const buffer = await file.arrayBuffer();
          const base64 = btoa(
            String.fromCharCode(...new Uint8Array(buffer))
          );

          const timestamp = Math.floor(Date.now() / 1000);

          // Cloudinary 签名：timestamp=xxx + api_secret
          const signText = `timestamp=${timestamp}${env.CLOUDINARY_API_SECRET}`;

          const hash = await crypto.subtle.digest(
            "SHA-1",
            new TextEncoder().encode(signText)
          );

          const signature = Array.from(new Uint8Array(hash))
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");

          const uploadData = new FormData();
          uploadData.append("file", `data:${file.type};base64,${base64}`);
          uploadData.append("timestamp", timestamp);
          uploadData.append("api_key", env.CLOUDINARY_API_KEY);
          uploadData.append("signature", signature);

          const cloudinaryRes = await fetch(
            `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/image/upload`,
            {
              method: "POST",
              body: uploadData,
            }
          );

          const cloudinaryData = await cloudinaryRes.json();

          if (!cloudinaryData.secure_url) {
            throw new Error("Cloudinary上传失败");
          }

          return Response.json(
            {
              success: true,
              url: cloudinaryData.secure_url,
            },
            {
              headers: corsHeaders,
            }
          );
        } catch (error) {
          return Response.json(
            {
              success: false,
              message: error.message,
            },
            {
              status: 500,
              headers: corsHeaders,
            }
          );
        }
      }

      // =====================================================
      // 1. 获取文章列表
      // GET /api/articles
      //
      // 不需要登录
      // =====================================================
      if (url.pathname === "/api/articles" && request.method === "GET") {
        const { results } = await env.DATA.prepare(`
            SELECT
              id,
              title,
              content,
              cover_image,
              views,
              created_at
            FROM articles
            ORDER BY created_at DESC
          `).all();

        return Response.json(results, {
          headers: corsHeaders,
        });
      }

      // =====================================================
      // 2. 发布文章
      // POST /api/articles
      //
      // 需要登录
      // =====================================================
      if (url.pathname === "/api/articles" && request.method === "POST") {
        if (!(await requireAuth())) {
          return Response.json(
            {
              success: false,
              message: "未登录或登录已失效",
            },
            {
              status: 401,
              headers: corsHeaders,
            }
          );
        }

        const body = await request.json();

        const title = body.title?.trim();
        const content = body.content ?? "";
        const coverImage = body.cover_image?.trim() || null;

        if (!title) {
          return Response.json(
            {
              success: false,
              message: "文章标题不能为空",
            },
            {
              status: 400,
              headers: corsHeaders,
            }
          );
        }

        if (!content.trim()) {
          return Response.json(
            {
              success: false,
              message: "文章正文不能为空",
            },
            {
              status: 400,
              headers: corsHeaders,
            }
          );
        }

        await env.DATA.prepare(`
            INSERT INTO articles (
              title,
              content,
              cover_image
            )
            VALUES (?, ?, ?)
          `)
          .bind(title, content, coverImage)
          .run();

        return Response.json(
          {
            success: true,
            message: "发布成功",
          },
          {
            headers: corsHeaders,
          }
        );
      }

      // =====================================================
      // 3. 获取单篇文章
      // GET /api/articles/:id
      //
      // 不需要登录
      // =====================================================
      if (
        url.pathname.startsWith("/api/articles/") &&
        request.method === "GET"
      ) {
        const id = url.pathname.split("/").pop();

        if (!id || !/^\d+$/.test(id)) {
          return Response.json(
            {
              success: false,
              message: "无效的文章 ID",
            },
            {
              status: 400,
              headers: corsHeaders,
            }
          );
        }

        const article = await env.DATA.prepare(`
            SELECT
              id,
              title,
              content,
              cover_image,
              views,
              created_at
            FROM articles
            WHERE id = ?
          `)
          .bind(id)
          .first();

        if (!article) {
          return Response.json(
            {
              success: false,
              message: "文章不存在",
            },
            {
              status: 404,
              headers: corsHeaders,
            }
          );
        }

        // 阅读量 +1
        await env.DATA.prepare(`
            UPDATE articles
            SET views = views + 1
            WHERE id = ?
          `)
          .bind(id)
          .run();

        return Response.json(article, {
          headers: corsHeaders,
        });
      }

      // =====================================================
      // 4. 修改文章
      // PUT /api/articles/:id
      //
      // 需要登录
      // =====================================================
      if (
        url.pathname.startsWith("/api/articles/") &&
        request.method === "PUT"
      ) {
        if (!(await requireAuth())) {
          return Response.json(
            {
              success: false,
              message: "未登录或登录已失效",
            },
            {
              status: 401,
              headers: corsHeaders,
            }
          );
        }

        const id = url.pathname.split("/").pop();

        if (!id || !/^\d+$/.test(id)) {
          return Response.json(
            {
              success: false,
              message: "无效的文章 ID",
            },
            {
              status: 400,
              headers: corsHeaders,
            }
          );
        }

        const body = await request.json();

        const title = body.title?.trim();
        const content = body.content ?? "";
        const coverImage = body.cover_image?.trim() || null;

        if (!title) {
          return Response.json(
            {
              success: false,
              message: "文章标题不能为空",
            },
            {
              status: 400,
              headers: corsHeaders,
            }
          );
        }

        if (!content.trim()) {
          return Response.json(
            {
              success: false,
              message: "文章正文不能为空",
            },
            {
              status: 400,
              headers: corsHeaders,
            }
          );
        }

        const result = await env.DATA.prepare(`
            UPDATE articles
            SET
              title = ?,
              content = ?,
              cover_image = ?
            WHERE id = ?
          `)
          .bind(title, content, coverImage, id)
          .run();

        if (!result.meta.changes) {
          return Response.json(
            {
              success: false,
              message: "文章不存在",
            },
            {
              status: 404,
              headers: corsHeaders,
            }
          );
        }

        return Response.json(
          {
            success: true,
            message: "修改成功",
          },
          {
            headers: corsHeaders,
          }
        );
      }

      // =====================================================
      // 5. 删除文章
      // DELETE /api/articles/:id
      //
      // 需要登录
      // =====================================================
      if (
        url.pathname.startsWith("/api/articles/") &&
        request.method === "DELETE"
      ) {
        if (!(await requireAuth())) {
          return Response.json(
            {
              success: false,
              message: "未登录或登录已失效",
            },
            {
              status: 401,
              headers: corsHeaders,
            }
          );
        }

        const id = url.pathname.split("/").pop();

        if (!id || !/^\d+$/.test(id)) {
          return Response.json(
            {
              success: false,
              message: "无效的文章 ID",
            },
            {
              status: 400,
              headers: corsHeaders,
            }
          );
        }

        const result = await env.DATA.prepare(`
            DELETE FROM articles
            WHERE id = ?
          `)
          .bind(id)
          .run();

        if (!result.meta.changes) {
          return Response.json(
            {
              success: false,
              message: "文章不存在",
            },
            {
              status: 404,
              headers: corsHeaders,
            }
          );
        }

        return Response.json(
          {
            success: true,
            message: "删除成功",
          },
          {
            headers: corsHeaders,
          }
        );
      }

      // =====================================================
      // 6. 存储空间：上传裸文本
      // POST /api/store
      //
      // body 就是文本本身，不需要登录
      // （若设置了环境变量 STORE_WRITE_KEY，则需要带 X-Store-Key 头）
      // =====================================================
      if (url.pathname === "/api/store" && request.method === "POST") {
        if (
          env.STORE_WRITE_KEY &&
          request.headers.get("X-Store-Key") !== env.STORE_WRITE_KEY
        ) {
          return Response.json(
            {
              success: false,
              message: "写入密钥错误",
            },
            {
              status: 403,
              headers: corsHeaders,
            }
          );
        }

        const content = await request.text();
        const bytes = new TextEncoder().encode(content).length;

        if (!content.trim()) {
          return Response.json(
            {
              success: false,
              message: "内容为空",
            },
            {
              status: 400,
              headers: corsHeaders,
            }
          );
        }

        if (bytes > STORE_MAX_BYTES) {
          return Response.json(
            {
              success: false,
              message: `内容 ${bytes} 字节，超过 ${STORE_MAX_BYTES} 字节上限`,
            },
            {
              status: 413,
              headers: corsHeaders,
            }
          );
        }

        // 来源 IP：Cloudflare 注入的请求头
        const ip = request.headers.get("CF-Connecting-IP") || "unknown";
        const created_at = new Date().toISOString();

        const result = await env.DATA.prepare(`
            INSERT INTO stored_texts (
              ip,
              content,
              created_at
            )
            VALUES (?, ?, ?)
          `)
          .bind(ip, content, created_at)
          .run();

        return Response.json(
          {
            success: true,
            id: result.meta.last_row_id,
            ip: ip,
            time: beijingTime(created_at),
            bytes: bytes,
          },
          {
            headers: corsHeaders,
          }
        );
      }

      // =====================================================
      // 7. 存储空间：查看记录
      // GET /api/stored
      //
      // 两种方式任选其一：
      //   a) 带管理员 Token：Authorization: Bearer <token>
      //   b) 带查看密钥：?key=<STORE_VIEW_KEY>
      // =====================================================
      if (url.pathname === "/api/stored" && request.method === "GET") {
        const viewKey = env.STORE_VIEW_KEY || STORE_VIEW_KEY;
        const key =
          url.searchParams.get("key") || request.headers.get("X-Store-Key");
        const hasAdminToken = await requireAuth();

        if (!hasAdminToken) {
          // 没配 STORE_VIEW_KEY 就只认管理员 Token，不给"随便一个 key 放行"的机会
          if (!viewKey) {
            return Response.json(
              {
                success: false,
                message: "未配置 STORE_VIEW_KEY，请用管理员 Token 访问",
              },
              {
                status: 403,
                headers: corsHeaders,
              }
            );
          }

          if (!key || key !== viewKey) {
            return Response.json(
              {
                success: false,
                message: "未登录或密钥错误",
              },
              {
                status: 403,
                headers: corsHeaders,
              }
            );
          }
        }

        const { results } = await env.DATA.prepare(`
            SELECT
              id,
              ip,
              content,
              created_at
            FROM stored_texts
            ORDER BY id DESC
          `).all();

        if (url.searchParams.get("format") === "json") {
          return Response.json(
            {
              success: true,
              count: results.length,
              items: results,
            },
            {
              headers: corsHeaders,
            }
          );
        }

        const body = results.length
          ? results
              .map(
                (r) =>
                  `#${r.id}  ${beijingTime(r.created_at)}  IP: ${r.ip}\n${r.content}\n${"-".repeat(48)}`
              )
              .join("\n\n")
          : "（还没有任何记录）";

        return new Response(body, {
          headers: {
            ...corsHeaders,
            "Content-Type": "text/plain; charset=utf-8",
          },
        });
      }

      // =====================================================
      // 8. 存储空间：删除记录
      // DELETE /api/stored/:id   删掉一条
      // DELETE /api/stored       清空全部（只能用管理员 Token）
      //
      // 删除单条：管理员 Token 或查看密钥都行
      // =====================================================
      if (
        url.pathname.startsWith("/api/stored/") &&
        request.method === "DELETE"
      ) {
        const viewKey = env.STORE_VIEW_KEY || STORE_VIEW_KEY;
        const key =
          url.searchParams.get("key") || request.headers.get("X-Store-Key");
        const hasAdminToken = await requireAuth();

        if (!hasAdminToken) {
          if (!viewKey) {
            return Response.json(
              {
                success: false,
                message: "未配置 STORE_VIEW_KEY，请用管理员 Token 访问",
              },
              {
                status: 403,
                headers: corsHeaders,
              }
            );
          }

          if (!key || key !== viewKey) {
            return Response.json(
              {
                success: false,
              message: "未登录或密钥错误",
              },
              {
                status: 403,
                headers: corsHeaders,
              }
            );
          }
        }

        const id = url.pathname.split("/").pop();

        if (!id || !/^\d+$/.test(id)) {
          return Response.json(
            {
              success: false,
              message: "无效的记录 ID",
            },
            {
              status: 400,
              headers: corsHeaders,
            }
          );
        }

        const result = await env.DATA.prepare(`
            DELETE FROM stored_texts
            WHERE id = ?
          `)
          .bind(id)
          .run();

        if (!result.meta.changes) {
          return Response.json(
            {
              success: false,
              message: "记录不存在",
            },
            {
              status: 404,
              headers: corsHeaders,
            }
          );
        }

        return Response.json(
          {
            success: true,
            message: "删除成功",
            id: Number(id),
          },
          {
            headers: corsHeaders,
          }
        );
      }

      // 清空全部：必须管理员 Token
      if (url.pathname === "/api/stored" && request.method === "DELETE") {
        if (!(await requireAuth())) {
          return Response.json(
            {
              success: false,
              message: "未登录或密钥错误",
            },
            {
              status: 403,
              headers: corsHeaders,
            }
          );
        }

        const result = await env.DATA.prepare(`
            DELETE FROM stored_texts
          `).run();

        return Response.json(
          {
            success: true,
            message: "已清空",
            deleted: result.meta.changes,
          },
          {
            headers: corsHeaders,
          }
        );
      }

      // =====================================================
      // 9. 未知 API
      // =====================================================
      return Response.json(
        {
          success: false,
          message: "API 不存在",
          path: url.pathname,
          method: request.method,
        },
        {
          status: 404,
          headers: corsHeaders,
        }
      );
    } catch (error) {
      console.error("Worker Error:", error);

      return Response.json(
        {
          success: false,
          message: error?.message || "服务器内部错误",
        },
        {
          status: 500,
          headers: corsHeaders,
        }
      );
    }
  },
};
