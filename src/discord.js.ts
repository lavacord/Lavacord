import { Manager as BaseManager } from "./lib/Manager";
import type { ManagerOptions, LavalinkNodeOptions } from "./lib/Types";

import { Client, GatewayDispatchEvents } from "discord.js";

export * from "./index";

export class Manager extends BaseManager {
    public constructor(public readonly client: Client, nodes: Array<LavalinkNodeOptions>, options?: ManagerOptions) {
        if (!options) options = {};
        if (!options.user) options.user = client.user?.id ? client.user.id : undefined;
        super(nodes, options);

        if (!this.send) {
            this.send = packet => {
                const guild = this.client.guilds.cache.get(packet.d.guild_id);
                if (guild) guild.shard.send(packet);
            };
        }

        if (!client.readyAt && !this.user) {
            client.once("shardReady", () => {
                if (this.client.user?.id) this.user = this.client.user.id;
            });
        }

        client.ws
            .on(GatewayDispatchEvents.VoiceServerUpdate, this.voiceServerUpdate.bind(this))
            .on(GatewayDispatchEvents.VoiceStateUpdate, this.voiceStateUpdate.bind(this))
            .on(GatewayDispatchEvents.GuildCreate, data => {
                for (const state of data.voice_states ?? []) this.voiceStateUpdate({ ...state, guild_id: data.id });
            });
    }
}
