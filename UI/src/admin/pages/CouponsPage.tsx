import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Switch, Tag, Space, Typography, Card, message, Popconfirm, Progress, Skeleton, DatePicker, Select, Row, Col } from 'antd';
import { GiftOutlined, PlusOutlined, EditOutlined, DeleteOutlined, CopyOutlined, GlobalOutlined } from '@ant-design/icons';
import { Coupon, getCoupons, saveCoupons, getEvents } from '../../shared/utils/storage';
import { logAction } from '../../shared/utils/auditLog';
import { couponSchema, zodToFieldErrors } from '../../shared/utils/schemas';
import { COLOR_PRIMARY, COLOR_SUCCESS, getPalette } from '../../shared/theme';
import { useThemeMode } from '../App';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const PREFIXES = ['EARLYBIRD', 'GAGNER', 'MARATHON', 'SPRINT', 'RUNNER', 'FAST', 'CHAMPION', 'RACE'];

export default function CouponsPage() {
  const { mode } = useThemeMode();
  const pal = getPalette(mode);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form] = Form.useForm();
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => { setTimeout(() => { setCoupons(getCoupons()); setLoading(false); }, 200); }, []);
  const refresh = () => setCoupons(getCoupons());

  const activeEvents = React.useMemo(() => {
    return Object.entries(getEvents())
      .filter(([_, ev]) => !ev.isDraft)
      .map(([slug, ev]) => ({ label: ev.title, value: slug }));
  }, []);

  const openAdd = () => {
    setEditingId(null); setFormErrors({});
    form.setFieldsValue({ discountPercent: 10, maxUses: 100, active: true, eventId: 'ALL' });
    setModalOpen(true);
    setTimeout(() => form.resetFields(), 0);
  };

  const openEdit = (c: Coupon) => {
    setEditingId(c.id); setFormErrors({});
    form.setFieldsValue({ 
      code: c.code, 
      discountPercent: c.discountPercent, 
      maxUses: c.maxUses, 
      expiryDate: c.expiryDate ? dayjs(c.expiryDate) : null, 
      active: c.active,
      eventId: c.eventId || 'ALL'
    });
    setModalOpen(true);
  };

  const handleSave = () => {
    const rawForm = form.getFieldsValue();
    const values = { 
      ...rawForm, 
      code: (rawForm.code || '').toUpperCase(),
      expiryDate: rawForm.expiryDate ? rawForm.expiryDate.format('YYYY-MM-DD') : ''
    };
    const parsed = couponSchema.safeParse(values);
    if (!parsed.success) { setFormErrors(zodToFieldErrors(parsed.error)); message.error('Fix highlighted errors'); return; }
    setFormErrors({});
    const val = parsed.data;

    // Optimistic
    if (editingId) {
      setCoupons(prev => prev.map(c => c.id === editingId ? { ...c, ...val } : c));
    } else {
      const newC: Coupon = { 
        id: 'c' + Date.now().toString(36), 
        usedCount: 0, 
        createdAt: new Date().toISOString().slice(0, 10),
        ...val 
      };
      setCoupons(prev => [...prev, newC]);
    }
    setModalOpen(false);

    try {
      const all = getCoupons();
      if (editingId) {
        const idx = all.findIndex(c => c.id === editingId);
        if (idx >= 0) { all[idx] = { ...all[idx], ...val }; logAction('COUPON_UPDATED', val.code, `${val.discountPercent}% off`); }
      } else {
        const newC: Coupon = { 
          id: 'c' + Date.now().toString(36), 
          usedCount: 0, 
          createdAt: new Date().toISOString().slice(0, 10),
          ...val
        };
        all.push(newC);
        logAction('COUPON_CREATED', val.code, `${val.discountPercent}%, max ${val.maxUses === -1 ? '∞' : val.maxUses}`);
      }
      saveCoupons(all);
      message.success(editingId ? 'Coupon updated' : 'Coupon created');
      refresh(); // sync from source
    } catch { refresh(); message.error('Save failed — rolled back'); }
  };

  const handleDelete = (id: string) => {
    const c = coupons.find(x => x.id === id);
    setCoupons(prev => prev.filter(x => x.id !== id)); // optimistic
    try {
      saveCoupons(getCoupons().filter(x => x.id !== id));
      logAction('COUPON_DELETED', c?.code || id, '');
      message.success('Coupon deleted');
    } catch { refresh(); message.error('Delete failed'); }
  };

  const toggleActive = (id: string, active: boolean) => {
    setCoupons(prev => prev.map(c => c.id === id ? { ...c, active } : c)); // optimistic
    try {
      const all = getCoupons();
      const idx = all.findIndex(c => c.id === id);
      if (idx >= 0) { all[idx].active = active; saveCoupons(all); logAction('COUPON_TOGGLED', all[idx].code, active ? 'Activated' : 'Deactivated'); }
    } catch { refresh(); }
  };

  const copyCode = (code: string) => { navigator.clipboard.writeText(code); message.success(`Copied: ${code}`); };

  const columns: any[] = [
    {
      title: 'CODE', dataIndex: 'code', key: 'code',
      render: (text: string, r: Coupon) => (
        <Space direction="vertical" size={0}>
          <Space>
            <span style={{ fontWeight: 800, letterSpacing: '1px', fontSize: '0.95rem', color: COLOR_PRIMARY }}>{text}</span>
            <Button type="text" icon={<CopyOutlined />} size="small" onClick={() => copyCode(text)} style={{ color: pal.textMuted }} />
          </Space>
          <span style={{ fontSize: '0.65rem', color: pal.textMuted }}>{r.eventId === 'ALL' ? 'Applied: Global' : `Event: ${r.eventId}`}</span>
        </Space>
      ),
    },
    {
      title: 'DISCOUNT', dataIndex: 'discountPercent', key: 'discountPercent', width: 100,
      render: (val: number) => <Tag className="tag-fitness" style={{ borderRadius: 4, fontSize: '0.8rem', fontWeight: 800 }}>{val}% OFF</Tag>,
    },
    {
      title: 'USAGE', key: 'usage', width: 160,
      render: (_: any, record: Coupon) => {
        if (record.maxUses === -1) {
          return (
            <div>
              <Progress percent={100} size="small" strokeColor={COLOR_SUCCESS} trailColor="rgba(128,128,128,0.1)" showInfo={false} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                 <span style={{ fontSize: '0.7rem', color: pal.textMuted }}>{record.usedCount} used</span>
                 <Tag color="processing" style={{ fontSize: '0.6rem', fontWeight: 800, margin: 0 }}>UNLIMITED</Tag>
              </div>
            </div>
          );
        }
        const pct = Math.round((record.usedCount / record.maxUses) * 100);
        const exhausted = record.usedCount >= record.maxUses;
        return (
          <div>
            <Progress percent={pct} size="small" strokeColor={exhausted ? '#ef4444' : pct > 80 ? '#f59e0b' : COLOR_SUCCESS} trailColor="rgba(128,128,128,0.1)" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
               <span style={{ fontSize: '0.7rem', color: pal.textMuted }}>{record.usedCount}/{record.maxUses}</span>
               {exhausted && <Tag color="error" style={{ fontSize: '0.6rem', fontWeight: 900, margin: 0 }}>EXHAUSTED</Tag>}
            </div>
          </div>
        );
      },
    },
    {
      title: 'EXPIRY', dataIndex: 'expiryDate', key: 'expiryDate', width: 130,
      render: (text: string) => {
        const isPast = dayjs(text).isBefore(dayjs(), 'day');
        return (
          <Space direction="vertical" size={2}>
            <span style={{ color: isPast ? '#ef4444' : pal.textDim, fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.5px' }}>{text}</span>
            {isPast && <Tag color="error" style={{ fontSize: '0.6rem', fontWeight: 900, borderRadius: 4 }}>EXPIRED</Tag>}
          </Space>
        );
      },
    },
    { title: 'STATUS', key: 'active', width: 80, render: (_: any, r: Coupon) => <Switch checked={r.active} onChange={(v) => toggleActive(r.id, v)} size="small" /> },
    {
      title: 'ACTIONS', key: 'actions', width: 100,
      render: (_: any, r: Coupon) => (
        <Space size={4}>
          <Button icon={<EditOutlined />} size="small" onClick={() => openEdit(r)} style={{ color: '#3b82f6', borderColor: 'rgba(59,130,246,0.3)', background: 'rgba(59,130,246,0.08)' }} />
          <Popconfirm title="Delete?" onConfirm={() => handleDelete(r.id)} okText="Delete" okButtonProps={{ danger: true }}>
            <Button icon={<DeleteOutlined />} size="small" style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)' }} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const labelStyle = { fontWeight: 700, letterSpacing: '1px', fontSize: '0.7rem', color: pal.textDim } as React.CSSProperties;

  if (loading) return <Skeleton active paragraph={{ rows: 8 }} />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Title level={3} style={{ margin: 0, fontWeight: 900 }}>
            <GiftOutlined style={{ color: COLOR_PRIMARY, marginRight: 10 }} />Coupon Scarcity Engine
          </Title>
          <Text style={{ color: pal.textDim, fontSize: '0.85rem' }}>{coupons.filter(c => c.active).length} active coupons</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openAdd} className="btn-brand-gradient"
          style={{ height: 40, fontWeight: 700, letterSpacing: '0.5px', paddingInline: 20 }}>CREATE COUPON</Button>
      </div>

      <Card bodyStyle={{ padding: 0 }} style={{ background: pal.card, border: 'none', borderRadius: 12, overflow: 'hidden' }}>
        <Table dataSource={coupons} columns={columns} rowKey="id" pagination={{ pageSize: 10 }} scroll={{ x: 700 }} />
      </Card>

      <Modal title={editingId ? 'EDIT COUPON' : 'CREATE COUPON'} open={modalOpen} onCancel={() => setModalOpen(false)} onOk={handleSave}
        okText="SAVE" okButtonProps={{ className: 'btn-brand-gradient', style: { fontWeight: 700 } }}
        cancelButtonProps={{ style: { borderColor: pal.border, color: pal.textDim } }} destroyOnHidden>
        <Form form={form} layout="vertical" size="large" autoComplete="off">
          <Form.Item name="code" label={<span style={labelStyle}>CODE</span>}
            validateStatus={formErrors.code ? 'error' : ''} help={formErrors.code && <span className="field-error">{formErrors.code}</span>}>
            <Input 
              placeholder="EARLYBIRD20" 
              onChange={e => form.setFieldsValue({ code: e.target.value.toUpperCase() })}
              style={{ background: pal.inputBg, borderColor: pal.border, fontWeight: 700, letterSpacing: '1px' }} 
            />
          </Form.Item>

          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item name="discountPercent" label={<span style={labelStyle}>DISCOUNT %</span>} style={{ flex: 1 }}
              validateStatus={formErrors.discountPercent ? 'error' : ''} help={formErrors.discountPercent && <span className="field-error">{formErrors.discountPercent}</span>}>
              <InputNumber min={1} max={100} style={{ width: '100%', background: pal.inputBg, borderColor: pal.border }} />
            </Form.Item>
            
            <Form.Item label={<span style={labelStyle}>MAX USES</span>} style={{ flex: 1 }}>
              <Space.Compact style={{ width: '100%' }}>
                <Form.Item name="maxUses" noStyle
                  validateStatus={formErrors.maxUses ? 'error' : ''} help={formErrors.maxUses && <span className="field-error">{formErrors.maxUses}</span>}>
                  <InputNumber 
                    min={-1} 
                    controls={false}
                    disabled={form.getFieldValue('usageType') === 'unlimited'}
                    style={{ width: '70%', background: pal.inputBg, borderColor: pal.border }} 
                  />
                </Form.Item>
                <Form.Item name="usageType" noStyle initialValue="limited">
                  <Select 
                    style={{ width: '30%' }}
                    onChange={v => {
                      if (v === 'unlimited') form.setFieldsValue({ maxUses: -1 });
                      else if (form.getFieldValue('maxUses') === -1) form.setFieldsValue({ maxUses: 100 });
                    }}
                    options={[
                      { label: 'Qty', value: 'limited' },
                      { label: '∞', value: 'unlimited' }
                    ]}
                  />
                </Form.Item>
              </Space.Compact>
            </Form.Item>
          </div>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="expiryDate" label={<span style={labelStyle}>EXPIRY DATE</span>}
                validateStatus={formErrors.expiryDate ? 'error' : ''} help={formErrors.expiryDate && <span className="field-error">{formErrors.expiryDate}</span>}>
                <DatePicker format="YYYY-MM-DD" style={{ width: '100%', background: pal.inputBg, borderColor: pal.border }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="eventId" label={<span style={labelStyle}>APPLY TO EVENT</span>}>
                <Select
                  options={[
                    ...activeEvents,
                    { label: 'All Events (Global)', value: 'ALL' }
                  ]}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="active" label={<span style={labelStyle}>STATUS</span>} valuePropName="checked">
            <Switch checkedChildren="ACTIVE" unCheckedChildren="INACTIVE" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
