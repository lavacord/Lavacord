import { Manager as BaseManager } from "./lib/Manager";
import type { ManagerOptions, LavalinkNodeOptions, VoiceServerUpdate, VoiceStateUpdate } from "./lib/Types";

import { Client } from "cloudstorm";

export * from "./index";

export class Manager extends BaseManager {
    public constructor(public readonly client: Client, nodes: Array<LavalinkNodeOptions>, options: ManagerOptions) {
        super(nodes, options);

        if (!this.send) {
            this.send = packet => {
                if (!this.client.options.totalShards) return false;
                // eslint-disable-next-line no-bitwise
                const shardID = Number((BigInt(packet.d.guild_id) >> BigInt(22)) % BigInt(this.client.options.totalShards));

                const s = Object.entries(this.client.shardManager.shards).find(e => String(e[0]) === String(shardID))?.[1];

                if (s) {
                    s.connector.betterWs.sendMessage(packet);
                    return true;
                } else {
                    return false;
                }
            };
        }

        client.on("event", packet => {
            if (packet.t === "VOICE_SERVER_UPDATE") {
                this.voiceServerUpdate(packet.d as VoiceServerUpdate);
            } else if (packet.t === "VOICE_STATE_UPDATE") {
                this.voiceStateUpdate(packet.d as VoiceStateUpdate);
            } else if (packet.t === "GUILD_CREATE") {
                for (const state of packet.d.voice_states ?? []) {
                    this.voiceStateUpdate({ ...state, guild_id: (packet.d as unknown as { id: string; }).id } as VoiceStateUpdate);
                }
            }
        });
    }
}
