import React, { useState, useEffect } from 'react';
import { 
  FolderOpen, 
  Table, 
  GraduationCap, 
  Calendar as CalendarIcon, 
  Upload, 
  Plus, 
  Trash2, 
  ExternalLink, 
  RefreshCw, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  LogOut, 
  Sparkles,
  FileSpreadsheet,
  FolderPlus,
  Send,
  Clock,
  MapPin,
  Share2,
  HardDrive
} from 'lucide-react';
import { User } from 'firebase/auth';
import { 
  initAuth, 
  googleSignIn, 
  logoutGoogle, 
  driveService, 
  sheetsService, 
  classroomService, 
  calendarService,
  DriveFile,
  ClassroomCourse,
  ClassroomAnnouncement,
  CalendarEvent,
  SpreadsheetInfo
} from '../services/googleWorkspace';
import { useApp } from '../context/AppContext';

export const GoogleWorkspaceHub: React.FC = () => {
  const { products, language, t } = useApp();

  // Authentication State
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'drive' | 'sheets' | 'classroom' | 'calendar'>('drive');

  // Loading & Action States
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Google Drive States
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [driveSearch, setDriveSearch] = useState<string>('');
  const [newFolderName, setNewFolderName] = useState<string>('أصول ومنتجات يسرى سمايل');
  const [showFolderModal, setShowFolderModal] = useState<boolean>(false);

  // Google Sheets States
  const [createdSpreadsheet, setCreatedSpreadsheet] = useState<SpreadsheetInfo | null>(null);
  const [customSheetTitle, setCustomSheetTitle] = useState<string>('كتالوج منتجات وأفلييت يسرى سمايل — ' + new Date().toLocaleDateString('ar-SA'));
  const [sheetPreviewValues, setSheetPreviewValues] = useState<string[][]>([]);

  // Google Classroom States
  const [courses, setCourses] = useState<ClassroomCourse[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [announcementText, setAnnouncementText] = useState<string>('');
  const [announcements, setAnnouncements] = useState<ClassroomAnnouncement[]>([]);

  // Google Calendar States
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [eventSummary, setEventSummary] = useState<string>('مراجعة وإطلاق منتج جديد على يسرى سمايل');
  const [eventDescription, setEventDescription] = useState<string>('جلسة مراجعة المنتجات الأكثر طلباً مع إدراج روابط الشراء والأفلييت للمتابعين.');
  const [eventDate, setEventDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [eventTime, setEventTime] = useState<string>('18:00');

  // Confirmation Modal for Destructive Operations
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: async () => {}
  });

  // Initialize Auth on component mount
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, accessToken) => {
        setUser(currentUser);
        setToken(accessToken);
        setAuthError(null);
      },
      () => {
        setUser(null);
        setToken(null);
      }
    );
    return () => unsubscribe && unsubscribe();
  }, []);

  // Fetch initial data when user logs in or switches tabs
  useEffect(() => {
    if (user && token) {
      if (activeTab === 'drive') loadDriveFiles();
      if (activeTab === 'classroom') loadClassroomCourses();
      if (activeTab === 'calendar') loadCalendarEvents();
    }
  }, [user, token, activeTab]);

  // Sign In Handler
  const handleSignIn = async () => {
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
        setStatusMessage({ type: 'success', text: `تم تسجيل الدخول بنجاح بحساب: ${result.user.displayName || result.user.email}` });
      }
    } catch (err: any) {
      console.error(err);
      setAuthError(err.message || 'فشل تسجيل الدخول بحساب Google');
      setStatusMessage({ type: 'error', text: 'فشل تسجيل الدخول. يرجى التأكد من السماح بالنوافذ المنبثقة وصلاحيات الحساب.' });
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Sign Out Handler
  const handleSignOut = async () => {
    await logoutGoogle();
    setUser(null);
    setToken(null);
    setDriveFiles([]);
    setCourses([]);
    setCalendarEvents([]);
    setStatusMessage({ type: 'info', text: 'تم تسجيل الخروج من خدمات Google بنجاح.' });
  };

  // ==========================================
  // DRIVE OPERATIONS
  // ==========================================
  const loadDriveFiles = async () => {
    setIsLoading(true);
    try {
      const files = await driveService.listFiles(driveSearch);
      setDriveFiles(files);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: `فشل جلب ملفات Google Drive: ${err.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    setIsLoading(true);
    try {
      await driveService.createFolder(newFolderName.trim());
      setStatusMessage({ type: 'success', text: `تم إنشاء المجلد "${newFolderName}" بنجاح في Google Drive!` });
      setShowFolderModal(false);
      await loadDriveFiles();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: `فشل إنشاء المجلد: ${err.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackupProductsToDrive = async () => {
    setIsLoading(true);
    try {
      const backupData = JSON.stringify({
        site: 'yousrasmile.com',
        exportedAt: new Date().toISOString(),
        totalProducts: products.length,
        products: products
      }, null, 2);

      const fileName = `yousra_smile_products_backup_${Date.now()}.json`;
      const uploaded = await driveService.uploadTextFile(fileName, backupData, 'application/json');
      setStatusMessage({ 
        type: 'success', 
        text: `تم حفظ نسخة احتياطية كاملة لـ (${products.length}) منتجاً في Google Drive بنجاح!` 
      });
      await loadDriveFiles();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: `فشل رفع النسخة الاحتياطية إلى Drive: ${err.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  const promptDeleteDriveFile = (file: DriveFile) => {
    setConfirmModal({
      isOpen: true,
      title: 'تأكيد حذف الملف من Google Drive',
      description: `هل أنت متأكد من رغبتك في حذف الملف "${file.name}" نهائياً من حساب Google Drive الخاص بك؟ لن يمكن التراجع عن هذا الإجراء.`,
      onConfirm: async () => {
        setIsLoading(true);
        try {
          await driveService.deleteFile(file.id);
          setStatusMessage({ type: 'success', text: `تم حذف الملف "${file.name}" بنجاح.` });
          await loadDriveFiles();
        } catch (err: any) {
          setStatusMessage({ type: 'error', text: `فشل حذف الملف: ${err.message}` });
        } finally {
          setIsLoading(false);
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  // ==========================================
  // SHEETS OPERATIONS
  // ==========================================
  const handleCreateSyncSpreadsheet = async () => {
    setIsLoading(true);
    try {
      const sheet = await sheetsService.createCatalogSpreadsheet(customSheetTitle, products);
      setCreatedSpreadsheet(sheet);
      setStatusMessage({ 
        type: 'success', 
        text: `تم إنشاء ومزامنة جدول Google Sheets بنجاح! يحتوي الآن على (${products.length}) منتجاً مع روابط الأفلييت.` 
      });
      
      // Load initial preview
      const preview = await sheetsService.getSheetValues(sheet.spreadsheetId, 'A1:M8');
      setSheetPreviewValues(preview);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: `فشل إنشاء جدول Google Sheets: ${err.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // CLASSROOM OPERATIONS
  // ==========================================
  const loadClassroomCourses = async () => {
    setIsLoading(true);
    try {
      const courseList = await classroomService.listCourses();
      setCourses(courseList);
      if (courseList.length > 0 && !selectedCourseId) {
        setSelectedCourseId(courseList[0].id);
        loadAnnouncements(courseList[0].id);
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: `فشل جلب فصول Google Classroom: ${err.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  const loadAnnouncements = async (courseId: string) => {
    try {
      const list = await classroomService.listAnnouncements(courseId);
      setAnnouncements(list);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handlePostAnnouncement = async () => {
    if (!selectedCourseId || !announcementText.trim()) return;
    setIsLoading(true);
    try {
      await classroomService.postAnnouncement(selectedCourseId, announcementText.trim());
      setStatusMessage({ type: 'success', text: 'تم نشر الإعلان بنجاح في فصل Google Classroom!' });
      setAnnouncementText('');
      await loadAnnouncements(selectedCourseId);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: `فشل نشر الإعلان: ${err.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // CALENDAR OPERATIONS
  // ==========================================
  const loadCalendarEvents = async () => {
    setIsLoading(true);
    try {
      const events = await calendarService.listEvents();
      setCalendarEvents(events);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: `فشل جلب فعاليات تقويم Google: ${err.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCalendarEvent = async () => {
    if (!eventSummary.trim()) return;
    setIsLoading(true);
    try {
      const startDateTime = new Date(`${eventDate}T${eventTime}:00`).toISOString();
      const endDate = new Date(`${eventDate}T${eventTime}:00`);
      endDate.setHours(endDate.getHours() + 1);
      const endDateTime = endDate.toISOString();

      await calendarService.createEvent({
        summary: eventSummary.trim(),
        description: eventDescription.trim(),
        startDateTime,
        endDateTime
      });

      setStatusMessage({ type: 'success', text: `تمت جدولة الفعالية "${eventSummary}" في تقويم Google الخاص بك بنجاح!` });
      await loadCalendarEvents();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: `فشل إضافة الفعالية: ${err.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  const promptDeleteCalendarEvent = (event: CalendarEvent) => {
    setConfirmModal({
      isOpen: true,
      title: 'تأكيد حذف الفعالية من Google Calendar',
      description: `هل أنت متأكد من رغبتك في حذف الفعالية "${event.summary}" من تقويم Google؟ لن يتم التذكير بها بعد الآن.`,
      onConfirm: async () => {
        setIsLoading(true);
        try {
          await calendarService.deleteEvent(event.id);
          setStatusMessage({ type: 'success', text: `تم حذف الفعالية "${event.summary}" من التقويم بنجاح.` });
          await loadCalendarEvents();
        } catch (err: any) {
          setStatusMessage({ type: 'error', text: `فشل حذف الفعالية: ${err.message}` });
        } finally {
          setIsLoading(false);
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & OAuth Connection Panel */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 border border-indigo-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>مركز الربط الذكي مع حزمة Google Workspace</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
              <span>تكامل تطبيقات Google لـ "يسرى سمايل"</span>
            </h2>
            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              إدارة أصول ومستندات المنصة، مزامنة كتالوج المنتجات والأفلييت في جداول Google Sheets، إدارة دورات التسويق في Classroom، وجدولة مراجعات الفيديو والعروض في Google Calendar بإذن كامل وتشفير مباشر.
            </p>
          </div>

          {/* User Auth Card */}
          <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-4 min-w-[280px] shrink-0 shadow-lg">
            {user ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  {user.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt={user.displayName || 'Google User'} 
                      className="w-11 h-11 rounded-full border-2 border-emerald-500 shadow"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-lg">
                      {user.displayName?.charAt(0) || user.email?.charAt(0) || 'G'}
                    </div>
                  )}
                  <div className="overflow-hidden">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <p className="text-xs font-bold text-emerald-400">حساب Google متصل</p>
                    </div>
                    <p className="text-sm font-black text-white truncate">{user.displayName || 'مستخدم Google'}</p>
                    <p className="text-xs text-slate-400 truncate">{user.email}</p>
                  </div>
                </div>

                <button
                  onClick={handleSignOut}
                  className="w-full py-2 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>تسجيل الخروج من Google</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3 text-center">
                <p className="text-xs text-slate-300">سجل الدخول بحساب Google لتفعيل الوصول إلى Drive و Sheets و Classroom و Calendar:</p>
                
                {/* Official Material Google Sign-In Button */}
                <button 
                  onClick={handleSignIn}
                  disabled={isAuthenticating}
                  className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-100 text-slate-800 font-bold px-4 py-2.5 rounded-xl shadow-md transition-all border border-slate-300 text-xs cursor-pointer disabled:opacity-50"
                >
                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  </svg>
                  <span>{isAuthenticating ? 'جاري تسجيل الدخول...' : 'Sign in with Google'}</span>
                </button>

                {authError && (
                  <p className="text-[11px] text-red-400">{authError}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status Feedback Toast */}
      {statusMessage && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs font-bold transition-all ${
          statusMessage.type === 'success' 
            ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300' 
            : statusMessage.type === 'error'
            ? 'bg-red-950/60 border-red-500/40 text-red-300'
            : 'bg-indigo-950/60 border-indigo-500/40 text-indigo-300'
        }`}>
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />}
            <span>{statusMessage.text}</span>
          </div>
          <button 
            onClick={() => setStatusMessage(null)}
            className="text-slate-400 hover:text-white px-2 py-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Navigation Sub-Tabs for the 4 Services */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800 scrollbar-none">
        <button
          onClick={() => setActiveTab('drive')}
          className={`px-5 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 shrink-0 transition-all cursor-pointer border ${
            activeTab === 'drive'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30 border-blue-400 font-black'
              : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:bg-slate-800/80'
          }`}
        >
          <FolderOpen className="w-4 h-4 text-blue-300" />
          <span>📁 Google Drive (الأصول والنسخ الاحتياطية)</span>
        </button>

        <button
          onClick={() => setActiveTab('sheets')}
          className={`px-5 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 shrink-0 transition-all cursor-pointer border ${
            activeTab === 'sheets'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/30 border-emerald-400 font-black'
              : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:bg-slate-800/80'
          }`}
        >
          <Table className="w-4 h-4 text-emerald-300" />
          <span>📊 Google Sheets (مزامنة الكتالوج والأفلييت)</span>
        </button>

        <button
          onClick={() => setActiveTab('classroom')}
          className={`px-5 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 shrink-0 transition-all cursor-pointer border ${
            activeTab === 'classroom'
              ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg shadow-amber-600/30 border-amber-400 font-black'
              : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:bg-slate-800/80'
          }`}
        >
          <GraduationCap className="w-4 h-4 text-amber-300" />
          <span>🎓 Google Classroom (دورات وإرشادات المسوقين)</span>
        </button>

        <button
          onClick={() => setActiveTab('calendar')}
          className={`px-5 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 shrink-0 transition-all cursor-pointer border ${
            activeTab === 'calendar'
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-600/30 border-purple-400 font-black'
              : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:bg-slate-800/80'
          }`}
        >
          <CalendarIcon className="w-4 h-4 text-purple-300" />
          <span>📅 Google Calendar (جدولة المراجعات والعروض)</span>
        </button>
      </div>

      {/* Require Auth Gate */}
      {!user && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-10 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
            <HardDrive className="w-8 h-8" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-lg font-black text-white">يرجى تسجيل الدخول بحساب Google</h3>
            <p className="text-xs text-slate-400">
              لإدارة الملفات والجداول والفصول والتقويم، يرجى الضغط على زر تسجيل الدخول أعلاه لمنح التطبيق الصلاحيات المطلوبة.
            </p>
          </div>
          <button
            onClick={handleSignIn}
            disabled={isAuthenticating}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold px-6 py-3 rounded-xl shadow-lg hover:brightness-110 cursor-pointer text-xs"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>تسجيل الدخول والتفعيل الآن</span>
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📁 TAB 1: GOOGLE DRIVE */}
      {/* ========================================================================= */}
      {user && activeTab === 'drive' && (
        <div className="space-y-6">
          {/* Action Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
              <input
                type="text"
                value={driveSearch}
                onChange={(e) => setDriveSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadDriveFiles()}
                placeholder="ابحث في ملفات Google Drive..."
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pr-10 pl-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={loadDriveFiles}
                disabled={isLoading}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 flex items-center gap-2 transition-all cursor-pointer"
                title="تحديث القائمة"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-400' : ''}`} />
              </button>

              <button
                onClick={() => setShowFolderModal(true)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-300 border border-blue-500/30 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
              >
                <FolderPlus className="w-4 h-4 text-blue-400" />
                <span>إنشاء مجلد</span>
              </button>

              <button
                onClick={handleBackupProductsToDrive}
                disabled={isLoading}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 text-white text-xs font-black shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                <span>حفظ نسخة احتياطية للمنتجات ({products.length})</span>
              </button>
            </div>
          </div>

          {/* Folder Create Modal */}
          {showFolderModal && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <FolderPlus className="w-5 h-5 text-blue-400" />
                  <span>إنشاء مجلد جديد في Google Drive</span>
                </h3>
                <p className="text-xs text-slate-400">حدد اسم المجلد لتنظيم صور المراجعات، ملفات PDF، والأصول الرقمية للمتجر:</p>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                />
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    onClick={() => setShowFolderModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={handleCreateFolder}
                    disabled={isLoading}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black cursor-pointer disabled:opacity-50"
                  >
                    إنشاء المجلد
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Files Grid / List */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-blue-400" />
                <span>ملفات ومجلدات Drive ({driveFiles.length})</span>
              </h3>
              <span className="text-[11px] text-slate-400">مرتبة حسب آخر تعديل</span>
            </div>

            {driveFiles.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs space-y-2">
                <HardDrive className="w-8 h-8 mx-auto text-slate-600" />
                <p>لا توجد ملفات حالياً أو جاري التحميل...</p>
                <button onClick={loadDriveFiles} className="text-blue-400 hover:underline font-bold">تحديث القائمة</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {driveFiles.map((file) => (
                  <div 
                    key={file.id} 
                    className="bg-slate-800/80 border border-slate-700/70 hover:border-blue-500/50 rounded-2xl p-4 flex flex-col justify-between gap-3 transition-all group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        {file.mimeType.includes('folder') ? (
                          <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                            📁
                          </div>
                        ) : file.mimeType.includes('spreadsheet') ? (
                          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                            📊
                          </div>
                        ) : (
                          <div className="w-9 h-9 rounded-xl bg-slate-700 text-slate-300 flex items-center justify-center shrink-0">
                            📄
                          </div>
                        )}
                        <div className="overflow-hidden">
                          <p className="text-xs font-black text-white truncate group-hover:text-blue-300 transition-colors">
                            {file.name}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {file.modifiedTime ? new Date(file.modifiedTime).toLocaleDateString('ar-SA') : 'ملف سحابي'}
                          </p>
                        </div>
                      </div>

                      {/* Delete with explicit confirmation */}
                      <button
                        onClick={() => promptDeleteDriveFile(file)}
                        className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors opacity-60 hover:opacity-100 cursor-pointer"
                        title="حذف الملف (مع طلب تأكيد)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {file.webViewLink && (
                      <a
                        href={file.webViewLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-1.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-700/80 text-blue-300 border border-slate-700 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all"
                      >
                        <span>فتح في Google Drive</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📊 TAB 2: GOOGLE SHEETS */}
      {/* ========================================================================= */}
      {user && activeTab === 'sheets' && (
        <div className="space-y-6">
          {/* Action Card: Sync Products to Sheets */}
          <div className="bg-gradient-to-r from-emerald-950/60 to-slate-900 border border-emerald-500/30 rounded-3xl p-6 space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold">
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>تصدير ومزامنة الجداول الحية</span>
                </div>
                <h3 className="text-xl font-black text-white">قاعدة بيانات منتجات وأفلييت يسرى سمايل</h3>
                <p className="text-xs text-slate-300 max-w-xl">
                  قم بإنشاء جدول Google Sheets مخصص يتضمن جميع المنتجات ({products.length})، أسعارها الحالية، نسبة الخصم، المتاجر التابعة، وروابط الأفلييت المباشرة مع تجميد الصف العلوي لسهولة الفلترة والتحليل.
                </p>
              </div>

              <button
                onClick={handleCreateSyncSpreadsheet}
                disabled={isLoading}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white font-black text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-2 shrink-0 transition-all cursor-pointer disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>إنشاء وتصدير الجدول إلى Google Sheets</span>
              </button>
            </div>

            {/* Custom Sheet Title Input */}
            <div className="pt-2">
              <label className="block text-[11px] font-bold text-slate-400 mb-1">عنوان الملف في Google Sheets:</label>
              <input
                type="text"
                value={customSheetTitle}
                onChange={(e) => setCustomSheetTitle(e.target.value)}
                className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Connected Spreadsheet Link & Live Preview */}
          {createdSpreadsheet && (
            <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black">
                    📊
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white">{createdSpreadsheet.properties.title}</h4>
                    <p className="text-[11px] text-emerald-400 font-mono">ID: {createdSpreadsheet.spreadsheetId}</p>
                  </div>
                </div>

                <a
                  href={createdSpreadsheet.spreadsheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-2 transition-all shadow cursor-pointer"
                >
                  <span>فتح في Google Sheets المباشر</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>

              {/* Data Preview Table */}
              {sheetPreviewValues.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-xs font-bold text-slate-300">معاينة أولية لبيانات الجدول:</h5>
                  <div className="overflow-x-auto rounded-2xl border border-slate-800">
                    <table className="w-full text-[11px] text-right">
                      <thead className="bg-slate-800 text-emerald-300 font-bold border-b border-slate-700">
                        <tr>
                          {sheetPreviewValues[0]?.map((head, idx) => (
                            <th key={idx} className="p-2.5 whitespace-nowrap">{head}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-slate-300">
                        {sheetPreviewValues.slice(1).map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-slate-800/40">
                            {row.map((cell, cIdx) => (
                              <td key={cIdx} className="p-2.5 whitespace-nowrap truncate max-w-[200px]">{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🎓 TAB 3: GOOGLE CLASSROOM */}
      {/* ========================================================================= */}
      {user && activeTab === 'classroom' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Courses List */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-amber-400" />
                  <span>فصول Classroom النشطة ({courses.length})</span>
                </h3>
                <button
                  onClick={loadClassroomCourses}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                  title="تحديث"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
                </button>
              </div>

              {courses.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs space-y-2">
                  <p>لم يتم العثور على فصول دراسية نشطة في حسابك.</p>
                  <a
                    href="https://classroom.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-amber-400 hover:underline font-bold text-xs"
                  >
                    <span>فتح Google Classroom لإنشاء فصل</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              ) : (
                <div className="space-y-2">
                  {courses.map((course) => (
                    <button
                      key={course.id}
                      onClick={() => {
                        setSelectedCourseId(course.id);
                        loadAnnouncements(course.id);
                      }}
                      className={`w-full text-right p-3 rounded-2xl border transition-all cursor-pointer ${
                        selectedCourseId === course.id
                          ? 'bg-amber-500/10 border-amber-500/50 text-white font-bold'
                          : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <p className="text-xs font-black truncate">{course.name}</p>
                      {course.section && <p className="text-[10px] text-amber-400 truncate">{course.section}</p>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Post Announcement & Course Materials */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-white flex items-center gap-2">
                    <Send className="w-4 h-4 text-amber-400" />
                    <span>نشر إعلان / مادة تعليمية للمسوقين والطلاب</span>
                  </h4>
                  {selectedCourseId && (
                    <span className="text-xs text-amber-300 font-bold">
                      الفصل المحدد: {courses.find(c => c.id === selectedCourseId)?.name}
                    </span>
                  )}
                </div>

                <textarea
                  value={announcementText}
                  onChange={(e) => setAnnouncementText(e.target.value)}
                  placeholder="اكتب الإعلان هنا، مثل: نصائح اختيار أفضل منتجات المنزل الذكي، استراتيجيات التسويق بالعمولة، أو تحديثات منصة يسرى سمايل..."
                  rows={4}
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-2xl p-4 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                />

                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-slate-400">سيتم نشر الإعلان فوراً لجميع طلاب ومسوقي الفصل.</p>
                  <button
                    onClick={handlePostAnnouncement}
                    disabled={isLoading || !selectedCourseId || !announcementText.trim()}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:brightness-110 text-white text-xs font-black shadow-lg shadow-amber-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>نشر الإعلان الآن</span>
                  </button>
                </div>
              </div>

              {/* Announcements List */}
              {announcements.length > 0 && (
                <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-3">
                  <h5 className="text-xs font-black text-slate-200">الإعلانات السابقة في هذا الفصل ({announcements.length}):</h5>
                  <div className="space-y-2">
                    {announcements.map((ann) => (
                      <div key={ann.id} className="bg-slate-800/70 border border-slate-700/60 rounded-2xl p-3.5 space-y-1">
                        <p className="text-xs text-slate-200 whitespace-pre-wrap">{ann.text}</p>
                        <p className="text-[10px] text-slate-400">
                          {ann.creationTime ? new Date(ann.creationTime).toLocaleString('ar-SA') : ''}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📅 TAB 4: GOOGLE CALENDAR */}
      {/* ========================================================================= */}
      {user && activeTab === 'calendar' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Schedule New Event Form */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-purple-400" />
                <span>جدولة موعد في Google Calendar</span>
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">عنوان الفعالية:</label>
                  <input
                    type="text"
                    value={eventSummary}
                    onChange={(e) => setEventSummary(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">التاريخ:</label>
                    <input
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">الوقت:</label>
                    <input
                      type="time"
                      value={eventTime}
                      onChange={(e) => setEventTime(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">الوصف والتفاصيل:</label>
                  <textarea
                    value={eventDescription}
                    onChange={(e) => setEventDescription(e.target.value)}
                    rows={3}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <button
                  onClick={handleCreateCalendarEvent}
                  disabled={isLoading || !eventSummary.trim()}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:brightness-110 text-white text-xs font-black shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة إلى تقويم Google</span>
                </button>
              </div>
            </div>

            {/* Right: Upcoming Events Timeline */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h4 className="text-sm font-black text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-purple-400" />
                  <span>الفعاليات والمواعيد المجدولة ({calendarEvents.length})</span>
                </h4>
                <button
                  onClick={loadCalendarEvents}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                  title="تحديث"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-purple-400' : ''}`} />
                </button>
              </div>

              {calendarEvents.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs space-y-2">
                  <CalendarIcon className="w-8 h-8 mx-auto text-slate-600" />
                  <p>لا توجد فعاليات مجدولة حالياً في تقويمك.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {calendarEvents.map((evt) => {
                    const startStr = evt.start.dateTime 
                      ? new Date(evt.start.dateTime).toLocaleString('ar-SA')
                      : evt.start.date || 'طوال اليوم';

                    return (
                      <div
                        key={evt.id}
                        className="bg-slate-800/80 border border-slate-700/70 hover:border-purple-500/50 rounded-2xl p-4 flex items-start justify-between gap-4 transition-all"
                      >
                        <div className="space-y-1 overflow-hidden">
                          <h5 className="text-xs font-black text-white truncate">{evt.summary}</h5>
                          {evt.description && (
                            <p className="text-[11px] text-slate-300 line-clamp-2">{evt.description}</p>
                          )}
                          <div className="flex items-center gap-3 text-[10px] text-purple-300 pt-1">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-purple-400" />
                              <span>{startStr}</span>
                            </span>
                            {evt.location && (
                              <span className="flex items-center gap-1 truncate max-w-[150px]">
                                <MapPin className="w-3 h-3 text-slate-400" />
                                <span>{evt.location}</span>
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {evt.htmlLink && (
                            <a
                              href={evt.htmlLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 rounded-xl bg-slate-900 text-purple-300 hover:text-white border border-slate-700 text-xs"
                              title="فتح في Google Calendar"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <button
                            onClick={() => promptDeleteCalendarEvent(evt)}
                            className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs cursor-pointer"
                            title="حذف الفعالية (مع طلب تأكيد)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ⚠️ MANDATORY DESTRUCTIVE CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-500/40 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-base font-black text-white">{confirmModal.title}</h3>
              <p className="text-xs text-slate-300 leading-relaxed">{confirmModal.description}</p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
              >
                إلغاء الأمر
              </button>
              <button
                onClick={confirmModal.onConfirm}
                disabled={isLoading}
                className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black shadow-lg shadow-red-600/30 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? 'جاري الحذف...' : 'تأكيد الحذف نهائياً'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
