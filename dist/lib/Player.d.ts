/// <reference types="node" />
import { EventEmitter } from "events";
import { Manager } from "./Manager";
import { LavalinkNode } from "./LavalinkNode";
export declare class Player extends EventEmitter {
    node: LavalinkNode;
    manager: Manager;
    id: string;
    state: PlayerState;
    playing: boolean;
    timestamp: number | null;
    paused: boolean;
    track: string | null;
    voiceUpdateState: PlayerUpdateVoiceState | null;
    constructor(node: LavalinkNode, options: PlayerOptions);
    play(track: string, options?: PlayerPlayOptions): Promise<boolean>;
    stop(): Promise<boolean>;
    pause(pause: boolean): Promise<boolean>;
    resume(): Promise<boolean>;
    volume(volume: number): Promise<boolean>;
    seek(position: number): Promise<boolean>;
    equalizer(bands: PlayerEqualizerBand[]): Promise<boolean>;
    destroy(): Promise<boolean>;
    connect(data: PlayerUpdateVoiceState): Promise<boolean>;
    private send;
}
export interface Player {
    on(event: "event", listener: (data: LavalinkEvent) => void): this;
    on(event: "end", listener: (data: LavalinkEvent) => void): this;
    on(event: "error", listener: (error: LavalinkEvent) => void): this;
    on(event: "warn", listener: (warning: string) => void): this;
    on(event: "playerUpdate", listener: (data: {
        state: LavalinkPlayerState;
    }) => void): this;
    once(event: "event", listener: (data: LavalinkEvent) => void): this;
    once(event: "end", listener: (data: LavalinkEvent) => void): this;
    once(event: "error", listener: (error: LavalinkEvent) => void): this;
    once(event: "warn", listener: (warning: string) => void): this;
    once(event: "playerUpdate", listener: (data: {
        state: LavalinkPlayerState;
    }) => void): this;
    off(event: "event", listener: (data: LavalinkEvent) => void): this;
    off(event: "end", listener: (data: LavalinkEvent) => void): this;
    off(event: "error", listener: (error: LavalinkEvent) => void): this;
    off(event: "warn", listener: (warning: string) => void): this;
    off(event: "playerUpdate", listener: (data: {
        state: LavalinkPlayerState;
    }) => void): this;
    emit(event: "event", data: LavalinkEvent): boolean;
    emit(event: "end", data: LavalinkEvent): boolean;
    emit(event: "error", error: LavalinkEvent): boolean;
    emit(event: "warn", warning: string): boolean;
    emit(event: "playerUpdate", data: {
        state: LavalinkPlayerState;
    }): boolean;
}
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
