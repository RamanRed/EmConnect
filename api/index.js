const express = require("express");

const app = express();

app.use(express.json({ limit: "50kb" }));

// Temporary in-memory storage
const messages = new Map();

const emergencyNames = {
    1: "Medical",
    2: "Fire",
    3: "Police",
    4: "Accident",
    5: "Trapped",
    6: "Missing Person",
    7: "General SOS"
};

const locationNames = {
    0: "Unknown",
    1: "Origin",
    2: "Relay Approximate"
};


// --------------------------------------------------
// Health
// --------------------------------------------------

app.get("/health", (req, res) => {
    res.json({
        system: "Emergency Relay",
        status: "running",
        cached_messages: messages.size
    });
});


// --------------------------------------------------
// Receive emergency
// --------------------------------------------------

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

        emergency_name:
            emergencyNames[message.emergency_code] ||
            "Unknown",

        location_name:
            locationNames[message.location_source] ||
            "Unknown",

        received_at: Date.now()
    };

    messages.set(
        message.message_id,
        storedMessage
    );

    console.log(
        "Emergency received:",
        message.message_id
    );

    return res.status(200).json({
        status: "received",
        message_id: message.message_id
    });
});


// --------------------------------------------------
// Get all emergencies
// --------------------------------------------------

app.get("/messages", (req, res) => {

    const allMessages =
        Array.from(messages.values()).reverse();

    res.json({
        count: allMessages.length,
        messages: allMessages
    });
});


// --------------------------------------------------
// Get individual emergency
// --------------------------------------------------

app.get("/messages/:messageId", (req, res) => {

    const message =
        messages.get(req.params.messageId);

    if (!message) {
        return res.status(404).json({
            status: "error",
            message: "Message not found"
        });
    }

    res.json(message);
});


// --------------------------------------------------
// Vercel serverless export
// --------------------------------------------------

module.exports = app;