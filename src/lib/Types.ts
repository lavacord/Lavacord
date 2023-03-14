import type { Player } from "./Player";

/**
 * Player Update Voice State
 */
export interface PlayerUpdateVoiceState {
    /**
     * The session id of the voice connection
     */
    sessionId: string;
    /**
     * Event data
     */
    event: VoiceServerUpdate;
}

/**
 * Manager Options
 */
export interface ManagerOptions {
    /**
     * User id of the bot
     */
    user?: string;
    /**
     * The Player class that the manager uses to create Players, so users can modify this
     */
    player?: typeof Player;
    /**
     * The send function for end users to implement for their specific library
     */
    send?: (packet: DiscordPacket) => unknown;
}

/**
 * Manager Join Data
 */
export interface JoinData {
    /**
     * The guild id of the guild the voice channel is in, that you want to join
     */
    guild: string;
    /**
     * The voice channel you want to join
     */
    channel: string;
    /**
     * The LavalinkNode ID you want to use
     */
    node: string;
}

/**
 * Manager Join Options
 */
export interface JoinOptions {
    /**
     * Whether or not the bot will be self muted when it joins the voice channel
     */
    selfmute?: boolean;
    /**
     * Whether or not the bot will be self deafen when it joins the voice channel
     */
    selfdeaf?: boolean;
}

/**
 * Voice Server Update
 */
export interface VoiceServerUpdate {
    /**
     * The token for the session
     */
    token: string;
    /**
     * Guild if of the voice connection
     */
    guild_id: string;
    /**
     * The endpoint lavalink will connect to
     */
    endpoint: string;
}

/**
 * Voice State Update
 */
export interface VoiceStateUpdate {
    /**
     * Guild id
     */
    guild_id: string;
    /**
     * channel id
     */
    channel_id?: string;
    /**
     * User id
     */
    user_id: string;
    /**
     * Session id
     */
    session_id: string;
    /**
     * Whether the user is deafened or not
     */
    deaf?: boolean;
    /**
     * Whether the user is muted or not
     */
    mute?: boolean;
    /**
     * Whether the user is self-deafened or not
     */
    self_deaf?: boolean;
    /**
     * Whether the user is self-muted or not
     */
    self_mute?: boolean;
    /**
     * Whether the user is suppressed
     */
    suppress?: boolean;
}

/**
 * Discord Packet
 */
export interface DiscordPacket {
    /**
     * opcode for the payload
     */
    op: number;
    /**
     * event data
     */
    d: any;
    /**
     * sequence number, used for resuming sessions and heartbeats
     */
    s?: number;
    /**
     * the event name for this payload
     */
    t?: string;
}

/**
 * Lavalink Node Options
 */
export interface LavalinkNodeOptions {
    /**
     * The id of the LavalinkNode so Nodes are better organized
     */
    id: string;
    /**
     * The host of the LavalinkNode, this could be a ip or domain.
     */
    host: string;
    /**
     * The port of the LavalinkNode
     */
    port?: number | string;
    /**
     * The password of the lavalink node
     */
    password?: string;
    /**
     * The interval that the node will try to reconnect to lavalink at in milliseconds
     */
    reconnectInterval?: number;
    /**
     * The resume key to send to the LavalinkNode so you can resume properly
     */
    resumeKey?: string;
    /**
     * Resume timeout
     */
    resumeTimeout?: number;
    /**
     * Extra info attached to your node, not required and is not sent to lavalink, purely for you.
     */
    state?: any;
}
