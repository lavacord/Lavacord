import WebSocket from "ws";
import { Manager } from "./Manager";
import { Player } from "./Player";
import { LavalinkNodeOptions, LavalinkStats, QueueData, WebsocketCloseEvent } from "./Types";

export class LavalinkNode {

    public id: string;
    public host: string;
    public port: number | string;
    public reconnectInterval: number;
    public password: string;
    public ws: WebSocket | null;
    public stats: LavalinkStats;
    public resumeKey?: string;

    private _reconnect?: NodeJS.Timeout;
    private _queue: QueueData[] = [];

    public constructor(public manager: Manager, options: LavalinkNodeOptions) {
        this.id = options.id;

        this.host = options.host;
        this.port = options.port || 2333;
        this.reconnectInterval = options.reconnectInterval || 5000;

        this.password = options.password || "youshallnotpass";

        this.ws = null;
        this.stats = {
            players: 0,
            playingPlayers: 0,
            uptime: 0,
            memory: {
                free: 0,
                used: 0,
                allocated: 0,
                reservable: 0
            },
            cpu: {
                cores: 0,
                systemLoad: 0,
                lavalinkLoad: 0
            }
        };
    }

    public async connect(): Promise<WebSocket | boolean> {
        this.ws = await new Promise((resolve, reject) => {
            if (this.connected) this.ws!.close();

            const headers: Record<string, string> = {
                Authorization: this.password,
                "Num-Shards": String(this.manager.shards || 1),
                "User-Id": this.manager.user
            };

            if (this.resumeKey) headers["Resume-Key"] = this.resumeKey;

            const ws = new WebSocket(`ws://${this.host}:${this.port}/`, { headers });

            const onEvent = (event: unknown): void => {
                ws.removeAllListeners();
                reject(event);
            };

            const onOpen = (): void => {
                ws.removeAllListeners();
                this.onOpen();
                resolve(ws);
            };

            ws
                .once("open", onOpen)
                .once("error", onEvent)
                .once("close", onEvent);
        });

        this.ws!
            .on("message", this.onMessage.bind(this))
            .on("error", this.onError.bind(this))
            .on("close", this.onClose.bind(this));
        return this.ws!;
    }

    private onOpen(): void {
        if (this._reconnect) clearTimeout(this._reconnect);
        this._queueFlush()
            .then(() => this.configureResuming())
            .catch(error => this.manager.emit("error", error, this));
        this.manager.emit("ready", this);
    }

    private onMessage(data: WebSocket.Data): void {
        if (Array.isArray(data)) data = Buffer.concat(data);
        else if (data instanceof ArrayBuffer) data = Buffer.from(data);

        const msg = JSON.parse(data.toString());

        if (msg.op && msg.op === "stats") this.stats = { ...msg };
        delete (this.stats as any).op;

        if (msg.guildId && this.manager.players.has(msg.guildId)) (this.manager.players.get(msg.guildId) as Player).emit(msg.op, msg);

        this.manager.emit("raw", msg, this);
    }

    private onError(event: { error: any; message: string; type: string; target: WebSocket; }): void {
        const error = event && event.error ? event.error : event;
        if (!error) return;

        this.manager.emit("error", error, this);
        this.reconnect();
    }

    private onClose(event: WebsocketCloseEvent): void {
        this.manager.emit("disconnect", event, this);
        if (event.code !== 1000 || event.reason !== "destroy") return this.reconnect();
    }

    public send(msg: object): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const parsed = JSON.stringify(msg);
            const queueData = { data: parsed, resolve, reject };

            if (this.connected) return this._send(queueData);
            else this._queue.push(queueData);
        });
    }

    public configureResuming(key: string = Date.now().toString(16), timeout = 120): Promise<boolean> {
        this.resumeKey = key;

        return this.send({ op: "configureResuming", key, timeout });
    }

    public destroy(): boolean {
        if (!this.connected) return false;
        this.ws!.close(1000, "destroy");
        this.ws = null;
        return true;
    }

    private reconnect(): void {
        this._reconnect = setTimeout(() => {
            this.ws!.removeAllListeners();
            this.ws = null;

            this.manager.emit("reconnecting", this);
            this.connect();
        }, this.reconnectInterval);
    }

    private _send({ data, resolve, reject }: QueueData): void {
        this.ws!.send(data, (error: Error | undefined) => {
            if (error) reject(error);
            else resolve(true);
        });
    }

    private async _queueFlush(): Promise<void> {
        await Promise.all(this._queue.map(this._send));
        this._queue = [];
    }

    public get connected(): boolean {
        if (!this.ws) return false;
        return this.ws!.readyState === WebSocket.OPEN;
    }

}
