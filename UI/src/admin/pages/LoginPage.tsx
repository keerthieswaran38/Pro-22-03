import React, { useState } from 'react';
import { Form, Input, Button, message } from 'antd';
import { LockOutlined, MailOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { login } from '../../shared/utils/auth';
import { logAction } from '../../shared/utils/auditLog';
import { loginSchema, zodToFieldErrors } from '../../shared/utils/schemas';

export default function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const onFinish = (values: any) => {
    // Zod validation
    const result = loginSchema.safeParse(values);
    if (!result.success) {
      setErrors(zodToFieldErrors(result.error));
      return;
    }
    setErrors({});
    setLoading(true);
    // Simulate network delay
    setTimeout(() => {
      if (login(result.data.email, result.data.password)) {
        logAction('LOGIN', 'Admin Panel', 'Admin signed in');
        navigate('/admin/dashboard');
      } else {
        message.error('Invalid email or password.');
      }
      setLoading(false);
    }, 400);
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-logo">
          <img
            src="/src/assets/images/logo.png" alt="Gagner Sports" style={{ height: 50 }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <div className="login-logo-text">GAGNER<span>ADMIN</span></div>
        </div>
        <p className="login-subtitle">Sign in to manage events and content.</p>

        <Form layout="vertical" onFinish={onFinish} size="large" autoComplete="off">
          <Form.Item
            name="email"
            validateStatus={errors.email ? 'error' : ''}
            help={errors.email && <span className="field-error">{errors.email}</span>}
          >
            <Input
              prefix={<MailOutlined style={{ color: '#6b7280' }} />}
              placeholder="admin@gagner.com"
              onChange={() => setErrors(prev => ({ ...prev, email: '' }))}
              style={{ background: 'rgba(0,0,0,0.4)', borderColor: 'rgba(255,255,255,0.08)', color: '#f0f0f0', borderRadius: 8, height: 48 }}
            />
          </Form.Item>
          <Form.Item
            name="password"
            validateStatus={errors.password ? 'error' : ''}
            help={errors.password && <span className="field-error">{errors.password}</span>}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#6b7280' }} />}
              placeholder="••••••••"
              onChange={() => setErrors(prev => ({ ...prev, password: '' }))}
              style={{ background: 'rgba(0,0,0,0.4)', borderColor: 'rgba(255,255,255,0.08)', color: '#f0f0f0', borderRadius: 8, height: 48 }}
            />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary" htmlType="submit" loading={loading} block
              className="btn-brand-gradient"
              style={{ height: 48, fontSize: '1rem', fontWeight: 800, letterSpacing: '2px', borderRadius: 8 }}
            >
              SIGN IN
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}
