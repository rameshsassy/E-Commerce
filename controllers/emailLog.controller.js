import { listEmailLogs } from "../services/emailService.js";

export const getEmailLogs = async (req, res) => {
  try {
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || "50", 10)));
    const skip = Math.max(0, parseInt(req.query.skip || "0", 10));
    const data = await listEmailLogs({
      limit,
      skip,
      templateType: req.query.templateType || undefined,
      status: req.query.status || undefined,
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
