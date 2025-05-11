import { Manager as BaseManager } from "./lib/Manager";
import type { ManagerOptions, LavalinkNodeOptions, DiscordPacket } from "./lib/Types";

import type { Client } from "eris";

export * from "./index";

export class Manager extends BaseManager {
    public constructor(public readonly client: Client, nodes: LavalinkNodeOptions[], options?: ManagerOptions) {
        if (!options) options = {};
        if (!options.user) options.user = client.user?.id;
        super(nodes, options);

        if (!this.send) {
            this.send = packet => {
                const guild = this.client.guilds.get(packet.d.guild_id);
                if (guild) {
                    guild.shard.sendWS(packet.op, packet.d);
                    return true;
                } else {
                    return false;
                }
            };
        }

        client.on("rawWS", (packet: DiscordPacket) => {
            switch (packet.t) {
                case "VOICE_SERVER_UPDATE":
                    this.voiceServerUpdate(packet.d);
                    break;

                case "VOICE_STATE_UPDATE":
                    this.voiceStateUpdate(packet.d);
                    break;

                case "GUILD_CREATE":
                    for (const state of packet.d.voice_states ?? []) this.voiceStateUpdate({ ...state, guild_id: packet.d.id });
                    break;

                default: break;
            }
        });
    }
}
