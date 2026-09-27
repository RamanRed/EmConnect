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

function sendJson(res, statusCode, data) {
    res.statusCode = statusCode;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(data));
}

async function readBody(req) {
    return new Promise((resolve, reject) => {
        let body = "";

        req.on("data", chunk => {
            body += chunk;
        });

        req.on("end", () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch (error) {
                reject(error);
            }
        });

        req.on("error", reject);
    });
}

module.exports = async function handler(req, res) {

    const url = new URL(
        req.url,
        `https://${req.headers.host}`
    );

    /*
     * Vercel exposes this function under /api.
     *
     * Depending on routing, req.url may contain:
     *
     * /api/health
     * /api/messages
     *
     * or:
     *
     * /health
     * /messages
     */

    let pathname = url.pathname;

    pathname = pathname.replace(/^\/api/, "");

    if (pathname === "") {
        pathname = "/";
    }


    // --------------------------------------------------
    // Health
    // --------------------------------------------------

    if (
        req.method === "GET" &&
        pathname === "/health"
    ) {

        return sendJson(res, 200, {
            system: "Emergency Relay",
            status: "running",
            cached_messages: messages.size
        });
    }


    // --------------------------------------------------
    // Get all messages
    // --------------------------------------------------

    if (
        req.method === "GET" &&
        pathname === "/messages"
    ) {

        const allMessages =
            Array.from(messages.values()).reverse();

        return sendJson(res, 200, {
            count: allMessages.length,
            messages: allMessages
        });
    }


    // --------------------------------------------------
    // Receive emergency
    // --------------------------------------------------

    if (
        req.method === "POST" &&
        pathname === "/messages"
    ) {

        try {

            const message = await readBody(req);

            if (!message.message_id) {

                return sendJson(res, 400, {
                    status: "error",
                    message: "message_id is required"
                });
            }


            // Duplicate protection
            if (messages.has(message.message_id)) {

                return sendJson(res, 200, {
                    status: "duplicate",
                    message_id: message.message_id
                });
            }


            const storedMessage = {
                ...message,

                emergency_name:
                    emergencyNames[
                    message.emergency_code
                    ] || "Unknown",

                location_name:
                    locationNames[
                    message.location_source
                    ] || "Unknown",

                received_at:
                    Date.now()
            };


            messages.set(
                message.message_id,
                storedMessage
            );


            console.log(
                "Emergency received:",
                message.message_id
            );


            return sendJson(res, 200, {
                status: "received",
                message_id: message.message_id
            });

        } catch (error) {

            return sendJson(res, 400, {
                status: "error",
                message: "Invalid JSON request"
            });
        }
    }


    // --------------------------------------------------
    // Individual message
    // --------------------------------------------------

    if (
        req.method === "GET" &&
        pathname.startsWith("/messages/")
    ) {

        const messageId =
            pathname.substring("/messages/".length);

        const message =
            messages.get(messageId);

        if (!message) {

            return sendJson(res, 404, {
                status: "error",
                message: "Message not found"
            });
        }

        return sendJson(
            res,
            200,
            message
        );
    }


    // --------------------------------------------------
    // Unknown route
    // --------------------------------------------------

    return sendJson(res, 404, {
        status: "error",
        message: "Route not found",
        method: req.method,
        path: pathname
    });
};