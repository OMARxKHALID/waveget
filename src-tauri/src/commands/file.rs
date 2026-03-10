use serde::{Deserialize, Serialize};
use std::process::Command;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DownloadRecord {
    pub id: String,
    pub title: String,
    pub path: Option<String>,
    pub thumbnail: Option<String>,
    pub mode: String,
    pub quality: Option<String>,
    pub audio_fmt: Option<String>,
    pub bitrate: Option<String>,
    pub status: String,
    pub progress: f64,
    pub file_size: Option<u64>,
    pub error: Option<String>,
    pub created_at: String,
}

fn history_path() -> std::path::PathBuf {
    let home = dirs::home_dir().unwrap_or_else(|| std::path::PathBuf::from("/tmp"));
    let dir = home.join(".config").join("waveget");
    let _ = std::fs::create_dir_all(&dir);
    dir.join("downloads.json")
}

fn load_history() -> Vec<DownloadRecord> {
    std::fs::read_to_string(history_path()).ok()
        .and_then(|s| serde_json::from_str(&s).ok())
        .unwrap_or_default()
}

fn save_history(records: &[DownloadRecord]) {
    if let Ok(j) = serde_json::to_string_pretty(records) {
        let _ = std::fs::write(history_path(), j);
    }
}

#[tauri::command]
pub async fn get_downloads() -> Result<Vec<DownloadRecord>, String> {
    let mut records = load_history();
    for r in &mut records {
        if r.status == "downloading" || r.status == "converting" {
            r.status = "error".into();
            r.error = Some("Interrupted (app was closed)".into());
        }
    }
    Ok(records)
}

#[tauri::command]
pub async fn save_download(record: DownloadRecord) -> Result<(), String> {
    let mut records = load_history();
    match records.iter().position(|r| r.id == record.id) {
        Some(i) => records[i] = record,
        None => records.insert(0, record),
    }
    records.truncate(500);
    save_history(&records);
    Ok(())
}

#[tauri::command]
pub async fn delete_file(path: String, id: String) -> Result<(), String> {
    let mut records = load_history();
    records.retain(|r| r.id != id);
    save_history(&records);
    if !path.is_empty() {
        let p = std::path::Path::new(&path);
        if p.exists() {
            std::fs::remove_file(p)
                .map_err(|e| format!("Cannot delete: {}", e))?;
        }
    }
    Ok(())
}

#[tauri::command]
pub async fn open_file(path: String) -> Result<(), String> {
    xdg_open(&path)
}

#[tauri::command]
pub async fn open_folder(path: String) -> Result<(), String> {
    let parent = std::path::Path::new(&path)
        .parent()
        .map(|p| p.to_string_lossy().to_string())
        .unwrap_or(path);
    xdg_open(&parent)
}

fn xdg_open(path: &str) -> Result<(), String> {
    Command::new("xdg-open")
        .arg(path)
        .spawn()
        .map_err(|e| format!("Cannot open {}: {}", path, e))?;
    Ok(())
}
