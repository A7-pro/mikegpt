
import React, { useState, useEffect } from 'react';
import MikeLogo from './Logo';
import { SYSTEM_INSTRUCTION, AI_NAME } from '../constants';
import { User, PersonalityTemplate, GlobalAnnouncement } from '../types';

interface AdminPanelProps {
  onSwitchToUserView: () => void;
  onLogout: () => void;
  currentUserEmail: string;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onSwitchToUserView, onLogout, currentUserEmail }) => {
  const [registeredUsers, setRegisteredUsers] = useState<User[]>([]);
  const [systemPrompt, setSystemPrompt] = useState<string>('');
  const [promptSaveStatus, setPromptSaveStatus] = useState<string>('');

  // Personality Templates States
  const [templates, setTemplates] = useState<PersonalityTemplate[]>([]);
  const [newTemplateName, setNewTemplateName] = useState<string>('');
  const [newTemplatePrompt, setNewTemplatePrompt] = useState<string>('');
  const [templateEditId, setTemplateEditId] = useState<string | null>(null); // For editing existing template

  // Announcement States
  const [announcementText, setAnnouncementText] = useState<string>('');
  const [announcementStatus, setAnnouncementStatus] = useState<string>('');


  useEffect(() => {
    // Load registered users
    const users: User[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('mikeUser_')) {
        try {
          const userData = JSON.parse(localStorage.getItem(key) || '{}') as User;
          if (userData.id || userData.email || userData.username) {
             users.push({
                id: userData.id || userData.email || 'N/A',
                username: userData.username || 'N/A',
                email: userData.email || (key.startsWith('mikeUser_') ? key.substring('mikeUser_'.length) : 'N/A'),
                profile: userData.profile,
                isAdmin: userData.isAdmin
             });
          }
        } catch (e) { console.error("Error parsing user data from localStorage:", e); }
      }
    }
    setRegisteredUsers(users);

    // Load current system prompt
    const savedPrompt = localStorage.getItem('mikeAdminSystemInstruction');
    setSystemPrompt(savedPrompt || SYSTEM_INSTRUCTION.replace("{USER_PROFILE_INFO_BLOCK}", ""));

    // Load personality templates
    loadPersonalityTemplates();
  }, []);

  const handleSaveSystemPrompt = (promptToSave?: string) => {
    const finalPrompt = promptToSave || systemPrompt;
    localStorage.setItem('mikeAdminSystemInstruction', finalPrompt);
    setPromptSaveStatus('تم حفظ شخصية مايك بنجاح! سيتم تطبيقها في المحادثات الجديدة أو بعد إعادة تعيين المحادثة الحالية.');
    // Dispatch a global event that App.tsx or geminiService can listen to
    window.dispatchEvent(new CustomEvent('systemPromptAdminUpdate', { detail: finalPrompt }));
    setTimeout(() => setPromptSaveStatus(''), 3000);
  };

  // --- Personality Templates Logic ---
  const loadPersonalityTemplates = () => {
    const storedTemplates = localStorage.getItem('mikePersonalityTemplates');
    let loadedTemplates: PersonalityTemplate[] = storedTemplates ? JSON.parse(storedTemplates) : [];
    
    const defaultSystemBase = SYSTEM_INSTRUCTION.replace("{USER_PROFILE_INFO_BLOCK}", "");
    if (!loadedTemplates.some(t => t.prompt === defaultSystemBase && t.isSystemDefault)) {
        loadedTemplates.unshift({
            id: 'system-default-' + Date.now(), 
            name: "الشخصية الافتراضية للنظام",
            prompt: defaultSystemBase,
            isSystemDefault: true,
        });
    }
    setTemplates(loadedTemplates.filter(t => t.id && t.name && t.prompt));
  };

  const handleSaveTemplate = () => {
    if (!newTemplateName.trim() || !newTemplatePrompt.trim()) {
      alert("يرجى إدخال اسم ومحتوى للنموذج.");
      return;
    }
    let updatedTemplates = [...templates];
    if (templateEditId) { 
      updatedTemplates = templates.map(t => 
        t.id === templateEditId ? { ...t, name: newTemplateName, prompt: newTemplatePrompt, isSystemDefault: false } : t
      );
    } else { 
        if (templates.some(t => t.name.toLowerCase() === newTemplateName.toLowerCase())) {
            alert("يوجد نموذج بنفس الاسم بالفعل. الرجاء اختيار اسم آخر.");
            return;
        }
      updatedTemplates.push({ id: `template-${Date.now()}`, name: newTemplateName, prompt: newTemplatePrompt });
    }
    
    localStorage.setItem('mikePersonalityTemplates', JSON.stringify(updatedTemplates.filter(t => !t.isSystemDefault || t.prompt === SYSTEM_INSTRUCTION.replace("{USER_PROFILE_INFO_BLOCK}", ""))));
    setTemplates(updatedTemplates);
    setNewTemplateName('');
    setNewTemplatePrompt('');
    setTemplateEditId(null);
    loadPersonalityTemplates(); 
  };

  const handleEditTemplate = (template: PersonalityTemplate) => {
    if(template.isSystemDefault) {
        setNewTemplateName(template.name); 
        setNewTemplatePrompt(template.prompt);
        setTemplateEditId(null); 
    } else {
        setTemplateEditId(template.id);
        setNewTemplateName(template.name);
        setNewTemplatePrompt(template.prompt);
    }
  };

  const handleCancelEditTemplate = () => {
    setTemplateEditId(null);
    setNewTemplateName('');
    setNewTemplatePrompt('');
  };

  const handleDeleteTemplate = (templateId: string) => {
    const templateToDelete = templates.find(t => t.id === templateId);
    if (templateToDelete && templateToDelete.isSystemDefault) {
        alert("لا يمكن حذف الشخصية الافتراضية للنظام.");
        return;
    }
    if (window.confirm("هل أنت متأكد أنك تريد حذف هذا النموذج؟")) {
      const updatedTemplates = templates.filter(t => t.id !== templateId);
      localStorage.setItem('mikePersonalityTemplates', JSON.stringify(updatedTemplates));
      setTemplates(updatedTemplates);
      loadPersonalityTemplates();
    }
  };

  const handleApplyTemplate = (prompt: string) => {
    setSystemPrompt(prompt);
    handleSaveSystemPrompt(prompt); 
  };

  // --- Announcement Logic ---
  const handlePublishAnnouncement = () => {
    if (!announcementText.trim()) {
      setAnnouncementStatus("يرجى كتابة نص للإعلان.");
      setTimeout(() => setAnnouncementStatus(''), 3000);
      return;
    }
    const newAnnouncement: GlobalAnnouncement = {
      id: `ann-${Date.now()}`,
      message: announcementText,
      timestamp: Date.now(),
    };
    localStorage.setItem('mikeGlobalAnnouncement', JSON.stringify(newAnnouncement));
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('mikeDismissedAnnouncements_')) {
            localStorage.removeItem(key);
        }
    }
    setAnnouncementText('');
    setAnnouncementStatus("تم نشر الإعلان بنجاح! سيظهر للمستخدمين عند التحديث أو الدخول التالي.");
    setTimeout(() => setAnnouncementStatus(''), 5000);
  };


  return (
    <div className="flex flex-col items-center min-h-screen bg-slate-100 dark:bg-slate-900 p-4 overflow-y-auto">
      <div className="w-full max-w-3xl bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-xl shadow-2xl my-8">
        <div className="text-center">
            <MikeLogo className="justify-center mb-6" size={40} />
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-700 dark:text-slate-200 mb-1">لوحة تحكم المشرف لـ {AI_NAME}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">أهلاً بك، {currentUserEmail}.</p>
        </div>

        {/* Section: View Registered Users */}
        <div className="mb-8 p-4 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-3">المستخدمون المسجلون ({registeredUsers.length})</h3>
          {registeredUsers.length > 0 ? (
            <ul className="space-y-2 max-h-60 overflow-y-auto text-sm">
              {registeredUsers.map((user, index) => (
                <li key={user.id || index} className="p-2 bg-slate-50 dark:bg-slate-700/50 rounded-md text-xs">
                  <span className="font-medium">{user.username}</span> ({user.email || user.id})
                  {user.profile && (
                    <span className="text-slate-500 dark:text-slate-400 block text-xs">
                      {user.profile.nationality && `الجنسية: ${user.profile.nationality} `}
                      {user.profile.age && `العمر: ${user.profile.age}`}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">لا يوجد مستخدمون مسجلون حاليًا.</p>
          )}
        </div>

        {/* Section: Change Mike's Personality */}
        <div className="mb-8 p-4 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-3">تغيير شخصية {AI_NAME} (التعليمات الأساسية للنظام)</h3>
          <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            rows={8}
            className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-sm focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
            placeholder="أدخل التعليمات الأساسية لشخصية الذكاء الاصطناعي هنا..."
          />
          <button
            onClick={() => handleSaveSystemPrompt()}
            className="mt-3 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-md text-sm font-semibold transition-colors"
          >
            حفظ شخصية {AI_NAME}
          </button>
          {promptSaveStatus && <p className="mt-2 text-sm text-green-600 dark:text-green-400">{promptSaveStatus}</p>}
        </div>
        
        {/* Section: Manage Personality Templates */}
        <div className="mb-8 p-4 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-3">إدارة نماذج الشخصيات</h3>
            <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-md">
                <h4 className="text-md font-medium text-slate-600 dark:text-slate-300 mb-2">{templateEditId ? 'تعديل نموذج' : 'إضافة نموذج جديد'}</h4>
                <input 
                    type="text" 
                    placeholder="اسم النموذج (مثال: مساعد برمجي)" 
                    value={newTemplateName} 
                    onChange={e => setNewTemplateName(e.target.value)}
                    className="w-full p-2 mb-2 border border-slate-300 dark:border-slate-600 rounded-md text-sm bg-white dark:bg-slate-600"
                />
                <textarea 
                    placeholder="محتوى النموذج (التعليمات الأساسية للنظام)..." 
                    value={newTemplatePrompt} 
                    onChange={e => setNewTemplatePrompt(e.target.value)}
                    rows={5}
                    className="w-full p-2 mb-2 border border-slate-300 dark:border-slate-600 rounded-md text-sm bg-white dark:bg-slate-600"
                />
                <div className="flex space-x-2 rtl:space-x-reverse">
                    <button onClick={handleSaveTemplate} className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-md text-xs font-semibold">
                        {templateEditId ? 'حفظ التعديلات' : 'إضافة النموذج'}
                    </button>
                    {templateEditId && (
                        <button onClick={handleCancelEditTemplate} className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-500 dark:hover:bg-slate-400 rounded-md text-xs">إلغاء التعديل</button>
                    )}
                </div>
            </div>
            {templates.length > 0 && (
                <div>
                    <h4 className="text-md font-medium text-slate-600 dark:text-slate-300 mb-2">النماذج المحفوظة:</h4>
                    <ul className="space-y-1 max-h-48 overflow-y-auto text-sm">
                        {templates.map(template => (
                            <li key={template.id} className="flex justify-between items-center p-2 bg-slate-100 dark:bg-slate-700 rounded-md text-xs">
                                <span className="font-medium truncate pr-2">{template.name} {template.isSystemDefault ? "(افتراضي)" : ""}</span>
                                <div className="flex space-x-1 rtl:space-x-reverse">
                                    <button onClick={() => handleApplyTemplate(template.prompt)} className="px-2 py-1 bg-sky-500 hover:bg-sky-600 text-white rounded text-xs">تطبيق</button>
                                    <button onClick={() => handleEditTemplate(template)} className="px-2 py-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded text-xs">تعديل</button>
                                    {!template.isSystemDefault && (
                                      <button onClick={() => handleDeleteTemplate(template.id)} className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs">حذف</button>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>

        {/* Section: Broadcast Announcement */}
        <div className="mb-8 p-4 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-3">نشر إعلان للمستخدمين</h3>
            <textarea
                value={announcementText}
                onChange={(e) => setAnnouncementText(e.target.value)}
                rows={3}
                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-sm focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
                placeholder="اكتب رسالة الإعلان هنا..."
            />
            <button
                onClick={handlePublishAnnouncement}
                className="mt-3 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-md text-sm font-semibold transition-colors"
            >
                نشر الإعلان
            </button>
            {announcementStatus && <p className="mt-2 text-sm text-green-600 dark:text-green-400">{announcementStatus}</p>}
        </div>

        {/* Placeholder for "View Deleted Accounts" */}
        <div className="mb-8 p-4 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-3">عرض الحسابات المحذوفة</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
                ملاحظة: بسبب استخدام التخزين المحلي (localStorage)، لا يتم تتبع الحسابات المحذوفة بشكل مركزي.
                عندما يحذف المستخدم حسابه، يتم مسح بياناته من جهازه فقط.
            </p>
        </div>


        <div className="mt-8 flex flex-col sm:flex-row sm:justify-between items-center space-y-3 sm:space-y-0 sm:space-x-3 rtl:sm:space-x-reverse">
          <button
            onClick={onSwitchToUserView}
            className="w-full sm:w-auto px-6 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-white dark:focus:ring-offset-slate-800 focus:ring-green-500"
          >
            التبديل إلى واجهة المستخدم
          </button>
          <button
            onClick={onLogout}
            className="w-full sm:w-auto px-6 py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-600 dark:hover:bg-slate-500 text-slate-700 dark:text-slate-200 rounded-lg font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-white dark:focus:ring-offset-slate-800 focus:ring-slate-400"
          >
            تسجيل الخروج
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;