import { URLSearchParams } from "url";
import type { LavalinkNode } from "./LavalinkNode";
import type {
	TrackLoadingResult,
	DecodeTrackResult,
	DecodeTracksResult,
	GetLavalinkVersionResult,
	UpdateSessionResult,
	UpdateSessionData,
	ErrorResponse,
	UpdatePlayerData,
	UpdatePlayerResult,
	DestroyPlayerResult
} from "lavalink-types/v4";

/**
 * Error class for Lavalink REST API errors.
 *
 * @remarks
 * Contains the full error response from the Lavalink server.
 *
 * @public
 */
export class RestError extends Error {
	/**
	 * Creates a new RestError instance.
	 *
	 * @param json - The error response object from Lavalink.
	 */
	constructor(public json: ErrorResponse) {
		super(json.message);
	}
}

/**
 * A utility class for interacting with the Lavalink REST API.
 *
 * @remarks
 * Provides methods to perform various operations on a Lavalink server through its REST API,
 * including loading tracks, decoding tracks, and controlling players.
 *
 * @public
 * @sealed
 */
export class Rest {
	/**
	 * Base request function that handles communication with Lavalink REST API.
	 *
	 * @internal
	 * @param node - The Lavalink node to send the request to.
	 * @param path - The API route path, starting with /.
	 * @param init - Optional request initialization options.
	 * @param requires - Optional array of properties the Lavalink node must have for this request.
	 * @returns A promise resolving to the response data.
	 * @throws {@link RestError} If Lavalink returns an error response.
	 *
	 * @example
	 * ```typescript
	 * // This is an internal method, not meant to be called directly
	 * // Instead, use the public methods like Rest.load(), Rest.decode(), etc.
	 * ```
	 */
	private static async baseRequest<T>(node: LavalinkNode, path: string, init?: RequestInit, requires?: "sessionId"[]): Promise<T> {
		if (requires && !requires.every((r) => !!node[r]))
			throw new RestError({
				timestamp: Date.now(),
				status: 400,
				error: "Bad Request",
				message: `Node ${requires.join(", ")} is required for this route. Did you forget to connect?`,
				path
			});
		if (!init) init = {};
		if (!init.headers) init.headers = {};
		Object.assign(init.headers, { Authorization: node.password });
		const res = await fetch(`http://${node.host}:${node.port}${path}`, init);
		let body;
		if (res.status !== 204 && res.headers.get("content-type") === "application/json") body = await res.json();
		else if (res.status !== 204) body = await res.text();
		else body = undefined;

		if (body && (body as ErrorResponse).error) throw new RestError(body as ErrorResponse);
		return body as T;
	}

	/**
	 * Loads tracks from various sources using Lavalink's loadtracks endpoint.
	 *
	 * @param node - The Lavalink node to use.
	 * @param identifer - The identifier to load tracks from (URL, search query, etc.)
	 * @returns A promise resolving to the track loading result.
	 * @throws {@link RestError} If Lavalink encounters an error.
	 *
	 * @example
	 * ```typescript
	 * // Load a track from YouTube URL
	 * const node = manager.nodes.get("main");
	 * try {
	 *   // Load a track from direct URL
	 *   const result = await Rest.load(node, "https://www.youtube.com/watch?v=dQw4w9WgXcQ");
	 *   console.log(`Loaded track: ${result.tracks[0].info.title}`);
	 *
	 *   // Search for tracks on YouTube
	 *   const searchResult = await Rest.load(node, "ytsearch:never gonna give you up");
	 *   console.log(`Found ${searchResult.tracks.length} tracks`);
	 *
	 *   // Load a playlist
	 *   const playlist = await Rest.load(node, "https://www.youtube.com/playlist?list=PLnJbmwUO2g4w2333G0MdAGGnzCuDRBPEj");
	 *   console.log(`Loaded playlist: ${playlist.playlistInfo.name} with ${playlist.tracks.length} tracks`);
	 * } catch (error) {
	 *   if (error instanceof RestError) {
	 *     console.error(`Lavalink error: ${error.message}`);
	 *   } else {
	 *     console.error(`Error: ${error.message}`);
	 *   }
	 * }
	 * ```
	 *
	 * @public
	 */
	static load(node: LavalinkNode, identifer: string): Promise<TrackLoadingResult> {
		const params = new URLSearchParams();
		params.append("identifier", identifer);

		return Rest.baseRequest(node, `/v4/loadtracks?${params}`, undefined);
	}

	/**
	 * Decodes track(s) from their base64 encoded form.
	 *
	 * @param node - The Lavalink node to use.
	 * @param track - A single track to decode.
	 * @returns A promise resolving to the decoded track information.
	 * @throws {@link RestError} If Lavalink encounters an error.
	 *
	 * @example
	 * ```typescript
	 * // Decode a single track to view its metadata
	 * const node = manager.nodes.get("main");
	 * try {
	 *   const encodedTrack = "QAAAjQIAJVJpY2sgQXN0bGV5IC0gTmV2ZXIgR29ubmEgR2l2ZSBZb3UgVXAAD1JpY2tBc3RsZXlWRVZPAAEAK2h0dHBzOi8vd3d3LnlvdXR1YmUuY29tL3dhdGNoP3Y9ZFF3NHc5V2dYY1EAB3lvdXR1YmUAAAAAAAAAAA==";
	 *   const trackInfo = await Rest.decode(node, encodedTrack);
	 *
	 *   console.log(`Track: ${trackInfo.title}`);
	 *   console.log(`Author: ${trackInfo.author}`);
	 *   console.log(`Duration: ${trackInfo.length}ms`);
	 *   console.log(`Source: ${trackInfo.sourceName}`);
	 *   console.log(`URI: ${trackInfo.uri}`);
	 * } catch (error) {
	 *   console.error(`Error decoding track: ${error.message}`);
	 * }
	 * ```
	 *
	 * @public
	 */
	static decode(node: LavalinkNode, track: string): Promise<DecodeTrackResult>;
	/**
	 * Decodes multiple tracks from their base64 encoded form.
	 *
	 * @param node - The Lavalink node to use.
	 * @param tracks - An array of tracks to decode.
	 * @returns A promise resolving to an array of decoded track information.
	 * @throws {@link RestError} If Lavalink encounters an error.
	 *
	 * @example
	 * ```typescript
	 * // Decode multiple tracks at once
	 * const node = manager.nodes.get("main");
	 * try {
	 *   const encodedTracks = [
	 *     "QAAAjQIAJVJpY2sgQXN0bGV5IC0gTmV2ZXIgR29ubmEgR2l2ZSBZb3UgVXAAD1JpY2tBc3RsZXlWRVZPAAEAK2h0dHBzOi8vd3d3LnlvdXR1YmUuY29tL3dhdGNoP3Y9ZFF3NHc5V2dYY1EAB3lvdXR1YmUAAAAAAAAAAA==",
	 *     "QAAAjgIAJFJpY2sgQXN0bGV5IC0gVG9nZXRoZXIgRm9yZXZlciAoT2ZmaWNpYWwgTXVzaWMgVmlkZW8pAA9SaWNrQXN0bGV5VkVWTwABADJodHRwczovL3d3dy55b3V0dWJlLmNvbS93YXRjaD92PXlQTHQ1UXB3eTAwABd5b3V0dWJlOiBSaWNrIEFzdGxleQAAAAAAAAAA"
	 *   ];
	 *
	 *   const tracksInfo = await Rest.decode(node, encodedTracks);
	 *
	 *   tracksInfo.forEach((track, index) => {
	 *     console.log(`Track ${index + 1}: ${track.title} by ${track.author} (${track.length}ms)`);
	 *   });
	 * } catch (error) {
	 *   console.error(`Error decoding tracks: ${error.message}`);
	 * }
	 * ```
	 *
	 * @public
	 */
	static decode(node: LavalinkNode, tracks: string[]): Promise<DecodeTracksResult>;
	static decode(node: LavalinkNode, tracks: string | string[]): Promise<DecodeTrackResult | DecodeTracksResult> {
		if (Array.isArray(tracks)) {
			return Rest.baseRequest(node, `/v4/decodetracks`, {
				method: "POST",
				body: JSON.stringify(tracks),
				headers: { "Content-Type": "application/json" }
			});
		} else {
			const params = new URLSearchParams();
			params.append("track", tracks);
			return Rest.baseRequest(node, `/v4/decodetrack?${params}`, undefined);
		}
	}

	/**
	 * Retrieves the version information of the Lavalink server.
	 *
	 * @param node - The Lavalink node to query.
	 * @returns A promise resolving to the version information.
	 * @throws {@link RestError} If Lavalink encounters an error.
	 *
	 * @example
	 * ```typescript
	 * // Get version information from a Lavalink server
	 * const node = manager.nodes.get("main");
	 * try {
	 *   const version = await Rest.version(node);
	 *
	 *   console.log(`Lavalink Version: ${version.semver}`);
	 *   console.log(`Major Version: ${version.major}`);
	 *   console.log(`Minor Version: ${version.minor}`);
	 *   console.log(`Patch Version: ${version.patch}`);
	 *   console.log(`Git Commit: ${version.commit}`);
	 * } catch (error) {
	 *   console.error(`Failed to get version: ${error.message}`);
	 * }
	 * ```
	 *
	 * @public
	 */
	static version(node: LavalinkNode): Promise<GetLavalinkVersionResult> {
		return Rest.baseRequest(node, `/version`);
	}

	/**
	 * Updates the session properties of a Lavalink node.
	 *
	 * @param node - The Lavalink node to update.
	 * @returns A promise resolving to the update session result.
	 * @throws {@link RestError} If Lavalink encounters an error.
	 *
	 * @example
	 * ```typescript
	 * // Update a node's session properties (typically called internally by LavalinkNode)
	 * const node = manager.nodes.get("main");
	 * try {
	 *   // Enable session resuming with a 60-second timeout
	 *   node.resuming = true;
	 *   node.resumeTimeout = 60;
	 *
	 *   const result = await Rest.updateSession(node);
	 *
	 *   console.log(`Session updated successfully`);
	 *   console.log(`Resuming enabled: ${result.resuming}`);
	 *   console.log(`Resume timeout: ${result.timeout} seconds`);
	 * } catch (error) {
	 *   console.error(`Failed to update session: ${error.message}`);
	 * }
	 * ```
	 *
	 * @public
	 */
	static updateSession(node: LavalinkNode): Promise<UpdateSessionResult> {
		return Rest.baseRequest(
			node,
			`/v4/sessions/${node.sessionId}`,
			{
				method: "PATCH",
				body: JSON.stringify({
					resuming: node.resuming,
					timeout: node.resumeTimeout
				} as UpdateSessionData),
				headers: { "Content-Type": "application/json" }
			},
			["sessionId"]
		);
	}

	/**
	 * Updates a player on a Lavalink node.
	 *
	 * @param node - The Lavalink node hosting the player.
	 * @param guildId - The guild ID associated with the player.
	 * @param data - The player update data.
	 * @param noReplace - If true, the event will be dropped if there's a currently playing track.
	 * @returns A promise resolving to the updated player information.
	 * @throws {@link RestError} If Lavalink encounters an error.
	 *
	 * @example
	 * ```typescript
	 * // Various ways to update a player
	 * const node = manager.nodes.get("main");
	 * const guildId = "123456789012345678";
	 *
	 * try {
	 *   // Play a track
	 *   await Rest.updatePlayer(node, guildId, {
	 *     track: {
	 *       encoded: "QAAAjQIAJVJpY2sgQXN0bGV5IC0gTmV2ZXIgR29ubmEgR2l2ZSBZb3UgVXAAD1JpY2tBc3RsZXlWRVZPAAEAK2h0dHBzOi8vd3d3LnlvdXR1YmUuY29tL3dhdGNoP3Y9ZFF3NHc5V2dYY1EAB3lvdXR1YmUAAAAAAAAAAA=="
	 *     }
	 *   });
	 *
	 *   // Update volume to 50%
	 *   await Rest.updatePlayer(node, guildId, { volume: 50 });
	 *
	 *   // Pause playback
	 *   await Rest.updatePlayer(node, guildId, { paused: true });
	 *
	 *   // Apply complex filters
	 *   await Rest.updatePlayer(node, guildId, {
	 *     filters: {
	 *       equalizer: [
	 *         { band: 0, gain: 0.3 },
	 *         { band: 1, gain: 0.2 }
	 *       ],
	 *       timescale: {
	 *         speed: 1.1,  // 10% faster
	 *         pitch: 1.0,
	 *         rate: 1.0
	 *       },
	 *       volume: 0.8
	 *     }
	 *   });
	 *
	 *   // Don't replace current track if one is playing
	 *   const trackToQueue = "QAAAjgIAJFJpY2sgQXN0bGV5IC0gVG9nZXRoZXIgRm9yZXZlciAoT2ZmaWNpYWwgTXVzaWMgVmlkZW8pAA9SaWNrQXN0bGV5VkVWTwABADJodHRwczovL3d3dy55b3V0dWJlLmNvbS93YXRjaD92PXlQTHQ1UXB3eTAwABd5b3V0dWJlOiBSaWNrIEFzdGxleQAAAAAAAAAA";
	 *   await Rest.updatePlayer(node, guildId, {
	 *     track: { encoded: trackToQueue }
	 *   }, true);
	 *
	 * } catch (error) {
	 *   console.error(`Player update failed: ${error.message}`);
	 * }
	 * ```
	 *
	 * @public
	 */
	static updatePlayer(node: LavalinkNode, guildId: string, data: UpdatePlayerData, noReplace = false): Promise<UpdatePlayerResult> {
		return Rest.baseRequest(
			node,
			`/v4/sessions/${node.sessionId}/players/${guildId}${noReplace ? `?noReplace=${noReplace}` : ""}`,
			{
				method: "PATCH",
				body: JSON.stringify(data),
				headers: { "Content-Type": "application/json" }
			},
			["sessionId"]
		);
	}

	/**
	 * Destroys a player on a Lavalink node.
	 *
	 * @param node - The Lavalink node hosting the player.
	 * @param guildId - The guild ID associated with the player to destroy.
	 * @returns A promise resolving to the destroy player result.
	 * @throws {@link RestError} If Lavalink encounters an error.
	 *
	 * @example
	 * ```typescript
	 * // Destroy a player when you no longer need it
	 * const node = manager.nodes.get("main");
	 * const guildId = "123456789012345678";
	 *
	 * try {
	 *   await Rest.destroyPlayer(node, guildId);
	 *   console.log(`Player for guild ${guildId} destroyed successfully`);
	 *
	 *   // Note: This only removes the player from Lavalink
	 *   // You should also call manager.leave(guildId) to disconnect from the voice channel
	 * } catch (error) {
	 *   console.error(`Failed to destroy player: ${error.message}`);
	 * }
	 * ```
	 *
	 * @public
	 */
	static destroyPlayer(node: LavalinkNode, guildId: string): Promise<DestroyPlayerResult> {
		return Rest.baseRequest(node, `/v4/sessions/${node.sessionId}/players/${guildId}`, { method: "DELETE" }, ["sessionId"]);
	}
}
