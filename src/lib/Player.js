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
exports.__esModule = true;
exports.Player = void 0;
var events_1 = require("events");
/**
 * The Player class, this handles everything to do with the guild sides of things, like playing, stoping, pausing, resuming etc
 */
var Player = /** @class */ (function (_super) {
    __extends(Player, _super);
    /**
     * The constructor of the player
     * @param node The Lavalink of the player
     * @param id the id of the player, aka the guild id
     */
    function Player(node, id) {
        var _this = _super.call(this) || this;
        _this.node = node;
        _this.id = id;
        /**
         * The PlayerState of this Player
         */
        _this.state = { filters: {} };
        /**
         * Whether or not the player is actually playing anything
         */
        _this.playing = false;
        /**
         * When the track started playing
         */
        _this.timestamp = null;
        /**
         * Whether or not the song that is playing is paused or not
         */
        _this.paused = false;
        /**
         * The current track in Lavalink's base64 string form
         */
        _this.track = null;
        /**
         * The voiceUpdateState of the player, used for swtiching nodes
         */
        _this.voiceUpdateState = null;
        _this.on("event", function (data) {
            switch (data.type) {
                case "TrackStartEvent":
                    if (_this.listenerCount("start"))
                        _this.emit("start", data);
                    break;
                case "TrackEndEvent":
                    if (data.reason !== "REPLACED")
                        _this.playing = false;
                    _this.track = null;
                    _this.timestamp = null;
                    if (_this.listenerCount("end"))
                        _this.emit("end", data);
                    break;
                case "TrackExceptionEvent":
                    if (_this.listenerCount("error"))
                        _this.emit("error", data);
                    break;
                case "TrackStuckEvent":
                    _this.stop();
                    if (_this.listenerCount("end"))
                        _this.emit("end", data);
                    break;
                case "WebSocketClosedEvent":
                    if (_this.listenerCount("error"))
                        _this.emit("error", data);
                    break;
                default:
                    if (_this.listenerCount("warn"))
                        _this.emit("warn", "Unexpected event type: " + data.type);
                    break;
            }
        })
            .on("playerUpdate", function (data) {
            _this.state = __assign({ filters: _this.state.filters }, data.state);
        });
        return _this;
    }
    /**
     * Plays the specified song using the base64 string from lavalink
     * @param track The base64 string of the song that you want to play
     * @param options Play options
     */
    Player.prototype.play = function (track, options) {
        if (options === void 0) { options = {}; }
        return __awaiter(this, void 0, void 0, function () {
            var d;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.send("play", __assign(__assign({}, options), { track: track }))];
                    case 1:
                        d = _a.sent();
                        this.track = track;
                        this.playing = true;
                        this.timestamp = Date.now();
                        return [2 /*return*/, d];
                }
            });
        });
    };
    /**
     * Stops the music, depending on how the end event is handled this will either stop
     */
    Player.prototype.stop = function () {
        return __awaiter(this, void 0, void 0, function () {
            var d;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.send("stop")];
                    case 1:
                        d = _a.sent();
                        this.playing = false;
                        this.timestamp = null;
                        return [2 /*return*/, d];
                }
            });
        });
    };
    /**
     * Pauses/Resumes the song depending on what is specified
     * @param pause Whether or not to pause whats currently playing
     */
    Player.prototype.pause = function (pause) {
        return __awaiter(this, void 0, void 0, function () {
            var d;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.send("pause", { pause: pause })];
                    case 1:
                        d = _a.sent();
                        this.paused = pause;
                        if (this.listenerCount("pause"))
                            this.emit("pause", pause);
                        return [2 /*return*/, d];
                }
            });
        });
    };
    /**
     * Resumes the current song
     */
    Player.prototype.resume = function () {
        return this.pause(false);
    };
    /**
     * Changes the volume, only for the current song
     * @param volume The volume as a float from 0.0 to 1.0 (volumes > 1.0 may cause clipping)
     */
    Player.prototype.volume = function (volume) {
        return __awaiter(this, void 0, void 0, function () {
            var newFilters, d;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        newFilters = Object.assign(this.state.filters, { volume: volume });
                        return [4 /*yield*/, this.filters(newFilters)];
                    case 1:
                        d = _a.sent();
                        if (this.listenerCount("volume"))
                            this.emit("volume", volume);
                        return [2 /*return*/, d];
                }
            });
        });
    };
    /**
     * Seeks the current song to a certain position
     * @param position Seeks the song to the position specified in milliseconds, use the duration of the song from lavalink to get the duration
     */
    Player.prototype.seek = function (position) {
        return __awaiter(this, void 0, void 0, function () {
            var d;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.send("seek", { position: position })];
                    case 1:
                        d = _a.sent();
                        if (this.listenerCount("seek"))
                            this.emit("seek", position);
                        return [2 /*return*/, d];
                }
            });
        });
    };
    Player.prototype.filters = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            var d;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.send("filters", options)];
                    case 1:
                        d = _a.sent();
                        this.state.filters = options;
                        if (this.listenerCount("filters"))
                            this.emit("filters", options);
                        return [2 /*return*/, d];
                }
            });
        });
    };
    /**
     * Sets the equalizer of the current song, if you wanted to do something like bassboost
     * @param bands The bands that you want lavalink to modify read [IMPLEMENTATION.md](https://github.com/Frederikam/Lavalink/blob/master/IMPLEMENTATION.md#outgoing-messages) for more information
     */
    Player.prototype.equalizer = function (bands) {
        return __awaiter(this, void 0, void 0, function () {
            var newFilters, d;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        newFilters = Object.assign(this.state.filters, { equalizer: bands });
                        return [4 /*yield*/, this.filters(newFilters)];
                    case 1:
                        d = _a.sent();
                        return [2 /*return*/, d];
                }
            });
        });
    };
    /**
     * Sends a destroy signal to lavalink, basically just a cleanup op for lavalink to clean its shit up
     */
    Player.prototype.destroy = function () {
        return this.send("destroy");
    };
    /**
     * Sends voiceUpdate information to lavalink so it can connect to discords voice servers properly
     * @param data The data lavalink needs to connect and recieve data from discord
     */
    Player.prototype.connect = function (data) {
        this.voiceUpdateState = data;
        return this.send("voiceUpdate", data);
    };
    /**
     * Use this to switch channels
     * @param channel The channel id of the channel you want to switch to
     * @param options selfMute and selfDeaf options
     */
    Player.prototype.switchChannel = function (channel, options) {
        if (options === void 0) { options = {}; }
        return this.manager.sendWS(this.id, channel, options);
    };
    /**
     * Used internally to make sure the Player's node is connected and to easily send data to lavalink
     * @param op the op code
     * @param data the data to send
     */
    Player.prototype.send = function (op, data) {
        if (!this.node.connected)
            return Promise.reject(new Error("No available websocket connection for selected node."));
        return this.node.send(__assign(__assign({}, data), { op: op, guildId: this.id }));
    };
    Object.defineProperty(Player.prototype, "manager", {
        /**
         * The manager that created the player
         */
        get: function () {
            return this.node.manager;
        },
        enumerable: false,
        configurable: true
    });
    return Player;
}(events_1.EventEmitter));
exports.Player = Player;
