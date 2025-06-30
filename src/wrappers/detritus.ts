import { GatewayDispatchEvents, GatewayReceivePayload, GatewayVoiceStateUpdate } from "discord-api-types/v10";
import { Manager as BaseManager } from "../lib/Manager";
import type { ManagerOptions, LavalinkNodeOptions } from "../lib/Types";

import { ClusterClient, ShardClient } from "detritus-client";

export * from "../index";

export class Manager extends BaseManager {
	public constructor(
		public readonly client: ClusterClient | ShardClient,
		nodes: LavalinkNodeOptions[],
		options: ManagerOptions
	) {
		super(nodes, options);

		client.once("ready", () => {
			if (!this.userId) this.userId = client instanceof ClusterClient ? client.applicationId : client.clientId;
		});

		client.on("raw", (packet: GatewayReceivePayload) => {
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

				default:
					break;
			}
		});
	}

	protected override send(packet: GatewayVoiceStateUpdate) {
		const asCluster = this.client as ClusterClient;
		const asShard = this.client as ShardClient;

		if (asShard.guilds) return asShard.gateway.send(packet.op, packet.d);
		if (asCluster.shards) {
			const shard = asCluster.shards.find((c) => c.guilds.has(packet.d.guild_id));
			if (shard) shard.gateway.send(packet.op, packet.d);
		}
	}
}
