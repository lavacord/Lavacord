[![Discord](https://discordapp.com/api/guilds/323779330033319941/embed.png)](https://discord.gg/J8AqH4A)
[![npm](https://img.shields.io/npm/v/npm.svg)](https://www.npmjs.com/package/lavacord)
[![npm downloads](https://img.shields.io/npm/dt/lavacord.svg?maxAge=3600)](https://www.npmjs.com/package/lavacord)
[![NPM version](https://badge.fury.io/js/lavacord.svg)](http://badge.fury.io/js/lavacord)
[![Build Status](https://travis-ci.org/MrJacz/lavacord.svg?branch=master)](https://travis-ci.org/MrJacz/lavacord)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/b50839d781c24a94a4e1c17342a147bd)](https://www.codacy.com/app/MrJacz/lavacord?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=MrJacz/lavacord&amp;utm_campaign=Badge_Grade)
[![Open Source Love](https://badges.frapsoft.com/os/mit/mit.svg?v=102)](https://github.com/ellerbrock/open-source-badge/)
[![dependencies Status](https://david-dm.org/mrjacz/lavacord/status.svg)](https://david-dm.org/mrjacz/lavacord)
[![devDependencies Status](https://david-dm.org/mrjacz/lavacord/dev-status.svg)](https://david-dm.org/mrjacz/lavacord?type=dev)
[![NPM](https://nodei.co/npm/lavacord.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/lavacord/)

# LavaCord
A simple and easy to use lavalink wrapper.

## Documentation
[**mrjacz.github.io/lavacord**](https://mrjacz.github.io/lavacord/)

## Installation

**For stable**
```bash
# Using yarn
yarn add lavacord

# Using npm
npm install lavacord
```

**For Development**
```bash
# Using yarn
yarn add MrJacz/LavaCord

# Using npm
npm install MrJacz/LavaCord
```

## LavaLink configuration
Download from [the CI server](https://ci.fredboat.com/viewLog.html?buildId=lastSuccessful&buildTypeId=Lavalink_Build&tab=artifacts&guest=1)

Put an `application.yml` file in your working directory. [Example](https://github.com/Frederikam/Lavalink/blob/master/LavalinkServer/application.yml.example)

Run with `java -jar Lavalink.jar`

## The issue tracker is for issues only
If you're having a problem with the module contact us in the [**Discord Server**](https://discord.gg/J8AqH4A)

# Implementation
Start by creating a new `Manager` passing an array of nodes and an object with `user` the client's user id and `shards` The total number of shards your bot is operating on.

```javascript
const { Manager } = require("lavacord");

const nodes = [
    { host: "localhost", port: 2333, password: "youshallnotpass" }
];

const manager = new Manager(client, nodes, {
    user: client.user.id, // Client id
    shards: shardCount // Total number of shards your bot is operating on
});

manager.on("error", (error, node) => {
    error // is the error
    node // is the node which the error is from
});
```

Resolving tracks using LavaLink REST API

```javascript
const fetch = require("node-fetch");
const { URLSearchParams } = require("url");

async function getSongs(search) {
    const node = manager.nodes.first();

    const params = new URLSearchParams();
    params.append("identifier", search);

    return fetch(`http://${node.host}:${node.port}/loadtracks?${params}`, { headers: { Authorization: node.password } })
        .then(res => res.json())
        .then(data => data.tracks)
        .catch(err => {
            console.error(err);
            return null;
        });
}

getSongs("ytsearch:30 second song").then(songs => {
    // handle loading of the tracks somehow ¯\_(ツ)_/¯
});
```

Joining and Leaving channels

```javascript
// Join
const player = await manager.join({
    guild: guildId, // Guild id
    channel: channelId, // Channel id
    host: "localhost" // lavalink host, based on array of nodes
});

await player.play(track); // Track is a base64 string we get from Lavalink REST API

player.once("error", error => console.error(error));
player.once("end", data => {
    if (data.reason === "REPLACED") return; // Ignore REPLACED reason to prevent skip loops
    // Play next song
});

// Leave voice channel and destory Player
await manager.leave(guildId); // Player ID aka guild id
```
