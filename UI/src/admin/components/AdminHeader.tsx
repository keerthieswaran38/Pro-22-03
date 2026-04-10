import React from 'react';
import { Layout, Button, Avatar, Dropdown, Space } from 'antd';
import {
  LogoutOutlined, HomeOutlined, UserOutlined, BulbOutlined, BulbFilled,
  MenuFoldOutlined, MenuUnfoldOutlined
} from '@ant-design/icons';
import { BRAND_GRADIENT, COLOR_PRIMARY } from '../../shared/theme';

interface AdminHeaderProps {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  mode: string;
  toggleMode: () => void;
  pal: any;
  userEmail: string;
  handleLogout: () => void;
}

export default function AdminHeader({
  collapsed,
  setCollapsed,
  mode,
  toggleMode,
  pal,
  userEmail,
  handleLogout
}: AdminHeaderProps) {
  const { Header } = Layout;
  const userMenuItems = [
    { key: 'logout', icon: <LogoutOutlined />, label: 'Logout', danger: true, onClick: handleLogout },
  ];

  return (
    <Header style={{
      background: pal.surface,
      borderBottom: `1px solid ${pal.border}`,
      padding: '0 24px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      height: 56, position: 'sticky', top: 0, zIndex: 50,
    }}>
      <Button
        type="text"
        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        onClick={() => setCollapsed(!collapsed)}
        style={{ color: pal.textDim, fontSize: 18 }}
      />
      <Space size="middle">
        <Button
          type="text"
          icon={mode === 'dark' ? <BulbOutlined /> : <BulbFilled />}
          onClick={toggleMode}
          style={{ color: mode === 'dark' ? '#F1C40F' : COLOR_PRIMARY }}
          title={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}
        />
        <Button
          type="text"
          icon={<HomeOutlined />}
          onClick={() => { window.location.href = '/'; }}
          style={{ color: pal.textDim, fontWeight: 600, fontSize: '0.85rem' }}
        >
          Back to Site
        </Button>
        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
          <Space style={{ cursor: 'pointer' }}>
            <Avatar
              size={32}
              icon={<UserOutlined />}
              style={{ background: BRAND_GRADIENT }}
            />
            <span style={{ color: pal.textDim, fontSize: '0.8rem', fontWeight: 500 }}>
              {userEmail}
            </span>
          </Space>
        </Dropdown>
      </Space>
    </Header>
  );
}
