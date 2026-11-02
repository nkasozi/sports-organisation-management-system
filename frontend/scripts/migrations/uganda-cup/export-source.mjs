// Read-only export of the public feed used by the Challenge Place web client.
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const code = process.argv[2] || "6a15adab5afc4d1f05826e36";
const output = fileURLToPath(
  new URL(process.argv[3] || "./source.json", import.meta.url),
);
const socket = new WebSocket(
  "wss://api.challengeplace.com/socket.io/?EIO=4&transport=websocket",
);
const pending = new Map();
let nextId = 0;
let readyResolve;
let readyReject;
const ready = new Promise((resolve, reject) => {
  readyResolve = resolve;
  readyReject = reject;
});
const timeout = setTimeout(
  () => readyReject(new Error("Public feed connection timed out")),
  20000,
);
let settings;
socket.onerror = () => readyReject(new Error("Public feed connection failed"));
socket.onmessage = ({ data }) => {
  const packet = String(data);
  if (packet === "2") return socket.send("3");
  if (packet.startsWith("0")) {
    socket.send(
      "40/challenge," +
        JSON.stringify({
          tokenId: null,
          linkCode: code,
          challengeLinkCode: code,
          lang: "en",
        }),
    );
  }
  if (packet.startsWith("42/challenge,")) {
    const [event, payload] = JSON.parse(packet.slice("42/challenge,".length));
    if (event === "challenge-settings") {
      settings = payload;
      clearTimeout(timeout);
      readyResolve();
    }
    if (event === "server-message")
      console.error("Source notice:", JSON.stringify(payload));
  }
  const ack = packet.match(/^43\/challenge,(\d+)(\[.*)$/s);
  if (ack && pending.has(Number(ack[1]))) {
    const request = pending.get(Number(ack[1]));
    pending.delete(Number(ack[1]));
    clearTimeout(request.timeout);
    request.resolve(JSON.parse(ack[2])[0]);
  }
};
function room(name, id = null) {
  return new Promise((resolve, reject) => {
    const requestId = nextId++;
    const args = { room: "room-challenge-" + name, roomId: id };
    pending.set(requestId, {
      resolve,
      timeout: setTimeout(() => {
        pending.delete(requestId);
        reject(new Error("Timed out reading " + name + ":" + id));
      }, 20000),
    });
    socket.send(
      "42/challenge," + requestId + JSON.stringify(["enter-room", args]),
    );
  });
}
const archive = {
  source: `https://challenge.place/c/${code}`,
  captured_at: new Date().toISOString(),
  settings: {},
  rooms: {},
};
async function capture(name, id = null) {
  const key = name + (id ? ":" + id : "");
  const payload = await room(name, id);
  if (!payload || payload.error)
    throw new Error("Source rejected " + key + ": " + JSON.stringify(payload));
  archive.rooms[key] = payload;
  socket.send(
    "42/challenge," +
      JSON.stringify([
        "exit-room",
        { room: "room-challenge-" + name, roomId: id },
      ]),
  );
  await writeFile(output, JSON.stringify(archive, null, 2) + "\n");
  console.log("Captured", key, Object.keys(payload));
  return payload;
}
try {
  await ready;
  if (!settings.public || settings.id !== code)
    throw new Error("Expected public Uganda Cup");
  archive.settings = settings;
  await mkdir(fileURLToPath(new URL(".", import.meta.url)), {
    recursive: true,
  });
  for (const name of ["dashboard", "competitors", "stages", "statistics"])
    await capture(name);
  for (const team of Object.values(archive.rooms.competitors.competitors))
    await capture("competitor-details", team.id);
  for (const stage of Object.values(archive.rooms.stages.stages))
    await capture("stage-details", stage.id);
  for (const stage of Object.values(archive.rooms.stages.stages)) {
    for (const series of Object.values(
      archive.rooms["stage-details:" + stage.id].series,
    )) {
      if (!series.disabled) await capture("series-details", series.id);
    }
  }
  const matches = new Set();
  const players = new Set();
  for (const [key, value] of Object.entries(archive.rooms)) {
    if (
      key.startsWith("series-details:") ||
      key.startsWith("competitor-details:")
    ) {
      for (const id of Object.keys(value.matches || {})) matches.add(id);
    }
    if (key.startsWith("competitor-details:"))
      for (const id of Object.keys(value.players || {})) players.add(id);
  }
  for (const id of matches) await capture("match-details", id);
  for (const id of players) await capture("player-details", id);
  console.log(
    "Export complete:",
    players.size,
    "players,",
    matches.size,
    "matches",
  );
} finally {
  clearTimeout(timeout);
  socket.close();
}
