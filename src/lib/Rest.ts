import fetch, { Response } from 'node-fetch';
import { URLSearchParams } from 'url';
import { LavalinkNode } from './LavalinkNode';
import { TrackResponse, TrackData, RoutePlannerStatus } from './Types';

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
	static load(node: LavalinkNode, identifer: string): Promise<TrackResponse> {
		const params = new URLSearchParams();
		params.append('identifier', identifer);

		return fetch(`http://${node.host}:${node.port}/loadtracks?${params}`, {
			headers: { Authorization: node.password },
		}).then(json);
	}

	/**
	 * A helper for /decodetrack & /decodetracks
	 * @param node The lavalink node
	 * @param track the track(s) you want to decode
	 */
	static decode(node: LavalinkNode, track: string): Promise<TrackData>;
	static decode(node: LavalinkNode, tracks: string[]): Promise<TrackData[]>;
	static decode(
		node: LavalinkNode,
		tracks: string | string[],
	): Promise<TrackData | TrackData[]>;
	static decode(
		node: LavalinkNode,
		tracks: string | string[],
	): Promise<TrackData | TrackData[]> {
		if (Array.isArray(tracks)) {
			return fetch(`http://${node.host}:${node.port}/decodetracks`, {
				method: 'POST',
				body: JSON.stringify(tracks),
				headers: { Authorization: node.password },
			}).then(json);
		} else {
			const params = new URLSearchParams();
			params.append('track', tracks);
			return fetch(`http://${node.host}:${node.port}/decodetrack?${params}`, {
				headers: { Authorization: node.password },
			}).then(json);
		}
	}

	/**
	 * A helper for /routeplanner/status
	 * @param node The LavalinkNode
	 */
	static routePlannerStatus(node: LavalinkNode): Promise<RoutePlannerStatus> {
		return fetch(`http://${node.host}:${node.port}/routeplanner/status`, {
			headers: { Authorization: node.password },
		}).then(json);
	}

	/**
	 * A helper for /routeplanner/free
	 * @param node The LavalinkNode
	 * @param address the address you want to free, this is optional
	 */
	static routePlannerUnmark(
		node: LavalinkNode,
		address?: string,
	): Promise<any> {
		if (address) {
			return fetch(
				`http://${node.host}:${node.port}/routeplanner/free/address`,
				{
					method: 'POST',
					body: JSON.stringify({ address }),
					headers: { Authorization: node.password },
				},
			).then(json);
		}
		return fetch(`http://${node.host}:${node.port}/routeplanner/free/all`, {
			method: 'POST',
			headers: { Authorization: node.password },
		}).then(json);
	}
}
