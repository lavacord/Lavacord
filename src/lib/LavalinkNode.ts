import WebSocket from "ws";
import { Rest } from "./Rest";
import type { Manager } from "./Manager";
import type { LavalinkNodeOptions } from "./Types";
import { VERSION } from "../index";
import { EventOP, OutboundHandshakeHeaders, Stats, StatsOP, WebsocketMessage } from "lavalink-types";

/**
 * The LavalinkNode class handles the connection and communication with a Lavalink server.
 *
 * @summary Manages WebSocket connections to Lavalink servers and processes server events
 *
 * This class is responsible for establishing WebSocket connections to Lavalink,
 * handling reconnection logic, and processing incoming messages from the server.
 *
 * @remarks
 * LavalinkNode instances are typically created and managed by the {@link Manager} class,
 * which handles load balancing across multiple nodes and routing player actions
 * to the appropriate node.
 */
export class LavalinkNode {
	/**
	 * The identifier for this Lavalink node. Used to distinguish between multiple nodes.
	 *
	 * @summary Unique identifier for the node
	 * @remarks
	 * This is a required property that must be unique across all nodes in your application.
	 * It's used for identifying this node in logs and when selecting nodes for new players.
	 */
	public id: string;

	/**
	 * The hostname or IP address of the Lavalink server.
	 *
	 * @summary Server hostname or IP address
	 * @remarks
	 * This can be a domain name, IPv4, or IPv6 address pointing to your Lavalink server.
	 */
	public readonly host = "localhost";

	/**
	 * The port number that the Lavalink server is listening on.
	 *
	 * @summary Server port number
	 * @remarks
	 * This should match the port configured in your Lavalink server's application.yml.
	 */
	public readonly port: number | string = 2333;

	/**
	 * The time in milliseconds between reconnection attempts if the connection fails.
	 *
	 * @summary Reconnection delay in milliseconds
	 * @remarks
	 * Lower values will attempt reconnections more quickly, but might
	 * cause excessive connection attempts during prolonged server outages.
	 */
	public reconnectInterval = 10000;

	/**
	 * The password used for authorization with the Lavalink server.
	 *
	 * @summary Authorization password for the Lavalink server
	 * @remarks
	 * This password must match the one configured in your Lavalink server's application.yml.
	 * It's used in the Authorization header when establishing the WebSocket connection.
	 */
	public readonly password = "youshallnotpass";

	/**
	 * Whether to use secure connections (HTTPS/WSS) instead of HTTP/WS.
	 *
	 * @summary Secure connection flag for SSL/TLS
	 * @remarks
	 * When true, WebSocket connections will use WSS and REST requests will use HTTPS.
	 * This is required when connecting to Lavalink servers behind SSL/TLS.
	 */
	public readonly secure = false;

	/**
	 * The WebSocket instance used for communication with the Lavalink server.
	 *
	 * @summary Active WebSocket connection to the Lavalink server
	 * @remarks
	 * When not connected to Lavalink, this property will be null.
	 * You can check the {@link connected} property to determine connection status.
	 */
	public ws: WebSocket | null = null;

	/**
	 * The statistics received from the Lavalink server.
	 *
	 * @summary Server resource usage and player statistics
	 * @remarks
	 * Contains information about system resource usage, player counts, and audio frame statistics.
	 * This is updated whenever the Lavalink server sends a stats update (typically every minute).
	 * You can use these stats to implement node selection strategies in your application.
	 */
	public stats: Stats = {
		players: 0,
		playingPlayers: 0,
		uptime: 0,
		memory: {
			used: 0,
			free: 0,
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

	/**
	 * Whether this node should attempt to resume the session when reconnecting.
	 *
	 * @summary Session resumption flag
	 * @remarks
	 * When true, the node will try to resume the previous session after a disconnect,
	 * preserving player states and connections. This helps maintain playback during
	 * brief disconnections or node restarts.
	 */
	public resuming = false;

	/**
	 * The timeout in seconds after which a disconnected session can no longer be resumed.
	 *
	 * @summary Maximum session resumption timeout in seconds
	 * @remarks
	 * This value is sent to the Lavalink server when configuring session resuming.
	 * After this many seconds of disconnection, the session will be fully closed
	 * and cannot be resumed.
	 */
	public resumeTimeout = 60;

	/**
	 * Custom data that can be attached to the node instance.
	 *
	 * @summary Custom application data storage
	 * @remarks
	 * Not used internally by Lavacord, available for application-specific needs.
	 * You can use this property to store any data relevant to your implementation,
	 * such as region information, feature flags, or custom metrics.
	 */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public state?: any;

	/**
	 * The unique session identifier provided by Lavalink on successful connection.
	 *
	 * @summary Lavalink session identifier
	 * @remarks
	 * This ID is used for resuming sessions and in certain REST API calls.
	 * It's automatically assigned when connecting to the Lavalink server.
	 */
	public sessionId?: string;
	/**
	 * The version of the Lavalink protocol this node is using.
	 *
	 * @summary Lavalink protocol version
	 * @remarks
	 * This is set automatically when connecting to the Lavalink server.
	 * It indicates which version of the Lavalink protocol this node supports.
	 * The default value is "4", which corresponds to the latest stable version.
	 *
	 * @defaultValue "4"
	 */
	public version = "4";

	/**
	 * Timeout reference used for the reconnection mechanism.
	 * This holds the NodeJS.Timeout instance used to schedule reconnection attempts.
	 */
	private _reconnect?: NodeJS.Timeout;

	/**
	 * Current reconnection attempt count for exponential backoff.
	 */
	private _reconnectAttempts = 0;

	/**
	 * Tracks whether the session has been updated with the Lavalink server.
	 * Used internally to avoid redundant session update requests.
	 */
	private _sessionUpdated = false;

	/**
	 * Creates a new LavalinkNode instance.
	 *
	 * @summary Initializes a new Lavalink node connection
	 * @param manager - The {@link Manager} instance that controls this node
	 * @param options - Configuration options for this Lavalink node as defined in {@link LavalinkNodeOptions}
	 */
	public constructor(
		public manager: Manager,
		options: LavalinkNodeOptions
	) {
		this.id = options.id;

		if (options.host) Object.defineProperty(this, "host", { value: options.host });
		if (options.port) Object.defineProperty(this, "port", { value: options.port });
		if (options.password) Object.defineProperty(this, "password", { value: options.password });
		if (options.secure !== undefined) Object.defineProperty(this, "secure", { value: options.secure });
		if (options.reconnectInterval) this.reconnectInterval = options.reconnectInterval;
		if (options.sessionId) this.sessionId = options.sessionId;
		if (options.resuming !== undefined) this.resuming = options.resuming;
		if (options.resumeTimeout) this.resumeTimeout = options.resumeTimeout;
		if (options.state) this.state = options.state;
	}

	/**
	 * Establishes a connection to the Lavalink server.
	 *
	 * This method creates a new WebSocket connection to the configured Lavalink server.
	 * If the node is already connected, it will close the existing connection first.
	 * The method sets up event listeners for the WebSocket to handle messages, errors,
	 * and connection state changes.
	 *
	 * Note: This method is primarily used internally by the {@link Manager} class.
	 * Users typically should not call this method directly as the Manager handles
	 * node connections automatically.
	 *
	 * @returns A promise that resolves when connected or rejects if connection fails
	 * @throws {Error} If the connection fails due to network issues, authentication problems, or other errors
	 */
	public async connect(): Promise<WebSocket> {
		if (this.connected) this.ws?.close(1000, "reconnecting");

		this.version = await Rest.version(this)
			.then((str) => str.split(".")[0])
			.catch(() => "4");

		return new Promise((resolve, reject) => {
			let isResolved = false;

			// Prepare headers for the WebSocket connection
			const headers: OutboundHandshakeHeaders = {
				Authorization: this.password,
				"User-Id": this.manager.userId!,
				"Client-Name": `Lavacord/${VERSION}`
			};

			if (this.sessionId && this.resuming) headers["Session-Id"] = this.sessionId;

			this.ws = new WebSocket(this.socketURL, { headers })
				.on("open", () => {
					isResolved = true;
					this.onOpen();
					resolve(this.ws!);
				})
				.on("error", (error) => {
					if (!isResolved) {
						isResolved = true;
						reject(error);
					}
					this.onError(error);
				})
				.on("close", (code, reason) => {
					if (!isResolved) {
						isResolved = true;
						reject(new Error(`WebSocket closed during connection: ${code} ${reason.toString()}`));
					}
					this.onClose(code, reason);
				})
				.on("message", this.onMessage.bind(this));
		});
	}

	/**
	 * Gracefully closes the connection to the Lavalink server.
	 *
	 * This method closes the WebSocket connection with a normal closure code (1000)
	 * and a reason of "destroy", indicating an intentional disconnection rather
	 * than an error condition.
	 *
	 * Note: This method is primarily used internally by the {@link Manager} class.
	 * Users typically should not call this method directly as the Manager handles
	 * node disconnections automatically.
	 *
	 * @returns void
	 */
	public destroy(): void {
		if (!this.connected) return;
		this.ws!.close(1000, "destroy");
	}

	/**
	 * Indicates whether this node is currently connected to the Lavalink server.
	 *
	 * @summary Connection status check
	 * @remarks
	 * Checks if the {@link ws} instance exists and if its ready state is 1.
	 * This property is useful for verifying connection status before attempting operations
	 * or implementing node selection strategies.
	 *
	 * @returns `true` if connected, `false` otherwise
	 */
	public get connected(): boolean {
		if (!this.ws) return false;
		return this.ws.readyState === WebSocket.OPEN;
	}

	/**
	 * Gets the WebSocket URL for connecting to the Lavalink server.
	 *
	 * @summary WebSocket connection URL
	 * @remarks
	 * Returns either a secure (wss://) or insecure (ws://) WebSocket URL
	 * based on the {@link secure} property configuration.
	 *
	 * @returns The complete WebSocket URL including protocol, host, port, and path
	 */
	public get socketURL(): string {
		const protocol = this.secure ? "wss" : "ws";
		return `${protocol}://${this.host}:${this.port}/v${this.version}/websocket`;
	}

	/**
	 * Gets the REST API base URL for the Lavalink server.
	 *
	 * @summary REST API base URL
	 * @remarks
	 * Returns either a secure (https://) or insecure (http://) REST URL
	 * based on the {@link secure} property configuration.
	 *
	 * @returns The complete REST API base URL including protocol, host, port, and path
	 */
	public get restURL(): string {
		const protocol = this.secure ? "https" : "http";
		return `${protocol}://${this.host}:${this.port}`;
	}
	/**
	 * Handles the WebSocket 'open' event when a connection is established.
	 */
	private onOpen(): void {
		if (this._reconnect) clearTimeout(this._reconnect);
		this._reconnectAttempts = 0;
		this.manager.emit("ready", this);
		if (!this._sessionUpdated && this.sessionId) {
			this._sessionUpdated = true;
			Rest.updateSession(this).catch((e) => this.manager.emit("error", e, this));
		}
	}

	/**
	 * Processes incoming WebSocket messages from the Lavalink server.
	 * @param data - The raw data received from the WebSocket
	 */
	private onMessage(data: WebSocket.RawData): void {
		const msg: WebsocketMessage = JSON.parse(data.toString());

		switch (msg.op) {
			case "ready":
				if (msg.sessionId) this.sessionId = msg.sessionId;
				if (!this._sessionUpdated) {
					this._sessionUpdated = true;
					Rest.updateSession(this).catch((e) => this.manager.emit("error", e, this));
				}
				break;

			case "stats": {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const { op, ...stats } = msg as StatsOP;
				this.stats = stats;
				break;
			}

			case "event":
				this._handleEvent(msg);
				break;
			case "playerUpdate": {
				const player = this.manager.players.get(msg.guildId);
				if (!player) break;
				player.state = msg.state;
				if (player.listenerCount("state")) player.emit("state", msg.state);
				if (this.manager.listenerCount("playerState")) this.manager.emit("playerState", player, msg.state);
				break;
			}

			default:
				break;
		}

		this.manager.emit("raw", msg, this);
	}

	/**
	 * Handles WebSocket errors.
	 * @param error - The error received from the WebSocket
	 */
	private onError(error: Error): void {
		if (!error) return;

		this.manager.emit("error", error, this);
		this.reconnect();
	}

	/**
	 * Handles WebSocket closure.
	 *
	 * @param code - The WebSocket close code (see Lavalink API for code meanings)
	 * @param reason - The reason why the WebSocket was closed
	 */
	private onClose(code: number, reason: Buffer): void {
		this._sessionUpdated = false;
		this.manager.emit("disconnect", code, reason.toString(), this);

		this.ws?.removeAllListeners();
		this.ws = null;

		switch (code) {
			case 1000:
				if (reason.toString() === "destroy") return clearTimeout(this._reconnect);
				break;

			case 4001:
			case 4002:
			case 4003:
			case 4004:
			case 4005:
				this.manager.emit("error", new Error(`Lavalink authentication error: ${code} ${reason.toString()}`), this);
				return;
			default:
				break;
		}

		this.reconnect();
	}

	/**
	 * Initiates a reconnection attempt after a delay with exponential backoff.
	 */
	private reconnect(): void {
		this._reconnectAttempts++;
		const delay = Math.min(this.reconnectInterval * Math.pow(2, this._reconnectAttempts - 1), 60000);

		this._reconnect = setTimeout(async () => {
			this.manager.emit("reconnecting", this);
			await this.connect().catch((error) => this.manager.emit("error", error, this));
		}, delay);
	}

	private _handleEvent(data: EventOP) {
		const player = this.manager.players.get(data.guildId);
		if (!player) return;

		switch (data.type) {
			case "TrackStartEvent":
				player.track = data.track;
				player.timestamp = Date.now();
				if (player.listenerCount("trackStart")) player.emit("trackStart", data);
				if (this.manager.listenerCount("playerTrackStart")) this.manager.emit("playerTrackStart", player, data);
				break;
			case "TrackEndEvent":
				if (data.reason !== "replaced") {
					player.track = null;
					player.timestamp = null;
				}
				if (player.listenerCount("trackEnd")) player.emit("trackEnd", data);
				if (this.manager.listenerCount("playerTrackEnd")) this.manager.emit("playerTrackEnd", player, data);
				break;
			case "TrackExceptionEvent":
				if (player.listenerCount("trackException")) player.emit("trackException", data);
				if (this.manager.listenerCount("playerTrackException")) this.manager.emit("playerTrackException", player, data);
				break;
			case "TrackStuckEvent":
				if (player.listenerCount("trackStuck")) player.emit("trackStuck", data);
				if (this.manager.listenerCount("playerTrackStuck")) this.manager.emit("playerTrackStuck", player, data);
				break;
			case "WebSocketClosedEvent":
				player.track = null;
				player.timestamp = null;
				if (player.listenerCount("webSocketClosed")) player.emit("webSocketClosed", data);
				if (this.manager.listenerCount("playerWebSocketClosed")) this.manager.emit("playerWebSocketClosed", player, data);
				break;
			default:
				this.manager.emit("warn", `Unexpected event type: ${(data as { type: string }).type}`);
				break;
		}
	}
}
