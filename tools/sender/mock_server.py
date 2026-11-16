# -*- coding: utf-8 -*-
"""
本地假服务器 —— 只用来测试发送器，不参与正式环境。
行为和生产 Worker 一致：POST /api/store 收裸文本，GET /api/stored 返回累计内容。

    python tools/sender/mock_server.py 8765
"""

import json
import sys
from http.server import BaseHTTPRequestHandler, HTTPServer

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
RECORDS = []


class Handler(BaseHTTPRequestHandler):
    def do_POST(self):
        length = int(self.headers.get("Content-Length") or 0)
        body = self.rfile.read(length).decode("utf-8", errors="replace")
        if self.path != "/api/store":
            self._json(404, {"success": False, "message": "not found"})
            return
        if not body.strip():
            self._json(400, {"success": False, "message": "内容为空"})
            return
        RECORDS.append(
            {
                "id": len(RECORDS) + 1,
                "ip": self.headers.get("X-Mock-IP", "127.0.0.1"),
                "content": body,
            }
        )
        self._json(
            200,
            {
                "success": True,
                "id": RECORDS[-1]["id"],
                "ip": RECORDS[-1]["ip"],
                "time": "2026-01-01 00:00:00",
                "bytes": len(body.encode("utf-8")),
            },
        )

    def do_GET(self):
        if self.path.startswith("/api/stored"):
            text = "\n\n".join(
                "#%s  IP: %s\n%s" % (r["id"], r["ip"], r["content"]) for r in RECORDS
            )
            payload = text.encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "text/plain; charset=utf-8")
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)
            return
        self._json(404, {"success": False, "message": "not found"})

    def _json(self, code, obj):
        payload = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def log_message(self, *args):
        pass


if __name__ == "__main__":
    print("mock server on http://127.0.0.1:%d" % PORT)
    HTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
