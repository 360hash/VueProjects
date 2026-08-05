const API_URL = "https://360blog.exploresea360.workers.dev";

// 获取所有文章
export async function getArticles() {
  const response = await fetch(`${API_URL}/api/articles`);
  return await response.json();
}

// 发布文章
export async function publishArticle(articleData) {
  const response = await fetch(`${API_URL}/api/articles`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(articleData),
  });

  return await response.json();
}