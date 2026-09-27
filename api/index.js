const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Temporary in-memory storage.
// Messages disappear when the server restarts.
const messages = new Map();

app.use(express.json({ limit: "50kb" }));

// Serve the dashboard
app.use(express.static(path.join(__dirname, "public")));

// Receive emergency message
app.post("/messages", (req, res) => {
    const message = req.body;

    if (!message.message_id) {
        return res.status(400).json({
            status: "error",
            message: "message_id is required"
        });
    }

    // Duplicate protection
    if (messages.has(message.message_id)) {
        return res.json({
            status: "duplicate",
            message_id: message.message_id
        });
    }

    const storedMessage = {
        ...message,
        received_at: Date.now()
    };

    messages.set(message.message_id, storedMessage);

    console.log("Emergency received:", message.message_id);

    return res.status(200).json({
        status: "received",
        message_id: message.message_id
    });
});

// Return all emergencies
app.get("/messages", (req, res) => {
    const allMessages = Array.from(messages.values()).reverse();

    res.json({
        count: allMessages.length,
        messages: allMessages
    });
});

// Return one emergency
app.get("/messages/:messageId", (req, res) => {
    const message = messages.get(req.params.messageId);

    if (!message) {
        return res.status(404).json({
            status: "error",
            message: "Message not found"
        });
    }

    res.json(message);
});

// Health check
app.get("/health", (req, res) => {
    res.json({
        system: "Emergency Relay",
        status: "running",
        cached_messages: messages.size
    });
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Emergency Relay running on port ${PORT}`);
});