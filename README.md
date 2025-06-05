<div align="center">

# Lavacord

Lavacord is a simple, flexible, and efficient [Lavalink](https://github.com/lavalink-devs/Lavalink) wrapper for Node.js, supporting multiple Discord libraries. It provides a consistent API for managing music playback, voice connections, and node management, making it easy for both beginners and advanced users to integrate high-performance audio into their Discord bots.

[![npm (scoped)](https://img.shields.io/npm/v/lavacord?label=npm%20version)](https://www.npmjs.com/package/lavacord)
[![npm downloads](https://img.shields.io/npm/dt/lavacord.svg?label=total%20downloads)](https://www.npmjs.com/package/lavacord)
[![GitHub](https://img.shields.io/github/license/lavacord/lavacord)](https://github.com/lavacord/lavacord/)
[![Depfu](https://badges.depfu.com/badges/70051aad57dddc0c44a990d26b1f6e23/overview.svg)](https://depfu.com/github/lavacord/Lavacord?project_id=11810)
[![Codacy Badge](https://app.codacy.com/project/badge/Grade/24960ea4889c4fb2a949cc4abc441ac5)](https://app.codacy.com/gh/lavacord/Lavacord/dashboard?utm_source=gh&utm_medium=referral&utm_content=&utm_campaign=Badge_grade)

[![Discord](https://discordapp.com/api/guilds/690521477514264577/embed.png?style=banner2)](https://discord.gg/wXrjZmV)
</div>

---

## Table of Contents

- [Features](#features)
- [Supported Discord Libraries](#supported-discord-libraries)
- [Requirements](#requirements)
- [Installation](#installation)
- [Getting Started](#getting-started)
- [Lavalink Setup](#lavalink-setup)
- [Usage Examples](#usage-examples)
  - [Basic Usage](#basic-usage)
  - [Resolving Tracks](#resolving-tracks)
  - [Joining and Leaving Channels](#joining-and-leaving-channels)
  - [Advanced Usage](#advanced-usage)
- [Library Wrappers](#library-wrappers)
  - [Wrapper Example](#wrapper-example)
- [TypeScript, CommonJS, and ESM Support](#typescript-commonjs-and-esm-support)
- [API Reference](#api-reference)
- [Contributing](#contributing)
- [Community & Support](#community--support)
- [License](#license)
- [Contributors](#contributors)

---

## Features


- 🚀 **Simple API** — Minimal boilerplate and a clear structure for controlling Lavalink.
- 📦 **Modular Design** — Manager, Player, and Node layers for easy customization and extension.
- 🔄 **Manual Node Switching** — Easily move a player from one Lavalink node to another using a single function, enabling custom failover or migration logic in your application.
- 🌀 **REST Helpers** — Convenient utilities for all Lavalink REST API endpoints.
- 💡 **TypeScript First** — Full typings for a modern codebase, with seamless CommonJS and ESM support.
- 🧩 **Multi-Library Support** — Works out-of-the-box with Discord.js, Oceanic.js, Eris, Cloudstorm, Detritus, and more.
- 🎚️ **Full Lavalink Player Controls** — Exposes all advanced player controls (pause, resume, seek, filters, etc.) provided by Lavalink, making them easy to use in your bot code.
- 🛠️ **Extensible** — Ready for custom logic, plugins, and integrations.
- 🔗 **Community Driven** — Open source with an active community, welcoming contributions and suggestions for new features or libraries.

---

## Supported Discord Libraries

Lavacord provides wrappers for popular Discord libraries:

| Library      | Import Path            |
|--------------|-----------------------|
| discord.js   | `lavacord/discord.js` |
| eris         | `lavacord/eris`       |
| oceanic.js   | `lavacord/oceanic`    |
| cloudstorm   | `lavacord/cloudstorm` |
| detritus     | `lavacord/detritus`   |

> Want support for another Discord API library?  
> [Open an issue or discussion](https://github.com/lavacord/lavacord/issues) to suggest it!

---

## Requirements

- **Node.js** v18 or newer recommended
- **Lavalink** server (Java 11+ required)
- A Discord bot token

---

## 📚 Documentation

- [Lavacord Documentation](https://lavacord.github.io/Lavacord/)

---

## 🚀 Installation

Lavacord supports **TypeScript**, **CommonJS**, and **ESM** out of the box.

### Stable

```bash
# Using yarn
yarn add lavacord

# Using npm
npm install lavacord
```

### Development

Will install the latest development version directly from the GitHub repository.

```bash
# Using yarn
yarn add lavacord/lavacord

# Using npm
npm install lavacord/lavacord
```

---

## Getting Started

> **Documentation:** [lavacord.github.io/lavacord](https://lavacord.github.io/Lavacord/)

Lavacord is designed to wrap [Lavalink](https://github.com/lavalink-devs/Lavalink) for seamless integration within your Discord bot.

---

## ⚙️ Lavalink Setup

1. **Download Lavalink**  
   Get the latest Lavalink release from [here](https://github.com/lavalink-devs/Lavalink/releases).

2. **Configure application.yml**  
   Place an `application.yml` file in your working directory.  
   See the [example config](https://github.com/lavalink-devs/Lavalink/blob/master/LavalinkServer/application.yml.example).

3. **Run Lavalink**  
   ```sh
   java -jar Lavalink.jar
   ```

---

## 🛠️ Usage Examples

### Basic Usage

```js
// Import the Lavacord Manager class (works with CommonJS, ESM, and TypeScript)
const { Manager } = require("lavacord");

// Define your Lavalink nodes
const nodes = [
  { id: "1", host: "localhost", port: 2333, password: "youshallnotpass" }
];

// Create the manager with your bot's user ID and a send function
const manager = new Manager(nodes, {
  user: client.user.id, // Your bot's user ID
  send: (packet) => {
    // Send the packet to Discord's WebSocket using your library's method
  }
});

// Connect to all Lavalink nodes (asynchronous)
await manager.connect();

// Listen for errors from any node
manager.on("error", (error, node) => {
  console.error("Lavalink error:", error, "Node:", node.id);
});
```
*This example shows how to set up Lavacord with your bot and connect to Lavalink nodes.*

---

### Resolving Tracks

```js
// Import the REST helper from Lavacord
const { Rest } = require("lavacord");

// Function to resolve tracks using Lavalink's REST API
async function getSongs(search) {
  const node = manager.idealNodes[0]; // Pick the best available node
  return Rest.load(node, search).catch(err => {
    console.error(err);
    return null;
  });
}

// Example usage: search YouTube for a track
getSongs("ytsearch:30 second song").then(songs => {
  // handle tracks
});
```
*This example demonstrates how to search for tracks using Lavalink's REST API via Lavacord.*

---

### Joining and Leaving Voice Channels

```js
// Join a voice channel and create a player
const player = await manager.join({
  guild: guildId,      // Discord guild/server ID
  channel: channelId,  // Discord voice channel ID
  node: "1"            // Lavalink node ID
});

// Play a track (track is a base64 string from Lavalink REST)
await player.play(track);

// Listen for player events
player.once("error", error => console.error(error));
player.once("end", data => {
  if (data.type === "TrackEndEvent" && data.reason === "replaced") return;
  // Play next song or handle end of queue
});

// Leave the voice channel
await manager.leave(guildId);
```
*This example shows how to join a voice channel, play a track, and handle player events.*

---

## 🎛️ Advanced Usage

### Player Controls

```js
// Pause playback
await player.pause(true);

// Resume playback
await player.resume();

// Seek to 1 minute in the track
await player.seek(60000);

// Set volume to 50%
await player.volume(0.5);

// Apply filters (e.g., timescale)
await player.filters({ timescale: { speed: 1.2, pitch: 1.1, rate: 1.0 } });

// Apply equalizer settings
await player.equalizer([{ band: 0, gain: 0.25 }]);
```
*All advanced player controls are exposed from Lavalink via Lavacord's Player API.*

### Node Management

```js
// Add a new Lavalink node at runtime
manager.createNode({ id: "2", host: "otherhost", port: 2333, password: "pass" });

// Remove a node by ID
manager.removeNode("2");

// Switch a player to another node (for failover or load balancing)
await manager.switch(player, manager.nodes.get("2"));
```
*Lavacord lets you manage Lavalink nodes and take advantage of Lavalink's built-in failover and load balancing.*

---

## 🤖 Library Wrappers

Lavacord supports multiple Discord libraries via wrappers.  
You can use these by importing from `lavacord/wrappername`:

- `lavacord/discord.js`
- `lavacord/eris`
- `lavacord/oceanic`
- `lavacord/cloudstorm`
- `lavacord/detritus`

Each wrapper automatically wires up voice events and exports a `Manager` class tailored for that library.  
See the [wrappers directory](src/wrappers/) for details and usage examples.

---

### Wrapper Example

```js
// Import the Manager class from lavacord's discord.js wrapper.
// This manages Lavalink nodes and music playback for Discord.js bots.
const { Manager } = require("lavacord/discord.js");	

// Import the main Discord.js Client class to interact with the Discord API.
const { Client } = require("discord.js");

// Create a new Discord client instance.
const client = new Client();

// Wait for the bot to be ready before creating the manager
client.once("ready", async () => {
  // Create a new Lavacord Manager instance with your Lavalink nodes and bot user ID
  const manager = new Manager({
    nodes: [{ id: "1", host: "localhost", port: 2333, password: "youshallnotpass" }],
    user: client.user.id,
  });

  // Connect the manager to the Lavalink node(s)
  await manager.connect();
});

// Log in to Discord with your bot token.
client.login("your-bot-token");
```
*This example shows how to use the Discord.js wrapper for seamless integration.*

---

## 📝 TypeScript, CommonJS, and ESM Support

Lavacord is written in TypeScript and ships with full type definitions.  
You can use all features with type safety and IDE autocompletion.

**TypeScript Example:**
```ts
import { Manager } from "lavacord/discord.js";
import { Client } from "discord.js";

const client = new Client();

client.once("ready", async () => {
  const manager = new Manager({
    nodes: [{ id: "1", host: "localhost", port: 2333, password: "youshallnotpass" }],
    user: client.user!.id,
  });
  await manager.connect();
});

client.login("your-bot-token");
```
*This example demonstrates usage with TypeScript and Discord.js.*

---

## 🧩 API Reference

- `Manager`: Handles nodes, players, and voice state.
- `Player`: Controls playback, filters, and events.
- `Rest`: Lavalink REST API helpers.
- `Types`: Type definitions for options, packets, and more.

---

## Contributing

Contributions are welcome!  
If you'd like to suggest support for a new Discord API library, [open an issue or discussion](https://github.com/lavacord/lavacord/issues).

See [CONTRIBUTING.md](https://github.com/lavacord/lavacord/blob/master/CONTRIBUTING.md) for guidelines.

---

## Community & Support

- [Lavacord Discord Server](https://discord.gg/wXrjZmV) — Ask questions, get help, and chat with the community.
- [GitHub Issues](https://github.com/lavacord/lavacord/issues) — For bug reports, feature requests, and library suggestions.

---

## 💖 Donate

If you find Lavacord useful and want to support its development, you can sponsor us via [GitHub Sponsors](https://github.com/sponsors/lavacord). Thank you for your support!

---

## License

Lavacord is licensed under the [Apache-2.0 License](LICENSE).

---

## Contributing

Contributions are welcome!  
If you'd like to suggest support for a new Discord API library, [open an issue or discussion](https://github.com/lavacord/lavacord/issues).

See [CONTRIBUTING.md](https://github.com/lavacord/lavacord/blob/master/CONTRIBUTING.md) for guidelines.

### Contributors

Thank you to everyone who has contributed to Lavacord!

<a href="https://github.com/lavacord/Lavacord/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=lavacord/Lavacord" />
</a>