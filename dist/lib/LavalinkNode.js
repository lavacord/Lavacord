"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = __importDefault(require("ws"));
const Util_1 = require("./Util");
class LavalinkNode {
    constructor(manager, options) {
        this.manager = manager;
        this._queue = [];
        this.id = options.id;
        this.host = options.host;
        this.port = options.port || 2333;
        this.reconnectInterval = options.reconnectInterval || 5000;
        this.password = options.password || "youshallnotpass";
        this.ws = null;
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
        this.connect();
    }
    async connect() {
        this.ws = await new Promise((resolve, reject) => {
            if (this.connected)
                this.ws.close();
            const headers = {
                Authorization: this.password,
                "Num-Shards": String(this.manager.shards || 1),
                "User-Id": this.manager.user
            };
            if (this.resumeKey)
                headers["Resume-Key"] = this.resumeKey;
            const ws = new ws_1.default(`ws://${this.host}:${this.port}/`, { headers });
            const onEvent = (event) => {
                ws.removeAllListeners();
                reject(event);
            };
            const onOpen = () => {
                this.onOpen();
                ws.removeAllListeners();
                resolve(ws);
            };
            ws
                .once("open", onOpen)
                .once("error", onEvent)
                .once("close", onEvent);
        });
        this.ws
            .on("message", this.onMessage.bind(this))
            .on("error", this.onError.bind(this))
            .on("close", this.onClose.bind(this));
        return this.ws;
    }
    send(msg) {
        return new Promise((resolve, reject) => {
            const parsed = JSON.stringify(msg);
            const queueData = { data: parsed, resolve, reject };
            if (this.connected)
                return this._send(queueData);
            else
                this._queue.push(queueData);
        });
    }
    configureResuming(key = Date.now().toString(16), timeout = 120) {
        this.resumeKey = key;
        return this.send({ op: "configureResuming", key, timeout });
    }
    destroy() {
        if (!this.connected)
            return false;
        this.ws.close(1000, "destroy");
        this.ws = null;
        return true;
    }
    get connected() {
        if (!this.ws)
            return false;
        return this.ws.readyState === ws_1.default.OPEN;
    }
    onOpen() {
        if (this._reconnect)
            clearTimeout(this._reconnect);
        this._queueFlush()
            .then(() => this.configureResuming())
            .catch(error => this.manager.emit("error", error, this));
        this.manager.emit("ready", this);
    }
    onMessage(data) {
        if (Array.isArray(data))
            data = Buffer.concat(data);
        else if (data instanceof ArrayBuffer)
            data = Buffer.from(data);
        const msg = JSON.parse(data.toString());
        if (msg.op && msg.op === "stats")
            this.stats = { ...msg };
        delete this.stats.op;
        if (msg.guildId && this.manager.players.has(msg.guildId))
            this.manager.players.get(msg.guildId).emit(msg.op, msg);
        this.manager.emit("raw", msg, this);
    }
    onError(event) {
        const error = event && event.error ? event.error : event;
        if (!error)
            return;
        this.manager.emit("error", error, this);
        this.reconnect();
    }
    onClose(event) {
        this.manager.emit("disconnect", event, this);
        if (event.code !== 1000 || event.reason !== "destroy")
            return this.reconnect();
    }
    reconnect() {
        this._reconnect = setTimeout(() => {
            this.ws.removeAllListeners();
            this.ws = null;
            this.manager.emit("reconnecting", this);
            this.connect();
        }, this.reconnectInterval);
    }
    _send({ data, resolve, reject }) {
        this.ws.send(data, (error) => {
            if (error)
                reject(error);
            else
                resolve(true);
        });
    }
    async _queueFlush() {
        await Promise.all(this._queue.map(this._send));
        this._queue = [];
    }
}
__decorate([
    Util_1.enumerable(false),
    __metadata("design:type", String)
], LavalinkNode.prototype, "host", void 0);
__decorate([
    Util_1.enumerable(false),
    __metadata("design:type", Object)
], LavalinkNode.prototype, "port", void 0);
__decorate([
    Util_1.enumerable(false),
    __metadata("design:type", String)
], LavalinkNode.prototype, "password", void 0);
exports.LavalinkNode = LavalinkNode;
//# sourceMappingURL=LavalinkNode.js.map