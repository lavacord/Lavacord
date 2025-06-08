import { GatewayVoiceServerUpdateDispatchData, GatewayVoiceStateUpdate } from "discord-api-types/v10";
import type { Player } from "./Player";

/**
 * Represents the voice state required for a player update, typically used when switching nodes or resuming.
 */
export interface PlayerUpdateVoiceState {
    /**
     * The session ID of the voice connection.
     */
    sessionId: string;
    /**
     * The voice server update event data from Discord.
     */
    event: GatewayVoiceServerUpdateDispatchData;
}

/**
 * Defines the options for configuring the Lavacord Manager.
 */
export interface ManagerOptions {
    /**
     * The user ID of the bot.
     * It's recommended to set this when the bot client is ready.
     */
    user?: string;
    /**
     * The Player class to be used by the manager for creating new player instances.
     * Allows for extending the base Player functionality.
     */
    player?: typeof Player;
    /**
     * The function used to send gateway voice packets to Discord.
     * This needs to be implemented by the end-user based on their Discord library.
     * @param packet The Discord packet to send.
     */
    send?: (packet: GatewayVoiceStateUpdate) => unknown;
}

/**
 * Defines the data required to join a voice channel.
 */
export interface JoinData {
    /**
     * The ID of the guild where the voice channel is located.
     */
    guild: string;
    /**
     * The ID of the voice channel to join.
     */
    channel: string;
    /**
     * The ID of the LavalinkNode to use for this connection.
     */
    node: string;
}

/**
 * Defines the options for joining a voice channel.
 */
export interface JoinOptions {
    /**
     * Whether the bot should be self-muted upon joining the voice channel.
     * @defaultValue false
     */
    selfmute?: boolean;
    /**
     * Whether the bot should be self-deafened upon joining the voice channel.
     * @defaultValue false
     */
    selfdeaf?: boolean;
}

/**
 * Represents the data received from Discord's VOICE_STATE_UPDATE event.
 */
export interface VoiceStateUpdate {
    /**
     * The ID of the guild.
     */
    guild_id: string;
    /**
     * The ID of the voice channel the user is in.
     * Will be null if the user is leaving the voice channel.
     */
    channel_id?: string | null;
    /**
     * The ID of the user whose voice state updated.
     */
    user_id: string;
    /**
     * The session ID for this voice state.
     */
    session_id: string;
    /**
     * Whether the user is deafened by the server.
     */
    deaf?: boolean;
    /**
     * Whether the user is muted by the server.
     */
    mute?: boolean;
    /**
     * Whether the user has self-deafened.
     */
    self_deaf?: boolean;
    /**
     * Whether the user has self-muted.
     */
    self_mute?: boolean;
    /**
     * Whether the user is suppressed (priority speaker).
     */
    suppress?: boolean;
    // Add other relevant fields from Discord's VoiceState object if needed, e.g., member, request_to_speak_timestamp
}


/**
 * Defines the options for configuring a LavalinkNode.
 */
export interface LavalinkNodeOptions {
    /**
     * A unique identifier for this LavalinkNode, used for organization.
     */
    id: string;
    /**
     * The hostname or IP address of the Lavalink server.
     * @defaultValue "localhost"
     */
    host: string;
    /**
     * The port number of the Lavalink server.
     * @defaultValue 2333
     */
    port?: number | string;
    /**
     * The password for authenticating with the Lavalink server.
     * @defaultValue "youshallnotpass"
     */
    password?: string;
    /**
     * The interval (in milliseconds) at which the node will attempt to reconnect if the connection is lost.
     * @defaultValue 10000 (10 seconds)
     */
    reconnectInterval?: number;
    /**
     * A previous session ID to attempt to resume a connection with the Lavalink server.
     */
    sessionId?: string;
    /**
     * Whether the node should attempt to resume the session if a `sessionId` is present when the WebSocket connection opens or the node becomes ready.
     * @defaultValue false
     */
    resuming?: boolean;
    /**
     * The timeout (in seconds) for resuming a session.
     * @defaultValue 120 (2 minutes)
     */
    resumeTimeout?: number;
    /**
     * Arbitrary state data that can be attached to the node for user-specific purposes.
     * This data is not sent to Lavalink.
     */
    state?: unknown;
}