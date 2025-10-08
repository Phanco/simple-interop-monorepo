import express from "express";
import cors from "cors";
import DB, { Message } from "./db";
import Broadcaster from "./Broadcaster";
import NetworkControl from "./NetworkControl";
import Monitor from "./Monitor";

// Setup Express HTTP server
const app = express();
const HOST = process.env.HOST || "0.0.0.0";
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok", name: process.env.NAME });
});

app.get("/message/:id", async (req, res) => {
  const txid = req.params.id;
  try {
    const message = await Message.findOne({
      where: {
        senderChainHash: txid,
      },
    });
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }
    res.json(message);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(HOST, PORT, () => {
  console.log(`HTTP server running on port ${PORT}`);
});

(async () => {
  await DB.sync();

  const networkControl = new NetworkControl();
  await networkControl.init();

  const broadcaster = new Broadcaster(process.env.NAME, networkControl);
  await broadcaster.init();
  await broadcaster.start();

  const monitor = new Monitor(networkControl);
  await monitor.start();
})();
