import { Manager as BaseManager } from "./lib/Manager";
import type { ManagerOptions, LavalinkNodeOptions, VoiceServerUpdate, VoiceStateUpdate } from "./lib/Types";
import type { Client } from "oceanic.js";

export * from "./index";

export class Manager extends BaseManager {
    public constructor(public readonly client: Client, nodes: Array<LavalinkNodeOptions>, options?: ManagerOptions) {
        if (!options) options = {};
        if (!options.user) options.user = client.user?.id;
        super(nodes, options);

        if (!this.send) {
            this.send = packet => {
                const guild = this.client.guilds.get(packet.d.guild_id);
                if (guild) {
                    guild.shard.send(packet.op, packet.d);
                    return true;
                } else {
                    return false;
                }
            };
        }

        client.on("packet", packet => {
            switch (packet.t) {
                case "VOICE_SERVER_UPDATE":
                    this.voiceServerUpdate(packet.d as VoiceServerUpdate);
                    break;

                case "VOICE_STATE_UPDATE":
                    this.voiceStateUpdate(packet.d as VoiceStateUpdate);
                    break;

                case "GUILD_CREATE":
                    if (packet.d.unavailable) break;
                    for (const state of packet.d.voice_states ?? []) this.voiceStateUpdate({ ...state, guild_id: packet.d.id } as VoiceStateUpdate);
                    break;

                default: break;
            }
        });
    }
}
