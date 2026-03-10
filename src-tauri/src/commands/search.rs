use serde::{Deserialize, Serialize};
use std::process::Command;
use anyhow::Result;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MediaInfo {
    pub id: String,
    pub title: String,
    pub url: Option<String>,
    pub webpage_url: Option<String>,
    pub thumbnail: Option<String>,
    pub duration: Option<f64>,
    pub channel: Option<String>,
    pub uploader: Option<String>,
    pub view_count: Option<u64>,
    pub source: Option<String>,
}

/// Find yt-dlp binary across common install locations including pipx
fn find_ytdlp() -> String {
    let candidates = [
        "yt-dlp",                          // system PATH
        "/usr/local/bin/yt-dlp",           // manual install
        "/usr/bin/yt-dlp",                 // apt install
    ];

    for c in &candidates {
        if Command::new(c).arg("--version")
            .stdout(std::process::Stdio::null())
            .stderr(std::process::Stdio::null())
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

fn ytdlp_json(args: &[&str]) -> Result<serde_json::Value> {
    let bin = find_ytdlp();
    let out = Command::new(&bin)
        .args(args)
        .output()
        .map_err(|e| anyhow::anyhow!(
            "yt-dlp not found at '{}'. Install with:\n  pipx install yt-dlp\nor:\n  sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && sudo chmod +x /usr/local/bin/yt-dlp\nError: {}", bin, e
        ))?;

    if !out.status.success() {
        return Err(anyhow::anyhow!(
            "yt-dlp error: {}",
            String::from_utf8_lossy(&out.stderr).trim()
        ));
    }

    let stdout = String::from_utf8_lossy(&out.stdout);
    if stdout.trim().is_empty() {
        return Err(anyhow::anyhow!("yt-dlp returned no output"));
    }

    serde_json::from_str(stdout.trim())
        .map_err(|e| anyhow::anyhow!("JSON parse error: {}", e))
}

fn to_media(v: &serde_json::Value) -> MediaInfo {
    let id = v["id"].as_str().unwrap_or("unknown").to_string();
    let webpage_url = v["webpage_url"].as_str().map(String::from)
        .or_else(|| Some(format!("https://www.youtube.com/watch?v={}", id)));
    let thumbnail = v["thumbnail"].as_str().map(String::from)
        .or_else(|| v["thumbnails"].as_array()
            .and_then(|a| a.last())
            .and_then(|t| t["url"].as_str())
            .map(String::from))
        .or_else(|| Some(format!("https://img.youtube.com/vi/{}/mqdefault.jpg", id)));
    let channel = v["channel"].as_str()
        .or_else(|| v["uploader"].as_str())
        .map(String::from);

    MediaInfo {
        id,
        title: v["title"].as_str().unwrap_or("Unknown").to_string(),
        url: webpage_url.clone(),
        webpage_url,
        thumbnail,
        duration: v["duration"].as_f64(),
        channel: channel.clone(),
        uploader: v["uploader"].as_str().map(String::from).or(channel),
        view_count: v["view_count"].as_u64(),
        source: Some("youtube".into()),
    }
}

#[tauri::command]
pub async fn search_youtube(query: String) -> Result<Vec<MediaInfo>, String> {
    let search = format!("ytsearch8:{}", query);
    let val = ytdlp_json(&[
        "--flat-playlist", "--dump-single-json",
        "--no-warnings", "--no-playlist", &search,
    ]).map_err(|e| e.to_string())?;

    let entries = if let Some(arr) = val["entries"].as_array() {
        arr.iter().map(to_media).collect()
    } else {
        vec![to_media(&val)]
    };
    Ok(entries)
}

#[tauri::command]
pub async fn get_youtube_info(url: String) -> Result<MediaInfo, String> {
    let val = ytdlp_json(&[
        "--dump-single-json", "--no-warnings", "--no-playlist", &url,
    ]).map_err(|e| e.to_string())?;
    Ok(to_media(&val))
}

#[tauri::command]
pub async fn get_spotify_info(url: String) -> Result<MediaInfo, String> {
    match ytdlp_json(&["--dump-single-json", "--no-warnings", "--no-playlist", &url]) {
        Ok(v) => {
            let mut info = to_media(&v);
            info.source = Some("spotify".into());
            let needs_yt = info.webpage_url.as_deref()
                .map(|u| !u.contains("youtube.com") && !u.contains("youtu.be"))
                .unwrap_or(true);
            if needs_yt {
                let q = format!("{} {}", info.title, info.uploader.as_deref().unwrap_or(""));
                let results = search_youtube(q).await?;
                if let Some(first) = results.into_iter().next() {
                    info.webpage_url = first.webpage_url;
                    info.url = first.url;
                    info.thumbnail = info.thumbnail.or(first.thumbnail);
                    if info.duration.is_none() { info.duration = first.duration; }
                }
            }
            Ok(info)
        }
        Err(_) => {
            let results = search_youtube(url).await?;
            results.into_iter().next()
                .ok_or_else(|| "No results found".into())
        }
    }
}
