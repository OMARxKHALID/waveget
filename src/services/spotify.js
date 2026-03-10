import { invoke } from "@tauri-apps/api/core";

export async function getSpotifyTrack(url) {
  return await invoke("get_spotify_info", { url });
}

export function extractSpotifyId(url) {
  const match = url.match(/track\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}
