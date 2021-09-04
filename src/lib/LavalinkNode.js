"use strict";
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
exports.LavalinkNode = void 0;
var ws_1 = require("ws");
/**
 * The class for handling everything to do with connecting to Lavalink
 */
var LavalinkNode = /** @class */ (function () {
    /**
     * The base of the connection to lavalink
     * @param manager The manager that created the LavalinkNode
     * @param options The options of the LavalinkNode {@link LavalinkNodeOptions}
     */
    function LavalinkNode(manager, options) {
        this.manager = manager;
        /**
         * The host of the LavalinkNode, this could be a ip or domain.
         */
        this.host = "localhost";
        /**
         * The port of the LavalinkNode
         */
        this.port = 2333;
        /**
         * The interval that the node will try to reconnect to lavalink at in milliseconds
         */
        this.reconnectInterval = 10000;
        /**
         * The password of the lavalink node
         */
        this.password = "youshallnotpass";
        /**
         * The WebSocket instance for this LavalinkNode
         */
        this.ws = null;
        /**
         * The resume timeout
         */
        this.resumeTimeout = 120;
        /**
         * The queue for send
         * @private
         */
        this._queue = [];
        this.id = options.id;
        if (options.host)
            Object.defineProperty(this, "host", { value: options.host });
        if (options.port)
            Object.defineProperty(this, "port", { value: options.port });
        if (options.password)
            Object.defineProperty(this, "password", { value: options.password });
        if (options.reconnectInterval)
            this.reconnectInterval = options.reconnectInterval;
        if (options.resumeKey)
            this.resumeKey = options.resumeKey;
        if (options.resumeTimeout)
            this.resumeTimeout = options.resumeTimeout;
        if (options.state)
            this.state = options.state;
        this.stats = {
            players: 0,
            playingPlayers: 0,
            uptime: 0,
            memory: {
                free: 0,
                used: 0,
                allocated: 0,
                reservable: 0
            },
            cpu: {
                cores: 0,
                systemLoad: 0,
                lavalinkLoad: 0
            }
        };
    }
    /**
     * Connects the node to Lavalink
     */
    LavalinkNode.prototype.connect = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = this;
                        return [4 /*yield*/, new Promise(function (resolve, reject) {
                                if (_this.connected)
                                    _this.ws.close();
                                var headers = {
                                    Authorization: _this.password,
                                    "Num-Shards": String(_this.manager.shards || 1),
                                    "User-Id": _this.manager.user
                                };
                                if (_this.resumeKey)
                                    headers["Resume-Key"] = _this.resumeKey;
                                var ws = new ws_1["default"]("ws://" + _this.host + ":" + _this.port + "/", { headers: headers });
                                var onEvent = function (event) {
                                    ws.removeAllListeners();
                                    reject(event);
                                };
                                var onOpen = function () {
                                    _this.onOpen();
                                    ws.removeAllListeners();
                                    resolve(ws);
                                };
                                ws
                                    .once("open", onOpen)
                                    .once("error", onEvent)
                                    .once("close", onEvent);
                            })];
                    case 1:
                        _a.ws = _b.sent();
                        this.ws
                            .on("message", this.onMessage.bind(this))
                            .on("error", this.onError.bind(this))
                            .on("close", this.onClose.bind(this));
                        return [2 /*return*/, this.ws];
                }
            });
        });
    };
    /**
     * Sends data to lavalink or puts it in a queue if not connected yet
     * @param msg Data you want to send to lavalink
     */
    LavalinkNode.prototype.send = function (msg) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var parsed = JSON.stringify(msg);
            var queueData = { data: parsed, resolve: resolve, reject: reject };
            if (_this.connected)
                return _this._send(queueData);
            else
                _this._queue.push(queueData);
        });
    };
    /**
     * Configures the resuming key for the LavalinkNode
     * @param key the actual key to send to lavalink to resume with
     * @param timeout how long before the key invalidates and lavalinknode will stop expecting you to resume
     */
    LavalinkNode.prototype.configureResuming = function (key, timeout) {
        if (timeout === void 0) { timeout = this.resumeTimeout; }
        return this.send({ op: "configureResuming", key: key, timeout: timeout });
    };
    /**
     * Destorys the connection to the Lavalink Websocket
     */
    LavalinkNode.prototype.destroy = function () {
        if (!this.connected)
            return false;
        this.ws.close(1000, "destroy");
        this.ws = null;
        return true;
    };
    Object.defineProperty(LavalinkNode.prototype, "connected", {
        /**
         * Whether or not the node is connected
         */
        get: function () {
            if (!this.ws)
                return false;
            return this.ws.readyState === ws_1["default"].OPEN;
        },
        enumerable: false,
        configurable: true
    });
    /**
     * A private function for handling the open event from WebSocket
     */
    LavalinkNode.prototype.onOpen = function () {
        var _this = this;
        if (this._reconnect)
            clearTimeout(this._reconnect);
        this._queueFlush()["catch"](function (error) { return _this.manager.emit("error", error, _this); });
        if (this.resumeKey)
            this.configureResuming(this.resumeKey)["catch"](function (error) { return _this.manager.emit("error", error, _this); });
        this.manager.emit("ready", this);
    };
    /**
     * Private function for handling the message event from WebSocket
     * @param data The data that came from lavalink
     */
    LavalinkNode.prototype.onMessage = function (data) {
        if (Array.isArray(data))
            data = Buffer.concat(data);
        else if (data instanceof ArrayBuffer)
            data = Buffer.from(data);
        var msg = JSON.parse(data.toString());
        if (msg.op && msg.op === "stats")
            this.stats = __assign({}, msg);
        delete this.stats.op;
        if (msg.guildId && this.manager.players.has(msg.guildId))
            this.manager.players.get(msg.guildId).emit(msg.op, msg);
        this.manager.emit("raw", msg, this);
    };
    /**
     * Private function for handling the error event from WebSocket
     * @param event WebSocket event data
     */
    LavalinkNode.prototype.onError = function (event) {
        var error = event && event.error ? event.error : event;
        if (!error)
            return;
        this.manager.emit("error", error, this);
        this.reconnect();
    };
    /**
     * Private function for handling the close event from WebSocket
     * @param event WebSocket event data
     */
    LavalinkNode.prototype.onClose = function (event) {
        this.manager.emit("disconnect", event, this);
        if (event.code !== 1000 || event.reason !== "destroy")
            return this.reconnect();
    };
    /**
     * Handles reconnecting if something happens and the node discounnects
     */
    LavalinkNode.prototype.reconnect = function () {
        var _this = this;
        this._reconnect = setTimeout(function () {
            _this.ws.removeAllListeners();
            _this.ws = null;
            _this.manager.emit("reconnecting", _this);
            _this.connect();
        }, this.reconnectInterval);
    };
    /**
     * Sends data to the Lavalink Websocket
     * @param param0 data to send
     */
    LavalinkNode.prototype._send = function (_a) {
        var data = _a.data, resolve = _a.resolve, reject = _a.reject;
        this.ws.send(data, function (error) {
            if (error)
                reject(error);
            else
                resolve(true);
        });
    };
    /**
     * Flushs the send queue
     */
    LavalinkNode.prototype._queueFlush = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Promise.all(this._queue.map(this._send))];
                    case 1:
                        _a.sent();
                        this._queue = [];
                        return [2 /*return*/];
                }
            });
        });
    };
    return LavalinkNode;
}());
exports.LavalinkNode = LavalinkNode;
