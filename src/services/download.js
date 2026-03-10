import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

export async function invokeCmd(cmd, args) {
  return invoke(cmd, args);
}

export async function listenProgress(callback) {
  return listen("download_progress", (e) => callback(e.payload));
}

export async function getDefaultFolder() {
  return invoke("get_default_folder");
}

export async function checkDependencies() {
  return invoke("check_dependencies");
}

export function formatBytes(bytes) {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function formatDuration(seconds) {
  if (!seconds) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
