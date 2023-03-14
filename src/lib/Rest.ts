import { Response, fetch } from "undici";
import { URLSearchParams } from "url";
import { LavalinkNode } from "./LavalinkNode";
import { TrackLoadingResult, DecodeTrackResult, DecodeTracksResult } from "lavalink-types";

const json = (res: Response): Promise<any> => res.json();

/**
 * A Rest helper for Lavalink
 */
export class Rest {

    /**
     * A helper for /loadtracks endpoint
     * @param node The LavalinkNode
     * @param identifer The thing you want to load
     */
    static load(node: LavalinkNode, identifer: string): Promise<TrackLoadingResult> {
        const params = new URLSearchParams();
        params.append("identifier", identifer);

        return fetch(`http://${node.host}:${node.port}/loadtracks?${params}`, { headers: { Authorization: node.password } }).then(json);
    }

    /**
     * A helper for /decodetrack & /decodetracks
     * @param node The lavalink node
     * @param track the track(s) you want to decode
     */
    static decode(node: LavalinkNode, track: string): Promise<DecodeTrackResult>;
    static decode(node: LavalinkNode, tracks: string[]): Promise<DecodeTracksResult>;
    static decode(node: LavalinkNode, tracks: string | string[]): Promise<DecodeTrackResult | DecodeTracksResult> {
        if (Array.isArray(tracks)) {
            return fetch(`http://${node.host}:${node.port}/decodetracks`, { method: "POST", body: JSON.stringify(tracks), headers: { Authorization: node.password } }).then(json);
        } else {
            const params = new URLSearchParams();
            params.append("track", tracks);
            return fetch(`http://${node.host}:${node.port}/decodetrack?${params}`, { headers: { Authorization: node.password } }).then(json);
        }
    }
}
