package main

// The installer half: run as LastColonySetup it puts the newest release into its own folder (or one the player types), adds
// shortcuts, and on Windows lists the game under Installed apps. With the game next to it, the same program is the updater, so
// from then on it updates the game, and with --uninstall removes it. The folder may hold other files: the game's own top-level
// files and folders are listed in .lastcolony-files, and only those are ever replaced or removed.

import (
	"bufio"
	"encoding/json"
	"fmt"
	"io"
	"io/fs"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
)

const uninstallKey = `HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\LastColony`

func dataHome() string {
	if d := os.Getenv("XDG_DATA_HOME"); d != "" {
		return d
	}
	h, _ := os.UserHomeDir()
	return filepath.Join(h, ".local", "share")
}

func updaterName() string {
	if runtime.GOOS == "windows" {
		return "Updater.exe"
	}
	return "updater"
}

// the same program again, under a name that makes it uninstall (see run)
func uninstallerName() string {
	if runtime.GOOS == "windows" {
		return "Uninstall Last Colony.exe"
	}
	return "uninstall-last-colony"
}

func install(self string) int {
	target := *dirFlag
	if target == "" {
		target = filepath.Dir(self)
	}
	target, _ = filepath.Abs(target)
	installed := exists(filepath.Join(target, gameExe()))
	if *uninstallFlag {
		if !installed {
			fmt.Printf("Last Colony is not installed in %s.\n", target)
			return 1
		}
		return uninstall(target)
	}
	if installed {
		fmt.Printf("Last Colony is already installed in %s.\n", target)
		ensureUpdater(self, target)
		addShortcuts(target)
		register(target)
		registerVersion(target, localVersion(target))
		return update(target)
	}
	fmt.Printf("Last Colony setup\nThis installs the game into this folder:\n  %s\n", target)
	if !*yes {
		fmt.Print("Press Enter to install there, type another folder, or type n to cancel: ")
		line, _ := bufio.NewReader(os.Stdin).ReadString('\n')
		line = strings.TrimSpace(line)
		switch strings.ToLower(line) {
		case "":
		case "n", "no":
			fmt.Println("Not installed.")
			return 0
		default:
			target, _ = filepath.Abs(strings.Trim(line, `"`))
			if exists(filepath.Join(target, gameExe())) {
				fmt.Printf("Last Colony is already installed in %s.\n", target)
				return update(target)
			}
		}
	}
	fmt.Printf("Checking GitHub (%s) for the newest version...\n", defaultRepo)
	cfg := config{Repo: defaultRepo, Asset: defaultAsset()}
	want, a, err := findRelease(cfg)
	if a == nil {
		fmt.Println("Could not find a version to install:", err)
		return 1
	}
	fmt.Printf("Installing version %s (%.0f MB).\n", want, float64(a.Size)/1e6)
	if err := os.MkdirAll(target, 0o755); err != nil {
		fmt.Println("Could not make the folder:", err)
		return 1
	}
	tmp, err := os.MkdirTemp(target, tmpPrefix)
	if err != nil {
		fmt.Println("Could not make a folder for the download:", err)
		return 1
	}
	defer os.RemoveAll(tmp)
	root, err := fetchGame(a, tmp, cfg.Asset)
	if err != nil {
		fmt.Println(err)
		return 1
	}
	// the folder can hold other things, but nothing the game would replace
	var clash []string
	for _, n := range topNames(root) {
		if n != "updater.json" && exists(filepath.Join(target, n)) {
			clash = append(clash, n)
		}
	}
	if len(clash) > 0 {
		fmt.Printf("This folder already has files the game would replace (%s). Put the installer in an empty folder and run it again.\n", strings.Join(clash, ", "))
		return 1
	}
	names := topNames(root)
	if err := swapIn(target, root); err != nil {
		fmt.Println("Could not put the game in place:", err)
		return 1
	}
	recordFiles(target, names)
	if !exists(filepath.Join(target, "updater.json")) {
		b, _ := json.MarshalIndent(cfg, "", "  ")
		_ = os.WriteFile(filepath.Join(target, "updater.json"), append(b, '\n'), 0o644)
	}
	ensureUpdater(self, target)
	addShortcuts(target)
	register(target)
	registerVersion(target, want)
	fmt.Printf("Installed Last Colony %s in %s.\n", want, target)
	if runtime.GOOS == "windows" {
		fmt.Println("It is in the Start menu and on the desktop. To update it later, run this installer again, or \"Update Last Colony\" from the Start menu.")
	} else {
		fmt.Println("It is in your applications menu. To update it later, run this installer again, or \"Update Last Colony\" from there.")
	}
	offerStart(target)
	return 0
}

// puts this program in the game folder as its updater and its uninstaller, so both can do everything even when the release's own
// updater is older
func ensureUpdater(self, dir string) {
	for _, name := range []string{updaterName(), uninstallerName()} {
		copySelf(self, filepath.Join(dir, name))
	}
}

func copySelf(self, dst string) {
	in, err := os.Open(self)
	if err != nil {
		return
	}
	defer in.Close()
	out, err := os.OpenFile(dst+".new", os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0o755)
	if err != nil {
		return
	}
	_, err = io.Copy(out, in)
	if out.Close() != nil || err != nil {
		_ = os.Remove(dst + ".new")
		return
	}
	if os.Rename(dst+".new", dst) != nil {
		_ = os.Remove(dst + ".new")
	}
}

func uninstall(dir string) int {
	fmt.Printf("This removes Last Colony from %s, with its shortcuts. Other files in the folder and your saves are kept.\n", dir)
	if !*yes && !ask("Remove it? [Y/n] ") {
		fmt.Println("Nothing removed.")
		return 0
	}
	if err := checkNotRunning(dir); err != nil {
		fmt.Println(strings.Replace(err.Error(), "the updater", "this", 1))
		return 1
	}
	removeShortcuts()
	unregister()
	self, _ := os.Executable()
	var later []string
	failed := false
	for _, n := range gameFiles(dir) {
		p := filepath.Join(dir, n)
		if runtime.GOOS == "windows" && strings.EqualFold(p, self) {
			later = append(later, p) // a running program can't delete itself on Windows; a hidden helper does it once this has closed
			continue
		}
		if err := os.RemoveAll(p); err != nil {
			fmt.Println("Could not remove", n+":", err)
			failed = true
		}
	}
	_ = os.Remove(dir) // only if nothing else is left in it
	if len(later) > 0 {
		removeLater(later, dir)
	}
	if failed {
		return 1
	}
	fmt.Println("Last Colony has been removed.")
	return 0
}

const manifest = ".lastcolony-files"

// the game's own top-level files and folders in dir; without a list (a game unzipped by hand), everything in the folder
func gameFiles(dir string) []string {
	var names []string
	if b, err := os.ReadFile(filepath.Join(dir, manifest)); err == nil {
		for _, n := range strings.Split(string(b), "\n") {
			if n = strings.TrimSpace(n); n != "" && n != "." && n != ".." && !strings.ContainsAny(n, `/\`) {
				names = append(names, n)
			}
		}
		return append(names, "updater.json", updaterName(), uninstallerName(), manifest)
	}
	return topEntries(dir)
}

func topEntries(dir string) []string {
	var names []string
	ents, _ := os.ReadDir(dir)
	for _, e := range ents {
		names = append(names, e.Name())
	}
	return names
}

func topNames(root string) []string { return topEntries(root) }

// adds names to the list of the game's files (an update can bring new ones)
func recordFiles(dir string, names []string) {
	seen := map[string]bool{}
	var all []string
	add := func(n string) {
		if n != "" && !seen[n] {
			seen[n] = true
			all = append(all, n)
		}
	}
	if b, err := os.ReadFile(filepath.Join(dir, manifest)); err == nil {
		for _, n := range strings.Split(string(b), "\n") {
			add(strings.TrimSpace(n))
		}
	}
	for _, n := range names {
		add(n)
	}
	add("updater.json")
	add(updaterName())
	add(uninstallerName())
	_ = os.WriteFile(filepath.Join(dir, manifest), []byte(strings.Join(all, "\n")+"\n"), 0o644)
}

func removeLater(files []string, dir string) {
	bat := filepath.Join(os.TempDir(), "lastcolony-uninstall.bat")
	q := func(p string) string { return `"` + strings.ReplaceAll(p, "%", "%%") + `"` }
	script := "@echo off\r\nfor /l %%i in (1,1,600) do (\r\n  ping -n 2 127.0.0.1 >nul\r\n"
	for _, f := range files {
		script += "  del /f /q " + q(f) + " 2>nul\r\n"
	}
	script += "  if not exist " + q(files[0]) + " goto done\r\n)\r\n:done\r\nrmdir " + q(dir) + " 2>nul\r\n(goto) 2>nul & del \"%~f0\"\r\n"
	if os.WriteFile(bat, []byte(script), 0o644) != nil {
		return
	}
	cmd := exec.Command("cmd", "/c", bat)
	hideWindow(cmd)
	_ = cmd.Start()
}

// ---- shortcuts ----

func psQuote(s string) string { return "'" + strings.ReplaceAll(s, "'", "''") + "'" }

func powershell(script string) error {
	cmd := exec.Command("powershell", "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", script)
	hideWindow(cmd)
	return cmd.Run()
}

func addShortcuts(dir string) {
	switch runtime.GOOS {
	case "windows":
		game, upd := filepath.Join(dir, gameExe()), filepath.Join(dir, updaterName())
		lnk := func(where, name, target, args string) string {
			return "$s=$w.CreateShortcut((Join-Path " + where + " " + psQuote(name+".lnk") + "));$s.TargetPath=" + psQuote(target) +
				";$s.Arguments=" + psQuote(args) + ";$s.WorkingDirectory=" + psQuote(dir) + ";$s.IconLocation=" + psQuote(game+",0") + ";$s.Save();"
		}
		script := "$w=New-Object -ComObject WScript.Shell;$p=[Environment]::GetFolderPath('Programs');$d=[Environment]::GetFolderPath('Desktop');" +
			lnk("$p", "Last Colony", game, "") + lnk("$d", "Last Colony", game, "") + lnk("$p", "Update Last Colony", upd, "") +
			lnk("$p", "Uninstall Last Colony", filepath.Join(dir, uninstallerName()), "")
		if err := powershell(script); err != nil {
			fmt.Println("The shortcuts could not be made:", err)
		}
	case "linux":
		apps := filepath.Join(dataHome(), "applications")
		if err := os.MkdirAll(apps, 0o755); err != nil {
			return
		}
		icon := filepath.Join(dir, "resources", "app", "icon.png")
		entry := func(name, comment, exe string, terminal bool) string {
			return "[Desktop Entry]\nType=Application\nName=" + name + "\nComment=" + comment + "\nExec=" + desktopQuote(exe) +
				"\nPath=" + dir + "\nIcon=" + icon + "\nTerminal=" + fmt.Sprint(terminal) + "\nCategories=Game;StrategyGame;\n"
		}
		_ = os.WriteFile(filepath.Join(apps, "last-colony.desktop"),
			[]byte(entry("Last Colony", "Grow the hive and take back the sectors", filepath.Join(dir, gameExe()), false)), 0o644)
		_ = os.WriteFile(filepath.Join(apps, "last-colony-update.desktop"),
			[]byte(entry("Update Last Colony", "Fetch the newest version of Last Colony", filepath.Join(dir, updaterName()), true)), 0o644)
		_ = os.WriteFile(filepath.Join(apps, "last-colony-uninstall.desktop"),
			[]byte(entry("Uninstall Last Colony", "Remove Last Colony (saves are kept)", filepath.Join(dir, uninstallerName()), true)), 0o644)
	}
}

// Exec= wants arguments in double quotes with " ` $ \ escaped, and % doubled
func desktopQuote(s string) string {
	r := strings.NewReplacer(`\`, `\\`, `"`, `\"`, "`", "\\`", `$`, `\$`, `%`, `%%`)
	return `"` + r.Replace(s) + `"`
}

func removeShortcuts() {
	switch runtime.GOOS {
	case "windows":
		script := "$p=[Environment]::GetFolderPath('Programs');$d=[Environment]::GetFolderPath('Desktop');" +
			"foreach($f in @((Join-Path $p 'Last Colony.lnk'),(Join-Path $d 'Last Colony.lnk'),(Join-Path $p 'Update Last Colony.lnk'),(Join-Path $p 'Uninstall Last Colony.lnk'))){Remove-Item -LiteralPath $f -ErrorAction SilentlyContinue}"
		_ = powershell(script)
	case "linux":
		apps := filepath.Join(dataHome(), "applications")
		_ = os.Remove(filepath.Join(apps, "last-colony.desktop"))
		_ = os.Remove(filepath.Join(apps, "last-colony-update.desktop"))
		_ = os.Remove(filepath.Join(apps, "last-colony-uninstall.desktop"))
	}
}

// ---- Installed apps (Windows) ----

func reg(args ...string) error {
	cmd := exec.Command("reg", args...)
	hideWindow(cmd)
	return cmd.Run()
}

func register(dir string) {
	if runtime.GOOS != "windows" {
		return
	}
	var kb int64
	_ = filepath.WalkDir(dir, func(_ string, d fs.DirEntry, err error) error {
		if err == nil && !d.IsDir() {
			if i, err := d.Info(); err == nil {
				kb += i.Size()
			}
		}
		return nil
	})
	kb /= 1024
	upd := filepath.Join(dir, updaterName())
	for _, v := range [][3]string{
		{"DisplayName", "REG_SZ", "Last Colony"},
		{"Publisher", "REG_SZ", "Last Colony"},
		{"InstallLocation", "REG_SZ", dir},
		{"DisplayIcon", "REG_SZ", filepath.Join(dir, gameExe())},
		{"UninstallString", "REG_SZ", `"` + filepath.Join(dir, uninstallerName()) + `"`},
		{"QuietUninstallString", "REG_SZ", `"` + upd + `" --uninstall --yes`},
		{"URLInfoAbout", "REG_SZ", "https://github.com/" + defaultRepo},
		{"NoModify", "REG_DWORD", "1"},
		{"NoRepair", "REG_DWORD", "1"},
		{"EstimatedSize", "REG_DWORD", fmt.Sprint(kb)},
	} {
		if err := reg("add", uninstallKey, "/v", v[0], "/t", v[1], "/d", v[2], "/f"); err != nil {
			fmt.Println("Could not list the game under Installed apps:", err)
			return
		}
	}
}

// keeps the version shown under Installed apps current; only for a game this program installed
func registerVersion(dir, version string) {
	if runtime.GOOS != "windows" || reg("query", uninstallKey, "/v", "DisplayName") != nil {
		return
	}
	_ = reg("add", uninstallKey, "/v", "DisplayVersion", "/t", "REG_SZ", "/d", version, "/f")
}

func unregister() {
	if runtime.GOOS == "windows" {
		_ = reg("delete", uninstallKey, "/f")
	}
}

func exists(p string) bool {
	_, err := os.Stat(p)
	return err == nil
}
