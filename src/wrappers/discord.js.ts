import { Manager as BaseManager } from "../lib/Manager";
import type { ManagerOptions, LavalinkNodeOptions } from "../lib/Types";
import type { GatewayVoiceServerUpdateDispatch, GatewayVoiceStateUpdate, GatewayVoiceStateUpdateDispatch } from "discord-api-types/v10";
import { Client, GatewayDispatchEvents } from "discord.js";
import type { GatewayGuildCreateDispatchData } from "discord-api-types/v10";

export * from "../index";

export class Manager extends BaseManager {
	public constructor(
		public readonly client: Client,
		nodes: LavalinkNodeOptions[],
		options?: ManagerOptions
	) {
		super(nodes, options);

		client.once("ready", () => {
			if (!this.userId) this.userId = client.user!.id;
		});

		client.ws
			.on(GatewayDispatchEvents.VoiceServerUpdate, (packet: GatewayVoiceServerUpdateDispatch) => this.voiceServerUpdate(packet.d))
			.on(GatewayDispatchEvents.VoiceStateUpdate, (packet: GatewayVoiceStateUpdateDispatch) => this.voiceStateUpdate(packet.d))
			.on(GatewayDispatchEvents.GuildCreate, (data: GatewayGuildCreateDispatchData) => {
				for (const state of data.voice_states ?? []) this.voiceStateUpdate({ ...state, guild_id: data.id });
			});
	}

	protected override send(packet: GatewayVoiceStateUpdate) {
		const guild = this.client.guilds.cache.get(packet.d.guild_id);
		if (guild) guild.shard.send(packet);
	}
}
