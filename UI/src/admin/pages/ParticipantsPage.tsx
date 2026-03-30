import React, { useState, useEffect, useMemo } from 'react';
import { Table, Button, Tag, Space, Input, Select, Typography, Card, message, Popconfirm, Skeleton, Drawer, Descriptions, Modal } from 'antd';
import { TeamOutlined, SearchOutlined, DownloadOutlined, DeleteOutlined, FilterOutlined, UserOutlined, MailOutlined } from '@ant-design/icons';
import { Participant, getParticipants, saveParticipants, sendBulkEmail } from '../../shared/utils/storage';
import { logAction } from '../../shared/utils/auditLog';
import { COLOR_PRIMARY, getPalette } from '../../shared/theme';
import { useThemeMode } from '../App';
import * as XLSX from 'xlsx';

const { Title, Text } = Typography;

export default function ParticipantsPage() {
  const { mode } = useThemeMode();
  const pal = getPalette(mode);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [searchText, setSearchText] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [ageFilter, setAgeFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [eventFilter, setEventFilter] = useState('');
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);

  const [emailModalVisible, setEmailModalVisible] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    getParticipants().then(data => {
      setParticipants(data);
      setLoading(false);
    });
  }, []);

  const cities = useMemo(() => [...new Set((participants || []).map((p: Participant) => p.city))].sort(), [participants]);
  const ageGroups = useMemo(() => [...new Set((participants || []).map((p: Participant) => p.ageGroup))].sort(), [participants]);
  const eventNames = useMemo(() => [...new Set((participants || []).map((p: Participant) => p.eventName))].sort(), [participants]);

  const filtered = useMemo(() => (participants || []).filter(p => {
    if (searchText) {
      const q = searchText.toLowerCase();
      if (!p.name.toLowerCase().includes(q) && !p.email.toLowerCase().includes(q) && !p.phone.includes(q)) return false;
    }
    if (cityFilter && p.city !== cityFilter) return false;
    if (genderFilter && p.gender !== genderFilter) return false;
    if (ageFilter && p.ageGroup !== ageFilter) return false;
    if (paymentFilter && p.paymentStatus !== paymentFilter) return false;
    if (eventFilter && p.eventName !== eventFilter) return false;
    return true;
  }), [participants, searchText, cityFilter, genderFilter, ageFilter, paymentFilter, eventFilter]);

  const exportToExcel = () => {
    const rows = (selectedRowKeys.length > 0 ? filtered.filter(p => selectedRowKeys.includes(p.id)) : filtered)
      .map((p: Participant) => ({ Name: p.name, Email: p.email, Phone: p.phone, City: p.city, Gender: p.gender, 'Age Group': p.ageGroup, Event: p.eventName, Category: p.category, Payment: p.paymentStatus, Registered: p.registeredAt }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Participants');
    XLSX.writeFile(wb, `gagner_participants_${new Date().toISOString().slice(0, 10)}.xlsx`);
    logAction('EXPORT_EXCEL', 'Participants', `${rows.length} records`);
    message.success(`Exported ${rows.length} participants`);
  };

  const bulkDelete = () => {
    const count = selectedRowKeys.length;
    // Optimistic
    const remaining = (participants || []).filter(p => !selectedRowKeys.includes(p.id));
    setParticipants(remaining);
    setSelectedRowKeys([]);
    try {
      saveParticipants(remaining);
      logAction('BULK_DELETE', 'Participants', `${count} removed`);
      message.success(`Deleted ${count} participants`);
    } catch {
      getParticipants().then(data => setParticipants(data));
      message.error('Delete failed — rolled back');
    }
  };

  const bulkMarkPaid = () => {
    const count = selectedRowKeys.length;
    const next = (participants || []).map(p => selectedRowKeys.includes(p.id) ? { ...p, paymentStatus: 'Paid' as const } : p);
    setParticipants(next);
    setSelectedRowKeys([]);
    try {
      saveParticipants(next);
      logAction('PARTICIPANTS_BULK_PAID', 'Participants', `${count} updated`);
      message.success(`Marked ${count} participants as PAID`);
    } catch {
      getParticipants().then(data => setParticipants(data));
      message.error('Update failed');
    }
  };

  const handleBulkEmail = async () => {
    if (!emailSubject || !emailBody) {
      return message.warning('Please enter subject and body');
    }
    const recipientsObj = selectedRowKeys.length > 0
      ? filtered.filter(p => selectedRowKeys.includes(p.id))
      : filtered;
    
    const rawEmails = recipientsObj.map(p => p.email);
    const validEmails = [...new Set(rawEmails.filter(e => e && e.includes('@')))];

    if (validEmails.length === 0) {
      return message.warning('No valid emails found in your selection.');
    }

    setSendingEmail(true);
    try {
      const res = await sendBulkEmail(emailSubject, emailBody, validEmails);
      message.success(`Sent successfully to ${res.successCount} users (${res.failCount} failed)`);
      setEmailModalVisible(false);
      setEmailSubject('');
      setEmailBody('');
      logAction('BULK_EMAIL_SENT', 'Participants', `Sent to ${res.successCount} recipients, Subject: ${emailSubject}`);
    } catch (err: any) {
      message.error(err.message || 'Failed to send bulk email');
    } finally {
      setSendingEmail(false);
    }
  };

  const clearFilters = () => {
    setSearchText(''); setCityFilter(''); setGenderFilter(''); setAgeFilter(''); setPaymentFilter(''); setEventFilter('');
  };

  const columns: any[] = [
    {
      title: 'NAME', dataIndex: 'name', key: 'name',
      sorter: (a: Participant, b: Participant) => a.name.localeCompare(b.name),
      render: (text: string, record: Participant) => (
        <div><div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{text}</div>
        <div style={{ fontSize: '0.7rem', color: pal.textMuted }}>{record.email}</div></div>
      ),
    },
    { title: 'CITY', dataIndex: 'city', key: 'city', width: 100, render: (t: string) => <span style={{ color: pal.textDim, fontSize: '0.85rem' }}>{t}</span> },
    { title: 'GENDER', dataIndex: 'gender', key: 'gender', width: 80, render: (t: string) => <span style={{ fontSize: '0.85rem' }}>{t}</span> },
    { title: 'AGE', dataIndex: 'ageGroup', key: 'ageGroup', width: 70, render: (t: string) => <span style={{ color: pal.textDim, fontSize: '0.85rem' }}>{t}</span> },
    {
      title: 'EVENT', dataIndex: 'eventName', key: 'eventName',
      render: (text: string, record: Participant) => (
        <div><div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{text}</div>
        <div style={{ fontSize: '0.7rem', color: pal.textMuted }}>{record.category}</div></div>
      ),
    },
    {
      title: 'PAYMENT', dataIndex: 'paymentStatus', key: 'paymentStatus', width: 100,
      render: (s: string) => <Tag className={s === 'Paid' ? 'tag-paid' : s === 'Pending' ? 'tag-pending' : 'tag-failed'} style={{ borderRadius: 4, fontSize: '0.7rem' }}>{s.toUpperCase()}</Tag>,
    },
    {
      title: 'DATE', dataIndex: 'registeredAt', key: 'registeredAt', width: 100,
      sorter: (a: Participant, b: Participant) => a.registeredAt.localeCompare(b.registeredAt),
      render: (t: string) => <span style={{ color: pal.textMuted, fontSize: '0.8rem' }}>{t}</span>,
    },
  ];

  if (loading) return <Skeleton active paragraph={{ rows: 10 }} />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Title level={3} style={{ margin: 0, fontWeight: 900 }}>
            <TeamOutlined style={{ color: COLOR_PRIMARY, marginRight: 10 }} />Participants
          </Title>
          <Text style={{ color: pal.textDim, fontSize: '0.85rem' }}>{filtered.length} of {participants.length} shown</Text>
        </div>
        <Space wrap>
          {selectedRowKeys.length > 0 && (
            <Space>
              <Button type="link" size="small" onClick={() => setSelectedRowKeys([])} style={{ color: pal.textMuted }}>Clear Selection</Button>
              <Button icon={<TeamOutlined />} onClick={bulkMarkPaid} ghost style={{ color: pal.text, borderColor: pal.border, height: 38, fontWeight: 700 }}>MARK AS PAID</Button>
              <Button icon={<MailOutlined />} onClick={() => setEmailModalVisible(true)} ghost style={{ color: pal.text, borderColor: pal.border, height: 38, fontWeight: 700 }}>BULK EMAIL</Button>
              <Popconfirm title={`Delete ${selectedRowKeys.length} items?`} onConfirm={bulkDelete} okText="Delete" okButtonProps={{ danger: true }}>
                <Button icon={<DeleteOutlined />} danger style={{ height: 38, fontWeight: 700 }} />
              </Popconfirm>
            </Space>
          )}
          {selectedRowKeys.length === 0 && (
            <Button icon={<MailOutlined />} onClick={() => setEmailModalVisible(true)} ghost style={{ color: pal.text, borderColor: pal.border, height: 38, fontWeight: 700 }}>EMAIL ALL LISTED</Button>
          )}
          <Button icon={<DownloadOutlined />} className="btn-brand-gradient" onClick={exportToExcel}
            style={{ height: 38, fontWeight: 700, letterSpacing: '0.5px', paddingInline: 16, fontSize: '0.8rem' }}>EXPORT EXCEL</Button>
        </Space>
      </div>

      {/* Filters */}
      <Card style={{ background: pal.card, borderColor: pal.border, borderRadius: 12, marginBottom: 16 }} bodyStyle={{ padding: '12px 16px' }}>
        <Space wrap size="small" style={{ width: '100%' }}>
          <FilterOutlined style={{ color: pal.textMuted }} />
          <Input prefix={<SearchOutlined style={{ color: pal.textMuted }} />} placeholder="Name, email, phone..." value={searchText}
            onChange={(e) => setSearchText(e.target.value)} allowClear autoComplete="off" style={{ width: 200, background: pal.inputBg, borderColor: pal.border }} size="small" />
          <Select placeholder="City" value={cityFilter || undefined} onChange={(v) => setCityFilter(v || '')} allowClear style={{ width: 120 }} size="small"
            options={cities.map((c: string) => ({ value: c, label: c }))} />
          <Select placeholder="Gender" value={genderFilter || undefined} onChange={(v) => setGenderFilter(v || '')} allowClear style={{ width: 100 }} size="small"
            options={[{ value: 'Male', label: 'Male' }, { value: 'Female', label: 'Female' }, { value: 'Other', label: 'Other' }]} />
          <Select placeholder="Age" value={ageFilter || undefined} onChange={(v) => setAgeFilter(v || '')} allowClear style={{ width: 100 }} size="small"
            options={ageGroups.map((a: string) => ({ value: a, label: a }))} />
          <Select 
            placeholder="Event" 
            value={eventFilter || undefined} 
            onChange={(v) => setEventFilter(v || '')} 
            allowClear 
            style={{ width: 220 }} 
            size="small"
            showSearch
            optionFilterProp="label"
            options={eventNames.map((e: string) => ({ 
              value: e, 
              label: `${e} (${(participants || []).filter(p => p.eventName === e).length})` 
            }))} 
          />
          <Select placeholder="Payment" value={paymentFilter || undefined} onChange={(v) => setPaymentFilter(v || '')} allowClear style={{ width: 100 }} size="small"
            options={[{ value: 'Paid', label: 'Paid' }, { value: 'Pending', label: 'Pending' }, { value: 'Failed', label: 'Failed' }]} />
          {(searchText || cityFilter || genderFilter || ageFilter || paymentFilter || eventFilter) && (
            <Button type="link" size="small" onClick={clearFilters} style={{ color: COLOR_PRIMARY, fontSize: '0.75rem' }}>Clear All</Button>
          )}
        </Space>
      </Card>

      <Card bodyStyle={{ padding: 0 }} style={{ background: pal.card, border: 'none', borderRadius: 12, overflow: 'hidden' }}>
        <Table dataSource={filtered} columns={columns} rowKey="id" scroll={{ x: 800 }}
          onRow={(record) => ({
            onClick: () => {
              setSelectedParticipant(record);
              setDrawerVisible(true);
            },
            style: { cursor: 'pointer' }
          })}
          rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `${total} total` }} />
      </Card>

      <Drawer
        title={<span style={{ fontWeight: 800 }}><UserOutlined style={{ marginRight: 8, color: COLOR_PRIMARY }} />Participant Details</span>}
        placement="right"
        width={450}
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        destroyOnClose
        style={{ background: pal.bg }}
        headerStyle={{ background: pal.card, borderBottom: `1px solid ${pal.border}` }}
        bodyStyle={{ background: pal.bg, padding: 24 }}
      >
        {selectedParticipant && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%' }}>
            {/* Header / Basic Info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
               <div>
                  <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: pal.text }}>{selectedParticipant.name}</h3>
                  <div style={{ color: pal.textMuted, fontSize: '0.9rem', marginTop: 4 }}>{selectedParticipant.email}</div>
                  <div style={{ color: pal.textMuted, fontSize: '0.9rem', marginTop: 2 }}>{selectedParticipant.phone}</div>
               </div>
               <Tag className={selectedParticipant.paymentStatus === 'Paid' ? 'tag-paid' : selectedParticipant.paymentStatus === 'Pending' ? 'tag-pending' : 'tag-failed'} style={{ borderRadius: 4, padding: '4px 12px', fontWeight: 800, border: 'none' }}>
                 {selectedParticipant.paymentStatus.toUpperCase()}
               </Tag>
            </div>

            {/* Event Info */}
            <Card size="small" style={{ background: pal.card, borderColor: pal.border, borderRadius: 12 }}>
               <Descriptions column={1} size="small" labelStyle={{ color: pal.textMuted, width: '100px' }} contentStyle={{ fontWeight: 600, color: pal.text }}>
                  <Descriptions.Item label="Event">{selectedParticipant.eventName}</Descriptions.Item>
                  <Descriptions.Item label="Category">{selectedParticipant.category}</Descriptions.Item>
                  <Descriptions.Item label="Reg. Date">{new Date(selectedParticipant.registeredAt).toLocaleString()}</Descriptions.Item>
               </Descriptions>
            </Card>

            {/* Personal Info */}
            <Card size="small" style={{ background: pal.card, borderColor: pal.border, borderRadius: 12 }}>
               <Descriptions column={1} size="small" labelStyle={{ color: pal.textMuted, width: '100px' }} contentStyle={{ fontWeight: 600, color: pal.text }}>
                  <Descriptions.Item label="Gender">{selectedParticipant.gender}</Descriptions.Item>
                  <Descriptions.Item label="Age Group">{selectedParticipant.ageGroup}</Descriptions.Item>
                  <Descriptions.Item label="City">{selectedParticipant.city}</Descriptions.Item>
               </Descriptions>
            </Card>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 12, marginTop: 'auto', paddingTop: 24 }}>
               <Button type="primary" style={{ flex: 1, fontWeight: 700, height: 42 }} onClick={() => {
                  const next = participants.map(p => p.id === selectedParticipant.id ? { ...p, paymentStatus: 'Paid' as const } : p);
                  setParticipants(next);
                  saveParticipants(next);
                  setSelectedParticipant({ ...selectedParticipant, paymentStatus: 'Paid' });
                  message.success('Marked as PAID');
               }}>MARK AS PAID</Button>
               <Popconfirm title="Delete this participant?" onConfirm={() => {
                  const next = participants.filter(p => p.id !== selectedParticipant.id);
                  setParticipants(next);
                  saveParticipants(next);
                  setDrawerVisible(false);
                  message.success('Participant deleted');
               }} okText="Delete" okButtonProps={{ danger: true }}>
                 <Button danger icon={<DeleteOutlined />} style={{ fontWeight: 700, height: 42 }}>DELETE</Button>
               </Popconfirm>
            </div>
          </div>
        )}
      </Drawer>

      <Modal
        title={<span style={{ fontWeight: 800, fontSize: '1.2rem' }}><MailOutlined style={{ marginRight: 8, color: COLOR_PRIMARY }} />Send Bulk Email</span>}
        open={emailModalVisible}
        onCancel={() => setEmailModalVisible(false)}
        onOk={handleBulkEmail}
        confirmLoading={sendingEmail}
        okText="Send Email"
        okButtonProps={{ className: 'btn-brand-gradient' }}
        cancelButtonProps={{ style: { fontWeight: 600 } }}
        destroyOnClose
        width={600}
        styles={{ 
          content: { background: pal.card, borderColor: pal.border },
          header: { background: pal.card, borderBottom: `1px solid ${pal.border}` },
          body: { paddingTop: 20 }
        }}
      >
        <div style={{ marginBottom: 20 }}>
          <Text style={{ color: pal.textMuted, fontSize: '0.95rem' }}>
            Sending email to: <strong style={{ color: pal.text, background: pal.inputBg, padding: '4px 8px', borderRadius: 4 }}>
              {selectedRowKeys.length > 0 ? selectedRowKeys.length : filtered.length} participants
            </strong>
          </Text>
        </div>
        <div style={{ marginBottom: 20 }}>
          <Text strong style={{ color: pal.text }}>Subject</Text>
          <Input 
            placeholder="e.g. Important Update for Marathon 2024" 
            value={emailSubject} 
            onChange={(e) => setEmailSubject(e.target.value)} 
            style={{ marginTop: 8, background: pal.inputBg, borderColor: pal.border, color: pal.text }}
            size="large"
          />
        </div>
        <div>
          <Text strong style={{ color: pal.text }}>Message Body</Text>
          <Input.TextArea 
            placeholder="Write your email content here... (HTML tags will be rendered as plain text in this view, but will work in the email)" 
            rows={8} 
            value={emailBody} 
            onChange={(e) => setEmailBody(e.target.value)} 
            style={{ marginTop: 8, background: pal.inputBg, borderColor: pal.border, color: pal.text }}
          />
        </div>
      </Modal>
    </div>
  );
}
