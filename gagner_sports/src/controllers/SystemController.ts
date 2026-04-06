import { Request, Response } from 'express';
import Audit from '../models/Audit';
import Leaderboard from '../models/Leaderboard';
import Event from '../models/Event';

// --- Audit ---
export const getAuditLogs = async (_req: Request, res: Response) => {
  try {
    const list = await Audit.find().sort({ timestamp: -1 }).limit(200);
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const clearAuditLogs = async (_req: Request, res: Response) => {
  try {
    await Audit.deleteMany({});
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// --- Leaderboard ---
export const getLeaderboard = async (_req: Request, res: Response) => {
  try {
    const lb = await Leaderboard.find();
    const obj: Record<string, any[]> = {};
    lb.forEach((x) => (obj[x.eventSlug] = x.winners));
    res.json(obj);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateLeaderboard = async (req: Request, res: Response) => {
  try {
    const { eventSlug, winners } = req.body;
    const event = await Event.findOne({ slug: eventSlug });
    let expireAt = null;

    if (event && event.date) {
      const eventDate = new Date(event.date);
      eventDate.setDate(eventDate.getDate() + 30);
      expireAt = eventDate;
    } else {
      const fallbackDate = new Date();
      fallbackDate.setDate(fallbackDate.getDate() + 30);
      expireAt = fallbackDate;
    }

    await Leaderboard.findOneAndUpdate(
      { eventSlug },
      { winners, expireAt },
      { upsert: true, new: true }
    );
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteLeaderboardEntry = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    await Leaderboard.deleteOne({ eventSlug: slug });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
