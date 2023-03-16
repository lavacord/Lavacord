import { EventEmitter } from "events";
import { LavalinkNode } from "./LavalinkNode";
import { Player } from "./Player";
import WebSocket from "ws";
import type { JoinData, VoiceServerUpdate, VoiceStateUpdate, DiscordPacket, ManagerOptions, JoinOptions, LavalinkNodeOptions } from "./Types";

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
    public user!: string;
    /**
     * The send function needs for the library to function
     */
    public send?: (packet: DiscordPacket) => unknown;
    /**
     * The Player the manager will use when creating new Players
     */
    private Player: typeof Player = Player;
    /**
     * An Set of all the expecting connections guild id's
     */
    private expecting = new Set();

    /**
     * The constructor of the Manager
     * @param nodes A Array of {@link LavalinkNodeOptions} that the Manager will connect to
     * @param options The options for the Manager {@link ManagerOptions}
     */
    public constructor(nodes: LavalinkNodeOptions[], options: ManagerOptions) {
        super();

        if (options.user) this.user = options.user;
        if (options.player) this.Player = options.player;
        if (options.send) this.send = options.send;

        for (const node of nodes) this.createNode(node);
    }

    /**
     * Connects all the {@link LavalinkNode} to the respective Lavalink instance
     */
    public connect(): Promise<Array<WebSocket | boolean>> {
        return Promise.all([...this.nodes.values()].map(node => node.connect()));
    }

    /**
     * Disconnects everything, basically destorying the manager.
     * Stops all players, leaves all voice channels then disconnects all LavalinkNodes
     */
    public disconnect(): Promise<boolean[]> {
        const promises = [];
        for (const id of [...this.players.keys()]) promises.push(this.leave(id));
        for (const node of [...this.nodes.values()]) node.destroy();
        return Promise.all(promises);
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
     * @param joinOptions Selfmute and Selfdeaf options, if you want the bot to be deafen or muted upon joining
     */
    public async join(data: JoinData, joinOptions: JoinOptions = {}): Promise<Player> {
        const player = this.players.get(data.guild);
        if (player) return player;
        await this.sendWS(data.guild, data.channel, joinOptions);
        return this.spawnPlayer(data);
    }

    /**
     * Leaves the specified voice channel
     * @param guild The guild you want the bot to leave the voice channel of
     */
    public async leave(guild: string): Promise<boolean> {
        await this.sendWS(guild, null);
        const player = this.players.get(guild);
        if (!player) return false;
        if (player.listenerCount("end") && player.playing) player.emit("end", { encodedTrack: player.track!, op: "event", type: "TrackEndEvent", reason: "CLEANUP", guildId: guild });
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
        const { track, state, voiceUpdateState } = { ...player };
        const position = state.position ? state.position + 2000 : 2000;
        if (!voiceUpdateState) {
            player.node = node;
            return player;
        }

        await player.destroy();

        player.node = node;

        await player.play(track!, {
            position,
            volume: state.filters.volume || 1.0,
            filters: state.filters,
            voice: {
                token: voiceUpdateState.event.token,
                endpoint: voiceUpdateState.event.endpoint,
                sessionId: voiceUpdateState.sessionId
            }
        });

        return player;
    }

    /**
     * For handling voiceServerUpdate from the user's library of choice
     * @param data The data directly from discord
     */
    public voiceServerUpdate(data: VoiceServerUpdate): Promise<boolean> {
        this.voiceServers.set(data.guild_id, data);
        this.expecting.add(data.guild_id);
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
     * Just a utility method to easily send OPCode 4 websocket events to discord
     * @param guild The guild is
     * @param channel Voice channel id, or null to leave a voice channel
     * @param param2 Selfmute and Selfdeaf options, if you want the bot to be deafen or muted upon joining
     */
    public sendWS(guild: string, channel: string | null, { selfmute = false, selfdeaf = false }: JoinOptions = {}): any {
        return this.send!({
            op: 4,
            d: {
                guild_id: guild,
                channel_id: channel,
                self_mute: selfmute,
                self_deaf: selfdeaf
            }
        });
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
    private async _attemptConnection(guildID: string): Promise<boolean> {
        const server = this.voiceServers.get(guildID);
        const state = this.voiceStates.get(guildID);

        if (!server || !state || !this.expecting.has(guildID)) return false;

        const player = this.players.get(guildID);
        if (!player) return false;

        await player.connect({ sessionId: state.session_id, event: server });
        this.expecting.delete(guildID);

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
        const player = new this.Player(node, data.guild);
        this.players.set(data.guild, player);
        return player;
    }
}

export interface ManagerEvents {
    ready: [LavalinkNode];
    raw: [unknown, LavalinkNode];
    error: [unknown, LavalinkNode];
    disconnect: [number, string, LavalinkNode];
    reconnecting: [LavalinkNode];
}

export interface Manager {
    addListener<E extends keyof ManagerEvents>(event: E, listener: (...args: ManagerEvents[E]) => any): this;
    emit<E extends keyof ManagerEvents>(event: E, ...args: ManagerEvents[E]): boolean;
    eventNames(): Array<keyof ManagerEvents>;
    listenerCount(event: keyof ManagerEvents): number;
    listeners(event: keyof ManagerEvents): Array<(...args: Array<any>) => any>;
    off<E extends keyof ManagerEvents>(event: E, listener: (...args: ManagerEvents[E]) => any): this;
    on<E extends keyof ManagerEvents>(event: E, listener: (...args: ManagerEvents[E]) => any): this;
    once<E extends keyof ManagerEvents>(event: E, listener: (...args: ManagerEvents[E]) => any): this;
    prependListener<E extends keyof ManagerEvents>(event: E, listener: (...args: ManagerEvents[E]) => any): this;
    prependOnceListener<E extends keyof ManagerEvents>(event: E, listener: (...args: ManagerEvents[E]) => any): this;
    rawListeners(event: keyof ManagerEvents): Array<(...args: Array<any>) => any>;
    removeAllListeners(event?: keyof ManagerEvents): this;
    removeListener<E extends keyof ManagerEvents>(event: E, listener: (...args: ManagerEvents[E]) => any): this;
}
