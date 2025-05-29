
import React from 'react';
import MikeLogo from './Logo';
import { User } from '../types';

interface AdminChoiceModalProps {
  user: User;
  onEnterAdminPanel: () => void;
  onEnterUserView: () => void;
  onLogout: () => void;
}

const AdminChoiceModal: React.FC<AdminChoiceModalProps> = ({ user, onEnterAdminPanel, onEnterUserView, onLogout }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-md text-center">
        <MikeLogo className="justify-center mb-6" size={36} />
        <h2 className="text-xl sm:text-2xl font-bold text-sky-600 dark:text-sky-400 mb-2">
          أهلاً بك يا مطوري عبدالله🐐 
        </h2>
        <p className="text-slate-600 dark:text-slate-300 mb-6 text-sm">
          تم تسجيل دخولك كـ <span className="font-semibold">{user.email || user.username}</span>. اختار من الاتي؟🕵️
        </p>
        <div className="space-y-3">
          <button
            onClick={onEnterAdminPanel}
            className="w-full p-3 bg-sky-500 hover:bg-sky-600 dark:bg-sky-600 dark:hover:bg-sky-700 text-white rounded-lg font-semibold transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800 focus:ring-sky-500"
          >
            ابي اخش للوحة التحكم👨‍💼
          </button>
          <button
            onClick={onEnterUserView}
            className="w-full p-3 bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white rounded-lg font-semibold transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800 focus:ring-green-500"
          >
            ابي اخش واستخدم الذكاء 🤖
          </button>
          <button
            onClick={onLogout}
            className="w-full p-3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-600 dark:hover:bg-slate-500 text-slate-700 dark:text-slate-200 rounded-lg font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-white dark:focus:ring-offset-slate-800 focus:ring-slate-400 mt-2"
          >
            ابسجل خروج 👍
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminChoiceModal;