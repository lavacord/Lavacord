import { GatewayDispatchEvents, GatewayReceivePayload, GatewayVoiceStateUpdate } from "discord-api-types/v10";
import { Manager as BaseManager } from "../lib/Manager";
import type { ManagerOptions, LavalinkNodeOptions } from "../lib/Types";
import type { Client } from "oceanic.js";

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

		client.on("packet", (d) => {
			const data = d as unknown as GatewayReceivePayload;
			switch (data.t) {
				case GatewayDispatchEvents.VoiceServerUpdate:
					this.voiceServerUpdate(data.d);
					break;

				case GatewayDispatchEvents.VoiceStateUpdate:
					this.voiceStateUpdate(data.d);
					break;

				case GatewayDispatchEvents.GuildCreate:
					for (const state of data.d.voice_states ?? [])
						this.voiceStateUpdate({
							...state,
							guild_id: data.d.id
						});
					break;
				default:
					break;
			}
		});
	}

	protected override send(packet: GatewayVoiceStateUpdate) {
		const guild = this.client.guilds.get(packet.d.guild_id);
		if (guild) guild.shard.send(packet.op as number, packet.d);
	}
}
