import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'antd';
import { RightOutlined } from '@ant-design/icons';

const modules = [
  {
    key: 'dms-galleries',
    title: 'Galleries',
    desc: 'Manage the 12-image "Moments Official" grid. Full CRUD for images & overlay text.',
  },
  {
    key: 'dms-logo',
    title: 'Logo Management',
    desc: 'Upload the master brand logo. Auto-syncs to Splash Screen, Navbar & Footer.',
  },
  {
    key: 'dms-contact',
    title: 'Contact Us',
    desc: 'Manage Address, Email & Phone. Changes reflect instantly in the Footer.',
  },
  {
    key: 'dms-sponsors',
    title: 'Sponsors',
    desc: 'Manage partner logos for the auto-scrolling carousel on the landing page.',
  },
];

export default function DMSHub() {
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, letterSpacing: 1 }}>
          Content & Asset DMS
        </h1>
        <p style={{ opacity: 0.6, marginTop: 4, fontSize: '0.9rem' }}>
          Digital Management System — All website content managed from one place.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {modules.map(m => (
          <div
            key={m.key}
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12,
              padding: '20px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.06)';
              (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.15)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.03)';
              (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.08)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 4px 0' }}>{m.title}</h3>
                <p style={{ opacity: 0.55, fontSize: '0.9rem', margin: 0 }}>{m.desc}</p>
              </div>
            </div>

            <Button 
              type="primary" 
              shape="round" 
              icon={<RightOutlined />} 
              iconPosition="end"
              size="large"
              style={{ fontWeight: 600, minWidth: 120 }}
              onClick={() => navigate(`/${m.key}`)}
            >
              Manage
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
