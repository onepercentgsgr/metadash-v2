'use client';

import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { api } from '../lib/api';

export default function RegisterPage() {
  const [name, setName]                     = useState('');
  const [email, setEmail]                   = useState('');
  const [password, setPassword]             = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError]                   = useState('');
  const [loading, setLoading]               = useState(false);
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) { setError('Las contraseñas no coinciden'); return; }
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return; }
    setLoading(true);
    try {
      const response = await api.register(email, password, name);
      if (response.access_token) {
        localStorage.setItem('token', response.access_token);
        router.push('/onboarding');
      } else {
        setError('Error al registrarse');
      }
    } catch (err) {
      const msg = err.message || '';
      setError(msg.includes('already registered') ? 'Este email ya está registrado' : msg || 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    width: '100%', background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.09)', borderRadius: 10,
    padding: '10px 14px', fontSize: 14, color: 'white', outline: 'none',
    fontFamily: 'inherit', transition: 'border-color 0.15s, background 0.15s',
    boxSizing: 'border-box',
  };

  const labelStyle = {
    display: 'block', fontSize: 11, fontWeight: 600,
    color: 'rgba(255,255,255,0.5)', marginBottom: 6,
    textTransform: 'uppercase', letterSpacing: '0.07em',
  };

  const onFocus = (e) => { e.target.style.borderColor = 'rgba(99,102,241,0.5)'; e.target.style.background = 'rgba(99,102,241,0.04)'; };
  const onBlur  = (e) => { e.target.style.borderColor = 'rgba(255,255,255,0.09)'; e.target.style.background = 'rgba(255,255,255,0.04)'; };

  return (
    <div className="min-h-screen flex font-sans" style={{ background: '#09090b' }}>

      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div style={{
          position: 'absolute', top: '-15%', right: '-10%',
          width: 700, height: 500,
          background: 'radial-gradient(ellipse,rgba(139,92,246,0.1) 0%,transparent 60%)',
        }} />
        <div style={{
          position: 'absolute', bottom: '-10%', left: '-5%',
          width: 500, height: 500,
          background: 'radial-gradient(circle,rgba(99,102,241,0.08) 0%,transparent 60%)',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.015) 1px,transparent 1px)',
          backgroundSize: '64px 64px',
        }} />
      </div>

      <div className="relative flex-1 flex flex-col items-center justify-center px-4 py-12">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%)',
            boxShadow: '0 0 28px rgba(99,102,241,0.45), inset 0 1px 0 rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 900, fontSize: 14, letterSpacing: '-0.02em',
            marginBottom: 16,
          }}>
            MD
          </div>
          <h1 style={{
            fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1,
            background: 'linear-gradient(135deg,#fff 40%,rgba(255,255,255,0.5) 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text', marginBottom: 8,
          }}>
            Crear cuenta
          </h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', fontWeight: 450 }}>
            14 días gratis · Sin tarjeta de crédito
          </p>
        </div>

        {/* Card */}
        <div style={{
          width: '100%', maxWidth: 420,
          background: 'rgba(22,22,26,0.8)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 20, padding: '32px',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)',
        }}>

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 10, padding: '10px 14px', marginBottom: 20,
              fontSize: 13, color: '#f87171',
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={labelStyle}>Nombre completo</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre" required style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={labelStyle}>Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com" required autoComplete="email" style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
              </div>
              <div>
                <label style={labelStyle}>Contraseña</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mín. 6 caracteres" required style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
              </div>
              <div>
                <label style={labelStyle}>Confirmar</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repetir" required style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
              </div>
            </div>

            <button type="submit" disabled={loading}
              style={{
                width: '100%', padding: '11px', marginTop: 8,
                background: loading ? 'rgba(99,102,241,0.4)' : 'linear-gradient(135deg,#4f46e5,#7c3aed)',
                border: 'none', borderRadius: 10, cursor: loading ? 'not-allowed' : 'pointer',
                color: 'white', fontWeight: 700, fontSize: 14, fontFamily: 'inherit',
                boxShadow: loading ? 'none' : '0 4px 20px rgba(79,70,229,0.4), inset 0 1px 0 rgba(255,255,255,0.15)',
                transition: 'all 0.15s', letterSpacing: '-0.01em',
              }}
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.boxShadow = '0 8px 28px rgba(79,70,229,0.55), inset 0 1px 0 rgba(255,255,255,0.15)'; }}
              onMouseLeave={(e) => { if (!loading) e.currentTarget.style.boxShadow = '0 4px 20px rgba(79,70,229,0.4), inset 0 1px 0 rgba(255,255,255,0.15)'; }}
            >
              {loading ? 'Creando cuenta...' : 'Crear cuenta gratis'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.2)', margin: '16px 0' }}>
            Al registrarte aceptás los términos de servicio y política de privacidad
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', fontWeight: 500 }}>o</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
          </div>

          <p style={{ textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
            ¿Ya tenés cuenta?{' '}
            <Link href="/login" style={{ color: '#a5b4fc', fontWeight: 600, textDecoration: 'none' }}>
              Iniciá sesión
            </Link>
          </p>
        </div>

        <p style={{ marginTop: 24, fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>
          © 2025 MetaDash · Todos los derechos reservados
        </p>
      </div>
    </div>
  );
}
