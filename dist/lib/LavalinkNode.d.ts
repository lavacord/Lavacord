import WebSocket from "ws";
import { Manager } from "./Manager";
import { LavalinkNodeOptions, LavalinkStats } from "./Types";
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
    connect(): Promise<WebSocket | boolean>;
    send(msg: object): Promise<boolean>;
    configureResuming(key?: string, timeout?: number): Promise<boolean>;
    destroy(): boolean;
    get connected(): boolean;
    private onOpen;
    private onMessage;
    private onError;
    private onClose;
    private reconnect;
    private _send;
    private _queueFlush;
}
