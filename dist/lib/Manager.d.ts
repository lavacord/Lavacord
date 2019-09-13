/// <reference types="node" />
import { EventEmitter } from "events";
import { LavalinkNode, LavalinkNodeOptions, WebsocketCloseEvent } from "./LavalinkNode";
import { Player } from "./Player";
export declare class Manager extends EventEmitter {
    nodes: Map<string, LavalinkNode>;
    players: Map<string, Player>;
    voiceServers: Map<string, VoiceServerUpdate>;
    voiceStates: Map<string, VoiceStateUpdate>;
    user: string;
    shards: number;
    private Player;
    private send;
    constructor(nodes: LavalinkNodeOptions[], options: ManagerOptions);
    connect(): Promise<boolean[]>;
    createNode(options: LavalinkNodeOptions): LavalinkNode;
    removeNode(id: string): boolean;
    join(data: JoinData, { selfmute, selfdeaf }?: JoinOptions): Promise<Player>;
    leave(guild: string): Promise<boolean>;
    switch(player: Player, node: LavalinkNode): Promise<Player>;
    voiceServerUpdate(data: VoiceServerUpdate): Promise<boolean>;
    voiceStateUpdate(data: VoiceStateUpdate): Promise<boolean>;
    private _attemptConnection;
    private spawnPlayer;
}
export interface Manager {
    on(event: "ready", listener: (node: LavalinkNode) => void): this;
    on(event: "raw", listener: (message: unknown, node: LavalinkNode) => void): this;
    on(event: "error", listener: (error: unknown, node: LavalinkNode) => void): this;
    on(event: "disconnect", listener: (eventData: WebsocketCloseEvent, node: LavalinkNode) => void): this;
    on(event: "reconnecting", listener: (node: LavalinkNode) => void): this;
    once(event: "ready", listener: (node: LavalinkNode) => void): this;
    once(event: "raw", listener: (message: unknown, node: LavalinkNode) => void): this;
    once(event: "error", listener: (error: unknown, node: LavalinkNode) => void): this;
    once(event: "disconnect", listener: (eventData: WebsocketCloseEvent, node: LavalinkNode) => void): this;
    once(event: "reconnecting", listener: (node: LavalinkNode) => void): this;
    off(event: "ready", listener: (node: LavalinkNode) => void): this;
    off(event: "raw", listener: (message: unknown, node: LavalinkNode) => void): this;
    off(event: "error", listener: (error: unknown, node: LavalinkNode) => void): this;
    off(event: "disconnect", listener: (eventData: WebsocketCloseEvent, node: LavalinkNode) => void): this;
    off(event: "reconnecting", listener: (node: LavalinkNode) => void): this;
    emit(event: "ready", node: LavalinkNode): boolean;
    emit(event: "raw", message: unknown, node: LavalinkNode): boolean;
    emit(event: "error", error: unknown, node: LavalinkNode): boolean;
    emit(event: "disconnect", eventData: WebsocketCloseEvent, node: LavalinkNode): boolean;
    emit(event: "reconnecting", node: LavalinkNode): boolean;
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
