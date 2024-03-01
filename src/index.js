const express = require("express");
app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const PORT = process.env.PORT || 3000;

app.use(express.static("/workspaces/workspace/public"));

let players = [];

const tickRate = 15;

const width = 600;
const height = 400;

const TILE_SIZE = 20;
const BOARD_WIDTH = width / TILE_SIZE;
const BOARD_HEIGHT = height / TILE_SIZE;

let appleX = 460;
let appleY = 200;

let currentFrame = 0;

io.on("connection", async (socket) => {
  // if (players.length > 1) {
  //   return socket.disconnect();
  // }

  let player = {
    id: socket.id,
    idNum: players.length + 1,
    x: (BOARD_WIDTH * TILE_SIZE) / 2,
    y: (BOARD_HEIGHT * TILE_SIZE) / 2,
    xVel: 0,
    yVel: 0,
    lastChangedFrame: -1,
    trail: [
      { x: (BOARD_WIDTH * TILE_SIZE) / 2, y: (BOARD_HEIGHT * TILE_SIZE) / 2 },
      { x: (BOARD_WIDTH * TILE_SIZE) / 2, y: (BOARD_HEIGHT * TILE_SIZE) / 2 },
      { x: (BOARD_WIDTH * TILE_SIZE) / 2, y: (BOARD_HEIGHT * TILE_SIZE) / 2 },
    ],
  };

  players.push(player);

  socket.on("vel", (xVel, yVel) => {
    if (player.xVel != xVel || player.yVel != yVel) {
      if (player.lastChangedFrame != currentFrame) {
        player.xVel = xVel;
        player.yVel = yVel;
        player.lastChangedFrame = currentFrame;
      }
    }
  });

  socket.on("ping", (userTime) => {
    socket.emit("ping", Date.now() - userTime);
  });

  socket.on("disconnect", (reason) => {
    console.log("disconnect", reason);
    io.emit("message", `player ${player.idNum} left`);
    players = players.filter((player) => player.id !== socket.id);
  });

  socket.on("message", (messageContent) => {
    io.emit("message", `player ${player.idNum}: ${messageContent}`);
  });

  io.emit("message", `player ${player.idNum} joined`);
});

const loop = (player) => {
  player.x += player.xVel * TILE_SIZE;
  player.y += player.yVel * TILE_SIZE;

  if (player.x > BOARD_WIDTH * TILE_SIZE - TILE_SIZE) player.x = 0;
  else if (player.x < 0) player.x = BOARD_WIDTH * TILE_SIZE - TILE_SIZE;

  if (player.y > BOARD_HEIGHT * TILE_SIZE - TILE_SIZE) player.y = 0;
  else if (player.y < 0) player.y = BOARD_HEIGHT * TILE_SIZE - TILE_SIZE;

  for (const part of player.trail) {
    if (part.x == player.x && part.y == player.y)
      while (player.trail.length > 3) player.trail.shift();

    if (part.x == appleX && part.y == appleY) randomizeApple();
  }

  player.trail.push({
    x: player.x,
    y: player.y,
  });

  player.trail.shift();

  if (player.x == appleX && player.y == appleY) {
    player.trail.push({
      x: player.x,
      y: player.y,
    });
    randomizeApple();
  }
};

const randomizeApple = () => {
  appleX = Math.floor(Math.random() * BOARD_WIDTH) * 20;
  appleY = Math.floor(Math.random() * BOARD_HEIGHT) * 20;

  for (const player of players)
    for (const part of player.trail)
      if (part.x == appleX && part.y == appleY) randomizeApple();
};

setInterval(() => {
  players.forEach(loop);
  io.emit("entities", players, { appleX, appleY });
  currentFrame++;
}, 1000 / tickRate);

server.listen(PORT, () => console.log(`listening on port ${PORT}`));
