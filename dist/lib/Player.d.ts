/// <reference types="node" />
import { EventEmitter } from "events";
import { LavalinkNode } from "./LavalinkNode";
import { Manager } from "./Manager";
import { LavalinkEvent, LavalinkPlayerState, PlayerEqualizerBand, PlayerPlayOptions, PlayerState, PlayerUpdateVoiceState } from "./Types";
export declare class Player extends EventEmitter {
    node: LavalinkNode;
    id: string;
    manager: Manager;
    state: PlayerState;
    playing: boolean;
    timestamp: number | null;
    paused: boolean;
    track: string | null;
    voiceUpdateState: PlayerUpdateVoiceState | null;
    constructor(node: LavalinkNode, id: string);
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
    on(event: "start", listener: (data: LavalinkEvent) => void): this;
    on(event: "end", listener: (data: LavalinkEvent) => void): this;
    on(event: "error", listener: (error: LavalinkEvent) => void): this;
    on(event: "warn", listener: (warning: string) => void): this;
    on(event: "playerUpdate", listener: (data: {
        state: LavalinkPlayerState;
    }) => void): this;
    once(event: "event", listener: (data: LavalinkEvent) => void): this;
    once(event: "start", listener: (data: LavalinkEvent) => void): this;
    once(event: "end", listener: (data: LavalinkEvent) => void): this;
    once(event: "error", listener: (error: LavalinkEvent) => void): this;
    once(event: "warn", listener: (warning: string) => void): this;
    once(event: "playerUpdate", listener: (data: {
        state: LavalinkPlayerState;
    }) => void): this;
    off(event: "event", listener: (data: LavalinkEvent) => void): this;
    off(event: "start", listener: (data: LavalinkEvent) => void): this;
    off(event: "end", listener: (data: LavalinkEvent) => void): this;
    off(event: "error", listener: (error: LavalinkEvent) => void): this;
    off(event: "warn", listener: (warning: string) => void): this;
    off(event: "playerUpdate", listener: (data: {
        state: LavalinkPlayerState;
    }) => void): this;
    emit(event: "event", data: LavalinkEvent): boolean;
    emit(event: "start", data: LavalinkEvent): boolean;
    emit(event: "end", data: LavalinkEvent): boolean;
    emit(event: "error", error: LavalinkEvent): boolean;
    emit(event: "warn", warning: string): boolean;
    emit(event: "playerUpdate", data: {
        state: LavalinkPlayerState;
    }): boolean;
}
