import React, { useState, useEffect } from 'react';
import { 
  Table, Button, Modal, Form, Input, Select, Switch, Tag, Space,
  Typography, Popconfirm, message, Card, Row, Col, Tooltip, Skeleton,
  DatePicker, TimePicker, InputNumber, Dropdown, Progress, Badge, Alert, MenuProps, Statistic
} from 'antd';
import {
  CalendarOutlined, TeamOutlined, GiftOutlined, TrophyOutlined,
  PlusOutlined, DownloadOutlined, ThunderboltOutlined, ClockCircleOutlined,
  ArrowUpOutlined, ArrowDownOutlined, GlobalOutlined, FilePdfOutlined,
  FileExcelOutlined, TableOutlined, MoreOutlined, AlertFilled, ReloadOutlined,
  CheckCircleOutlined, InfoCircleOutlined, FileTextOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as ChartTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar
} from 'recharts';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { GagnerEvent, Participant } from '../../shared/utils/storage';
import { COLOR_PRIMARY, COLOR_SUCCESS, COLOR_ACCENT, COLOR_ERROR } from '../../shared/theme';
import { useThemeMode } from '../App';
import { getPalette } from '../../shared/theme';
import { useEvents, useParticipants, useCoupons } from '../../shared/hooks/useSync';

const { Title, Text } = Typography;

export default function DashboardPage() {
  const navigate = useNavigate();
  const { mode } = useThemeMode();
  const p = getPalette(mode);
  
  const { data: eventsMap, isLoading: evLoading } = useEvents();
  const { data: participants, isLoading: ptLoading } = useParticipants();
  const { data: coupons, isLoading: cpLoading } = useCoupons();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ 
    total: 0, 
    upcoming: 0, 
    participants: 0, 
    coupons: 0,
    registrationGrowth: '0',
    eventGrowth: '0',
    participantGrowth: '0',
    couponGrowth: '0'
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [pieData, setPieData] = useState<any[]>([]);
  const [topEvents, setTopEvents] = useState<any[]>([]);
  const [urgentEvents, setUrgentEvents] = useState<GagnerEvent[]>([]);

  useEffect(() => {
    if (!evLoading && !ptLoading && !cpLoading) {
      refreshCalculations();
      setLoading(false);
    }
  }, [eventsMap, participants, coupons, evLoading, ptLoading, cpLoading]);

  const refreshCalculations = () => {
    if (!eventsMap || !participants || !coupons) return;
    
    const ev = eventsMap;
    const allEvents = Object.values(ev);
    const publicEvents = allEvents.filter((e: any) => !e.isDraft);
    const parts = participants;
    const allCoupons = coupons;

    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);
    
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(now.getDate() - 14);
    
    const calcGrowthStr = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? '100.0' : '0.0';
      return (((current - previous) / previous) * 100).toFixed(1);
    };

    const currentParts = parts.length;
    const oldParts = parts.filter(p => new Date(p.registeredAt) < sevenDaysAgo).length;
    const partGrowth = calcGrowthStr(currentParts, oldParts);

    const newEventsThisWeek = allEvents.filter(e => new Date(e.createdAt) >= sevenDaysAgo).length;
    const newEventsLastWeek = allEvents.filter(e => {
      const d = new Date(e.createdAt);
      return d >= fourteenDaysAgo && d < sevenDaysAgo;
    }).length;
    const eventGrowth = calcGrowthStr(newEventsThisWeek, newEventsLastWeek);

    const newCouponsThisWeek = allCoupons.filter(c => new Date(c.createdAt) >= sevenDaysAgo).length;
    const newCouponsLastWeek = allCoupons.filter(c => {
      const d = new Date(c.createdAt);
      return d >= fourteenDaysAgo && d < sevenDaysAgo;
    }).length;
    const couponGrowth = calcGrowthStr(newCouponsThisWeek, newCouponsLastWeek);

    const regsThisWeek = parts.filter(p => new Date(p.registeredAt) >= sevenDaysAgo).length;
    const regsLastWeek = parts.filter(p => {
      const d = new Date(p.registeredAt);
      return d >= fourteenDaysAgo && d < sevenDaysAgo;
    }).length;
    const regGrowth = calcGrowthStr(regsThisWeek, regsLastWeek);

    setStats({
      total: publicEvents.length,
      upcoming: publicEvents.filter((e: any) => !e.archived).length,
      participants: currentParts,
      coupons: allCoupons.filter(c => c.active).length,
      registrationGrowth: regGrowth,
      eventGrowth: eventGrowth,
      participantGrowth: partGrowth,
      couponGrowth: couponGrowth
    });

    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = d.toISOString().split('T')[0];
      const count = parts.filter(p => p.registeredAt.startsWith(dayStr)).length;
      return { name: dayStr, registrations: count };
    }).reverse();
    setChartData(last7Days);

    const revenueTrend = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = d.toISOString().split('T')[0];
      const dailyParts = parts.filter(p => p.registeredAt.startsWith(dayStr));
      const revenue = dailyParts.reduce((acc, p) => {
        let eventObj: GagnerEvent | undefined = ev[p.eventSlug];
        if (!eventObj && p.eventName) {
          eventObj = Object.values(ev).find(e => e.title === p.eventName);
        }
        if (!eventObj) return acc;
        const cat = eventObj.categories.find(c => c.name === p.category);
        const priceNum = cat ? parseInt(cat.price.replace(/[^\d]/g, '')) || 0 : 0;
        return acc + priceNum;
      }, 0);
      return { name: dayStr, revenue };
    }).reverse();
    setRevenueData(revenueTrend);

    const types: Record<string, number> = {};
    const eventsList = Object.values(ev);
    
    parts.forEach(p => {
      let typeLabel = 'OTHER';
      const eventObj = ev[p.eventSlug];
      if (eventObj) {
        typeLabel = eventObj.tag;
      } else if (p.eventName) {
        const match = eventsList.find(e => e.title === p.eventName);
        if (match) typeLabel = match.tag;
      }
      types[typeLabel] = (types[typeLabel] || 0) + 1;
    });
    setPieData(Object.entries(types).map(([name, value]) => ({ name, value })));

    const publicEventsWithSlugs = Object.entries(ev)
      .filter(([_, data]) => !data.isDraft && !data.archived)
      .map(([slug, data]) => ({ ...data, slug }));

    const sortedEvents = publicEventsWithSlugs
      .map(e => {
        const eventParticipants = parts.filter(p => p.eventSlug === e.slug || (p.eventName === e.title));
        const count = eventParticipants.length;
        const capacity = e.capacity || (e.tag === 'MARATHON' ? 1000 : 500);
        const rawPercent = (count / capacity) * 100;
        return { 
          title: e.title, 
          count: count, 
          capacity: capacity, 
          percent: parseFloat(rawPercent.toFixed(1)),
          color: e.tag === 'MARATHON' ? COLOR_PRIMARY : COLOR_SUCCESS
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
    setTopEvents(sortedEvents);

    const urgent = allEvents.filter(e => {
      if (!e.date || e.archived) return false;
      const evDate = new Date(e.date);
      const diff = evDate.getTime() - now.getTime();
      return diff > 0 && diff < 24 * 60 * 60 * 1000;
    });
    setUrgentEvents(urgent);
  };

  const handleExport = (type: 'PDF' | 'CSV' | 'XLSX') => {
    if (!participants) return;
    if (type === 'PDF') {
      const doc = new jsPDF();
      doc.text('Gagner Sports - Full Participant List', 14, 20);
      (doc as any).autoTable({
        startY: 30,
        head: [['ID', 'Name', 'Email', 'Event', 'Status', 'Date']],
        body: participants.map(p => [p.id, p.name, p.email, p.eventName, p.paymentStatus, p.registeredAt]),
      });
      doc.save('Gagner_Participants_Report.pdf');
    } else if (type === 'CSV' || type === 'XLSX') {
      const ws = XLSX.utils.json_to_sheet(participants);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Participants');
      XLSX.writeFile(wb, `Gagner_Report.${type.toLowerCase()}`);
    }
  };

  const generateBusinessReport = () => {
    if (!eventsMap) return;
    const doc = new jsPDF();
    const upcoming = Object.values(eventsMap).filter(e => !e.archived).slice(0, 5);
    doc.setFontSize(18);
    doc.text('Gagner Sports - Business Summary Report', 14, 22);
    doc.setFontSize(11);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
    
    (doc as any).autoTable({
      startY: 40,
      head: [['Event Title', 'Date', 'Venue', 'Participants', 'Status']],
      body: upcoming.map(e => [
        e.title, 
        e.date, 
        e.venue, 
        'N/A',
        e.registrationOpen ? 'Open' : 'Closed'
      ]),
    });
    doc.save('Upcoming_Events_Summary.pdf');
  };

  if (loading) {
    return (
      <div>
        <Skeleton active paragraph={{ rows: 1, width: 200 }} title={{ width: 280 }} />
        <Row gutter={[20, 20]} style={{ margin: '24px 0' }}>
          {[1,2,3,4].map(i => <Col xs={24} sm={12} lg={6} key={i}><Skeleton.Node active style={{ width: '100%', height: 110, borderRadius: 12 }} /></Col>)}
        </Row>
        <Skeleton active paragraph={{ rows: 6 }} />
      </div>
    );
  }

  return (
    <div>
      {urgentEvents.length > 0 && (
        <Alert
          message="CRITICAL: UPCOMING EVENTS"
          description={`The event "${urgentEvents[0].title}" is happening within 24 hours!`}
          type="error"
          showIcon
          icon={<AlertFilled />}
          style={{ marginBottom: 24, borderRadius: 12, border: 'none', background: 'rgba(239, 68, 68, 0.1)', color: COLOR_ERROR }}
          action={
            <Button size="small" danger ghost onClick={() => navigate('/admin/events')}>View Event</Button>
          }
        />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={3} style={{ margin: 0, fontWeight: 900, letterSpacing: '-0.5px' }}>Dashboard</Title>
          <Text style={{ color: p.textDim, fontSize: '0.9rem' }}>Overview of your marathon platform</Text>
        </div>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 28 }}>
        {[
          { title: 'TOTAL EVENTS', value: stats.total, icon: <CalendarOutlined />, color: COLOR_SUCCESS, growth: stats.eventGrowth, nav: '/admin/events' },
          { title: 'UPCOMING', value: stats.upcoming, icon: <ThunderboltOutlined />, color: COLOR_PRIMARY, growth: stats.eventGrowth, nav: '/admin/events' },
          { title: 'PARTICIPANTS', value: stats.participants, icon: <TeamOutlined />, color: COLOR_ACCENT, growth: stats.registrationGrowth, nav: '/admin/participants' },
          { title: 'ACTIVE COUPONS', value: stats.coupons, icon: <GiftOutlined />, color: '#a855f7', growth: stats.couponGrowth, nav: '/admin/coupons' },
        ].map((s, i) => (
          <Col xs={12} sm={12} lg={6} key={i}>
            <Card 
              className="admin-stat-card hover-lift" 
              bordered={false} 
              style={{ cursor: 'pointer' }}
              onClick={() => navigate(s.nav)}
            >
              <Statistic 
                title={<span style={{ fontSize: '0.7rem', fontWeight: 700, color: p.textMuted }}>{s.title}</span>} 
                value={s.value} 
                prefix={React.cloneElement(s.icon, { style: { color: s.color } })} 
                valueStyle={{ color: s.color, fontWeight: 900 }} 
              />
              <div style={{ marginTop: 8, fontSize: '0.75rem', fontWeight: 600 }}>
                {parseFloat(s.growth) >= 0 ? (
                  <span style={{ color: COLOR_SUCCESS }}><ArrowUpOutlined /> +{s.growth}% <span style={{ color: p.textMuted, fontWeight: 400 }}>from last week</span></span>
                ) : (
                  <span style={{ color: COLOR_ERROR }}><ArrowDownOutlined /> {s.growth}% <span style={{ color: p.textMuted, fontWeight: 400 }}>from last week</span></span>
                )}
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[20, 20]} style={{ marginBottom: 28 }}>
        <Col xs={24} lg={12}>
          <Card 
            title={<span style={{ fontWeight: 800, letterSpacing: '0.5px', fontSize: '0.75rem', color: p.textDim }}>REGISTRATION TRENDS (LAST 7 DAYS)</span>} 
            className="admin-stat-card chart-container" 
            bordered={false}
          >
            <div style={{ height: 300, width: '100%', marginTop: 10 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={p.border} />
                  <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} tick={{ fill: p.textMuted }} />
                  <YAxis fontSize={10} axisLine={false} tickLine={false} tick={{ fill: p.textMuted }} />
                  <ChartTooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    contentStyle={{ backgroundColor: p.card, border: `1px solid ${p.border}`, borderRadius: 8, boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}
                  />
                  <Bar dataKey="registrations" fill={COLOR_PRIMARY} radius={[4, 4, 0, 0]} barSize={40} fillOpacity={0.8} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card 
            title={<span style={{ fontWeight: 800, letterSpacing: '0.5px', fontSize: '0.75rem', color: p.textDim }}>REVENUE vs TIME (STREAMS)</span>} 
            className="admin-stat-card chart-container" 
            bordered={false}
          >
            <div style={{ height: 300, width: '100%', marginTop: 10 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLOR_SUCCESS} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={COLOR_SUCCESS} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={p.border} />
                  <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} tick={{ fill: p.textMuted }} />
                  <YAxis fontSize={10} axisLine={false} tickLine={false} tick={{ fill: p.textMuted }} />
                  <ChartTooltip 
                    contentStyle={{ backgroundColor: p.card, border: `1px solid ${p.border}`, borderRadius: 8 }}
                    itemStyle={{ color: COLOR_SUCCESS, fontWeight: 700 }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke={COLOR_SUCCESS} strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[20, 20]} style={{ marginBottom: 28 }}>
        <Col xs={24} md={12}>
          <Card 
            title={<span style={{ fontWeight: 800, letterSpacing: '0.5px', fontSize: '0.75rem', color: p.textDim }}>PARTICIPANTS BY EVENT TYPE</span>} 
            className="admin-stat-card" 
            bordered={false}
            style={{ height: '100%' }}
          >
            <div style={{ height: 320, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={95}
                    paddingAngle={8}
                    dataKey="value"
                    animationDuration={800}
                  >
                    {pieData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={[COLOR_PRIMARY, COLOR_SUCCESS, COLOR_ACCENT, '#8b5cf6', '#3b82f6', '#f59e0b', '#ec4899'][index % 7]} stroke="none" />
                    ))}
                  </Pie>
                  <ChartTooltip 
                     contentStyle={{ backgroundColor: p.card, border: `1px solid ${p.border}`, borderRadius: 8, boxShadow: '0 10px 25px rgba(0,0,0,0.3)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ marginTop: -10, width: '100%' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px 16px', paddingBottom: 10 }}>
                  {pieData.map((entry, index) => {
                    const total = pieData.reduce((a, b) => a + b.value, 0);
                    const percent = total > 0 ? ((entry.value / total) * 100).toFixed(1) : '0.0';
                    return (
                      <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.7rem', fontWeight: 600 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: [COLOR_PRIMARY, COLOR_SUCCESS, COLOR_ACCENT, '#8b5cf6', '#3b82f6', '#f59e0b', '#ec4899'][index % 7] }}></div>
                        <span style={{ color: p.textDim }}>{entry.name}</span>
                        <span style={{ color: p.text }}>{entry.value}</span>
                        <span style={{ color: p.textMuted, fontSize: '0.65rem' }}>({percent}%)</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card 
            title={<span style={{ fontWeight: 800, letterSpacing: '0.5px', fontSize: '0.75rem', color: p.textDim }}>TOP PERFORMING EVENTS</span>} 
            className="admin-stat-card" 
            bordered={false} 
            style={{ height: '100%' }}
          >
            <div style={{ marginTop: 10 }}>
              {topEvents.map((ev, i) => (
                <div key={i} style={{ marginBottom: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text strong style={{ fontSize: '0.8rem', opacity: 0.9 }}>{ev.title}</Text>
                    <Text style={{ fontSize: '0.75rem', color: p.textDim }}>{ev.count} Reg.</Text>
                  </div>
                  <Progress 
                    percent={ev.percent} 
                    size="small" 
                    strokeColor={ev.color} 
                    trailColor={p.border} 
                    strokeWidth={8} 
                    format={pct => <span style={{ fontSize: '0.7rem', color: p.textDim }}>{pct}%</span>}
                  />
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
