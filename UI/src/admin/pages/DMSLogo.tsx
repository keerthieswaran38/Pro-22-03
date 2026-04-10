import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, message, Spin } from 'antd';
import { ArrowLeftOutlined, SaveOutlined, CloudUploadOutlined } from '@ant-design/icons';
import { getDMSItems, upsertLogo, uploadImage, ContentBlock } from '../../shared/utils/storage';

export default function DMSLogo() {
  const navigate = useNavigate();
  const [currentLogo, setCurrentLogo] = useState<ContentBlock | null>(null);
  const [logoUrl, setLogoUrl] = useState('');
  const [title, setTitle] = useState('Gagner Sports');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchLogo = async () => {
    setLoading(true);
    try {
      const items = await getDMSItems('logo');
      if (Array.isArray(items) && items.length > 0) {
        setCurrentLogo(items[0]);
        setLogoUrl(items[0].imageUrl || '');
        setTitle(items[0].title || 'Gagner Sports');
      }
    } catch { message.error('Failed to load logo'); }
    setLoading(false);
  };

  useEffect(() => { fetchLogo(); }, []);

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadImage(file);
      setLogoUrl(url);
      message.success('Logo uploaded to Cloudinary CDN!');
    } catch (err: any) {
      message.error(err.message || 'Upload failed');
    }
    setUploading(false);
  };

  const handleSave = async () => {
    if (!logoUrl.trim()) { message.warning('Logo URL is required'); return; }
    setSaving(true);
    try {
      await upsertLogo(logoUrl.trim(), title.trim());
      message.success('✅ Logo updated! Changes are live on Splash, Navbar & Footer.');
      fetchLogo();
    } catch { message.error('Failed to update logo'); }
    setSaving(false);
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/dms')} type="text" style={{ fontWeight: 600 }}>
          Back to DMS
        </Button>
        <h2 style={{ margin: 0, fontWeight: 800, fontSize: '1.4rem' }}>🎨 Logo Management</h2>
      </div>

      {loading ? <Spin size="large" /> : (
        <div style={{ maxWidth: 600 }}>
          {/* Current Logo Preview */}
          <div style={{
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 16, padding: 32, textAlign: 'center', marginBottom: 28,
          }}>
            <p style={{ opacity: 0.5, fontSize: '0.8rem', marginBottom: 16, letterSpacing: 1 }}>CURRENT MASTER LOGO</p>
            {currentLogo?.imageUrl ? (
              <img
                src={currentLogo.imageUrl}
                alt="Current Logo"
                loading="lazy"
                style={{ maxHeight: 120, maxWidth: '80%', objectFit: 'contain' }}
                onError={e => { (e.target as HTMLImageElement).src = 'https://placehold.co/300x100/1a1a2e/ffffff?text=No+Logo'; }}
              />
            ) : (
              <div style={{ padding: 40, opacity: 0.3, fontSize: '0.9rem' }}>No logo uploaded yet</div>
            )}
          </div>

          {/* Form */}
          <div style={{
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12, padding: 24,
          }}>
            {/* File Upload */}
            <input
              type="file" ref={fileRef as any} accept="image/jpeg,image/png,image/webp,image/svg+xml,image/gif"
              style={{ display: 'none' }}
              onChange={e => { if (e.target.files?.[0]) handleFileUpload(e.target.files[0]); }}
            />
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                <Button icon={<CloudUploadOutlined />} loading={uploading} onClick={() => fileRef.current?.click()}
                  style={{ fontWeight: 600 }}>
                  {uploading ? 'Uploading...' : 'Upload Logo'}
                </Button>
                <span style={{ opacity: 0.4, fontSize: '0.78rem' }}>or paste URL below</span>
              </div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: 6 }}>Logo Image URL</label>
              <Input value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="https://example.com/logo.png" />
            </div>

            {/* Live Preview */}
            {logoUrl && (
              <div style={{
                marginBottom: 20, padding: 16, background: '#0a0a14', borderRadius: 8, textAlign: 'center',
              }}>
                <p style={{ opacity: 0.4, fontSize: '0.75rem', marginBottom: 8 }}>PREVIEW</p>
                <img
                  src={logoUrl}
                  alt="Preview"
                  loading="lazy"
                  style={{ maxHeight: 80, maxWidth: '90%', objectFit: 'contain' }}
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
            )}

            <Button
              type="primary"
              icon={<SaveOutlined />}
              size="large"
              loading={saving}
              disabled={uploading}
              onClick={handleSave}
              block
              style={{ fontWeight: 700, height: 48 }}
            >
              SAVE & SYNC GLOBALLY
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
