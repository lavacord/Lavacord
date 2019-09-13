"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const WebSocket = require("ws");
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
    }
    connect() {
        return new Promise((resolve, reject) => {
            if (this.connected)
                this.ws.close();
            const headers = {
                Authorization: this.password,
                "Num-Shards": String(this.manager.shards || 1),
                "User-Id": this.manager.user
            };
            if (this.resumeKey)
                headers["Resume-Key"] = this.resumeKey;
            this.ws = new WebSocket(`ws://${this.host}:${this.port}/`, { headers });
            const onOpen = () => {
                this.ws.off("open", onOpen);
                this.ws.off("error", onError);
                this.ws.off("close", onClose);
                resolve(true);
            };
            const onClose = (event) => {
                this.ws.off("open", onOpen);
                this.ws.off("error", onError);
                this.ws.off("close", onClose);
                reject(event);
            };
            const onError = (event) => {
                this.ws.off("open", onOpen);
                this.ws.off("error", onError);
                this.ws.off("close", onClose);
                reject(event);
            };
            this.ws.once("open", onOpen);
            this.ws.once("error", onError);
            this.ws.once("close", onClose);
            this.ws.on("open", this.onOpen.bind(this));
            this.ws.on("message", this.onMessage.bind(this));
            this.ws.on("error", this.onError.bind(this));
            this.ws.on("close", this.onClose.bind(this));
        });
    }
    onOpen() {
        if (this._reconnect)
            clearTimeout(this._reconnect);
        this._queueFlush()
            .then(() => this.configureResuming())
            .catch(error => this.manager.emit("error", error, this));
        this.manager.emit("ready", this);
        this.configureResuming();
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
    get connected() {
        if (!this.ws)
            return false;
        return this.ws.readyState === WebSocket.OPEN;
    }
}
exports.LavalinkNode = LavalinkNode;
//# sourceMappingURL=LavalinkNode.js.map