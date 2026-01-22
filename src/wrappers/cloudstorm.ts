import { Manager as BaseManager } from "../lib/Manager";
import type { ManagerOptions, LavalinkNodeOptions } from "../lib/Types";
import { GatewayDispatchEvents, GatewayVoiceStateUpdate } from "discord-api-types/v10";

import { Client, IGatewayMessage } from "cloudstorm";

export * from "../index";

export class Manager extends BaseManager {
	public constructor(
		public readonly client: Client,
		nodes: LavalinkNodeOptions[],
		options?: ManagerOptions
	) {
		super(nodes, options);

		client.on("event", (packet: IGatewayMessage) => {
			switch (packet.t) {
				case GatewayDispatchEvents.VoiceServerUpdate:
					this.voiceServerUpdate(packet.d);
					break;

				case GatewayDispatchEvents.VoiceStateUpdate:
					this.voiceStateUpdate(packet.d);
					break;

				case GatewayDispatchEvents.GuildCreate:
					for (const state of packet.d.voice_states ?? [])
						this.voiceStateUpdate({
							...state,
							guild_id: packet.d.id
						});
					break;
				case GatewayDispatchEvents.Ready: {
					if (!this.userId) this.userId = packet.d.user.id;
					break;
				}
				default:
					break;
			}
		});
	}

	protected override send(packet: GatewayVoiceStateUpdate) {
		if (!this.client.options.totalShards) return;

		const shardID = Number((BigInt(packet.d.guild_id) >> BigInt(22)) % BigInt(this.client.options.totalShards));
		const s = Object.entries(this.client.shardManager.shards).find((e) => String(e[0]) === String(shardID))?.[1];

		if (s) s.connector.sendMessage(packet);
	}
}
