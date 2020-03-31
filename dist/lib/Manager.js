"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const LavalinkNode_1 = require("./LavalinkNode");
const Player_1 = require("./Player");
class Manager extends events_1.EventEmitter {
    constructor(nodes, options) {
        super();
        this.nodes = new Map();
        this.players = new Map();
        this.voiceServers = new Map();
        this.voiceStates = new Map();
        this.user = options.user;
        this.shards = options.shards || 1;
        this.Player = options.Player || Player_1.Player;
        if (typeof options.send !== "undefined")
            this.send = options.send;
        for (const node of nodes)
            this.createNode(node);
    }
    connect() {
        return Promise.all([...this.nodes.values()].map(node => node.connect()));
    }
    createNode(options) {
        const node = new LavalinkNode_1.LavalinkNode(this, options);
        this.nodes.set(options.id, node);
        return node;
    }
    removeNode(id) {
        const node = this.nodes.get(id);
        if (!node)
            return false;
        return node.destroy() && this.nodes.delete(id);
    }
    async join(data, { selfmute = false, selfdeaf = false } = {}) {
        const player = this.players.get(data.guild);
        if (player)
            return player;
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
    async leave(guild) {
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
        if (!player)
            return false;
        player.removeAllListeners();
        await player.destroy();
        return this.players.delete(guild);
    }
    async switch(player, node) {
        const { track, state, voiceUpdateState } = { ...player };
        const position = state.position ? state.position + 2000 : 2000;
        await player.destroy();
        player.node = node;
        await player.connect(voiceUpdateState);
        await player.play(track, { startTime: position, volume: state.volume });
        await player.equalizer(state.equalizer);
        return player;
    }
    voiceServerUpdate(data) {
        this.voiceServers.set(data.guild_id, data);
        return this._attemptConnection(data.guild_id);
    }
    voiceStateUpdate(data) {
        if (data.user_id !== this.user)
            return Promise.resolve(false);
        if (data.channel_id) {
            this.voiceStates.set(data.guild_id, data);
            return this._attemptConnection(data.guild_id);
        }
        this.voiceServers.delete(data.guild_id);
        this.voiceStates.delete(data.guild_id);
        return Promise.resolve(false);
    }
    get idealNodes() {
        return [...this.nodes.values()]
            .filter(node => node.connected)
            .sort((a, b) => {
            const aload = a.stats.cpu ? a.stats.cpu.systemLoad / a.stats.cpu.cores * 100 : 0;
            const bload = b.stats.cpu ? b.stats.cpu.systemLoad / b.stats.cpu.cores * 100 : 0;
            return aload - bload;
        });
    }
    async _attemptConnection(guildId) {
        const server = this.voiceServers.get(guildId);
        const state = this.voiceStates.get(guildId);
        if (!server)
            return false;
        const player = this.players.get(guildId);
        if (!player)
            return false;
        await player.connect({ sessionId: state ? state.session_id : player.voiceUpdateState.sessionId, event: server });
        return true;
    }
    spawnPlayer(data) {
        const exists = this.players.get(data.guild);
        if (exists)
            return exists;
        const node = this.nodes.get(data.node);
        if (!node)
            throw new Error(`INVALID_HOST: No available node with ${data.node}`);
        const player = new this.Player(node, data.guild);
        this.players.set(data.guild, player);
        return player;
    }
}
exports.Manager = Manager;
//# sourceMappingURL=Manager.js.map