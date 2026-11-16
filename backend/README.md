# 存储空间 + 登录鉴权

这一版把**存储空间**（exe 发裸文本 → 网站记录 IP/时间/内容）接进了博客，
同时修掉了旧版登录鉴权的两个洞。

## 文件都是干什么的

| 路径 | 作用 |
|---|---|
| `worker.js`（仓库根目录） | **后端 API 的唯一源码**。`vueprojects`（前端 worker）和 `360blog`（后端 worker）跑的是同一份代码 |
| `backend/schema.sql` | D1 建表语句（存储空间表） |
| `backend/test-worker-360blog.mjs` | 本地测试：`node backend/test-worker-360blog.mjs`（50 项，不用连网） |
| `src/api/store.js` | 前端调用存储空间接口 |
| `src/views/Storage.vue` | 存储空间页面（列表 + 删除），路由 `/Storage` |
| `tools/sender/sender.py` | exe 源码（tkinter 界面，PyInstaller 打包） |
| `tools/sender/dist/存储空间发送器.exe` | 打包好的 exe，双击即用 |

## ⚠️ 仓库里不放任何密钥

`worker.js` 会出现在 GitHub 仓库里，所以**所有密钥都必须放在 Dashboard 的
Variables and Secrets 里，代码里只读 `env.XXX`**：

| 变量 | 类型 | 不配会怎样 |
|---|---|---|
| `ADMIN_USERNAME` | Secret | 登录报"尚未配置管理员账号或密码" |
| `ADMIN_PASSWORD` | Secret | 同上 |
| `ADMIN_TOKEN_SECRET` | Secret（没有就退回 `ADMIN_PASSWORD`） | 登录报"尚未配置 ADMIN_TOKEN_SECRET" |
| `CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET` | Secret | 图床上传失败 |
| `STORE_VIEW_KEY` | Secret | 存储空间只能靠管理员 Token 访问（不会失效，只是不给"带 key"这条路） |
| `STORE_WRITE_KEY` | Secret（可选） | 不配 = 上传接口公开可写；配了之后写入必须带 `X-Store-Key` |

代码里写死的只有 `STORE_VIEW_KEY = ""`（空串）这种占位符，**没有任何真实密钥**。

## 部署步骤

### 1. D1 建表（一次性）

Dashboard → D1 SQL Database → **blog** → Console，执行 `backend/schema.sql`：

```sql
CREATE TABLE IF NOT EXISTS stored_texts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ip TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL
);
```

### 2. 后端 worker `360blog`（必须做）

Dashboard → Workers → **360blog** → 编辑器 → **全选删除原代码** → 粘贴仓库里的
`worker.js` 全文 → Deploy。

顺便在 **Settings → Variables and Secrets** 再加两个 Secret：

| 名称 | 值 | 说明 |
|---|---|---|
| `ADMIN_TOKEN_SECRET` | 自己想的随机长串 | Token 签名密钥。不加的话会用 `ADMIN_PASSWORD` 兜底 |
| `STORE_VIEW_KEY` | 自己想的随机长串 | 存储空间查看密钥（可选；不加就只能登录后看） |

### 3. 前端 worker `vueprojects`（必须做，否则有个公开漏洞）

旧版 `vueprojects` 里的 `/api/articles` 写接口**完全没有鉴权**，而且和 `360blog`
连的是同一个 D1 —— 等于任何人都能通过 `vueprojects.exploresea360.workers.dev`
发/改/删你的文章。现在 `worker.js` 已经换成带鉴权的版本，部署即可：

```bash
npx wrangler login     # 这台机器的 wrangler 登录已过期，需要重新登录
npm run build
npx wrangler deploy
```

### 4. 前端页面

`npm run build` 已经包含新的 `/Storage` 页面（需要登录才能进，路由守卫会自动跳登录页）。

## 接口一览

| 方法 | 路径 | 鉴权 | 说明 |
|---|---|---|---|
| POST | `/api/login` | — | 登录，返回 `base64(payload).HMAC签名`，payload 里有 `expiresAt` |
| GET | `/api/articles` | — | 文章列表 |
| POST | `/api/articles` | 管理员 Token | 发布文章 |
| GET | `/api/articles/:id` | — | 文章详情（阅读量 +1） |
| PUT/DELETE | `/api/articles/:id` | 管理员 Token | 改/删文章 |
| POST | `/api/upload` | 管理员 Token | 图床上传（Cloudinary） |
| POST | `/api/store` | 无（可选 `X-Store-Key`） | **发裸文本**，body 就是内容；记录 IP / 时间 / 内容，每次发送一行 |
| GET | `/api/stored` | 管理员 Token 或 `?key=` | 查看记录（默认纯文本，`&format=json` 返回 JSON） |
| DELETE | `/api/stored/:id` | 管理员 Token 或 `?key=` | 删掉一条 |
| DELETE | `/api/stored` | **仅管理员 Token** | 清空全部 |

带 key 访问的格式（key = 你在 Dashboard 里自己设的 `STORE_VIEW_KEY`）：

```
https://blog360.ccwu.cc/api/stored?key=<你的 STORE_VIEW_KEY>
```

不设 `STORE_VIEW_KEY` 也不影响使用 —— 直接登录后打开 `/Storage` 页面看就行。

## exe 用法

`tools/sender/dist/存储空间发送器.exe`

- 双击 → 「选择文件…」选 txt，或直接在文本框里打字 → 「发送」
- 也可以把 txt 文件**拖到 exe 图标上**，自动读入后再点发送
- 命令行模式：`存储空间发送器.exe --send <文件路径>`（不开界面，直接发）

重新打包：

```bash
cd tools/sender
python -m PyInstaller --onefile --windowed --name "存储空间发送器" sender.py
```

本地测试（不碰线上）：

```bash
python tools/sender/mock_server.py 8765          # 终端 A
STORAGE_API_URL=http://127.0.0.1:8765/api/store python tools/sender/sender.py --send 某个.txt   # 终端 B
```

## 这次修掉的两个洞

1. **Token 永不过期 + 可以伪造**
   旧版 Token 是 `btoa(JSON.stringify({username, createdAt}))` —— 没有签名，
   `requireAuth` 只比对用户名，**且完全不看时间**。等于：任何人知道管理员用户名
   （`admin` 这种一猜就中）就能自己造一个 Token 登录，登录一次永久有效。
   现在 Token = `base64(payload).HMAC-SHA256(payload, ADMIN_TOKEN_SECRET)`，
   服务端验签 + 校验 `expiresAt`（北京时间当天 23:59:59.999）。

2. **`vueprojects` worker 的文章接口无鉴权**
   见上面部署步骤 3。

前端配套：路由守卫现在认这种 `base64(payload).签名` 格式的 Token（原来只认 JWT，
所以永远判定"未过期"）；后端返回 401 时前端会清掉本地 Token 并跳回登录页。
