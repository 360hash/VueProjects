// src/api/article.js

const API_URL = "https://360blog.exploresea360.workers.dev";

// 获取全部文章
export async function getArticles() {
  const response = await fetch(`${API_URL}/api/articles`);

  const data = await response.json();

  console.log("GET /api/articles:", response.status, data);

  if (!response.ok) {
    throw new Error(data.message || "获取文章失败");
  }

  return data;
}

// 获取单篇文章
export async function getArticleById(id) {
  if (!id) {
    throw new Error("文章 ID 为空");
  }

  const url = `${API_URL}/api/articles/${encodeURIComponent(id)}`;

  console.log("请求单篇文章:", url);

  const response = await fetch(url);

  const data = await response.json();

  console.log("GET /api/articles/:id:", response.status, data);

  if (!response.ok) {
    throw new Error(
      data.message || `文章请求失败，HTTP ${response.status}`
    );
  }

  return data;
}

// 发布文章
export async function publishArticle(articleData) {
  const token = localStorage.getItem("admin_token");

  const response = await fetch(`${API_URL}/api/articles`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(articleData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "发布失败");
  }

  return data;
}

// 修改文章
export async function updateArticle(id, articleData) {
  const token = localStorage.getItem("admin_token");

  const response = await fetch(
    `${API_URL}/api/articles/${id}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(articleData),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "修改失败");
  }

  return data;
}

// 删除文章
export async function deleteArticle(id) {
  const token = localStorage.getItem("admin_token");

  const response = await fetch(
    `${API_URL}/api/articles/${id}`,
    {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "删除失败");
  }

  return data;
}

// 管理员登录
export async function login(username, password) {
  const response = await fetch(`${API_URL}/api/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username,
      password,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "登录失败");
  }

  return data;
}