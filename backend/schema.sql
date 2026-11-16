-- 存储空间（storage inbox）
-- 每一次发送 = 一行，自增 id 用来区分不同的发送
-- content 就是客户端发来的裸文本原文
CREATE TABLE IF NOT EXISTS stored_texts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ip TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL
);
