import React from 'react';
import { Layout, Menu} from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  DashboardOutlined, CalendarOutlined, FileImageOutlined,
  TeamOutlined, GiftOutlined, AuditOutlined, TrophyOutlined
} from '@ant-design/icons';
import { BRAND_GRADIENT } from '../../shared/theme';

const { Sider } = Layout;

interface AdminSidebarProps {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  selectedKey: string;
  pal: any;
  mode: string;
}

export default function AdminSidebar({ collapsed, setCollapsed, selectedKey, pal, mode }: AdminSidebarProps) {
  const navigate = useNavigate();

  const menuItems = [
    { key: 'dashboard',   icon: <DashboardOutlined />,   label: 'Dashboard' },
    { key: 'events',      icon: <CalendarOutlined />,    label: 'Events' },
    { key: 'leaderboard', icon: <TrophyOutlined />,      label: 'Leaderboard' },
    { key: 'content',     icon: <FileImageOutlined />,   label: 'Content CMS' },
    { key: 'participants',icon: <TeamOutlined />,        label: 'Participants' },
    { key: 'coupons',     icon: <GiftOutlined />,        label: 'Coupons' },
    { key: 'audit',       icon: <AuditOutlined />,       label: 'Audit Log' },
  ];

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={setCollapsed}
      trigger={null}
      width={260}
      collapsedWidth={72}
      style={{
        background: pal.sider,
        borderRight: `1px solid ${pal.border}`,
        overflow: 'auto',
        height: '100vh',
        position: 'fixed',
        left: 0, top: 0, bottom: 0,
        zIndex: 100,
        transition: 'all 0.2s cubic-bezier(.4,0,.2,1)',
      }}
    >
      <div
        style={{
          padding: collapsed ? '20px 12px' : '20px',
          display: 'flex', alignItems: 'center', gap: 12,
          borderBottom: `1px solid ${pal.border}`,
          marginBottom: 8,
          justifyContent: collapsed ? 'center' : 'flex-start',
          cursor: 'pointer',
          transition: 'padding 0.2s',
          minHeight: 76,
        }}
        onClick={() => navigate('/admin/dashboard')}
      >
        <img
          src="/src/assets/images/logo.png"
          alt="Gagner Sports"
          style={{ height: 36, width: 'auto', flexShrink: 0 }}
          onError={(e) => {
            const el = e.target as HTMLImageElement;
            el.style.display = 'none';
          }}
        />
        {!collapsed && (
          <div style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
            <div style={{
              fontWeight: 900, fontSize: '1rem', letterSpacing: '0.5px',
              background: BRAND_GRADIENT,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              lineHeight: 1.2,
            }}>GAGNER</div>
            <div style={{
              fontSize: '0.6rem', color: pal.textDim,
              letterSpacing: '2px', fontWeight: 500,
            }}>ADMIN PANEL</div>
          </div>
        )}
      </div>

      <Menu
        theme={mode === 'dark' ? 'dark' : 'light'}
        mode="inline"
        selectedKeys={[selectedKey]}
        onClick={({ key }) => navigate(`/admin/${key}`)}
        items={menuItems}
        style={{
          background: 'transparent',
          borderRight: 'none',
          fontWeight: 600,
          letterSpacing: '0.5px',
        }}
      />
    </Sider>
  );
}
