import { GatewayDispatchEvents, GatewayReceivePayload, GatewayVoiceStateUpdate } from "discord-api-types/v10";
import { Manager as BaseManager } from "../lib/Manager";
import type { ManagerOptions, LavalinkNodeOptions } from "../lib/Types";

import type { Client } from "eris";

export * from "../index";

export class Manager extends BaseManager {
	public constructor(
		public readonly client: Client,
		nodes: LavalinkNodeOptions[],
		options?: ManagerOptions
	) {
		super(nodes, options);

		client.once("ready", () => {
			if (!this.userId) this.userId = client.user.id;
		});

		client.on("rawWS", (packet: GatewayReceivePayload) => {
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
		const guild = this.client.guilds.get(packet.d.guild_id);
		if (guild) guild.shard.sendWS(packet.op, packet.d as unknown as Record<string, unknown>);
	}
}
