package main

import (
	"os/exec"
	"syscall"
)

// no console window flashing up for the helper programs
func hideWindow(cmd *exec.Cmd) {
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true, CreationFlags: 0x08000000} // CREATE_NO_WINDOW
}
