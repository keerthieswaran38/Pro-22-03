import React, { useState, useEffect, useRef, useCallback, Suspense, lazy } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import {
  Table, Button, Modal, Form, Input, Select, Switch, Tag, Space,
  Typography, Popconfirm, message, Card, Row, Col, Tooltip, Skeleton, Statistic,
  DatePicker, TimePicker, InputNumber
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined,
  CalendarOutlined, UploadOutlined, EyeOutlined, GiftOutlined,
  EnvironmentOutlined, AuditOutlined, TeamOutlined, TrophyOutlined, DownloadOutlined, ThunderboltOutlined, ClockCircleOutlined,
  CheckCircleOutlined, InfoCircleOutlined, ArrowUpOutlined, ArrowDownOutlined,
  FilePdfOutlined, FileExcelOutlined, FileTextOutlined, ReloadOutlined
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { GagnerEvent, getEvents, saveEvents, getCoupons, Coupon } from '../../shared/utils/storage';
import { logAction } from '../../shared/utils/auditLog';
import { eventSchema, zodToFieldErrors } from '../../shared/utils/schemas';
import { COLOR_PRIMARY, getPalette } from '../../shared/theme';
import { useThemeMode } from '../App';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

const { Title, Text } = Typography;
const { TextArea } = Input;

const TAG_COLORS: Record<string, string> = {
  MARATHON: 'tag-marathon', FITNESS: 'tag-fitness', FAMILY: 'tag-family',
  KIDS: 'tag-kids', CORPORATE: 'tag-corporate',
};

const UnbreakableMap = lazy(() => import('../components/UnbreakableMap'));

/* ─── COUNTDOWN ─── */
function useCountdown(targetDate: string) {
  const [remaining, setRemaining] = useState({ d: 0, h: 0, m: 0, s: 0, expired: true });
  useEffect(() => {
    if (!targetDate) { setRemaining({ d: 0, h: 0, m: 0, s: 0, expired: true }); return; }
    const tick = () => {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) { setRemaining({ d: 0, h: 0, m: 0, s: 0, expired: true }); return; }
      setRemaining({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
        expired: false,
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetDate]);
  return remaining;
}

function CountdownDisplay({ targetDate }: { targetDate: string }) {
  const cd = useCountdown(targetDate);
  if (!targetDate) return <span style={{ color: '#6b7280', fontSize: '0.8rem' }}>No deadline set</span>;
  if (cd.expired) return <Tag color="error" style={{ fontSize: '0.7rem' }}>EXPIRED</Tag>;
  return (
    <div className="countdown-display">
      {[
        { val: cd.d, label: 'DAYS' }, { val: cd.h, label: 'HRS' },
        { val: cd.m, label: 'MIN' }, { val: cd.s, label: 'SEC' },
      ].map((u) => (
        <div className="countdown-unit" key={u.label}>
          <div className="countdown-value">{String(u.val).padStart(2, '0')}</div>
          <div className="countdown-label">{u.label}</div>
        </div>
      ))}
    </div>
  );
}



export default function EventsPage() {
  const { mode } = useThemeMode();
  const pal = getPalette(mode);
  const queryClient = useQueryClient();
  const [form] = Form.useForm();

  // Optimistic React Query implementation
  const { data: eventsObj = {}, isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      // 400ms delay to ensure shimmer triggers purely for luxury/UX
      await new Promise(r => setTimeout(r, 400));
      return getEvents();
    }
  });

  const mutation = useMutation({
    mutationFn: async (newEvents: Record<string, GagnerEvent>) => {
      saveEvents(newEvents);
      return newEvents;
    },
    onMutate: async (newEvents) => {
      await queryClient.cancelQueries({ queryKey: ['events'] });
      const previousEvents = queryClient.getQueryData(['events']);
      queryClient.setQueryData(['events'], newEvents);
      return { previousEvents };
    },
    onError: (err, newEvents, context) => {
      if (context?.previousEvents) {
        queryClient.setQueryData(['events'], context.previousEvents);
      }
      message.error('Data flow interrupted. Changes rolled back.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    }
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  

  // CATEGORIES LOGIC
  const [customCats, setCustomCats] = useState<{name: string, price: number}[]>([]);
  const [catNameInput, setCatNameInput] = useState('');
  const [catPriceInput, setCatPriceInput] = useState<number | ''>('');

  // SESSION-ONLY CUSTOM TAGS (never persists to storage)
  const DEFAULT_TAGS = ['MARATHON', 'FITNESS', 'FAMILY', 'KIDS', 'CORPORATE'];
  const [sessionTags, setSessionTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState('');
  const [showCustomTagInput, setShowCustomTagInput] = useState(false);

  // MAP EXTENSION — stable setter for React.memo on MapComponent
  const [mapCoords, setMapCoordsRaw] = useState<{lat: number, lng: number} | null>(null);
  const setMapCoords = useCallback((val: {lat: number, lng: number} | null) => setMapCoordsRaw(val), []);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showDrafts, setShowDrafts] = useState(false);

  const activeEvents = Object.entries(eventsObj).filter(([, ev]) => showDrafts ? true : !ev.isDraft);

  const dataSource = activeEvents
    .filter(([slug, ev]) => {
      if (!searchText) return true;
      const q = searchText.toLowerCase();
      const title = (ev.title || '').toLowerCase();
      const tag = (ev.tag || '').toLowerCase();
      const venue = (ev.venue || '').toLowerCase();
      return title.includes(q) || tag.includes(q) || venue.includes(q) || slug.toLowerCase().includes(q);
    })
    .map(([slug, ev]) => ({ key: slug, slug, ...ev }));

  const openAdd = () => {
    setEditingSlug(null);
    setFormErrors({});
    setCustomCats([]);
    setCatNameInput('');
    setCatPriceInput('');
    setMapCoords(null);
    setSessionTags([]);
    setCustomTagInput('');
    setShowCustomTagInput(false);
    form.setFieldsValue({ tag: 'MARATHON', registrationOpen: true, categories: '[]', deliverables: '', isDraft: false });
    setModalOpen(true);
    setTimeout(() => form.resetFields(), 0);
  };

  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('action') === 'add') {
      openAdd();
      // Clear the param so it doesn't re-open on refresh or navigation
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('action');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const openEdit = (slug: string) => {
    const ev = eventsObj[slug];
    setEditingSlug(slug);
    setFormErrors({});
    // Reset custom tag UI but keep session tags if tag is non-default
    setCustomTagInput('');
    setShowCustomTagInput(false);
    if (ev.tag && !DEFAULT_TAGS.includes(ev.tag)) {
      setSessionTags(prev => prev.includes(ev.tag) ? prev : [...prev, ev.tag]);
    }
    
    setMapCoords(ev.latLng || null);
    
    // Convert dates strictly
    let dateObj = null;
    let timeObj = null;
    let regStartObj = null;
    let regEndObj = null;
    
    if (ev.date) {
      try { dateObj = dayjs(ev.date, 'MMMM DD, YYYY'); } catch(e) {}
    }
    if (ev.time && ev.time.includes(' – ')) {
      try {
        const parts = ev.time.split(' – ');
        timeObj = [dayjs(parts[0], 'h:mm A'), dayjs(parts[1], 'h:mm A')];
      } catch(e) {}
    }
    if (ev.registrationStart) {
      try { regStartObj = dayjs(ev.registrationStart); } catch(e) {}
    }
    if (ev.registrationEnd) {
      try { regEndObj = dayjs(ev.registrationEnd); } catch(e) {}
    }

    let cCats: {name: string, price: number}[] = [];
    if (ev.categories && ev.categories.length > 0) {
      // detect if these are fully custom
      cCats = ev.categories.map(c => ({ name: c.name, price: parseInt(c.price.replace(/\D/g, '') || '0', 10) }));
    }
    
    setCustomCats(cCats);
    setCatNameInput('');
    setCatPriceInput('');

    form.setFieldsValue({
      slug,
      title: ev.title, tag: ev.tag, date: dateObj, time: timeObj,
      venue: ev.venue, desc: ev.desc || '', bgImg: ev.bgImg || '',
      categories: JSON.stringify(ev.categories || [], null, 2),
      deliverables: (ev.deliverables || []).join(', '),
      registrationOpen: ev.registrationOpen ?? true,
      registrationStart: regStartObj,
      registrationEnd: regEndObj,
      rules: ev.rules || '',
      prizes_desc: ev.prizes_desc || '',
      contact_email: ev.contact_email || '',
      contact_phone: ev.contact_phone || '',
      isDraft: ev.isDraft || false,
    });
    setModalOpen(true);
  };

  const saveFormLogic = (forceDraft: boolean) => {
    const raw = form.getFieldsValue(true);
    const payload = { ...raw };
    
    // Auto-slugify if new and untouched
    if (!payload.slug && !editingSlug) {
      payload.slug = `draft-${Date.now()}`;
    }

    // Convert dates
    if (payload.date) payload.date = payload.date.format('MMMM DD, YYYY');
    if (payload.time && payload.time.length === 2 && payload.time[0] && payload.time[1]) {
      payload.time = `${payload.time[0].format('h:mm A')} – ${payload.time[1].format('h:mm A')}`;
    } else {
      payload.time = '';
    }
    if (payload.registrationStart) payload.registrationStart = payload.registrationStart.format('YYYY-MM-DDTHH:mm');
    if (payload.registrationEnd) payload.registrationEnd = payload.registrationEnd.format('YYYY-MM-DDTHH:mm');

    const result = eventSchema.safeParse({
      ...payload,
      slug: editingSlug || payload.slug,
    });

    if (!result.success && !forceDraft) {
      setFormErrors(zodToFieldErrors(result.error));
      message.error('Please fix the highlighted errors');
      return;
    }
    
    setFormErrors({});

    const cats = customCats.length > 0 ? customCats.map(c => ({ name: c.name, price: `₹${c.price}`, details: [] })) : [];

    const val = result.success ? result.data : payload; // If forced auto-draft, preserve raw
    const finalDraftState = forceDraft ? true : (val.isDraft || false);

    const eventData: GagnerEvent = {
      title: val.title || 'Draft Event', 
      tag: val.tag || 'MARATHON', 
      date: val.date || '', 
      time: val.time || '',
      venue: val.venue || '', 
      desc: val.desc || '', 
      bgImg: val.bgImg || '',
      categories: cats,
      deliverables: val.deliverables ? val.deliverables.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
      registrationOpen: val.registrationOpen ?? false,
      registrationStart: val.registrationStart || '',
      registrationEnd: val.registrationEnd || '',
      rules: val.rules || '',
      prizes_desc: val.prizes_desc || '',
      contact_email: val.contact_email || '',
      contact_phone: val.contact_phone || '',
      isDraft: finalDraftState,
      createdAt: editingSlug ? eventsObj[editingSlug].createdAt : new Date().toISOString(),
      latLng: mapCoords ? { lat: mapCoords.lat, lng: mapCoords.lng } : undefined,
    };

    const slug = editingSlug || payload.slug;
    const nextEvents = { ...eventsObj, [slug]: eventData };

    mutation.mutate(nextEvents);
    
    if (!forceDraft) {
      logAction(editingSlug ? 'EVENT_UPDATED' : 'EVENT_CREATED', eventData.title, `Slug: ${slug}`);
      message.success(editingSlug ? 'Event successfully updated' : 'Event securely logged');
      setModalOpen(false);
    }
  };

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  const openView = (slug: string) => {
    const ev = eventsObj[slug];
    if (ev) {
      setSelectedEvent({ ...ev, slug });
      setIsDetailModalOpen(true);
    }
  };

  const handleManualSave = () => {
    saveFormLogic(false);
  };

  const attemptCancel = () => {
    if (form.isFieldsTouched() && (!editingSlug || eventsObj[editingSlug]?.isDraft)) {
       // Persist as draft automatically if it was newly dirty
       saveFormLogic(true);
       message.info('Unsaved alterations safely persisted as a Draft.', 3);
    }
    setModalOpen(false);
  };

  const handleDelete = (slug: string) => {
    const title = eventsObj[slug]?.title || slug;
    const nextEvents = { ...eventsObj };
    delete nextEvents[slug];
    mutation.mutate(nextEvents);
    logAction('EVENT_DELETED', title, `Slug: ${slug}`);
    message.success('Artifact successfully expunged');
  };

  const toggleRegistration = (slug: string, checked: boolean) => {
    const nextEvents = { ...eventsObj };
    if (nextEvents[slug]) {
      nextEvents[slug] = { ...nextEvents[slug], registrationOpen: checked };
      mutation.mutate(nextEvents);
      logAction('REGISTRATION_TOGGLED', nextEvents[slug].title, checked ? 'Gateway Locked Open' : 'Gateway Secured Shut');
      message.success(`Gateway firmly ${checked ? 'locked open' : 'secured shut'}`);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      form.setFieldsValue({ bgImg: url });
      message.success('Local artifact successfully tethered');
    }
  };

  const columns: any[] = [
    {
      title: 'EVENT', dataIndex: 'title', key: 'title',
      render: (text: string, record: any) => (
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
            {text}
          </div>
          <div style={{ fontSize: '0.7rem', color: pal.textMuted }}>{record.slug}</div>
        </div>
      ),
    },
    {
      title: 'TAG', dataIndex: 'tag', key: 'tag', width: 110,
      render: (tag: string) => <Tag className={TAG_COLORS[tag] || 'tag-marathon'} style={{ borderRadius: 4, fontSize: '0.65rem' }}>{tag}</Tag>,
    },
    {
      title: 'DATE', dataIndex: 'date', key: 'date', width: 150,
      render: (text: string) => <span style={{ fontWeight: 500, letterSpacing: '0.5px', fontSize: '0.85rem' }}>{text}</span>,
    },
    {
      title: 'VENUE', dataIndex: 'venue', key: 'venue', ellipsis: true,
      render: (text: string) => <Tooltip title={text}><span style={{ color: pal.textDim, fontSize: '0.85rem' }}>{text}</span></Tooltip>,
    },
    {
      title: 'REG. COUNTDOWN', key: 'countdown', width: 200,
      render: (_: any, record: any) => <CountdownDisplay targetDate={record.registrationEnd} />,
    },
    {
      title: 'STATUS', key: 'registration', width: 110,
      render: (_: any, record: any) => (
        <Switch
          checked={record.registrationOpen}
          onChange={(checked) => toggleRegistration(record.slug, checked)}
          onClick={(_, e) => e.stopPropagation()}
          checkedChildren="OPEN" unCheckedChildren="CLOSED"
          style={{ minWidth: 70 }}
        />
      ),
    },
    {
      title: 'ACTIONS', key: 'actions', width: 100,
      render: (_: any, record: any) => (
        <Space size={4} onClick={(e) => e.stopPropagation()}>
          <Button icon={<EditOutlined />} size="small" onClick={() => openEdit(record.slug)}
            style={{ color: '#3b82f6', borderColor: 'rgba(59,130,246,0.3)', background: 'rgba(59,130,246,0.08)' }} />
          <Popconfirm title="Abolish Event?" description="This action irreversibly destroys the record." onConfirm={() => handleDelete(record.slug)} okText="Delete" okButtonProps={{ danger: true }}>
            <Button icon={<DeleteOutlined />} size="small"
              style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)' }} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const labelStyle = { fontWeight: 700, letterSpacing: '1px', fontSize: '0.7rem', color: pal.textDim } as React.CSSProperties;
  const inputStyle = { background: pal.inputBg, borderColor: pal.border, width: '100%' };

  if (isLoading) return <Skeleton active paragraph={{ rows: 10 }} />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Title level={3} style={{ margin: 0, fontWeight: 900 }}>
            <CalendarOutlined style={{ color: COLOR_PRIMARY, marginRight: 10 }} />Event Command Center
          </Title>
          <Text style={{ color: pal.textDim, fontSize: '0.85rem' }}>
            {activeEvents.length} active events securely logged
          </Text>
        </div>
        <Space wrap>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 8 }}>
            <Text style={{ fontSize: '0.75rem', fontWeight: 700, color: pal.textMuted }}>SHOW DRAFTS</Text>
            <Switch size="small" checked={showDrafts} onChange={setShowDrafts} />
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={openAdd} className="btn-brand-gradient"
            style={{ height: 40, fontWeight: 700, letterSpacing: '0.5px', paddingInline: 20 }}>ADD EVENT</Button>
        </Space>
      </div>

      <Input prefix={<SearchOutlined style={{ color: pal.textMuted }} />} placeholder="Search databases..."
        value={searchText} onChange={(e) => setSearchText(e.target.value)} allowClear autoComplete="off"
        style={{ marginBottom: 16, maxWidth: 360, background: pal.inputBg, borderColor: pal.border, borderRadius: 8, height: 38 }} />

      <Card styles={{ body: { padding: 0 } }} variant="borderless" style={{ background: pal.card, borderRadius: 12, overflow: 'hidden' }}>
        <Table 
          dataSource={dataSource} 
          columns={columns} 
          pagination={{ pageSize: 8, showSizeChanger: true }} 
          scroll={{ x: 900 }}
          onRow={(record) => ({
            onClick: () => openView(record.slug),
          })}
          rowClassName="clickable-event-row"
          locale={{ emptyText: <div style={{ padding: '2rem', textAlign: 'center' }}><Title level={5}>Vacuum Empty</Title><Text style={{ color: pal.textMuted }}>No relevant entities located.</Text></div> }} 
        />
      </Card>
      
      <style>{`
        .clickable-event-row { cursor: pointer; transition: background 0.2s; }
        .clickable-event-row:hover { background: rgba(255, 107, 0, 0.05) !important; }
        .dark-calendar .ant-picker-panel-container { background: #141414; border: 1px solid #303030; }
      `}</style>

      {/* EVENT MODAL */}
      <Modal title={editingSlug ? 'EDIT EVENT' : 'ADD NEW EVENT'} open={modalOpen} onCancel={attemptCancel} onOk={handleManualSave}
        width={800} okText="SUBMIT RECORD" okButtonProps={{ className: 'btn-brand-gradient', style: { fontWeight: 700, letterSpacing: '1px' }, loading: mutation.isPending }}
        cancelButtonProps={{ style: { borderColor: pal.border, color: pal.textDim } }} destroyOnHidden>
        <Form form={form} layout="vertical" size="large" autoComplete="off">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="slug" label={<span style={labelStyle}>EVENT ID (SLUG)</span>}
                validateStatus={formErrors.slug ? 'error' : ''} help={formErrors.slug && <span className="field-error">{formErrors.slug}</span>}>
                <Input placeholder="health-day-run" disabled={!!editingSlug} style={inputStyle} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="tag" label={<span style={labelStyle}>TAG CLASSIFICATION</span>}>
                <Select 
                  options={[
                    ...DEFAULT_TAGS.map(v => ({ value: v, label: v })),
                    ...sessionTags.map(v => ({ value: v, label: v })),
                    { value: '__CUSTOM__', label: 'Custom...' },
                  ]} 
                  style={{width: '100%'}}
                  onChange={(val: string) => {
                    if (val === '__CUSTOM__') {
                      setShowCustomTagInput(true);
                      // Revert selection to previous value so '__CUSTOM__' doesn't stay selected
                      const prev = form.getFieldValue('tag');
                      if (prev !== '__CUSTOM__') form.setFieldsValue({ tag: prev });
                    } else {
                      setShowCustomTagInput(false);
                    }
                  }}
                />
              </Form.Item>
              {showCustomTagInput && (
                <div style={{ display: 'flex', gap: 8, marginTop: -16, marginBottom: 16 }}>
                  <Input 
                    placeholder="Enter custom tag" 
                    value={customTagInput} 
                    onChange={e => setCustomTagInput(e.target.value.toUpperCase())}
                    onPressEnter={() => {
                      if (customTagInput.trim()) {
                        const tag = customTagInput.trim();
                        if (!sessionTags.includes(tag) && !DEFAULT_TAGS.includes(tag)) {
                          setSessionTags(prev => [...prev, tag]);
                        }
                        form.setFieldsValue({ tag });
                        setCustomTagInput('');
                        setShowCustomTagInput(false);
                      }
                    }}
                    style={{...inputStyle, flex: 1}}
                  />
                  <Button 
                    type="primary" 
                    className="btn-brand-gradient"
                    onClick={() => {
                      if (customTagInput.trim()) {
                        const tag = customTagInput.trim();
                        if (!sessionTags.includes(tag) && !DEFAULT_TAGS.includes(tag)) {
                          setSessionTags(prev => [...prev, tag]);
                        }
                        form.setFieldsValue({ tag });
                        setCustomTagInput('');
                        setShowCustomTagInput(false);
                      } else {
                        message.warning('Please enter a tag name.');
                      }
                    }}
                  >
                    Add
                  </Button>
                </div>
              )}
            </Col>
          </Row>

          <Form.Item name="title" label={<span style={labelStyle}>Event Name</span>}
            validateStatus={formErrors.title ? 'error' : ''} help={formErrors.title && <span className="field-error">{formErrors.title}</span>}>
            <Input placeholder="WORLD HEALTH DAY RUN 2026" style={inputStyle} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="date" label={<span style={labelStyle}>Event Date</span>}
                validateStatus={formErrors.date ? 'error' : ''} help={formErrors.date && <span className="field-error">{formErrors.date}</span>}>
                <DatePicker format="MMMM DD, YYYY" style={inputStyle} classNames={{ popup: { root: mode === 'dark' ? 'dark-calendar' : '' } }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="time" label={<span style={labelStyle}>Event Time</span>}
                validateStatus={formErrors.time ? 'error' : ''} help={formErrors.time && <span className="field-error">{formErrors.time}</span>}>
                <TimePicker.RangePicker format="h:mm a" use12Hours style={inputStyle} classNames={{ popup: { root: mode === 'dark' ? 'dark-clock' : '' } }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="venue" label={<span style={labelStyle}>Venue</span>}
            validateStatus={formErrors.venue ? 'error' : ''} help={formErrors.venue && <span className="field-error">{formErrors.venue}</span>}>
            <Input placeholder="Besant Nagar Beach, Chennai" style={inputStyle} />
          </Form.Item>

          <Form.Item label={<span style={labelStyle}>Location</span>}>
            <Suspense fallback={<Skeleton.Button active block style={{ height: 400 }} />}>
              <UnbreakableMap coords={mapCoords} onChange={setMapCoords} pal={pal} mode={mode as any} />
            </Suspense>
          </Form.Item>

          <Form.Item name="desc" label={<span style={labelStyle}>Description</span>}>
            <TextArea rows={5} placeholder="General event description..." style={inputStyle} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="prizes_desc" label={<span style={labelStyle}>Prizes & Eligibility (Optional)</span>}>
                <TextArea rows={4} placeholder="e.g., Trophies for top 3, Cash prizes..." style={inputStyle} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="rules" label={<span style={labelStyle}>Rules & Regulations (Optional)</span>}>
                <TextArea rows={4} placeholder="e.g., No spot registration, Wear chest number..." style={inputStyle} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="contact_email" label={<span style={labelStyle}>Organizer Email (Optional)</span>}
                validateStatus={formErrors.contact_email ? 'error' : ''} help={formErrors.contact_email && <span className="field-error">{formErrors.contact_email}</span>}>
                <Input placeholder="organizer@example.com" style={inputStyle} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="contact_phone" label={<span style={labelStyle}>Organizer Phone (Optional)</span>}>
                <Input placeholder="+91 00000 00000" style={inputStyle} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label={<span style={labelStyle}>Background Image</span>}
            validateStatus={formErrors.bgImg ? 'error' : ''} help={formErrors.bgImg && <span className="field-error">{formErrors.bgImg}</span>}>
            <Space.Compact style={{ width: '100%' }}>
              <Form.Item name="bgImg" noStyle>
                <Input placeholder="/src/assets/images/event.png or https://..." style={inputStyle} />
              </Form.Item>
              <Button icon={<UploadOutlined />} onClick={() => fileInputRef.current?.click()} title="Select internal blob" style={{ height: 40 }} />
            </Space.Compact>
          </Form.Item>
          <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileSelect} accept="image/*,application/pdf" />

          <Row gutter={16} style={{marginBottom: 16}}>
            <Col span={24}>
              <div style={{...labelStyle, marginBottom: 8}}>Categories</div>
              <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
                <Space style={{display: 'flex', width: '100%', alignItems: 'flex-start'}} wrap>
                  <Input placeholder="Category Name (e.g., 5KM Run)" value={catNameInput} 
                    onChange={e => setCatNameInput(e.target.value)} 
                    style={{...inputStyle, width: 250}} />
                  <Input placeholder="Ticket Price (e.g., 500)" value={catPriceInput} 
                    onChange={e => { const val = e.target.value.replace(/\D/g, ''); setCatPriceInput(val ? Number(val) : ''); }} 
                    style={{...inputStyle, width: 220}} />
                  <Button type="primary" className="btn-brand-gradient" icon={<PlusOutlined />} 
                    onClick={() => {
                      if (catNameInput && catPriceInput !== '') {
                        setCustomCats([...customCats, { name: catNameInput, price: Number(catPriceInput) }]);
                        setCatNameInput('');
                        setCatPriceInput('');
                      } else {
                        message.warning('Please enter both a category name and price.');
                      }
                    }}>
                    Add Category
                  </Button>
                </Space>
                
                {customCats.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                    {customCats.map((cat, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: pal.card, borderRadius: 6, border: `1px solid ${pal.border}` }}>
                        <span style={{ fontWeight: 600, color: pal.text }}>{cat.name} <Tag color="green" style={{ marginLeft: 8 }}>₹{cat.price}</Tag></span>
                        <Button danger size="small" icon={<DeleteOutlined />} onClick={() => { const newC = [...customCats]; newC.splice(idx,1); setCustomCats(newC); }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Col>
          </Row>

          <Form.Item name="deliverables" label={<span style={labelStyle}>DELIVERABLES (Optional)</span>}>
            <Input placeholder="T-Shirt, Finisher Medal" style={inputStyle} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="registrationOpen" label={<span style={labelStyle}>Registration Status</span>} valuePropName="checked">
                <Switch checkedChildren="OPEN" unCheckedChildren="CLOSED" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="registrationStart" label={<span style={labelStyle}>Registration Start Date/Time</span>}>
                <DatePicker placeholder="Select Date & Time" showTime={{ format: 'h:mm a', use12Hours: true }} format="YYYY-MM-DD h:mm a" style={inputStyle} classNames={{ popup: { root: mode === 'dark' ? 'dark-calendar' : '' } }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="registrationEnd" label={<span style={labelStyle}>Registration Ends Date/Time</span>}>
                <DatePicker placeholder="Select Date & Time" showTime={{ format: 'h:mm a', use12Hours: true }} format="YYYY-MM-DD h:mm a" style={inputStyle} classNames={{ popup: { root: mode === 'dark' ? 'dark-calendar' : '' } }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="capacity" label={<span style={labelStyle}>Max Capacity</span>}>
                <InputNumber min={1} placeholder="1000" style={inputStyle} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* EVENT VIEW MODAL */}
      <Modal 
        title={<span style={{ letterSpacing: '1px', fontWeight: 900, textTransform: 'uppercase' }}>{selectedEvent?.title}</span>}
        open={isDetailModalOpen} 
        onCancel={() => setIsDetailModalOpen(false)}
        footer={null}
        width={900}
        styles={{ body: { padding: '24px 32px' } }}
        destroyOnHidden
        centered
      >
        {selectedEvent && (() => {
          const allCoupons = getCoupons();
          const applicableCoupons = allCoupons.filter(c => c.active && (c.eventId === selectedEvent.slug || c.eventId === 'ALL'));
          
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
              <Row gutter={40}>
                {/* LEFT: MEDIA & IDENTITY */}
                <Col span={10}>
                  <div style={{ 
                    width: '100%', 
                    aspectRatio: '16/9', 
                    borderRadius: 16, 
                    overflow: 'hidden', 
                    border: `1px solid ${pal.border}`,
                    background: pal.inputBg,
                    marginBottom: 20
                  }}>
                    {selectedEvent.bgImg ? (
                      <img src={selectedEvent.bgImg} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Event" />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: pal.textMuted }}>
                        IMAGE NOT FOUND
                      </div>
                    )}
                  </div>
                  <Space direction="vertical" size={16} style={{ width: '100%' }}>
                    <div>
                      <Tag color={COLOR_PRIMARY} style={{ fontWeight: 800, padding: '4px 12px', fontSize: '0.8rem', borderRadius: 4, marginBottom: 8 }}>{selectedEvent.tag}</Tag>
                      <Title level={4} style={{ margin: 0, fontWeight: 900 }}>{selectedEvent.title}</Title>
                      <Text style={{ color: pal.textMuted, fontSize: '0.85rem' }}>ID: {selectedEvent.slug}</Text>
                    </div>
                    
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px 16px', borderRadius: 12, border: `1px solid ${pal.border}` }}>
                      <div style={labelStyle}>REGISTRATION STATUS</div>
                      <Tag color={selectedEvent.registrationOpen ? 'green' : 'red'} style={{ border: 'none', fontWeight: 800 }}>
                        {selectedEvent.registrationOpen ? 'LOCKED OPEN' : 'SECURED SHUT'}
                      </Tag>
                      <div style={{ marginTop: 8, fontSize: '0.75rem', color: pal.textDim }}>
                        Window: {selectedEvent.registrationStart ? dayjs(selectedEvent.registrationStart).format('MMM D, h:mm A') : 'TBD'} – {selectedEvent.registrationEnd ? dayjs(selectedEvent.registrationEnd).format('MMM D, h:mm A') : 'TBD'}
                      </div>
                    </div>
                  </Space>
                </Col>

                {/* RIGHT: LOGISTICS & CONTACT */}
                <Col span={14}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px 16px', marginBottom: 24 }}>
                    <div>
                      <div style={labelStyle}>DATE</div>
                      <div style={{ color: pal.text, fontWeight: 700, fontSize: '1.05rem' }}>{selectedEvent.date || 'NOT SET'}</div>
                    </div>
                    <div>
                      <div style={labelStyle}>TIME</div>
                      <div style={{ color: pal.text, fontWeight: 700, fontSize: '1.05rem' }}>{selectedEvent.time || 'NOT SET'}</div>
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <div style={labelStyle}>VENUE</div>
                      <div style={{ color: pal.text, fontWeight: 600 }}>{selectedEvent.venue || 'NOT SPECIFIED'}</div>
                      {selectedEvent.latLng && (
                        <Button type="link" size="small" icon={<EnvironmentOutlined />} target="_blank" 
                          href={`https://www.google.com/maps?q=${selectedEvent.latLng.lat},${selectedEvent.latLng.lng}`}
                          style={{ padding: 0, height: 'auto', fontSize: '0.75rem', marginTop: 4 }}>
                          View on Map
                        </Button>
                      )}
                    </div>
                  </div>

                  <div style={{ borderTop: `1px solid ${pal.border}`, paddingTop: 20 }}>
                    <div style={labelStyle}>ORGANIZER CONTACT</div>
                    {selectedEvent.contact_email || selectedEvent.contact_phone ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                        {selectedEvent.contact_email && <Text style={{ fontSize: '0.85rem' }}><AuditOutlined style={{ marginRight: 6, color: COLOR_PRIMARY }} />{selectedEvent.contact_email}</Text>}
                        {selectedEvent.contact_phone && <Text style={{ fontSize: '0.85rem' }}>📞 {selectedEvent.contact_phone}</Text>}
                      </div>
                    ) : <Text style={{ color: pal.textMuted, fontSize: '0.85rem' }}>Not Specified</Text>}
                  </div>

                  <div style={{ marginTop: 24 }}>
                    <div style={labelStyle}>DESCRIPTION</div>
                    <div style={{ color: pal.textDim, fontSize: '0.9rem', lineHeight: 1.6, height: 100, overflowY: 'auto' }} className="custom-scroll">
                      {selectedEvent.desc || 'No descriptive data logged.'}
                    </div>
                  </div>
                </Col>
              </Row>

              {/* TICKETING CATEGORIES */}
              <div style={{ background: 'rgba(255,255,255,0.01)', border: `1px solid ${pal.border}`, borderRadius: 16, padding: '24px' }}>
                <Title level={5} style={{ display: 'flex', alignItems: 'center', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '1px', marginBottom: 20 }}>
                  <AuditOutlined style={{ color: COLOR_PRIMARY, marginRight: 8 }} /> Registration Categories
                </Title>
                {selectedEvent.categories && selectedEvent.categories.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 12 }}>
                    {selectedEvent.categories.map((cat: any, i: number) => (
                      <div key={i} style={{ padding: '12px 16px', background: pal.card, borderRadius: 10, border: `1px solid ${pal.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700 }}>{cat.name}</span>
                        <Tag color="green" style={{ border: 'none', fontWeight: 900 }}>{cat.price}</Tag>
                      </div>
                    ))}
                  </div>
                ) : <Text style={{ color: pal.textMuted }}>No categories configured.</Text>}
              </div>

              {/* RULES & PRIZES */}
              <Row gutter={24}>
                <Col span={12}>
                  <div style={{ height: '100%', background: 'rgba(255,255,255,0.01)', border: `1px solid ${pal.border}`, borderRadius: 16, padding: '24px' }}>
                    <div style={{ ...labelStyle, fontSize: '0.75rem', color: COLOR_PRIMARY }}>PRIZES & ELIGIBILITY</div>
                    <div style={{ color: pal.textDim, fontSize: '0.85rem', lineHeight: 1.6, marginTop: 12, whiteSpace: 'pre-wrap' }}>
                      {selectedEvent.prizes_desc || 'Not Specified'}
                    </div>
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ height: '100%', background: 'rgba(255,255,255,0.01)', border: `1px solid ${pal.border}`, borderRadius: 16, padding: '24px' }}>
                    <div style={{ ...labelStyle, fontSize: '0.75rem', color: COLOR_PRIMARY }}>RULES & REGULATIONS</div>
                    <div style={{ color: pal.textDim, fontSize: '0.85rem', lineHeight: 1.6, marginTop: 12, whiteSpace: 'pre-wrap' }}>
                      {selectedEvent.rules || 'Standard rules apply.'}
                    </div>
                  </div>
                </Col>
              </Row>

              {/* DELIVERABLES */}
              <div style={{ padding: '0 8px' }}>
                <div style={labelStyle}>EVENT DELIVERABLES</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                  {selectedEvent.deliverables && (selectedEvent.deliverables as string[]).map((d: string, i: number) => (
                      <Tag key={i} style={{ borderRadius: 4, background: 'rgba(255,255,255,0.05)', border: `1px solid ${pal.border}`, color: pal.textDim }}>{d}</Tag>
                    ))}
                </div>
              </div>

              {/* COUPONS */}
              <div style={{ borderTop: `1px solid ${pal.border}`, paddingTop: 24 }}>
                <Title level={5} style={{ marginBottom: 20, fontWeight: 800, color: COLOR_PRIMARY, display: 'flex', alignItems: 'center' }}>
                  <GiftOutlined style={{ marginRight: 10 }} /> APPLICABLE COUPON CODES
                </Title>
                
                {applicableCoupons.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {applicableCoupons.map((c: Coupon) => (
                      <div key={c.id} style={{ 
                        background: 'rgba(255,107,0,0.03)', 
                        border: `1px solid ${pal.border}`, 
                        borderRadius: 12, 
                        padding: '16px 20px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'transform 0.2s',
                        cursor: 'default'
                      }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                          <div style={{ 
                            background: 'rgba(255,107,0,0.1)', 
                            padding: '8px 16px', 
                            borderRadius: 6, 
                            border: '1px dashed rgba(255,107,0,0.4)',
                            fontWeight: 900,
                            letterSpacing: '1px',
                            color: COLOR_PRIMARY,
                            fontSize: '1rem'
                          }}>{c.code}</div>
                          <div>
                            <div style={{ fontWeight: 800, color: pal.text }}>{c.discountPercent}% DISCOUNT</div>
                            <div style={{ fontSize: '0.75rem', color: pal.textMuted }}>
                              {c.maxUses === -1 ? 'Unlimited Usage' : `${c.usedCount}/${c.maxUses} Uses Consumed`} 
                              • Valid until: {dayjs(c.expiryDate).format('MMM D, YYYY')}
                            </div>
                          </div>
                        </div>
                        <Tag color={c.active ? 'success' : 'default'} style={{ borderRadius: 4, fontWeight: 700 }}>
                          {c.active ? 'ACTIVE' : 'INACTIVE'}
                        </Tag>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ background: 'rgba(255,255,255,0.01)', border: `1px dashed ${pal.border}`, borderRadius: 12, padding: '32px', textAlign: 'center' }}>
                    <Text style={{ color: pal.textMuted, fontSize: '0.9rem' }}>No active coupons for this event.</Text>
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
