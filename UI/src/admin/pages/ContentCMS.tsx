import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, Switch, Tag, Space, Typography, Card, message, Popconfirm, Image, Skeleton } from 'antd';
import { FileImageOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { ContentBlock, getContent, saveContent } from '../../shared/utils/storage';
import { logAction } from '../../shared/utils/auditLog';
import { contentSchema, zodToFieldErrors } from '../../shared/utils/schemas';
import { COLOR_PRIMARY, getPalette } from '../../shared/theme';
import { useThemeMode } from '../App';

const { Title, Text } = Typography;
const TYPE_COLORS: Record<string, string> = { image: 'tag-marathon', logo: 'tag-fitness', sponsor: 'tag-family', content: 'tag-kids' };
const TYPE_LABELS: Record<string, string> = { image: 'IMAGE', logo: 'LOGO', sponsor: 'SPONSOR', content: 'CONTENT' };

export default function ContentCMS() {
  const { mode } = useThemeMode();
  const pal = getPalette(mode);
  const [content, setContent] = useState<ContentBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form] = Form.useForm();
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [typeFilter, setTypeFilter] = useState('');
  const [searchText, setSearchText] = useState('');

  useEffect(() => { setTimeout(() => { setContent(getContent()); setLoading(false); }, 200); }, []);
  const refresh = () => setContent(getContent());
  const filtered = content.filter(c => {
    if (typeFilter && c.type !== typeFilter) return false;
    if (searchText) {
      const q = searchText.toLowerCase();
      return c.title.toLowerCase().includes(q) || (c.description || '').toLowerCase().includes(q);
    }
    return true;
  });

  const openAdd = () => {
    setEditingId(null); setFormErrors({});
    form.setFieldsValue({ type: 'image', order: content.length + 1, active: true });
    setModalOpen(true);
    setTimeout(() => form.resetFields(), 0);
  };

  const openEdit = (item: ContentBlock) => {
    setEditingId(item.id); setFormErrors({});
    form.setFieldsValue({ type: item.type, title: item.title, imageUrl: item.imageUrl, description: item.description, order: item.order, active: item.active });
    setModalOpen(true);
  };

  const handleSave = () => {
    const raw = form.getFieldsValue();
    const parsed = contentSchema.safeParse({ ...raw, order: Number(raw.order) || 1 });
    if (!parsed.success) { setFormErrors(zodToFieldErrors(parsed.error)); message.error('Fix highlighted errors'); return; }
    setFormErrors({});
    const val = parsed.data;

    // Optimistic update
    if (editingId) {
      setContent(prev => prev.map(c => c.id === editingId ? { ...c, ...val } as ContentBlock : c));
    } else {
      const newItem: ContentBlock = { id: 'cnt' + Date.now().toString(36), ...val } as ContentBlock;
      setContent(prev => [...prev, newItem]);
    }
    setModalOpen(false);

    try {
      const all = getContent();
      if (editingId) {
        const idx = all.findIndex(c => c.id === editingId);
        if (idx >= 0) { all[idx] = { ...all[idx], ...val } as ContentBlock; logAction('CONTENT_UPDATED', val.title, `Type: ${val.type}`); }
      } else {
        all.push({ id: 'cnt' + Date.now().toString(36), ...val } as ContentBlock);
        logAction('CONTENT_CREATED', val.title, `Type: ${val.type}`);
      }
      saveContent(all);
      message.success(editingId ? 'Content updated' : 'Content created');
      refresh();
    } catch { refresh(); message.error('Save failed — rolled back'); }
  };

  const handleDelete = (id: string) => {
    const item = content.find(c => c.id === id);
    setContent(prev => prev.filter(c => c.id !== id)); // optimistic
    try {
      saveContent(getContent().filter(c => c.id !== id));
      logAction('CONTENT_DELETED', item?.title || id, '');
      message.success('Content deleted');
    } catch { refresh(); message.error('Delete failed'); }
  };

  const toggleActive = (id: string, active: boolean) => {
    setContent(prev => prev.map(c => c.id === id ? { ...c, active } : c));
    try { const all = getContent(); const idx = all.findIndex(c => c.id === id); if (idx >= 0) { all[idx].active = active; saveContent(all); } } catch { refresh(); }
  };

  const labelStyle = { fontWeight: 700, letterSpacing: '1px', fontSize: '0.7rem', color: pal.textDim } as React.CSSProperties;

  const columns: any[] = [
    {
      title: 'PREVIEW', key: 'preview', width: 70,
      render: (_: any, r: ContentBlock) => r.imageUrl ? (
        <Image src={r.imageUrl} alt={r.title} width={44} height={44} style={{ borderRadius: 8, objectFit: 'cover' }}
          fallback="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDQiIGhlaWdodD0iNDQiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQ0IiBoZWlnaHQ9IjQ0IiBmaWxsPSIjMTExODI3Ii8+PC9zdmc+" />
      ) : <div style={{ width: 44, height: 44, background: pal.card, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FileImageOutlined style={{ color: pal.textMuted }} /></div>,
    },
    {
      title: 'TITLE', dataIndex: 'title', key: 'title',
      render: (text: string, r: ContentBlock) => <div><div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{text}</div><div style={{ fontSize: '0.7rem', color: pal.textMuted }}>{r.description || '—'}</div></div>,
    },
    { title: 'TYPE', dataIndex: 'type', key: 'type', width: 100, render: (type: string) => <Tag className={TYPE_COLORS[type]} style={{ borderRadius: 4, fontSize: '0.7rem' }}>{TYPE_LABELS[type]}</Tag> },
    { title: '#', dataIndex: 'order', key: 'order', width: 50, sorter: (a: ContentBlock, b: ContentBlock) => a.order - b.order, render: (v: number) => <span style={{ fontWeight: 700, color: pal.textDim }}>#{v}</span> },
    { title: 'ON', key: 'active', width: 60, render: (_: any, r: ContentBlock) => <Switch checked={r.active} onChange={(v) => toggleActive(r.id, v)} size="small" /> },
    {
      title: '', key: 'actions', width: 90,
      render: (_: any, r: ContentBlock) => (
        <Space size={4}>
          <Button icon={<EditOutlined />} size="small" onClick={() => openEdit(r)} style={{ color: '#3b82f6', borderColor: 'rgba(59,130,246,0.3)', background: 'rgba(59,130,246,0.08)' }} />
          <Popconfirm title="Delete?" onConfirm={() => handleDelete(r.id)} okText="Delete" okButtonProps={{ danger: true }}>
            <Button icon={<DeleteOutlined />} size="small" style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)' }} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (loading) return <Skeleton active paragraph={{ rows: 8 }} />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Title level={3} style={{ margin: 0, fontWeight: 900 }}><FileImageOutlined style={{ color: COLOR_PRIMARY, marginRight: 10 }} />Content & Asset CMS</Title>
          <Text style={{ color: pal.textDim, fontSize: '0.85rem' }}>{content.length} items</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openAdd} className="btn-brand-gradient"
          style={{ height: 40, fontWeight: 700, letterSpacing: '0.5px', paddingInline: 20 }}>ADD CONTENT</Button>
      </div>

      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }} wrap>
        <Space>
          <Input 
            prefix={<SearchOutlined style={{ color: pal.textMuted }} />} 
            placeholder="Search CMS..." 
            value={searchText} 
            onChange={(e) => setSearchText(e.target.value)} 
            allowClear 
            style={{ width: 250, background: pal.inputBg, borderColor: pal.border }} 
            size="small" 
          />
          <Select placeholder="Filter by type" value={typeFilter || undefined} onChange={(v) => setTypeFilter(v || '')} allowClear style={{ width: 140 }} size="small"
            options={[{ value: 'image', label: 'Images' }, { value: 'logo', label: 'Logos' }, { value: 'sponsor', label: 'Sponsors' }, { value: 'content', label: 'Content' }]} />
        </Space>
      </Space>

      <Card bodyStyle={{ padding: 0 }} style={{ background: pal.card, border: 'none', borderRadius: 12, overflow: 'hidden' }}>
        <Table dataSource={filtered} columns={columns} rowKey="id" pagination={{ pageSize: 10 }} scroll={{ x: 600 }} />
      </Card>

      <Modal title={editingId ? 'EDIT CONTENT' : 'ADD CONTENT'} open={modalOpen} onCancel={() => setModalOpen(false)} onOk={handleSave}
        okText="SAVE" okButtonProps={{ className: 'btn-brand-gradient', style: { fontWeight: 700 } }}
        cancelButtonProps={{ style: { borderColor: pal.border, color: pal.textDim } }} destroyOnHidden>
        <Form form={form} layout="vertical" size="large" autoComplete="off">
          <Form.Item name="type" label={<span style={labelStyle}>TYPE</span>}>
            <Select options={[{ value: 'image', label: 'Image' }, { value: 'logo', label: 'Logo' }, { value: 'sponsor', label: 'Sponsor' }, { value: 'content', label: 'Content Block' }]} />
          </Form.Item>
          <Form.Item name="title" label={<span style={labelStyle}>TITLE</span>}
            validateStatus={formErrors.title ? 'error' : ''} help={formErrors.title && <span className="field-error">{formErrors.title}</span>}>
            <Input placeholder="Hero Banner" style={{ background: pal.inputBg, borderColor: pal.border }} />
          </Form.Item>
          <Form.Item name="imageUrl" label={<span style={labelStyle}>IMAGE URL</span>}>
            <Input placeholder="/src/assets/images/banner.png or https://..." style={{ background: pal.inputBg, borderColor: pal.border }} />
          </Form.Item>
          <Form.Item name="description" label={<span style={labelStyle}>DESCRIPTION</span>}>
            <Input.TextArea rows={2} style={{ background: pal.inputBg, borderColor: pal.border }} />
          </Form.Item>
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item name="order" label={<span style={labelStyle}>ORDER</span>} style={{ flex: 1 }}>
              <Input type="number" min={1} style={{ background: pal.inputBg, borderColor: pal.border }} />
            </Form.Item>
            <Form.Item name="active" label={<span style={labelStyle}>ACTIVE</span>} valuePropName="checked" style={{ flex: 1 }}>
              <Switch checkedChildren="YES" unCheckedChildren="NO" />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
