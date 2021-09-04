"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
    return to;
};
exports.__esModule = true;
exports.Manager = void 0;
var events_1 = require("events");
var LavalinkNode_1 = require("./LavalinkNode");
var Player_1 = require("./Player");
/**
 * The class that handles everything to do with Lavalink. it is the hub of the library basically
 */
var Manager = /** @class */ (function (_super) {
    __extends(Manager, _super);
    /**
     * The constructor of the Manager
     * @param nodes A Array of {@link LavalinkNodeOptions} that the Manager will connect to
     * @param options The options for the Manager {@link ManagerOptions}
     */
    function Manager(nodes, options) {
        var _this = _super.call(this) || this;
        /**
         * A [**Map**](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map) of Lavalink Nodes
         */
        _this.nodes = new Map();
        /**
         * A [**Map**](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map) of all the players
         */
        _this.players = new Map();
        /**
         * A [**Map**](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map) of all the VOICE_SERVER_UPDATE States
         */
        _this.voiceServers = new Map();
        /**
         * A [**Map**](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map) of all the VOICE_STATE_UPDATE States
         */
        _this.voiceStates = new Map();
        /**
         * The amount of shards the bot has, by default its 1
         */
        _this.shards = 1;
        /**
         * The Player the manager will use when creating new Players
         */
        _this.Player = Player_1.Player;
        /**
         * An Set of all the expecting connections guild id's
         */
        _this.expecting = new Set();
        if (options.user)
            _this.user = options.user;
        if (options.shards)
            _this.shards = options.shards;
        if (options.player)
            _this.Player = options.player;
        if (options.send)
            _this.send = options.send;
        for (var _i = 0, nodes_1 = nodes; _i < nodes_1.length; _i++) {
            var node = nodes_1[_i];
            _this.createNode(node);
        }
        return _this;
    }
    /**
     * Connects all the {@link LavalinkNode|LavalinkNodes} to the respective Lavalink instance
     */
    Manager.prototype.connect = function () {
        return Promise.all(__spreadArray([], this.nodes.values()).map(function (node) { return node.connect(); }));
    };
    /**
     * Disconnects everything, basically destorying the manager.
     * Stops all players, leaves all voice channels then disconnects all LavalinkNodes
     */
    Manager.prototype.disconnect = function () {
        var promises = [];
        for (var _i = 0, _a = __spreadArray([], this.players.keys()); _i < _a.length; _i++) {
            var id = _a[_i];
            promises.push(this.leave(id));
        }
        for (var _b = 0, _c = __spreadArray([], this.nodes.values()); _b < _c.length; _b++) {
            var node = _c[_b];
            promises.push(node.destroy());
        }
        return Promise.all(promises);
    };
    /**
     * Creating a {@link LavalinkNode} and adds it to the the nodes Map
     * @param options The node options of the node you're creating
     */
    Manager.prototype.createNode = function (options) {
        var node = new LavalinkNode_1.LavalinkNode(this, options);
        this.nodes.set(options.id, node);
        return node;
    };
    /**
     * Disconnects and Deletes the specified node
     * @param id The id of the node you want to remove
     */
    Manager.prototype.removeNode = function (id) {
        var node = this.nodes.get(id);
        if (!node)
            return false;
        return node.destroy() && this.nodes["delete"](id);
    };
    /**
     * Connects the bot to the selected voice channel
     * @param data The Join Data
     * @param param1 Selfmute and Selfdeaf options, if you want the bot to be deafen or muted upon joining
     */
    Manager.prototype.join = function (data, joinOptions) {
        if (joinOptions === void 0) { joinOptions = {}; }
        return __awaiter(this, void 0, void 0, function () {
            var player;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        player = this.players.get(data.guild);
                        if (player)
                            return [2 /*return*/, player];
                        return [4 /*yield*/, this.sendWS(data.guild, data.channel, joinOptions)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, this.spawnPlayer(data)];
                }
            });
        });
    };
    /**
     * Leaves the specified voice channel
     * @param guild The guild you want the bot to leave the voice channel of
     */
    Manager.prototype.leave = function (guild) {
        return __awaiter(this, void 0, void 0, function () {
            var player;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.sendWS(guild, null)];
                    case 1:
                        _a.sent();
                        player = this.players.get(guild);
                        if (!player)
                            return [2 /*return*/, false];
                        player.removeAllListeners();
                        return [4 /*yield*/, player.destroy()];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, this.players["delete"](guild)];
                }
            });
        });
    };
    /**
     * Switch a player from one node to another, this is to implement fallback
     * @param player The player you want to switch nodes with
     * @param node The node you want to switch to
     */
    Manager.prototype["switch"] = function (player, node) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, track, state, voiceUpdateState, position;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = __assign({}, player), track = _a.track, state = _a.state, voiceUpdateState = _a.voiceUpdateState;
                        position = state.position ? state.position + 2000 : 2000;
                        return [4 /*yield*/, player.destroy()];
                    case 1:
                        _b.sent();
                        player.node = node;
                        return [4 /*yield*/, player.connect(voiceUpdateState)];
                    case 2:
                        _b.sent();
                        return [4 /*yield*/, player.play(track, { startTime: position, volume: state.filters.volume || 1.0 })];
                    case 3:
                        _b.sent();
                        return [4 /*yield*/, player.filters(state.filters)];
                    case 4:
                        _b.sent();
                        return [2 /*return*/, player];
                }
            });
        });
    };
    /**
     * For handling voiceServerUpdate from the user's library of choice
     * @param data The data directly from discord
     */
    Manager.prototype.voiceServerUpdate = function (data) {
        this.voiceServers.set(data.guild_id, data);
        this.expecting.add(data.guild_id);
        return this._attemptConnection(data.guild_id);
    };
    /**
     * For handling voiceStateUpdate from the user's library of choice
     * @param data The data directly from discord
     */
    Manager.prototype.voiceStateUpdate = function (data) {
        if (data.user_id !== this.user)
            return Promise.resolve(false);
        if (data.channel_id) {
            this.voiceStates.set(data.guild_id, data);
            return this._attemptConnection(data.guild_id);
        }
        this.voiceServers["delete"](data.guild_id);
        this.voiceStates["delete"](data.guild_id);
        return Promise.resolve(false);
    };
    /**
     * Just a utility method to easily send OPCode 4 websocket events to discord
     * @param guild The guild is
     * @param channel Voice channel id, or null to leave a voice channel
     * @param param2 Selfmute and Selfdeaf options, if you want the bot to be deafen or muted upon joining
     */
    Manager.prototype.sendWS = function (guild, channel, _a) {
        var _b = _a === void 0 ? {} : _a, _c = _b.selfmute, selfmute = _c === void 0 ? false : _c, _d = _b.selfdeaf, selfdeaf = _d === void 0 ? false : _d;
        return this.send({
            op: 4,
            d: {
                guild_id: guild,
                channel_id: channel,
                self_mute: selfmute,
                self_deaf: selfdeaf
            }
        });
    };
    Object.defineProperty(Manager.prototype, "idealNodes", {
        /**
         * Gets all connected nodes, sorts them by cou load of the node
         */
        get: function () {
            return __spreadArray([], this.nodes.values()).filter(function (node) { return node.connected; })
                .sort(function (a, b) {
                var aload = a.stats.cpu ? a.stats.cpu.systemLoad / a.stats.cpu.cores * 100 : 0;
                var bload = b.stats.cpu ? b.stats.cpu.systemLoad / b.stats.cpu.cores * 100 : 0;
                return aload - bload;
            });
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Handles the data of voiceServerUpdate & voiceStateUpdate to see if a connection is possible with the data we have and if it is then make the connection to lavalink
     * @param guildId The guild id that we're trying to attempt to connect to
     */
    Manager.prototype._attemptConnection = function (guildID) {
        return __awaiter(this, void 0, void 0, function () {
            var server, state, player;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        server = this.voiceServers.get(guildID);
                        state = this.voiceStates.get(guildID);
                        if (!server || !state || !this.expecting.has(guildID))
                            return [2 /*return*/, false];
                        player = this.players.get(guildID);
                        if (!player)
                            return [2 /*return*/, false];
                        return [4 /*yield*/, player.connect({ sessionId: state.session_id, event: server })];
                    case 1:
                        _a.sent();
                        this.expecting["delete"](guildID);
                        return [2 /*return*/, true];
                }
            });
        });
    };
    /**
     * This creates the {@link Player}
     * @param data The Join Data, this is called by {@link Manager.join}
     */
    Manager.prototype.spawnPlayer = function (data) {
        var exists = this.players.get(data.guild);
        if (exists)
            return exists;
        var node = this.nodes.get(data.node);
        if (!node)
            throw new Error("INVALID_HOST: No available node with " + data.node);
        var player = new this.Player(node, data.guild);
        this.players.set(data.guild, player);
        return player;
    };
    return Manager;
}(events_1.EventEmitter));
exports.Manager = Manager;
