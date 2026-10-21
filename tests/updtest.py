#!/usr/bin/env python3
# v51 updater check, on the Linux build: a fake GitHub API serves a "newer" release, and the updater in a copy of the game folder replaces
# the game with it. Also: already up to date, a damaged download, an unsafe zip, no releases. Run after `electron/build.sh linux`.
#   python3 tests/updtest.py
import hashlib, http.server, json, os, shutil, subprocess, sys, tempfile, threading, zipfile
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BUILD = os.path.join(ROOT, 'electron', 'out', 'Last Colony-linux-x64')
checks = []
def T(name, ok, info=''):
    checks.append(ok); print(('PASS ' if ok else 'FAIL ') + name + (('  ' + str(info)) if info != '' else ''))

work = tempfile.mkdtemp(prefix='lcupd-')
serve = os.path.join(work, 'srv'); os.makedirs(serve)
# the "new" release: the same build with a higher version and a marker file, zipped the way build.sh does (one top folder)
newdir = os.path.join(work, 'new', 'Last Colony-linux-x64')
shutil.copytree(BUILD, newdir, symlinks=True)
pj = os.path.join(newdir, 'resources', 'app', 'package.json'); j = json.load(open(pj)); j['version'] = '9.9.0'; json.dump(j, open(pj, 'w'))
open(os.path.join(newdir, 'resources', 'app', 'NEW_MARKER'), 'w').write('new')
def mkzip(path, src_root, extra=None):
    with zipfile.ZipFile(path, 'w', zipfile.ZIP_DEFLATED) as z:
        for d, _, fs in os.walk(src_root):
            for f in fs:
                p = os.path.join(d, f); a = os.path.relpath(p, os.path.dirname(src_root))
                zi = zipfile.ZipInfo.from_file(p, a); zi.compress_type = zipfile.ZIP_DEFLATED
                z.writestr(zi, open(p, 'rb').read())
        if extra: z.writestr(extra, 'x')
mkzip(os.path.join(serve, 'LastColony-Linux.zip'), newdir)
mkzip(os.path.join(serve, 'evil.zip'), newdir, extra='../../escaped.txt')
sha = hashlib.sha256(open(os.path.join(serve, 'LastColony-Linux.zip'), 'rb').read()).hexdigest()
size = os.path.getsize(os.path.join(serve, 'LastColony-Linux.zip'))
MODE = {'m': 'good'}
class H(http.server.SimpleHTTPRequestHandler):
    def __init__(s, *a, **k): super().__init__(*a, directory=serve, **k)
    def log_message(s, *a): pass
    def do_GET(s):
        if s.path.startswith('/repos/'):
            if MODE['m'] == 'none': s.send_response(404); s.end_headers(); return
            name = 'evil.zip' if MODE['m'] == 'evil' else 'LastColony-Linux.zip'
            dig = 'sha256:' + ('0' * 64 if MODE['m'] == 'bad' else hashlib.sha256(open(os.path.join(serve, name), 'rb').read()).hexdigest())
            sz = os.path.getsize(os.path.join(serve, name))
            body = json.dumps({'tag_name': 'v9.9.0', 'assets': [{'name': 'LastColony-Linux.zip', 'size': sz, 'digest': dig,
                   'browser_download_url': 'http://127.0.0.1:%d/%s' % (s.server.server_port, name), 'url': ''}]}).encode()
            s.send_response(200); s.send_header('Content-Type', 'application/json'); s.end_headers(); s.wfile.write(body); return
        return super().do_GET()
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), H); threading.Thread(target=srv.serve_forever, daemon=True).start()
env = dict(os.environ, LC_UPDATE_API='http://127.0.0.1:%d' % srv.server_port)

def install():
    d = os.path.join(work, 'game'); shutil.rmtree(d, ignore_errors=True); shutil.copytree(BUILD, d, symlinks=True); return d
def ver(d): return json.load(open(os.path.join(d, 'resources', 'app', 'package.json')))['version']
def up(d, *args):
    r = subprocess.run([os.path.join(d, 'updater'), '--yes', '--no-start', *args], env=env, capture_output=True, text=True, timeout=600)
    return r.returncode, r.stdout + r.stderr

g = install(); v0 = ver(g)
T('the updater and its settings file ship in the game folder', os.path.exists(os.path.join(g, 'updater')) and json.load(open(os.path.join(g, 'updater.json')))['asset'] == 'LastColony-Linux.zip')
code, out = up(g, '--check')
T('--check reports the newer version without changing anything', code == 0 and '9.9.0 is available' in out and ver(g) == v0, out.strip().splitlines()[-1])
MODE['m'] = 'bad'; code, out = up(g)
T('a damaged download is refused and the game is left as it was', code == 1 and 'damaged' in out and ver(g) == v0 and not os.path.exists(os.path.join(g, 'resources', 'app', 'NEW_MARKER')), out.strip().splitlines()[-1])
MODE['m'] = 'evil'; code, out = up(g)
T('a zip that tries to write outside the folder is refused', code == 1 and 'unsafe path' in out and not os.path.exists(os.path.join(work, 'escaped.txt')) and ver(g) == v0, out.strip().splitlines()[-1])
MODE['m'] = 'none'; code, out = up(g)
T('no releases: says so and changes nothing', code == 1 and 'no releases' in out and ver(g) == v0, out.strip().splitlines()[-1])
MODE['m'] = 'good'
open(os.path.join(g, 'updater.json'), 'w').write(json.dumps({'repo': 'someone/elsewhere', 'asset': 'LastColony-Linux.zip'}))
code, out = up(g)
left = [n for n in os.listdir(g) if n.endswith('.old') or n.startswith('.update-')]
T('an update replaces the game with the new release, checks the download, and leaves nothing behind',
  code == 0 and ver(g) == '9.9.0' and os.path.exists(os.path.join(g, 'resources', 'app', 'NEW_MARKER')) and 'Download checked' in out and not left, (out.strip().splitlines()[-1], left))
T('the local updater.json is kept', json.load(open(os.path.join(g, 'updater.json')))['repo'] == 'someone/elsewhere')
T('the game still runs from its folder after the update (files executable)', os.access(os.path.join(g, 'Last Colony'), os.X_OK) and os.access(os.path.join(g, 'updater'), os.X_OK))
code, out = up(g)
T('run again: already the newest version', code == 0 and 'newest version (9.9.0)' in out, out.strip().splitlines()[-1])
srv.shutdown(); shutil.rmtree(work, ignore_errors=True)
print('%d of %d pass' % (sum(checks), len(checks))); sys.exit(0 if all(checks) else 1)
