import { Player } from "./Player";
import WebSocket from "ws";

/**
 * The Lavalink Event
 * */
export interface LavalinkEvent {
    /**
     * The type of event from lavalink
     */
    type: "TrackStartEvent" | "TrackEndEvent" | "TrackExceptionEvent" | "TrackStuckEvent" | "WebSocketClosedEvent";
    /**
     * Why the event was sent, only used for TrackEndEvent
     */
    reason?: "FINISHED" | "LOAD_FAILED" | "STOPPED" | "REPLACED" | "CLEANUP";
    /**
     * The buffer threshold in milliseconds
     */
    thresholdMs?: number;
    /**
     * the error for TrackExceptionEvent
     */
    error?: string;
}

/**
 * Lavalink Player State
 */
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

/**
 * Player State
 */
export interface PlayerState extends LavalinkPlayerState {
    /**
     * The current filters state of the Player, so end users can keep track if they need to
     */
    filters: PlayerFilterOptions;
}

/**
 * Player Play Options
 */
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

/**
 * Player Equalizer Band
 */
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

/**
 * Manager Options
 */
export interface ManagerOptions {
    /**
     * User id of the bot
     */
    user?: string;
    /**
     * The amount of shards the bot is currently operating on, by default this is `1`
     */
    shards?: number;
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

/**
 * Lavalink Statistics
 */
export interface LavalinkStats {
    /**
     * The amount of players the node is handling
     */
    players: number;
    /**
     * The amount of players that are playing something
     */
    playingPlayers: number;
    /**
     * How long the LavalinkNode has been up for in milliseconds
     */
    uptime: number;
    /**
     * memory information
     */
    memory: {
        /**
         * The amount of memory that is free
         */
        free: number;
        /**
         * the amount of memory that is used
         */
        used: number;
        /**
         * The amount of allocated memory
         */
        allocated: number;
        /**
         * The amount of reservable memory
         */
        reservable: number;
    };
    /**
     * CPU Data
     */
    cpu: {
        /**
         * The amount of cores the server has where lavalink is hosted
         */
        cores: number;
        /**
         * System load of the server lavalink is on
         */
        systemLoad: number;
        /**
         * The amount of load that lavalink is using
         */
        lavalinkLoad: number;
    };
    /**
     * Frame statistics
     */
    frameStats?: {
        /**
         * The amount of frames sent
         */
        sent?: number;
        /**
         * The amount of frames nullified
         */
        nulled?: number;
        /**
         * The amount of deficit frames
         */
        deficit?: number;
    };
}

/**
 * Queue Data
 */
export interface QueueData {
    /**
     * The data to actually send from the queue
     */
    data: string;
    /**
     * The resolve function for the promise
     */
    resolve: (value?: boolean | PromiseLike<boolean> | undefined) => void;
    /**
     * The reject function for the promise
     */
    reject: (reason?: any) => void;
}

/**
 * Websocket Close Event
 */
export interface WebsocketCloseEvent {
    /**
     * If the close was clean or not
     */
    wasClean: boolean;
    /**
     * The code that was sent for the close
     */
    code: number;
    /**
     * The reason of the closure
     */
    reason: string;
    /**
     * The target
     */
    target: WebSocket;
}

/**
 * Track Response
 */
export interface TrackResponse {
    /**
     * Load Type
     */
    loadType: LoadType;
    /**
     * Playlist Info
     */
    playlistInfo: PlaylistInfo;
    /**
     * All the Tracks in an array
     */
    tracks: TrackData[];
}

/**
 * LoadType ENUM
 */
export enum LoadType {
    TRACK_LOADED = "TRACK_LOADED",
    PLAYLIST_LOADED = "PLAYLIST_LOADED",
    SEARCH_RESULT = "SEARCH_RESULT",
    NO_MATCHES = "NO_MATCHES",
    LOAD_FAILED = "LOAD_FAILED"
}

/**
 * Playlist Info
 */
export interface PlaylistInfo {
    /**
     * Playlist Name
     */
    name?: string;
    /**
     * Selected track from playlist
     */
    selectedTrack?: number;
}

/**
 * Lavalink Track
 */
export interface TrackData {
    /**
     * The track base64 string
     */
    track: string;
    /**
     * All the meta data on the track
     */
    info: {
        /**
         * The id of the track, depends on the source
         */
        identifier: string;
        /**
         * Whether you can use seek with this track
         */
        isSeekable: boolean;
        /**
         * The author of the track
         */
        author: string;
        /**
         * The length of the track
         */
        length: number;
        /**
         * Whether or not the track is a stream
         */
        isStream: boolean;
        /**
         * The position of the song
         */
        position: number;
        /**
         * The title of the track
         */
        title: string;
        /**
         * The URI of the track
         */
        uri: string;
    };
}

/**
 * The 3 types of Route Planner Statuses
 */
export type RoutePlannerStatus = RotatingIpRoutePlanner | NanoIpRoutePlanner | RotatingIpRoutePlanner;

/**
 * Base Route Planner Status Data
 */
export interface BaseRoutePlannerStatusData {
    /**
     * The IP Block
     */
    ipBlock: {
        /**
         * The IP block type
         */
        type: string;
        /**
         * IP Block size
         */
        size: string;
    };
    /**
     * Failing Addresses
     */
    failingAddresses: {
        /**
         * The address
         */
        address: string;
        /**
         * Failing Timestamp
         */
        failingTimestamp: number;
        /**
         * Failing Time
         */
        failingTime: string;
    }[];
}

/**
 * Rotating Ip Route Planner
 */
export interface RotatingIpRoutePlanner {
    /**
     * Class name
     */
    class: "RotatingIpRoutePlanner";
    /**
     * Details
     */
    details: BaseRoutePlannerStatusData & {
        /**
         * Rotate index
         */
        rotateIndex: string;
        /**
         * Ip index
         */
        ipIndex: string;
        /**
         * The current address
         */
        currentAddress: string;
    };
}

/**
 * Nano IP Route Planner
 */
export interface NanoIpRoutePlanner {
    /**
     * Class name
     */
    class: "NanoIpRoutePlanner";
    /**
     * Details
     */
    details: BaseRoutePlannerStatusData & {
        /**
         * Current Address Index
         */
        currentAddressIndex: number;
    };
}

/**
 * Rotating Nano IP Route Planner
 */
export interface RotatingNanoIpRoutePlanner {
    /**
     * Class name
     */
    class: "RotatingNanoIpRoutePlanner";
    /** Details */
    details: BaseRoutePlannerStatusData & {
        /**
         * Block Index
         */
        blockIndex: string;
        /**
         * Current Address Index
         */
        currentAddressIndex: number;
    };
}

export interface PlayerFilterOptions {
    /** Float value of 0-1 where 1.0 is 100%. Values >1.0 may cause clipping */
    volume?: number;
    equalizer?: PlayerEqualizerBand[];
    /** Uses equalization to eliminate part of a band, usually targeting vocals */
    karaoke?: PlayerKaraokeOptions;
    /** Changes the speed, pitch, and rate. All default to 1.0 */
    timescale?: {
        speed?: number;
        pitch?: number;
        rate?: number;
    };
    /** Uses amplification to create a shuddering effect, where the volume quickly oscillates */
    tremelo?: {
        frequency?: number;
        depth?: number;
    };
    /** Similar to tremolo. While tremolo oscillates the volume, vibrato oscillates the pitch */
    vibrato?: {
        frequency?: number;
        depth?: number;
    };
}

export interface PlayerKaraokeOptions {
    level?: number;
    monoLevel?: number;
    filterBand?: number;
    filterWidth?: number;
}
