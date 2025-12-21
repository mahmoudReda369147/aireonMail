import { get } from './apiCall';

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