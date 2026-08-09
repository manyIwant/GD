#!/usr/bin/env python3
"""从缓存读取已上传的 blob，创建 tree + commit + 更新 ref。"""
import os, json, time
import urllib.request, urllib.error

TOKEN = os.environ["GH_TOKEN"]
OWNER = "manyIwant"
REPO = "GD"
API = f"https://api.github.com/repos/{OWNER}/{REPO}/git"
PROJECT = "/workspace/app-diuy8vo6h9fl"
CACHE = "/workspace/app-diuy8vo6h9fl/blob_cache.json"

HEADERS = {
    "Authorization": f"token {TOKEN}",
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "deploy-script",
}

def req(method, url, body=None, retries=10):
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
                wait = min(90, 10 * (attempt + 1))
                print(f"  HTTP {code}, retry in {wait}s (attempt {attempt+1})", flush=True)
                time.sleep(wait)
                continue
            body_text = e.read().decode(errors="ignore")
            raise RuntimeError(f"HTTP {code} {url}\n{body_text}")
        except Exception as e:
            if attempt < retries - 1:
                wait = min(90, 10 * (attempt + 1))
                print(f"  {type(e).__name__}, retry in {wait}s", flush=True)
                time.sleep(wait)
                continue
            raise

def main():
    import subprocess
    files = subprocess.check_output(["git", "-C", PROJECT, "ls-files"]).decode().splitlines()
    files = [f for f in files if f.strip()]
    with open(CACHE) as f:
        cache = json.load(f)
    print(f"缓存中有 {len(cache)} 个 blob，文件总数 {len(files)}", flush=True)

    # 检查缓存是否完整
    missing = [f for f in files if os.path.join(PROJECT, f) not in cache]
    if missing:
        print(f"⚠️ 缺失 {len(missing)} 个 blob，请重新运行 push_to_github.py", flush=True)
        return

    tree_entries = []
    for f in files:
        p = os.path.join(PROJECT, f)
        tree_entries.append({"path": f, "mode": "100644", "type": "blob", "sha": cache[p]})

    print(f"创建顶层 tree（{len(tree_entries)} 条目）...", flush=True)
    _, tree = req("POST", f"{API}/trees", {"tree": tree_entries})
    print(f"tree sha: {tree['sha']}", flush=True)

    parents = []
    try:
        _, ref = req("GET", f"{API}/refs/heads/main")
        if isinstance(ref, dict) and "object" in ref:
            parents = [ref["object"]["sha"]]
            print(f"parent commit: {parents[0]}", flush=True)
    except Exception as e:
        print(f"无现有 main 分支: {e}", flush=True)

    print("创建 commit...", flush=True)
    _, commit = req("POST", f"{API}/commits", {
        "tree": tree["sha"],
        "message": "Deploy app - 高德星际·星际客运 (GitHub Pages)",
        "parents": parents,
    })
    print(f"commit sha: {commit['sha']}", flush=True)

    print("更新 ref main...", flush=True)
    try:
        req("PATCH", f"{API}/refs/heads/main", {"sha": commit["sha"]})
    except RuntimeError:
        req("POST", f"https://api.github.com/repos/{OWNER}/{REPO}/git/refs",
            {"ref": "refs/heads/main", "sha": commit["sha"]})
    print(f"✅ 推送成功!", flush=True)

if __name__ == "__main__":
    main()