import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Switch, Tag, Space, Typography, Card, message, Popconfirm, Progress, Skeleton, DatePicker, Select, Row, Col } from 'antd';
import { GiftOutlined, PlusOutlined, EditOutlined, DeleteOutlined, CopyOutlined, GlobalOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Coupon, getCoupons, saveCoupons, getEvents } from '../../shared/utils/storage';
import { logAction } from '../../shared/utils/auditLog';
import { couponSchema, zodToFieldErrors } from '../../shared/utils/schemas';
import { COLOR_PRIMARY, COLOR_SUCCESS, getPalette } from '../../shared/theme';
import { useThemeMode } from '../App';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

export default function CouponsPage() {
  const { mode } = useThemeMode();
  const pal = getPalette(mode);
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form] = Form.useForm();
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const { data: coupons = [], isLoading } = useQuery({
    queryKey: ['coupons'],
    queryFn: () => getCoupons()
  });

  const { data: eventsObj = {} } = useQuery({
    queryKey: ['events'],
    queryFn: () => getEvents()
  });

  const mutation = useMutation({
    mutationFn: (newCoupons: Coupon[]) => saveCoupons(newCoupons),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
    }
  });

  const activeEvents = React.useMemo(() => {
    return Object.entries(eventsObj)
      .filter(([_, ev]) => !ev.isDraft)
      .map(([slug, ev]) => ({ label: ev.title, value: slug }));
  }, [eventsObj]);

  const openAdd = () => {
    setEditingId(null); setFormErrors({});
    form.resetFields();
    form.setFieldsValue({ discountPercent: 10, maxUses: 100, active: true, eventId: 'ALL' });
    setModalOpen(true);
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

  const handleSave = async () => {
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

    let updated = [...coupons];
    if (editingId) {
      updated = updated.map(c => c.id === editingId ? { ...c, ...val } : c);
      logAction('COUPON_UPDATED', val.code, `${val.discountPercent}% off`);
    } else {
      const newC: Coupon = { 
        id: 'c' + Date.now().toString(36), 
        usedCount: 0, 
        createdAt: new Date().toISOString().slice(0, 10),
        ...val 
      };
      updated.push(newC);
      logAction('COUPON_CREATED', val.code, `${val.discountPercent}%`);
    }

    try {
      await mutation.mutateAsync(updated);
      message.success(editingId ? 'Coupon updated' : 'Coupon created');
      setModalOpen(false);
    } catch { message.error('Save failed'); }
  };

  const handleDelete = async (id: string) => {
    const updated = coupons.filter(x => x.id !== id);
    try {
      await mutation.mutateAsync(updated);
      message.success('Coupon deleted');
    } catch { message.error('Delete failed'); }
  };

  const toggleActive = async (id: string, active: boolean) => {
    const updated = coupons.map(c => c.id === id ? { ...c, active } : c);
    await mutation.mutateAsync(updated);
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
      render: (val: number) => <Tag color="green" style={{ borderRadius: 4, fontWeight: 800 }}>{val}% OFF</Tag>,
    },
    {
      title: 'USAGE', key: 'usage', width: 160,
      render: (_: any, record: Coupon) => (
        <div>
           <Progress percent={record.maxUses > 0 ? (record.usedCount/record.maxUses)*100 : 0} size="small" />
           <div style={{ fontSize: '0.7rem' }}>{record.usedCount}/{record.maxUses === -1 ? '∞' : record.maxUses}</div>
        </div>
      )
    },
    {
      title: 'EXPIRY', dataIndex: 'expiryDate', key: 'expiryDate', width: 130,
      render: (text: string) => <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{text}</span>
    },
    { title: 'STATUS', key: 'active', width: 80, render: (_: any, r: Coupon) => <Switch checked={r.active} onChange={(v) => toggleActive(r.id, v)} size="small" /> },
    {
      title: 'ACTIONS', key: 'actions', width: 100,
      render: (_: any, r: Coupon) => (
        <Space size={4}>
          <Button icon={<EditOutlined />} onClick={() => openEdit(r)} size="small" />
          <Popconfirm title="Delete?" onConfirm={() => handleDelete(r.id)}><Button icon={<DeleteOutlined />} size="small" danger /></Popconfirm>
        </Space>
      ),
    },
  ];

  if (isLoading) return <Skeleton active />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <Title level={3} style={{ margin: 0 }}>Coupon Scarcity Engine</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>CREATE COUPON</Button>
      </div>
      <Card bodyStyle={{ padding: 0 }} style={{ borderRadius: 12 }}>
        <Table dataSource={coupons} columns={columns} rowKey="id" pagination={{ pageSize: 10 }} />
      </Card>
      <Modal open={modalOpen} onOk={handleSave} onCancel={() => setModalOpen(false)} destroyOnClose>
        <Form form={form} layout="vertical">
          <Form.Item name="code" label="CODE"><Input /></Form.Item>
          <Form.Item name="discountPercent" label="DISCOUNT %"><InputNumber min={1} max={100} style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="maxUses" label="MAX USES"><InputNumber min={-1} style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="expiryDate" label="EXPIRY DATE"><DatePicker style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="eventId" label="APPLY TO EVENT">
            <Select options={[{ label: 'All Events', value: 'ALL' }, ...activeEvents]} />
          </Form.Item>
          <Form.Item name="active" label="ACTIVE" valuePropName="checked"><Switch /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
