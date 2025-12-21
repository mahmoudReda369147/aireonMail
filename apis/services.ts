import { get, post, put, del } from './apiCall';

// Gmail Email interfaces
export interface GmailAttachment {
  filename: string;
  mimeType: string | null;
  size: number | null;
  attachmentId: string;
  data: string | null;
  tooLarge: boolean;
  error: string | null;
}

export interface GmailEmail {
  id: string;
  threadId: string;
  snippet: string;
  internalDate: number;
  from: string;
  to: string;
  subject: string;
  date: string;
  textBody: string | null;
  htmlBody: string | null;
  attachments: GmailAttachment[];
  error: string | null;
}

export interface GmailEmailsMeta {
  count: number;
  pageSize: number;
  nextPageToken: string | null;
  hasMore: boolean;
  resultSizeEstimate: number | null;
  q: string | null;
}

export interface GmailEmailsResponse {
  success: boolean;
  message: string;
  data: GmailEmail[];
  meta: GmailEmailsMeta;
}

// Sent Email interfaces
export interface GmailSentEmail {
  id: string;
  threadId: string;
  snippet: string;
  subject: string;
  from: string;
  to: string;
  cc: string;
  bcc: string;
  date: string;
  internalDate: number;
  labelIds: string[];
}

export interface GmailSentEmailsMeta {
  count: number;
  pageSize: number;
  nextPageToken: string | null;
  hasMore: boolean;
  resultSizeEstimate: number;
  q: string;
}

export interface GmailSentEmailsResponse {
  success: boolean;
  message: string;
  data: GmailSentEmail[];
  meta: GmailSentEmailsMeta;
}

// Templates interfaces
export interface UserTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  categure: string;
  usedtimes: number;
  isFavorets: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserTemplatesResponse {
  success: boolean;
  message: string;
  data: UserTemplate[];
}

export interface CreateTemplateRequest {
  name: string;
  subject: string;
  body: string;
  categure: string;
}

export interface CreateTemplateResponse {
  success: boolean;
  message: string;
  data: UserTemplate;
}

export interface UpdateTemplateRequest {
  name: string;
  subject: string;
  body: string;
  categure: string;
  isFavorets: boolean;
}

export interface UpdateTemplateResponse {
  success: boolean;
  message: string;
  data: UserTemplate;
}

export interface DeleteTemplateResponse {
  success: boolean;
  message: string;
}

// Gmail API service function
export const fetchGmailEmails = async (pageToken?: string): Promise<GmailEmailsResponse> => {
  const params = new URLSearchParams();
  if (pageToken) {
    params.append('pageToken', pageToken);
  }
  
  const url = `/gmail/emails${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await get<GmailEmailsResponse>(url);
  return response.data;
};

// Gmail Sent emails service function
export const fetchGmailSentEmails = async (pageToken?: string): Promise<GmailSentEmailsResponse> => {
  const params = new URLSearchParams();
  if (pageToken) {
    params.append('pageToken', pageToken);
  }
  
  const url = `/gmail/sended${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await get<GmailSentEmailsResponse>(url);
  return response.data;
};

// User templates service function
export const fetchUserTemplates = async (): Promise<UserTemplatesResponse> => {
  const response = await get<UserTemplatesResponse>('/templates/user');
  return response.data;
};

export const createTemplate = async (data: CreateTemplateRequest): Promise<CreateTemplateResponse> => {
  const response = await post<CreateTemplateResponse>('/templates/create', data);
  return response.data;
};

export const updateTemplate = async (id: string, data: UpdateTemplateRequest): Promise<UpdateTemplateResponse> => {
  const response = await put<UpdateTemplateResponse>(`/templates/${id}`, data);
  return response.data;
};

export const deleteTemplate = async (id: string): Promise<DeleteTemplateResponse> => {
  const response = await del<DeleteTemplateResponse>(`/templates/${id}`);
  return response.data;
};

// Convert Gmail email to app Email format
export const mapGmailEmailToEmail = (gmailEmail: GmailEmail): import('../types').Email => {
  // Extract sender name from "Name <email>" format or use the full string
  const extractName = (fromField: string): string => {
    const match = fromField.match(/^(.+?)\s*<.*>$/);
    return match ? match[1].trim() : fromField;
  };

  // Extract sender email from "Name <email>" format
  const extractEmail = (fromField: string): string => {
    const match = fromField.match(/<(.+)>$/);
    return match ? match[1] : fromField;
  };

  return {
    id: gmailEmail.id,
    sender: extractName(gmailEmail.from),
    senderEmail: extractEmail(gmailEmail.from),
    subject: gmailEmail.subject,
    preview: gmailEmail.snippet,
    body: gmailEmail.textBody || gmailEmail.htmlBody || '',
    timestamp: gmailEmail.date,
    read: false, // Gmail doesn't provide read status in this structure
    folder: 'inbox' as const,
    attachments: gmailEmail.attachments.map(att => ({
      name: att.filename,
      type: att.mimeType?.startsWith('image/') ? 'image' : 
            att.mimeType?.startsWith('video/') ? 'video' : 'document',
      url: att.data || '',
      size: att.size ? `${att.size} bytes` : 'Unknown size'
    }))
  };
};

// Convert Gmail sent email to app Email format
export const mapGmailSentEmailToEmail = (gmailSentEmail: GmailSentEmail): import('../types').Email => {
  // Extract recipient name from "Name <email>" format or use the full string
  const extractName = (toField: string): string => {
    const match = toField.match(/^(.+?)\s*<.*>$/);
    return match ? match[1].trim() : toField;
  };

  // Extract recipient email from "Name <email>" format
  const extractEmail = (toField: string): string => {
    const match = toField.match(/<(.+)>$/);
    return match ? match[1] : toField;
  };

  return {
    id: gmailSentEmail.id,
    sender: extractName(gmailSentEmail.to),
    senderEmail: extractEmail(gmailSentEmail.to),
    subject: gmailSentEmail.subject,
    preview: gmailSentEmail.snippet,
    body: '', // Sent emails might not include body in list view
    timestamp: gmailSentEmail.date,
    read: true, // Sent emails are always "read"
    folder: 'sent' as const,
    attachments: [] // Sent emails list might not include attachments
  };
};

// Convert User template to app EmailTemplate format
export const mapUserTemplateToEmailTemplate = (userTemplate: UserTemplate): import('../types').EmailTemplate => {
  return {
    id: userTemplate.id,
    name: userTemplate.name,
    subject: userTemplate.subject,
    body: userTemplate.body,
    category: userTemplate.categure
  };
};