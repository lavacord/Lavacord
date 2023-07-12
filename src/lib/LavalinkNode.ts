import WebSocket from "ws";
import { Rest } from "./Rest";

import type { Manager } from "./Manager";
import type { LavalinkNodeOptions } from "./Types";
import type { Stats, OutboundHandshakeHeaders, WebsocketMessage } from "lavalink-types/v4";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { version } = require("../../package.json");

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
    public stats: Stats;
    /**
     * If the LavalinkNode should allow resuming
     */
    public resuming = false;
    /**
     * The resume timeout
     */
    public resumeTimeout = 120;
    /**
     * Extra info attached to your node, not required and is not sent to lavalink, purely for you.
     */
    public state?: any;
    /**
     * The major version of the LavaLink node as indicated by /version
     */
    public version?: number;
    /**
     * The session ID sent by LavaLink on connect. Used for some REST routes
     */
    public sessionId?: string;

    /**
     * The reconnect timeout
     * @private
     */
    private _reconnect?: NodeJS.Timeout;

    private _sessionUpdated = false;

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
        if (options.sessionId) this.sessionId = options.sessionId;
        if (options.resuming !== undefined) this.resuming = options.resuming;
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
            },
            frameStats: {
                sent: 0,
                nulled: 0,
                deficit: 0
            }
        };
    }

    /**
     * Connects the node to Lavalink
     */
    public async connect(): Promise<WebSocket> {
        this.ws = await new Promise<WebSocket>((resolve, reject) => {
            if (this.connected) this.ws!.close();

            return Rest.version(this)
                .then(nodeVersion => {
                    const major = typeof nodeVersion === "string" && nodeVersion.indexOf(".") !== -1 ? nodeVersion.split(".")[0] : undefined;
                    if (!major || isNaN(Number(major))) return reject(new Error("Node didn't respond to /version with a major.minor.patch version string"));
                    const numMajor = Number(major);
                    this.version = numMajor;

                    const headers: OutboundHandshakeHeaders = {
                        Authorization: this.password,
                        "User-Id": this.manager.user!,
                        "Client-Name": `Lavacord/${version}`
                    };

                    if (this.sessionId && this.resuming) headers["Session-Id"] = this.sessionId;

                    const ws = new WebSocket(`ws://${this.host}:${this.port}/v${numMajor}/websocket`, { headers });

                    const onEvent = (event: unknown): void => {
                        ws.removeAllListeners();
                        reject(event);
                    };

                    const onOpen = (): void => {
                        this.onOpen();
                        ws.removeListener("open", onOpen);
                        ws.removeListener("error", onEvent);
                        ws.removeListener("close", onEvent);
                        resolve(ws);
                    };

                    ws
                        .once("open", onOpen)
                        .once("error", onEvent)
                        .once("close", onEvent);
                }).catch(reject);
        });

        this.ws!
            .on("message", data => this.onMessage(data))
            .on("error", error => this.onError(error))
            .on("close", (code, reason) => this.onClose(code, reason));
        return this.ws!;
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
        this.manager.emit("ready", this);
        if (!this._sessionUpdated && this.sessionId) {
            this._sessionUpdated = true;
            Rest.updateSession(this).catch(e => this.manager.emit("error", e, this));
        }
    }

    /**
     * Private function for handling the message event from WebSocket
     * @param data The data that came from lavalink
     */
    private onMessage(data: WebSocket.Data): void {
        let str = "";
        if (Array.isArray(data)) str = Buffer.concat(data).toString();
        else if (data instanceof ArrayBuffer) str = Buffer.from(data).toString();
        else str = data.toString();

        const msg: WebsocketMessage = JSON.parse(str);

        if (msg.op === "ready") {
            this.sessionId = msg.sessionId;
            if (!this._sessionUpdated) {
                this._sessionUpdated = true;
                Rest.updateSession(this).catch(e => this.manager.emit("error", e, this));
            }
        } else if (msg.op && msg.op === "stats") {
            this.stats = { ...msg };
            delete (this.stats as any).op;
        } else if ((msg.op === "event" || msg.op === "playerUpdate") && this.manager.players.has(msg.guildId)) {
            this.manager.players.get(msg.guildId)!.emit(msg.op, msg as any);
        }

        this.manager.emit("raw", msg, this);
    }

    /**
     * Private function for handling the error event from WebSocket
     * @param error WebSocket error
     */
    private onError(error: Error): void {
        if (!error) return;

        this.manager.emit("error", error, this);
        this.reconnect();
    }

    /**
     * Private function for handling the close event from WebSocket
     * @param code WebSocket close code
     * @param reason WebSocket close reason
     */
    private onClose(code: number, reason: Buffer): void {
        this._sessionUpdated = false;
        this.manager.emit("disconnect", code, reason.toString(), this);
        if (code !== 1000 || reason.toString() !== "destroy") return this.reconnect();
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
}
