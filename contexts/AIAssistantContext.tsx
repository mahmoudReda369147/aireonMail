import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppContext } from './AppContext';
import { useGmailEmails, useGmailSentEmails, useUserTemplates, useBots, useAllTasks, useCalendarTasks, useArchivedEmails, useEmailCounts, useNotifications } from '../apis/hooks';

interface AIAssistantContextType {
  currentPage: string;
  pageContext: any;
  isAssistantOpen: boolean;
  setIsAssistantOpen: (open: boolean) => void;
  sendMessage: (message: string) => Promise<string>;
  isLoading: boolean;
  chatHistory: { role: 'user' | 'assistant'; content: string }[];
  clearHistory: () => void;
}

const AIAssistantContext = createContext<AIAssistantContextType | undefined>(undefined);

export const useAIAssistant = () => {
  const context = useContext(AIAssistantContext);
  if (!context) {
    throw new Error('useAIAssistant must be used within AIAssistantProvider');
  }
  return context;
};

interface AIAssistantProviderProps {
  children: ReactNode;
}

export const AIAssistantProvider: React.FC<AIAssistantProviderProps> = ({ children }) => {
  const location = useLocation();
  const { user } = useAppContext();
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);

  // Fetch all data
  const { data: emailsData } = useGmailEmails();
  const { data: sentEmailsData } = useGmailSentEmails();
  const { data: templatesData } = useUserTemplates();
  const { data: botsData } = useBots();
  const { data: tasksData } = useAllTasks({ page: 1, limit: 100 });
  const { data: calendarTasksData } = useCalendarTasks({ page: 1, limit: 100 });
  const { data: archivedEmailsData } = useArchivedEmails();
  const { data: emailCountsData } = useEmailCounts();
  const { data: notificationsData } = useNotifications();

  // Determine current page
  const getCurrentPage = () => {
    const path = location.pathname;
    if (path === '/' || path === '/inbox') return 'Inbox';
    if (path === '/sent') return 'Sent Emails';
    if (path === '/drafts') return 'Drafts';
    if (path === '/compose') return 'Compose Email';
    if (path === '/templates') return 'Email Templates';
    if (path.startsWith('/template/')) return 'Template Editor';
    if (path === '/tasks') return 'Tasks';
    if (path === '/calendar') return 'Calendar';
    if (path === '/bots') return 'Email Bots';
    if (path.startsWith('/bot/')) return 'Bot Configuration';
    if (path === '/automation') return 'Email Automation';
    if (path === '/settings') return 'Settings';
    if (path === '/veo-studio') return 'Veo Studio';
    if (path === '/chats') return 'Live Chat';
    return 'Unknown Page';
  };

  // Build comprehensive context
  const buildPageContext = () => {
    const allEmails = emailsData?.pages.flatMap(page => page.data) || [];
    const allSentEmails = sentEmailsData?.pages.flatMap(page => page.data) || [];
    const allBots = botsData?.pages.flatMap(page => page.data) || [];
    const allNotifications = notificationsData?.pages.flatMap(page => page.data) || [];

    return {
      currentPage: getCurrentPage(),
      pathname: location.pathname,
      user: {
        name: user?.name || 'User',
        email: user?.email || '',
      },
      emailStats: {
        totalEmails: allEmails.length,
        unreadEmails: emailCountsData?.data.unread || 0,
        sentEmails: emailCountsData?.data.sent || 0,
        archivedEmails: emailCountsData?.data.archived || 0,
        threadsWithUnread: emailCountsData?.data.threadsWithUnreadFromOthers || 0,
      },
      emails: {
        inbox: allEmails.slice(0, 10).map(email => ({
          id: email.id,
          from: email.from,
          subject: email.subject,
          snippet: email.snippet,
          date: email.date,
          isRead: email.isRead,
        })),
        sent: allSentEmails.slice(0, 10).map(email => ({
          id: email.id,
          to: email.to,
          subject: email.subject,
          snippet: email.snippet,
          date: email.date,
        })),
        drafts: archivedEmailsData?.data.slice(0, 10).map(email => ({
          id: email.id,
          subject: email.subject,
          snippet: email.snippet,
        })) || [],
      },
      templates: {
        total: templatesData?.data.length || 0,
        templates: templatesData?.data.slice(0, 5).map(t => ({
          id: t.id,
          name: t.name,
          category: t.categure,
          usedTimes: t.usedtimes,
        })) || [],
      },
      bots: {
        total: allBots.length,
        active: allBots.filter(b => b.isactive).length,
        bots: allBots.slice(0, 5).map(b => ({
          id: b.id,
          name: b.botName,
          isActive: b.isactive,
          features: {
            autoReply: b.isAutoReply,
            autoSummarize: b.isautoSummarize,
            extractTasks: b.isautoExtractTaskes,
            extractMeetings: b.isautoExtractMettengs,
          },
        })),
      },
      tasks: {
        total: tasksData?.meta.total || 0,
        pending: tasksData?.meta.pendingTasks || 0,
        done: tasksData?.meta.doneTasks || 0,
        recentTasks: tasksData?.data.slice(0, 5).map(task => ({
          id: task.id,
          task: task.task,
          priority: task.priority,
          isDone: task.isDoneTask,
          createdByBot: task.isCreatedByBot,
        })) || [],
      },
      calendar: {
        total: calendarTasksData?.meta.total || 0,
        pending: calendarTasksData?.meta.pendingTasks || 0,
        completed: calendarTasksData?.meta.completedTasks || 0,
        upcomingEvents: calendarTasksData?.data.slice(0, 5).map(event => ({
          id: event.id,
          title: event.title,
          dueDate: event.dueDate,
          priority: event.priority,
          status: event.status,
        })) || [],
      },
      notifications: {
        total: allNotifications.length,
        unread: allNotifications.filter(n => !n.isRead).length,
        recentNotifications: allNotifications.slice(0, 5).map(n => ({
          type: n.type,
          title: n.title,
          description: n.description,
          isRead: n.isRead,
        })),
      },
    };
  };

  const pageContext = buildPageContext();

  const sendMessage = async (message: string): Promise<string> => {
    setIsLoading(true);

    try {
      // Add user message to history
      setChatHistory(prev => [...prev, { role: 'user', content: message }]);

      // Call AI assistant API
      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          context: pageContext,
          history: chatHistory,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from assistant');
      }

      const data = await response.json();
      const assistantMessage = data.response || 'Sorry, I couldn\'t process that request.';

      // Add assistant response to history
      setChatHistory(prev => [...prev, { role: 'assistant', content: assistantMessage }]);

      return assistantMessage;
    } catch (error) {
      console.error('AI Assistant error:', error);
      const errorMessage = 'Sorry, I encountered an error. Please try again.';
      setChatHistory(prev => [...prev, { role: 'assistant', content: errorMessage }]);
      return errorMessage;
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = () => {
    setChatHistory([]);
  };

  // Clear history when page changes
  useEffect(() => {
    clearHistory();
  }, [location.pathname]);

  return (
    <AIAssistantContext.Provider
      value={{
        currentPage: getCurrentPage(),
        pageContext,
        isAssistantOpen,
        setIsAssistantOpen,
        sendMessage,
        isLoading,
        chatHistory,
        clearHistory,
      }}
    >
      {children}
    </AIAssistantContext.Provider>
  );
};
