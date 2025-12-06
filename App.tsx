import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useAppContext } from './contexts/AppContext';
import { ToastProvider } from './components/common/Toast';
import { ConfirmationModal } from './components/common/ConfirmationModal';
import { Layout } from './components/Layout';
import { InboxPage } from './pages/InboxPage';
import { SmartInboxPage } from './pages/SmartInboxPage';
import { SentPage } from './pages/SentPage';
import { DraftsPage } from './pages/DraftsPage';
import { SettingsPage } from './pages/SettingsPage';
import { AutomationPage } from './pages/AutomationPage';
import { ConversationAutomationPage } from './pages/ConversationAutomationPage';
import { VeoStudioPage } from './pages/VeoStudioPage';
import { ContactsPage } from './pages/ContactsPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ComposePage } from './pages/ComposePage';
import { AccountsPage } from './pages/AccountsPage';
import { PlansPage } from './pages/PlansPage';
import { LoginPage } from './pages/LoginPage';
import { TemplatesPage } from './pages/TemplatesPage';
import { TemplateEditorPage } from './pages/TemplateEditorPage';

// Wrapper to handle auth logic cleanly
const AppRoutes = () => {
  const { isAuthenticated } = useAppContext();

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

              <Route path="/templates" element={<TemplatesPage />} />
              <Route path="/templates/editor" element={<TemplateEditorPage />} />

              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/accounts" element={<AccountsPage />} />
              <Route path="/plans" element={<PlansPage />} />

              <Route path="/automation" element={<AutomationPage />} />
              <Route path="/thread-automation/:id" element={<ConversationAutomationPage />} />
              <Route path="/thread-automation" element={<ConversationAutomationPage />} />
              
              <Route path="/studio" element={<VeoStudioPage />} />
              <Route path="/contacts" element={<ContactsPage />} />
              
              {/* Fallback for authenticated users */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Layout>
        ) : (
          <Navigate to="/login" replace />
        )
      } />
    </Routes>
  );
};

const App = () => {
  return (
    <AppProvider>
      <ToastProvider>
        <HashRouter>
          <AppRoutes />
          <ConfirmationModal />
        </HashRouter>
      </ToastProvider>
    </AppProvider>
  );
};

export default App;