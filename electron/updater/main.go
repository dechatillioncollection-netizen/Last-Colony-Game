// Updater for the downloadable (zip) version of Last Colony. It asks GitHub for the newest release, and if that is newer than the copy
// in this folder it downloads the zip for this computer, checks it, and swaps the new files in. Saves are never touched: they live in the
// user's own data folder, not here. Steam and the itch.io app update the game themselves, so this is only for the zip.
//
// Settings come from updater.json next to this program:
//
//	{"repo": "owner/name", "asset": "LastColony-Windows.zip"}
//
// GITHUB_TOKEN, if set, is sent with the requests (for testing against a private repository; never ship a token).
// LC_UPDATE_API overrides https://api.github.com (for tests).
package main

import (
	"archive/zip"
	"bufio"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strconv"
	"strings"
	"time"
)

type config struct {
	Repo  string `json:"repo"`
	Asset string `json:"asset"`
}

type release struct {
	Tag    string `json:"tag_name"`
	Name   string `json:"name"`
	Draft  bool   `json:"draft"`
	Pre    bool   `json:"prerelease"`
	Assets []struct {
		Name   string `json:"name"`
		URL    string `json:"browser_download_url"`
		API    string `json:"url"`
		Size   int64  `json:"size"`
		Digest string `json:"digest"`
	} `json:"assets"`
}

var (
	yes     = flag.Bool("yes", false, "update without asking, and do not wait for Enter at the end")
	check   = flag.Bool("check", false, "only say whether an update is available")
	noStart = flag.Bool("no-start", false, "do not offer to start the game afterwards")
	dirFlag = flag.String("dir", "", "the game folder (default: the folder this program is in)")
)

func main() {
	flag.Parse()
	code := run()
	if !*yes && !*check {
		fmt.Print("\nPress Enter to close.")
		bufio.NewReader(os.Stdin).ReadString('\n')
	}
	os.Exit(code)
}

func gameExe() string {
	switch runtime.GOOS {
	case "windows":
		return "Last Colony.exe"
	default:
		return "Last Colony"
	}
}

func defaultAsset() string {
	if runtime.GOOS == "windows" {
		return "LastColony-Windows.zip"
	}
	return "LastColony-Linux.zip"
}

func run() int {
	dir := *dirFlag
	if dir == "" {
		exe, err := os.Executable()
		if err != nil {
			fmt.Println("Could not find the game folder:", err)
			return 1
		}
		dir = filepath.Dir(exe)
	}
	cleanOld(dir)
	cfg := config{Repo: "dechatillioncollection-netizen/Last-Colony-Game", Asset: defaultAsset()}
	if b, err := os.ReadFile(filepath.Join(dir, "updater.json")); err == nil {
		if err := json.Unmarshal(b, &cfg); err != nil {
			fmt.Println("updater.json could not be read:", err)
			return 1
		}
	}
	if _, err := os.Stat(filepath.Join(dir, gameExe())); err != nil {
		fmt.Printf("This doesn't look like a Last Colony folder (no %s in %s).\n", gameExe(), dir)
		return 1
	}
	have := localVersion(dir)
	fmt.Printf("Last Colony updater\nInstalled version: %s\nChecking GitHub (%s) for a newer one...\n", orUnknown(have), cfg.Repo)

	rel, err := latest(cfg.Repo)
	if err != nil {
		fmt.Println("Could not check for updates:", err)
		return 1
	}
	want := strings.TrimPrefix(rel.Tag, "v")
	if have != "" && compareVersions(want, have) <= 0 {
		fmt.Printf("You have the newest version (%s).\n", have)
		return 0
	}
	var asset *struct {
		Name   string `json:"name"`
		URL    string `json:"browser_download_url"`
		API    string `json:"url"`
		Size   int64  `json:"size"`
		Digest string `json:"digest"`
	}
	for i := range rel.Assets {
		if rel.Assets[i].Name == cfg.Asset {
			asset = &rel.Assets[i]
		}
	}
	if asset == nil {
		fmt.Printf("Version %s is out, but it has no %s to download.\n", want, cfg.Asset)
		return 1
	}
	fmt.Printf("Version %s is available (%.0f MB).\n", want, float64(asset.Size)/1e6)
	if *check {
		return 0
	}
	if !*yes && !ask("Update now? Your saves are kept. [Y/n] ") {
		fmt.Println("Not updated.")
		return 0
	}
	if err := checkNotRunning(dir); err != nil {
		fmt.Println(err)
		return 1
	}

	tmp, err := os.MkdirTemp(dir, ".update-")
	if err != nil {
		fmt.Println("Could not make a folder for the download:", err)
		return 1
	}
	defer os.RemoveAll(tmp)
	zipPath := filepath.Join(tmp, cfg.Asset)
	if err := download(asset.API, asset.URL, zipPath, asset.Size); err != nil {
		fmt.Println("\nDownload failed:", err)
		return 1
	}
	if strings.HasPrefix(asset.Digest, "sha256:") {
		if err := checkSum(zipPath, strings.TrimPrefix(asset.Digest, "sha256:")); err != nil {
			fmt.Println(err)
			return 1
		}
		fmt.Println("Download checked.")
	}
	stage := filepath.Join(tmp, "new")
	if err := unzip(zipPath, stage); err != nil {
		fmt.Println("The download could not be unpacked:", err)
		return 1
	}
	root, err := gameRoot(stage)
	if err != nil {
		fmt.Println(err)
		return 1
	}
	if err := swapIn(dir, root); err != nil {
		fmt.Println("Update failed, your game was left as it was:", err)
		return 1
	}
	cleanOld(dir)
	fmt.Printf("Updated to version %s.\n", want)
	if !*noStart && !*yes && ask("Start Last Colony now? [Y/n] ") {
		cmd := exec.Command(filepath.Join(dir, gameExe()))
		cmd.Dir = dir
		_ = cmd.Start()
	}
	return 0
}

func orUnknown(s string) string {
	if s == "" {
		return "unknown"
	}
	return s
}

func ask(q string) bool {
	fmt.Print(q)
	line, _ := bufio.NewReader(os.Stdin).ReadString('\n')
	line = strings.TrimSpace(strings.ToLower(line))
	return line == "" || line == "y" || line == "yes"
}

// the version the game reports, from its own package.json
func localVersion(dir string) string {
	for _, p := range []string{
		filepath.Join(dir, "resources", "app", "package.json"),
		filepath.Join(dir, "Last Colony.app", "Contents", "Resources", "app", "package.json"),
	} {
		b, err := os.ReadFile(p)
		if err != nil {
			continue
		}
		var v struct {
			Version string `json:"version"`
		}
		if json.Unmarshal(b, &v) == nil {
			return v.Version
		}
	}
	return ""
}

// 1.2.10 is newer than 1.2.9; anything that is not a number compares as 0
func compareVersions(a, b string) int {
	pa, pb := strings.Split(a, "."), strings.Split(b, ".")
	for i := 0; i < len(pa) || i < len(pb); i++ {
		var x, y int
		if i < len(pa) {
			x, _ = strconv.Atoi(strings.SplitN(pa[i], "-", 2)[0])
		}
		if i < len(pb) {
			y, _ = strconv.Atoi(strings.SplitN(pb[i], "-", 2)[0])
		}
		if x != y {
			if x > y {
				return 1
			}
			return -1
		}
	}
	return 0
}

func apiBase() string {
	if v := os.Getenv("LC_UPDATE_API"); v != "" {
		return strings.TrimRight(v, "/")
	}
	return "https://api.github.com"
}

func get(url, accept string) (*http.Response, error) {
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("User-Agent", "LastColonyUpdater")
	req.Header.Set("Accept", accept)
	if t := os.Getenv("GITHUB_TOKEN"); t != "" {
		req.Header.Set("Authorization", "Bearer "+t)
	}
	c := &http.Client{Timeout: 30 * time.Minute}
	return c.Do(req)
}

func latest(repo string) (*release, error) {
	resp, err := get(apiBase()+"/repos/"+repo+"/releases/latest", "application/vnd.github+json")
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	switch resp.StatusCode {
	case 200:
	case 404:
		return nil, errors.New("no releases found (or the repository is private)")
	case 403, 429:
		return nil, errors.New("GitHub is limiting requests right now; try again in an hour")
	default:
		return nil, fmt.Errorf("GitHub answered %s", resp.Status)
	}
	var r release
	if err := json.NewDecoder(resp.Body).Decode(&r); err != nil {
		return nil, err
	}
	if r.Tag == "" {
		return nil, errors.New("the newest release has no version tag")
	}
	return &r, nil
}

func download(apiURL, url, path string, size int64) error {
	// with a token, a private repository's asset is fetched through the API; otherwise the public download link
	var resp *http.Response
	var err error
	if os.Getenv("GITHUB_TOKEN") != "" && apiURL != "" {
		resp, err = get(apiURL, "application/octet-stream")
	} else {
		resp, err = get(url, "application/octet-stream")
	}
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		return fmt.Errorf("server answered %s", resp.Status)
	}
	f, err := os.Create(path)
	if err != nil {
		return err
	}
	defer f.Close()
	var done int64
	buf := make([]byte, 1<<20)
	last := time.Now()
	for {
		n, rerr := resp.Body.Read(buf)
		if n > 0 {
			if _, werr := f.Write(buf[:n]); werr != nil {
				return werr
			}
			done += int64(n)
			if time.Since(last) > 300*time.Millisecond || rerr == io.EOF {
				last = time.Now()
				if size > 0 {
					fmt.Printf("\rDownloading... %3d%%", done*100/size)
				} else {
					fmt.Printf("\rDownloading... %d MB", done/1e6)
				}
			}
		}
		if rerr == io.EOF {
			break
		}
		if rerr != nil {
			return rerr
		}
	}
	fmt.Println()
	if size > 0 && done != size {
		return fmt.Errorf("got %d of %d bytes", done, size)
	}
	return nil
}

func checkSum(path, want string) error {
	f, err := os.Open(path)
	if err != nil {
		return err
	}
	defer f.Close()
	h := sha256.New()
	if _, err := io.Copy(h, f); err != nil {
		return err
	}
	if got := hex.EncodeToString(h.Sum(nil)); !strings.EqualFold(got, want) {
		return errors.New("the download is damaged (its checksum does not match); nothing was changed")
	}
	return nil
}

// unpacks the zip, refusing any entry that would land outside the folder
func unzip(src, dst string) error {
	r, err := zip.OpenReader(src)
	if err != nil {
		return err
	}
	defer r.Close()
	base, _ := filepath.Abs(dst)
	for _, f := range r.File {
		p := filepath.Join(base, filepath.FromSlash(f.Name))
		if p != base && !strings.HasPrefix(p, base+string(os.PathSeparator)) {
			return fmt.Errorf("unsafe path in the download: %s", f.Name)
		}
		if f.FileInfo().IsDir() {
			if err := os.MkdirAll(p, 0o755); err != nil {
				return err
			}
			continue
		}
		if err := os.MkdirAll(filepath.Dir(p), 0o755); err != nil {
			return err
		}
		mode := f.Mode()
		if f.Mode()&os.ModeSymlink != 0 {
			rc, err := f.Open()
			if err != nil {
				return err
			}
			target, _ := io.ReadAll(rc)
			rc.Close()
			t := string(target)
			if filepath.IsAbs(t) || strings.Contains(t, "..") {
				return fmt.Errorf("unsafe link in the download: %s", f.Name)
			}
			if err := os.Symlink(t, p); err != nil {
				return err
			}
			continue
		}
		rc, err := f.Open()
		if err != nil {
			return err
		}
		out, err := os.OpenFile(p, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, mode.Perm()|0o600)
		if err != nil {
			rc.Close()
			return err
		}
		_, err = io.Copy(out, rc)
		rc.Close()
		out.Close()
		if err != nil {
			return err
		}
	}
	return nil
}

// the zip holds one folder ("Last Colony-win32-x64") with the game in it
func gameRoot(stage string) (string, error) {
	if _, err := os.Stat(filepath.Join(stage, gameExe())); err == nil {
		return stage, nil
	}
	ents, err := os.ReadDir(stage)
	if err != nil {
		return "", err
	}
	for _, e := range ents {
		if e.IsDir() {
			if _, err := os.Stat(filepath.Join(stage, e.Name(), gameExe())); err == nil {
				return filepath.Join(stage, e.Name()), nil
			}
		}
	}
	return "", fmt.Errorf("the download has no %s in it; nothing was changed", gameExe())
}

// On Windows a running program's file cannot be renamed, so trying it tells us whether the game is open
func checkNotRunning(dir string) error {
	exe := filepath.Join(dir, gameExe())
	probe := exe + ".probe"
	if err := os.Rename(exe, probe); err != nil {
		return errors.New("Last Colony seems to be running. Close it, then run the updater again")
	}
	return os.Rename(probe, exe)
}

// Moves every top-level item in the folder aside (name.old), moves the new ones in, and puts everything back if any step fails.
// This program itself can be renamed while it runs but not replaced, so the new copy of it is put in place the same way.
func swapIn(dir, root string) error {
	ents, err := os.ReadDir(root)
	if err != nil {
		return err
	}
	type move struct{ from, to string }
	var done []move
	undo := func() {
		for i := len(done) - 1; i >= 0; i-- {
			_ = os.Rename(done[i].to, done[i].from)
		}
	}
	for _, e := range ents {
		name := e.Name()
		if name == "updater.json" {
			if _, err := os.Stat(filepath.Join(dir, name)); err == nil {
				continue // keep the local settings
			}
		}
		cur, nw, old := filepath.Join(dir, name), filepath.Join(root, name), filepath.Join(dir, name+".old")
		if _, err := os.Lstat(cur); err == nil {
			_ = os.RemoveAll(old)
			if err := os.Rename(cur, old); err != nil {
				undo()
				return fmt.Errorf("could not move %s aside: %w", name, err)
			}
			done = append(done, move{cur, old})
		}
		if err := os.Rename(nw, cur); err != nil {
			undo()
			return fmt.Errorf("could not put the new %s in place: %w", name, err)
		}
		done = append(done, move{nw, cur})
	}
	return nil
}

// removes what an earlier update moved aside (an old copy of this program can only go once it has stopped running)
func cleanOld(dir string) {
	ents, err := os.ReadDir(dir)
	if err != nil {
		return
	}
	for _, e := range ents {
		if strings.HasSuffix(e.Name(), ".old") || strings.HasPrefix(e.Name(), ".update-") {
			_ = os.RemoveAll(filepath.Join(dir, e.Name()))
		}
	}
}
