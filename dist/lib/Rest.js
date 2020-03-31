"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fetch_1 = __importDefault(require("node-fetch"));
const url_1 = require("url");
const json = (res) => res.json();
class Rest {
    static load(node, identifer) {
        const params = new url_1.URLSearchParams();
        params.append("identifier", identifer);
        return node_fetch_1.default(`http://${node.host}:${node.port}/loadtracks?${params}`, { headers: { Authorization: node.password } }).then(json);
    }
    static decode(node, tracks) {
        if (Array.isArray(tracks)) {
            return node_fetch_1.default(`http://${node.host}:${node.port}/decodetracks`, { method: "POST", body: JSON.stringify(tracks), headers: { Authorization: node.password } }).then(json);
        }
        else {
            const params = new url_1.URLSearchParams();
            params.append("track", tracks);
            return node_fetch_1.default(`http://${node.host}:${node.port}/decodetrack?${params}`, { headers: { Authorization: node.password } }).then(json);
        }
    }
    static routePlannerStatus(node) {
        return node_fetch_1.default(`http://${node.host}:${node.port}/routeplanner/status`, { headers: { Authorization: node.password } }).then(json);
    }
    static routePlannerUnmark(node, address) {
        if (address) {
            return node_fetch_1.default(`http://${node.host}:${node.port}/routeplanner/free/address`, { method: "POST", body: JSON.stringify({ address }), headers: { Authorization: node.password } }).then(json);
        }
        return node_fetch_1.default(`http://${node.host}:${node.port}/routeplanner/free/all`, { method: "POST", headers: { Authorization: node.password } }).then(json);
    }
}
exports.Rest = Rest;
//# sourceMappingURL=Rest.js.map