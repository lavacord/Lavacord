import { Manager as BaseManager } from "./lib/Manager";
import type { ManagerOptions, LavalinkNodeOptions, DiscordPacket } from "./lib/Types";

import type { Client } from "eris";

export * from "./index";

export class Manager extends BaseManager {
    public constructor(public readonly client: Client, nodes: Array<LavalinkNodeOptions>, options?: ManagerOptions) {
        if (!options) options = {};
        if (!options.user) options.user = client.user?.id ? client.user.id : undefined;
        super(nodes, options);

        if (!this.send) {
            this.send = packet => {
                const guild = this.client.guilds.get(packet.d.guild_id);
                if (guild) guild.shard.sendWS(packet.op, packet.d);
            };
        }

        if (!client.ready) {
            client.once("ready", () => {
                this.user = client.user.id;
            });
        }

        client.on("rawWS", (packet: DiscordPacket) => {
            if (packet.t === "VOICE_SERVER_UPDATE") this.voiceServerUpdate(packet.d);
            else if (packet.t === "VOICE_STATE_UPDATE") this.voiceStateUpdate(packet.d);
            else if (packet.t === "GUILD_CREATE") for (const state of packet.d.voice_states ?? []) this.voiceStateUpdate({ ...state, guild_id: packet.d.id });
        });
    }
}
