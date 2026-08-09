#!/usr/bin/env python3
"""把 dist/ 的构建产物上传到 gh-pages 分支根目录。"""
import os, sys, base64, json, time
import urllib.request, urllib.error

TOKEN = os.environ["GH_TOKEN"]
OWNER = "manyIwant"
REPO = "GD"
API = f"https://api.github.com/repos/{OWNER}/{REPO}"
PROJECT = "/workspace/app-diuy8vo6h9fl"
LOG = "/workspace/app-diuy8vo6h9fl/dist_progress.log"
BRANCH = "gh-pages"

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
                wait = min(120, 15 * (attempt + 1))
                log(f"  {type(e).__name__}, retry in {wait}s")
                time.sleep(wait)
                continue
            raise

def upload_file(rel_path):
    abs_path = os.path.join(PROJECT, "dist", rel_path)
    with open(abs_path, "rb") as f:
        content = base64.b64encode(f.read()).decode()
    body = {"message": f"deploy {rel_path}", "content": content, "branch": BRANCH}
    for attempt in range(3):
        try:
            req("PUT", f"{API}/contents/{rel_path}", body)
            time.sleep(1.5)
            return rel_path
        except RuntimeError as e:
            if ("409" in str(e) or "422" in str(e)) and attempt < 2:
                try:
                    _, info = req("GET", f"{API}/contents/{rel_path}?ref={BRANCH}")
                    body["sha"] = info["sha"]
                except Exception:
                    pass
                time.sleep(1)
                continue
            raise
    return rel_path

def main():
    import subprocess
    dist_files = subprocess.check_output(["find", os.path.join(PROJECT, "dist"), "-type", "f"]).decode().splitlines()
    rels = [os.path.relpath(p, os.path.join(PROJECT, "dist")) for p in dist_files]
    rels = [r for r in rels if r.strip()]
    log(f"待上传 {len(rels)} 个 dist 文件到 {BRANCH}")
    done = 0
    failed = []
    for rel in rels:
        try:
            upload_file(rel)
            done += 1
            log(f"  ✅ {rel}")
        except Exception as e:
            failed.append(rel)
            log(f"  ❌ {rel}: {e}")
    log(f"完成: {done} 成功, {len(failed)} 失败")

if __name__ == "__main__":
    main()