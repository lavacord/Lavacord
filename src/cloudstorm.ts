import { Manager as BaseManager } from "./lib/Manager";
import type { ManagerOptions, LavalinkNodeOptions } from "./lib/Types";

import { Client } from "cloudstorm";

export * from "./index";

export class Manager extends BaseManager {
    public constructor(public readonly client: Client, nodes: Array<LavalinkNodeOptions>, options: ManagerOptions) {
        super(nodes, options);

        if (!this.send) {
            this.send = packet => {
                if (!this.client.options.totalShards) return;
                const shardID = Number((BigInt(packet.d.guild_id) >> BigInt(22)) % BigInt(this.client.options.totalShards));
                if (this.client.shardManager.shards[shardID]) this.client.shardManager.shards[shardID].connector.betterWs.sendMessage(packet);
            };
        }
    }
}
