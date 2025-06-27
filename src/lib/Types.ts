import { GatewayVoiceServerUpdateDispatchData, GatewayVoiceStateUpdate } from "discord-api-types/v10";
import type { Player } from "./Player";
import { LavalinkNode } from "./LavalinkNode";
import type {
	TrackEndEvent,
	TrackExceptionEvent,
	TrackStartEvent,
	TrackStuckEvent,
	WebSocketClosedEvent,
	WebsocketMessage,
	Filters,
	PlayerState
} from "lavalink-types/v4";

/**
 * Represents the voice state required for a player update, typically used when switching nodes or resuming.
 *
 * @remarks
 * This interface contains the session ID and event data needed to establish a voice connection.
 *
 * @public
 */
export interface PlayerUpdateVoiceState {
	/**
	 * The session ID of the voice connection.
	 *
	 * @readonly
	 */
	sessionId: string;
	/**
	 * The voice server update event data from Discord.
	 *
	 * @readonly
	 */
	event: GatewayVoiceServerUpdateDispatchData;
}

/**
 * Defines the options for configuring the Lavacord Manager.
 *
 * @remarks
 * These options control how the Manager interacts with Discord and Lavalink.
 *
 * @public
 */
export interface ManagerOptions {
	/**
	 * The user ID of the bot.
	 *
	 * @remarks
	 * It's recommended to set this when the bot client is ready.
	 */
	user?: string;
	/**
	 * The Player class to be used by the manager for creating new player instances.
	 *
	 * @remarks
	 * Allows for extending the base Player functionality with custom implementations.
	 */
	player?: typeof Player;
	/**
	 * The function used to send gateway voice packets to Discord.
	 *
	 * @remarks
	 * This needs to be implemented by the end-user based on their Discord library.
	 *
	 * @param packet - The Discord packet to send.
	 * @returns A Promise or value representing the send operation result.
	 */
	send?: (packet: GatewayVoiceStateUpdate) => unknown;
}

/**
 * Defines the data required to join a voice channel.
 *
 * @remarks
 * Contains the essential identifiers for connecting to a specific voice channel.
 *
 * @public
 */
export interface JoinData {
	/**
	 * The ID of the guild where the voice channel is located.
	 *
	 * @readonly
	 */
	guild: string;
	/**
	 * The ID of the voice channel to join.
	 *
	 * @readonly
	 */
	channel: string;
	/**
	 * The ID of the LavalinkNode to use for this connection.
	 *
	 * @remarks
	 * This determines which Lavalink server will handle the audio for this connection.
	 *
	 * @readonly
	 */
	node: string;
}

/**
 * Defines the options for joining a voice channel.
 *
 * @remarks
 * Controls the initial state of the bot when connecting to a voice channel.
 *
 * @public
 */
export interface JoinOptions {
	/**
	 * Whether the bot should be self-muted upon joining the voice channel.
	 *
	 * @defaultValue false
	 */
	selfmute?: boolean;
	/**
	 * Whether the bot should be self-deafened upon joining the voice channel.
	 *
	 * @defaultValue false
	 */
	selfdeaf?: boolean;
}

/**
 * Defines the options for configuring a LavalinkNode.
 *
 * @remarks
 * These options specify how to connect to a Lavalink server and how the node should behave.
 *
 * @public
 */
export interface LavalinkNodeOptions {
	/**
	 * A unique identifier for this LavalinkNode, used for organization.
	 *
	 * @remarks
	 * This ID is used internally by Lavacord to reference and manage nodes.
	 *
	 * @readonly
	 */
	id: string;
	/**
	 * The hostname or IP address of the Lavalink server.
	 *
	 * @defaultValue "localhost"
	 */
	host: string;
	/**
	 * The port number of the Lavalink server.
	 *
	 * @defaultValue 2333
	 */
	port?: number | string;
	/**
	 * The password for authenticating with the Lavalink server.
	 *
	 * @defaultValue "youshallnotpass"
	 */
	password?: string;
	/**
	 * The interval (in milliseconds) at which the node will attempt to reconnect if the connection is lost.
	 *
	 * @defaultValue 10000 (10 seconds)
	 */
	reconnectInterval?: number;
	/**
	 * A previous session ID to attempt to resume a connection with the Lavalink server.
	 *
	 * @remarks
	 * This is used when attempting to resume a previous session after reconnection.
	 */
	sessionId?: string;
	/**
	 * Whether the node should attempt to resume the session if a `sessionId` is present when the WebSocket connection opens or the node becomes ready.
	 *
	 * @defaultValue false
	 */
	resuming?: boolean;
	/**
	 * The timeout (in seconds) for resuming a session.
	 *
	 * @defaultValue 120 (2 minutes)
	 */
	resumeTimeout?: number;

	/**
	 * Whether to use secure connections (HTTPS/WSS) instead of HTTP/WS.
	 *
	 * @remarks
	 * When true, WebSocket connections will use WSS and REST requests will use HTTPS.
	 * This is required when connecting to Lavalink servers behind SSL/TLS.
	 *
	 * @defaultValue false
	 */
	secure?: boolean;

	/**
	 * Arbitrary state data that can be attached to the node for user-specific purposes.
	 *
	 * @remarks
	 * This data is not sent to Lavalink and is only used internally.
	 */
	state?: unknown;
}

/**
 * Type definition for Manager events.
 */
export interface ManagerEvents {
	/**
	 * Emitted when a node becomes ready.
	 */
	ready: [LavalinkNode];
	/**
	 * Emitted for all raw messages from Lavalink.
	 */
	raw: [WebsocketMessage, LavalinkNode];
	/**
	 * Emitted when a node encounters an error.
	 */
	error: [unknown, LavalinkNode];
	/**
	 * Emitted when a node disconnects.
	 */
	disconnect: [number, string, LavalinkNode];
	/**
	 * Emitted when a node is attempting to reconnect.
	 */
	reconnecting: [LavalinkNode];
	/**
	 * Represents Lavalink's playerUpdate event.
	 * emits every x time as defined by the lavalink server.
	 * @see {@link https://lavalink.dev/api/websocket.html#player-update-op}
	 */
	playerState: [Player, PlayerState];
	/**
	 * Emitted when a track starts playing.
	 * @see {@link https://lavalink.dev/api/websocket.html#trackstartevent}
	 */
	playerTrackStart: [Player, TrackStartEvent];
	/**
	 * Emitted when a track ends.
	 * @see {@link https://lavalink.dev/api/websocket.html#trackendevent}
	 */
	playerTrackEnd: [Player, TrackEndEvent];
	/**
	 * Emitted when a track encounters an exception.
	 * @see {@link https://lavalink.dev/api/websocket.html#trackexceptionevent}
	 */
	playerTrackException: [Player, TrackExceptionEvent];
	/**
	 * Emitted when a track gets stuck.
	 * @see {@link https://lavalink.dev/api/websocket.html#trackstuckevent}
	 */
	playerTrackStuck: [Player, TrackStuckEvent];
	/**
	 * Emitted when the voice WebSocket is closed.
	 * @see {@link https://lavalink.dev/api/websocket.html#websocketclosedevent}
	 */
	playerWebSocketClosed: [Player, WebSocketClosedEvent];
	/**
	 * Emitted for warnings.
	 */
	warn: [string];
	/**
	 * Emitted when a player is paused or resumed.
	 */
	playerPause: [Player, boolean];
	/**
	 * Emitted when a player's volume changes.
	 */
	playerVolume: [Player, number];
	/**
	 * Emitted when a player seeks to a position.
	 */
	playerSeek: [Player, number];
	/**
	 * Emitted when a player updates its filters.
	 */
	playerFilters: [Player, Filters];
}

export interface PlayerEvents {
	/**
	 * Represents Lavalink's playerUpdate event.
	 * emits every x time as defined by the lavalink server.
	 * @see {@link https://lavalink.dev/api/websocket.html#player-update-op}
	 */
	state: [PlayerState];
	/**
	 * Emitted when a track starts playing.
	 * @see {@link https://lavalink.dev/api/websocket.html#trackstartevent}
	 */
	trackStart: [TrackStartEvent];
	/**
	 * Emitted when a track ends.
	 * @see {@link https://lavalink.dev/api/websocket.html#trackendevent}
	 */
	trackEnd: [TrackEndEvent];
	/**
	 * Emitted when a track encounters an exception.
	 * @see {@link https://lavalink.dev/api/websocket.html#trackexceptionevent}
	 */
	trackException: [TrackExceptionEvent];
	/**
	 * Emitted when a track gets stuck.
	 * @see {@link https://lavalink.dev/api/websocket.html#trackstuckevent}
	 */
	trackStuck: [TrackStuckEvent];
	/**
	 * Emitted when the voice WebSocket is closed.
	 * @see {@link https://lavalink.dev/api/websocket.html#websocketclosedevent}
	 */
	webSocketClosed: [WebSocketClosedEvent];
	/**
	 * Emitted when the player is paused or resumed.
	 */
	pause: [boolean];
	/**
	 * Emitted when the player seeks to a position.
	 */
	seek: [number];
	/**
	 * Emitted when the player volume changes.
	 */
	volume: [number];
	/**
	 * Emitted when the player updates its filters.
	 */
	filters: [Filters];
}

export enum LavalinkOPTypes {
	Ready = "ready",
	PlayerUpdate = "playerUpdate",
	Stats = "stats",
	Event = "event"
}
