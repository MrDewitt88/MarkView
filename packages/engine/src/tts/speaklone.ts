/**
 * Speaklone Local API client.
 *
 * The Speaklone API triggers local audio playback — it does NOT return audio data.
 * `/speak` sends text, Speaklone plays it locally, and returns `{"status":"ok"}`.
 */

export interface SpeakloneConfig {
  endpoint: string;
  token: string;
  voice?: string;
  instruction?: string;
  temperature?: number;
}

export interface SpeakloneVoice {
  id: string;
  name: string;
  gender: string;
  description: string;
  type: string;
}

export interface SpeakResult {
  success: boolean;
  error?: string;
}

const DEFAULT_ENDPOINT = "http://localhost:7849";

function baseUrl(config: Partial<SpeakloneConfig>): string {
  // Strip trailing slashes and any /speak, /status, /voices path suffixes
  // so users can paste the full URL or just the base
  return (config.endpoint ?? DEFAULT_ENDPOINT)
    .replace(/\/+$/, "")
    .replace(/\/(speak|status|voices)$/, "");
}

/**
 * Check if Speaklone is running (does not require auth).
 */
export async function isAvailable(config?: Partial<SpeakloneConfig>): Promise<boolean> {
  try {
    const res = await fetch(`${baseUrl(config ?? {})}/status`);
    if (!res.ok) return false;
    const data = (await res.json()) as { status?: string };
    return data.status === "ok";
  } catch {
    return false;
  }
}

/**
 * Get available voices (requires auth).
 */
export async function getVoices(config: SpeakloneConfig): Promise<SpeakloneVoice[]> {
  const res = await fetch(`${baseUrl(config)}/voices`, {
    headers: { Authorization: `Bearer ${config.token}` },
  });

  if (res.status === 401) {
    throw new Error("Speaklone rejected the token.");
  }
  if (!res.ok) {
    throw new Error(`Speaklone /voices returned ${res.status}`);
  }

  return (await res.json()) as SpeakloneVoice[];
}

/**
 * Send text to Speaklone for local playback.
 * Returns immediately — audio plays in the Speaklone app.
 */
export async function speak(text: string, config: SpeakloneConfig): Promise<SpeakResult> {
  if (!text.trim()) {
    return { success: false, error: "Empty text" };
  }

  let res: Response;
  try {
    res = await fetch(`${baseUrl(config)}/speak`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.token}`,
      },
      body: JSON.stringify({
        text,
        ...(config.voice && { voice: config.voice }),
        ...(config.instruction && { instruction: config.instruction }),
        ...(config.temperature != null && { temperature: config.temperature }),
      }),
    });
  } catch {
    return { success: false, error: "Speaklone is not running." };
  }

  if (res.status === 401) {
    return { success: false, error: "Speaklone rejected the token." };
  }

  const data = (await res.json()) as { status?: string; error?: string };

  if (data.error) {
    return { success: false, error: data.error };
  }

  return { success: true };
}
