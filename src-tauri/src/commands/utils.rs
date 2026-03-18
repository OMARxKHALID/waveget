use std::process::{Command, Stdio};

pub fn find_ytdlp() -> String {
    let candidates = [
        "yt-dlp",
        "/usr/local/bin/yt-dlp",
        "/usr/bin/yt-dlp",
    ];

    for c in &candidates {
        if Command::new(c).arg("--version")
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .status().map(|s| s.success()).unwrap_or(false)
        {
            return c.to_string();
        }
    }

    // Try home dir based paths (pipx installs to ~/.local/bin)
    if let Some(home) = dirs::home_dir() {
        let pipx_path = home.join(".local").join("bin").join("yt-dlp");
        if pipx_path.exists() {
            return pipx_path.to_string_lossy().to_string();
        }
    }

    // Last resort: return plain name and let OS resolve it
    "yt-dlp".to_string()
}
