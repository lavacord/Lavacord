import { GatewayGuildCreateDispatchData, GatewayVoiceServerUpdateDispatchData, GatewayVoiceStateUpdateDispatchData } from "discord-api-types/v10";
import { Manager as BaseManager } from "../lib/Manager";
import type { ManagerOptions, LavalinkNodeOptions } from "../lib/Types";

import type { Client } from "eris";

export * from "../index";

export class Manager extends BaseManager {
    public constructor(public readonly client: Client, nodes: LavalinkNodeOptions[], options?: ManagerOptions) {
        if (!options) options = {};
        if (!options.user) options.user = client.user?.id;
        super(nodes, options);

        if (!this.send) {
            this.send = packet => {
                const guild = this.client.guilds.get(packet.d.guild_id);
                if (guild) guild.shard.sendWS(packet.op, packet.d as unknown as Record<string, unknown>);
            };
        }

        client.on("rawWS", packet => {
            switch (packet.t) {
                case "VOICE_SERVER_UPDATE":
                    this.voiceServerUpdate(packet.d as GatewayVoiceServerUpdateDispatchData);
                    break;

                case "VOICE_STATE_UPDATE":
                    this.voiceStateUpdate(packet.d as GatewayVoiceStateUpdateDispatchData);
                    break;

                case "GUILD_CREATE": { 
                    const guildData = packet.d as GatewayGuildCreateDispatchData;
                    for (const state of guildData.voice_states ?? []) this.voiceStateUpdate({ ...state, guild_id: guildData.id } as GatewayVoiceStateUpdateDispatchData);
                    break;
                }

                default: break;
            }
        });
    }
}
