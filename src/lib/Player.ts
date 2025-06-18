/* eslint-disable @typescript-eslint/no-explicit-any */
import { EventEmitter } from "events";
import { Rest } from "./Rest";
import type { LavalinkNode } from "./LavalinkNode";
import type { Manager } from "./Manager";
import type { PlayerUpdateVoiceState, JoinOptions } from "./Types";
import type {
	EventOP,
	PlayerState,
	Equalizer,
	Filters,
	PlayerUpdate,
	UpdatePlayerData,
	UpdatePlayerResult,
	DestroyPlayerResult,
	Player as APIPlayer
} from "lavalink-types/v4";

/**
 * The Player class that handles playback and audio manipulation for a specific guild.
 *
 * @remarks
 * This class is responsible for audio playback operations, including playing, stopping,
 * pausing, resuming, and applying audio filters. Each instance represents a player
 * for a specific guild.
 *
 * @example
 * ```typescript
 * // Creating a player (usually through the manager)
 * const player = await manager.join({
 *   guild: "123456789012345678",
 *   channel: "123456789012345679",
 *   node: "main"
 * });
 *
 * // Basic playback control
 * const searchResults = await Rest.load(player.node, "ytsearch:favorite song");
 * await player.play(searchResults.tracks[0].track);
 * await player.pause(true);  // Pause
 * await player.pause(false); // Resume
 * await player.volume(0.5);  // Set to 50% volume
 * await player.stop();       // Stop playing
 * ```
 *
 * @public
 */
export class Player extends EventEmitter {
	/**
	 * The current state of this Player
	 *
	 * @remarks
	 * Contains information about the player state from Lavalink, including position, filters, etc.
	 *
	 * @public
	 */
	public state: Partial<PlayerState> & { filters: Filters } = { filters: {} };
	/**
	 * Whether the player is currently playing audio
	 *
	 * @public
	 */
	public playing = false;
	/**
	 * The timestamp when the current track started playing
	 *
	 * @remarks
	 * This is a client-side timestamp, not synchronized with Lavalink.
	 * Can be used to calculate approximate playback position.
	 *
	 * @public
	 */
	public timestamp: number | null = null;
	/**
	 * Whether the audio playback is currently paused
	 *
	 * @public
	 */
	public paused = false;
	/**
	 * The current track in Lavalink's base64 string form
	 *
	 * @remarks
	 * This is null when no track is loaded or when playback has ended.
	 *
	 * @public
	 */
	public track: string | null = null;
	/**
	 * The voice connection state information, used for node switching
	 *
	 * @remarks
	 * Contains session ID and voice server information needed to establish a connection.
	 *
	 * @public
	 */
	public voiceUpdateState: PlayerUpdateVoiceState | null = null;

	/**
	 * Creates a new player instance.
	 *
	 * @param node - The Lavalink node this player is connected to.
	 * @param id - The guild ID that this player is associated with.
	 *
	 * @public
	 */
	public constructor(
		public node: LavalinkNode,
		public id: string
	) {
		super();

		this.on("event", (data) => {
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
					if (this.listenerCount("warn")) this.emit("warn", `Unexpected event type: ${(data as { type: string }).type}`);
					break;
			}
		}).on("playerUpdate", (data) => {
			this.state = { filters: this.state.filters, ...data.state };
		});
	}

	/**
	 * Updates the current player on the Lavalink node.
	 *
	 * @param options - The update options to apply to the player.
	 * @param noReplace - If true, the event will be dropped if there's a currently playing track.
	 * @returns A promise resolving to the updated player information.
	 *
	 * @example
	 * ```typescript
	 * // Update multiple properties at once
	 * await player.update({
	 *   volume: 80,
	 *   paused: false,
	 *   position: 15000, // Seek to 15 seconds
	 *   filters: {
	 *     equalizer: [
	 *       { band: 0, gain: 0.2 },
	 *       { band: 1, gain: 0.2 }
	 *     ]
	 *   }
	 * });
	 * ```
	 *
	 * @public
	 */
	public async update(options: UpdatePlayerData, noReplace = false): Promise<UpdatePlayerResult> {
		const d = await Rest.updatePlayer(this.node, this.id, options, noReplace);
		if (d.track) this.track = d.track.encoded;
		return d;
	}

	/**
	 * Plays a track using its base64 encoded string.
	 *
	 * @param track - The base64 encoded track string from Lavalink.
	 * @param options - Additional options for playback.
	 * @returns A promise resolving to the updated player information.
	 *
	 * @example
	 * ```typescript
	 * // Basic playback
	 * const results = await Rest.load(player.node, "https://www.youtube.com/watch?v=dQw4w9WgXcQ");
	 * await player.play(results.tracks[0].track);
	 *
	 * // Play with options
	 * await player.play(track, {
	 *   volume: 75,       // Set volume to 75%
	 *   paused: false,    // Start playing immediately
	 *   position: 30000,  // Start at 30 seconds
	 *   // Store custom data with the track
	 *   userData: {
	 *     requestedBy: "123456789012345678",
	 *     requestedAt: new Date().toISOString()
	 *   }
	 * });
	 *
	 * // Play without replacing current track using noReplace option
	 * await player.play(newTrack, {
	 *   noReplace: true,
	 *   // If a track is already playing, this request will be ignored
	 * });
	 * ```
	 *
	 * @public
	 */
	public async play(
		track: string,
		options?: Omit<UpdatePlayerData, "track"> & {
			noReplace?: boolean;
			userData?: Record<any, any>;
		}
	): Promise<UpdatePlayerResult> {
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
	 * Stops the currently playing track.
	 *
	 * @remarks
	 * This will trigger a "TrackEndEvent" with reason "STOPPED".
	 *
	 * @returns A promise resolving to the updated player information.
	 *
	 * @example
	 * ```typescript
	 * // Stop the current playback
	 * await player.stop();
	 * console.log("Playback stopped");
	 *
	 * // You can listen for the end event to know when a track stops
	 * player.on("end", (data) => {
	 *   console.log(`Track ended with reason: ${data.reason}`);
	 *   // Load next track in queue, etc.
	 * });
	 * ```
	 *
	 * @public
	 */
	public async stop(): Promise<APIPlayer> {
		const d = await this.update({ track: { encoded: null } });
		this.playing = false;
		this.timestamp = null;
		return d;
	}

	/**
	 * Pauses or resumes the current track.
	 *
	 * @param pause - Whether to pause (true) or resume (false) playback.
	 * @returns A promise resolving to the updated player information.
	 *
	 * @example
	 * ```typescript
	 * // Pause playback
	 * await player.pause(true);
	 * console.log("Playback paused");
	 *
	 * // Resume playback
	 * await player.pause(false);
	 * console.log("Playback resumed");
	 *
	 * // You can also check the current state
	 * console.log(`Player is ${player.paused ? "paused" : "playing"}`);
	 *
	 * // Listen for pause events
	 * player.on("pause", (isPaused) => {
	 *   console.log(`Player is now ${isPaused ? "paused" : "playing"}`);
	 * });
	 * ```
	 *
	 * @public
	 */
	public async pause(pause: boolean): Promise<APIPlayer> {
		const d = await this.update({ paused: pause });
		this.paused = pause;
		if (this.listenerCount("pause")) this.emit("pause", pause);
		return d;
	}

	/**
	 * Resumes playback of the current track.
	 *
	 * @returns A promise resolving to the updated player information.
	 *
	 * @example
	 * ```typescript
	 * // Resume playback if paused
	 * if (player.paused) {
	 *   await player.resume();
	 *   console.log("Playback resumed");
	 * }
	 *
	 * // You can use this instead of player.pause(false)
	 * ```
	 *
	 * @public
	 */
	public resume(): Promise<APIPlayer> {
		return this.pause(false);
	}

	/**
	 * Changes the volume of the current playback.
	 *
	 * @param volume - The volume level as a float from 0.0 to 10.0 (1.0 is default).
	 * @returns A promise resolving to the updated player information.
	 *
	 * @example
	 * ```typescript
	 * // Set to normal volume (100%)
	 * await player.volume(1.0);
	 *
	 * // Set to half volume (50%)
	 * await player.volume(0.5);
	 *
	 * // Set to double volume (200%)
	 * await player.volume(2.0);
	 *
	 * // Mute (0%)
	 * await player.volume(0.0);
	 *
	 * // Listen for volume changes
	 * player.on("volume", (volume) => {
	 *   console.log(`Volume changed to ${volume * 100}%`);
	 * });
	 * ```
	 *
	 * @public
	 */
	public async volume(volume: number): Promise<APIPlayer> {
		const d = await this.update({ volume: volume * 100 });
		if (this.listenerCount("volume")) this.emit("volume", volume);
		return d;
	}

	/**
	 * Seeks to a specific position in the current track.
	 *
	 * @param position - The position to seek to in milliseconds.
	 * @returns A promise resolving to the updated player information.
	 *
	 * @example
	 * ```typescript
	 * // Seek to 1 minute
	 * await player.seek(60000);
	 *
	 * // Seek to 30 seconds
	 * await player.seek(30000);
	 *
	 * // Get current position (approximate)
	 * let currentPosition = 0;
	 * if (player.playing && player.timestamp) {
	 *   currentPosition = player.state.position || 0;
	 *   if (!player.paused) {
	 *     // Add time elapsed since last update
	 *     currentPosition += (Date.now() - player.timestamp);
	 *   }
	 * }
	 * console.log(`Current position: ${currentPosition}ms`);
	 *
	 * // Listen for seek events
	 * player.on("seek", (position) => {
	 *   console.log(`Seeked to ${position}ms`);
	 * });
	 * ```
	 *
	 * @public
	 */
	public async seek(position: number): Promise<APIPlayer> {
		const d = await this.update({ position });
		if (this.listenerCount("seek")) this.emit("seek", position);
		return d;
	}

	/**
	 * Applies audio filters to the current playback.
	 *
	 * @param options - The filter options to apply.
	 * @returns A promise resolving to the updated player information.
	 *
	 * @example
	 * ```typescript
	 * // Apply multiple filters at once
	 * await player.filters({
	 *   // Volume filter (separate from player volume)
	 *   volume: 0.8,
	 *
	 *   // Equalizer (15 bands, gain from -0.25 to 1.0)
	 *   equalizer: [
	 *     { band: 0, gain: 0.2 },  // Bass boost
	 *     { band: 1, gain: 0.15 },
	 *     { band: 2, gain: 0.1 }
	 *   ],
	 *
	 *   // Change speed/pitch/rate
	 *   timescale: {
	 *     speed: 1.1,  // 10% faster
	 *     pitch: 1.0,  // Normal pitch
	 *     rate: 1.0    // Normal playback rate
	 *   },
	 *
	 *   // Tremolo effect
	 *   tremolo: {
	 *     frequency: 4,
	 *     depth: 0.5
	 *   },
	 *
	 *   // Low pass filter
	 *   lowPass: {
	 *     smoothing: 20.0
	 *   }
	 * });
	 *
	 * // Reset all filters
	 * await player.filters({});
	 * ```
	 *
	 * @public
	 */
	public async filters(options: Filters): Promise<APIPlayer> {
		const d = await this.update({ filters: options });
		this.state.filters = options;
		if (this.listenerCount("filters")) this.emit("filters", options);
		return d;
	}

	/**
	 * Sets the equalizer effect for the current playback.
	 *
	 * @param bands - An array of equalizer bands to adjust.
	 * @returns A promise resolving to the updated player information.
	 *
	 * @remarks
	 * Each band is an object with 'band' (0-14) and 'gain' (-0.25 to 1.0) properties.
	 *
	 * @example
	 * ```typescript
	 * // Apply bass boost preset
	 * await player.equalizer([
	 *   { band: 0, gain: 0.3 },  // 0 = ~25 Hz
	 *   { band: 1, gain: 0.25 }, // 1 = ~40 Hz
	 *   { band: 2, gain: 0.2 },  // 2 = ~63 Hz
	 *   { band: 3, gain: 0.1 }   // 3 = ~100 Hz
	 * ]);
	 *
	 * // Apply party preset
	 * await player.equalizer([
	 *   { band: 0, gain: 0.2 },
	 *   { band: 1, gain: 0.1 },
	 *   { band: 8, gain: 0.1 },
	 *   { band: 9, gain: 0.15 },
	 *   { band: 10, gain: 0.2 }
	 * ]);
	 *
	 * // Reset equalizer by setting all bands to 0
	 * await player.equalizer([
	 *   { band: 0, gain: 0 },
	 *   { band: 1, gain: 0 },
	 *   // ... all bands 0-14
	 *   { band: 14, gain: 0 }
	 * ]);
	 *
	 * // Or reset equalizer by passing empty array
	 * await player.equalizer([]);
	 * ```
	 *
	 * @public
	 */
	public async equalizer(bands: Equalizer[]): Promise<APIPlayer> {
		const newFilters = Object.assign(this.state.filters, { equalizer: bands });
		const d = await this.filters(newFilters);
		return d;
	}

	/**
	 * Destroys the player on the Lavalink node.
	 *
	 * @remarks
	 * This sends a destroy signal to Lavalink to clean up resources for this guild ID.
	 * It doesn't affect the Discord voice connection - use {@link Manager.leave} for that.
	 *
	 * @returns A promise resolving when the player is destroyed.
	 *
	 * @example
	 * ```typescript
	 * // Clean up player resources on Lavalink side
	 * await player.destroy();
	 * console.log("Player destroyed on Lavalink");
	 *
	 * // To fully disconnect from a voice channel,
	 * // you should use manager.leave() instead:
	 * await manager.leave(guildId);
	 * ```
	 *
	 * @public
	 */
	public async destroy(): Promise<DestroyPlayerResult> {
		return Rest.destroyPlayer(this.node, this.id);
	}

	/**
	 * Provides voice server update information to Lavalink to establish a connection.
	 *
	 * @param data - The voice update state containing session ID and voice server information.
	 * @returns A promise resolving to the updated player information.
	 *
	 * @example
	 * ```typescript
	 * // This is typically called internally by the Manager
	 * await player.connect({
	 *   sessionId: "voice_session_id",
	 *   event: {
	 *     token: "voice_token",
	 *     endpoint: "voice_endpoint",
	 *     guild_id: "guild_id"
	 *   }
	 * });
	 * ```
	 *
	 * @public
	 */
	public connect(data: PlayerUpdateVoiceState): Promise<APIPlayer> {
		this.voiceUpdateState = data;
		return this.update({
			voice: {
				token: data.event.token,
				endpoint: data.event.endpoint,
				sessionId: data.sessionId
			}
		});
	}

	/**
	 * Switches the player to a different voice channel.
	 *
	 * @param channel - The ID of the voice channel to switch to.
	 * @param options - Options for joining the channel (selfMute, selfDeaf).
	 * @returns A promise resolving when the channel switch is complete.
	 *
	 * @example
	 * ```typescript
	 * // Switch to a different voice channel
	 * const newChannelId = "987654321098765432";
	 * await player.switchChannel(newChannelId);
	 *
	 * // Switch and apply options
	 * await player.switchChannel(newChannelId, {
	 *   selfdeaf: true,  // Join self-deafened
	 *   selfmute: false  // Not self-muted
	 * });
	 * ```
	 *
	 * @public
	 */
	public switchChannel(channel: string, options: JoinOptions = {}): any {
		return this.manager.sendWS(this.id, channel, options);
	}

	/**
	 * Gets the manager instance that created this player.
	 *
	 * @returns The Manager instance.
	 *
	 * @public
	 * @readonly
	 */
	public get manager(): Manager {
		return this.node.manager;
	}
}

/**
 * Type definition for Player events.
 *
 * @remarks
 * This interface defines the structure of events emitted by the Player.
 *
 * @public
 */
export interface PlayerEvents {
	/**
	 * Emitted for all events from Lavalink.
	 */
	event: [EventOP];
	/**
	 * Emitted when a track starts playing.
	 */
	start: [Extract<EventOP, { type: "TrackStartEvent" }>];
	/**
	 * Emitted when a track ends or gets stuck.
	 */
	end: [Extract<EventOP, { type: "TrackEndEvent" | "TrackStuckEvent" }>];
	/**
	 * Emitted when playback is paused or resumed.
	 */
	pause: [boolean];
	/**
	 * Emitted when seeking to a position.
	 */
	seek: [number];
	/**
	 * Emitted when a track exceptions occurs or the WebSocket connection closes.
	 */
	error: [Extract<EventOP, { type: "TrackExceptionEvent" | "WebSocketClosedEvent" }>];
	/**
	 * Emitted for warnings.
	 */
	warn: [string];
	/**
	 * Emitted when the volume changes.
	 */
	volume: [number];
	/**
	 * Emitted on player updates from Lavalink.
	 */
	playerUpdate: [PlayerUpdate];
	/**
	 * Emitted when filters are applied.
	 */
	filters: [Filters];
}

/**
 * Type declaration merging to properly type the event emitter methods.
 */
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
