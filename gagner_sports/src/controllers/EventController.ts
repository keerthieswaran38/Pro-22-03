import { Request, Response } from 'express';
import Event from '../models/Event';
import Audit from '../models/Audit';

export const getEvents = async (req: Request, res: Response) => {
  try {
    const events = await Event.find();
    // Return Object format {slug: data} for compatibility with frontend if needed
    const obj: Record<string, any> = {};
    events.forEach((e) => (obj[e.slug] = e));
    res.json(obj);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const batchSaveEvents = async (req: Request, res: Response) => {
  try {
    // Ported from PHP/server.cjs logic
    // Usually, we would use bulkWrite for better performance
    const data = req.body;
    const items = Array.isArray(data) ? data : Object.values(data);

    if (items.length > 0) {
      // Wiping and re-inserting based on previous server.cjs logic
      // But let's use upsert logic if prefered
      await Event.deleteMany({});
      await Event.insertMany(items);
      
      // Audit log
      await new Audit({
        action: 'BATCH_SAVE',
        target: 'Events',
        details: `${items.length} events processed/refreshed`
      }).save();
    }
    res.json({ success: true, count: items.length });
  } catch (error: any) {
    console.error('BATCH ERROR:', error.message);
    res.status(500).json({ error: error.message });
  }
};

export const updateEvent = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const updated = await Event.findOneAndUpdate({ slug }, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: 'Event not found' });
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
