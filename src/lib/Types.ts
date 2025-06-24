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
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	state?: any;
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
	 * Emitted for all raw WebSocket messages from nodes.
	 */
	nodeRaw: [WebsocketMessage, LavalinkNode];
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
	 * Emitted when a player is updated.
	 */
	playerState: [Player, PlayerState];
	/**
	 * Emitted when a track starts playing.
	 */
	playerTrackStart: [Player, TrackStartEvent];
	/**
	 * Emitted when a track ends.
	 */
	playerTrackEnd: [Player, TrackEndEvent];
	/**
	 * Emitted when a track encounters an exception.
	 */
	playerTrackException: [Player, TrackExceptionEvent];
	/**
	 * Emitted when a track gets stuck.
	 */
	playerTrackStuck: [Player, TrackStuckEvent];
	/**
	 * Emitted when the voice WebSocket is closed.
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
}

export interface PlayerEvents {
	state: [PlayerState];
	trackStart: [TrackStartEvent];
	trackEnd: [TrackEndEvent];
	trackException: [TrackExceptionEvent];
	trackStuck: [TrackStuckEvent];
	webSocketClosed: [WebSocketClosedEvent];
	pause: [boolean];
	seek: [number];
	volume: [number];
	filters: [Filters];
}

export enum LavalinkOPTypes {
	Ready = "ready",
	PlayerUpdate = "playerUpdate",
	Stats = "stats",
	Event = "event"
}
