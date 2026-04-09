import { Request, Response } from 'express';
import Participant from '../models/Participant';

export const getParticipants = async (_req: Request, res: Response) => {
  try {
    // Only return confirmed (Success/Paid) CCAvenue payments — filter Pending & Failed
    const list = await Participant.find({
      paymentStatus: { $in: ['Success', 'Paid'] }
    }).sort({ registeredAt: -1 });
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createParticipant = async (req: Request, res: Response) => {
  try {
    const p = new Participant(req.body);
    await p.save();
    res.status(201).json({ success: true, id: p._id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const batchParticipantUpdate = async (req: Request, res: Response) => {
  try {
    const data = Array.isArray(req.body) ? req.body : [req.body];
    const results = [];
    if (data.length > 0) {
      for (const p of data) {
        const update = await Participant.updateOne(
          { orderId: p.orderId, email: p.email, category: p.category },
          { $set: { ...p, registeredAt: p.registeredAt || new Date().toISOString() } },
          { upsert: true }
        );
        results.push(update);
      }
    }
    res.json({ success: true, processed: data.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
