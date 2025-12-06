
export enum ViewState {
  INBOX = 'INBOX',
  SMART_INBOX = 'SMART_INBOX',
  READING = 'READING',
  COMPOSE = 'COMPOSE',
  AUTOMATION = 'AUTOMATION',
  VEO_STUDIO = 'VEO_STUDIO',
  SETTINGS = 'SETTINGS',
  CONTACTS = 'CONTACTS',
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  avatar: string; // URL or Initials
  provider: 'google' | 'microsoft' | 'apple' | 'other';
  color: string; // For UI theming
}

export interface SearchFilters {
  from: string;
  to: string;
  dateStart: string;
  dateEnd: string;
  hasAttachments: boolean;
}

export interface Task {
  id: string;
  description: string;
  deadline?: string;
  priority: 'High' | 'Medium' | 'Low';
  completed: boolean;
}

export interface Email {
  id: string;
  sender: string;
  senderEmail: string;
  subject: string;
  preview: string;
  body: string;
  timestamp: string;
  read: boolean;
  isSmart?: boolean;
  priorityScore?: number; // 0-100
  tags?: string[];
  summary?: string;
  attachments?: Attachment[];
  folder: 'inbox' | 'sent' | 'drafts' | 'trash';
  tasks?: Task[];
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: string;
}

export interface Attachment {
  name: string;
  type: 'image' | 'document' | 'video';
  url: string; // Base64 or URL
  size: string;
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  avatar: string;
  notes?: string;
}

export interface AutomationNode {
  id: string;
  type: 'trigger' | 'condition' | 'action';
  label: string;
  x: number;
  y: number;
}

export interface AutomationLink {
  source: string;
  target: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

// New Types for Conversation Automation
export interface ThreadAutomationConfig {
  threadId: string;
  active: boolean;
  autoReply: {
    enabled: boolean;
    tone: 'Professional' | 'Friendly' | 'Concise' | 'Detailed';
    matchMyStyle: boolean;
  };
  actions: {
    summarize: boolean;
    extractTasks: boolean;
    autoLabel: boolean;
    translate: boolean;
    translationLanguage?: string;
  };
  customPrompt: string;
  logs: AutomationLog[];
}

export interface AutomationLog {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  status: 'success' | 'failed' | 'pending';
}

export interface LiveAssistantConfig {
  name: string;
  voice: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Aoede';
  language: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'info' | 'success' | 'alert';
}
