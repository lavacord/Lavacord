import WebSocket from "ws";
import { Rest } from "./Rest";
import type { Manager } from "./Manager";
import type { LavalinkNodeOptions } from "./Types";
import type { Stats, OutboundHandshakeHeaders, WebsocketMessage } from "lavalink-types/v4";

// This is a placeholder for the version of the library, which should be injected during build time
const version = "[VI]{{inject}}[/VI]";

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
	public state?: unknown;
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
	 */
	private _reconnect?: NodeJS.Timeout;

	private _sessionUpdated = false;

	/**
	 * The base of the connection to lavalink
	 * @param manager - The manager that created the LavalinkNode
	 * @param options - The options of the LavalinkNode {@link LavalinkNodeOptions}
	 */
	public constructor(
		public manager: Manager,
		options: LavalinkNodeOptions
	) {
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
		return new Promise<WebSocket>((resolve, reject) => {
			if (this.connected) this.ws?.close();

			const headers: OutboundHandshakeHeaders = {
				Authorization: this.password,
				"User-Id": this.manager.user,
				"Client-Name": `Lavacord/${version}`
			};

			if (this.sessionId && this.resuming) headers["Session-Id"] = this.sessionId;

			const ws = new WebSocket(`ws://${this.host}:${this.port}/v4/websocket`, { headers });

			const onEvent = (event: unknown): void => {
				ws.removeAllListeners();
				reject(event instanceof Error ? event : new Error("Premature close"));
			};

			const onOpen = (): void => {
				this.ws = ws;
				this.onOpen();
				ws.removeListener("open", onOpen)
					.removeListener("error", onEvent)
					.removeListener("close", onEvent)
					.on("error", this.onError.bind(this))
					.on("close", this.onClose.bind(this));
				resolve(ws);
			};
			ws.on("message", this.onMessage.bind(this)).once("open", onOpen).once("error", onEvent).once("close", onEvent);
		});
	}

	/**
	 * Destroys the connection to the Lavalink Websocket
	 */
	public destroy(): boolean {
		if (!this.connected) return false;
		this.ws?.close(1000, "destroy");
		return true;
	}

	/**
	 * Whether or not the node is connected
	 */
	public get connected(): boolean {
		if (!this.ws) return false;
		return this.ws?.readyState === WebSocket.OPEN;
	}

	/**
	 * A private function for handling the open event from WebSocket
	 */
	private onOpen(): void {
		if (this._reconnect) clearTimeout(this._reconnect);
		this.manager.emit("ready", this);
		if (!this._sessionUpdated && this.sessionId) {
			this._sessionUpdated = true;
			Rest.updateSession(this).catch((e) => this.manager.emit("error", e, this));
		}
	}

	/**
	 * Private function for handling the message event from WebSocket
	 * @param data - The data that came from lavalink
	 */
	private onMessage(data: WebSocket.Data): void {
		const str = Array.isArray(data)
			? Buffer.concat(data).toString()
			: data instanceof ArrayBuffer
				? Buffer.from(data).toString()
				: data.toString();

		const msg: WebsocketMessage = JSON.parse(str);

		switch (msg.op) {
			case "ready":
				if (msg.sessionId) this.sessionId = msg.sessionId;
				if (!this._sessionUpdated) {
					this._sessionUpdated = true;
					Rest.updateSession(this).catch((e) => this.manager.emit("error", e, this));
				}
				break;

			case "stats": {
				// Assign all properties except 'op' to stats
				const stats = { ...msg } as Stats;
				delete (stats as { op?: number }).op;
				this.stats = stats;
				break;
			}

			case "event":
			case "playerUpdate": {
				const player = this.manager.players.get(msg.guildId);
				if (!player) break;
				player.emit(msg.op, msg as never);
				break;
			}

			default:
				break;
		}

		this.manager.emit("raw", msg, this);
	}

	/**
	 * Private function for handling the error event from WebSocket
	 * @param error - WebSocket error
	 */
	private onError(error: Error): void {
		if (!error) return;

		this.manager.emit("error", error, this);
		this.reconnect();
	}

	/**
	 * Private function for handling the close event from WebSocket
	 * @param code - WebSocket close code
	 * @param reason - WebSocket close reason
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
			this.ws?.removeAllListeners();
			this.ws = null;

			this.manager.emit("reconnecting", this);
			this.connect();
		}, this.reconnectInterval);
	}
}
