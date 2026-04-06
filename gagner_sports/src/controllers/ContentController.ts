import { Request, Response } from 'express';
import Content from '../models/Content';
import Audit from '../models/Audit';

export const getContentByType = async (req: Request, res: Response) => {
  try {
    const { type } = req.params;
    const items = await Content.find({ type }).sort({ order: 1 });
    res.json(items);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createContent = async (req: Request, res: Response) => {
  try {
    const { type } = req.params;
    const item = new Content({ ...req.body, type });
    await item.save();
    
    await new Audit({
      action: 'CREATE',
      target: `DMS/${type}`,
      details: item.title || item._id.toString()
    }).save();

    res.status(201).json(item);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateContent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updated = await Content.findByIdAndUpdate(id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: 'Item not found' });
    
    await new Audit({
      action: 'UPDATE',
      target: `DMS/${updated.type}`,
      details: updated.title || updated._id.toString()
    }).save();

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteContent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await Content.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: 'Item not found' });

    await new Audit({
      action: 'DELETE',
      target: `DMS/${deleted.type}`,
      details: deleted.title || deleted._id.toString()
    }).save();

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Logo upsert specifically
export const upsertLogo = async (req: Request, res: Response) => {
  try {
    const result = await Content.findOneAndUpdate(
      { type: 'logo' },
      { ...req.body, type: 'logo', active: true },
      { upsert: true, new: true }
    );
    await new Audit({
      action: 'UPSERT',
      target: 'DMS/logo',
      details: 'Master brand logo updated'
    }).save();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
