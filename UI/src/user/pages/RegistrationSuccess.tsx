import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';

const RegistrationSuccess: React.FC<{ isTest?: boolean }> = ({ isTest }) => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const location = useLocation();
    const orderId = searchParams.get('orderId') || (isTest ? 'TEST-12345' : null);
    const reason = searchParams.get('reason');
    const isSuccess = window.location.hash.includes('success') || location.pathname.includes('success');
    const [countdown, setCountdown] = useState(5);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // 5-second countdown + auto-redirect on success
    useEffect(() => {
        if (!isSuccess || isTest) return;

        timerRef.current = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    if (timerRef.current) clearInterval(timerRef.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        // Auto-redirect after exactly 5 seconds
        const redirectTimer = setTimeout(() => {
            navigate('/');
        }, 5000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            clearTimeout(redirectTimer);
        };
    }, [isSuccess, navigate]);

    // Removed: console.log that exposed orderId in browser DevTools

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#030712',
            color: '#fff',
            fontFamily: 'Outfit, sans-serif',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {isTest && (
                <div style={{
                    position: 'fixed',
                    top: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#FF5F00',
                    color: '#fff',
                    padding: '8px 20px',
                    borderRadius: '100px',
                    fontSize: '0.75rem',
                    fontWeight: 900,
                    letterSpacing: '2px',
                    zIndex: 9999,
                    boxShadow: '0 10px 30px rgba(255, 95, 0, 0.4)'
                }}>
                    TEST MODE : AUTO-REDIRECT DISABLED
                </div>
            )}

            {/* Background glow effects */}
            <div style={{
                position: 'absolute',
                top: '15%', left: '10%',
                width: '40vw', height: '40vw',
                background: isSuccess
                    ? 'radial-gradient(circle, rgba(0, 200, 83, 0.08) 0%, transparent 70%)'
                    : 'radial-gradient(circle, rgba(239, 44, 44, 0.08) 0%, transparent 70%)',
                filter: 'blur(100px)',
                zIndex: 0
            }}></div>
            <div style={{
                position: 'absolute',
                bottom: '10%', right: '10%',
                width: '35vw', height: '35vw',
                background: 'radial-gradient(circle, rgba(255, 95, 0, 0.06) 0%, transparent 70%)',
                filter: 'blur(80px)',
                zIndex: 0
            }}></div>

            <div style={{
                textAlign: 'center',
                padding: '50px 60px',
                background: 'rgba(255,255,255,0.02)',
                borderRadius: '32px',
                border: `1px solid ${isSuccess ? 'rgba(0, 200, 83, 0.15)' : 'rgba(239, 44, 44, 0.15)'}`,
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                position: 'relative',
                zIndex: 1,
                maxWidth: '520px',
                margin: '0 1.5rem',
                boxShadow: isSuccess
                    ? '0 30px 80px rgba(0, 200, 83, 0.08)'
                    : '0 30px 80px rgba(239, 44, 44, 0.08)'
            }}>
                {/* Animated icon */}
                <div style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '50%',
                    background: isSuccess
                        ? 'linear-gradient(135deg, rgba(0, 200, 83, 0.15), rgba(0, 200, 83, 0.05))'
                        : 'linear-gradient(135deg, rgba(239, 44, 44, 0.15), rgba(239, 44, 44, 0.05))',
                    border: `2px solid ${isSuccess ? 'rgba(0, 200, 83, 0.3)' : 'rgba(239, 44, 44, 0.3)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 28px',
                    fontSize: '48px',
                    animation: 'scaleIn 0.8s cubic-bezier(0.19, 1, 0.22, 1) forwards'
                }}>
                    {isSuccess ? '✅' : '❌'}
                </div>

                <h1 style={{
                    fontSize: '28px',
                    fontWeight: 900,
                    marginBottom: '10px',
                    letterSpacing: '-0.5px',
                    background: isSuccess
                        ? 'linear-gradient(to right, #00C853, #69F0AE)'
                        : 'linear-gradient(to right, #ff4444, #ff6b6b)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>
                    {isSuccess ? 'Payment Successful!' : 'Payment Failed'}
                </h1>

                <p style={{
                    color: 'rgba(255,255,255,0.6)',
                    marginBottom: '8px',
                    fontSize: '1.05rem',
                    lineHeight: 1.6
                }}>
                    {isSuccess
                        ? 'Payment Successful! Your invoice will be sent to your registered Gmail shortly.'
                        : `The transaction was ${reason === 'Aborted' ? 'cancelled' : 'declined'}. Please try again.`
                    }
                </p>

                {isSuccess && orderId && (
                    <div style={{
                        display: 'inline-block',
                        background: 'rgba(255, 95, 0, 0.1)',
                        border: '1px solid rgba(255, 95, 0, 0.2)',
                        borderRadius: '12px',
                        padding: '10px 24px',
                        margin: '12px 0 20px',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        letterSpacing: '1px'
                    }}>
                        <span style={{ color: 'rgba(255,255,255,0.5)' }}>ORDER ID: </span>
                        <span style={{ color: '#FF5F00' }}>#{orderId}</span>
                    </div>
                )}

                {/* Countdown + Auto-redirect */}
                {isSuccess && (
                    <div style={{
                        margin: '16px 0 24px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '10px'
                    }}>
                        <div style={{
                            width: '52px',
                            height: '52px',
                            borderRadius: '50%',
                            border: '3px solid rgba(255, 95, 0, 0.2)',
                            borderTopColor: '#FF5F00',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.3rem',
                            fontWeight: 900,
                            color: '#FF5F00',
                            animation: countdown > 0 ? 'spin 1s linear infinite' : 'none',
                            position: 'relative'
                        }}>
                            <span style={{ animation: 'none', position: 'absolute' }}>{countdown}</span>
                        </div>
                        <p style={{
                            color: 'rgba(255,255,255,0.35)',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            letterSpacing: '2px',
                            textTransform: 'uppercase'
                        }}>
                            Redirecting to home...
                        </p>
                    </div>
                )}

                <button
                    onClick={() => navigate('/')}
                    style={{
                        padding: '14px 36px',
                        borderRadius: '14px',
                        background: isSuccess
                            ? 'linear-gradient(135deg, #FF5F00, #FF8C00)'
                            : '#ff4d00',
                        color: '#fff',
                        border: 'none',
                        fontWeight: 800,
                        fontSize: '0.85rem',
                        letterSpacing: '1.5px',
                        cursor: 'pointer',
                        transition: 'all 0.4s cubic-bezier(0.19, 1, 0.22, 1)',
                        boxShadow: '0 15px 40px rgba(255, 95, 0, 0.2)',
                        fontFamily: 'Outfit, sans-serif'
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
                        e.currentTarget.style.boxShadow = '0 20px 50px rgba(255, 95, 0, 0.35)';
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = '0 15px 40px rgba(255, 95, 0, 0.2)';
                    }}
                >
                    {isSuccess ? 'BACK TO HOME →' : 'TRY AGAIN →'}
                </button>
            </div>

            <style>{`
                @keyframes scaleIn {
                    0% { transform: scale(0.3); opacity: 0; }
                    50% { transform: scale(1.1); }
                    100% { transform: scale(1); opacity: 1; }
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default RegistrationSuccess;
