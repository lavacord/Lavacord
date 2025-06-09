import WebSocket from "ws";
import { Rest } from "./Rest";
import type { Manager } from "./Manager";
import type { LavalinkNodeOptions } from "./Types";
import type { Stats, OutboundHandshakeHeaders, WebsocketMessage } from "lavalink-types/v4";

// This is a placeholder for the version of the library, which should be injected during build time
const version = "[VI]{{inject}}[/VI]";

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
 *
 * @since 1.0.0
 */
export class LavalinkNode {
	/**
	 * The identifier for this Lavalink node. Used to distinguish between multiple nodes.
	 *
	 * @summary Unique identifier for the node
	 * @remarks
	 * This is a required property that must be unique across all nodes in your application.
	 * It's used for identifying this node in logs and when selecting nodes for new players.
	 *
	 * @since 1.0.0
	 */
	public id: string;

	/**
	 * The hostname or IP address of the Lavalink server.
	 *
	 * @summary Server hostname or IP address
	 * @remarks
	 * This can be a domain name, IPv4, or IPv6 address pointing to your Lavalink server.
	 *
	 * @defaultValue "localhost"
	 * @since 1.0.0
	 */
	public readonly host = "localhost";

	/**
	 * The port number that the Lavalink server is listening on.
	 *
	 * @summary Server port number
	 * @remarks
	 * This should match the port configured in your Lavalink server's application.yml.
	 *
	 * @defaultValue 2333
	 * @since 1.0.0
	 */
	public readonly port: number | string = 2333;

	/**
	 * The time in milliseconds between reconnection attempts if the connection fails.
	 *
	 * @summary Reconnection delay in milliseconds
	 * @remarks
	 * Lower values will attempt reconnections more quickly, but might
	 * cause excessive connection attempts during prolonged server outages.
	 *
	 * @defaultValue 10000
	 * @since 1.0.0
	 */
	public reconnectInterval = 10000;

	/**
	 * The password used for authorization with the Lavalink server.
	 *
	 * @summary Authorization password for the Lavalink server
	 * @remarks
	 * This password must match the one configured in your Lavalink server's application.yml.
	 * It's used in the Authorization header when establishing the WebSocket connection.
	 *
	 * @defaultValue "youshallnotpass"
	 * @since 1.0.0
	 */
	public readonly password = "youshallnotpass";

	/**
	 * The WebSocket instance used for communication with the Lavalink server.
	 *
	 * @summary Active WebSocket connection to the Lavalink server
	 * @remarks
	 * When not connected to Lavalink, this property will be null.
	 * You can check the {@link connected} property to determine connection status.
	 *
	 * @since 1.0.0
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
	 *
	 * @since 1.0.0
	 */
	public stats: Stats;

	/**
	 * Whether this node should attempt to resume the session when reconnecting.
	 *
	 * @summary Session resumption flag
	 * @remarks
	 * When true, the node will try to resume the previous session after a disconnect,
	 * preserving player states and connections. This helps maintain playback during
	 * brief disconnections or node restarts.
	 *
	 * @see {@link resumeTimeout}
	 * @defaultValue false
	 * @since 1.0.0
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
	 *
	 * @see {@link resuming}
	 * @defaultValue 120
	 * @since 1.0.0
	 */
	public resumeTimeout = 120;

	/**
	 * Custom data that can be attached to the node instance.
	 *
	 * @summary Custom application data storage
	 * @remarks
	 * Not used internally by Lavacord, available for application-specific needs.
	 * You can use this property to store any data relevant to your implementation,
	 * such as region information, feature flags, or custom metrics.
	 *
	 * @example
	 * ```typescript
	 * // Store custom region data with the node
	 * node.state = { region: 'us-west', tier: 'premium' };
	 * ```
	 *
	 * @since 1.0.0
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
	 *
	 * @since 1.0.0
	 */
	public sessionId?: string;

	/**
	 * Timeout reference used for the reconnection mechanism.
	 * This holds the NodeJS.Timeout instance used to schedule reconnection attempts.
	 *
	 * @since 1.0.0
	 */
	private _reconnect?: NodeJS.Timeout;

	/**
	 * Tracks whether the session has been updated with the Lavalink server.
	 * Used internally to avoid redundant session update requests.
	 *
	 * @since 1.0.0
	 */
	private _sessionUpdated = false;

	/**
	 * Creates a new LavalinkNode instance.
	 *
	 * @summary Initializes a new Lavalink node connection
	 * @param manager - The {@link Manager} instance that controls this node
	 * @param options - Configuration options for this Lavalink node as defined in {@link LavalinkNodeOptions}
	 *
	 * @example
	 * ```typescript
	 * const node = new LavalinkNode(manager, {
	 *   id: 'main-node',
	 *   host: 'lavalink.example.com',
	 *   port: 2333,
	 *   password: 'your-password',
	 *   resuming: true,
	 *   resumeTimeout: 60
	 * });
	 * ```
	 *
	 * @since 1.0.0
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
	 * @returns A promise that resolves with the WebSocket instance when connected
	 * @throws {@link Error} If the connection fails due to network issues, authentication problems, or other errors
	 *
	 * @example
	 * ```typescript
	 * // This is typically handled by the Manager class
	 * try {
	 *   await node.connect();
	 *   console.log(`Connected to Lavalink node: ${node.id}`);
	 * } catch (error) {
	 *   console.error(`Failed to connect to Lavalink: ${error.message}`);
	 * }
	 * ```
	 *
	 * @since 1.0.0
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
	 * @returns `true` if the connection was closed, `false` if there was no active connection
	 *
	 * @example
	 * ```typescript
	 * // This is typically handled by the Manager class
	 * if (node.destroy()) {
	 *   console.log(`Successfully disconnected from Lavalink node: ${node.id}`);
	 * } else {
	 *   console.log(`Node ${node.id} was not connected`);
	 * }
	 * ```
	 *
	 * @since 1.0.0
	 */
	public destroy(): boolean {
		if (!this.connected) return false;
		this.ws?.close(1000, "destroy");
		return true;
	}

	/**
	 * Indicates whether this node is currently connected to the Lavalink server.
	 *
	 * @summary Connection status check
	 * @remarks
	 * Checks if the {@link ws} instance exists and if its ready state is {@link WebSocket.OPEN}.
	 * This property is useful for verifying connection status before attempting operations
	 * or implementing node selection strategies.
	 *
	 * @returns `true` if connected, `false` otherwise
	 *
	 * @example
	 * ```typescript
	 * // Check if the node is connected before attempting operations
	 * if (node.connected) {
	 *   console.log(`Node ${node.id} is ready to use`);
	 * } else {
	 *   console.log(`Node ${node.id} is disconnected`);
	 * }
	 * ```
	 *
	 * @see {@link connect}
	 * @see {@link destroy}
	 * @since 1.0.0
	 */
	public get connected(): boolean {
		if (!this.ws) return false;
		return this.ws?.readyState === WebSocket.OPEN;
	}

	/**
	 * Handles the WebSocket 'open' event when a connection is established.
	 *
	 * When the connection opens successfully, this method:
	 * 1. Clears any pending reconnection timeouts
	 * 2. Emits the 'ready' event through the manager
	 * 3. Updates the session with Lavalink if needed
	 *
	 * @since 1.0.0
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
	 * Processes incoming WebSocket messages from the Lavalink server.
	 *
	 * This method handles various operation types from Lavalink:
	 * - 'ready': Processes session information
	 * - 'stats': Updates node statistics
	 * - 'event' and 'playerUpdate': Routes events to the appropriate player
	 *
	 * All raw messages are also emitted through the manager for custom handling.
	 *
	 * @param data - The raw data received from the WebSocket
	 *
	 * @since 1.0.0
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
	 * Handles WebSocket errors.
	 *
	 * When a WebSocket error occurs, this method:
	 * 1. Emits the error through the manager
	 * 2. Initiates a reconnection attempt
	 *
	 * @param error - The error received from the WebSocket
	 *
	 * @since 1.0.0
	 */
	private onError(error: Error): void {
		if (!error) return;

		this.manager.emit("error", error, this);
		this.reconnect();
	}

	/**
	 * Handles WebSocket closure.
	 *
	 * When the WebSocket connection closes, this method:
	 * 1. Resets the session update flag
	 * 2. Emits a disconnect event with the close code and reason
	 * 3. Initiates reconnection unless the closure was intentional (code 1000, reason "destroy")
	 *
	 * @param code - The WebSocket close code (see WebSocket standards for code meanings)
	 * @param reason - The reason why the WebSocket was closed
	 *
	 * @since 1.0.0
	 */
	private onClose(code: number, reason: Buffer): void {
		this._sessionUpdated = false;
		this.manager.emit("disconnect", code, reason.toString(), this);
		if (code !== 1000 || reason.toString() !== "destroy") return this.reconnect();
	}

	/**
	 * Initiates a reconnection attempt after a delay.
	 *
	 * This method:
	 * 1. Sets a timeout for reconnection based on the `reconnectInterval` property
	 * 2. Cleans up existing WebSocket listeners
	 * 3. Nullifies the WebSocket reference
	 * 4. Emits the 'reconnecting' event
	 * 5. Attempts to establish a new connection
	 *
	 * @since 1.0.0
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
