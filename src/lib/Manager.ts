import { EventEmitter } from "events";
import { JoinData, VoiceServerUpdate, VoiceStateUpdate, DiscordPacket, ManagerOptions, JoinOptions, LavalinkNodeOptions, PlayerUpdateVoiceState, WebsocketCloseEvent } from "./Types";
import { LavalinkNode } from "./LavalinkNode";
import { Player } from "./Player";
import WebSocket from "ws";

/**
 * The class that handles everything to do with Lavalink. it is the hub of the library basically
 */
export class Manager extends EventEmitter {

    /**
     * A [**Map**](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map) of Lavalink Nodes
     */
    public nodes = new Map<string, LavalinkNode>();
    /**
     * A [**Map**](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map) of all the players
     */
    public players = new Map<string, Player>();
    /**
     * A [**Map**](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map) of all the VOICE_SERVER_UPDATE States
     */
    public voiceServers = new Map<string, VoiceServerUpdate>();
    /**
     * A [**Map**](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map) of all the VOICE_STATE_UPDATE States
     */
    public voiceStates = new Map<string, VoiceStateUpdate>();
    /**
     * The user id of the bot this Manager is managing
     */
    public user: string;
    /**
     * The amount of shards the bot has, by default its 1
     */
    public shards: number;
    /**
     * The send function needs for the library to function
     */
    public send: (packet: DiscordPacket) => unknown;
    /**
     * The Player the manager will use when creating new Players
     */
    private Player: Player;

    /**
     * The constructor of the Manager
     * @param nodes A Array of {@link LavalinkNodeOptions} that the Manager will connect to
     * @param options The options for the Manager {@link ManagerOptions}
     */
    public constructor(nodes: LavalinkNodeOptions[], options: ManagerOptions) {
        super();

        this.user = options.user;
        this.shards = options.shards || 1;
        this.Player = options.Player as any || Player;
        this.send = options.send;

        for (const node of nodes) this.createNode(node);
    }

    /**
     * Connects all the {@link LavalinkNode|LavalinkNodes} to the respective Lavalink instance
     */
    public connect(): Promise<Array<WebSocket | boolean>> {
        return Promise.all([...this.nodes.values()].map(node => node.connect()));
    }

    /**
     * Creating a {@link LavalinkNode} and adds it to the the nodes Map
     * @param options The node options of the node you're creating
     */
    public createNode(options: LavalinkNodeOptions): LavalinkNode {
        const node = new LavalinkNode(this, options);
        this.nodes.set(options.id, node);
        return node;
    }

    /**
     * Disconnects and Deletes the specified node
     * @param id The id of the node you want to remove
     */
    public removeNode(id: string): boolean {
        const node = this.nodes.get(id);
        if (!node) return false;
        return node.destroy() && this.nodes.delete(id);
    }

    /**
     * Connects the bot to the selected voice channel
     * @param data The Join Data
     * @param param1 Selfmute and Selfdeaf options, if you want the bot to be deafen or muted upon joining
     */
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

    /**
     * Leaves the specified voice channel
     * @param guild The guild you want the bot to leave the voice channel of
     */
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

    /**
     * Switch a player from one node to another, this is to implement fallback
     * @param player The player you want to switch nodes with
     * @param node The node you want to switch to
     */
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

    /**
     * For handling voiceServerUpdate from the user's library of choice
     * @param data The data directly from discord
     */
    public voiceServerUpdate(data: VoiceServerUpdate): Promise<boolean> {
        this.voiceServers.set(data.guild_id, data);
        return this._attemptConnection(data.guild_id);
    }

    /**
     * For handling voiceStateUpdate from the user's library of choice
     * @param data The data directly from discord
     */
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

    /**
     * Gets all connected nodes, sorts them by cou load of the node
     */
    public get idealNodes(): LavalinkNode[] {
        return [...this.nodes.values()]
            .filter(node => node.connected)
            .sort((a, b) => {
                const aload = a.stats.cpu ? a.stats.cpu.systemLoad / a.stats.cpu.cores * 100 : 0;
                const bload = b.stats.cpu ? b.stats.cpu.systemLoad / b.stats.cpu.cores * 100 : 0;
                return aload - bload;
            });
    }

    /**
     * Handles the data of voiceServerUpdate & voiceStateUpdate to see if a connection is possible with the data we have and if it is then make the connection to lavalink
     * @param guildId The guild id that we're trying to attempt to connect to
     */
    private async _attemptConnection(guildId: string): Promise<boolean> {
        const server = this.voiceServers.get(guildId);
        const state = this.voiceStates.get(guildId);

        if (!server) return false;

        const player = this.players.get(guildId);
        if (!player) return false;

        await player.connect({ sessionId: state ? state.session_id : player.voiceUpdateState!.sessionId, event: server });
        return true;
    }

    /**
     * This creates the {@link Player}
     * @param data The Join Data, this is called by {@link Manager.join}
     */
    private spawnPlayer(data: JoinData): Player {
        const exists = this.players.get(data.guild);
        if (exists) return exists;
        const node = this.nodes.get(data.node);
        if (!node) throw new Error(`INVALID_HOST: No available node with ${data.node}`);
        const player: Player = new (this.Player as any)(node, data.guild);
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
