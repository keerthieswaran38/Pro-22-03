import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const PaymentStatusPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const orderId = searchParams.get('orderId');
    const isSuccess = window.location.hash.includes('registration-success');

    useEffect(() => {
        // Trigger a simple particles or confetti effect if success?
        console.log(`Payment Status for ${orderId}: ${isSuccess ? 'SUCCESS' : 'FAILED'}`);
    }, [isSuccess, orderId]);

    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#030712',
            color: '#fff',
            fontFamily: 'Outfit, sans-serif'
        }}>
            <div style={{
                textAlign: 'center',
                padding: '40px',
                background: 'rgba(255,255,255,0.02)',
                borderRadius: '24px',
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)'
            }}>
                <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: isSuccess ? 'rgba(34,197,94,0.1)' : 'rgba(239,44,44,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 24px',
                    fontSize: '40px'
                }}>
                    {isSuccess ? '✅' : '❌'}
                </div>
                <h1 style={{ fontSize: '32px', marginBottom: '12px' }}>
                    {isSuccess ? 'Registration Successful!' : 'Payment Failed'}
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '24px' }}>
                    {isSuccess 
                      ? `Your order ID is #${orderId}. Check your email for details.`
                      : 'The transaction was declined or cancelled. Please try again.'
                    }
                </p>
                <button 
                  onClick={() => navigate('/')}
                  style={{
                    padding: '12px 32px',
                    borderRadius: '12px',
                    background: '#ff4d00',
                    color: '#fff',
                    border: 'none',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'transform 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                    Back to Home
                </button>
            </div>
        </div>
    );
};

export default PaymentStatusPage;
