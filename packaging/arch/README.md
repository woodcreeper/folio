# Experimental Omarchy / Arch packaging

SlayDown was confirmed working on a physical **x86_64 Omarchy 4.0.4-1** machine by the user on September 18, 2026. The installation method was not specified. **The experimental package and workflow in this directory remain unverified and are not part of the published release.**

Omarchy is based on Arch and Hyprland. Before committing to a dedicated SlayDown integration, investigate its existing Markdown viewing capabilities and current plugin model. The user's machine is available for further packaging and desktop integration checks.

The draft `PKGBUILD.in` repackages the Ubuntu-built Linux binary with Arch dependencies, a desktop entry, icons, and the MIT license. Building the binary on Ubuntu 22.04 avoids tying it to a newer glibc than Omarchy's delayed Arch mirror. `scripts/package-arch.sh` generates actual checksums from the selected build artifact; it never installs a `.deb` through pacman.

The separate **Experimental Arch and Wayland check** workflow is manual only. Pass a successful main build run ID. It attempts to make and install the native Arch package, validate its desktop entry and shared libraries, and launch SlayDown under headless Weston. Its disposable container permits nested user namespaces so WebKit can keep its sandbox; product sandbox settings are unchanged.

The startup check observes a native window and a Wayland buffer. It does not prove Markdown content, file-picker portals, editor launch, or Hyprland behavior. The user's successful SlayDown test provides separate hardware evidence, but does not validate this packaging workflow.

## Next-session checks

1. Read [Omarchy's current manual](https://omarchy.org/manual/) and [plugin catalog](https://plugins.omarchy.org/). Determine whether an existing tool already meets the user's needs and whether a plugin is the better integration.
2. If SlayDown adds value, run the experimental workflow and resolve any failures. No Arch package or AUR listing is currently published.
3. Record the installation method used for the successful test, then verify any remaining desktop behaviors: app launcher visibility, Markdown file association, light/dark styles, HiDPI, file picker, external editor launch, atomic saves/live refresh, and uninstall.
4. Verify which terminal editors need a terminal wrapper. SlayDown currently launches a selected executable directly; choosing terminal-only Neovim is not sufficient to open a terminal window.
5. Only after validation, decide whether to include Arch packages in releases or implement Omarchy's plugin format.
