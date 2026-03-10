mod commands {
    pub mod download;
    pub mod file;
    pub mod search;
}

use commands::download::*;
use commands::file::*;
use commands::search::*;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    if let Some(home) = dirs::home_dir() {
        let _ = std::fs::create_dir_all(home.join(".config").join("waveget"));
        let _ = std::fs::create_dir_all(home.join("Downloads").join("Waveget"));
    }

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            // Search
            search_youtube,
            get_youtube_info,
            get_spotify_info,
            // Download
            start_download,
            check_dependencies,
            get_default_folder,
            // File management
            get_downloads,
            save_download,
            delete_file,
            open_file,
            open_folder,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
