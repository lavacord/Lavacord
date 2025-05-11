/* eslint-disable @typescript-eslint/no-explicit-any */
import { EventEmitter } from "events";
import { Rest } from "./Rest";
import type { LavalinkNode } from "./LavalinkNode";
import type { Manager } from "./Manager";
import type { PlayerUpdateVoiceState, JoinOptions } from "./Types";
import type { EventOP, PlayerState, Equalizer, Filters, PlayerUpdate, UpdatePlayerData, UpdatePlayerResult, DestroyPlayerResult, Player as APIPlayer } from "lavalink-types/v4";

/**
 * The Player class, this handles everything to do with the guild sides of things, like playing, stoping, pausing, resuming etc
 */
export class Player extends EventEmitter {
    /**
     * The PlayerState of this Player
     */
    public state: Partial<PlayerState> & { filters: Filters; } = { filters: {} };
    /**
     * Whether or not the player is actually playing anything
     */
    public playing = false;
    /**
     * When the track started playing
     */
    public timestamp: number | null = null;
    /**
     * Whether or not the song that is playing is paused or not
     */
    public paused = false;
    /**
     * The current track in Lavalink's base64 string form
     */
    public track: string | null = null;
    /**
     * The voiceUpdateState of the player, used for swtiching nodes
     */
    public voiceUpdateState: PlayerUpdateVoiceState | null = null;

    /**
     * The constructor of the player
     * @param node The Lavalink of the player
     * @param id the id of the player, aka the guild id
     */
    public constructor(public node: LavalinkNode, public id: string) {
        super();

        this.on("event", data => {
            switch (data.type) {
                case "TrackStartEvent":
                    if (this.listenerCount("start")) this.emit("start", data);
                    break;
                case "TrackEndEvent":
                    if (data.reason !== "replaced") this.playing = false;
                    this.track = null;
                    this.timestamp = null;
                    if (this.listenerCount("end")) this.emit("end", data);
                    break;
                case "TrackExceptionEvent":
                    if (this.listenerCount("error")) this.emit("error", data);
                    break;
                case "TrackStuckEvent":
                    this.stop();
                    if (this.listenerCount("end")) this.emit("end", data);
                    break;
                case "WebSocketClosedEvent":
                    if (this.listenerCount("error")) this.emit("error", data);
                    break;
                default:
                    if (this.listenerCount("warn")) this.emit("warn", `Unexpected event type: ${(data as { type: string; }).type}`);
                    break;
            }
        })
            .on("playerUpdate", data => {
                this.state = { filters: this.state.filters, ...data.state };
            });
    }

    /**
     * Updates the current player on lavalink
     * @param options Update options
     * @param noReplace If the event should be dropped if there's a currently playing track should encodedTrack or identifier be present in options
     */
    public async update(options: UpdatePlayerData, noReplace = false): Promise<UpdatePlayerResult> {
        const d = await Rest.updatePlayer(this.node, this.id, options, noReplace);
        if (d.track) this.track = d.track.encoded;
        return d;
    }

    /**
     * Plays the specified song using the base64 string from lavalink
     * @param track The base64 string of the song that you want to play
     * @param options Play options
     */
    public async play(track: string, options?: Omit<UpdatePlayerData, "track"> & { noReplace?: boolean; userData?: Record<any, any>; }): Promise<UpdatePlayerResult> {
        const noReplace = options?.noReplace ?? false;
        const userData = options?.userData;
        if (options) {
            delete options.noReplace;
            delete options.userData;
        }
        const d = await this.update(Object.assign({ track: { encoded: track, userData } } as UpdatePlayerData, options), noReplace);
        this.playing = true;
        this.timestamp = Date.now();
        return d;
    }

    /**
     * Stops the music, depending on how the end event is handled this will either stop
     */
    public async stop(): Promise<APIPlayer> {
        const d = await this.update({ track: { encoded: null } });
        this.playing = false;
        this.timestamp = null;
        return d;
    }

    /**
     * Pauses/Resumes the song depending on what is specified
     * @param pause Whether or not to pause whats currently playing
     */
    public async pause(pause: boolean): Promise<APIPlayer> {
        const d = await this.update({ paused: pause });
        this.paused = pause;
        if (this.listenerCount("pause")) this.emit("pause", pause);
        return d;
    }

    /**
     * Resumes the current song
     */
    public resume(): Promise<APIPlayer> {
        return this.pause(false);
    }

    /**
     * Changes the volume, only for the current song
     * @param volume The volume as a float from 0.0 to 10.0. 1.0 is default.
     */
    public async volume(volume: number): Promise<APIPlayer> {
        const d = await this.update({ volume: volume * 100 });
        if (this.listenerCount("volume")) this.emit("volume", volume);
        return d;
    }

    /**
     * Seeks the current song to a certain position
     * @param position Seeks the song to the position specified in milliseconds, use the duration of the song from lavalink to get the duration
     */
    public async seek(position: number): Promise<APIPlayer> {
        const d = await this.update({ position });
        if (this.listenerCount("seek")) this.emit("seek", position);
        return d;
    }

    public async filters(options: Filters): Promise<APIPlayer> {
        const d = await this.update({ filters: options });
        this.state.filters = options;
        if (this.listenerCount("filters")) this.emit("filters", options);
        return d;
    }

    /**
     * Sets the equalizer of the current song, if you wanted to do something like bassboost
     * @param bands The bands that you want lavalink to modify read [IMPLEMENTATION.md](https://github.com/lavalink-devs/Lavalink/blob/master/IMPLEMENTATION.md#equalizer) for more information
     */
    public async equalizer(bands: Equalizer[]): Promise<APIPlayer> {
        const newFilters = Object.assign(this.state.filters, { equalizer: bands });
        const d = await this.filters(newFilters);
        return d;
    }

    /**
     * Sends a destroy signal to lavalink, basically just a cleanup op for lavalink to clean its shit up
     */
    public async destroy(): Promise<DestroyPlayerResult> {
        return Rest.destroyPlayer(this.node, this.id);
    }

    /**
     * Sends voiceUpdate information to lavalink so it can connect to discords voice servers properly
     * @param data The data lavalink needs to connect and recieve data from discord
     */
    public connect(data: PlayerUpdateVoiceState): Promise<APIPlayer> {
        this.voiceUpdateState = data;
        return this.update({ voice: { token: data.event.token, endpoint: data.event.endpoint, sessionId: data.sessionId } });
    }

    /**
     * Use this to switch channels
     * @param channel The channel id of the channel you want to switch to
     * @param options selfMute and selfDeaf options
     */
    public switchChannel(channel: string, options: JoinOptions = {}): any {
        return this.manager.sendWS(this.id, channel, options);
    }

    /**
     * The manager that created the player
     */
    public get manager(): Manager {
        return this.node.manager;
    }
}

export interface PlayerEvents {
    event: [EventOP];
    start: [Extract<EventOP, { type: "TrackStartEvent"; }>];
    end: [Extract<EventOP, { type: "TrackEndEvent" | "TrackStuckEvent"; }>];
    pause: [boolean];
    seek: [number];
    error: [Extract<EventOP, { type: "TrackExceptionEvent" | "WebSocketClosedEvent"; }>];
    warn: [string];
    volume: [number];
    playerUpdate: [PlayerUpdate];
    filters: [Filters];
}

export interface Player {
    addListener<E extends keyof PlayerEvents>(event: E, listener: (...args: PlayerEvents[E]) => any): this;
    emit<E extends keyof PlayerEvents>(event: E, ...args: PlayerEvents[E]): boolean;
    eventNames(): (keyof PlayerEvents)[];
    listenerCount(event: keyof PlayerEvents): number;
    listeners(event: keyof PlayerEvents): ((...args: any[]) => any)[];
    off<E extends keyof PlayerEvents>(event: E, listener: (...args: PlayerEvents[E]) => any): this;
    on<E extends keyof PlayerEvents>(event: E, listener: (...args: PlayerEvents[E]) => any): this;
    once<E extends keyof PlayerEvents>(event: E, listener: (...args: PlayerEvents[E]) => any): this;
    prependListener<E extends keyof PlayerEvents>(event: E, listener: (...args: PlayerEvents[E]) => any): this;
    prependOnceListener<E extends keyof PlayerEvents>(event: E, listener: (...args: PlayerEvents[E]) => any): this;
    rawListeners(event: keyof PlayerEvents): ((...args: any[]) => any)[];
    removeAllListeners(event?: keyof PlayerEvents): this;
    removeListener<E extends keyof PlayerEvents>(event: E, listener: (...args: PlayerEvents[E]) => any): this;
}
