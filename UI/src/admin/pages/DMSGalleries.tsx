import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, message, Popconfirm, Spin } from 'antd';
import { ArrowLeftOutlined, PlusOutlined, DeleteOutlined, EditOutlined, SaveOutlined, CloseOutlined, FileImageOutlined, CloudUploadOutlined } from '@ant-design/icons';
import { getDMSItems, createDMSItem, updateDMSItem, deleteDMSItem, uploadImage, ContentBlock } from '../../shared/utils/storage';

export default function DMSGalleries() {
  const navigate = useNavigate();
  const [items, setItems] = useState<ContentBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', imageUrl: '', description: '' });
  const [showAdd, setShowAdd] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const editFileRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getDMSItems('gallery');
      setItems(Array.isArray(data) ? data : []);
    } catch { message.error('Failed to load galleries'); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleFileUpload = async (file: File, target: 'add' | 'edit') => {
    setUploading(true);
    try {
      const url = await uploadImage(file);
      setForm(f => ({ ...f, imageUrl: url }));
      message.success('Image uploaded to Cloudinary CDN!');
    } catch (err: any) {
      message.error(err.message || 'Upload failed. Check Cloudinary config.');
    }
    setUploading(false);
  };

  const handleAdd = async () => {
    if (!form.imageUrl) { message.warning('Image is required — upload a file or paste a URL'); return; }
    try {
      await createDMSItem('gallery', {
        title: form.title,
        imageUrl: form.imageUrl,
        description: form.description,
        order: items.length,
        active: true,
      });
      message.success('Gallery image added');
      setForm({ title: '', imageUrl: '', description: '' });
      setShowAdd(false);
      fetchData();
    } catch { message.error('Failed to add'); }
  };

  const handleUpdate = async (id: string) => {
    try {
      await updateDMSItem('gallery', id, {
        title: form.title,
        imageUrl: form.imageUrl,
        description: form.description,
      });
      message.success('Updated successfully');
      setEditId(null);
      fetchData();
    } catch { message.error('Update failed'); }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDMSItem('gallery', id);
      message.success('Deleted');
      fetchData();
    } catch { message.error('Delete failed'); }
  };

  const startEdit = (item: ContentBlock) => {
    setEditId(item._id!);
    setForm({ title: item.title, imageUrl: item.imageUrl, description: item.description || '' });
  };

  const UploadZone = ({ inputRef, target }: { inputRef: React.RefObject<HTMLInputElement>, target: 'add' | 'edit' }) => (
    <div style={{ marginBottom: 12 }}>
      <input
        type="file" ref={inputRef as any} accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
        style={{ display: 'none' }}
        onChange={e => { if (e.target.files?.[0]) handleFileUpload(e.target.files[0], target); }}
      />
      <div style={{
        display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8,
      }}>
        <Button icon={<CloudUploadOutlined />} loading={uploading} onClick={() => inputRef.current?.click()}
          style={{ fontWeight: 600 }}>
          {uploading ? 'Uploading...' : 'Upload Image'}
        </Button>
        <span style={{ opacity: 0.4, fontSize: '0.8rem' }}>or paste URL below</span>
      </div>
      <Input placeholder="Image URL (auto-filled on upload)" value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })} />
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/dms')} type="text" style={{ fontWeight: 600 }}>
          Back to DMS
        </Button>
        <h2 style={{ margin: 0, fontWeight: 800, fontSize: '1.4rem' }}>📸 Gallery Management</h2>
        <div style={{ flex: 1 }} />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setShowAdd(true); setForm({ title: '', imageUrl: '', description: '' }); }}>
          Add Image
        </Button>
      </div>

      {/* Add Form */}
      {showAdd && (
        <div style={{
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 12, padding: 24, marginBottom: 24,
        }}>
          <h4 style={{ marginBottom: 16, fontWeight: 700 }}>Add New Gallery Image</h4>
          <Input placeholder="Title / Overlay Text (Bold White)" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} style={{ marginBottom: 12 }} />
          <UploadZone inputRef={fileRef} target="add" />
          <div style={{ display: 'flex', gap: 8 }}>
            <Button type="primary" icon={<SaveOutlined />} onClick={handleAdd} disabled={uploading}>Save</Button>
            <Button icon={<CloseOutlined />} onClick={() => setShowAdd(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {loading ? <Spin size="large" /> : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 20,
        }}>
          {(items || []).map(item => (
            <div key={item._id} style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12, overflow: 'hidden', transition: 'all 0.2s',
            }}>
              {/* Image Preview */}
              <div style={{ height: 180, overflow: 'hidden', position: 'relative' }}>
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  loading="lazy"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', maxWidth: '100%' }}
                  onError={e => { (e.target as HTMLImageElement).src = 'https://placehold.co/400x300/1a1a2e/ffffff?text=No+Image'; }}
                />
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  padding: '12px 16px',
                  background: 'linear-gradient(transparent, rgba(0,0,0,0.85))',
                  color: '#fff', fontWeight: 700, fontSize: '0.95rem',
                }}>
                  {item.title || 'Untitled'}
                </div>
              </div>

              {/* Edit Mode */}
              {editId === item._id ? (
                <div style={{ padding: 16 }}>
                  <Input placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} style={{ marginBottom: 8 }} />
                  <UploadZone inputRef={editFileRef} target="edit" />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button size="small" type="primary" icon={<SaveOutlined />} onClick={() => handleUpdate(item._id!)} disabled={uploading}>Save</Button>
                    <Button size="small" icon={<CloseOutlined />} onClick={() => setEditId(null)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ opacity: 0.5, fontSize: '0.8rem' }}>Order: {item.order}</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <Button size="small" type="text" icon={<EditOutlined />} onClick={() => startEdit(item)} />
                    <Popconfirm title="Delete this image?" onConfirm={() => handleDelete(item._id!)} okText="Yes" cancelText="No">
                      <Button size="small" type="text" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                  </div>
                </div>
              )}
            </div>
          ))}

          {items.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 60, opacity: 0.4 }}>
              <FileImageOutlined style={{ fontSize: 48, marginBottom: 16 }} />
              <p>No gallery images yet. Click "Add Image" to get started.</p>
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: 24, padding: '16px 20px', background: 'rgba(102,126,234,0.08)', borderRadius: 10, fontSize: '0.8rem', opacity: 0.7 }}>
        💡 <strong>Tip:</strong> Upload images directly — they are stored on Cloudinary CDN for fast global delivery. Only the URL is saved in MongoDB.
      </div>
    </div>
  );
}
