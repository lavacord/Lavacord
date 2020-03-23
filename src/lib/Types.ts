import { Player } from "./Player";
import WebSocket from "ws";

export interface LavalinkEvent {
    /**
     * The type of event from lavalink
     */
    type: "TrackEndEvent" | "TrackExceptionEvent" | "TrackStuckEvent" | "WebSocketClosedEvent";
    /**
     * Why the event was sent, only used for TrackEndEvent
     */
    reason?: "FINISHED" | "LOAD_FAILED" | "STOPPED" | "REPLACED" | "CLEANUP";
}

export interface LavalinkPlayerState {
    /**
     * The current time in milliseconds
     */
    time?: number;
    /**
     * The position of where the song is at in milliseconds
     */
    position?: number;
}

export interface PlayerOptions {
    /**
     * The id of the player, aka the guild id
     */
    id: string;
    /**
     * The channel of the Player
     */
    channel: string;
}

export interface PlayerState extends LavalinkPlayerState {
    /**
     * The current volume of the Player, used for end user as lavalink doesn't provide this
     */
    volume: number;
    /**
     * The current equalizer state of the Player, so end users can keep track if they need to
     */
    equalizer: PlayerEqualizerBand[];
}

export interface PlayerPlayOptions {
    /**
     * Where to start the song fromm if you wanted to start from somewhere
     */
    startTime?: number;
    /**
     * Where to end the song if you wanted to end the song early
     */
    endTime?: number;
    /**
     * Whether to replace what is currently playing, aka skip the current song
     */
    noReplace?: boolean;
    /**
     * Whether to pause it at the start
     */
    pause?: boolean;
    /**
     * The volume to start playing at
     */
    volume?: number;
}

export interface PlayerEqualizerBand {
    /**
     * There are 15 bands (0-14) that can be changed
     */
    band: number;
    /**
     * Gain is the multiplier for the given band. The default value is 0. Valid values range from -0.25 to 1.0, where -0.25 means the given band is completely muted, and 0.25 means it is doubled. Modifying the gain could also change the volume of the output
     */
    gain: number;
}

export interface PlayerUpdateVoiceState {
    /**
     * The session id of the voice connection
     */
    sessionId: string;
    event: {
        /**
         * The token for the voice session
         */
        token: string;
        /**
         * The guild if of the voice connection
         */
        guild_id: string;
        /**
         * The endpoint for lavalink to connect to, e.g us-west, sydney etc
         */
        endpoint: string;
    };
}

export interface ManagerOptions {
    /**
     * User id of the bot
     */
    user: string;
    /**
     * The amount of shards the bot is currently operating on, by default this is `1`
     */
    shards?: number;
    /**
     * The Player class that the manager uses to create Players, so users can modify this
     */
    Player?: Player;
    /**
     * The send function for end users to implement for their specific library
     */
    send: (packet: DiscordPacket) => unknown;
}

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

export interface JoinOptions {
    selfmute?: boolean;
    selfdeaf?: boolean;
}

export interface VoiceServerUpdate {
    token: string;
    guild_id: string;
    endpoint: string;
}

export interface VoiceStateUpdate {
    guild_id: string;
    channel_id?: string;
    user_id: string;
    session_id: string;
    deaf?: boolean;
    mute?: boolean;
    self_deaf?: boolean;
    self_mute?: boolean;
    suppress?: boolean;
}

export interface DiscordPacket {
    op: number;
    d: any;
    s?: number;
    t?: string;
}

export interface LavalinkNodeOptions {
    id: string;
    host: string;
    port?: number | string;
    password?: string;
    reconnectInterval?: number;
}

export interface LavalinkStats {
    players: number;
    playingPlayers: number;
    uptime: number;
    memory: {
        free: number;
        used: number;
        allocated: number;
        reservable: number;
    };
    cpu: {
        cores: number;
        systemLoad: number;
        lavalinkLoad: number;
    };
    frameStats?: {
        sent?: number;
        nulled?: number;
        deficit?: number;
    };
}

export interface QueueData {
    data: string;
    resolve: (value?: boolean | PromiseLike<boolean> | undefined) => void;
    reject: (reason?: any) => void;
}

export interface WebsocketCloseEvent {
    wasClean: boolean;
    code: number;
    reason: string;
    target: WebSocket;
}
