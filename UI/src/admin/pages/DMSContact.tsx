import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, message, Spin, Popconfirm } from 'antd';
import { ArrowLeftOutlined, PlusOutlined, SaveOutlined, DeleteOutlined, EditOutlined, CloseOutlined } from '@ant-design/icons';
import { getDMSItems, createDMSItem, updateDMSItem, deleteDMSItem, ContentBlock } from '../../shared/utils/storage';

const CONTACT_FIELDS = [
  { key: 'address', label: '📍 Address', placeholder: 'Your office address', icon: '📍' },
  { key: 'phone', label: '📞 Phone Numbers', placeholder: '+91 98405 47782', icon: '📞' },
  { key: 'email', label: '✉️ Email', placeholder: 'info@gagnersports.com', icon: '✉️' },
];

export default function DMSContact() {
  const navigate = useNavigate();
  const [items, setItems] = useState<ContentBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', description: '' });
  const [showAdd, setShowAdd] = useState(false);
  const [addType, setAddType] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getDMSItems('contact');
      setItems(data);
    } catch { message.error('Failed to load contacts'); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleAdd = async () => {
    if (!form.title || !form.description) { message.warning('Both fields are required'); return; }
    try {
      await createDMSItem('contact', {
        title: form.title,
        description: form.description,
        imageUrl: '',
        order: items.length,
        active: true,
      });
      message.success('Contact info added');
      setForm({ title: '', description: '' });
      setShowAdd(false);
      fetchData();
    } catch { message.error('Failed to add'); }
  };

  const handleUpdate = async (id: string) => {
    try {
      await updateDMSItem('contact', id, {
        title: form.title,
        description: form.description,
      });
      message.success('Updated');
      setEditId(null);
      fetchData();
    } catch { message.error('Update failed'); }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDMSItem('contact', id);
      message.success('Deleted');
      fetchData();
    } catch { message.error('Delete failed'); }
  };

  const grouped = {
    address: items.filter(i => i.title.toLowerCase().includes('address')),
    phone: items.filter(i => i.title.toLowerCase().includes('phone')),
    email: items.filter(i => i.title.toLowerCase().includes('email')),
    other: items.filter(i => !['address', 'phone', 'email'].some(k => i.title.toLowerCase().includes(k))),
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/admin/dms')} type="text" style={{ fontWeight: 600 }}>
          Back to DMS
        </Button>
        <h2 style={{ margin: 0, fontWeight: 800, fontSize: '1.4rem' }}>📞 Contact Us Management</h2>
        <div style={{ flex: 1 }} />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setShowAdd(true); setForm({ title: '', description: '' }); }}>
          Add Contact Info
        </Button>
      </div>

      {/* Quick Add Buttons */}
      {showAdd && (
        <div style={{
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 12, padding: 24, marginBottom: 24,
        }}>
          <h4 style={{ marginBottom: 16, fontWeight: 700 }}>Add Contact Information</h4>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {CONTACT_FIELDS.map(f => (
              <Button
                key={f.key}
                type={form.title.toLowerCase().includes(f.key) ? 'primary' : 'default'}
                size="small"
                onClick={() => setForm({ ...form, title: f.label })}
              >
                {f.icon} {f.key.charAt(0).toUpperCase() + f.key.slice(1)}
              </Button>
            ))}
          </div>
          <Input placeholder="Label (e.g. 📍 Address)" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} style={{ marginBottom: 8 }} />
          <Input.TextArea placeholder="Value (e.g. Plot No: 17/18...)" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} style={{ marginBottom: 12 }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <Button type="primary" icon={<SaveOutlined />} onClick={handleAdd}>Save</Button>
            <Button icon={<CloseOutlined />} onClick={() => setShowAdd(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {loading ? <Spin size="large" /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {items.map(item => (
            <div key={item._id} style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12, padding: '16px 20px',
              display: 'flex', alignItems: 'center', gap: 16,
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 10,
                background: 'linear-gradient(135deg, #4facfe, #00f2fe)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, flexShrink: 0,
              }}>
                {item.title.toLowerCase().includes('address') ? '📍' :
                 item.title.toLowerCase().includes('phone') ? '📞' :
                 item.title.toLowerCase().includes('email') ? '✉️' : '📋'}
              </div>

              {editId === item._id ? (
                <div style={{ flex: 1 }}>
                  <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} size="small" style={{ marginBottom: 6 }} />
                  <Input.TextArea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} size="small" style={{ marginBottom: 6 }} />
                  <div style={{ display: 'flex', gap: 6 }}>
                    <Button size="small" type="primary" icon={<SaveOutlined />} onClick={() => handleUpdate(item._id!)}>Save</Button>
                    <Button size="small" icon={<CloseOutlined />} onClick={() => setEditId(null)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 2 }}>{item.title}</div>
                    <div style={{ opacity: 0.6, fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>{item.description}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <Button size="small" type="text" icon={<EditOutlined />} onClick={() => { setEditId(item._id!); setForm({ title: item.title, description: item.description }); }} />
                    <Popconfirm title="Delete?" onConfirm={() => handleDelete(item._id!)}>
                      <Button size="small" type="text" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                  </div>
                </>
              )}
            </div>
          ))}

          {items.length === 0 && (
            <div style={{ textAlign: 'center', padding: 60, opacity: 0.4 }}>
              <p>No contact information added. Use quick-add buttons above to set Address, Phone, and Email.</p>
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: 24, padding: '16px 20px', background: 'rgba(79,172,254,0.08)', borderRadius: 10, fontSize: '0.8rem', opacity: 0.7 }}>
        💡 <strong>Tip:</strong> Changes here instantly update the Footer "Contact Us" section on the user website. Use labels like "📍 Address", "📞 Phone", "✉️ Email" for auto-categorization.
      </div>
    </div>
  );
}
