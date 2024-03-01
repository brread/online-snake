const socket = io();

const canvas = document.querySelector("#canvas");
const ctx = canvas.getContext("2d");
const pingEl = document.querySelector("#ping");

canvas.width = 600;
canvas.height = 400;

const TILE_SIZE = 20;

let xVel = 0;
let yVel = 0;

socket.on("entities", (players, apple) => {
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (const player of players) {
    ctx.fillStyle = "#ff00ff";
    socket.id == player.id
      ? (ctx.fillStyle = "#00ff00")
      : (ctx.fillStyle = "#ff00ff");
    for (const part of player.trail) {
      ctx.fillRect(part.x + 1, part.y + 1, TILE_SIZE - 2, TILE_SIZE - 2);
    }
  }

  ctx.fillStyle = "red";
  ctx.fillRect(
    apple.appleX + 3,
    apple.appleY + 3,
    TILE_SIZE - 6,
    TILE_SIZE - 6,
  );
});

socket.on("ping", (ping) => {
  console.log(ping);
  pingEl.innerText = `Your ping: ${ping}ms`;
});

window.onkeydown = (e) => {
  if ((e.key == "a" || e.key == "ArrowLeft") && xVel != 1) {
    xVel = -1;
    yVel = 0;
  } else if ((e.key == "d" || e.key == "ArrowRight") && xVel != -1) {
    xVel = 1;
    yVel = 0;
  } else if ((e.key == "s" || e.key == "ArrowDown") && yVel != -1) {
    xVel = 0;
    yVel = 1;
  } else if ((e.key == "w" || e.key == "ArrowUp") && yVel != 1) {
    xVel = 0;
    yVel = -1;
  }

  socket.emit("vel", xVel, yVel);

  if (e.key.toLowerCase() == "enter") {
    const messageInput = document.querySelector("#send-message");
    if (messageInput.value == "") return;
    socket.emit("message", messageInput.value);
    messageInput.value = "";
  }
};

socket.on("message", (messageContent) => {
  const chatMessage = document.createElement("div");
  chatMessage.innerText = messageContent;
  document.querySelector("#chat-menu").prepend(chatMessage);
});

document.querySelector("#submit-message").addEventListener("click", () => {
  const messageInput = document.querySelector("#send-message");
  socket.emit("message", messageInput.value);
  messageInput.value = "";
});

setInterval(() => {
  socket.emit("ping", Date.now());
}, 1000 / 4);
