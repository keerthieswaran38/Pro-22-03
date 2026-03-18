import React, { useState, useEffect } from 'react';
import { Table, Typography, Card, Tag, Empty, Button, Modal, message, Skeleton, Select, DatePicker, Input, Row, Col, Space } from 'antd';
import { AuditOutlined, ClearOutlined, SearchOutlined, FilterOutlined, CalendarOutlined } from '@ant-design/icons';
import { getAuditLog, clearAuditLog, AuditEntry } from '../../shared/utils/auditLog';
import { COLOR_PRIMARY, getPalette } from '../../shared/theme';
import { useThemeMode } from '../App';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const ACTION_COLORS: Record<string, string> = {
  LOGIN: '#00C853', EVENT_CREATED: '#00C853', EVENT_UPDATED: '#3b82f6', EVENT_DELETED: '#ef4444',
  REGISTRATION_TOGGLED: '#F1C40F', LEADERBOARD_UPDATED: '#a855f7',
  COUPON_CREATED: '#00C853', COUPON_UPDATED: '#3b82f6', COUPON_DELETED: '#ef4444', COUPON_TOGGLED: '#F1C40F',
  CONTENT_CREATED: '#00C853', CONTENT_UPDATED: '#3b82f6', CONTENT_DELETED: '#ef4444',
  EXPORT_EXCEL: '#a855f7', BULK_DELETE: '#ef4444',
};

export default function AuditLogPage() {
  const { mode } = useThemeMode();
  const pal = getPalette(mode);
  const [log, setLog] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [actionFilter, setActionFilter] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState('');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

  useEffect(() => { 
    const channel = new BroadcastChannel('gagner_audit_sync');
    channel.onmessage = (msg) => {
      if (msg.data === 'LOG_UPDATED') {
        const fresh = getAuditLog();
        setLog(fresh);
        message.info('Real-time audit update received', 1);
      }
    };

    setTimeout(() => { setLog(getAuditLog()); setLoading(false); }, 200); 

    return () => channel.close();
  }, []);

  const handleClear = () => {
    Modal.confirm({
      title: 'Clear entire log?',
      content: 'This action irreversibly destroys all activity records. It cannot be recovered.',
      okText: 'CLEAR EVERYTHING',
      okType: 'danger',
      cancelText: 'ABORT',
      onOk: () => {
        clearAuditLog();
        setLog([]);
        message.success('Audit log expunged');
      },
    });
  };

  const filteredLog = log.filter((e: AuditEntry) => {
    const matchesAction = actionFilter ? e.action === actionFilter : true;
    const matchesUser = userSearch ? e.user.toLowerCase().includes(userSearch.toLowerCase()) : true;
    const matchesDate = dateRange ? (
      dayjs(e.timestamp).isAfter(dateRange[0].startOf('day')) && 
      dayjs(e.timestamp).isBefore(dateRange[1].endOf('day'))
    ) : true;
    return matchesAction && matchesUser && matchesDate;
  });
  const columns: any[] = [
    {
      title: 'TIMESTAMP', dataIndex: 'timestamp', key: 'timestamp', width: 170,
      render: (text: string) => { const d = new Date(text); return <span style={{ color: pal.textMuted, fontSize: '0.8rem', fontFamily: 'monospace' }}>{d.toLocaleDateString()} {d.toLocaleTimeString()}</span>; },
    },
    { title: 'USER', dataIndex: 'user', key: 'user', width: 170, render: (t: string) => <span style={{ color: pal.textDim, fontSize: '0.85rem' }}>{t}</span> },
    {
      title: 'ACTION', dataIndex: 'action', key: 'action', width: 170,
      render: (text: string) => { const c = ACTION_COLORS[text] || '#6b7280'; return <Tag style={{ background: `${c}20`, color: c, border: `1px solid ${c}40`, borderRadius: 4, fontWeight: 700, letterSpacing: '0.5px', fontSize: '0.7rem' }}>{text.replace(/_/g, ' ')}</Tag>; },
    },
    { title: 'TARGET', dataIndex: 'target', key: 'target', render: (t: string) => <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{t}</span> },
    { title: 'DETAILS', dataIndex: 'details', key: 'details', render: (t: string) => <span style={{ color: pal.textMuted, fontSize: '0.8rem' }}>{t || '—'}</span> },
  ];

  const labelStyle = { color: pal.textMuted, fontSize: '0.65rem', fontWeight: 800, marginBottom: 4, display: 'block', letterSpacing: '0.5px' };
  const filterInputStyle = { background: pal.inputBg, borderColor: pal.border, borderRadius: 6, height: 38 };

  if (loading) return <Skeleton active paragraph={{ rows: 10 }} />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <Title level={3} style={{ margin: 0, fontWeight: 900 }}>
            <AuditOutlined style={{ color: COLOR_PRIMARY, marginRight: 10 }} />Audit Log
          </Title>
          <Text style={{ color: pal.textDim, fontSize: '0.85rem' }}>
            Showing {filteredLog.length} of {log.length} system entries
          </Text>
        </div>
        <Space wrap>
          {log.length > 0 && (
            <Button icon={<ClearOutlined />} danger onClick={handleClear}
              style={{ height: 40, fontWeight: 700, borderRadius: 8 }}>CLEAR LOG</Button>
          )}
        </Space>
      </div>

      <Card styles={{ body: { padding: '16px 20px' } }} style={{ background: pal.card, border: 'none', borderRadius: 12, marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="bottom">
          <Col xs={24} md={6}>
            <label style={labelStyle}>ACTION TYPE</label>
            <Select 
              placeholder="All Actions" 
              allowClear 
              style={{ width: '100%' }}
              onChange={setActionFilter}
              suffixIcon={<FilterOutlined />}
              styles={{ popup: { root: { background: pal.card } } }}
            >
              {Object.keys(ACTION_COLORS).map(a => (
                <Option key={a} value={a}>{a.replace(/_/g, ' ')}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} md={8}>
            <label style={labelStyle}>DATE RANGE</label>
            <RangePicker 
              style={{ width: '100%', ...filterInputStyle }} 
              onChange={(val) => setDateRange(val as any)}
              suffixIcon={<CalendarOutlined />}
            />
          </Col>
          <Col xs={24} md={10}>
            <label style={labelStyle}>USER SEARCH (EMAIL)</label>
            <Input 
              prefix={<SearchOutlined style={{ color: pal.textMuted }} />} 
              placeholder="Filter by admin identity..." 
              style={filterInputStyle}
              value={userSearch}
              onChange={e => setUserSearch(e.target.value)}
              allowClear
            />
          </Col>
        </Row>
      </Card>

      <Card styles={{ body: { padding: 0 } }} style={{ background: pal.card, border: 'none', borderRadius: 12, overflow: 'hidden' }}>
        <Table dataSource={filteredLog} columns={columns} rowKey="id" scroll={{ x: 850 }}
          pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (total) => `${total} results matched` }}
          locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={<Text style={{ color: pal.textMuted }}>No relevant activity records found.</Text>} style={{ padding: '3rem 0' }} /> }} />
      </Card>
    </div>
  );
}
