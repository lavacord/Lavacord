import WebSocket from "ws";
import { Manager } from "./Manager";
import { Player } from "./Player";
import { LavalinkNodeOptions, LavalinkStats, QueueData, WebsocketCloseEvent } from "./Types";

/**
 * The class for handling everything to do with connecting to Lavalink
 */
export class LavalinkNode {

    /**
     * The id of the LavalinkNode so Nodes are better organized
     */
    public id: string;
    /**
     * The host of the LavalinkNode, this could be a ip or domain.
     */
    public host = "localhost";
    /**
     * The port of the LavalinkNode
     */
    public port: number | string = 2333;
    /**
     * The interval that the node will try to reconnect to lavalink at in milliseconds
     */
    public reconnectInterval = 10000;
    /**
     * The password of the lavalink node
     */
    public password = "youshallnotpass";
    /**
     * The WebSocket instance for this LavalinkNode
     */
    public ws: WebSocket | null = null;
    /**
     * The statistics of the LavalinkNode
     */
    public stats: LavalinkStats;
    /**
     * The resume key to send to the LavalinkNode so you can resume properly
     */
    public resumeKey?: string;
    /**
     * The resume timeout
     */
    public resumeTimeout = 120;
    /**
     * Extra info attached to your node, not required and is not sent to lavalink, purely for you.
     */
    public state?: any;

    /**
     * The reconnect timeout
     * @private
     */
    private _reconnect?: NodeJS.Timeout;
    /**
     * The queue for send
     * @private
     */
    private _queue: QueueData[] = [];

    /**
     * The base of the connection to lavalink
     * @param manager The manager that created the LavalinkNode
     * @param options The options of the LavalinkNode {@link LavalinkNodeOptions}
     */
    public constructor(public manager: Manager, options: LavalinkNodeOptions) {
        this.id = options.id;

        if (options.host) Object.defineProperty(this, "host", { value: options.host });
        if (options.port) Object.defineProperty(this, "port", { value: options.port });
        if (options.password) Object.defineProperty(this, "password", { value: options.password });
        if (options.reconnectInterval) this.reconnectInterval = options.reconnectInterval;
        if (options.resumeKey) this.resumeKey = options.resumeKey;
        if (options.resumeTimeout) this.resumeTimeout = options.resumeTimeout;
        if (options.state) this.state = options.state;

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

    /**
     * Connects the node to Lavalink
     */
    public async connect(): Promise<WebSocket | boolean> {
        this.ws = await new Promise((resolve, reject) => {
            if (this.connected) this.ws!.close();

            const headers: Record<string, string> = {
                Authorization: this.password,
                "Num-Shards": String(this.manager.shards || 1),
                "User-Id": this.manager.user!
            };

            if (this.resumeKey) headers["Resume-Key"] = this.resumeKey;

            const ws = new WebSocket(`ws://${this.host}:${this.port}/`, { headers });

            const onEvent = (event: unknown): void => {
                ws.removeAllListeners();
                reject(event);
            };

            const onOpen = (): void => {
                this.onOpen();
                ws.removeAllListeners();
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

    /**
     * Sends data to lavalink or puts it in a queue if not connected yet
     * @param msg Data you want to send to lavalink
     */
    public send(msg: object): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const parsed = JSON.stringify(msg);
            const queueData = { data: parsed, resolve, reject };

            if (this.connected) return this._send(queueData);
            else this._queue.push(queueData);
        });
    }

    /**
     * Configures the resuming key for the LavalinkNode
     * @param key the actual key to send to lavalink to resume with
     * @param timeout how long before the key invalidates and lavalinknode will stop expecting you to resume
     */
    public configureResuming(key: string, timeout = this.resumeTimeout): Promise<boolean> {
        return this.send({ op: "configureResuming", key, timeout });
    }

    /**
     * Destroys the connection to the Lavalink Websocket
     */
    public destroy(): boolean {
        if (!this.connected) return false;
        this.ws!.close(1000, "destroy");
        return true;
    }

    /**
     * Whether or not the node is connected
     */
    public get connected(): boolean {
        if (!this.ws) return false;
        return this.ws!.readyState === WebSocket.OPEN;
    }

    /**
     * A private function for handling the open event from WebSocket
     */
    private onOpen(): void {
        if (this._reconnect) clearTimeout(this._reconnect);
        this._queueFlush()
            .catch(error => this.manager.emit("error", error, this));

        if (this.resumeKey) this.configureResuming(this.resumeKey).catch(error => this.manager.emit("error", error, this));

        this.manager.emit("ready", this);
    }

    /**
     * Private function for handling the message event from WebSocket
     * @param data The data that came from lavalink
     */
    private onMessage(data: WebSocket.Data): void {
        if (Array.isArray(data)) data = Buffer.concat(data);
        else if (data instanceof ArrayBuffer) data = Buffer.from(data);

        const msg = JSON.parse(data.toString());

        if (msg.op && msg.op === "stats") this.stats = { ...msg };
        delete (this.stats as any).op;

        if (msg.guildId && this.manager.players.has(msg.guildId)) (this.manager.players.get(msg.guildId) as Player).emit(msg.op, msg);

        this.manager.emit("raw", msg, this);
    }

    /**
     * Private function for handling the error event from WebSocket
     * @param event WebSocket event data
     */
    private onError(event: { error: any; message: string; type: string; target: WebSocket; }): void {
        const error = event && event.error ? event.error : event;
        if (!error) return;

        this.manager.emit("error", error, this);
        this.reconnect();
    }

    /**
     * Private function for handling the close event from WebSocket
     * @param event WebSocket event data
     */
    private onClose(event: WebsocketCloseEvent): void {
        this.manager.emit("disconnect", event, this);
        if (event.code !== 1000 || event.reason !== "destroy") return this.reconnect();
    }

    /**
     * Handles reconnecting if something happens and the node discounnects
     */
    private reconnect(): void {
        this._reconnect = setTimeout(() => {
            this.ws!.removeAllListeners();
            this.ws = null;

            this.manager.emit("reconnecting", this);
            this.connect();
        }, this.reconnectInterval);
    }

    /**
     * Sends data to the Lavalink Websocket
     * @param param0 data to send
     */
    private _send({ data, resolve, reject }: QueueData): void {
        this.ws!.send(data, (error: Error | undefined) => {
            if (error) reject(error);
            else resolve(true);
        });
    }

    /**
     * Flushs the send queue
     */
    private async _queueFlush(): Promise<void> {
        await Promise.all(this._queue.map(this._send));
        this._queue = [];
    }

}
