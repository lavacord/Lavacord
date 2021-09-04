"use strict";
exports.__esModule = true;
exports.Rest = void 0;
var node_fetch_1 = require("node-fetch");
var url_1 = require("url");
var json = function (res) { return res.json(); };
/**
 * A Rest helper for Lavalink
 */
var Rest = /** @class */ (function () {
    function Rest() {
    }
    /**
     * A helper for /loadtracks endpoint
     * @param node The LavalinkNode
     * @param identifer The thing you want to load
     */
    Rest.load = function (node, identifer) {
        var params = new url_1.URLSearchParams();
        params.append("identifier", identifer);
        return node_fetch_1["default"]("http://" + node.host + ":" + node.port + "/loadtracks?" + params, { headers: { Authorization: node.password } }).then(json);
    };
    Rest.decode = function (node, tracks) {
        if (Array.isArray(tracks)) {
            return node_fetch_1["default"]("http://" + node.host + ":" + node.port + "/decodetracks", { method: "POST", body: JSON.stringify(tracks), headers: { Authorization: node.password } }).then(json);
        }
        else {
            var params = new url_1.URLSearchParams();
            params.append("track", tracks);
            return node_fetch_1["default"]("http://" + node.host + ":" + node.port + "/decodetrack?" + params, { headers: { Authorization: node.password } }).then(json);
        }
    };
    /**
     * A helper for /routeplanner/status
     * @param node The LavalinkNode
     */
    Rest.routePlannerStatus = function (node) {
        return node_fetch_1["default"]("http://" + node.host + ":" + node.port + "/routeplanner/status", { headers: { Authorization: node.password } }).then(json);
    };
    /**
     * A helper for /routeplanner/free
     * @param node The LavalinkNode
     * @param address the address you want to free, this is optional
     */
    Rest.routePlannerUnmark = function (node, address) {
        if (address) {
            return node_fetch_1["default"]("http://" + node.host + ":" + node.port + "/routeplanner/free/address", { method: "POST", body: JSON.stringify({ address: address }), headers: { Authorization: node.password } }).then(json);
        }
        return node_fetch_1["default"]("http://" + node.host + ":" + node.port + "/routeplanner/free/all", { method: "POST", headers: { Authorization: node.password } }).then(json);
    };
    return Rest;
}());
exports.Rest = Rest;
