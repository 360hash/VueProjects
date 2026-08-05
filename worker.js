export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 获取文章
    if (url.pathname === "/api/articles" && request.method === "GET") {
      const { results } = await env.DATA
        .prepare("SELECT * FROM articles ORDER BY created_at DESC")
        .all();

      return Response.json(results);
    }

    // 发布文章
    if (url.pathname === "/api/articles" && request.method === "POST") {
      const body = await request.json();

      await env.DATA.prepare(`
        INSERT INTO articles(title, cover_image, content, created_at)
        VALUES (?, ?, ?, datetime('now'))
      `)
      .bind(
        body.title,
        body.cover_image || "",
        body.content
      )
      .run();

      return Response.json({
        success: true
      });
    }

    // 删除文章
    if (
      url.pathname.startsWith("/api/articles/") &&
      request.method === "DELETE"
    ) {
      const id = url.pathname.split("/").pop();

      await env.DATA.prepare(
        "DELETE FROM articles WHERE id=?"
      )
      .bind(id)
      .run();

      return Response.json({
        success: true
      });
    }

    return env.ASSETS.fetch(request);
  }
}