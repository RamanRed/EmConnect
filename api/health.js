export default function handler(req, res) {
  res.status(200).json({
    system: "Emergency Relay",
    status: "running"
  });
}