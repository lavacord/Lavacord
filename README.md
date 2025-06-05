[![Discord](https://discordapp.com/api/guilds/323779330033319941/embed.png)](https://discord.gg/wXrjZmV)
[![npm (scoped)](https://img.shields.io/npm/v/lavacord?label=npm%20version)](https://www.npmjs.com/package/lavacord)
[![npm downloads](https://img.shields.io/npm/dt/lavacord.svg?label=total%20downloads)](https://www.npmjs.com/package/lavacord)
[![GitHub](https://img.shields.io/github/license/lavacord/lavacord)](https://github.com/lavacord/lavacord/)
[![Depfu](https://badges.depfu.com/badges/70051aad57dddc0c44a990d26b1f6e23/overview.svg)](https://depfu.com/github/lavacord/Lavacord?project_id=11810)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/b50839d781c24a94a4e1c17342a147bd)](https://www.codacy.com/app/lavacord/lavacord)

# Lavacord

Lavacord is a simple, flexible, and efficient [Lavalink](https://github.com/lavalink-devs/Lavalink) wrapper for Node.js, supporting multiple Discord libraries. It provides a consistent API for managing music playback, voice connections, and node management, making it easy for both beginners and advanced users to integrate high-performance audio into their Discord bots.

---

## 📚 Documentation

- [Lavacord Documentation](https://lavacord.github.io/Lavacord/)

---

## 🚀 Installation

**Stable:**
```bash
yarn add lavacord
# or
npm install lavacord
```

**Development:**
```bash
yarn add lavacord/lavacord
# or
npm install lavacord/lavacord
```

---

## ⚙️ Lavalink Setup

1. Download Lavalink from [GitHub Releases](https://github.com/lavalink-devs/Lavalink/releases).
2. Place an `application.yml` in your working directory ([example config](https://github.com/lavalink-devs/Lavalink/blob/master/LavalinkServer/application.yml.example)).
3. Start Lavalink:
   ```bash
   java -jar Lavalink.jar
   ```

---

## ❓ Getting Help

- For questions or support, join our [Discord Server](https://discord.gg/wXrjZmV).
- Please use the [issue tracker](https://github.com/lavacord/lavacord/issues) for bugs only.

---

## 🛠️ Usage

### Basic Example

```js
const { Manager } = require("lavacord");

const nodes = [
  { id: "1", host: "localhost", port: 2333, password: "youshallnotpass" }
];

const manager = new Manager(nodes, {
  user: client.user.id, // Your bot's user ID
  send: (packet) => {
    // Send the packet to Discord's WebSocket using your library's method
  }
});

await manager.connect();

manager.on("error", (error, node) => {
  console.error("Lavalink error:", error, "Node:", node.id);
});
```

### Resolving Tracks

```js
const { Rest } = require("lavacord");

async function getSongs(search) {
  const node = manager.idealNodes[0];
  return Rest.load(node, search).catch(err => {
    console.error(err);
    return null;
  });
}

getSongs("ytsearch:30 second song").then(songs => {
  // handle tracks
});
```

### Joining and Leaving Voice Channels

```js
// Join
const player = await manager.join({
  guild: guildId,
  channel: channelId,
  node: "1"
});

await player.play(track); // track is a base64 string from Lavalink REST

player.once("error", error => console.error(error));
player.once("end", data => {
  if (data.type === "TrackEndEvent" && data.reason === "replaced") return;
  // Play next song
});

// Leave
await manager.leave(guildId);
```

---

## 🎛️ Advanced Usage

### Player Controls

- **Pause/Resume:**
  ```js
  await player.pause(true);  // Pause
  await player.resume();     // Resume
  ```
- **Seek:**
  ```js
  await player.seek(60000); // Seek to 1 minute
  ```
- **Volume:**
  ```js
  await player.volume(0.5); // Set volume to 50%
  ```
- **Filters/Equalizer:**
  ```js
  await player.filters({ timescale: { speed: 1.2, pitch: 1.1, rate: 1.0 } });
  await player.equalizer([{ band: 0, gain: 0.25 }]);
  ```

### Node Management

- **Add/Remove Nodes:**
  ```js
  manager.createNode({ id: "2", host: "otherhost", port: 2333, password: "pass" });
  manager.removeNode("2");
  ```
- **Switching Nodes (for failover):**
  ```js
  await manager.switch(player, manager.nodes.get("2"));
  ```

---

## 🤖 Library Wrappers

Lavacord supports multiple Discord libraries via wrappers.  
You can use these by importing from `lavacord/wrappername`:

- `lavacord/discord.js`
- `lavacord/eris`
- `lavacord/oceanic`
- `lavacord/cloudstorm`
- `lavacord/detritus`

Each wrapper automatically wires up voice events and provides a `Manager` class tailored for that library.  
See the [wrappers directory](src/wrappers/) for details and usage examples.

---

## 📝 TypeScript Support

Lavacord is written in TypeScript and ships with full type definitions.  
You can use all features with type safety and IDE autocompletion.

---

## 🧩 API Reference

- `Manager`: Handles nodes, players, and voice state.
- `Player`: Controls playback, filters, and events.
- `Rest`: Lavalink REST API helpers.
- `Types`: Type definitions for options, packets, and more.

---

## 📦 Building & Contributing

- Build: `yarn build`
- Lint: `yarn lint`
- Docs: `yarn docs`

See [CONTRIBUTING.md](https://github.com/lavacord/lavacord/blob/master/CONTRIBUTING.md) for guidelines.

---

## 📄 License

Lavacord is licensed under the [Apache-2.0 License](LICENSE).