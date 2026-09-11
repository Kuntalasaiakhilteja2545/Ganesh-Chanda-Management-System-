import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import GoldenParticlesCanvas from '../components/cinematic/GoldenParticlesCanvas';
import CinematicGaneshaHero from '../components/cinematic/CinematicGaneshaHero';
import {
  Lock,
  User,
  Languages,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  Phone,
  UserPlus,
  LogIn,
  ArrowLeft,
  KeyRound,
  HelpCircle,
} from 'lucide-react';

export default function Login() {
  // Mode state: 'login' | 'register' | 'forgot'
  const [mode, setMode] = useState('login');

  // Forgot sub-mode: 'password' | 'username'
  const [forgotTab, setForgotTab] = useState('password');

  // Forgot password step: 'verify' | 'reset'
  const [forgotStep, setForgotStep] = useState('verify');

  // Login & Register Form fields
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [associationName, setAssociationName] = useState('');
  const [role, setRole] = useState('ADMIN');

  // Forgot form fields
  const [forgotMobile, setForgotMobile] = useState('');
  const [forgotUsername, setForgotUsernameField] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [recoveredUsername, setRecoveredUsername] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Cinematic step: set to 3 so Ganesha image, title, and login card are immediately visible on load
  const [step, setStep] = useState(3);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const { login, register, forgotUsername: forgotUsernameApi, resetPassword } = useAuth();
  const { lang, toggleLanguage, t } = useLanguage();
  const { success: showToastSuccess } = useToast();
  const navigate = useNavigate();

  // Track mouse coordinates for 3D parallax
  const handleMouseMove = (e) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  // Reset forgot-flow state when switching modes
  const switchToForgot = () => {
    setMode('forgot');
    setForgotTab('password');
    setForgotStep('verify');
    setError('');
    setSuccessMsg('');
    setRecoveredUsername('');
    setForgotMobile('');
    setForgotUsernameField('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const switchToLogin = () => {
    setMode('login');
    setError('');
    setSuccessMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        await login(username, password);
        setIsSuccess(true);
        showToastSuccess('✓ Login Successful! Welcome to Ganesh Chanda.');
      } else {
        // Register Mode
        if (!fullName.trim()) {
          setError('Please enter your full name.');
          setIsSubmitting(false);
          return;
        }
        await register({
          username: username.trim(),
          password: password,
          full_name: fullName.trim(),
          mobile_number: mobileNumber.trim(),
          association_name: associationName.trim() || 'Ganesh Youth Association',
          role: role,
        });
        setIsSuccess(true);
        showToastSuccess('✓ Account Registered Successfully! Welcome to Ganesh Chanda.');
      }

      setTimeout(() => {
        navigate('/dashboard');
      }, 700);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.detail ||
        JSON.stringify(err.response?.data) ||
        'Authentication failed. Please check details.'
      );
      setIsSubmitting(false);
    }
  };

  // Handle forgot username submission
  const handleForgotUsername = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setRecoveredUsername('');
    setIsSubmitting(true);

    try {
      const data = await forgotUsernameApi(forgotMobile.trim());
      setRecoveredUsername(data.username);
      setSuccessMsg(
        lang === 'te'
          ? `మీ యూజర్‌నేమ్: ${data.username}`
          : `Your username is: ${data.username}`
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'No account found with this mobile number.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle forgot password — Step 1: verify identity
  const handleVerifyIdentity = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    if (!forgotUsername.trim() || !forgotMobile.trim()) {
      setError('Both username and mobile number are required.');
      setIsSubmitting(false);
      return;
    }

    // Move to step 2 (we verify during the actual reset call)
    setForgotStep('reset');
    setIsSubmitting(false);
  };

  // Handle forgot password — Step 2: set new password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setIsSubmitting(true);

    if (newPassword !== confirmPassword) {
      setError(
        lang === 'te'
          ? 'పాస్‌వర్డ్‌లు సరిపోలడం లేదు.'
          : 'Passwords do not match.'
      );
      setIsSubmitting(false);
      return;
    }

    try {
      const data = await resetPassword(
        forgotUsername.trim(),
        forgotMobile.trim(),
        newPassword
      );
      setSuccessMsg(
        lang === 'te'
          ? '✓ పాస్‌వర్డ్ రీసెట్ అయింది! ఇప్పుడు సైన్ ఇన్ చేయండి.'
          : '✓ Password reset successfully! You can now sign in.'
      );
      showToastSuccess('✓ Password reset successfully!');

      // Auto-switch back to login after 2 seconds
      setTimeout(() => {
        switchToLogin();
        setUsername(forgotUsername.trim());
      }, 2000);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Reset failed. Please check your details.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const isGaneshVisible = step >= 1 || skipped;
  const isTitleVisible = step >= 2 || skipped;
  const isCardVisible = step >= 3 || skipped;

  // ─── Render the FORGOT RECOVERY card content ───
  const renderForgotCard = () => (
    <>
      {/* Back to Sign In */}
      <button
        type="button"
        onClick={switchToLogin}
        className="flex items-center gap-1.5 text-xs font-bold text-amber-400/80 hover:text-amber-300 mb-4 cursor-pointer transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>{lang === 'te' ? 'సైన్ ఇన్‌కు తిరిగి వెళ్ళండి' : 'Back to Sign In'}</span>
      </button>

      {/* Forgot Tab Switcher: Password | Username */}
      <div className="flex bg-black/60 p-1 rounded-2xl border border-amber-500/20 mb-5">
        <button
          type="button"
          onClick={() => {
            setForgotTab('password');
            setForgotStep('verify');
            setError('');
            setSuccessMsg('');
          }}
          className={`flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            forgotTab === 'password'
              ? 'bg-gradient-to-r from-amber-700 to-orange-600 text-white shadow-md'
              : 'text-amber-200/60 hover:text-amber-200'
          }`}
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>{lang === 'te' ? 'పాస్‌వర్డ్ రీసెట్' : 'Reset Password'}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setForgotTab('username');
            setError('');
            setSuccessMsg('');
            setRecoveredUsername('');
          }}
          className={`flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            forgotTab === 'username'
              ? 'bg-gradient-to-r from-amber-700 to-orange-600 text-white shadow-md'
              : 'text-amber-200/60 hover:text-amber-200'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>{lang === 'te' ? 'యూజర్‌నేమ్ తెలుసుకోండి' : 'Find Username'}</span>
        </button>
      </div>

      {/* Error / Success Messages */}
      {error && (
        <div className="p-3 rounded-2xl bg-rose-950/80 border border-rose-600/40 text-rose-200 text-xs flex items-center gap-2.5 mb-3 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2.5 mb-3 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span className="font-bold">{successMsg}</span>
        </div>
      )}

      {/* ─── FORGOT PASSWORD TAB ─── */}
      {forgotTab === 'password' && forgotStep === 'verify' && (
        <form className="space-y-3.5" onSubmit={handleVerifyIdentity}>
          <p className="text-xs text-amber-200/70 font-medium leading-relaxed">
            {lang === 'te'
              ? 'మీ యూజర్‌నేమ్ మరియు రిజిస్టర్ చేసిన మొబైల్ నంబర్ నమోదు చేయండి.'
              : 'Enter your username and registered mobile number to verify your identity.'}
          </p>

          {/* Username */}
          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-amber-200/80 mb-1">
              {lang === 'te' ? 'యూజర్‌నేమ్' : 'Username'} *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-amber-400/60">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={forgotUsername}
                onChange={(e) => setForgotUsernameField(e.target.value)}
                placeholder="e.g. ramesh123"
                className="block w-full pl-10 pr-4 py-2.5 bg-black/50 border border-amber-500/25 rounded-xl text-sm font-medium text-amber-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-400 transition-all shadow-inner"
              />
            </div>
          </div>

          {/* Mobile Number */}
          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-amber-200/80 mb-1">
              {lang === 'te' ? 'రిజిస్టర్డ్ మొబైల్ నంబర్' : 'Registered Mobile Number'} *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-amber-400/60">
                <Phone className="w-4 h-4" />
              </div>
              <input
                type="tel"
                required
                value={forgotMobile}
                onChange={(e) => setForgotMobile(e.target.value)}
                placeholder="e.g. 9876543210"
                className="block w-full pl-10 pr-4 py-2.5 bg-black/50 border border-amber-500/25 rounded-xl text-sm font-mono text-amber-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-400 transition-all shadow-inner"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl shadow-lg shadow-amber-950/60 text-sm font-extrabold text-white bg-gradient-to-r from-amber-700 via-orange-600 to-amber-600 hover:from-amber-600 hover:to-orange-500 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all transform hover:-translate-y-0.5 active:scale-98 disabled:opacity-50 cursor-pointer border border-amber-400/30"
          >
            <span>{isSubmitting ? 'Verifying...' : lang === 'te' ? 'తదుపరి → కొత్త పాస్‌వర్డ్ సెట్ చేయండి' : 'Next → Set New Password'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      )}

      {forgotTab === 'password' && forgotStep === 'reset' && (
        <form className="space-y-3.5" onSubmit={handleResetPassword}>
          <div className="p-2.5 rounded-xl bg-amber-950/60 border border-amber-500/20 text-xs text-amber-200/80 font-medium">
            <span className="text-amber-400 font-bold">{lang === 'te' ? 'గుర్తింపు:' : 'Identity:'}</span>{' '}
            {forgotUsername} • {forgotMobile}
            <button
              type="button"
              onClick={() => {
                setForgotStep('verify');
                setError('');
                setSuccessMsg('');
              }}
              className="ml-2 text-amber-400 hover:text-amber-300 underline cursor-pointer"
            >
              {lang === 'te' ? 'మార్చండి' : 'Change'}
            </button>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-amber-200/80 mb-1">
              {lang === 'te' ? 'కొత్త పాస్‌వర్డ్' : 'New Password'} *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-amber-400/60">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showNewPassword ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="block w-full pl-10 pr-11 py-2.5 bg-black/50 border border-amber-500/25 rounded-xl text-sm font-medium text-amber-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-400 transition-all shadow-inner font-mono"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-amber-400/60 hover:text-amber-300 cursor-pointer"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-amber-200/80 mb-1">
              {lang === 'te' ? 'పాస్‌వర్డ్ నిర్ధారించండి' : 'Confirm Password'} *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-amber-400/60">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showNewPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="block w-full pl-10 pr-4 py-2.5 bg-black/50 border border-amber-500/25 rounded-xl text-sm font-medium text-amber-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-400 transition-all shadow-inner font-mono"
              />
            </div>
            {newPassword && confirmPassword && newPassword !== confirmPassword && (
              <p className="text-[11px] text-rose-400 mt-1 font-semibold">
                {lang === 'te' ? 'పాస్‌వర్డ్‌లు సరిపోలడం లేదు' : 'Passwords do not match'}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || (newPassword && confirmPassword && newPassword !== confirmPassword)}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl shadow-lg shadow-amber-950/60 text-sm font-extrabold text-white bg-gradient-to-r from-amber-700 via-orange-600 to-amber-600 hover:from-amber-600 hover:to-orange-500 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all transform hover:-translate-y-0.5 active:scale-98 disabled:opacity-50 cursor-pointer border border-amber-400/30"
          >
            <KeyRound className="w-4 h-4" />
            <span>{isSubmitting ? 'Resetting...' : lang === 'te' ? 'పాస్‌వర్డ్ రీసెట్ చేయండి' : 'Reset Password'}</span>
          </button>
        </form>
      )}

      {/* ─── FORGOT USERNAME TAB ─── */}
      {forgotTab === 'username' && (
        <form className="space-y-3.5" onSubmit={handleForgotUsername}>
          <p className="text-xs text-amber-200/70 font-medium leading-relaxed">
            {lang === 'te'
              ? 'మీరు రిజిస్టర్ చేసిన మొబైల్ నంబర్ నమోదు చేయండి. మీ యూజర్‌నేమ్ చూపించబడుతుంది.'
              : 'Enter your registered mobile number. Your username will be displayed.'}
          </p>

          {/* Mobile Number */}
          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-amber-200/80 mb-1">
              {lang === 'te' ? 'రిజిస్టర్డ్ మొబైల్ నంబర్' : 'Registered Mobile Number'} *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-amber-400/60">
                <Phone className="w-4 h-4" />
              </div>
              <input
                type="tel"
                required
                value={forgotMobile}
                onChange={(e) => setForgotMobile(e.target.value)}
                placeholder="e.g. 9876543210"
                className="block w-full pl-10 pr-4 py-2.5 bg-black/50 border border-amber-500/25 rounded-xl text-sm font-mono text-amber-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-400 transition-all shadow-inner"
              />
            </div>
          </div>

          {/* Recovered Username Display */}
          {recoveredUsername && (
            <div className="p-3.5 rounded-2xl bg-amber-950/70 border border-amber-500/30 text-center animate-in fade-in">
              <p className="text-[11px] text-amber-200/70 font-bold uppercase tracking-wider mb-1">
                {lang === 'te' ? 'మీ యూజర్‌నేమ్' : 'Your Username'}
              </p>
              <p className="text-xl font-black text-amber-300 font-mono tracking-widest">
                {recoveredUsername}
              </p>
              <p className="text-[10px] text-amber-200/50 mt-1">
                {lang === 'te' ? '(భద్రత కోసం పాక్షికంగా మాస్క్ చేయబడింది)' : '(Partially masked for security)'}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl shadow-lg shadow-amber-950/60 text-sm font-extrabold text-white bg-gradient-to-r from-amber-700 via-orange-600 to-amber-600 hover:from-amber-600 hover:to-orange-500 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all transform hover:-translate-y-0.5 active:scale-98 disabled:opacity-50 cursor-pointer border border-amber-400/30"
          >
            <span>{isSubmitting ? 'Searching...' : lang === 'te' ? 'యూజర్‌నేమ్ కనుగొనండి' : 'Find My Username'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Quick link: go to reset password with the found username */}
          {recoveredUsername && (
            <button
              type="button"
              onClick={() => {
                setForgotTab('password');
                setForgotStep('verify');
                setError('');
                setSuccessMsg('');
              }}
              className="w-full text-center text-xs text-amber-400/80 hover:text-amber-300 font-bold cursor-pointer mt-1 underline"
            >
              {lang === 'te' ? '🔑 ఇప్పుడు పాస్‌వర్డ్ రీసెట్ చేయాలా?' : '🔑 Now reset your password?'}
            </button>
          )}
        </form>
      )}
    </>
  );

  return (
    <div
      onMouseMove={handleMouseMove}
      className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-10 bg-[#070204] text-slate-100 relative overflow-hidden select-none font-sans"
    >
      {/* 1. Deep Temple Atmospheric Background with Burgundy & Amber Shadows */}
      <div className="absolute inset-0 bg-radial from-[#1e070d] via-[#0d0306] to-[#040102] pointer-events-none" />

      {/* 2. Temple Pillars & Carved Arch Silhouettes in Deep Shadow */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute -left-12 top-0 bottom-0 w-36 bg-gradient-to-r from-black via-[#1c080e] to-transparent border-r border-amber-900/20" />
        <div className="absolute -right-12 top-0 bottom-0 w-36 bg-gradient-to-l from-black via-[#1c080e] to-transparent border-l border-amber-900/20" />
        <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-amber-950/30 to-transparent" />
      </div>

      {/* 3. Golden Dust & Temple Particles at 60fps */}
      <GoldenParticlesCanvas count={70} active={true} />

      {/* 4. Top Header Controls: Language Toggle */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-8 z-50 flex items-center gap-2.5">
        <button
          onClick={toggleLanguage}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold text-amber-300 bg-black/70 hover:bg-black/90 border border-amber-500/35 rounded-xl backdrop-blur-md transition-all cursor-pointer shadow-xl hover:scale-105"
        >
          <Languages className="w-3.5 h-3.5 text-amber-400" />
          <span>{lang === 'en' ? 'తెలుగు' : 'English'}</span>
        </button>
      </div>

      {/* 5. Main Dual-Column Showcase Layout */}
      <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center z-20 py-4">
        {/* LEFT COLUMN: Majestic 3D Devotional Lord Ganesha Hero */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center text-center">
          <CinematicGaneshaHero
            isRevealed={isGaneshVisible}
            isBlessing={isSuccess || isSubmitting}
            mousePos={mousePos}
          />

          {/* Title & Branding */}
          <div className="mt-4 space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-amber-950/80 border border-amber-500/30 rounded-full text-xs font-bold text-amber-300 shadow-md">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{lang === 'te' ? 'గణేష్ చందా మేనేజ్‌మెంట్ సిస్టమ్' : 'Ganesh Chanda Management System'}</span>
            </div>

            <h1 className="heading-font text-3xl sm:text-4xl font-black bg-gradient-to-r from-yellow-200 via-amber-300 to-orange-400 bg-clip-text text-transparent tracking-tight">
              {lang === 'te' ? 'గణేష్ చందా మేనేజ్‌మెంట్ సిస్టమ్' : 'GANESH CHANDA MANAGEMENT SYSTEM'}
            </h1>

            <h2 className="text-xs sm:text-sm font-black uppercase tracking-widest text-amber-200/90 font-mono">
              {lang === 'te' ? 'గణేష్ చందా & ఉత్సవ నిర్వహణ' : 'GANESH CHANDA & FESTIVAL MANAGEMENT'}
            </h2>

            <p className="text-xs text-amber-200/60 font-medium max-w-sm mx-auto">
              {lang === 'te'
                ? 'డిజిటల్ చందా • వేలం పాటలు • రసీదులు • పండుగ ఖజానా'
                : 'Digital Chanda • Velam Paata • Devotee Receipts • Treasury'}
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: Translucent Dark Burgundy & Gold Glassmorphic Card */}
        <div className="lg:col-span-6 flex justify-center">
          <div
            className={`w-full max-w-md bg-[#13060a]/90 backdrop-blur-2xl text-slate-100 p-6 sm:p-8 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.8)] border border-amber-500/30 relative overflow-hidden transition-all duration-700 transform ${
              isCardVisible
                ? 'opacity-100 translate-y-0 scale-100'
                : 'opacity-0 translate-y-12 scale-95 pointer-events-none'
            }`}
          >
            {/* Top Saffron/Gold Radiance Line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-900 via-amber-400 to-yellow-300 shadow-[0_0_15px_rgba(251,191,36,0.6)]" />

            {/* ─── FORGOT MODE ─── */}
            {mode === 'forgot' ? (
              renderForgotCard()
            ) : (
              <>
                {/* Mode Switcher Tabs (Sign In vs Register Account) */}
                <div className="flex bg-black/60 p-1 rounded-2xl border border-amber-500/20 mb-5">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setError('');
                    }}
                    className={`flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      mode === 'login'
                        ? 'bg-gradient-to-r from-amber-700 to-orange-600 text-white shadow-md'
                        : 'text-amber-200/60 hover:text-amber-200'
                    }`}
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>{lang === 'te' ? 'సైన్ ఇన్ (లాగిన్)' : 'Sign In'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMode('register');
                      setError('');
                    }}
                    className={`flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      mode === 'register'
                        ? 'bg-gradient-to-r from-amber-700 to-orange-600 text-white shadow-md'
                        : 'text-amber-200/60 hover:text-amber-200'
                    }`}
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>{lang === 'te' ? 'నమోదు చేయండి (Register)' : 'Register User'}</span>
                  </button>
                </div>

                <form className="space-y-3.5" onSubmit={handleSubmit}>
                  {error && (
                    <div className="p-3 rounded-2xl bg-rose-950/80 border border-rose-600/40 text-rose-200 text-xs flex items-center gap-2.5 animate-in fade-in">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                      <span className="font-semibold">{error}</span>
                    </div>
                  )}

                  {isSuccess && (
                    <div className="p-3 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2.5 animate-in fade-in">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                      <span className="font-bold">
                        {mode === 'login' ? '✓ Login Successful! Redirecting...' : '✓ Registration Successful! Redirecting...'}
                      </span>
                    </div>
                  )}

                  {/* Full Name field (Register Mode Only) */}
                  {mode === 'register' && (
                    <div className="animate-in fade-in duration-200">
                      <label className="block text-[11px] font-extrabold uppercase tracking-wider text-amber-200/80 mb-1">
                        {lang === 'te' ? 'పూర్తి పేరు' : 'Full Name'} *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-amber-400/60">
                          <User className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder={lang === 'te' ? 'మీ పేరు నమోదు చేయండి (e.g. Ramesh Reddy)' : 'e.g. Ramesh Reddy'}
                          className="block w-full pl-10 pr-4 py-2.5 bg-black/50 border border-amber-500/25 rounded-xl text-sm font-medium text-amber-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-400 transition-all shadow-inner"
                        />
                      </div>
                    </div>
                  )}

                  {/* Username Field */}
                  <div>
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-amber-200/80 mb-1">
                      {t('username')} *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-amber-400/60">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="e.g. ramesh123 / collector1"
                        className="block w-full pl-10 pr-4 py-2.5 bg-black/50 border border-amber-500/25 rounded-xl text-sm font-medium text-amber-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-400 transition-all shadow-inner"
                      />
                    </div>
                  </div>

                  {/* Mobile Number Field (Register Mode Only) */}
                  {mode === 'register' && (
                    <div className="animate-in fade-in duration-200">
                      <label className="block text-[11px] font-extrabold uppercase tracking-wider text-amber-200/80 mb-1">
                        {lang === 'te' ? 'మొబైల్ సంఖ్య' : 'Mobile Phone Number'}
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-amber-400/60">
                          <Phone className="w-4 h-4" />
                        </div>
                        <input
                          type="tel"
                          value={mobileNumber}
                          onChange={(e) => setMobileNumber(e.target.value)}
                          placeholder="e.g. 9876543210"
                          className="block w-full pl-10 pr-4 py-2.5 bg-black/50 border border-amber-500/25 rounded-xl text-sm font-mono text-amber-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-400 transition-all shadow-inner"
                        />
                      </div>
                    </div>
                  )}

                  {/* Youth Association / Committee Name Field (Register Mode Only) */}
                  {mode === 'register' && (
                    <div className="animate-in fade-in duration-200">
                      <label className="block text-[11px] font-extrabold uppercase tracking-wider text-amber-200/80 mb-1">
                        {lang === 'te' ? 'యువజన సంఘం / కమిటీ పేరు' : 'Youth Association / Committee Name'} *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-amber-400/60">
                          <Sparkles className="w-4 h-4 text-amber-400" />
                        </div>
                        <input
                          type="text"
                          required
                          value={associationName}
                          onChange={(e) => setAssociationName(e.target.value)}
                          placeholder="e.g. Sri Veera Bhadra Swamy Youth"
                          className="block w-full pl-10 pr-4 py-2.5 bg-black/50 border border-amber-500/25 rounded-xl text-sm font-medium text-amber-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-400 transition-all shadow-inner"
                        />
                      </div>
                    </div>
                  )}

                  {/* Role Selection (Register Mode Only) */}
                  {mode === 'register' && (
                    <div className="animate-in fade-in duration-200">
                      <label className="block text-[11px] font-extrabold uppercase tracking-wider text-amber-200/80 mb-1">
                        {lang === 'te' ? 'కమిటీ పాత్ర' : 'Committee Role / Designation'}
                      </label>
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="block w-full px-3.5 py-2.5 bg-black/50 border border-amber-500/25 rounded-xl text-sm font-bold text-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-400 transition-all"
                      >
                        <option value="COLLECTOR" className="bg-slate-900 text-white">Collector / చందా కలెక్టర్</option>
                        <option value="TREASURER" className="bg-slate-900 text-white">Treasurer / కోశాధికారి</option>
                        <option value="ADMIN" className="bg-slate-900 text-white">Admin Officer / అధ్యక్షుడు</option>
                      </select>
                    </div>
                  )}

                  {/* Password Field */}
                  <div>
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-amber-200/80 mb-1">
                      {t('password')} *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-amber-400/60">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="block w-full pl-10 pr-11 py-2.5 bg-black/50 border border-amber-500/25 rounded-xl text-sm font-medium text-amber-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-400 transition-all shadow-inner font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-amber-400/60 hover:text-amber-300 cursor-pointer"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Remember Me / Forgot Link / Security Badge */}
                  <div className="flex items-center justify-between text-xs text-amber-200/70 font-medium">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-3.5 h-3.5 rounded text-amber-600 focus:ring-amber-500 border-amber-500/40 bg-black/60 cursor-pointer"
                      />
                      <span>{lang === 'te' ? 'నన్ను గుర్తుంచుకో' : 'Remember session'}</span>
                    </label>

                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={switchToForgot}
                        className="text-[11px] text-amber-400/80 hover:text-amber-300 font-bold cursor-pointer hover:underline transition-colors"
                      >
                        {lang === 'te' ? 'పాస్‌వర్డ్ మర్చిపోయారా?' : 'Forgot Password?'}
                      </button>
                    )}

                    {mode !== 'login' && (
                      <span className="flex items-center gap-1 text-[11px] text-amber-400/80 font-bold">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Secure SSL</span>
                      </span>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting || isSuccess}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl shadow-lg shadow-amber-950/60 text-sm font-extrabold text-white bg-gradient-to-r from-amber-700 via-orange-600 to-amber-600 hover:from-amber-600 hover:to-orange-500 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all transform hover:-translate-y-0.5 active:scale-98 disabled:opacity-50 cursor-pointer border border-amber-400/30"
                  >
                    <span>
                      {isSubmitting
                        ? (lang === 'te' ? 'దయచేసి వేచి ఉండండి...' : 'Processing...')
                        : mode === 'login'
                        ? (lang === 'te' ? 'సైన్ ఇన్ (లాగిన్)' : 'Sign In')
                        : (lang === 'te' ? 'ఉచితంగా నమోదు చేసుకోండి' : 'Register Account')}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </>
            )}

            {/* Link to Public Transparency Portal */}
            <div className="mt-4 pt-3 border-t border-amber-500/20 text-center">
              <Link
                to="/public"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400/80 hover:text-amber-300 hover:underline"
              >
                <span>🌍 {lang === 'te' ? 'పబ్లిక్ చందా పోర్టల్ చూడండి' : 'View Public Devotee Portal'}</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
