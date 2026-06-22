-- HRS · Hybrid Readiness Score — preview launcher
-- Source for HRS.app. Compiled by scripts/build-app.sh, which bakes the repo
-- path into @@REPO@@ so the .app keeps working even if you drag it elsewhere
-- (e.g. into /Applications or the Dock).
on run
	set launcher to "@@REPO@@/scripts/launch.command"
	-- Use `open -a Terminal` (not AppleScript control of Terminal) so no
	-- Automation permission prompt is needed.
	do shell script "open -a Terminal " & quoted form of launcher
end run
