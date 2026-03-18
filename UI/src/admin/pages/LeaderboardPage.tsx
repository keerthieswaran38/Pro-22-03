import React, { useState, useEffect } from 'react';
import { Card, Select, Form, Input, Button, Typography, Space, message, Empty, Row, Col, Skeleton } from 'antd';
import { TrophyOutlined, SaveOutlined, CrownOutlined } from '@ant-design/icons';
import { getEvents, getLeaderboard, saveLeaderboard, LeaderboardEntry } from '../../shared/utils/storage';
import { logAction } from '../../shared/utils/auditLog';
import { leaderboardEntrySchema, zodToFieldErrors } from '../../shared/utils/schemas';
import { COLOR_PRIMARY, COLOR_ACCENT, getPalette } from '../../shared/theme';
import { useThemeMode } from '../App';

const { Title, Text } = Typography;

export default function LeaderboardPage() {
  const { mode } = useThemeMode();
  const pal = getPalette(mode);
  const [events, setEvents] = useState<Record<string, any>>({});
  const [leaderboard, setLeaderboard] = useState<Record<string, LeaderboardEntry[]>>({});
  const [selectedEvent, setSelectedEvent] = useState('');
  const [form] = Form.useForm();
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setEvents(getEvents());
      setLeaderboard(getLeaderboard());
      setLoading(false);
    }, 200);
  }, []);

  const eventOptions = Object.entries(events)
    .filter(([, ev]: [string, any]) => !ev.isDraft)
    .map(([slug, ev]) => ({ value: slug, label: (ev as any).title }));

  const handleEventSelect = (slug: string) => {
    setSelectedEvent(slug);
    setFormErrors({});
    const winners = leaderboard[slug] || [];
    // Guard against undefined — bulletproof access
    const w = (i: number) => winners[i] || { name: '', time: '' };
    form.setFieldsValue({
      first_name: w(0).name, first_time: w(0).time,
      second_name: w(1).name, second_time: w(1).time,
      third_name: w(2).name, third_time: w(2).time,
    });
  };

  const handleSave = () => {
    const raw = form.getFieldsValue();
    const parsed = leaderboardEntrySchema.safeParse(raw);
    if (!parsed.success) {
      setFormErrors(zodToFieldErrors(parsed.error));
      message.error('Fix highlighted errors (use HH:MM:SS format)');
      return;
    }
    setFormErrors({});
    setSaving(true);

    const val = parsed.data;
    const cleanTime = (t: string | null | undefined) => (t && t.trim() ? t : null);

    const newWinners: LeaderboardEntry[] = [
      { name: val.first_name, time: cleanTime(val.first_time) },
      { name: val.second_name, time: cleanTime(val.second_time) },
      { name: val.third_name, time: cleanTime(val.third_time) },
    ];

    // Optimistic UI update
    setLeaderboard(prev => ({ ...prev, [selectedEvent]: newWinners }));

    try {
      const lb = getLeaderboard();
      lb[selectedEvent] = newWinners;
      saveLeaderboard(lb);
      logAction('LEADERBOARD_UPDATED', events[selectedEvent]?.title || selectedEvent, `1st: ${val.first_name}, 2nd: ${val.second_name}, 3rd: ${val.third_name}`);
      message.success('Leaderboard saved!');
    } catch {
      setLeaderboard(getLeaderboard());
      message.error('Save failed — rolled back');
    }
    setSaving(false);
  };

  // Safe access for podium - zero undefined errors guaranteed
  const currentWinners = selectedEvent ? (leaderboard[selectedEvent] || []) : [];
  const w = (i: number) => currentWinners[i] || { name: '', time: '' };
  const hasWinners = w(0).name.length > 0;

  const labelStyle = { fontWeight: 700, letterSpacing: '1px', fontSize: '0.7rem', color: pal.textDim } as React.CSSProperties;

  if (loading) return <Skeleton active paragraph={{ rows: 8 }} />;

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <Title level={3} style={{ margin: 0, fontWeight: 900 }}>
          <TrophyOutlined style={{ color: COLOR_ACCENT, marginRight: 10 }} />Leaderboard Podium Manager
        </Title>
        <Text style={{ color: pal.textDim, fontSize: '0.85rem' }}>Input 1st, 2nd, 3rd place winners</Text>
      </div>

      <Card style={{ background: pal.card, borderColor: pal.border, borderRadius: 12, marginBottom: 20 }}>
        <div style={{ maxWidth: 380 }}>
          <label style={{ ...labelStyle, display: 'block', marginBottom: 6 }}>SELECT EVENT</label>
          <Select placeholder="Choose an event..." style={{ width: '100%' }} options={eventOptions}
            value={selectedEvent || undefined} onChange={handleEventSelect} size="large" />
        </div>
      </Card>

      {selectedEvent ? (
        <Row gutter={[20, 20]}>
          <Col xs={24} lg={10}>
            <Card title={<span style={{ fontWeight: 800, fontSize: '0.8rem' }}><CrownOutlined style={{ color: '#FFD700', marginRight: 8 }} />PODIUM PREVIEW</span>}
              style={{ background: pal.card, borderColor: pal.border, borderRadius: 12 }}>
              {hasWinners ? (
                <div className="podium-container">
                  <div className="podium-position podium-silver">
                    <div className="podium-name">{w(1).name || '—'}</div>
                    <div className="podium-time">{w(1).time}</div>
                    <div className="podium-block">2</div>
                  </div>
                  <div className="podium-position podium-gold">
                    <div className="podium-name" style={{ color: '#FFD700' }}>{w(0).name || '—'}</div>
                    <div className="podium-time">{w(0).time}</div>
                    <div className="podium-block">1</div>
                  </div>
                  <div className="podium-position podium-bronze">
                    <div className="podium-name">{w(2).name || '—'}</div>
                    <div className="podium-time">{w(2).time}</div>
                    <div className="podium-block">3</div>
                  </div>
                </div>
              ) : (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No winners set" style={{ padding: '1.5rem 0' }} />
              )}
            </Card>
          </Col>

          <Col xs={24} lg={14}>
            <Card title={<span style={{ fontWeight: 800, fontSize: '0.8rem' }}>WINNER DETAILS</span>}
              style={{ background: pal.card, borderColor: pal.border, borderRadius: 12 }}>
              <Form form={form} layout="vertical" size="large" autoComplete="off">
                {[
                  { place: '1ST', emoji: '🥇', color: '#FFD700', nameField: 'first_name', timeField: 'first_time' },
                  { place: '2ND', emoji: '🥈', color: '#C0C0C0', nameField: 'second_name', timeField: 'second_time' },
                  { place: '3RD', emoji: '🥉', color: '#CD7F32', nameField: 'third_name', timeField: 'third_time' },
                ].map(({ place, emoji, color, nameField, timeField }) => (
                  <div key={place} style={{
                    padding: '12px 16px', background: `${color}10`, border: `1px solid ${color}33`,
                    borderRadius: 10, marginBottom: 12,
                  }}>
                    <div style={{ fontWeight: 800, color, marginBottom: 8, fontSize: '0.8rem', letterSpacing: '1px' }}>
                      {emoji} {place} PLACE
                    </div>
                    <Row gutter={10}>
                      <Col span={14}>
                        <Form.Item name={nameField} style={{ marginBottom: 0 }}
                          validateStatus={formErrors[nameField] ? 'error' : ''} help={formErrors[nameField] && <span className="field-error">{formErrors[nameField]}</span>}>
                          <Input placeholder="Winner Name" style={{ background: pal.inputBg, borderColor: `${color}33` }} />
                        </Form.Item>
                      </Col>
                      <Col span={10}>
                        <Form.Item name={timeField} style={{ marginBottom: 0 }}
                          validateStatus={formErrors[timeField] ? 'error' : ''} help={formErrors[timeField] && <span className="field-error">{formErrors[timeField]}</span>}>
                          <Input placeholder="HH:MM:SS" style={{ background: pal.inputBg, borderColor: `${color}33`, fontFamily: 'monospace' }} />
                        </Form.Item>
                      </Col>
                    </Row>
                  </div>
                ))}

                <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={saving} block
                  className="btn-brand-gradient" style={{ height: 44, fontWeight: 800, letterSpacing: '2px', marginTop: 8 }}>
                  SAVE LEADERBOARD
                </Button>
              </Form>
            </Card>
          </Col>
        </Row>
      ) : (
        <Card style={{ background: pal.card, borderColor: pal.border, borderRadius: 12 }}>
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={<Text style={{ color: pal.textMuted }}>Select an event to manage its leaderboard</Text>}
            style={{ padding: '2.5rem 0' }} />
        </Card>
      )}
    </div>
  );
}
