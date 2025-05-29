import React, { useState, useEffect } from 'react';
import { User } from '../types';
import MikeLogo from './Logo';
import { AI_NAME } from '../constants';


interface AuthFormProps {
  mode: 'login' | 'register';
  onAuth: (user: { email: string; username: string }) => void; 
  onToggleMode: () => void;
  onGuestMode: () => void; // New prop for guest mode
}

export default function AuthForm({ mode: initialMode, onAuth, onToggleMode, onGuestMode }: AuthFormProps): JSX.Element {
  const [view, setView] = useState<'login' | 'register' | 'forgotPassword'>(initialMode);
  const [emailOrUsername, setEmailOrUsername] = useState(''); 
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState(''); 
  const [error, setError] = useState('');

  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState('');


  useEffect(() => {
    setView(initialMode);
    setError('');
    setForgotPasswordMessage('');
    setForgotPasswordEmail('');
  }, [initialMode]);

  const clearFormFields = () => {
    setEmailOrUsername('');
    setPassword('');
    setDisplayName('');
    setForgotPasswordEmail('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!emailOrUsername.trim() || !password.trim()) {
      setError("الرجاء إدخال البريد الإلكتروني/اسم المستخدم وكلمة المرور.");
      return;
    }
    if (view === 'register' && !displayName.trim()) {
        setError("الرجاء إدخال اسم العرض (الاسم الذي سيظهر للآخرين).");
        return;
    }

    const storageKey = `mikeUser_${emailOrUsername.toLowerCase()}`; 

    if (view === 'register') {
      if (localStorage.getItem(storageKey)) {
        setError("هذا المعرف (بريد إلكتروني/اسم مستخدم) مسجل بالفعل. حاول تسجيل الدخول أو اختر معرفًا آخر.");
        return;
      }
      localStorage.setItem(storageKey, JSON.stringify({ id: emailOrUsername.toLowerCase(), username: displayName, email: emailOrUsername.toLowerCase(), password }));
      onAuth({ email: emailOrUsername.toLowerCase(), username: displayName });
      clearFormFields();
    } else { // Login mode
      const storedUserJson = localStorage.getItem(storageKey);
      if (!storedUserJson) {
        setError("المعرف (بريد إلكتروني/اسم مستخدم) غير موجود. هل أنت متأكد أنك سجلت؟");
        return;
      }
      const userData = JSON.parse(storedUserJson);
      if (userData.password !== password) {
        setError("كلمة المرور غير صحيحة.");
        return;
      }
      onAuth({ email: userData.email || userData.id, username: userData.username });
      clearFormFields();
    }
  };

  const handleForgotPasswordRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setForgotPasswordMessage('');
    if (!forgotPasswordEmail.trim()) {
      setForgotPasswordMessage("الرجاء إدخال البريد الإلكتروني المستخدم للتسجيل.");
      return;
    }
    setForgotPasswordMessage("إذا كان هذا البريد الإلكتروني مسجلاً لدينا، فقد تم إرسال إرشادات إعادة تعيين كلمة المرور إليه. يرجى التحقق من بريدك الإلكتروني (بما في ذلك مجلد الرسائل غير المرغوب فيها).");
  };

  const handleMainModeToggle = () => {
    clearFormFields();
    setError('');
    setForgotPasswordMessage('');
    onToggleMode(); 
  };


  if (view === 'forgotPassword') {
    return (
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-purple-500/20 p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <MikeLogo iconOnly={true} size={52} className="mb-3"/>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-700 dark:text-slate-200">نسيت كلمة المرور؟</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">لا تقلق، سنساعدك على استعادتها.</p>
        </div>
        {forgotPasswordMessage && <p className="mb-4 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 p-3 rounded-md">{forgotPasswordMessage}</p>}
        <form onSubmit={handleForgotPasswordRequest} className="space-y-4">
          <div>
            <label htmlFor="forgotPasswordEmail" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">بريدك الإلكتروني المسجل</label>
            <input
              id="forgotPasswordEmail"
              type="email"
              value={forgotPasswordEmail}
              onChange={(e) => setForgotPasswordEmail(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 bg-white/70 dark:bg-slate-700/70 text-sm"
              required
            />
          </div>
          <button type="submit" className="w-full p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800 focus:ring-indigo-500">
            إرسال طلب استعادة
          </button>
        </form>
        <button onClick={() => setView('login')} className="mt-4 text-sm text-indigo-600 dark:text-indigo-400 hover:underline w-full text-center">
          العودة لتسجيل الدخول
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-purple-500/30 p-6 sm:p-10 rounded-xl shadow-2xl w-full max-w-md">
      <div className="flex flex-col items-center mb-8">
        <MikeLogo iconOnly={true} size={52} className="mb-4" />
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100">
          {view === 'login' ? `مرحباً بعودتك إلى ${AI_NAME}!` : `انضم إلى ${AI_NAME}`}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
          {view === 'login' ? 'سجل دخولك لمتابعة محادثاتك.' : 'أنشئ حسابًا جديدًا لتجربة كاملة.'}
        </p>
      </div>

      {error && <p className="mb-4 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 p-3 rounded-md">{error}</p>}
      
      <form onSubmit={handleSubmit} className="space-y-5">
        {view === 'register' && (
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">اسم العرض (كيف نناديك؟)</label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 bg-white/70 dark:bg-slate-700/70 text-sm"
              required
              placeholder="مثلاً: أبو عبدالله"
            />
          </div>
        )}
        <div>
          <label htmlFor="emailOrUsername" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">البريد الإلكتروني أو اسم المستخدم</label>
          <input
            id="emailOrUsername"
            type="text" 
            value={emailOrUsername}
            onChange={(e) => setEmailOrUsername(e.target.value)}
            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 bg-white/70 dark:bg-slate-700/70 text-sm"
            required
            placeholder="user@example.com أو username123"
          />
        </div>
        <div>
          <div className="flex justify-between items-center mb-1">
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300">كلمة المرور</label>
            {view === 'login' && (
              <button type="button" onClick={() => setView('forgotPassword')} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">نسيت كلمة المرور؟</button>
            )}
          </div>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 bg-white/70 dark:bg-slate-700/70 text-sm"
            required
            placeholder="••••••••"
          />
        </div>
        <button 
            type="submit" 
            className="w-full p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800/80 focus:ring-indigo-500 text-base"
        >
          {view === 'login' ? 'تسجيل الدخول' : 'إنشاء حساب'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {view === 'login' ? 'ليس لديك حساب؟' : 'لديك حساب بالفعل؟'}
          <button onClick={handleMainModeToggle} className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline ml-1 rtl:mr-1 rtl:ml-0">
            {view === 'login' ? 'أنشئ حسابًا جديدًا' : 'سجل دخولك'}
          </button>
        </p>
      </div>
       <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700/50">
         <button 
            onClick={onGuestMode}
            className="w-full p-3 bg-slate-100/80 hover:bg-slate-200/80 dark:bg-slate-700/80 dark:hover:bg-slate-600/80 text-slate-700 dark:text-slate-200 rounded-lg font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800/80 focus:ring-slate-500 text-sm"
        >
            المتابعة كزائر (لاحقًا)
        </button>
      </div>
    </div>
  );
}