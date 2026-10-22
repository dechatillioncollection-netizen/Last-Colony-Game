#!/usr/bin/env python3
# Installer check, on the Linux build: LastColonySetup-Linux, run on its own against a fake GitHub API, installs the game into the
# installer's own folder with menu entries, leaves itself there as the updater and uninstaller, updates, and uninstalls only the
# game's files. Saves are kept.
# Run after `electron/build.sh linux`.
#   python3 tests/insttest.py
import hashlib, http.server, json, os, shutil, subprocess, sys, tempfile, threading, zipfile
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'electron', 'out')
BUILD = os.path.join(OUT, 'Last Colony-linux-x64')
SETUP = os.path.join(OUT, 'LastColonySetup-Linux')
checks = []
def T(name, ok, info=''):
    checks.append(ok); print(('PASS ' if ok else 'FAIL ') + name + (('  ' + str(info)) if info != '' else ''))

work = tempfile.mkdtemp(prefix='lcinst-')
serve = os.path.join(work, 'srv'); os.makedirs(serve)
def mkzip(path, src_root):
    with zipfile.ZipFile(path, 'w', zipfile.ZIP_DEFLATED) as z:
        for d, _, fs in os.walk(src_root):
            for f in fs:
                p = os.path.join(d, f); a = os.path.relpath(p, os.path.dirname(src_root))
                zi = zipfile.ZipInfo.from_file(p, a); zi.compress_type = zipfile.ZIP_DEFLATED
                z.writestr(zi, open(p, 'rb').read())
def release(ver, name, older_updater=False):
    d = os.path.join(work, 'rel' + ver, 'Last Colony-linux-x64'); shutil.copytree(BUILD, d, symlinks=True)
    pj = os.path.join(d, 'resources', 'app', 'package.json'); j = json.load(open(pj)); j['version'] = ver; json.dump(j, open(pj, 'w'))
    if older_updater: open(os.path.join(d, 'updater'), 'w').write('#!/bin/sh\necho old updater\n')
    mkzip(os.path.join(serve, name), d)
# 1.0.0 ships a stand-in for an older updater, so the installer must put its own copy in its place
release('1.0.0', 'v1.zip', older_updater=True); release('9.9.0', 'v2.zip')
REL = {'v': '1.0.0', 'f': 'v1.zip'}
class H(http.server.SimpleHTTPRequestHandler):
    def __init__(s, *a, **k): super().__init__(*a, directory=serve, **k)
    def log_message(s, *a): pass
    def do_GET(s):
        if s.path.startswith('/repos/'):
            f = os.path.join(serve, REL['f'])
            body = json.dumps({'tag_name': 'v' + REL['v'], 'assets': [{'name': 'LastColony-Linux.zip', 'size': os.path.getsize(f),
                   'digest': 'sha256:' + hashlib.sha256(open(f, 'rb').read()).hexdigest(),
                   'browser_download_url': 'http://127.0.0.1:%d/%s' % (s.server.server_port, REL['f']), 'url': ''}]}).encode()
            s.send_response(200); s.send_header('Content-Type', 'application/json'); s.end_headers(); s.wfile.write(body); return
        return super().do_GET()
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), H); threading.Thread(target=srv.serve_forever, daemon=True).start()
home = os.path.join(work, 'home'); data = os.path.join(home, 'share'); os.makedirs(home)
env = dict(os.environ, LC_UPDATE_API='http://127.0.0.1:%d' % srv.server_port, HOME=home, XDG_DATA_HOME=data)
dl = os.path.join(home, 'Downloads'); os.makedirs(dl); setup = os.path.join(dl, 'LastColonySetup-Linux'); shutil.copy2(SETUP, setup)
game = dl; apps = os.path.join(data, 'applications')
open(os.path.join(dl, 'notes.txt'), 'w').write('mine')  # something of the player's in the same folder
def run(exe, *args, stdin=''):
    r = subprocess.run([exe, *args], env=env, input=stdin, capture_output=True, text=True, timeout=600)
    return r.returncode, r.stdout + r.stderr
def ver(d): return json.load(open(os.path.join(d, 'resources', 'app', 'package.json')))['version']
def last(out): return out.strip().splitlines()[-1] if out.strip() else ''
GAMEEXE = os.path.join(dl, 'Last Colony')

code, out = run(setup, '--no-start', stdin='n\n')
T('typing n at the first question installs nothing', code == 0 and 'Not installed' in out and not os.path.exists(GAMEEXE), last(out))
g2 = os.path.join(home, 'Games', 'LC')
code, out = run(setup, '--no-start', stdin=g2 + '\n')
T('typing another folder installs there instead', code == 0 and ver(g2) == '1.0.0' and not os.path.exists(GAMEEXE), last(out))
code, out = run(setup, '--no-start', stdin='\n')
T('Enter installs the newest release into the installer\'s own folder', code == 0 and ver(dl) == '1.0.0' and 'Installed Last Colony 1.0.0 in ' + dl in out, last(out))
T('the game is ready to run', os.access(GAMEEXE, os.X_OK))
T('the player\'s own files and the installer are kept', open(os.path.join(dl, 'notes.txt')).read() == 'mine' and os.path.exists(setup))
T('nothing is left behind', [n for n in os.listdir(dl) if n.startswith('.lastcolony-update-') or n.endswith('.lcold')] == [])
upd = os.path.join(dl, 'updater'); uni = os.path.join(dl, 'uninstall-last-colony')
T('the installer leaves itself in the folder as the updater and the uninstaller', all(open(f, 'rb').read() == open(SETUP, 'rb').read() and os.access(f, os.X_OK) for f in (upd, uni)))
man = open(os.path.join(dl, '.lastcolony-files')).read().splitlines()
T('the game\'s own files are listed, and the player\'s are not', 'resources' in man and 'Last Colony' in man and 'uninstall-last-colony' in man and 'notes.txt' not in man and 'LastColonySetup-Linux' not in man)
T('updater.json is there', json.load(open(os.path.join(dl, 'updater.json')))['asset'] == 'LastColony-Linux.zip')
de = open(os.path.join(apps, 'last-colony.desktop')).read() if os.path.exists(os.path.join(apps, 'last-colony.desktop')) else ''
T('a menu entry starts the game', 'Exec="%s/Last Colony"' % dl in de and 'Icon=%s/resources/app/icon.png' % dl in de, de.splitlines()[3:5])
T('menu entries run the updater and the uninstaller', 'Exec="%s"' % upd in open(os.path.join(apps, 'last-colony-update.desktop')).read() and 'Exec="%s"' % uni in open(os.path.join(apps, 'last-colony-uninstall.desktop')).read())
code, out = run(setup, '--yes', '--no-start')
T('running the installer again turns it into the updater: up to date', code == 0 and 'Last Colony updater' in out and 'newest version (1.0.0)' in out, last(out))
REL.update(v='9.9.0', f='v2.zip')
code, out = run(setup, '--yes', '--no-start')
T('the installer, run again, updates the game', code == 0 and ver(dl) == '9.9.0' and open(os.path.join(dl, 'notes.txt')).read() == 'mine', last(out))
T('nothing is left behind after the update', [n for n in os.listdir(dl) if n.startswith('.lastcolony-update-') or n.endswith('.lcold')] == [])
other = os.path.join(home, 'stuff'); os.makedirs(other); open(os.path.join(other, 'LICENSE'), 'w').write('x')
code, out = run(setup, '--yes', '--no-start', '--dir', other)
T('a folder with files the game would replace is refused', code == 1 and 'LICENSE' in out and open(os.path.join(other, 'LICENSE')).read() == 'x' and sorted(os.listdir(other)) == ['LICENSE'], last(out))
saves = os.path.join(home, '.config', 'Last Colony', 'saves'); os.makedirs(saves); open(os.path.join(saves, 'auto.json'), 'w').write('{}')
code, out = run(uni, stdin='n\n')
T('the uninstaller asks first, and n removes nothing', code == 0 and os.path.exists(GAMEEXE), last(out))
code, out = run(uni, stdin='\n')
T('the uninstaller removes the game and its menu entries', code == 0 and not os.path.exists(GAMEEXE) and not any(os.path.exists(os.path.join(apps, n)) for n in ('last-colony.desktop', 'last-colony-update.desktop', 'last-colony-uninstall.desktop')), last(out))
T('only the game\'s files go: the player\'s files and the installer stay', sorted(os.listdir(dl)) == ['LastColonySetup-Linux', 'notes.txt'], sorted(os.listdir(dl)))
T('saves are kept', os.path.exists(os.path.join(saves, 'auto.json')))
code, out = run(setup, '--uninstall', '--yes')
T('uninstalling when not installed says so', code == 1 and 'not installed' in out, last(out))
code, out = run(os.path.join(g2, 'updater'), '--uninstall', '--yes')
T('the updater with --uninstall works too, and an emptied folder goes', code == 0 and not os.path.exists(g2), last(out))
srv.shutdown(); shutil.rmtree(work, ignore_errors=True)
print('%d of %d pass' % (sum(checks), len(checks))); sys.exit(0 if all(checks) else 1)
