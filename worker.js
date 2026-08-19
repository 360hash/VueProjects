export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    // =========================
    // CORS
    // =========================
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: corsHeaders,
      });
    }

    try {

      // =====================================
      // 获取全部文章
      // GET /api/articles
      // =====================================
      if (
        url.pathname === "/api/articles" &&
        request.method === "GET"
      ) {

        const { results } = await env.DATA.prepare(
          `
          SELECT
            id,
            title,
            content,
            cover_image,
            views,
            created_at
          FROM articles
          ORDER BY created_at DESC
          `
        ).all();

        return Response.json(results, {
          headers: corsHeaders,
        });

      }

      // =====================================
      // 获取单篇文章
      // GET /api/articles/1
      // =====================================
      if (
        url.pathname.startsWith("/api/articles/") &&
        request.method === "GET"
      ) {

        const id = url.pathname.split("/").pop();

        const article = await env.DATA.prepare(
          `
          SELECT *
          FROM articles
          WHERE id = ?
          `
        )
          .bind(id)
          .first();

        if (!article) {

          return Response.json(
            {
              success: false,
              message: "文章不存在"
            },
            {
              status: 404,
              headers: corsHeaders
            }
          );

        }

        return Response.json(article, {
          headers: corsHeaders,
        });

      }

      // =====================================
      // 发布文章
      // POST /api/articles
      // =====================================
      if (
        url.pathname === "/api/articles" &&
        request.method === "POST"
      ) {

        const body = await request.json();

        await env.DATA.prepare(
          `
          INSERT INTO articles
          (
              title,
              content,
              cover_image
          )
          VALUES
          (
              ?,
              ?,
              ?
          )
          `
        )
          .bind(
            body.title,
            body.content,
            body.cover_image || null
          )
          .run();

        return Response.json(
          {
            success: true,
            message: "发布成功"
          },
          {
            headers: corsHeaders
          }
        );

      }

      // =====================================
      // 修改文章
      // PUT /api/articles/1
      // =====================================
      if (
        url.pathname.startsWith("/api/articles/") &&
        request.method === "PUT"
      ) {

        const id = url.pathname.split("/").pop();

        const body = await request.json();

        await env.DATA.prepare(
          `
          UPDATE articles
          SET
              title = ?,
              content = ?,
              cover_image = ?
          WHERE id = ?
          `
        )
          .bind(
            body.title,
            body.content,
            body.cover_image || null,
            id
          )
          .run();

        return Response.json(
          {
            success: true,
            message: "修改成功"
          },
          {
            headers: corsHeaders
          }
        );

      }

      // =====================================
      // 删除文章
      // DELETE /api/articles/1
      // =====================================
      if (
        url.pathname.startsWith("/api/articles/") &&
        request.method === "DELETE"
      ) {

        const id = url.pathname.split("/").pop();

        await env.DATA.prepare(
          `
          DELETE FROM articles
          WHERE id = ?
          `
        )
          .bind(id)
          .run();

        return Response.json(
          {
            success: true,
            message: "删除成功"
          },
          {
            headers: corsHeaders
          }
        );

      }

      // =====================================
      // 404
      // =====================================
      return Response.json(
        {
          success: false,
          message: "API不存在"
        },
        {
          status: 404,
          headers: corsHeaders
        }
      );

    } catch (error) {

      return Response.json(
        {
          success: false,
          message: error.message
        },
        {
          status: 500,
          headers: corsHeaders
        }
      );

    }

  },
};