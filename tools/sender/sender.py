# -*- coding: utf-8 -*-
"""
存储空间发送器
==============
把一段文本（直接打字，或从 txt 文件读入）以「裸文本」POST 到网站存储空间。
服务端会记录：来源 IP、服务器时间、这段文本。

用法
----
1. 双击 exe → 选一个 txt 文件（或直接在文本框里打字）→ 点「发送」
2. 把 txt 文件直接拖到 exe 图标上 → 自动读入 → 点「发送」
3. 命令行：StorageSender.exe --send <文件路径>   （直接发送，不开界面）

环境变量（可选，用于测试）
--------------------------
STORAGE_API_URL    改接口地址，默认 https://blog360.ccwu.cc/api/store
STORAGE_WRITE_KEY  写入密钥，只有服务端设置了 STORE_WRITE_KEY 时才需要
"""

import json
import os
import sys
import threading
import urllib.error
import urllib.request
import tkinter as tk
from tkinter import filedialog, messagebox, scrolledtext

DEFAULT_API_URL = "https://blog360.ccwu.cc/api/store"
API_URL = os.environ.get("STORAGE_API_URL", DEFAULT_API_URL)
WRITE_KEY = os.environ.get("STORAGE_WRITE_KEY", "")
MAX_BYTES = 80 * 1024


def read_text_file(path):
    """按 utf-8 / gbk / utf-16 依次尝试解码，尽量原样读出。"""
    with open(path, "rb") as f:
        data = f.read()
    for enc in ("utf-8-sig", "utf-8", "gbk", "utf-16"):
        try:
            return data.decode(enc)
        except (UnicodeDecodeError, LookupError):
            continue
    return data.decode("utf-8", errors="replace")


def send_text(text):
    """发送裸文本，返回 (是否成功, 提示信息)。"""
    payload = text.encode("utf-8")
    if len(payload) > MAX_BYTES:
        return False, f"内容 {len(payload)} 字节，超过上限 {MAX_BYTES} 字节"

    headers = {"Content-Type": "text/plain; charset=utf-8"}
    if WRITE_KEY:
        headers["X-Store-Key"] = WRITE_KEY

    req = urllib.request.Request(
        API_URL, data=payload, headers=headers, method="POST"
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            body = resp.read().decode("utf-8", errors="replace")
            try:
                data = json.loads(body)
            except json.JSONDecodeError:
                return True, body[:200]
            if data.get("success"):
                return True, "发送成功  #%s  IP %s  %s" % (
                    data.get("id"), data.get("ip"), data.get("time")
                )
            return False, data.get("message") or "发送失败"
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        try:
            msg = json.loads(body).get("message") or body
        except json.JSONDecodeError:
            msg = body or ("HTTP %s" % e.code)
        return False, "HTTP %s: %s" % (e.code, msg)
    except urllib.error.URLError as e:
        return False, "网络错误：%s" % (e.reason,)
    except Exception as e:  # noqa: BLE001
        return False, "出错了：%s" % (e,)


class App(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("存储空间发送器")
        self.geometry("680x520")
        self.minsize(520, 400)

        top = tk.Frame(self)
        top.pack(fill="x", padx=12, pady=(12, 6))
        tk.Label(top, text="接口：").pack(side="left")
        tk.Label(
            top, text=API_URL, fg="#2e9e6e", anchor="w"
        ).pack(side="left", fill="x", expand=True)

        self.text = scrolledtext.ScrolledText(
            self, wrap="word", font=("Consolas", 11), undo=True
        )
        self.text.pack(fill="both", expand=True, padx=12, pady=6)

        bar = tk.Frame(self)
        bar.pack(fill="x", padx=12, pady=(0, 6))
        tk.Button(bar, text="选择文件…", command=self.pick_file).pack(side="left")
        tk.Button(bar, text="发送", command=self.on_send).pack(side="left", padx=8)
        tk.Button(bar, text="清空", command=lambda: self.text.delete("1.0", "end")).pack(
            side="left"
        )

        self.status = tk.Label(self, text="就绪", anchor="w", fg="#555")
        self.status.pack(fill="x", padx=12, pady=(0, 10))

    def pick_file(self):
        path = filedialog.askopenfilename(
            title="选择要发送的文本文件",
            filetypes=[
                ("文本文件", "*.txt *.md *.log *.json *.csv *.py *.js"),
                ("所有文件", "*.*"),
            ],
        )
        if path:
            self.load_file(path)

    def load_file(self, path):
        try:
            content = read_text_file(path)
        except OSError as e:
            messagebox.showerror("读取失败", str(e))
            return
        self.text.delete("1.0", "end")
        self.text.insert("1.0", content)
        self.set_status("已读入 %s（%d 字节）" % (os.path.basename(path), len(content.encode("utf-8"))))

    def set_status(self, text, color="#555"):
        self.status.config(text=text, fg=color)

    def on_send(self):
        content = self.text.get("1.0", "end").rstrip("\n")
        if not content.strip():
            messagebox.showwarning("没有内容", "先输入文字，或选择一个文件。")
            return
        self.set_status("发送中…", "#2e9e6e")

        def work():
            ok, msg = send_text(content)
            self.after(0, lambda: self.set_status(msg, "#2e9e6e" if ok else "#d9534f"))

        threading.Thread(target=work, daemon=True).start()


def _safe_print(s):
    """按控制台自己的编码输出，避免中文变成乱码。"""
    enc = getattr(sys.stdout, "encoding", None) or "utf-8"
    print(s.encode(enc, errors="replace").decode(enc, errors="replace"))


def headless(path):
    """命令行模式：直接发送文件，不开界面。"""
    try:
        content = read_text_file(path)
    except OSError as e:
        _safe_print("读取失败: %s" % e)
        return 1
    ok, msg = send_text(content)
    _safe_print(("OK   " if ok else "FAIL ") + msg)
    return 0 if ok else 1


def main():
    if len(sys.argv) >= 3 and sys.argv[1] == "--send":
        return headless(sys.argv[2])

    app = App()

    # 把 txt 拖到 exe 上：命令行第一个参数
    if len(sys.argv) >= 2 and os.path.isfile(sys.argv[1]):
        app.after(200, lambda: app.load_file(sys.argv[1]))

    app.mainloop()
    return 0


if __name__ == "__main__":
    sys.exit(main())
