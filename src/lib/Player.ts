/* eslint-disable @typescript-eslint/no-explicit-any */
import { EventEmitter } from "events";
import { Rest } from "./Rest";
import type { LavalinkNode } from "./LavalinkNode";
import type { Manager } from "./Manager";
import type { PlayerUpdateVoiceState, JoinOptions, PlayerEvents } from "./Types";
import type {
	PlayerState,
	Equalizer,
	Filters,
	UpdatePlayerData,
	UpdatePlayerResult,
	DestroyPlayerResult,
	Track,
	VoiceState
} from "lavalink-types/v4";

/**
 * The Player class that handles playback and audio manipulation for a specific guild.
 *
 * @remarks
 * This class is responsible for audio playback operations, including playing, stopping,
 * pausing, resuming, and applying audio filters. Each instance represents a player
 * for a specific guild.
 */
export class Player extends EventEmitter<PlayerEvents> {
	/**
	 * The current state of this Player
	 *
	 * @remarks
	 * Contains information about the player state from Lavalink, including position, filters, etc.
	 */
	public state: PlayerState = {
		time: 0,
		position: 0,
		connected: false,
		ping: 0
	};
	/**
	 * The timestamp when the current track started playing
	 *
	 * @remarks
	 * This is a client-side timestamp, not synchronized with Lavalink.
	 * Can be used to calculate approximate playback position.
	 */
	public timestamp: number | null = null;
	/**
	 * Whether the audio playback is currently paused
	 */
	public paused = false;
	/**
	 * The current volume level (0-1000)
	 */
	public volume = 100;
	/**
	 * The current track in Lavalink's base64 string form
	 *
	 * @remarks
	 * This is null when no track is loaded or when playback has ended.
	 */
	public track: Track | null = null;
	/**
	 * The voice connection state from Lavalink API
	 */
	public voice: VoiceState | null = null;
	/**
	 * The current audio filters applied to this player
	 *
	 * @remarks
	 * This includes effects like equalizer, karaoke, etc.
	 */
	public filters: Filters = {};

	/**
	 * Creates a new player instance.
	 *
	 * @param node - The Lavalink node this player is connected to.
	 * @param guildId - The guild ID that this player is associated with.
	 */
	public constructor(
		/**
		 * The Lavalink node this player is connected to
		 */
		public node: LavalinkNode,
		/**
		 * The guild ID for this player
		 */
		public guildId: string
	) {
		super();
	}

	/**
	 * Updates the current player on the Lavalink node.
	 *
	 * @param options - The update options to apply to the player.
	 * @param noReplace - If true, the event will be dropped if there's a currently playing track.
	 * @returns A promise resolving to the updated player information.
	 */
	public async update(options: UpdatePlayerData, noReplace = false): Promise<UpdatePlayerResult> {
		const d = await Rest.updatePlayer(this.node, this.guildId, options, noReplace);

		// Update local state with response data
		if (d.track !== undefined) this.track = d.track;
		if (d.volume !== undefined) this.volume = d.volume;
		if (d.paused !== undefined) this.paused = d.paused;
		if (d.state) this.state = d.state;
		if (d.filters) this.filters = d.filters;
		if (d.voice) this.voice = d.voice;

		return d;
	}

	/**
	 * Plays a track using its base64 encoded string.
	 *
	 * @param track - The base64 encoded track string from Lavalink.
	 * @param options - Additional options for playback.
	 * @returns A promise resolving to the updated player information.
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
			options.noReplace = undefined;
			options.userData = undefined;
		}
		const d = await this.update(Object.assign({ track: { encoded: track, userData } } as UpdatePlayerData, options), noReplace);
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
	 */
	public stop(): Promise<UpdatePlayerResult> {
		return this.update({ track: { encoded: null } });
	}

	/**
	 * Pauses or resumes the current track.
	 *
	 * @param pause - Whether to pause (true) or resume (false) playback.
	 * @returns A promise resolving to the updated player information.
	 */
	public async pause(pause: boolean): Promise<UpdatePlayerResult> {
		const d = await this.update({ paused: pause });
		if (this.listenerCount("pause")) this.emit("pause", pause);
		if (this.manager.listenerCount("playerPause")) this.manager.emit("playerPause", this, pause);
		return d;
	}

	/**
	 * Changes the volume of the current playback.
	 *
	 * @param volume - The volume level as a number between 0 and 1000
	 * @returns A promise resolving to the updated player information.
	 */
	public async setVolume(volume: number): Promise<UpdatePlayerResult> {
		const d = await this.update({ volume });
		if (this.listenerCount("volume")) this.emit("volume", volume);
		if (this.manager.listenerCount("playerVolume")) this.manager.emit("playerVolume", this, volume);
		return d;
	}

	/**
	 * Seeks to a specific position in the current track.
	 *
	 * @param position - The position to seek to in milliseconds.
	 * @returns A promise resolving to the updated player information.
	 */
	public async seek(position: number): Promise<UpdatePlayerResult> {
		const d = await this.update({ position });
		if (this.listenerCount("seek")) this.emit("seek", position);
		if (this.manager.listenerCount("playerSeek")) this.manager.emit("playerSeek", this, position);
		return d;
	}

	/**
	 * Applies audio filters to the current playback.
	 *
	 * @param options - The filter options to apply.
	 * @returns A promise resolving to the updated player information.
	 */
	public async setFilters(options: Filters): Promise<UpdatePlayerResult> {
		const d = await this.update({ filters: options });
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
	 */
	public async setEqualizer(bands: Equalizer[]): Promise<UpdatePlayerResult> {
		return this.setFilters({ equalizer: bands });
	}

	/**
	 * Destroys the player on the Lavalink node.
	 *
	 * @remarks
	 * This sends a destroy signal to Lavalink to clean up resources for this guild ID.
	 * It doesn't affect the Discord voice connection - use {@link Manager.leave} for that.
	 *
	 * @returns {Promise<DestroyPlayerResult>} A promise resolving to the destroy result.
	 */
	public async destroy(): Promise<DestroyPlayerResult> {
		return Rest.destroyPlayer(this.node, this.guildId);
	}

	/**
	 * Provides voice server update information to Lavalink to establish a connection.
	 *
	 * @param data - The voice update state containing session ID and voice server information.
	 * @returns A promise resolving to the updated player information.
	 */
	public connect(data: PlayerUpdateVoiceState): Promise<UpdatePlayerResult> {
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
	 * @returns Does not return anything, but sends a WebSocket message to the Lavalink node.
	 */
	public switchChannel(channel: string, options: JoinOptions = {}): any {
		return this.manager.sendWS(this.guildId, channel, options);
	}

	/**
	 * Gets the manager instance that created this player.
	 *
	 * @returns {Manager} The manager instance.
	 */
	public get manager(): Manager {
		return this.node.manager;
	}
}
