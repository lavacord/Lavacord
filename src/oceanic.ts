import { Manager as BaseManager } from "./lib/Manager";
import type { ManagerOptions, LavalinkNodeOptions, VoiceServerUpdate, VoiceStateUpdate } from "./lib/Types";
import type { Client, RawVoiceState } from "oceanic.js";

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
            if (packet.t === "VOICE_SERVER_UPDATE") {
                this.voiceServerUpdate(packet.d as VoiceServerUpdate);
            } else if (packet.t === "VOICE_STATE_UPDATE") {
                this.voiceStateUpdate(packet.d as VoiceStateUpdate);
            } else if (packet.t === "GUILD_CREATE") {
                for (const state of (packet.d as { voice_states?: Array<RawVoiceState>; }).voice_states ?? []) {
                    this.voiceStateUpdate({ ...state, guild_id: packet.d.id } as VoiceStateUpdate);
                }
            }
        });
    }
}
