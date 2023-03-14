import { Response, fetch } from "undici";
import { URLSearchParams } from "url";
import type { LavalinkNode } from "./LavalinkNode";
import type { TrackLoadingResult, DecodeTrackResult, DecodeTracksResult, GetLavalinkVersionResult, UpdateSessionResult, UpdateSessionData, ErrorResponse, UpdatePlayerData, UpdatePlayerResult, DestroyPlayerResult } from "lavalink-types";

const json = (res: Response): Promise<any> => res.json();

/**
 * A Rest helper for Lavalink
 */
export class Rest {
    /**
     * A helper for /v?/loadtracks endpoint
     * @param node The LavalinkNode
     * @param identifer The thing you want to load
     */
    static load(node: LavalinkNode, identifer: string): Promise<ErrorResponse | TrackLoadingResult> {
        if (!node.version) throw new Error("Node version is required for this route. Did you forget to connect?");
        const params = new URLSearchParams();
        params.append("identifier", identifer);

        return fetch(`http://${node.host}:${node.port}/v${node.version}/loadtracks?${params}`, { headers: { Authorization: node.password } }).then(json);
    }

    /**
     * A helper for /v?/decodetrack & /v?/decodetracks
     * @param node The lavalink node
     * @param track The track(s) you want to decode
     */
    static decode(node: LavalinkNode, track: string): Promise<ErrorResponse | DecodeTrackResult>;
    static decode(node: LavalinkNode, tracks: string[]): Promise<ErrorResponse | DecodeTracksResult>;
    static decode(node: LavalinkNode, tracks: string | string[]): Promise<ErrorResponse | DecodeTrackResult | DecodeTracksResult> {
        if (Array.isArray(tracks)) {
            return fetch(`http://${node.host}:${node.port}/decodetracks`, { method: "POST", body: JSON.stringify(tracks), headers: { Authorization: node.password } }).then(json);
        } else {
            const params = new URLSearchParams();
            params.append("track", tracks);
            return fetch(`http://${node.host}:${node.port}/decodetrack?${params}`, { headers: { Authorization: node.password } }).then(json);
        }
    }

    /**
     * A helper for /version
     * @param node The lavalink node
     */
    static version(node: LavalinkNode): Promise<ErrorResponse | GetLavalinkVersionResult> {
        return fetch(`http://${node.host}:${node.port}/version`, { headers: { Authorization: node.password } }).then(r => r.status === 200 ? r.text() : r.json() as any);
    }

    /**
     * A helper for PATCH /v?/sessions/:sessionId
     * @param node The lavalink node
     */
    static updateSession(node: LavalinkNode): Promise<ErrorResponse | UpdateSessionResult> {
        if (!node.version || !node.sessionId) throw new Error("Node version and sessionId is required for this route. Did you forget to connect?");
        return fetch(`http://${node.host}:${node.port}/v${node.version}/sessions/${node.sessionId}`, {
            method: "PATCH",
            body: JSON.stringify({ resumingKey: node.resumeKey, timeout: node.resumeTimeout } as UpdateSessionData)
        }).then(res => res.json() as Promise<UpdateSessionResult>);
    }

    /**
     * A helper for PATCH /v?/sessions/:sessionId/players/:guildId
     * @param node The lavalink node
     * @param guildId The Id of the guild
     * @param data The update data
     * @param noReplace If the event should be dropped if there's a currently playing track
     */
    static updatePlayer(node: LavalinkNode, guildId: string, data: UpdatePlayerData, noReplace = false): Promise<ErrorResponse | UpdatePlayerResult> {
        if (!node.version || !node.sessionId) throw new Error("Node version and sessionId is required for this route. Did you forget to connect?");
        return fetch(`http://${node.host}:${node.port}/v${node.version}/sessions/${node.sessionId}/players/${guildId}${noReplace ? `?noReplace=${noReplace}` : ""}`, {
            method: "PATCH",
            body: JSON.stringify(data)
        }).then(res => res.json() as Promise<UpdatePlayerResult>);
    }

    /**
     * A helper for DELETE /v?/sessions/:sessionId/players/:guildId
     * @param node The lavalink node
     * @param guildId The Id of the guild
     */
    static destroyPlayer(node: LavalinkNode, guildId: string): Promise<ErrorResponse | DestroyPlayerResult> {
        if (!node.version || !node.sessionId) throw new Error("Node version and sessionId is required for this route. Did you forget to connect?");
        return fetch(`http://${node.host}:${node.port}/v${node.version}/sessions/${node.sessionId}/players/${guildId}`, { method: "DELETE" }).then(res => res.status === 204 ? undefined : res.json() as Promise<ErrorResponse>);
    }
}
