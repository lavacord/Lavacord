import { Manager as BaseManager } from "../lib/Manager";
import type { ManagerOptions, LavalinkNodeOptions } from "../lib/Types";
import { GatewayVoiceServerUpdateDispatchData, GatewayVoiceStateUpdateDispatchData } from "discord-api-types/v10";

import { Client } from "cloudstorm";

export * from "../index";

export class Manager extends BaseManager {
	public constructor(
		public readonly client: Client,
		nodes: LavalinkNodeOptions[],
		options: ManagerOptions
	) {
		super(nodes, options);

		if (!this.send) {
			this.send = async (packet) => {
				if (!this.client.options.totalShards) return false;

				const shardID = Number((BigInt(packet.d.guild_id) >> BigInt(22)) % BigInt(this.client.options.totalShards));

				const s = Object.entries(this.client.shardManager.shards).find((e) => String(e[0]) === String(shardID))?.[1];

				if (s) return s.connector.sendMessage(packet);
			};
		}

		client.on("event", (packet) => {
			switch (packet.t) {
				case "VOICE_SERVER_UPDATE":
					this.voiceServerUpdate(packet.d as GatewayVoiceServerUpdateDispatchData);
					break;

				case "VOICE_STATE_UPDATE":
					this.voiceStateUpdate(packet.d as GatewayVoiceStateUpdateDispatchData);
					break;

				case "GUILD_CREATE":
					for (const state of packet.d.voice_states ?? [])
						this.voiceStateUpdate({
							...state,
							guild_id: packet.d.id
						} as GatewayVoiceStateUpdateDispatchData);
					break;

				default:
					break;
			}
		});
	}
}
