import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, message, Spin, Popconfirm } from 'antd';
import { ArrowLeftOutlined, PlusOutlined, SaveOutlined, DeleteOutlined, EditOutlined, CloseOutlined, CloudUploadOutlined } from '@ant-design/icons';
import { getDMSItems, createDMSItem, updateDMSItem, deleteDMSItem, uploadImage, ContentBlock } from '../../shared/utils/storage';

export default function DMSSponsors() {
  const navigate = useNavigate();
  const [items, setItems] = useState<ContentBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', imageUrl: '', link: '' });
  const [showAdd, setShowAdd] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const editFileRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getDMSItems('sponsor');
      setItems(Array.isArray(data) ? data : []);
    } catch { message.error('Failed to load sponsors'); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadImage(file);
      setForm(f => ({ ...f, imageUrl: url }));
      message.success('Logo uploaded to Cloudinary CDN!');
    } catch (err: any) {
      message.error(err.message || 'Upload failed');
    }
    setUploading(false);
  };

  const handleAdd = async () => {
    if (!form.title) { message.warning('Sponsor name is required'); return; }
    try {
      await createDMSItem('sponsor', {
        title: form.title,
        imageUrl: form.imageUrl,
        link: form.link,
        description: '',
        order: items.length,
        active: true,
      });
      message.success('Sponsor added');
      setForm({ title: '', imageUrl: '', link: '' });
      setShowAdd(false);
      fetchData();
    } catch { message.error('Failed to add'); }
  };

  const handleUpdate = async (id: string) => {
    try {
      await updateDMSItem('sponsor', id, {
        title: form.title,
        imageUrl: form.imageUrl,
        link: form.link,
      });
      message.success('Updated');
      setEditId(null);
      fetchData();
    } catch { message.error('Update failed'); }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDMSItem('sponsor', id);
      message.success('Deleted');
      fetchData();
    } catch { message.error('Delete failed'); }
  };

  const UploadZone = ({ inputRef }: { inputRef: React.RefObject<HTMLInputElement> }) => (
    <div style={{ marginBottom: 8 }}>
      <input
        type="file" ref={inputRef as any} accept="image/jpeg,image/png,image/webp,image/svg+xml,image/gif"
        style={{ display: 'none' }}
        onChange={e => { if (e.target.files?.[0]) handleFileUpload(e.target.files[0]); }}
      />
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
        <Button size="small" icon={<CloudUploadOutlined />} loading={uploading} onClick={() => inputRef.current?.click()}>
          {uploading ? 'Uploading...' : 'Upload Logo'}
        </Button>
        <span style={{ opacity: 0.4, fontSize: '0.75rem' }}>or paste URL</span>
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/dms')} type="text" style={{ fontWeight: 600 }}>
          Back to DMS
        </Button>
        <h2 style={{ margin: 0, fontWeight: 800, fontSize: '1.4rem' }}>⭐ Sponsor Management</h2>
        <div style={{ flex: 1 }} />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setShowAdd(true); setForm({ title: '', imageUrl: '', link: '' }); }}>
          Add Sponsor
        </Button>
      </div>

      {/* Add Form */}
      {showAdd && (
        <div style={{
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 12, padding: 24, marginBottom: 24,
        }}>
          <h4 style={{ marginBottom: 16, fontWeight: 700 }}>Add New Sponsor / Partner</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <Input placeholder="Sponsor Name (e.g. Decathlon)" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            <div>
              <UploadZone inputRef={fileRef} />
              <Input placeholder="Logo Image URL (auto-filled on upload)" value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })} size="small" />
            </div>
          </div>
          <Input placeholder="Website Link (optional)" value={form.link} onChange={e => setForm({ ...form, link: e.target.value })} style={{ marginBottom: 12 }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <Button type="primary" icon={<SaveOutlined />} onClick={handleAdd} disabled={uploading}>Save</Button>
            <Button icon={<CloseOutlined />} onClick={() => setShowAdd(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {loading ? <Spin size="large" /> : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: 16,
        }}>
          {(items || []).map(item => (
            <div key={item._id} style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12, padding: 20, transition: 'all 0.2s',
            }}>
              {/* Logo Preview */}
              <div style={{
                height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 16, background: 'rgba(255,255,255,0.04)', borderRadius: 8,
                overflow: 'hidden',
              }}>
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    loading="lazy"
                    style={{ maxHeight: 60, maxWidth: '90%', objectFit: 'contain' }}
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  <span style={{ fontWeight: 800, fontSize: '1.1rem', opacity: 0.5 }}>{item.title}</span>
                )}
              </div>

              {editId === item._id ? (
                <div>
                  <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} size="small" placeholder="Name" style={{ marginBottom: 6 }} />
                  <UploadZone inputRef={editFileRef} />
                  <Input value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })} size="small" placeholder="Logo URL" style={{ marginBottom: 6 }} />
                  <Input value={form.link} onChange={e => setForm({ ...form, link: e.target.value })} size="small" placeholder="Website" style={{ marginBottom: 6 }} />
                  <div style={{ display: 'flex', gap: 6 }}>
                    <Button size="small" type="primary" icon={<SaveOutlined />} onClick={() => handleUpdate(item._id!)} disabled={uploading}>Save</Button>
                    <Button size="small" icon={<CloseOutlined />} onClick={() => setEditId(null)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{item.title}</div>
                    {item.link && <div style={{ opacity: 0.4, fontSize: '0.75rem', marginTop: 2 }}>🔗 {item.link}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <Button size="small" type="text" icon={<EditOutlined />} onClick={() => { setEditId(item._id!); setForm({ title: item.title, imageUrl: item.imageUrl || '', link: item.link || '' }); }} />
                    <Popconfirm title="Remove sponsor?" onConfirm={() => handleDelete(item._id!)}>
                      <Button size="small" type="text" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                  </div>
                </div>
              )}
            </div>
          ))}

          {items.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 60, opacity: 0.4 }}>
              <p>No sponsors added. Click "Add Sponsor" to populate the partner carousel.</p>
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: 24, padding: '16px 20px', background: 'rgba(67,233,123,0.08)', borderRadius: 10, fontSize: '0.8rem', opacity: 0.7 }}>
        💡 <strong>Tip:</strong> Upload sponsor logos directly — they are stored on Cloudinary CDN. Only the URL is saved in MongoDB.
      </div>
    </div>
  );
}
