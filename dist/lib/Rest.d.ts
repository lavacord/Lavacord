import { LavalinkNode } from "./LavalinkNode";
import { TrackResponse, TrackData, RoutePlannerStatus } from "./Types";
export declare class Rest {
    static load(node: LavalinkNode, identifer: string): Promise<TrackResponse>;
    static decode(node: LavalinkNode, track: string): Promise<TrackData>;
    static decode(node: LavalinkNode, tracks: string[]): Promise<TrackData[]>;
    static decode(node: LavalinkNode, tracks: string | string[]): Promise<TrackData | TrackData[]>;
    static routePlannerStatus(node: LavalinkNode): Promise<RoutePlannerStatus>;
    static routePlannerUnmark(node: LavalinkNode, address?: string): Promise<any>;
}
