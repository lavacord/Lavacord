<div align="center" style="padding-bottom: 1rem">

<img src="https://github.com/lavacord/Lavacord/blob/gh-pages/assets/Lavacordlogotransparent.png?raw=true" alt="Lavacord Logo" height="200">

Lavacord is a simple, flexible, and efficient [Lavalink](https://github.com/lavalink-devs/Lavalink) client for Node.js, supporting multiple Discord libraries. It provides a consistent API for managing music playback, voice connections, and node management, making it easy for both beginners and advanced users to integrate high-performance audio into their Discord bots.

[![npm (scoped)](https://img.shields.io/npm/v/lavacord?label=npm%20version)](https://www.npmjs.com/package/lavacord)
[![npm downloads](https://img.shields.io/npm/dt/lavacord.svg?label=total%20downloads)](https://www.npmjs.com/package/lavacord)
[![GitHub](https://img.shields.io/github/license/lavacord/lavacord)](https://github.com/lavacord/lavacord/)
[![Depfu](https://badges.depfu.com/badges/70051aad57dddc0c44a990d26b1f6e23/overview.svg)](https://depfu.com/github/lavacord/Lavacord?project_id=11810)

[![Discord](https://discordapp.com/api/guilds/690521477514264577/embed.png?style=banner2)](https://discord.gg/wXrjZmV)

[**Click here for the documentation**](https://lavacord.js.org/)

</div>

# Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Supported Discord Libraries](#supported-discord-libraries)
- [Basic Usage](#basic-usage)
- [Advanced Usage](#advanced-usage)
  - [Player Controls](#player-controls)
  - [Audio Filters](#audio-filters)
  - [Error Handling](#error-handling)
  - [Multiple Nodes & Load Balancing](#multiple-nodes--load-balancing)
- [Events](#events)
- [Donate](#donate)
- [Contributors](#contributors)

<br>

# Features

- **TypeScript-first**: Built with TypeScript for type safety and better developer experience.
- **Multi-library support**: Works with popular Discord libraries like discord.js, eris, oceanic.js, cloudstorm, and detritus.
- **Modular architecture**: Easily extendable and customizable with a clear separation of concerns.
- **Event-driven**: Uses Node.js's EventEmitter for handling events, making it easy to listen for and respond to changes in playback state.
- **Lavalink integration**: Seamlessly connects to Lavalink servers for high-performance audio playback.
- **REST API support**: Provides a comprehensive REST API for managing tracks, players, and nodes.
- **Voice state management**: Automatically handles Discord voice state updates and manages voice connections.

# Installation

Install Lavacord using either `yarn`, `npm`, `pnpm` or the package manager of your choice:

```bash
# Using yarn
yarn add lavacord
# Using npm
npm install lavacord
# Using pnpm
pnpm add lavacord
```

**Requirements:**

- **Node.js** v20 or newer is **required**.
- A running **Lavalink** server (Java 17+ required).

# Quick Start

To get started with using Lavacord, first ensure you have a Lavalink server running. You can find instructions on how to set up a Lavalink server on the [Lavalink Getting Started page](https://lavalink.dev/getting-started/).

Once you have your Lavalink server running, you will want to install Lavacord in your project as shown above
Once you have Lavacord installed, you will want to import the `Manager` class from Lavacord or one of the library wrappers, depending on which Discord library you are using, then initialize it with your Lavalink nodes and bot user ID and send function if not using a wrapper.

**Also keep in mind that while all the examples below use CommonJS syntax, Lavacord supports TypeScript, ESM, and CJS. You can import the `Manager` class using either `require` or `import` syntax, depending on your project setup.**

## Lavalink Node Configuration

To connect to a Lavalink server, you need to configure the Lavalink nodes. Each node should have a unique identifier, host, port, password, and an optional secure flag if using SSL/TLS.

We are going to use this nodes array throughtout all the examples in this readme, so make sure to define it before using the examples.

See [LavalinkNodeOptions](https://lavacord.js.org/interfaces/LavalinkNodeOptions.html) for more details on the available options.

You can define your Lavalink nodes in an array like this:

```javascript
const nodes = [
  {
    id: "node1", // Unique identifier for the node
    host: "localhost", // Lavalink server host
    port: 2333, // Lavalink server port
    password: "youshallnotpass", // Lavalink server password
    secure: false, // Set to true if using SSL/TLS, false by default,
    reconnectInterval: 10000, // How long the interval should be to reconnect, default is 10000 ms
    state: {
      // State is a arbitrary object that can be used to store any data you want, it is not used by Lavacord nor do you have to use it
      customData: "example" // Example custom data
    }
  }
];
```

## Supported Discord Libraries

Lavacord provides wrappers for popular Discord libraries:

Each wrapper automatically wires up voice events and exports a `Manager` class tailored for that library.

| Library    | Import Path           |
| ---------- | --------------------- |
| discord.js | `lavacord/discord.js` |
| eris       | `lavacord/eris`       |
| oceanic.js | `lavacord/oceanic`    |
| cloudstorm | `lavacord/cloudstorm` |
| detritus   | `lavacord/detritus`   |

> Want support for another Discord API library?
> [Open an issue or discussion](https://github.com/lavacord/lavacord/issues) to suggest it!

## Wrapper Example

Here's how to use Lavacord with the `discord.js` library wrapper:

```javascript
const { Manager } = require("lavacord/discord.js");
const { Client, GatewayIntentBits } = require("discord.js");

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates]
});

// When using library wrappers, pass the client instance as the first parameter
// The user ID must be provided since client.user.id isn't available until the client is ready
const manager = new Manager(client, nodes, {
  user: "123456789012345678" // Your bot's user ID as a string
});

client.once("ready", async () => {
  console.log(`${client.user.tag} is ready!`);
  // Connect to all Lavalink nodes
  await manager.connect();
});

client.login("your-bot-token");
```

Library wrappers automatically handle:

- **Voice events**: Listens for `VOICE_SERVER_UPDATE` and `VOICE_STATE_UPDATE` events
- **Send function**: Implements the Discord gateway packet sending for you

This eliminates the need to manually wire up voice events or implement the send function, making integration much simpler compared to using the core library directly.

# Basic Usage

Here's a complete example using the core Lavacord library without wrappers:

```javascript
const { Manager, Rest } = require("lavacord");

// Create a new Manager instance with Lavalink nodes
const manager = new Manager(nodes, {
  user: "123456789012345678", // Your bot's user ID
  send: (packet) => {
    // Send voice packets to Discord's gateway
    // Implementation depends on your Discord library
    // Use library wrappers to avoid implementing this manually
    discordClient.gateway.send(packet);
  }
});

// Connect to all Lavalink nodes
await manager.connect();

// Join a voice channel and create a player
const player = await manager.join({
  guild: "987654321098765432", // Guild ID where you want to play music
  channel: "123456789012345678", // Voice channel ID to join
  node: "node1" // Lavalink node ID to use (optional, auto-selects if not provided)
});

// Load a track from various sources
// see https://lavalink.dev/api/rest.html#track-loading
const loadResult = await Rest.load(player.node, "https://www.youtube.com/watch?v=dQw4w9WgXcQ");

if (loadResult.loadType === "track") {
  // Play the loaded track
  await player.play(loadResult.data.encoded);
  console.log(`Now playing: ${loadResult.data.info.title}`);
} else if (loadResult.loadType === "playlist") {
  // Play first track from playlist
  const firstTrack = loadResult.data.tracks[0];
  await player.play(firstTrack.encoded);
  console.log(`Playing playlist: ${loadResult.data.info.name}`);
} else if (loadResult.loadType === "search") {
  // Play first search result
  if (loadResult.data.length > 0) {
    await player.play(loadResult.data[0].encoded);
    console.log(`Now playing: ${loadResult.data[0].info.title}`);
  } else {
    console.log("No search results found");
  }
} else {
  console.log("No tracks found");
}

// Listen for when tracks start playing
player.on("trackStart", (track) => {
  console.log(`Started playing: ${track.info.title}`);
});

// Listen for when tracks end
player.on("trackEnd", (track, reason) => {
  console.log(`Track ended: ${track.info.title} (${reason})`);
});
```

## Search Examples

You can also search for tracks instead of using direct URLs:
See [Track Loading](https://lavalink.dev/api/rest.html#track-loading) for more information on loadtracks endpoint.

```javascript
// Search YouTube
const searchResult = await Rest.load(player.node, "ytsearch:Never Gonna Give You Up");

// Search SoundCloud
const scResult = await Rest.load(player.node, "scsearch:lofi hip hop");

// Search Spotify (if enabled on Lavalink server)
const spotifyResult = await Rest.load(player.node, "spsearch:bohemian rhapsody");

if (searchResult.loadType === "search") {
  if (searchResult.data.length > 0) {
    await player.play(searchResult.data[0].encoded); // Play first result
  }
}
```

# Advanced Usage

## Player Controls

```javascript
// Basic playback controls
await player.pause(true); // Pause
await player.pause(false); // Resume
await player.stop(); // Stop current track
await player.seek(30000); // Seek to 30 seconds
await player.setVolume(50); // Set volume to 50% (0-1000 range)

// All these functions use player.update(UpdatePlayerData) which all return Promise<UpdatePlayerResult>
// You can see more here https://lavalink.dev/api/rest.html#update-player
// For example to set the volume using player.update:
await player.update({
  volume: 50 // Set volume to 50%
});
```

## Audio Filters

Lavacord supports Lavalink's audio filters for sound enhancement:

```javascript
// Apply equalizer (15-band, -0.25 to 1.0 gain per band)
await player.setEqualizer([
  { band: 0, gain: 0.2 }, // 25 Hz
  { band: 1, gain: 0.15 }, // 40 Hz
  { band: 2, gain: 0.1 } // 63 Hz
  // ... up to band 14 (16 kHz)
]);

// Apply multiple filters at once
await player.setFilters({
  timescale: {
    speed: 1.2, // 20% faster
    pitch: 1.0, // Same pitch
    rate: 1.0 // Same rate
  },
  karaoke: {
    level: 1.0,
    monoLevel: 1.0,
    filterBand: 220.0,
    filterWidth: 100.0
  },
  tremolo: {
    frequency: 2.0,
    depth: 0.5
  }
});

// Clear all filters
await player.setFilters({});
```

## Error Handling

```javascript
// Handle player errors
player.on("trackException", (track, exception) => {
  console.error(`Track failed: ${track.info.title}`, exception);
});

player.on("trackStuck", (track, thresholdMs) => {
  console.error(`Track stuck: ${track.info.title} (${thresholdMs}ms)`);
});

// Handle node errors
manager.on("error", (error, node) => {
  console.error(`Node ${node.id} error:`, error);
});

manager.on("disconnect", (code, reason, node) => {
  console.warn(`Node ${node.id} disconnected: ${reason} (${code})`);
  // Players will automatically switch to other available nodes
});
```

## Multiple Nodes & Load Balancing

```javascript
const nodes = [
  {
    id: "node1",
    host: "lavalink1.example.com",
    port: 2333,
    password: "youshallnotpass"
  },
  {
    id: "node2",
    host: "lavalink2.example.com",
    port: 2333,
    password: "youshallnotpass"
  }
];

const manager = new Manager(nodes, options);

// Lavacord automatically selects the best node based on CPU load
const player = await manager.join({ guild: "...", channel: "...", node: "node1" });
console.log(`Using node: ${player.node.id}`);

// Manually switch a player to a different node
const targetNode = manager.nodes.get("node2");
await manager.switch(player, targetNode);
```

# Events

Lavacord emits events at both the `Manager` and `Player` levels, allowing you to handle events globally or per-player. Player events emitted on the `Manager` are prefixed with `player` to avoid conflicts.

## Manager Events

```javascript
// Fired when a node successfully connects
manager.on("ready", (node) => {
  console.log(`Node ${node.id} is ready`);
});

// Fired when a node encounters an error
manager.on("error", (error, node) => {
  console.error(`Node ${node.id} error:`, error);
});

// Fired when a node disconnects
manager.on("disconnect", (code, reason, node) => {
  console.log(`Node ${node.id} disconnected: ${reason} (Code: ${code})`);
});

// Fired when a node is attempting to reconnect
manager.on("reconnecting", (node) => {
  console.log(`Reconnecting to node ${node.id}`);
});

// Fired for raw WebSocket messages (useful for debugging)
manager.on("raw", (message, node) => {
  console.log(`Raw data from ${node.id}:`, message);
});

// Fired for warning messages
manager.on("warn", (message, node) => {
  console.warn(`Warning from ${node.id}: ${message}`);
});
```

### Player Events on Manager

```javascript
// Track events

// https://lavalink.dev/api/websocket.html#trackstartevent
manager.on("playerTrackStart", (player, event) => {
  console.log(`Player ${player.guildId} started: ${event.track.info.title}`);
});

// https://lavalink.dev/api/websocket.html#trackendevent
manager.on("playerTrackEnd", (player, event) => {
  console.log(`Player ${player.guildId} ended: ${event.track.info.title} (${event.reason})`);
});

// https://lavalink.dev/api/websocket.html#trackexceptionevent
manager.on("playerTrackException", (player, event) => {
  console.error(`Player ${player.guildId} exception:`, event.exception);
});

// https://lavalink.dev/api/websocket.html#trackstuckevent
// Fired when a track is stuck (e.g., no audio received for a long time)
manager.on("playerTrackStuck", (player, event) => {
  console.error(`Player ${player.guildId} stuck: ${event.thresholdMs}ms`);
});

// playerState will emit every x time specified in the Lavalink config
// See https://lavalink.dev/api/websocket.html#player-update-op
manager.on("playerState", (player, state) => {
  console.log(`Player ${player.guildId} state update:`, state);
});

// https://lavalink.dev/api/websocket.html#websocketclosedevent
manager.on("playerWebSocketClosed", (player, event) => {
  console.log(`Player ${player.guildId} WebSocket closed: ${event.reason} (${event.code}) by ${event.byRemote ? "discord" : "local"}`);
});

// These events arent apart of the Lavalink API are emitted by Lavacord when using specific methods

// for example pause is emitted when calling player.pause(true) or player.pause(false);
manager.on("playerPause", (player, state) => {
  console.log(`Player ${player.guildId} pause: ${state}`);
});

manager.on("playerVolume", (player, volume) => {
  console.log(`Player ${player.guildId} volume: ${volume}`);
});

manager.on("playerSeek", (player, position) => {
  console.log(`Player ${player.guildId} seek: ${position}ms`);
});

manager.on("playerFilters", (player, filters) => {
  console.log(`Player ${player.guildId} filters:`, filters);
});
```

## Player Events

Handle events on individual player instances:

```javascript
// Track events - fired when tracks start, end, or encounter issues

// https://lavalink.dev/api/websocket.html#trackstartevent
player.on("trackStart", (event) => {
  console.log(`Now playing: ${event.track.info.title} by ${event.track.info.author}`);
});

// https://lavalink.dev/api/websocket.html#trackendevent
player.on("trackEnd", (event) => {
  console.log(`Track ended: ${event.track.info.title} (${event.reason})`);
  // Reasons: "finished", "loadFailed", "stopped", "replaced", "cleanup"
});
// https://lavalink.dev/api/websocket.html#trackexceptionevent
player.on("trackException", (event) => {
  console.error(`Track exception: ${event.track.info.title}`, event.exception);
});

// https://lavalink.dev/api/websocket.html#trackstuckevent
// Fired when a track is stuck (e.g., no audio received for a long time)
player.on("trackStuck", (event) => {
  console.error(`Track stuck: ${event.track.info.title} (${event.thresholdMs}ms)`);
});

// state will emit every x time specified in the Lavalink config
// See https://lavalink.dev/api/websocket.html#player-update-op
player.on("state", (state) => {
  console.log(`Player state:`, {
    position: state.position,
    time: state.time,
    connected: state.connected,
    ping: state.ping
  });
});

// https://lavalink.dev/api/websocket.html#websocketclosedevent
player.on("webSocketClosed", (event) => {
  console.log(`WebSocket closed: ${event.reason} (${event.code}) by ${event.byRemote ? "discord" : "local"}`);
});

// These events arent apart of the Lavalink API are emitted by Lavacord when using specific methods

// for example pause is emitted when calling player.pause(true) or player.pause(false);
player.on("pause", (state) => {
  console.log(`Player ${state ? "paused" : "resumed"}`);
});

player.on("volume", (volume) => {
  console.log(`Volume changed to: ${volume}`);
});

player.on("seek", (position) => {
  console.log(`Seeked to: ${position}ms`);
});

player.on("filters", (filters) => {
  console.log(`Filters applied:`, filters);
});
```

# Donate

If you find Lavacord useful and want to support its development, you can sponsor the main maintainers directly:

- [MrJacz](https://github.com/sponsors/MrJacz)
- [AmandaDiscord](https://github.com/sponsors/AmandaDiscord)

Thank you for your support!

# Contributors

Please make sure to read the [Contributing Guide](CONTRIBUTING.md) before making a pull request.

Thank you to everyone who has contributed to Lavacord!

<a href="https://github.com/lavacord/Lavacord/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=lavacord/Lavacord" alt="Contributors to Lavacord" />
</a>
