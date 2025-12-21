
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Email, ThreadAutomationConfig, UserAccount, SearchFilters, EmailTemplate, LiveAssistantConfig, AppNotification } from '../types';
import { getSmartInboxAnalysis, generateNanoLogo } from '../services/geminiService';
import { translations, Language } from '../services/translations';

const MOCK_ACCOUNTS: UserAccount[] = [
  { id: '1', name: 'John Doe', email: 'john.doe@aireon.ai', avatar: 'JD', provider: 'google', color: 'from-cyan-400 to-blue-500' },
  { id: '2', name: 'John (Personal)', email: 'johnny.d@gmail.com', avatar: 'J', provider: 'google', color: 'from-orange-400 to-red-500' },
  { id: '3', name: 'Aireon Admin', email: 'admin@aireon.ai', avatar: 'A', provider: 'microsoft', color: 'from-emerald-400 to-teal-500' }
];

const MOCK_TEMPLATES: EmailTemplate[] = [];

const MOCK_EMAILS: Email[] = [
  {
    id: '1',
    sender: 'Sarah Connor',
    senderEmail: 'sarah@skynet.com',
    subject: 'Project Update: Genisys',
    preview: 'We need to discuss the timeline for the Q4 release...',
    body: 'Hi team, \n\nWe need to discuss the timeline for the Q4 release. The AI models are training faster than expected, but we need more GPU allocation. \n\nCan we meet tomorrow at 10 AM?',
    timestamp: '10:30 AM',
    read: false,
    isSmart: true,
    priorityScore: 95,
    tags: ['Urgent', 'Project'],
    attachments: [{ name: 'timeline.png', type: 'image', size: '2.4MB', url: 'https://picsum.photos/400/300' }],
    folder: 'inbox'
  },
  {
    id: '2',
    sender: 'Newsletter Bot',
    senderEmail: 'news@dailytech.com',
    subject: 'Tech Trends 2025',
    preview: 'Here are the top 5 trends you need to know...',
    body: '1. Quantum Computing\n2. AI Agents\n3. Bio-hacking...',
    timestamp: '9:15 AM',
    read: true,
    isSmart: false,
    priorityScore: 20,
    tags: ['Newsletter'],
    folder: 'inbox'
  },
  {
    id: '3',
    sender: 'John Doe',
    senderEmail: 'john.doe@example.com',
    subject: 'Invoice #4022',
    preview: 'Please find attached the invoice for last month services.',
    body: 'Hi there, attached is the invoice. Please process payment by Friday.',
    timestamp: 'Yesterday',
    read: true,
    isSmart: true,
    priorityScore: 80,
    tags: ['Finance'],
    folder: 'inbox'
  },
  {
    id: '5',
    sender: 'Me',
    senderEmail: 'me@aireon.ai',
    subject: 'Q3 Financial Review',
    preview: '[Draft] High level summary of Q3 performance...',
    body: 'Team,\n\nHere is the high level summary of Q3:\n\n- Revenue: +15%\n- UA: +5%\n\nNeed to add charts.',
    timestamp: '2 days ago',
    read: true,
    isSmart: false,
    priorityScore: 0,
    folder: 'drafts'
  }
];

const MOCK_AUTOMATIONS: Record<string, ThreadAutomationConfig> = {
  '1': {
    threadId: '1',
    active: true,
    autoReply: { enabled: true, tone: 'Professional', matchMyStyle: true },
    actions: { summarize: true, extractTasks: true, autoLabel: true, translate: false },
    customPrompt: "If the sender asks for a meeting time, check my calendar and suggest 2 slots in the afternoon.",
    logs: [
      { id: 'l1', timestamp: '10:31 AM', action: 'Auto-Label', details: 'Applied "Urgent" tag', status: 'success' },
      { id: 'l2', timestamp: '10:32 AM', action: 'Summarize', details: 'Generated summary for dashboard', status: 'success' }
    ]
  }
};

const MOCK_NOTIFICATIONS: AppNotification[] = [
    { id: '1', title: 'Welcome to Aireon', message: 'Get started by connecting your accounts.', timestamp: 'Just now', read: false, type: 'info' },
    { id: '2', title: 'System Update', message: 'Gemini 1.5 Pro is now available for all users.', timestamp: '2h ago', read: false, type: 'success' },
    { id: '3', title: 'Security Alert', message: 'New login detected from San Francisco, CA.', timestamp: '1d ago', read: true, type: 'alert' }
];

export interface ConfirmOptions {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  variant: 'danger' | 'info';
}

interface AppContextType {
  // Auth
  isAuthenticated: boolean;
  isLoggingIn: boolean;
  isCheckingAuth: boolean;
  userData: { token: string; email: string; name: string } | null;
  login: () => Promise<void>;
  loginWithToken: (token: string, email: string, name: string) => void;
  logout: () => void;

  emails: Email[];
  filteredEmails: Email[];
  setEmails: React.Dispatch<React.SetStateAction<Email[]>>;
  appLogo: string | null;
  isGeneratingLogo: boolean;
  handleGenerateLogo: () => Promise<void>;
  analyzeEmails: () => Promise<void>;
  updateEmail: (id: string, updates: Partial<Email>) => void;
  deleteEmail: (id: string) => void;
  threadAutomations: Record<string, ThreadAutomationConfig>;
  updateThreadAutomation: (threadId: string, updates: Partial<ThreadAutomationConfig>) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations['en']) => string;
  // Account Management
  accounts: UserAccount[];
  currentAccount: UserAccount;
  switchAccount: (id: string) => void;
  addAccount: (account: Omit<UserAccount, 'id'>) => void;
  // Templates
  templates: EmailTemplate[];
  addTemplate: (template: Omit<EmailTemplate, 'id'>) => void;
  deleteTemplate: (id: string) => void;
  updateTemplate: (id: string, template: Partial<EmailTemplate>) => void;
  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchFilters: SearchFilters;
  setSearchFilters: React.Dispatch<React.SetStateAction<SearchFilters>>;
  isSearching: boolean;
  // Confirmation Modal
  confirmState: ConfirmOptions;
  requestConfirm: (options: Omit<ConfirmOptions, 'isOpen' | 'variant'> & { variant?: 'danger' | 'info' }) => void;
  closeConfirm: () => void;
  // Live Assistant
  liveAssistantConfig: LiveAssistantConfig;
  setLiveAssistantConfig: React.Dispatch<React.SetStateAction<LiveAssistantConfig>>;
  // Notifications
  notifications: AppNotification[];
  markAllNotificationsRead: () => void;
  deleteNotification: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within an AppProvider');
  return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [userData, setUserData] = useState<{ token: string; email: string; name: string } | null>(null);

  // App Data State
  const [emails, setEmails] = useState<Email[]>(MOCK_EMAILS);
  const [templates, setTemplates] = useState<EmailTemplate[]>(MOCK_TEMPLATES);
  const [appLogo, setAppLogo] = useState<string | null>(null);
  const [isGeneratingLogo, setIsGeneratingLogo] = useState(false);
  const [threadAutomations, setThreadAutomations] = useState(MOCK_AUTOMATIONS);
  const [language, setLanguage] = useState<Language>('en');

  // Account State
  const [accounts, setAccounts] = useState<UserAccount[]>(MOCK_ACCOUNTS);
  const [currentAccount, setCurrentAccount] = useState<UserAccount>(MOCK_ACCOUNTS[0]);

  // Live Assistant State
  const [liveAssistantConfig, setLiveAssistantConfig] = useState<LiveAssistantConfig>({
      name: 'Aireon',
      voice: 'Kore',
      language: 'English'
  });

  // Notifications State
  const [notifications, setNotifications] = useState<AppNotification[]>(MOCK_NOTIFICATIONS);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    from: '',
    to: '',
    dateStart: '',
    dateEnd: '',
    hasAttachments: false
  });

  // Confirmation Modal State
  const [confirmState, setConfirmState] = useState<ConfirmOptions>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    variant: 'danger'
  });

  const requestConfirm = (options: Omit<ConfirmOptions, 'isOpen' | 'variant'> & { variant?: 'danger' | 'info' }) => {
    setConfirmState({ ...options, isOpen: true, variant: options.variant || 'danger' });
  };

  const closeConfirm = () => {
    setConfirmState(prev => ({ ...prev, isOpen: false }));
  };

  // Check for existing auth on mount and URL parameters
  useEffect(() => {
    const checkAuth = async () => {
      // Check URL query parameters for OAuth callback
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      const status = urlParams.get('status');
      const email = urlParams.get('email');
      const name = urlParams.get('name');

      if (token && status === 'success' && email && name) {
        // Save auth data to localStorage
        const authData = { token, email, name };
        localStorage.setItem('aireon_auth', JSON.stringify(authData));

        // Set auth state
        setUserData(authData);
        setIsAuthenticated(true);

        // Clean up URL and redirect to inbox
        window.history.replaceState({}, '', '/inbox');
      } else {
        // Check localStorage for existing auth
        const savedAuth = localStorage.getItem('aireon_auth');
        if (savedAuth) {
          try {
            const authData = JSON.parse(savedAuth);
            setUserData(authData);
            setIsAuthenticated(true);
          } catch (error) {
            console.error('Failed to parse saved auth data:', error);
            localStorage.removeItem('aireon_auth');
          }
        }
      }

      // Auth check is complete
      setIsCheckingAuth(false);
    };

    checkAuth();
  }, []);

  const login = async () => {
    setIsLoggingIn(true);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsAuthenticated(true);
    setIsLoggingIn(false);
  };

  const loginWithToken = (token: string, email: string, name: string) => {
    const authData = { token, email, name };
    localStorage.setItem('aireon_auth', JSON.stringify(authData));
    setUserData(authData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUserData(null);
    localStorage.removeItem('aireon_auth');
  };

  // Derived filtered emails
  const filteredEmails = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    const hasActiveFilters = query || searchFilters.from || searchFilters.to || searchFilters.hasAttachments || searchFilters.dateStart;

    if (!hasActiveFilters) return emails;

    return emails.filter(email => {
        // 1. Text Search
        if (query) {
            const matchesText = 
                email.subject.toLowerCase().includes(query) || 
                email.body.toLowerCase().includes(query) ||
                email.sender.toLowerCase().includes(query) ||
                email.senderEmail.toLowerCase().includes(query);
            if (!matchesText) return false;
        }

        // 2. Filters
        if (searchFilters.from && !email.sender.toLowerCase().includes(searchFilters.from.toLowerCase()) && !email.senderEmail.toLowerCase().includes(searchFilters.from.toLowerCase())) {
            return false;
        }

        // Simplistic 'To' check - mostly relevant for sent emails in this mock structure
        if (searchFilters.to) {
             // In a real app we'd check recipients list. For mock, we'll just pass if it's not implemented on the object to avoid blocking everything
             // or check if it's a sent email.
             if(email.folder === 'sent' && !email.body.toLowerCase().includes(searchFilters.to.toLowerCase())) return false;
        }

        if (searchFilters.hasAttachments && (!email.attachments || email.attachments.length === 0)) {
            return false;
        }

        return true;
    });
  }, [emails, searchQuery, searchFilters]);

  // Initial logo generation
  useEffect(() => {
    if (isAuthenticated && !appLogo) {
      handleGenerateLogo();
    }
  }, [isAuthenticated]);

  // Update HTML direction when language changes
  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: keyof typeof translations['en']) => {
    return translations[language][key] || key;
  };

  const handleGenerateLogo = async () => {
    setIsGeneratingLogo(true);
    const logoData = await generateNanoLogo();
    if (logoData) setAppLogo(logoData);
    setIsGeneratingLogo(false);
  };

  const analyzeEmails = async () => {
    const newEmails = await Promise.all(emails.map(async (e) => {
      if(e.isSmart || e.folder !== 'inbox') return e;
      const analysis = await getSmartInboxAnalysis(e.body, e.subject);
      return { ...e, ...analysis, isSmart: true };
    }));
    setEmails(newEmails);
  };

  const updateEmail = (id: string, updates: Partial<Email>) => {
    setEmails(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  const deleteEmail = (id: string) => {
    setEmails(prev => prev.filter(e => e.id !== id));
  };

  const updateThreadAutomation = (threadId: string, updates: Partial<ThreadAutomationConfig>) => {
    setThreadAutomations(prev => {
      const existing = prev[threadId] || {
        threadId,
        active: false,
        autoReply: { enabled: false, tone: 'Professional', matchMyStyle: false },
        actions: { summarize: false, extractTasks: false, autoLabel: false, translate: false },
        customPrompt: '',
        logs: []
      };
      return { ...prev, [threadId]: { ...existing, ...updates } };
    });
  };

  const switchAccount = (id: string) => {
    const account = accounts.find(a => a.id === id);
    if (account) {
      setCurrentAccount(account);
      if (id !== currentAccount.id) {
          const shuffled = [...emails].sort(() => 0.5 - Math.random());
          setEmails(shuffled); 
      }
    }
  };

  const addAccount = (newAccountData: Omit<UserAccount, 'id'>) => {
      const newAccount: UserAccount = {
          ...newAccountData,
          id: Math.random().toString(36).substr(2, 9)
      };
      setAccounts(prev => [...prev, newAccount]);
      switchAccount(newAccount.id);
  };

  const addTemplate = (templateData: Omit<EmailTemplate, 'id'>) => {
      const newTemplate = { ...templateData, id: Math.random().toString(36).substr(2, 9) };
      setTemplates(prev => [...prev, newTemplate]);
  };

  const deleteTemplate = (id: string) => {
      setTemplates(prev => prev.filter(t => t.id !== id));
  };

  const updateTemplate = (id: string, updates: Partial<EmailTemplate>) => {
      setTemplates(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <AppContext.Provider value={{
      isAuthenticated,
      isLoggingIn,
      isCheckingAuth,
      userData,
      login,
      loginWithToken,
      logout,
      emails, 
      filteredEmails,
      setEmails, 
      appLogo, 
      isGeneratingLogo, 
      handleGenerateLogo, 
      analyzeEmails, 
      updateEmail,
      deleteEmail,
      threadAutomations, 
      updateThreadAutomation, 
      language, 
      setLanguage, 
      t,
      accounts,
      currentAccount,
      switchAccount,
      addAccount,
      templates,
      addTemplate,
      deleteTemplate,
      updateTemplate,
      searchQuery,
      setSearchQuery,
      searchFilters,
      setSearchFilters,
      isSearching: searchQuery.length > 0 || !!searchFilters.from || !!searchFilters.to || searchFilters.hasAttachments,
      confirmState,
      requestConfirm,
      closeConfirm,
      liveAssistantConfig,
      setLiveAssistantConfig,
      notifications,
      markAllNotificationsRead,
      deleteNotification
    }}>
      {children}
    </AppContext.Provider>
  );
};
