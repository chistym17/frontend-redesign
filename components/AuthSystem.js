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
   
     
      <div
      className="min-h-screen flex items-center justify-center"
      style={{
        backgroundImage: "url('/images/wave.png')",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "bottom center",
        backgroundSize: "100% 65%", // 75% of container height
        backgroundColor: "#141A21",   // top 25% shows this color
      }}
    >

      <div className="w-full max-w-md mx-4">
        <div
          className="rounded-3xl shadow-2xl overflow-hidden border"
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderColor: 'rgba(255, 255, 255, 0.12)'
          }}
        >
          <div className="px-6 pt-6 pb-4 text-left">
     
            <h2 className="text-xl font-bold text-white mb-1">
              {mode === 'login' ? 'Welcome Back' : 'Join us and start your journey today'}
            </h2>
              <p className="text-[13px] text-[#919EAB]">
                {mode === 'login' ? "Don't have an account?" : "Already have an account?"}
                <button
                  type="button"
                  onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                  className="ml-2 font-semibold hover:underline"
                  style={{ color: '#13F584' }}
                >
                  {mode === 'login' ? 'Sign up' : 'Sign in'}
                </button>
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
                  <label className="text-[11px] font-semibold text-[#919EAB]">Full Name</label>
                  <div className="relative">
                   
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={`w-full pl-2 pr-3 py-2.5 rounded-lg text-sm text-white placeholder-white/50 focus:outline-none focus:ring-1 focus:ring-emerald-400/40 border`}
                      style={{
                        background: 'rgba(255, 255, 255, 0.00)',
                        borderColor: errors.name ? 'rgba(255, 86, 48, 0.3)' : 'rgba(255, 255, 255, 0.18)'
                      }}
                      placeholder="Enter your full name"
                    />
                    {errors.name && <p className="text-[11px] mt-1" style={{ color: '#FFAC82' }}><span className="inline-flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.name}</span></p>}
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[#919EAB]">Email Address</label>
                <div className="relative">
               
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full pl-2 pr-3 py-2.5 rounded-lg text-sm text-white placeholder-white/50 focus:outline-none focus:ring-1 focus:ring-emerald-400/40 border"
                    style={{
                      background: 'rgba(255, 255, 255, 0.00)',
                      borderColor: errors.email ? 'rgba(255, 86, 48, 0.3)' : 'rgba(255, 255, 255, 0.18)'
                    }}
                    placeholder="Enter your email"
                  />
                  {errors.email && <p className="text-[11px] mt-1" style={{ color: '#FFAC82' }}><span className="inline-flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.email}</span></p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[#919EAB]">Password</label>
                <div className="relative">
   
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="w-full pl-2 pr-10 py-2.5 rounded-lg text-sm text-white placeholder-white/50 focus:outline-none focus:ring-1 focus:ring-emerald-400/40 border"
                    style={{
                      background: 'rgba(255, 255, 255, 0.00)',
                      borderColor: errors.password ? 'rgba(255, 86, 48, 0.3)' : 'rgba(255, 255, 255, 0.18)'
                    }}
                    placeholder="Enter your password"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white">
                    {showPassword ? <svg width="24" height="24" viewBox="-1 -1 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 3L21 21" stroke="#919EAB" stroke-width="2" stroke-linecap="round"/>
                      <path d="M10.58 10.58C10.2147 10.9453 10.0037 11.4471 10 11.97C10 13.07 10.9 13.97 12 13.97C12.523 13.9663 13.0247 13.7553 13.39 13.39" stroke="#919EAB" stroke-width="2" stroke-linecap="round"/>
                      <path d="M6.7 6.7C4.8 7.9 3.4 9.7 2.7 12C3.46 14.58 5.32 16.73 7.78 18C8.88922 18.5616 10.1077 18.8952 11.36 18.98C14.18 18.82 16.65 17.5 18.3 15.3" stroke="#919EAB" stroke-width="2" stroke-linecap="round"/>
                      <path d="M12 6C12.7063 5.99715 13.4013 6.16207 14.03 6.48" stroke="#919EAB" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                    : <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9.75 12C9.75 11.4033 9.98705 10.831 10.409 10.409C10.831 9.98705 11.4033 9.75 12 9.75C12.5967 9.75 13.169 9.98705 13.591 10.409C14.0129 10.831 14.25 11.4033 14.25 12C14.25 12.5967 14.0129 13.169 13.591 13.591C13.169 14.0129 12.5967 14.25 12 14.25C11.4033 14.25 10.831 14.0129 10.409 13.591C9.98705 13.169 9.75 12.5967 9.75 12Z" fill="#919EAB"/>
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M2 12C2 13.64 2.425 14.191 3.275 15.296C4.972 17.5 7.818 20 12 20C16.182 20 19.028 17.5 20.725 15.296C21.575 14.192 22 13.639 22 12C22 10.36 21.575 9.809 20.725 8.704C19.028 6.5 16.182 4 12 4C7.818 4 4.972 6.5 3.275 8.704C2.425 9.81 2 10.361 2 12ZM12 8.25C11.0054 8.25 10.0516 8.64509 9.34835 9.34835C8.64509 10.0516 8.25 11.0054 8.25 12C8.25 12.9946 8.64509 13.9484 9.34835 14.6517C10.0516 15.3549 11.0054 15.75 12 15.75C12.9946 15.75 13.9484 15.3549 14.6517 14.6517C15.3549 13.9484 15.75 12.9946 15.75 12C15.75 11.0054 15.3549 10.0516 14.6517 9.34835C13.9484 8.64509 12.9946 8.25 12 8.25Z" fill="#919EAB"/>
                    </svg>
                    }
                  </button>
                  {errors.password && <p className="text-[11px] mt-1" style={{ color: '#FFAC82' }}><span className="inline-flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.password}</span></p>}
                </div>
              </div>

              {mode === 'register' && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-[#919EAB]">Confirm Password</label>
                  <div className="relative">
                  
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      className="w-full pl-2 pr-10 py-2.5 rounded-lg text-sm text-white placeholder-white/50 focus:outline-none focus:ring-1 focus:ring-emerald-400/40 border"
                      style={{
                        background: 'rgba(255, 255, 255, 0.00)',
                        borderColor: errors.confirmPassword ? 'rgba(255, 86, 48, 0.3)' : 'rgba(255, 255, 255, 0.18)'
                      }}
                      placeholder="Confirm your password"
                    />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white">
                      {showConfirmPassword ? <svg width="24" height="24" viewBox="-1 -1 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 3L21 21" stroke="#919EAB" stroke-width="2" stroke-linecap="round"/>
                        <path d="M10.58 10.58C10.2147 10.9453 10.0037 11.4471 10 11.97C10 13.07 10.9 13.97 12 13.97C12.523 13.9663 13.0247 13.7553 13.39 13.39" stroke="#919EAB" stroke-width="2" stroke-linecap="round"/>
                        <path d="M6.7 6.7C4.8 7.9 3.4 9.7 2.7 12C3.46 14.58 5.32 16.73 7.78 18C8.88922 18.5616 10.1077 18.8952 11.36 18.98C14.18 18.82 16.65 17.5 18.3 15.3" stroke="#919EAB" stroke-width="2" stroke-linecap="round"/>
                        <path d="M12 6C12.7063 5.99715 13.4013 6.16207 14.03 6.48" stroke="#919EAB" stroke-width="2" stroke-linecap="round"/>
                      </svg>
                      : <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9.75 12C9.75 11.4033 9.98705 10.831 10.409 10.409C10.831 9.98705 11.4033 9.75 12 9.75C12.5967 9.75 13.169 9.98705 13.591 10.409C14.0129 10.831 14.25 11.4033 14.25 12C14.25 12.5967 14.0129 13.169 13.591 13.591C13.169 14.0129 12.5967 14.25 12 14.25C11.4033 14.25 10.831 14.0129 10.409 13.591C9.98705 13.169 9.75 12.5967 9.75 12Z" fill="#919EAB"/>
                      <path fill-rule="evenodd" clip-rule="evenodd" d="M2 12C2 13.64 2.425 14.191 3.275 15.296C4.972 17.5 7.818 20 12 20C16.182 20 19.028 17.5 20.725 15.296C21.575 14.192 22 13.639 22 12C22 10.36 21.575 9.809 20.725 8.704C19.028 6.5 16.182 4 12 4C7.818 4 4.972 6.5 3.275 8.704C2.425 9.81 2 10.361 2 12ZM12 8.25C11.0054 8.25 10.0516 8.64509 9.34835 9.34835C8.64509 10.0516 8.25 11.0054 8.25 12C8.25 12.9946 8.64509 13.9484 9.34835 14.6517C10.0516 15.3549 11.0054 15.75 12 15.75C12.9946 15.75 13.9484 15.3549 14.6517 14.6517C15.3549 13.9484 15.75 12.9946 15.75 12C15.75 11.0054 15.3549 10.0516 14.6517 9.34835C13.9484 8.64509 12.9946 8.25 12 8.25Z" fill="#919EAB"/>
                      </svg>
                      }
                    </button>
                    {errors.confirmPassword && <p className="text-[11px] mt-1" style={{ color: '#FFAC82' }}><span className="inline-flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.confirmPassword}</span></p>}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="w-full text-white py-2.5 rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                style={{
                  background:
                    mode === "login"
                      ? "rgba(145, 158, 171, 0.32)" // login color
                      : "rgba(19, 245, 132, 0.16)", // sign up color
                  borderColor:
                    mode === "login"
                      ? "rgba(145, 158, 171, 0.45)"
                      : "rgba(19, 245, 132, 0.3)",
                  color:
                    mode === "login"
                      ? "#CED4DA"
                      : "#9EFBCD"
                }}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <span>{mode === "login" ? "Sign In" : "Create Account"}</span>
                )}
              </button>

            </div>

          <div className="my-5 flex items-center">
              <div
                className="flex-1 border-t border-dashed"
                style={{ borderColor: 'rgba(255, 255, 255, 0.12)' }}
              ></div>
              <span
              className="uppercase"
              style={{
                width: '40px',
                height: '18px',
                fontFamily: 'Public Sans, sans-serif',
                fontWeight: 700,
                fontSize: '12px',
                lineHeight: '18px',
                textAlign: 'center',
                color: '#919EAB',
                
              }}
            >
              OR
            </span>

              <div
                className="flex-1 border-t border-dashed"
                style={{ borderColor: 'rgba(255, 255, 255, 0.12)' }}
              ></div>
            </div>


            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full py-2.5 rounded-lg font-semibold flex items-center justify-center gap-2 border text-white/90 hover:text-white transition-colors"
              style={{
        
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

                {mode === 'register' && (
                <div className="text-center mt-5">
                  <p className="text-[11px] text-[#919EAB]">
                    By signing up, I agree to{" "}
                    <span className="underline cursor-pointer hover:text-white" style={{ color: '#13F584' }}>
                      terms of use
                    </span>{" "}
                    and{" "}
                    <span className="underline cursor-pointer hover:text-white" style={{ color: '#13F584' }}>
                      privacy policy
                    </span>.
                  </p>
                </div>
    )}

          </div>
        </div>

    
      </div>
    </div>
  );
};

export default AuthSystem;
