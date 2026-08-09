#!/usr/bin/env python3
"""通过 Contents API (PUT /contents) 逐文件上传，支持断点续传。"""
import os, sys, base64, json, time
import urllib.request, urllib.error
from concurrent.futures import ThreadPoolExecutor, as_completed

TOKEN = os.environ["GH_TOKEN"]
OWNER = "manyIwant"
REPO = "GD"
API = f"https://api.github.com/repos/{OWNER}/{REPO}"
PROJECT = "/workspace/app-diuy8vo6h9fl"
LOG = "/workspace/app-diuy8vo6h9fl/contents_progress.log"

HEADERS = {
    "Authorization": f"token {TOKEN}",
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "deploy-script",
}

def log(msg):
    line = f"[{time.strftime('%H:%M:%S')}] {msg}"
    print(line, flush=True)
    with open(LOG, "a") as f:
        f.write(line + "\n")

def req(method, url, body=None, retries=8):
    data = json.dumps(body).encode() if body is not None else None
    for attempt in range(retries):
        try:
            r = urllib.request.Request(url, data=data, headers=HEADERS, method=method)
            with urllib.request.urlopen(r, timeout=120) as resp:
                raw = resp.read()
                return resp.status, (json.loads(raw) if raw else None)
        except urllib.error.HTTPError as e:
            code = e.code
            if code in (403, 429, 500, 502, 503, 504) and attempt < retries - 1:
                wait = min(120, 15 * (attempt + 1))
                log(f"  HTTP {code}, retry in {wait}s (attempt {attempt+1})")
                time.sleep(wait)
                continue
            body_text = e.read().decode(errors="ignore")
            raise RuntimeError(f"HTTP {code} {url}\n{body_text}")
        except Exception as e:
            if attempt < retries - 1:
                wait = min(90, 8 * (attempt + 1))
                log(f"  {type(e).__name__}, retry in {wait}s")
                time.sleep(wait)
                continue
            raise

def upload_file(rel_path):
    abs_path = os.path.join(PROJECT, rel_path)
    with open(abs_path, "rb") as f:
        content = base64.b64encode(f.read()).decode()
    body = {
        "message": f"add {rel_path}",
        "content": content,
        "branch": "main",
    }
    # 直接 PUT；若文件已存在（409），获取 sha 后更新
    for attempt in range(3):
        try:
            status, res = req("PUT", f"{API}/contents/{rel_path}", body)
            time.sleep(1)
            return rel_path
        except RuntimeError as e:
            if ("409" in str(e) or "422" in str(e)) and attempt < 2:
                # 文件已存在，获取现有 sha 后更新
                try:
                    _, info = req("GET", f"{API}/contents/{rel_path}?ref=main")
                    body["sha"] = info["sha"]
                except Exception:
                    pass
                time.sleep(1)
                continue
            raise
    return rel_path

def main():
    import subprocess
    files = subprocess.check_output(["git", "-C", PROJECT, "ls-files"]).decode().splitlines()
    files = [f for f in files if f.strip()]
    # 排除敏感文件和不应上传的文件
    EXCLUDE = {".env", "historical_context.txt"}
    files = [f for f in files if f not in EXCLUDE]
    # workflow 文件需要单独的 Workflows 权限，跳过（稍后手动添加）
    files = [f for f in files if not f.startswith(".github/workflows/")]
    # 跳过远程已存在的文件（内容相同无需更新）
    remote = set()
    try:
        with open("/workspace/app-diuy8vo6h9fl/remote_files.txt") as rf:
            remote = set(l.strip() for l in rf if l.strip())
    except Exception:
        pass
    before = len(files)
    files = [f for f in files if f not in remote]
    log(f"待上传 {len(files)} 个（跳过已存在 {before - len(files)} 个，已跳过 workflow）")

    done = 0
    failed = []
    with ThreadPoolExecutor(max_workers=1) as ex:
        futs = {ex.submit(upload_file, f): f for f in files}
        for fut in as_completed(futs):
            rel = futs[fut]
            try:
                fut.result()
                done += 1
                if done % 20 == 0:
                    log(f"  已上传 {done}/{len(files)}")
            except Exception as e:
                failed.append(rel)
                log(f"  ❌ 失败 {rel}: {e}")
    log(f"完成: {done} 成功, {len(failed)} 失败")
    if failed:
        with open("/workspace/app-diuy8vo6h9fl/failed_files.txt", "w") as f:
            f.write("\n".join(failed))

if __name__ == "__main__":
    main()