/// <reference types="node" />
import { EventEmitter } from "events";
import { JoinData, VoiceServerUpdate, VoiceStateUpdate, DiscordPacket, ManagerOptions, JoinOptions, LavalinkNodeOptions, WebsocketCloseEvent } from "./Types";
import { LavalinkNode } from "./LavalinkNode";
import { Player } from "./Player";
import WebSocket from "ws";
export declare class Manager extends EventEmitter {
    nodes: Map<string, LavalinkNode>;
    players: Map<string, Player>;
    voiceServers: Map<string, VoiceServerUpdate>;
    voiceStates: Map<string, VoiceStateUpdate>;
    user: string;
    shards: number;
    send?: (packet: DiscordPacket) => unknown;
    private Player;
    constructor(nodes: LavalinkNodeOptions[], options: ManagerOptions);
    connect(): Promise<Array<WebSocket | boolean>>;
    createNode(options: LavalinkNodeOptions): LavalinkNode;
    removeNode(id: string): boolean;
    join(data: JoinData, { selfmute, selfdeaf }?: JoinOptions): Promise<Player>;
    leave(guild: string): Promise<boolean>;
    switch(player: Player, node: LavalinkNode): Promise<Player>;
    voiceServerUpdate(data: VoiceServerUpdate): Promise<boolean>;
    voiceStateUpdate(data: VoiceStateUpdate): Promise<boolean>;
    get idealNodes(): LavalinkNode[];
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
