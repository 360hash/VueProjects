// src/api/store.js —— 存储空间接口
// 后端是生产 Worker 360blog（https://blog360.ccwu.cc）
// 所有操作都要带管理员 Token，Token 过期会被后端拒绝

const API_URL = "https://blog360.ccwu.cc";

function authHeaders() {
  const token = localStorage.getItem("admin_token");
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
  };
}

// 后端返回 401 = Token 过期或无效，清掉本地 Token 并回登录页
function handleUnauthorized(response) {
  if (response.status !== 401) return;
  localStorage.removeItem("admin_token");
  if (window.location.pathname !== "/login") {
    window.location.href = "/login?expired=1";
  }
}

// 获取全部记录（按 id 倒序）
export async function getStoredTexts() {
  const response = await fetch(`${API_URL}/api/stored?format=json`, {
    headers: authHeaders(),
  });

  const data = await response.json();

  handleUnauthorized(response);

  if (!response.ok) {
    throw new Error(data.message || "获取记录失败");
  }

  return data;
}

// 删除一条
export async function deleteStoredText(id) {
  const response = await fetch(
    `${API_URL}/api/stored/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
      headers: authHeaders(),
    }
  );

  const data = await response.json();

  handleUnauthorized(response);

  if (!response.ok) {
    throw new Error(data.message || "删除失败");
  }

  return data;
}

// 清空全部
export async function clearStoredTexts() {
  const response = await fetch(`${API_URL}/api/stored`, {
    method: "DELETE",
    headers: authHeaders(),
  });

  const data = await response.json();

  handleUnauthorized(response);

  if (!response.ok) {
    throw new Error(data.message || "清空失败");
  }

  return data;
}
