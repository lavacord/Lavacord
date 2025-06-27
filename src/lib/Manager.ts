import { EventEmitter } from "events";
import { LavalinkNode } from "./LavalinkNode";
import { Player } from "./Player";
import type { JoinData, ManagerOptions, JoinOptions, LavalinkNodeOptions, ManagerEvents } from "./Types";
import { GatewayVoiceServerUpdateDispatchData, GatewayVoiceStateUpdate, GatewayVoiceStateUpdateDispatchData } from "discord-api-types/v10";

/**
 * Main class that handles Lavalink node connections and player management.
 *
 * @remarks
 * The Manager acts as the central hub for Lavacord, managing connections to Lavalink nodes,
 * handling voice state updates, and providing a unified interface for player operations.
 */
export class Manager extends EventEmitter<ManagerEvents> {
	/**
	 * A Map of Lavalink Nodes indexed by their IDs.
	 */
	public nodes = new Map<string, LavalinkNode>();

	/**
	 * A Map of all active players indexed by guild ID.
	 */
	public players = new Map<string, Player>();

	/**
	 * A Map of voice server update states indexed by guild ID.
	 */
	public voiceServers = new Map<string, GatewayVoiceServerUpdateDispatchData>();

	/**
	 * A Map of voice state update states indexed by guild ID.
	 */
	public voiceStates = new Map<string, GatewayVoiceStateUpdateDispatchData>();

	/**
	 * The user ID of the bot this Manager is managing.
	 */
	public user!: string;

	/**
	 * Function to send voice state update packets to Discord.
	 *
	 * @remarks
	 * This must be implemented by the user based on their Discord library.
	 */
	public send?: (packet: GatewayVoiceStateUpdate) => unknown;

	/**
	 * The Player class constructor used when creating new players.
	 *
	 * @remarks
	 * Can be overridden in the manager options to use a custom Player implementation.
	 */
	private readonly Player: typeof Player = Player;

	/**
	 * A Set of guild IDs that are waiting for a connection.
	 *
	 * @internal
	 */
	private readonly expecting = new Set<string>();

	/**
	 * Creates a new Manager instance.
	 *
	 * @param nodes - An array of Lavalink node options to connect to.
	 * @param options - Configuration options for the Manager.
	 *
	 * @example
	 * ```typescript
	 * // Create a manager with one node
	 * const manager = new Manager([
	 *   {
	 *     id: "main",
	 *     host: "localhost",
	 *     port: 2333,
	 *     password: "youshallnotpass"
	 *   }
	 * ], {
	 *   user: "bot_user_id", // Your bot's user ID
	 *   send: (packet) => {
	 *     // Implementation depends on your Discord library
	 *     const guild = client.guilds.cache.get(packet.d.guild_id);
	 *     if (guild) guild.shard.send(packet);
	 *   }
	 * });
	 * ```
	 */
	public constructor(nodes: LavalinkNodeOptions[], options: ManagerOptions) {
		super();

		if (options.user) this.user = options.user;
		if (options.player) this.Player = options.player;
		if (options.send) this.send = options.send;

		if (!this.send)
			throw new Error(
				"Lavacord requires a send function to be defined in the Manager options.\
				This function should send voice state updates to Discord."
			);

		for (const node of nodes) this.createNode(node);
	}

	/**
	 * Connects all Lavalink nodes to their respective Lavalink servers.
	 *
	 * @returns A promise that resolves when all connections are established.
	 *
	 * @example
	 * ```typescript
	 * // Connect all nodes
	 * manager.connect()
	 *   .then(() => console.log('All nodes connected!'))
	 *   .catch(error => console.error('Failed to connect nodes:', error));
	 * ```
	 */
	public async connect(): Promise<LavalinkNode[]> {
		if (!this.user)
			throw new Error(
				"Lavacord requires a client user ID before connecting.\
				Set the user ID when constructing the Manager or after your Discord client is ready."
			);
		return Promise.all(this.nodes.values().map((node) => node.connect().then(() => node)));
	}

	/**
	 * Disconnects all players and nodes, effectively cleaning up all resources.
	 *
	 * @returns A promise that resolves when all disconnections are complete.
	 *
	 * @example
	 * ```typescript
	 * // Disconnect everything
	 * manager.disconnect()
	 *   .then(() => console.log('All players and nodes cleaned up'))
	 *   .catch(error => console.error('Error during disconnection:', error));
	 * ```
	 */
	public async disconnect(): Promise<void> {
		for await (const player of this.players.keys()) await this.leave(player);
		for (const node of this.nodes.values()) node.destroy();
	}

	/**
	 * Creates a new Lavalink node and adds it to the nodes map.
	 *
	 * @param options - Configuration options for the node.
	 * @returns The newly created LavalinkNode instance.
	 *
	 * @example
	 * ```typescript
	 * // Add a new node
	 * const newNode = manager.createNode({
	 *   id: "node2",
	 *   host: "example.com",
	 *   port: 2333,
	 *   password: "securepassword",
	 *   resuming: true
	 * });
	 * ```
	 */
	public createNode(options: LavalinkNodeOptions): LavalinkNode {
		const node = new LavalinkNode(this, options);
		this.nodes.set(options.id, node);
		return node;
	}

	/**
	 * Disconnects and removes a node from the manager.
	 *
	 * @param id - The ID of the node to remove.
	 * @returns Whether the node was successfully removed.
	 *
	 * @example
	 * ```typescript
	 * // Remove a node
	 * const removed = manager.removeNode("node1");
	 * if (removed) {
	 *   console.log("Node successfully removed");
	 * } else {
	 *   console.log("Node not found");
	 * }
	 * ```
	 */
	public removeNode(id: string): boolean {
		const node = this.nodes.get(id);
		if (!node) return false;
		node.destroy();
		return this.nodes.delete(id);
	}

	/**
	 * Joins a voice channel and creates a player for the guild.
	 *
	 * @param data - The data needed to join a voice channel.
	 * @param joinOptions - Options for joining the channel (selfmute, selfdeaf).
	 * @returns A promise resolving to the Player instance.
	 *
	 * @example
	 * ```typescript
	 * // Join a voice channel
	 * const player = await manager.join({
	 *   guild: "123456789012345678", // Guild ID
	 *   channel: "123456789012345679", // Voice Channel ID
	 *   node: "main" // Node ID
	 * }, {
	 *   selfdeaf: true // Join deafened
	 * });
	 *
	 * // Now you can use the player to play music
	 * const result = await Rest.load(player.node, "https://www.youtube.com/watch?v=dQw4w9WgXcQ");
	 * await player.play(result.tracks[0].track);
	 * ```
	 */
	public async join(data: JoinData, joinOptions: JoinOptions = {}): Promise<Player> {
		const player = this.players.get(data.guild);
		if (player) return player;
		await this.sendWS(data.guild, data.channel, joinOptions);
		return this.spawnPlayer(data);
	}

	/**
	 * Leaves a voice channel and cleans up the player.
	 *
	 * @param guild - The ID of the guild to leave.
	 * @returns A promise resolving to whether the operation was successful.
	 *
	 * @example
	 * ```typescript
	 * // Leave a voice channel
	 * const success = await manager.leave("123456789012345678");
	 * if (success) {
	 *   console.log("Successfully left the voice channel");
	 * } else {
	 *   console.log("Not in a voice channel in this guild");
	 * }
	 * ```
	 */
	public async leave(guild: string): Promise<boolean> {
		await this.sendWS(guild, null);
		const player = this.players.get(guild);
		if (!player) return false;

		await player.destroy();
		return this.players.delete(guild);
	}

	/**
	 * Switches a player from one node to another, implementing fallback capability.
	 *
	 * @param player - The player to move to another node.
	 * @param node - The destination node.
	 * @returns A promise resolving to the updated player.
	 *
	 * @example
	 * ```typescript
	 * // Switch a player to another node (e.g. if current node is failing)
	 * const player = manager.players.get("123456789012345678");
	 * const newNode = manager.nodes.get("backup-node");
	 *
	 * if (player && newNode) {
	 *   await manager.switch(player, newNode);
	 *   console.log("Player switched to backup node");
	 * }
	 * ```
	 */
	public async switch(player: Player, node: LavalinkNode): Promise<Player> {
		player.node = node;

		if (!player.voice) return player;
		await player.destroy();
		if (!player.track) return player;

		await player.play(player.track.encoded, {
			position: player.state.position,
			volume: player.volume,
			filters: player.filters,
			voice: player.voice,
			paused: player.paused,
			userData: player.track.userData
		});

		return player;
	}

	/**
	 * Processes voice server update events from Discord.
	 *
	 * @param data - The voice server update data from Discord.
	 * @returns A promise resolving to whether a connection was established.
	 *
	 * @example
	 * ```typescript
	 * // In your Discord.js client events
	 * client.ws.on(GatewayDispatchEvents.VoiceServerUpdate, (data) => {
	 *   manager.voiceServerUpdate(data);
	 * });
	 * ```
	 */
	public voiceServerUpdate(data: GatewayVoiceServerUpdateDispatchData): Promise<boolean> {
		this.voiceServers.set(data.guild_id, data);
		this.expecting.add(data.guild_id);
		return this._attemptConnection(data.guild_id);
	}

	/**
	 * Processes voice state update events from Discord.
	 *
	 * @param data - The voice state update data from Discord.
	 * @returns A promise resolving to whether a connection was established.
	 *
	 * @example
	 * ```typescript
	 * // In your Discord.js client events
	 * client.ws.on(GatewayDispatchEvents.VoiceStateUpdate, (data) => {
	 *   manager.voiceStateUpdate(data);
	 * });
	 * ```
	 */
	public voiceStateUpdate(data: GatewayVoiceStateUpdateDispatchData): Promise<boolean> {
		if (data.user_id !== this.user) return Promise.resolve(false);
		if (!data.guild_id) return Promise.resolve(false);

		if (data.channel_id) {
			this.voiceStates.set(data.guild_id, data);
			return this._attemptConnection(data.guild_id);
		}

		this.voiceServers.delete(data.guild_id);
		this.voiceStates.delete(data.guild_id);

		return Promise.resolve(false);
	}

	/**
	 * Sends a voice state update packet to Discord.
	 *
	 * @param guild - The ID of the guild.
	 * @param channel - The ID of the voice channel to join, or null to leave.
	 * @param options - Options for joining (selfmute, selfdeaf).
	 * @returns The result from the send function.
	 *
	 * @example
	 * ```typescript
	 * // Join a voice channel
	 * manager.sendWS("123456789012345678", "123456789012345679", { selfdeaf: true });
	 *
	 * // Leave a voice channel
	 * manager.sendWS("123456789012345678", null);
	 * ```
	 */
	public sendWS(guild: string, channel: string | null, { selfmute = false, selfdeaf = false }: JoinOptions = {}): unknown {
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
	 * Gets all connected nodes, sorted by CPU load.
	 *
	 * @returns An array of connected nodes sorted by CPU load (least to most).
	 *
	 * @example
	 * ```typescript
	 * // Get the node with the least CPU load
	 * const bestNode = manager.idealNodes[0];
	 * if (bestNode) {
	 *   console.log(`Best node for new connections: ${bestNode.id}`);
	 * }
	 * ```
	 */
	public get idealNodes(): LavalinkNode[] {
		return Array.from(this.nodes.values())
			.filter((node) => node.connected)
			.sort((a, b) => {
				const aload = a.stats.cpu ? (a.stats.cpu.systemLoad / a.stats.cpu.cores) * 100 : 0;
				const bload = b.stats.cpu ? (b.stats.cpu.systemLoad / b.stats.cpu.cores) * 100 : 0;
				return aload - bload;
			});
	}

	/**
	 * Attempts to establish a connection for a guild using available voice data.
	 *
	 * @internal
	 * @param guildID - The ID of the guild to attempt connecting.
	 * @returns A promise resolving to whether a connection was established.
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
	 * Creates a new player instance.
	 *
	 * @internal
	 * @param data - The data needed to create a player.
	 * @returns The created Player instance.
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
