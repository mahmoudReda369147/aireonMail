import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppProvider, useAppContext } from './contexts/AppContext';
import { ToastProvider } from './components/common/Toast';
import { ConfirmationModal } from './components/common/ConfirmationModal';
import { Layout } from './components/Layout';
import { InboxPage } from './pages/InboxPage';
import { SmartInboxPage } from './pages/SmartInboxPage';
import { SentPage } from './pages/SentPage';
import { DraftsPage } from './pages/DraftsPage';
import { ChatsPage } from './pages/ChatsPage';
import { SettingsPage } from './pages/SettingsPage';
import { AutomationPage } from './pages/AutomationPage';
import { ConversationAutomationPage } from './pages/ConversationAutomationPage';
import { CreateBotPage } from './pages/CreateBotPage';
import { VeoStudioPage } from './pages/VeoStudioPage';
import { ContactsPage } from './pages/ContactsPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ComposePage } from './pages/ComposePage';
import { AccountsPage } from './pages/AccountsPage';
import { PlansPage } from './pages/PlansPage';
import { LoginPage } from './pages/LoginPage';
import { TemplatesPage } from './pages/TemplatesPage';
import { TemplateEditorPage } from './pages/TemplateEditorPage';
import { TasksPage } from './pages/TasksPage';
import { CalendarTasksPage } from './pages/CalendarTasksPage';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Wrapper to handle auth logic cleanly
const AppRoutes = () => {
  const { isAuthenticated, isCheckingAuth } = useAppContext();

  // Show loading while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="h-screen w-full bg-midnight text-slate-200 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-fuchsia-500/30 border-t-fuchsia-500 rounded-full animate-spin"></div>
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Route */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/inbox" replace /> : <LoginPage />}
      />

      {/* Protected Routes - Wrapped in Layout */}
      <Route path="/*" element={
        isAuthenticated ? (
          <Layout>
            <Routes>
              <Route path="/" element={<Navigate to="/inbox" replace />} />

              <Route path="/inbox/:id" element={<InboxPage />} />
              <Route path="/inbox" element={<InboxPage />} />

              <Route path="/smart-inbox/:id" element={<SmartInboxPage />} />
              <Route path="/smart-inbox" element={<SmartInboxPage />} />

              <Route path="/compose" element={<ComposePage />} />

              <Route path="/sent/:id" element={<SentPage />} />
              <Route path="/sent" element={<SentPage />} />

              <Route path="/drafts/:id" element={<DraftsPage />} />
              <Route path="/drafts" element={<DraftsPage />} />

              <Route path="/chats/:id" element={<ChatsPage />} />
              <Route path="/chats" element={<ChatsPage />} />

              <Route path="/templates" element={<TemplatesPage />} />
              <Route path="/templates/editor" element={<TemplateEditorPage />} />

              <Route path="/tasks" element={<TasksPage />} />
              <Route path="/calendar" element={<CalendarTasksPage />} />

              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/accounts" element={<AccountsPage />} />
              <Route path="/plans" element={<PlansPage />} />

              <Route path="/automation" element={<AutomationPage />} />
              <Route path="/thread-automation/create-bot" element={<CreateBotPage />} />
              <Route path="/thread-automation/:id/:botId" element={<ConversationAutomationPage />} />
              <Route path="/thread-automation/:id" element={<ConversationAutomationPage />} />
              <Route path="/thread-automation/bot/:botId" element={<ConversationAutomationPage />} />
              <Route path="/thread-automation" element={<ConversationAutomationPage />} />

              <Route path="/studio" element={<VeoStudioPage />} />
              <Route path="/contacts" element={<ContactsPage />} />

              {/* Fallback for authenticated users */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Layout>
        ) : (
          <Navigate to="login" replace />
        )
      } />
    </Routes>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <ToastProvider>
          <BrowserRouter>
            <AppRoutes />
            <ConfirmationModal />
          </BrowserRouter>
        </ToastProvider>
      </AppProvider>
    </QueryClientProvider>
  );
};

export default App;