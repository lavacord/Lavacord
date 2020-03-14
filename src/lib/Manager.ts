import { EventEmitter } from "events";
import { JoinData, VoiceServerUpdate, VoiceStateUpdate, DiscordPacket, ManagerOptions, JoinOptions, LavalinkNodeOptions, PlayerUpdateVoiceState, WebsocketCloseEvent } from "./Types";
import { LavalinkNode } from "./LavalinkNode";
import { Player } from "./Player";

export class Manager extends EventEmitter {

    public nodes = new Map<string, LavalinkNode>();
    public players = new Map<string, Player>();
    public voiceServers = new Map<string, VoiceServerUpdate>();
    public voiceStates = new Map<string, VoiceStateUpdate>();
    public user: string;
    public shards: number;
    private Player: Player;
    private send: (packet: DiscordPacket) => unknown;

    public constructor(nodes: LavalinkNodeOptions[], options: ManagerOptions) {
        super();

        this.user = options.user;
        this.shards = options.shards || 1;
        this.Player = options.Player as any || Player;
        this.send = options.send;

        for (const node of nodes) this.createNode(node);
    }

    public connect(): Promise<boolean[]> {
        return Promise.all([...this.nodes.values()].map(node => node.connect()));
    }

    public createNode(options: LavalinkNodeOptions): LavalinkNode {
        const node = new LavalinkNode(this, options);

        this.nodes.set(options.id, node);

        return node;
    }

    public removeNode(id: string): boolean {
        const node = this.nodes.get(id);
        if (!node) return false;
        return this.nodes.delete(id);
    }

    public async join(data: JoinData, { selfmute = false, selfdeaf = false }: JoinOptions = {}): Promise<Player> {
        const player = this.players.get(data.guild);
        if (player) return player;
        await this.send({
            op: 4,
            d: {
                guild_id: data.guild,
                channel_id: data.channel,
                self_mute: selfmute,
                self_deaf: selfdeaf
            }
        });
        return this.spawnPlayer(data);
    }

    public async leave(guild: string): Promise<boolean> {
        await this.send({
            op: 4,
            d: {
                guild_id: guild,
                channel_id: null,
                self_mute: false,
                self_deaf: false
            }
        });
        const player = this.players.get(guild);
        if (!player) return false;
        player.removeAllListeners();
        await player.destroy();
        return this.players.delete(guild);
    }

    public async switch(player: Player, node: LavalinkNode): Promise<Player> {
        const { track, state, voiceUpdateState } = { ...player } as any;
        const position = state.position ? state.position + 2000 : 2000;

        await player.destroy();

        player.node = node;

        await player.connect(voiceUpdateState as PlayerUpdateVoiceState);
        await player.play(track, { startTime: position, volume: state.volume });
        await player.equalizer(state.equalizer);

        return player;
    }

    public voiceServerUpdate(data: VoiceServerUpdate): Promise<boolean> {
        this.voiceServers.set(data.guild_id, data);
        return this._attemptConnection(data.guild_id);
    }

    public voiceStateUpdate(data: VoiceStateUpdate): Promise<boolean> {
        if (data.user_id !== this.user) return Promise.resolve(false);

        if (data.channel_id) {
            this.voiceStates.set(data.guild_id, data);
            return this._attemptConnection(data.guild_id);
        }

        this.voiceServers.delete(data.guild_id);
        this.voiceStates.delete(data.guild_id);

        return Promise.resolve(false);
    }

    private async _attemptConnection(guildId: string): Promise<boolean> {
        const server = this.voiceServers.get(guildId);
        const state = this.voiceStates.get(guildId);

        if (!server) return false;

        const player = this.players.get(guildId);
        if (!player) return false;

        await player.connect({ sessionId: state ? state.session_id : player.voiceUpdateState!.sessionId, event: server });
        this.voiceServers.delete(guildId);
        this.voiceStates.delete(guildId);
        return true;
    }

    private spawnPlayer(data: JoinData): Player {
        const exists = this.players.get(data.guild);
        if (exists) return exists;
        const node = this.nodes.get(data.node);
        if (!node) throw new Error(`INVALID_HOST: No available node with ${data.node}`);
        const player: Player = new (this.Player as any)(node, {
            id: data.guild,
            channel: data.channel
        });
        this.players.set(data.guild, player);
        return player;
    }

}

export interface Manager {
    on(event: "ready", listener: (node: LavalinkNode) => void): this;
    on(event: "raw", listener: (message: unknown, node: LavalinkNode) => void): this;
    on(event: "error", listener: (error: unknown, node: LavalinkNode) => void): this;
    on(event: "disconnect", listener: (eventData: WebsocketCloseEvent, node: LavalinkNode) => void): this;
    on(event: "reconnecting", listener: (node: LavalinkNode) => void): this;

    once(event: "ready", listener: (node: LavalinkNode) => void): this;
    once(event: "raw", listener: (message: unknown, node: LavalinkNode) => void): this;
    once(event: "error", listener: (error: unknown, node: LavalinkNode) => void): this;
    once(event: "disconnect", listener: (eventData: WebsocketCloseEvent, node: LavalinkNode) => void): this;
    once(event: "reconnecting", listener: (node: LavalinkNode) => void): this;

    off(event: "ready", listener: (node: LavalinkNode) => void): this;
    off(event: "raw", listener: (message: unknown, node: LavalinkNode) => void): this;
    off(event: "error", listener: (error: unknown, node: LavalinkNode) => void): this;
    off(event: "disconnect", listener: (eventData: WebsocketCloseEvent, node: LavalinkNode) => void): this;
    off(event: "reconnecting", listener: (node: LavalinkNode) => void): this;

    emit(event: "ready", node: LavalinkNode): boolean;
    emit(event: "raw", message: unknown, node: LavalinkNode): boolean;
    emit(event: "error", error: unknown, node: LavalinkNode): boolean;
    emit(event: "disconnect", eventData: WebsocketCloseEvent, node: LavalinkNode): boolean;
    emit(event: "reconnecting", node: LavalinkNode): boolean;
}
