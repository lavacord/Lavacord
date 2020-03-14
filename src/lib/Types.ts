import { Player } from "./Player";
import WebSocket from "ws";

export interface LavalinkEvent {
    type: "TrackEndEvent" | "TrackExceptionEvent" | "TrackStuckEvent" | "WebSocketClosedEvent";
    reason?: "FINISHED" | "LOAD_FAILED" | "STOPPED" | "REPLACED" | "CLEANUP";
}

export interface LavalinkPlayerState {
    time?: number;
    position?: number;
}

export interface PlayerOptions {
    id: string;
    channel: string;
}

export interface PlayerState extends LavalinkPlayerState {
    volume: number;
    equalizer: PlayerEqualizerBand[];
}

export interface PlayerPlayOptions {
    startTime?: number;
    endTime?: number;
    noReplace?: boolean;
    pause?: boolean;
    volume?: number;
}

export interface PlayerEqualizerBand {
    band: number;
    gain: number;
}

export interface PlayerUpdateVoiceState {
    sessionId: string;
    event: {
        token: string;
        guild_id: string;
        endpoint: string;
    };
}

export interface ManagerOptions {
    user: string;
    shards?: number;
    Player?: Player;
    send: (packet: DiscordPacket) => unknown;
}

export interface JoinData {
    guild: string;
    channel: string;
    node: string;
}

export interface JoinOptions {
    selfmute?: boolean;
    selfdeaf?: boolean;
}

export interface VoiceServerUpdate {
    token: string;
    guild_id: string;
    endpoint: string;
}

export interface VoiceStateUpdate {
    guild_id: string;
    channel_id?: string;
    user_id: string;
    session_id: string;
    deaf?: boolean;
    mute?: boolean;
    self_deaf?: boolean;
    self_mute?: boolean;
    suppress?: boolean;
}

export interface DiscordPacket {
    op: number;
    d: any;
    s?: number;
    t?: string;
}

export interface LavalinkNodeOptions {
    id: string;
    host: string;
    port?: number | string;
    password?: string;
    reconnectInterval?: number;
}

export interface LavalinkStats {
    players: number;
    playingPlayers: number;
    uptime: number;
    memory: {
        free: number;
        used: number;
        allocated: number;
        reservable: number;
    };
    cpu: {
        cores: number;
        systemLoad: number;
        lavalinkLoad: number;
    };
    frameStats?: {
        sent?: number;
        nulled?: number;
        deficit?: number;
    };
}

export interface QueueData {
    data: string;
    resolve: (value?: boolean | PromiseLike<boolean> | undefined) => void;
    reject: (reason?: any) => void;
}

export interface WebsocketCloseEvent {
    wasClean: boolean;
    code: number;
    reason: string;
    target: WebSocket;
}
