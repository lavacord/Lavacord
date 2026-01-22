import { URLSearchParams } from "url";
import type { LavalinkNode } from "./LavalinkNode";
import { VERSION } from "../index";
import {
	ErrorResponse,
	TrackLoadingResult,
	DecodeTrackResult,
	DecodeTracksResult,
	GetLavalinkVersionResult,
	GetLavalinkInfoResult,
	GetLavalinkStatsResult,
	UpdateSessionResult,
	UpdateSessionData,
	UpdatePlayerData,
	UpdatePlayerResult,
	DestroyPlayerResult
} from "lavalink-types";

/**
 * Error class for Lavalink REST API errors.
 * @remarks
 * Contains the full error response from the Lavalink server.
 * See {@link https://lavalink.dev/api/rest#error-responses}
 * @public
 */
export class RestError extends Error {
	constructor(public error: ErrorResponse, public data: RequestInit) {
		super(error.message);
		this.name = "RestError";
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
	 * @param requiresSessionId - Whether the request requires a valid session ID.
	 * @returns A promise resolving to the response data.
	 * @throws {@link RestError} If Lavalink returns an error response.
	 */
	private static async baseRequest<T>(node: LavalinkNode, path: string, init?: BaseRequestInit, requiresSessionId?: boolean): Promise<T> {
		const headers = new Headers(init?.headers);
		headers.set("Authorization", node.password);
		headers.set("User-Agent", `Lavacord/${VERSION}`);

		const fetchConfig: RequestInit = {
			method: init?.method ?? "GET",
			headers,
			body: init?.body
		};
		if (init?.query) path += `?${new URLSearchParams(init.query)}`;

		if (requiresSessionId && !node.sessionId) {
			throw new RestError({
				timestamp: Date.now(),
				status: 400,
				error: "Bad Request",
				message: `Node ${node.id} requires a session ID for this route. Did you forget to connect?`,
				path
			}, fetchConfig);
		}

		const response = await fetch(node.restURL + path, fetchConfig).catch((error) => {
			throw new RestError({
				timestamp: Date.now(),
				status: 503,
				error: "Network Error",
				message: `Failed to connect to ${node.id}: ${error.message}`,
				path
			}, fetchConfig);
		});

		if (response.status === 204) return undefined as T;

		const contentType = response.headers.get("content-type");
		const body = await (contentType?.includes("application/json") ? response.json() : response.text());

		if (!response.ok || (body as ErrorResponse)?.error) throw new RestError(body as ErrorResponse, fetchConfig);

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
	 * @public
	 */
	static load(node: LavalinkNode, identifer: string): Promise<TrackLoadingResult> {
		return Rest.baseRequest(node, `/v4/loadtracks`, { query: { identifier: identifer } });
	}

	/**
	 * Decodes track(s) from their base64 encoded form.
	 *
	 * @param node - The Lavalink node to use.
	 * @param track - A single track to decode.
	 * @returns A promise resolving to the decoded track information.
	 * @throws {@link RestError} If Lavalink encounters an error.

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
	 * @public
	 */
	static decode(node: LavalinkNode, tracks: string[]): Promise<DecodeTracksResult>;
	static decode(node: LavalinkNode, tracks: string | string[]): Promise<DecodeTrackResult | DecodeTracksResult> {
		if (!Array.isArray(tracks)) return Rest.baseRequest(node, `/v4/decodetrack`, { query: { track: tracks } });
		return Rest.baseRequest(node, `/v4/decodetracks`, {
			method: "POST",
			body: JSON.stringify(tracks),
			headers: { "Content-Type": "application/json" }
		});
	}

	/**
	 * Retrieves the version from the Lavalink server.
	 *
	 * @param node - The Lavalink node to query.
	 * @returns A promise resolving to the version of lavalink.
	 * @throws {@link RestError} If Lavalink encounters an error.
	 *
	 * @public
	 */
	static version(node: LavalinkNode): Promise<GetLavalinkVersionResult> {
		return Rest.baseRequest(node, `/version`);
	}

	/**
	 * Retrieves the information of the Lavalink server.
	 *
	 * @param node - The Lavalink node to query.
	 * @returns A promise resolving to the information of lavalink.
	 * @throws {@link RestError} If Lavalink encounters an error.
	 *
	 * @public
	 */
	static info(node: LavalinkNode): Promise<GetLavalinkInfoResult> {
		return Rest.baseRequest(node, `/v4/info`);
	}

	/**
	 * Retrieves the statistics of the Lavalink node.
	 *
	 * @param node - The Lavalink node to query.
	 * @returns A promise resolving to the statistics of lavalink.
	 * @throws {@link RestError} If Lavalink encounters an error.
	 *
	 * @public
	 */
	static stats(node: LavalinkNode): Promise<GetLavalinkStatsResult> {
		return Rest.baseRequest(node, `/v4/stats`);
	}

	/**
	 * Updates the session properties of a Lavalink node.
	 *
	 * @param node - The Lavalink node to update.
	 * @returns A promise resolving to the update session result.
	 * @throws {@link RestError} If Lavalink encounters an error.
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
			true
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

	 * @public
	 */
	static updatePlayer(node: LavalinkNode, guildId: string, data: UpdatePlayerData, noReplace = false): Promise<UpdatePlayerResult> {
		return Rest.baseRequest(
			node,
			`/v4/sessions/${node.sessionId}/players/${guildId}`,
			{
				method: "PATCH",
				body: JSON.stringify(data),
				headers: { "Content-Type": "application/json" },
				query: noReplace ? { noReplace: "true" } : undefined
			},
			true
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
	 * @public
	 */
	static destroyPlayer(node: LavalinkNode, guildId: string): Promise<DestroyPlayerResult> {
		return Rest.baseRequest(node, `/v4/sessions/${node.sessionId}/players/${guildId}`, { method: "DELETE" }, true);
	}
}

export interface BaseRequestInit extends RequestInit {
	query?: string | URLSearchParams | Record<string, string> | [string, string][];
}
