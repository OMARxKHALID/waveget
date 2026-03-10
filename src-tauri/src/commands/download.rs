use serde::{Deserialize, Serialize};
use std::io::{BufRead, BufReader};
use std::process::{Command, Stdio};
use std::sync::{Arc, Mutex};
use std::thread;
use tauri::{Emitter, WebviewWindow};
use anyhow::Result;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DownloadProgress {
    pub id: String,
    pub percent: f64,
    pub text: String,
    pub status: String,
    pub size: Option<u64>,
    pub path: Option<String>,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DependencyStatus {
    pub ytdlp: bool,
    pub ffmpeg: bool,
}

/// Find yt-dlp binary — checks system PATH, /usr/local/bin, and ~/.local/bin (pipx)
fn find_ytdlp() -> String {
    let candidates = [
        "yt-dlp",
        "/usr/local/bin/yt-dlp",
        "/usr/bin/yt-dlp",
    ];
    for c in &candidates {
        if Command::new(c).arg("--version")
            .stdout(Stdio::null()).stderr(Stdio::null())
            .status().map(|s| s.success()).unwrap_or(false)
        {
            return c.to_string();
        }
    }
    if let Some(home) = dirs::home_dir() {
        let p = home.join(".local").join("bin").join("yt-dlp");
        if p.exists() {
            return p.to_string_lossy().to_string();
        }
    }
    "yt-dlp".to_string()
}

fn emit_progress(window: &WebviewWindow, progress: DownloadProgress) {
    let _ = window.emit("download_progress", progress);
}

#[tauri::command]
pub async fn check_dependencies() -> Result<DependencyStatus, String> {
    let ytdlp_bin = find_ytdlp();
    let ytdlp = Command::new(&ytdlp_bin)
        .arg("--version")
        .stdout(Stdio::null()).stderr(Stdio::null())
        .status().map(|s| s.success()).unwrap_or(false);

    let ffmpeg = Command::new("ffmpeg")
        .arg("-version")
        .stdout(Stdio::null()).stderr(Stdio::null())
        .status().map(|s| s.success()).unwrap_or(false);

    Ok(DependencyStatus { ytdlp, ffmpeg })
}

#[tauri::command]
pub async fn get_default_folder() -> Result<String, String> {
    let home = dirs::home_dir()
        .unwrap_or_else(|| std::path::PathBuf::from("/tmp"))
        .to_string_lossy().to_string();
    let path = format!("{}/Downloads/Waveget", home);
    let _ = std::fs::create_dir_all(&path);
    Ok(path)
}

#[tauri::command]
pub fn start_download(
    window: WebviewWindow,
    id: String,
    url: String,
    mode: String,
    quality: String,
    audio_format: String,
    bitrate: String,
    output_dir: String,
    _title: String,
) -> Result<(), String> {
    let _ = std::fs::create_dir_all(&output_dir);

    thread::spawn(move || {
        let result = if mode == "video" {
            download_video(&window, &id, &url, &quality, &output_dir)
        } else {
            download_audio(&window, &id, &url, &audio_format, &bitrate, &output_dir)
        };

        match result {
            Ok(path) => {
                let file_size = std::fs::metadata(&path).map(|m| m.len()).ok();
                emit_progress(&window, DownloadProgress {
                    id, percent: 100.0, text: "Complete".into(),
                    status: "done".into(), size: file_size,
                    path: Some(path), error: None,
                });
            }
            Err(e) => {
                emit_progress(&window, DownloadProgress {
                    id, percent: 0.0, text: format!("Error: {}", e),
                    status: "error".into(), size: None, path: None,
                    error: Some(e.to_string()),
                });
            }
        }
    });

    Ok(())
}

fn download_audio(window: &WebviewWindow, id: &str, url: &str, format: &str, bitrate: &str, output_dir: &str) -> Result<String> {
    let bin = find_ytdlp();
    let uid = format!("wg_{}", std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH).unwrap_or_default().as_millis());
    let output_template = format!("{}/{}_%(title)s.%(ext)s", output_dir, uid);
    let audio_quality = format!("{}k", bitrate);

    emit_progress(window, DownloadProgress {
        id: id.into(), percent: 2.0, text: "Starting...".into(),
        status: "downloading".into(), size: None, path: None, error: None,
    });

    let mut child = Command::new(&bin)
        .args([
            "--no-playlist", "-x",
            "--audio-format", format,
            "--audio-quality", &audio_quality,
            "--embed-thumbnail", "--add-metadata",
            "--no-colors", "--newline", "--progress",
            "-o", &output_template,
            "--print", "after_move:%(filepath)s",
            url,
        ])
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| anyhow::anyhow!(
            "Could not start yt-dlp (tried: {})\nInstall: pipx install yt-dlp\nError: {}", bin, e
        ))?;

    run_with_progress(window, id, &mut child, false, &uid, output_dir)
}

fn download_video(window: &WebviewWindow, id: &str, url: &str, quality: &str, output_dir: &str) -> Result<String> {
    let bin = find_ytdlp();
    let uid = format!("wg_{}", std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH).unwrap_or_default().as_millis());
    let output_template = format!("{}/{}_%(title)s_{}p.%(ext)s", output_dir, uid, quality.trim_end_matches('p'));
    let height = quality.trim_end_matches('p');
    let fmt = format!(
        "bestvideo[height<={}][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<={}]+bestaudio/best[height<={}]/best",
        height, height, height
    );

    emit_progress(window, DownloadProgress {
        id: id.into(), percent: 2.0, text: "Starting...".into(),
        status: "downloading".into(), size: None, path: None, error: None,
    });

    let mut child = Command::new(&bin)
        .args([
            "--no-playlist", "-f", &fmt,
            "--merge-output-format", "mp4",
            "--embed-thumbnail", "--add-metadata",
            "--no-colors", "--newline", "--progress",
            "-o", &output_template,
            "--print", "after_move:%(filepath)s",
            url,
        ])
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| anyhow::anyhow!("Could not start yt-dlp: {}", e))?;

    run_with_progress(window, id, &mut child, true, &uid, output_dir)
}

fn run_with_progress(window: &WebviewWindow, id: &str, child: &mut std::process::Child, is_video: bool, uid: &str, output_dir: &str) -> Result<String> {
    let stdout = child.stdout.take().expect("stdout piped");
    let stderr = child.stderr.take().expect("stderr piped");

    let filepath: Arc<Mutex<Option<String>>> = Arc::new(Mutex::new(None));
    let fp_clone = Arc::clone(&filepath);

    let stdout_thread = thread::spawn(move || {
        for line in BufReader::new(stdout).lines().flatten() {
            let t = line.trim().to_string();
            if !t.is_empty() && (t.starts_with('/') || t.starts_with('~')) {
                *fp_clone.lock().unwrap() = Some(t);
            }
        }
    });

    let id_str = id.to_string();
    let window_ref = window.clone();
    let mut audio_phase = false;

    for line in BufReader::new(stderr).lines().flatten() {
        if line.starts_with("[download]") {
            if let Some(pct) = parse_percent(&line) {
                let display = if is_video {
                    if audio_phase { 50.0 + pct * 0.40 } else {
                        if pct >= 99.9 { audio_phase = true; }
                        pct * 0.50
                    }
                } else { pct * 0.90 };
                emit_progress(&window_ref, DownloadProgress {
                    id: id_str.clone(), percent: display.min(92.0),
                    text: clean_line(&line), status: "downloading".into(),
                    size: parse_size(&line), path: None, error: None,
                });
            }
        } else if line.starts_with("[Merger]") || line.contains("Merging") {
            emit_progress(&window_ref, DownloadProgress {
                id: id_str.clone(), percent: 93.0, text: "Merging video + audio...".into(),
                status: "converting".into(), size: None, path: None, error: None,
            });
        } else if line.starts_with("[ExtractAudio]") || line.starts_with("[ffmpeg]") {
            emit_progress(&window_ref, DownloadProgress {
                id: id_str.clone(), percent: 93.0, text: "Converting audio...".into(),
                status: "converting".into(), size: None, path: None, error: None,
            });
        } else if line.starts_with("[EmbedThumbnail]") || line.starts_with("[Metadata]") {
            emit_progress(&window_ref, DownloadProgress {
                id: id_str.clone(), percent: 97.0, text: "Embedding metadata...".into(),
                status: "converting".into(), size: None, path: None, error: None,
            });
        }
    }

    let _ = stdout_thread.join();
    let status = child.wait().map_err(|e| anyhow::anyhow!("process error: {}", e))?;
    if !status.success() {
        return Err(anyhow::anyhow!(
            "yt-dlp failed. Make sure both are installed:\n  pipx install yt-dlp\n  sudo apt install ffmpeg"
        ));
    }

    let printed = filepath.lock().unwrap().clone();
    if let Some(ref p) = printed {
        if std::path::Path::new(p).exists() { return Ok(p.clone()); }
    }
    find_by_uid(output_dir, uid).or_else(|_| find_latest(output_dir))
}

fn find_by_uid(dir: &str, uid: &str) -> Result<String> {
    for e in std::fs::read_dir(dir)?.flatten() {
        let p = e.path();
        if p.is_file() {
            if let Some(n) = p.file_name().and_then(|n| n.to_str()) {
                if n.starts_with(uid) { return Ok(p.to_string_lossy().into()); }
            }
        }
    }
    Err(anyhow::anyhow!("not found"))
}

fn find_latest(dir: &str) -> Result<String> {
    let mut latest: Option<(std::time::SystemTime, String)> = None;
    for e in std::fs::read_dir(dir)?.flatten() {
        let p = e.path();
        if p.is_file() {
            if let Ok(m) = e.metadata().and_then(|m| m.modified()) {
                let ps = p.to_string_lossy().into();
                match &latest {
                    None => latest = Some((m, ps)),
                    Some((t, _)) if m > *t => latest = Some((m, ps)),
                    _ => {}
                }
            }
        }
    }
    latest.map(|(_, p)| p).ok_or_else(|| anyhow::anyhow!("no files found"))
}

fn parse_percent(line: &str) -> Option<f64> {
    let s = line.trim_start_matches("[download]").trim();
    let idx = s.find('%')?;
    s[..idx].trim().parse::<f64>().ok()
}

fn parse_size(line: &str) -> Option<u64> {
    let parts: Vec<&str> = line.split_whitespace().collect();
    for (i, &p) in parts.iter().enumerate() {
        if p == "of" { return parts.get(i + 1).and_then(|s| parse_size_str(s)); }
    }
    None
}

fn parse_size_str(s: &str) -> Option<u64> {
    let (n, m): (&str, u64) = if let Some(x) = s.strip_suffix("GiB") { (x, 1<<30) }
        else if let Some(x) = s.strip_suffix("MiB") { (x, 1<<20) }
        else if let Some(x) = s.strip_suffix("KiB") { (x, 1<<10) }
        else if let Some(x) = s.strip_suffix("GB")  { (x, 1_000_000_000) }
        else if let Some(x) = s.strip_suffix("MB")  { (x, 1_000_000) }
        else if let Some(x) = s.strip_suffix("KB")  { (x, 1_000) }
        else { return None; };
    n.parse::<f64>().ok().map(|v| (v * m as f64) as u64)
}

fn clean_line(line: &str) -> String {
    line.trim_start_matches("[download]").trim()
        .split_whitespace().collect::<Vec<_>>().join(" ")
}
