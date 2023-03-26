import { Manager as BaseManager } from "./lib/Manager";
import type { ManagerOptions, LavalinkNodeOptions } from "./lib/Types";

import type { ClusterClient, ShardClient } from "detritus-client";

export * from "./index";

export class Manager extends BaseManager {
    public constructor(public readonly client: ClusterClient | ShardClient, nodes: Array<LavalinkNodeOptions>, options: ManagerOptions) {
        super(nodes, options);

        if (!this.send) {
            this.send = packet => {
                const asCluster = this.client as ClusterClient;
                const asShard = this.client as ShardClient;
                if (asShard.guilds) {
                    asShard.gateway.send(packet.op, packet.d);
                } else if (asCluster.shards) {
                    const shard = asCluster.shards.find(c => c.guilds.has(packet.d.guild_id));
                    if (shard) shard.gateway.send(packet.op, packet.d);
                }
            };
        }

        client.on("raw", packet => {
            if (packet.t === "VOICE_SERVER_UPDATE") this.voiceServerUpdate(packet.d);
            else if (packet.t === "VOICE_STATE_UPDATE") this.voiceStateUpdate(packet.d);
            else if (packet.t === "GUILD_CREATE") for (const state of packet.d.voice_states ?? []) this.voiceStateUpdate({ ...state, guild_id: packet.d.id });
        });
    }
}
