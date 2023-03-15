import { fetch, RequestInit } from "undici";
import { URLSearchParams } from "url";
import type { LavalinkNode } from "./LavalinkNode";
import type { TrackLoadingResult, DecodeTrackResult, DecodeTracksResult, GetLavalinkVersionResult, UpdateSessionResult, UpdateSessionData, ErrorResponse, UpdatePlayerData, UpdatePlayerResult, DestroyPlayerResult } from "lavalink-types";

export class RestError extends Error {
    public json: ErrorResponse;

    constructor(data: ErrorResponse) {
        super(data.message);
        this.json = data;
    }
}

/**
 * A Rest helper for Lavalink
 */
export class Rest {
    /**
     * Private base request function
     * @param node The lavalink node
     * @param path Route starting with /
     * @param init Request init if any
     * @param requires Properties of the lavalink node the route requires
     * @throws {RestError} If lavalink encounters an error
     */
    private static async baseRequest<T>(node: LavalinkNode, path: string, init?: RequestInit, requires?: Array<"version" | "sessionId">): Promise<T> {
        if (requires && !requires.every(r => !!node[r])) throw new RestError({ timestamp: Date.now(), status: 400, error: "Bad Request", message: `Node ${requires.join(", ")} is required for this route. Did you forget to connect?`, path });

        const res = await fetch(`${node.host}:${node.port}${path}`, Object.assign({ headers: { Authorization: node.password } }, init));
        let body;
        if (res.status !== 204 && res.headers.get("content-type") === "application/json") body = await res.json();
        else if (res.status !== 204) body = await res.text();
        else body = undefined;

        if (body && (body as ErrorResponse).error) throw new RestError(body as ErrorResponse);
        return body as T;
    }

    /**
     * A helper for /v?/loadtracks endpoint
     * @param node The LavalinkNode
     * @param identifer The thing you want to load
     * @throws {RestError} If lavalink encounters an error
     */
    static load(node: LavalinkNode, identifer: string): Promise<TrackLoadingResult> {
        const params = new URLSearchParams();
        params.append("identifier", identifer);

        return Rest.baseRequest(node, `/v${node.version}/loadtracks?${params}`, undefined, ["version"]);
    }

    /**
     * A helper for /v?/decodetrack & /v?/decodetracks
     * @param node The lavalink node
     * @param track The track(s) you want to decode
     * @throws {RestError} If lavalink encounters an error
     */
    static decode(node: LavalinkNode, track: string): Promise<DecodeTrackResult>;
    static decode(node: LavalinkNode, tracks: string[]): Promise<DecodeTracksResult>;
    static decode(node: LavalinkNode, tracks: string | string[]): Promise<DecodeTrackResult | DecodeTracksResult> {
        if (Array.isArray(tracks)) {
            return Rest.baseRequest(node, `/v${node.version}/decodetracks`, { method: "POST", body: JSON.stringify(tracks) }, ["version"]);
        } else {
            const params = new URLSearchParams();
            params.append("track", tracks);
            return Rest.baseRequest(node, `/v${node.version}/decodetrack?${params}`, undefined, ["version"]);
        }
    }

    /**
     * A helper for /version
     * @param node The lavalink node
     * @throws {RestError} If lavalink encounters an error
     */
    static version(node: LavalinkNode): Promise<GetLavalinkVersionResult> {
        return Rest.baseRequest(node, `/version`);
    }

    /**
     * A helper for PATCH /v?/sessions/:sessionId
     * @param node The lavalink node
     * @throws {RestError} If lavalink encounters an error
     */
    static updateSession(node: LavalinkNode): Promise<UpdateSessionResult> {
        return Rest.baseRequest(node, `/v${node.version}/sessions/${node.sessionId}`, {
            method: "PATCH",
            body: JSON.stringify({ resumingKey: node.resumeKey, timeout: node.resumeTimeout } as UpdateSessionData)
        }, ["version", "sessionId"]);
    }

    /**
     * A helper for PATCH /v?/sessions/:sessionId/players/:guildId
     * @param node The lavalink node
     * @param guildId The Id of the guild
     * @param data The update data
     * @param noReplace If the event should be dropped if there's a currently playing track
     * @throws {RestError} If lavalink encounters an error
     */
    static updatePlayer(node: LavalinkNode, guildId: string, data: UpdatePlayerData, noReplace = false): Promise<UpdatePlayerResult> {
        return Rest.baseRequest(node, `/v${node.version}/sessions/${node.sessionId}/players/${guildId}${noReplace ? `?noReplace=${noReplace}` : ""}`, {
            method: "PATCH",
            body: JSON.stringify(data)
        }, ["version", "sessionId"]);
    }

    /**
     * A helper for DELETE /v?/sessions/:sessionId/players/:guildId
     * @param node The lavalink node
     * @param guildId The Id of the guild
     * @throws {RestError} If lavalink encounters an error
     */
    static destroyPlayer(node: LavalinkNode, guildId: string): Promise<ErrorResponse | DestroyPlayerResult> {
        return Rest.baseRequest(node, `/v${node.version}/sessions/${node.sessionId}/players/${guildId}`, { method: "DELETE" }, ["version", "sessionId"]);
    }
}
