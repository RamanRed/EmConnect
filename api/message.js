const messages = new Map();

export default async function handler(req, res) {
  if (req.method === "GET") {
    return res.status(200).json({
      count: messages.size,
      messages: Array.from(messages.values())
    });
  }

  if (req.method === "POST") {
    try {
      const body = req.body;

      if (!body || !body.message_id) {
        return res.status(400).json({
          status: "error",
          message: "message_id is required"
        });
      }

      if (messages.has(body.message_id)) {
        return res.status(200).json({
          status: "duplicate",
          message_id: body.message_id
        });
      }

      messages.set(body.message_id, {
        ...body,
        received_at: Date.now()
      });

      return res.status(200).json({
        status: "received",
        message_id: body.message_id
      });
    } catch (error) {
      return res.status(500).json({
        status: "error",
        message: error.message
      });
    }
  }

  return res.status(405).json({
    status: "error",
    message: "Method not allowed"
  });
}