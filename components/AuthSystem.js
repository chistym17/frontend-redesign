// components/AuthSystem.js
import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../lib/authContext';

const AuthSystem = ({ initialMode = 'login' }) => {
  const { saveTokens } = useAuth();

  const [mode, setMode] = useState(initialMode); // 'login' or 'register'
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState({ type: '', text: '' });

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://176.9.16.194:5403/api";

  useEffect(() => {
    setErrors({});
    setMessage({ type: '', text: '' });
    setFormData({ name: '', email: '', password: '', confirmPassword: '' });
  }, [mode]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Please enter a valid email';

    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';

    if (mode === 'register') {
      if (!formData.name.trim()) newErrors.name = 'Name is required';
      if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';
      const payload = mode === 'login'
        ? { email: formData.email, password: formData.password }
        : { name: formData.name, email: formData.email, password: formData.password };

      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || `${mode} failed`);

      // Save tokens to context (which persists to localStorage)
      saveTokens(data.access_token, data.refresh_token);
      if (data.session_id != null) localStorage.setItem('session_id', String(data.session_id));

      setMessage({ type: 'success', text: mode === 'login' ? 'Login successful!' : 'Account created successfully!' });

      // Optional: redirect instead of reload if you have routing set up
      setTimeout(() => { window.location.href = "/"; }, 800);
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const popup = window.open(
      `${API_BASE}/auth/google/start`,
      'google-login',
      'width=500,height=600,scrollbars=yes,resizable=yes'
    );

    const handleMessage = (event) => {
      // The callback page posts from the API origin
      const apiOrigin = new URL(API_BASE).origin;
      if (event.origin !== apiOrigin) return;

      if (event.data?.type === 'oauth_result' && event.data?.provider === 'google') {
        try { popup?.close(); } catch { }
        const { data: tokenData } = event.data;

        saveTokens(tokenData.access_token, tokenData.refresh_token);
        if (tokenData.session_id != null) localStorage.setItem('session_id', String(tokenData.session_id));

        setMessage({ type: 'success', text: 'Google login successful!' });
        setTimeout(() => { window.location.href = "/"; }, 800);
        window.removeEventListener('message', handleMessage);
      }
    };

    window.addEventListener('message', handleMessage);

    const checkClosed = setInterval(() => {
      if (popup && popup.closed) {
        window.removeEventListener('message', handleMessage);
        clearInterval(checkClosed);
      }
    }, 1000);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  return (
    <div className="min-h-screen bg-[#141A21] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div
          className="rounded-3xl shadow-2xl overflow-hidden border"
          style={{
            background: 'rgba(255, 255, 255, 0.06)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderColor: 'rgba(255, 255, 255, 0.12)'
          }}
        >
          <div className="px-6 pt-6 pb-4 text-center">
            <div
              className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center border"
              style={{
                background: 'rgba(19, 245, 132, 0.12)',
                borderColor: 'rgba(19, 245, 132, 0.3)'
              }}
            >
              <User className="w-7 h-7" style={{ color: '#9EFBCD' }} />
            </div>
            <h2 className="text-xl font-bold text-white mb-1">
              {mode === 'login' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-white/70 text-xs">
              {mode === 'login' ? 'Sign in to continue' : 'Join and start your journey'}
            </p>
          </div>

          {message.text && (
            <div
              className="mx-6 mb-3 p-2.5 rounded-lg flex items-center gap-2 border"
              style={
                message.type === 'success'
                  ? { background: 'rgba(19, 245, 132, 0.12)', color: '#9EFBCD', borderColor: 'rgba(19, 245, 132, 0.3)' }
                  : { background: 'rgba(255, 86, 48, 0.12)', color: '#FFAC82', borderColor: 'rgba(255, 86, 48, 0.3)' }
              }
            >
              {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span className="text-[13px] font-medium">{message.text}</span>
            </div>
          )}

          <div className="px-6 pb-6">
            <div className="space-y-3">
              {mode === 'register' && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-white/70">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={`w-full pl-10 pr-3 py-2.5 rounded-lg text-sm text-white placeholder-white/50 focus:outline-none focus:ring-1 focus:ring-emerald-400/40 border`}
                      style={{
                        background: 'rgba(255, 255, 255, 0.06)',
                        borderColor: errors.name ? 'rgba(255, 86, 48, 0.3)' : 'rgba(255, 255, 255, 0.18)'
                      }}
                      placeholder="Enter your full name"
                    />
                    {errors.name && <p className="text-[11px] mt-1" style={{ color: '#FFAC82' }}><span className="inline-flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.name}</span></p>}
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-white/70">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 rounded-lg text-sm text-white placeholder-white/50 focus:outline-none focus:ring-1 focus:ring-emerald-400/40 border"
                    style={{
                      background: 'rgba(255, 255, 255, 0.06)',
                      borderColor: errors.email ? 'rgba(255, 86, 48, 0.3)' : 'rgba(255, 255, 255, 0.18)'
                    }}
                    placeholder="Enter your email"
                  />
                  {errors.email && <p className="text-[11px] mt-1" style={{ color: '#FFAC82' }}><span className="inline-flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.email}</span></p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-white/70">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 rounded-lg text-sm text-white placeholder-white/50 focus:outline-none focus:ring-1 focus:ring-emerald-400/40 border"
                    style={{
                      background: 'rgba(255, 255, 255, 0.06)',
                      borderColor: errors.password ? 'rgba(255, 86, 48, 0.3)' : 'rgba(255, 255, 255, 0.18)'
                    }}
                    placeholder="Enter your password"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  {errors.password && <p className="text-[11px] mt-1" style={{ color: '#FFAC82' }}><span className="inline-flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.password}</span></p>}
                </div>
              </div>

              {mode === 'register' && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-white/70">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 rounded-lg text-sm text-white placeholder-white/50 focus:outline-none focus:ring-1 focus:ring-emerald-400/40 border"
                      style={{
                        background: 'rgba(255, 255, 255, 0.06)',
                        borderColor: errors.confirmPassword ? 'rgba(255, 86, 48, 0.3)' : 'rgba(255, 255, 255, 0.18)'
                      }}
                      placeholder="Confirm your password"
                    />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white">
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    {errors.confirmPassword && <p className="text-[11px] mt-1" style={{ color: '#FFAC82' }}><span className="inline-flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.confirmPassword}</span></p>}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="w-full text-white py-2.5 rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50 border"
                style={{
                  background: 'rgba(19, 245, 132, 0.16)',
                  borderColor: 'rgba(19, 245, 132, 0.3)',
                  color: '#9EFBCD'
                }}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (<><span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span><ArrowRight className="w-4 h-4" /></>)}
              </button>
            </div>

            <div className="my-5 flex items-center">
              <div className="flex-1 border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.12)' }}></div>
              <span className="px-3 text-xs text-white/70">or</span>
              <div className="flex-1 border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.12)' }}></div>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full py-2.5 rounded-lg font-semibold flex items-center justify-center gap-2 border text-white/90 hover:text-white transition-colors"
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                borderColor: 'rgba(255, 255, 255, 0.18)'
              }}
            >
              <svg className="w-4 h-4" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12  s5.373-12,12-12c3.059,0,5.842,1.153,7.961,3.039l5.657-5.657C33.64,6.053,29.082,4,24,4C12.955,4,4,12.955,4,24  s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,16.108,18.961,12,24,12c3.059,0,5.842,1.153,7.961,3.039l5.657-5.657  C33.64,6.053,29.082,4,24,4C16.318,4,9.68,8.337,6.306,14.691z"/>
                <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.197l-6.191-5.238C29.142,35.664,26.715,36.7,24,36.7  c-5.196,0-9.616-3.317-11.282-7.946l-6.527,5.027C9.518,39.626,16.227,44,24,44z"/>
                <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.794,2.242-2.279,4.166-4.094,5.565  c0.001-0.001,0.002-0.001,0.003-0.002l6.191,5.238C36.996,39.281,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
              </svg>
              Continue with Google
            </button>

            <div className="mt-5 text-center">
              <p className="text-[13px] text-white/70">
                {mode === 'login' ? "Don't have an account?" : "Already have an account?"}
                <button
                  type="button"
                  onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                  className="ml-2 font-semibold hover:underline"
                  style={{ color: '#9EFBCD' }}
                >
                  {mode === 'login' ? 'Sign up' : 'Sign in'}
                </button>
              </p>
            </div>
          </div>
        </div>

        <div className="text-center mt-5">
          <p className="text-[11px] text-white/50">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthSystem;
