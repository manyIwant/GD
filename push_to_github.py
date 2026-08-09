#!/usr/bin/env python3
"""通过 GitHub Git Database API 批量推送文件到仓库（支持断点续传 + 健壮重试）。"""
import os, sys, base64, json, time
import urllib.request, urllib.error
from concurrent.futures import ThreadPoolExecutor, as_completed

TOKEN = os.environ["GH_TOKEN"]
OWNER = "manyIwant"
REPO = "GD"
API = f"https://api.github.com/repos/{OWNER}/{REPO}/git"
PROJECT = "/workspace/app-diuy8vo6h9fl"
LOG = "/workspace/app-diuy8vo6h9fl/push_progress.log"
CACHE = "/workspace/app-diuy8vo6h9fl/blob_cache.json"

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

def load_cache():
    try:
        with open(CACHE) as f:
            return json.load(f)
    except Exception:
        return {}

def save_cache(cache):
    with open(CACHE, "w") as f:
        json.dump(cache, f)

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
            # 临时/服务端错误：重试
            if code in (403, 429, 500, 502, 503, 504) and attempt < retries - 1:
                wait = min(60, 5 * (attempt + 1))
                log(f"  HTTP {code}, retry in {wait}s (attempt {attempt+1})")
                time.sleep(wait)
                continue
            body_text = e.read().decode(errors="ignore")
            raise RuntimeError(f"HTTP {code} {url}\n{body_text}")
        except Exception as e:
            if attempt < retries - 1:
                wait = min(60, 5 * (attempt + 1))
                log(f"  {type(e).__name__}, retry in {wait}s (attempt {attempt+1})")
                time.sleep(wait)
                continue
            raise

def create_blob(path, cache):
    if path in cache:
        return path, cache[path]
    with open(path, "rb") as f:
        content = base64.b64encode(f.read()).decode()
    status, res = req("POST", f"{API}/blobs", {"content": content, "encoding": "base64"})
    time.sleep(0.1)
    cache[path] = res["sha"]
    return path, res["sha"]

def main():
    import subprocess
    files = subprocess.check_output(["git", "-C", PROJECT, "ls-files"]).decode().splitlines()
    files = [f for f in files if f.strip()]
    cache = load_cache()
    log(f"共 {len(files)} 个文件待上传（缓存已有 {len(cache)} 个）")

    tree_entries = []
    done = 0
    with ThreadPoolExecutor(max_workers=3) as ex:
        futs = {ex.submit(create_blob, os.path.join(PROJECT, f), cache): f for f in files}
        for fut in as_completed(futs):
            path, sha = fut.result()
            tree_entries.append({"path": futs[fut], "mode": "100644", "type": "blob", "sha": sha})
            done += 1
            if done % 20 == 0:
                save_cache(cache)
                log(f"  已上传 {done}/{len(files)}")
    save_cache(cache)

    log("创建 tree...")
    _, tree = req("POST", f"{API}/trees", {"tree": tree_entries})

    parents = []
    try:
        _, ref = req("GET", f"{API}/refs/heads/main")
        if isinstance(ref, dict) and "object" in ref:
            parents = [ref["object"]["sha"]]
            log(f"  parent commit: {parents[0]}")
    except Exception as e:
        log(f"  无现有 main 分支，作为初始提交: {e}")

    log("创建 commit...")
    _, commit = req("POST", f"{API}/commits", {
        "tree": tree["sha"],
        "message": "Deploy app - 高德星际·星际客运 (GitHub Pages)",
        "parents": parents,
    })
    log("更新 ref main...")
    try:
        req("PATCH", f"{API}/refs/heads/main", {"sha": commit["sha"]})
    except RuntimeError:
        req("POST", f"https://api.github.com/repos/{OWNER}/{REPO}/git/refs",
            {"ref": "refs/heads/main", "sha": commit["sha"]})
    log(f"✅ 推送成功! commit={commit['sha']}")

if __name__ == "__main__":
    main()