/**
 * Live collaboration module — TeamMind exclusive feature.
 * Uses CRDT (Yjs) over TeamMind WebSocket for real-time editing.
 *
 * This module provides the interface and types.
 * Actual WebSocket connection requires TeamMind infrastructure.
 */

export interface CollabConfig {
  channel: string;
  wsUrl: string;
  token: string;
  userId: string;
  userName: string;
}

export interface CollabUser {
  id: string;
  name: string;
  color: string;
  cursor?: { line: number; column: number };
}

export interface CollabState {
  connected: boolean;
  channel: string;
  users: CollabUser[];
  lastSync: Date | null;
}

export type CollabEvent =
  | { type: "connected"; channel: string }
  | { type: "disconnected"; reason: string }
  | { type: "user-joined"; user: CollabUser }
  | { type: "user-left"; userId: string }
  | { type: "remote-update"; content: string }
  | { type: "cursor-update"; userId: string; cursor: { line: number; column: number } };

/**
 * CollabSession manages a collaborative editing session.
 * Requires Yjs and y-websocket (not bundled — TeamMind app provides these).
 */
export class CollabSession {
  private config: CollabConfig;
  private state: CollabState;
  private listeners: Set<(event: CollabEvent) => void> = new Set();

  constructor(config: CollabConfig) {
    this.config = config;
    this.state = {
      connected: false,
      channel: config.channel,
      users: [],
      lastSync: null,
    };
  }

  /**
   * Connect to the collaboration server.
   * Requires TeamMind WebSocket infrastructure.
   */
  async connect(): Promise<void> {
    // TODO: Implement when TeamMind WebSocket server is available
    // Will use: const doc = new Y.Doc(); const provider = new WebsocketProvider(wsUrl, channel, doc);
    throw new Error(
      "Live collaboration requires TeamMind infrastructure.\n" +
      "This feature is not available in the open-source version.\n" +
      "Visit https://team-mind.eu for more information."
    );
  }

  disconnect(): void {
    this.state.connected = false;
    this.emit({ type: "disconnected", reason: "manual" });
  }

  getState(): CollabState {
    return { ...this.state };
  }

  onEvent(listener: (event: CollabEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(event: CollabEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}
