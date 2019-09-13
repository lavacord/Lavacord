import * as WebSocket from "ws";
import { Manager } from "./Manager";
export declare class LavalinkNode {
    manager: Manager;
    id: string;
    host: string;
    port: number | string;
    reconnectInterval: number;
    password: string;
    ws: WebSocket | null;
    stats: LavalinkStats;
    resumeKey?: string;
    private _reconnect?;
    private _queue;
    constructor(manager: Manager, options: LavalinkNodeOptions);
    connect(): Promise<boolean>;
    private onOpen;
    private onMessage;
    private onError;
    private onClose;
    send(msg: object): Promise<boolean>;
    configureResuming(key?: string, timeout?: number): Promise<boolean>;
    destroy(): boolean;
    private reconnect;
    private _send;
    private _queueFlush;
    readonly connected: boolean;
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
