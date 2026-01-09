
import React, { useEffect, useRef, useState } from 'react';
import { X, Mic, MicOff, Volume2, Sparkles, Minus, Maximize2, GripHorizontal, AlertCircle } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { getLiveClient } from '../services/geminiService';
import { createPcmBlob, decodeAudioData, base64ToUint8Array } from '../services/audioUtils';
import { Modality, LiveServerMessage, Type, FunctionDeclaration } from '@google/genai';
import { Email } from '../types';
import { useAppContext } from '../contexts/AppContext';
import { useGmailEmails, useGmailSentEmails, useUserTemplates, useBots, useAllTasks, useCalendarTasks, useArchivedEmails, useEmailCounts, useNotifications } from '../apis/hooks';

interface LiveAssistantProps {
  onClose: () => void;
  emails: Email[];
}

export const LiveAssistant: React.FC<LiveAssistantProps> = ({ onClose, emails }) => {
  const location = useLocation();
  const { liveAssistantConfig, userData } = useAppContext();
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState("Initializing...");
  const [error, setError] = useState<string | null>(null);
  const [volume, setVolume] = useState(0);

  // Fetch all app data
  const { data: emailsData } = useGmailEmails();
  const { data: sentEmailsData } = useGmailSentEmails();
  const { data: templatesData } = useUserTemplates();
  const { data: botsData } = useBots();
  const { data: tasksData } = useAllTasks({ page: 1, limit: 100 });
  const { data: calendarTasksData } = useCalendarTasks({ page: 1, limit: 100 });
  const { data: archivedEmailsData } = useArchivedEmails();
  const { data: emailCountsData } = useEmailCounts();
  const { data: notificationsData } = useNotifications();

  // UI State for Drag & Minimize
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: window.innerWidth - 380, y: window.innerHeight - 500 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);

  const emailsRef = useRef(emails);
  const appDataRef = useRef<any>({});

  useEffect(() => {
    emailsRef.current = emails;
  }, [emails]);

  // Update app data ref
  useEffect(() => {
    const allEmails = emailsData?.pages.flatMap(page => page.data) || [];
    const allSentEmails = sentEmailsData?.pages.flatMap(page => page.data) || [];
    const allBots = botsData?.pages.flatMap(page => page.data) || [];
    const allNotifications = notificationsData?.pages.flatMap(page => page.data) || [];

    appDataRef.current = {
      currentPage: getCurrentPage(),
      pathname: location.pathname,
      emails: allEmails,
      sentEmails: allSentEmails,
      templates: templatesData?.data || [],
      bots: allBots,
      tasks: tasksData?.data || [],
      calendarTasks: calendarTasksData?.data || [],
      drafts: archivedEmailsData?.data || [],
      notifications: allNotifications,
      emailCounts: emailCountsData?.data,
    };
  }, [emailsData, sentEmailsData, templatesData, botsData, tasksData, calendarTasksData, archivedEmailsData, emailCountsData, notificationsData, location.pathname]);

  // Get current page name
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

  // Dragging Logic
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging) return;
        setPosition({
            x: e.clientX - dragOffset.current.x,
            y: e.clientY - dragOffset.current.y
        });
    };
    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragOffset.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y
    };
  };

  useEffect(() => {
    let cleanup = false;

    const startSession = async () => {
      try {
        setStatus("Checking devices...");

        // Check for media devices support
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
             throw new Error("Media devices API not supported");
        }

        // Initialize Audio Contexts
        try {
            inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        } catch (e) {
            throw new Error("AudioContext not supported");
        }

        // Request Microphone
        let stream;
        try {
             stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, sampleRate: 16000 } });
             streamRef.current = stream;
        } catch (e: any) {
             if (e.name === 'NotFoundError' || e.name === 'DevicesNotFoundError') {
                 throw new Error("Microphone not found");
             } else if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
                 throw new Error("Microphone permission denied");
             } else {
                 throw new Error("Cannot access microphone");
             }
        }

        setStatus("Connecting to Gemini...");

        const liveClient = getLiveClient();

        // Define comprehensive function tools
        const emailSearchTool: FunctionDeclaration = {
          name: "search_emails",
          description: "Search for emails in inbox. Returns matching emails with full details including sender, subject, date, and content.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              query: { type: Type.STRING, description: "Keywords to search in subject or body" },
              sender: { type: Type.STRING, description: "Filter by sender email or name" },
              limit: { type: Type.NUMBER, description: "Max results to return (default 5)" }
            }
          }
        };

        const sentEmailsTool: FunctionDeclaration = {
          name: "get_sent_emails",
          description: "Get recently sent emails. Returns emails that the user has sent.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              limit: { type: Type.NUMBER, description: "Max results (default 5)" }
            }
          }
        };

        const templatesTool: FunctionDeclaration = {
          name: "get_templates",
          description: "Get email templates. Returns all saved email templates with their names, categories, and usage stats.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              category: { type: Type.STRING, description: "Filter by category" }
            }
          }
        };

        const botsTool: FunctionDeclaration = {
          name: "get_bots",
          description: "Get email automation bots. Returns all configured bots with their settings and features.",
          parameters: { type: Type.OBJECT, properties: {} }
        };

        const tasksTool: FunctionDeclaration = {
          name: "get_tasks",
          description: "Get tasks. Returns user's tasks with priorities and completion status.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              isDone: { type: Type.BOOLEAN, description: "Filter by completion status" },
              priority: { type: Type.STRING, description: "Filter by priority: low, medium, high" }
            }
          }
        };

        const calendarTool: FunctionDeclaration = {
          name: "get_calendar_events",
          description: "Get calendar events and meetings. Returns scheduled events with dates and details.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              status: { type: Type.STRING, description: "Filter by status: pending, completed" }
            }
          }
        };

        const draftsTool: FunctionDeclaration = {
          name: "get_drafts",
          description: "Get draft emails. Returns saved draft emails.",
          parameters: { type: Type.OBJECT, properties: {} }
        };

        const emailStatsTool: FunctionDeclaration = {
          name: "get_email_stats",
          description: "Get email statistics and counts. Returns total, unread, sent, archived email counts.",
          parameters: { type: Type.OBJECT, properties: {} }
        };

        const notificationsTool: FunctionDeclaration = {
          name: "get_notifications",
          description: "Get recent notifications. Returns system notifications and alerts.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              unreadOnly: { type: Type.BOOLEAN, description: "Show only unread notifications" }
            }
          }
        };

        const inboxActionsTool: FunctionDeclaration = {
          name: "get_inbox_actions",
          description: "Get information about inbox actions and buttons available when an email is selected. Returns details about the 5 action buttons: Smart Actions, AI Reply, Archive, Trash, and Menu (manual task/calendar).",
          parameters: { type: Type.OBJECT, properties: {} }
        };

        const aiReplyDetailsTool: FunctionDeclaration = {
          name: "get_ai_reply_details",
          description: "Get detailed information about the AI Reply button functionality, including quick reply prompts and draft refinement options.",
          parameters: { type: Type.OBJECT, properties: {} }
        };

        const smartActionsDetailsTool: FunctionDeclaration = {
          name: "get_smart_actions_details",
          description: "Get detailed information about the Smart Actions button functionality, including how AI analyzes emails to extract tasks and meetings.",
          parameters: { type: Type.OBJECT, properties: {} }
        };

        const emailDetailViewTool: FunctionDeclaration = {
          name: "get_email_detail_view",
          description: "Get detailed information about the Email Detail View that appears when you select an email from any page (Inbox, Sent, Drafts, etc.). Shows email content, AI summary, related tasks/calendar events, and reply functionality.",
          parameters: { type: Type.OBJECT, properties: {} }
        };

        const sessionPromise = liveClient.connect({
          model: 'gemini-2.5-flash-native-audio-preview-09-2025',
          callbacks: {
            onopen: () => {
              if (cleanup) return;
              setStatus("Listening...");
              setError(null);
              setIsActive(true);
              const ctx = inputAudioContextRef.current!;
              const source = ctx.createMediaStreamSource(stream);
              const processor = ctx.createScriptProcessor(4096, 1, 1);

              processor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                let sum = 0;
                for(let i=0; i<inputData.length; i++) sum += inputData[i] * inputData[i];
                setVolume(Math.sqrt(sum / inputData.length) * 100);

                const pcmBlob = createPcmBlob(inputData);
                sessionPromise.then(session => {
                    session.sendRealtimeInput({ media: pcmBlob });
                });
              };
              source.connect(processor);
              processor.connect(ctx.destination);
            },
            onmessage: async (msg: LiveServerMessage) => {
              if (cleanup) return;
              if (msg.toolCall) {
                console.log("Tool call received:", msg.toolCall);
                for (const fc of msg.toolCall.functionCalls) {
                  const appData = appDataRef.current;
                  let result: any = null;

                  if (fc.name === 'search_emails') {
                    const { query, sender, limit = 5 } = fc.args as any;
                    result = appData.emails.filter((e: any) => {
                      let match = true;
                      if (sender) match = match && (e.from.toLowerCase().includes(sender.toLowerCase()));
                      if (query) {
                        const q = query.toLowerCase();
                        match = match && (
                          e.subject.toLowerCase().includes(q) ||
                          (e.textBody || '').toLowerCase().includes(q) ||
                          e.from.toLowerCase().includes(q)
                        );
                      }
                      return match;
                    }).slice(0, limit).map((e: any) => ({
                      from: e.from,
                      subject: e.subject,
                      snippet: e.snippet,
                      date: e.date,
                      isRead: e.isRead
                    }));
                  }

                  else if (fc.name === 'get_sent_emails') {
                    const { limit = 5 } = fc.args as any;
                    result = appData.sentEmails.slice(0, limit).map((e: any) => ({
                      to: e.to,
                      subject: e.subject,
                      snippet: e.snippet,
                      date: e.date
                    }));
                  }

                  else if (fc.name === 'get_templates') {
                    const { category } = fc.args as any;
                    result = appData.templates
                      .filter((t: any) => !category || t.categure.toLowerCase().includes(category.toLowerCase()))
                      .map((t: any) => ({
                        name: t.name,
                        category: t.categure,
                        usedTimes: t.usedtimes,
                        isFavorite: t.isFavorets
                      }));
                  }

                  else if (fc.name === 'get_bots') {
                    result = appData.bots.map((b: any) => ({
                      name: b.botName,
                      isActive: b.isactive,
                      features: {
                        autoReply: b.isAutoReply,
                        autoSummarize: b.isautoSummarize,
                        extractTasks: b.isautoExtractTaskes,
                        extractMeetings: b.isautoExtractMettengs,
                      },
                      emails: b.emails
                    }));
                  }

                  else if (fc.name === 'get_tasks') {
                    const { isDone, priority } = fc.args as any;
                    result = appData.tasks
                      .filter((t: any) => {
                        let match = true;
                        if (isDone !== undefined) match = match && t.isDoneTask === isDone;
                        if (priority) match = match && t.priority.toLowerCase() === priority.toLowerCase();
                        return match;
                      })
                      .map((t: any) => ({
                        task: t.task,
                        priority: t.priority,
                        isDone: t.isDoneTask,
                        date: t.taskDate,
                        createdByBot: t.isCreatedByBot
                      }));
                  }

                  else if (fc.name === 'get_calendar_events') {
                    const { status } = fc.args as any;
                    result = appData.calendarTasks
                      .filter((e: any) => !status || e.status === status)
                      .map((e: any) => ({
                        title: e.title,
                        description: e.description,
                        dueDate: e.dueDate,
                        status: e.status,
                        priority: e.priority
                      }));
                  }

                  else if (fc.name === 'get_drafts') {
                    result = appData.drafts.slice(0, 10).map((d: any) => ({
                      subject: d.subject,
                      snippet: d.snippet,
                      from: d.from,
                      to: d.to
                    }));
                  }

                  else if (fc.name === 'get_email_stats') {
                    result = {
                      total: appData.emailCounts?.total || 0,
                      unread: appData.emailCounts?.unread || 0,
                      sent: appData.emailCounts?.sent || 0,
                      archived: appData.emailCounts?.archived || 0,
                      trash: appData.emailCounts?.trash || 0,
                      incompleteTasks: appData.emailCounts?.incompleteTasks || 0,
                      incompleteCalendarTasks: appData.emailCounts?.incompletedCalendarTasks || 0,
                      totalTemplates: appData.emailCounts?.templates || 0,
                      totalBots: appData.emailCounts?.bots || 0
                    };
                  }

                  else if (fc.name === 'get_notifications') {
                    const { unreadOnly } = fc.args as any;
                    result = appData.notifications
                      .filter((n: any) => !unreadOnly || !n.isRead)
                      .map((n: any) => ({
                        type: n.type,
                        title: n.title,
                        description: n.description,
                        priority: n.priority,
                        isRead: n.isRead,
                        createdAt: n.createdAt
                      }));
                  }

                  else if (fc.name === 'get_inbox_actions') {
                    result = {
                      description: "When you select an email in the Inbox, 5 action buttons appear",
                      buttons: [
                        {
                          name: "Smart Actions (1st button)",
                          description: "AI-powered button that automatically extracts tasks and calendar meetings from the email. Uses AI to understand email content and create actionable items."
                        },
                        {
                          name: "AI Reply (2nd button)",
                          description: "Generates intelligent email replies using AI. The AI knows the current email context and provides smart response suggestions."
                        },
                        {
                          name: "Archive (3rd button)",
                          description: "Archives the selected email. Moves it from inbox to archived folder while keeping it accessible."
                        },
                        {
                          name: "Trash (4th button)",
                          description: "Deletes the selected email and moves it to trash folder. Can be permanently deleted later."
                        },
                        {
                          name: "Menu (5th button)",
                          description: "Opens additional options with 2 features: (1) Add Task Manually - create task without AI, (2) Add Calendar Event Manually - create calendar event without AI."
                        }
                      ],
                      additionalFeatures: {
                        cleanUpButton: "Bulk delete all Gmail emails at once from the inbox"
                      }
                    };
                  }

                  else if (fc.name === 'get_ai_reply_details') {
                    result = {
                      description: "AI Reply button opens a sidebar with comprehensive reply generation and refinement tools",
                      workflow: "1. Click AI Reply button → 2. Sidebar opens → 3. Choose prompt or quick option → 4. AI generates reply → 5. Refine if needed → 6. Send",
                      section1_quickReplyPrompts: {
                        description: "User can write custom prompt OR choose from 4 quick reply options",
                        options: [
                          {
                            name: "Agree and Confirm",
                            description: "Generate a reply that agrees with the email content"
                          },
                          {
                            name: "Polite Decline",
                            description: "Generate a polite reply that declines the request"
                          },
                          {
                            name: "Ask for Details",
                            description: "Generate a reply asking for more information or clarification"
                          },
                          {
                            name: "Thank You",
                            description: "Generate a thank you reply"
                          }
                        ],
                        note: "After selecting an option or writing a custom prompt, AI generates an auto-reply based on the current opened email context"
                      },
                      section2_refineDraft: {
                        description: "After AI generates the reply, user can refine it with 2 refinement categories",
                        optionA_grammarAndLength: {
                          name: "Grammar & Length",
                          choices: [
                            {
                              name: "Fix Grammar",
                              description: "Correct grammar and spelling errors in the reply"
                            },
                            {
                              name: "Make Shorter",
                              description: "Shorten the email reply while keeping key points"
                            },
                            {
                              name: "Expand It",
                              description: "Make the email reply longer and more detailed"
                            },
                            {
                              name: "Formalize It",
                              description: "Make the tone more formal and professional"
                            }
                          ]
                        },
                        optionB_adjustTone: {
                          name: "Adjust Tone",
                          choices: [
                            {
                              name: "Friendly",
                              description: "Make the tone warm and friendly"
                            },
                            {
                              name: "Urgent",
                              description: "Add urgency to the message"
                            },
                            {
                              name: "Confident",
                              description: "Make the tone more assertive and confident"
                            },
                            {
                              name: "Casual",
                              description: "Make the tone relaxed and casual"
                            }
                          ]
                        }
                      }
                    };
                  }

                  else if (fc.name === 'get_smart_actions_details') {
                    result = {
                      description: "Smart Actions button uses AI to automatically analyze email content and extract actionable items",
                      workflow: "1. Click Smart Actions button → 2. AI analyzes the Gmail content → 3. AI extracts tasks (if any) → 4. AI extracts meetings/calendar events (if any) → 5. User can review and save each task → 6. User can save meetings as calendar events",
                      howItWorks: {
                        aiAnalysis: "When you click Smart Actions, AI reads and understands the entire email content including subject, body, and context",
                        taskExtraction: "AI identifies actionable items, to-dos, requests, and action items mentioned in the email",
                        meetingExtraction: "AI identifies meeting mentions, date/time references, meeting requests, and calendar events in the email"
                      },
                      features: {
                        tasks: {
                          description: "AI extracts tasks from email content",
                          details: [
                            "Identifies action items and to-dos mentioned in the email",
                            "Extracts task descriptions and deadlines if mentioned",
                            "Assigns priority levels based on urgency indicators in the email",
                            "User can review each extracted task",
                            "User can choose which tasks to save to their task list",
                            "Multiple tasks can be extracted from a single email"
                          ]
                        },
                        meetings: {
                          description: "AI extracts meeting/calendar events from email content",
                          details: [
                            "Identifies meeting requests and invitations in the email",
                            "Extracts meeting titles, dates, times, and durations",
                            "Understands relative dates like 'tomorrow', 'next Tuesday', etc.",
                            "Extracts meeting agendas and descriptions",
                            "User can review extracted meeting details",
                            "User can save meetings as calendar events",
                            "Can extract multiple meetings from a single email"
                          ]
                        }
                      },
                      savingOptions: {
                        tasks: "Each extracted task can be individually saved to your Tasks list. You can edit details before saving.",
                        meetings: "Each extracted meeting can be saved as a calendar event. You can review and modify event details before saving."
                      },
                      availability: "Smart Actions button is available in both Inbox page and Sent Emails page"
                    };
                  }

                  else if (fc.name === 'get_email_detail_view') {
                    result = {
                      description: "Email Detail View appears when you select any email from any page (Inbox, Sent, Drafts, etc.)",
                      location: "Opens in the right panel or main area when you click on an email from the email list",
                      structure: {
                        topSection: {
                          name: "Action Buttons Bar",
                          description: "Shows action buttons based on which page you're on (5 buttons in Inbox, 2 buttons in Sent, etc.)",
                          availableOn: "All email pages (Inbox, Sent, Drafts)"
                        },
                        emailHeader: {
                          name: "Email Header Section",
                          displayOrder: [
                            {
                              position: 1,
                              field: "Email Subject",
                              description: "The subject line of the email displayed prominently at the top"
                            },
                            {
                              position: 2,
                              field: "Sender/Receiver Information",
                              description: "Shows Sender name and email if viewing in Inbox page. Shows Receiver name and email if viewing in Sent page. Dynamically changes based on current page context."
                            },
                            {
                              position: 3,
                              field: "Date/Time",
                              description: "When the email was sent or received, displayed with the sender/receiver info"
                            }
                          ]
                        },
                        aiSummarySection: {
                          name: "AI Summary",
                          description: "AI-generated summary of the email content",
                          features: [
                            "Automatically generated summary of email content",
                            "Provides quick overview without reading full email",
                            "Highlights key points and main topics",
                            "Helps quickly understand email purpose"
                          ]
                        },
                        relatedItemsSection: {
                          name: "Calendar Tasks/Events Section",
                          description: "Shows calendar tasks and events that exist/are related to this email",
                          features: [
                            "Displays calendar tasks associated with this email",
                            "Shows existing calendar events linked to the email",
                            "User can view task/event details",
                            "User can edit tasks and calendar events",
                            "User can delete tasks and calendar events",
                            "Shows tasks created by AI or manually from this email"
                          ]
                        },
                        emailBodySection: {
                          name: "Email Body/Content",
                          description: "The full content of the email message",
                          features: [
                            "Displays complete email body with formatting",
                            "Shows HTML formatted content if available",
                            "Includes inline images and attachments",
                            "Scrollable if content is long"
                          ]
                        },
                        replyEditorSection: {
                          name: "Reply Box/Editor",
                          description: "Rich text editor at the bottom for composing replies",
                          features: [
                            "Write and compose email replies",
                            "Edit AI-generated replies before sending",
                            "Send reply to the same sender/receiver",
                            "Rich text formatting options",
                            "Available in all email views (Inbox, Sent, Drafts)"
                          ],
                          workflow: "Type your reply → Edit if needed → Send to original sender"
                        }
                      },
                      keyFeatures: {
                        dynamicContext: "Content adapts based on which page you're viewing (Inbox shows sender, Sent shows receiver)",
                        aiIntegration: "AI summary provides instant understanding of email content",
                        taskManagement: "View, edit, and delete calendar tasks directly from email view",
                        replyCapability: "Quick reply without leaving the email view"
                      },
                      availability: "Email Detail View is available across ALL email pages: Inbox, Sent Emails, Drafts, and any other email listing page"
                    };
                  }

                  sessionPromise.then(session => {
                    session.sendToolResponse({
                      functionResponses: {
                        id: fc.id,
                        name: fc.name,
                        response: { result: result || [] }
                      }
                    });
                  });
                }
              }
              const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
              if (audioData && outputAudioContextRef.current) {
                const ctx = outputAudioContextRef.current;
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                const buffer = await decodeAudioData(base64ToUint8Array(audioData), ctx);
                const source = ctx.createBufferSource();
                source.buffer = buffer;
                source.connect(ctx.destination);
                source.addEventListener('ended', () => sourcesRef.current.delete(source));
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += buffer.duration;
                sourcesRef.current.add(source);
              }
              if (msg.serverContent?.interrupted) {
                 sourcesRef.current.forEach(s => s.stop());
                 sourcesRef.current.clear();
                 nextStartTimeRef.current = 0;
              }
            },
            onclose: () => {
              if (!cleanup) {
                  setStatus("Disconnected");
                  setIsActive(false);
              }
            },
            onerror: (err) => {
              console.error(err);
              if (!cleanup) {
                  setError("Connection Error");
                  setStatus("Failed");
              }
            }
          },
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: liveAssistantConfig.voice } }
            },
            systemInstruction: `You are ${liveAssistantConfig.name}, an advanced AI assistant for Aireon Mail - a comprehensive email management platform with powerful automation features.

**Your Identity:**
- Communicate in ${liveAssistantConfig.language}
- Be concise, helpful, and speak naturally
- User's name: ${userData?.name || 'User'}
- Current page: ${getCurrentPage()}

**Application Features You Can Help With:**

1. **INBOX PAGE (Main Email View):**
   The Inbox shows all emails that are NOT in Sent, NOT in Drafts, and NOT in Trash.

   **Inbox Features:**
   - **Clean Up Button**: Delete all Gmail emails at once (bulk deletion)
   - **Email List**: Display all inbox emails with selection capability

   **When User Selects an Email, 5 Action Buttons Appear:**

   a) **Smart Actions Button** (1st button):
      AI-powered button that automatically analyzes email content and extracts actionable items.

      **How Smart Actions Works:**
      1. Click the Smart Actions button on a selected email
      2. AI reads and analyzes the entire email content (subject, body, context)
      3. AI extracts tasks if any action items are mentioned in the email
      4. AI extracts meetings/calendar events if any meeting mentions exist
      5. User can review all extracted tasks and meetings
      6. User can save each task individually to their Tasks list
      7. User can save each meeting individually as a calendar event

      **Task Extraction:**
      - AI identifies actionable items, to-dos, requests mentioned in the email
      - Extracts task descriptions and deadlines (if mentioned)
      - Assigns priority levels (High/Medium/Low) based on urgency indicators
      - Multiple tasks can be extracted from a single email
      - User reviews and chooses which tasks to save

      **Meeting/Calendar Extraction:**
      - AI identifies meeting requests and invitations in the email
      - Extracts meeting title, date, time, duration, and agenda
      - Understands relative dates like "tomorrow", "next Tuesday", etc.
      - Multiple meetings can be extracted from a single email
      - User reviews and saves meetings as calendar events

      **Key Benefits:**
      - Automatic extraction - no manual reading required
      - Saves time by identifying action items instantly
      - Never miss important tasks or meetings hidden in emails
      - Edit extracted items before saving them

   b) **AI Reply Button** (2nd button):
      When clicked, opens a sidebar with AI reply tools.

      **AI Reply Sidebar Structure:**

      **SECTION 1: Quick Reply Prompts (4 Options)**
      The user can write a custom prompt OR choose from 4 quick options:

      1. **Agree and Confirm**: Generate a reply that agrees with the email
      2. **Polite Decline**: Generate a reply that politely declines the request
      3. **Ask for Details**: Generate a reply asking for more information
      4. **Thank You**: Generate a thank you reply

      After selecting a quick option or writing a prompt, the AI generates an auto-reply message based on the current opened email context.

      **SECTION 2: Refine Draft**
      After the AI generates the reply, the user can refine it with 2 sub-options:

      **Option A - Grammar & Length (4 choices):**
      1. **Fix Grammar**: Correct grammar and spelling errors
      2. **Make Shorter**: Shorten the email reply
      3. **Expand It**: Make the email reply longer and more detailed
      4. **Formalize It**: Make the tone more formal and professional

      **Option B - Adjust Tone (4 choices):**
      1. **Friendly**: Make the tone warm and friendly
      2. **Urgent**: Add urgency to the message
      3. **Confident**: Make the tone more assertive and confident
      4. **Casual**: Make the tone relaxed and casual

      The user can apply these refinements to improve the AI-generated reply before sending.

   c) **Archive Button** (3rd button):
      - Archives the selected email
      - Removes email from inbox but keeps it accessible
      - Moves email to archived folder

   d) **Trash Button** (4th button):
      - Deletes the selected email
      - Moves email to trash folder
      - Can be permanently deleted later

   e) **Menu Button** (5th button):
      - Opens additional options menu
      - **Add Task Manually**: Create a task manually (not by AI)
      - **Add Calendar Event Manually**: Create calendar event manually (not by AI)
      - Manual task and calendar creation (user input required)

2. **EMAIL DETAIL VIEW (Universal Across All Pages):**
   When you select ANY email from ANY page (Inbox, Sent, Drafts, etc.), the Email Detail View opens.

   **Email Detail View Structure (Top to Bottom):**

   1. **Action Buttons Bar** (at the top):
      - Shows different buttons depending on which page you're viewing
      - Inbox: 5 action buttons (Smart Actions, AI Reply, Archive, Trash, Menu)
      - Sent: 2 action buttons (Smart Actions, More Actions)
      - Adapts to the current page context

   2. **Email Header Section**:
      - **Subject**: The email subject line displayed prominently
      - **Sender/Receiver**: Dynamically shows sender info (in Inbox) OR receiver info (in Sent page)
      - **Date/Time**: When the email was sent or received

   3. **AI Summary Section**:
      - AI-generated summary of the email content
      - Provides quick overview without reading the full email
      - Highlights key points and main topics
      - Helps users quickly understand the email's purpose

   4. **Calendar Tasks/Events Section**:
      - Shows calendar tasks and events related to this email
      - Displays tasks created by AI or manually from this email
      - User can **view** task/event details
      - User can **edit** tasks and calendar events
      - User can **delete** tasks and calendar events
      - Shows all associated actionable items

   5. **Email Body/Content Section**:
      - Displays the complete email body with full formatting
      - Shows HTML formatted content if available
      - Includes inline images and attachments
      - Scrollable for long emails

   6. **Reply Box/Editor** (at the bottom):
      - Rich text editor for composing replies
      - Write new replies or edit AI-generated replies
      - Send reply to the original sender/receiver
      - Available across all email pages

   **Key Features:**
   - **Dynamic Context**: Content adapts based on viewing page (Inbox shows sender, Sent shows receiver)
   - **AI Integration**: Instant AI summary for quick understanding
   - **Task Management**: View, edit, delete calendar tasks directly from email
   - **Quick Reply**: Reply without leaving the email view

3. **SENT EMAILS PAGE:**
   This page shows all emails that the user has sent to other people.

   **Sent Emails Features:**
   - **Email List**: Display all emails sent by the user
   - **Email Selection**: Click any sent email to view Email Detail View (described above)

   **When User Selects a Sent Email, 2 Action Buttons Appear:**

   a) **Smart Actions Button** (1st button):
      AI-powered button that analyzes sent email content and extracts actionable items.

      **Works the same as Inbox Smart Actions:**
      - Click Smart Actions on a sent email
      - AI analyzes the sent email content
      - Extracts tasks if any action items exist in the sent email
      - Extracts meetings/calendar events if any meeting mentions exist
      - User reviews and saves each task or meeting individually
      - Useful for tracking commitments you made in sent emails

   b) **More Actions Button** (2nd button):
      - Manual actions menu
      - **Add Task Manually**: User can manually create a task (not by AI)
      - **Add Calendar Event Manually**: User can manually create calendar event (not by AI)
      - User input required for manual creation

4. **DRAFTS PAGE:**
   This page shows all draft emails (emails that are saved but not sent yet).

   **Drafts Page Features:**
   - **Email List**: Display all draft emails
   - **Email Selection**: Click any draft email to view Email Detail View (described above)
   - **Same functionality as Inbox page** with one key difference

   **Key Differences from Inbox:**
   - Shows **draft emails** instead of inbox emails
   - Draft emails are saved emails that haven't been sent yet
   - **Unarchive Button** instead of Archive Button (4th button position)

   **When User Selects a Draft Email, 5 Action Buttons Appear:**

   a) **Smart Actions Button** (1st button):
      - Works exactly the same as Inbox Smart Actions
      - AI analyzes draft email content
      - Extracts tasks and meetings from the draft
      - User can save extracted items

   b) **AI Reply Button** (2nd button):
      - Works exactly the same as Inbox AI Reply
      - Opens sidebar with quick reply prompts and refinement options
      - Generate and refine email content

   c) **Trash Button** (3rd button):
      - Deletes the draft email
      - Moves draft to trash folder
      - Can be permanently deleted later

   d) **Unarchive Button** (4th button):
      **This is the KEY difference from Inbox page**
      - Converts the draft email back to Inbox folder
      - Moves the email from Drafts to Inbox
      - "Unarchive" instead of "Archive"
      - Restores draft to inbox for regular processing

   e) **Menu Button** (5th button):
      - Opens additional options menu
      - **Add Task Manually**: Create a task manually (not by AI)
      - **Add Calendar Event Manually**: Create calendar event manually (not by AI)
      - Manual task and calendar creation (user input required)

   **Summary:**
   - Drafts page has the same 5 action buttons as Inbox
   - Button 1, 2, 5 work exactly the same
   - Button 3 is Trash (same as Inbox)
   - Button 4 is **Unarchive** (different from Inbox's Archive)
   - Unarchive moves draft back to Inbox folder

5. **CHATS PAGE (Live Messaging/Conversations):**
   The Chats page provides a messaging interface for email conversations (threads).

   **Chats Page Structure:**

   **LEFT SIDEBAR - Chat List:**
   - **Search Box**: Search conversations by sender name, subject, or message content
   - **Chat List**: Shows all email conversation threads
   - **Chat Item Display**: Each chat shows sender name, subject, message preview, date/time, and unread count

   **RIGHT PANEL - Chat View (After Selecting a Chat):**

   1. **Expand/Collapse Button** (Action Button):
      - **Single action button** in the chat header
      - **Expand Button**: Shows/hides full HTML message content
      - Toggles between collapsed and expanded view
      - Controls whether HTML messages display in scrollable area

   2. **Messages Display Area**:
      The chat shows messages from both you and the other user:

      **Message Structure:**
      - **Your messages**: Displayed on one side (right side)
      - **Other user's messages**: Displayed on the other side (left side)
      - **Each message contains**:
        a) **Brief/Snippet**: Short preview of the message (always visible)
        b) **Full HTML Message**: Complete message with full formatting (expandable)

   3. **Show Full Message Feature**:
      - Click "Show full message" button under any message
      - Displays the complete HTML content in a **scrollable area**
      - Click "Hide full message" to collapse it back
      - Each message can be expanded/collapsed independently
      - The Expand button in header controls global HTML display settings

   4. **Message Editor** (at the bottom):
      - **Rich text editor** for composing new messages
      - Located at the very bottom of the chat view
      - User can write and send replies to the conversation
      - Send button to submit the message
      - Messages are sent as email replies in the thread

   **Key Features:**
   - **Thread-based conversations**: Messages grouped by email conversation
   - **Real-time messaging interface**: Chat-like UI for email threads
   - **Expandable HTML content**: View brief or full HTML messages
   - **Search functionality**: Find specific conversations quickly
   - **Unread indicators**: Shows number of unread messages per chat
   - **Responsive layout**: Works on all screen sizes

   **How It Works:**
   1. Select a chat from the list → Opens conversation view
   2. View message briefs (snippets) for quick reading
   3. Click "Show full message" to see complete HTML content in scrollable area
   4. Use Expand button to toggle HTML display mode
   5. Type reply in editor at bottom
   6. Send message to continue conversation

6. **TEMPLATES PAGE (Email Templates):**
   The Templates page allows users to create, manage, and use reusable email templates.

   **Templates Page Structure:**

   **TOP SECTION - Create Template Button:**
   - **Create Template Button**: Located at the top of the page
   - Clicking this button opens the template creation form

   **Create Template Form (After clicking Create Template button):**
   The form includes the following fields:

   1. **Template Name Field**:
      - Enter a descriptive name for your template
      - Required field
      - Example: "Welcome Email", "Follow-up Template", "Meeting Request"

   2. **Category Field**:
      - Select a category to organize your templates
      - Categories: Professional, Personal, Marketing, Sales, Support, etc.
      - Helps filter and find templates later

   3. **Subject Field**:
      - The email subject line for this template
      - Can include placeholders or variables
      - Example: "Thank you for your inquiry"

   4. **Body Field**:
      - The main content/body of the email template
      - Rich text editor for formatting (bold, italic, links, etc.)
      - Can include placeholders for personalization
      - Example: "Dear [Name], Thank you for..."

   5. **Save Template Button** (Submit Button):
      - Located at the bottom of the form
      - Saves the template and adds it to your templates list
      - After saving, returns to templates list view

   **TEMPLATES LIST (Under the Create Template button):**
   Shows all templates you've created:

   **Each Template Card Shows:**
   - Template name
   - Category
   - Subject preview
   - Body preview/snippet
   - Creation date
   - Last used date (if applicable)

   **Template Actions (3 Buttons per template):**

   1. **Edit Template Button**:
      - Opens the template in edit mode
      - Allows you to modify name, category, subject, and body
      - Save changes with Submit button

   2. **Delete Template Button**:
      - Permanently removes the template
      - Usually shows confirmation dialog
      - Cannot be undone

   3. **Use Template Button**:
      - **Most important action**
      - Navigates you to the **Compose Page**
      - Pre-fills the compose form with template data

   **COMPOSE PAGE (After clicking "Use Template"):**
   When you click "Use Template", you're taken to the Compose page with:

   **Pre-filled Fields:**
   1. **Receiver/To Field**: Empty (you need to fill this)
   2. **Subject Field**: Pre-filled with template subject
   3. **Body Field**: Pre-filled with template body content

   **Editing the Template Content:**
   - You can **edit the body** to customize it for the specific recipient
   - Personalize the message to make it suitable for the person you're sending to
   - Replace placeholders like [Name] with actual recipient name
   - Modify any part of the content as needed

   **Sending Options (After editing):**
   You have two options to send the email:

   1. **Send Now**:
      - Click "Send" button
      - Email is sent immediately to the recipient
      - Email appears in Sent folder

   2. **Schedule Email**:
      - Click "Schedule" button
      - Opens date/time picker
      - Select specific date and time to send the email
      - Email will be sent automatically at the scheduled time
      - Useful for sending emails at optimal times or in different time zones

   **Key Features:**
   - **Reusable templates**: Save time by reusing common email formats
   - **Categorization**: Organize templates by type/purpose
   - **Quick access**: Three-button interface for easy management
   - **Customizable**: Edit template content before sending
   - **Scheduling**: Send emails at specific times
   - **Template to email workflow**: Seamless transition from template to compose

   **Complete Workflow:**
   1. Click "Create Template" button
   2. Fill in template name, category, subject, and body
   3. Click "Save Template" (submit button)
   4. Template appears in your templates list
   5. When needed, click "Use Template" on any template
   6. System navigates to Compose page with pre-filled content
   7. Add recipient email address
   8. Edit body to personalize for recipient
   9. Either send immediately OR schedule for later
   10. Email is sent/scheduled successfully

6. **EMAIL MANAGEMENT:**
   - Compose: Help write new emails using AI
   - Search: Find specific emails by sender, subject, or content
   - Email filtering and organization

7. **THREAD BOTS PAGE (Email Automation Bots):**
   The Thread Bots page allows users to create and manage AI-powered automation bots that automatically process emails.

   **Thread Bots Page Structure:**

   **LEFT SIDEBAR - Bots List:**

   **TOP - Create New Bot Button:**
   - **Create New Bot Button**: Located at the top of the left sidebar
   - Clicking this button creates a new automation bot

   **Bots List (Below Create Button):**
   Shows all your automation bots as bot cards/boxes:

   **Each Bot Card Displays:**

   1. **Bot Name**:
      - The name of the automation bot
      - Example: "Sales Bot", "Support Auto-Reply", "Meeting Extractor"

   2. **Activation Emails**:
      - Shows which email addresses this bot monitors
      - Example: "support@company.com, sales@company.com"
      - Bot only processes emails from these addresses

   3. **Active Features (4 Text Labels)**:
      - Shows which automation features are enabled for this bot
      - **4 possible text labels appear if active:**
        a) **"Reply"**: Auto-reply feature is active
        b) **"Summarize"**: Auto-summarize feature is active
        c) **"Tasks"**: Auto-extract tasks feature is active
        d) **"Meetings"**: Auto-extract meetings feature is active
      - **Only active features are shown** - inactive features don't appear
      - Example: If bot has Reply and Tasks active, you'll see "Reply, Tasks"

   4. **Green Dot Indicator (Bot Status)**:
      - **VERY IMPORTANT STATUS INDICATOR**
      - **Green Dot Present**: Bot is ACTIVE and running
      - **No Green Dot**: Bot is INACTIVE and not running
      - This tells you at a glance if the bot is working or not

   **RIGHT PANEL - Bot Configuration (After Selecting a Bot):**
   When you click on a bot from the list, the right panel shows the bot configuration:

   **HEADER SECTION:**
   - **Activation Switch**: Toggle to activate/deactivate the entire bot
   - **Bot Name**: Displays the name of the selected bot

   **5 CONFIGURATION BOXES/SECTIONS:**

   **BOX 1 - Bot Configuration:**
   Basic bot settings and email monitoring setup.

   **Fields:**
   1. **Bot Name Field**:
      - Text input to name your bot
      - Example: "Customer Support Bot", "Lead Manager"

   2. **Email Addresses List**:
      - Shows all email addresses this bot monitors
      - Bot will only process emails from these addresses

   3. **Add Email Input + Button**:
      - **Email Input Field**: Type an email address
      - **Add Email Button**: Adds the email to the activation list
      - Workflow: Type email → Click Add → Email added to list
      - You can add multiple emails to monitor

   **BOX 2 - Email Template:**
   Configure the template used for auto-replies.

   **Options:**
   - **Select from Templates Dropdown**: Choose an existing email template
   - **OR Write Custom Template**: Text area to write a custom reply template
   - This template is used when auto-reply feature generates responses
   - Can include placeholders like [Name], [Subject], etc.

   **BOX 3 - Auto Reply Box:**
   Configure automatic email reply feature.

   **Fields:**
   1. **Activation Switch**:
      - Toggle ON/OFF to enable/disable auto-reply feature
      - When ON, bot will automatically reply to new emails

   2. **User Prompt Input**:
      - Text area for custom AI instructions
      - Tell the AI how to respond
      - Example: "Reply professionally and offer to schedule a call"

   3. **Reply Tone Dropdown**:
      - Select the tone for AI-generated replies
      - **4 options:**
        a) **Professional**: Formal, business-like tone
        b) **Friendly**: Warm, casual tone
        c) **Concise**: Brief, to-the-point tone
        d) **Detailed**: Comprehensive, thorough tone

   **BOX 4 - Smart Actions Box:**
   Configure automatic AI extraction features.

   **3 Switch Toggles:**

   1. **Summarize Messages Switch**:
      - Toggle ON/OFF to enable auto-summarization
      - When ON, bot automatically generates AI summary of each new email
      - Summary is saved and can be viewed in email detail view

   2. **Extract Tasks Switch**:
      - Toggle ON/OFF to enable auto-extract tasks
      - When ON, bot automatically extracts actionable tasks from email content
      - Tasks appear in Tasks page with bot icon indicator

   3. **Extract Meetings Switch**:
      - Toggle ON/OFF to enable auto-extract meetings
      - When ON, bot automatically extracts meeting details (date, time, agenda)
      - Meetings appear in Calendar page as calendar events

   **BOX 5 - Activity Log:**
   Shows the history of bot actions and automation logs.

   **Displays:**
   - List of all actions the bot has performed
   - Each log entry shows:
     - Action type (Reply, Summarize, Task, Meeting)
     - Email processed
     - Timestamp
     - Result/status
   - Helps you understand what the bot has done recently
   - Shows bot activity history and performance

   **HOW BOTS WORK IN THE BACKEND:**
   Understanding the automation workflow is crucial:

   **1. Bot Listening:**
   - Bot continuously monitors/listens for new emails
   - **ONLY processes emails from activation email addresses**
   - Example: If bot monitors "support@company.com", it only processes emails from that address
   - Ignores emails from other addresses

   **2. When New Email Arrives:**
   The bot checks which features are active and performs those actions:

   **A) If "Summarize Messages" is ACTIVE:**
   - Bot reads the email content
   - Uses AI to generate a concise summary
   - Saves summary to the email
   - Summary appears in email detail view under "AI Summary" section

   **B) If "Extract Tasks" is ACTIVE:**
   - Bot analyzes email content using AI
   - Identifies actionable items/tasks mentioned in the email
   - Creates task entries automatically
   - Tasks appear in Tasks page with:
     - Bot icon indicator (showing it was created by bot)
     - Bot name displayed
     - Linked to the source email (Gmail ID)

   **C) If "Extract Meetings" is ACTIVE:**
   - Bot analyzes email content using AI
   - Identifies meeting details (date, time, location, agenda)
   - Creates calendar event automatically
   - Events appear in Calendar page with meeting details

   **D) If "Auto Reply" is ACTIVE:**
   - Bot reads the email content
   - Takes the **user prompt** from Box 3
   - Takes the **email template** from Box 2 (if selected)
   - Takes the **reply tone** from Box 3
   - Uses AI to generate an appropriate reply using:
       - The user's custom instructions (prompt)
       - The template structure (if provided)
       - The selected tone (Professional/Friendly/Concise/Detailed)
   - Automatically sends the reply to the same sender
   - Reply appears in Sent Emails page

   **3. All Actions Logged:**
   - Every action the bot performs is recorded
   - Logs appear in Box 5 (Activity Log)
   - You can see what the bot did, when, and for which emails

   **Key Features:**
   - **Multiple bots**: Create different bots for different email addresses or purposes
   - **Selective monitoring**: Each bot only processes specific email addresses
   - **4 automation features**: Reply, Summarize, Tasks, Meetings (mix and match)
   - **Visual status**: Green dot shows active bots at a glance
   - **Custom AI prompts**: Tell the bot exactly how to respond
   - **Template integration**: Use existing templates or write custom ones
   - **Tone control**: Choose reply style (Professional, Friendly, etc.)
   - **Activity tracking**: Full log of bot actions
   - **On/off control**: Master switch and individual feature switches

   **Complete Workflow:**
   1. Click "Create New Bot" button
   2. Configure Bot (Box 1): Name bot and add email addresses to monitor
   3. Configure Template (Box 2): Select template or write custom one
   4. Configure Auto Reply (Box 3): Enable switch, add prompt, select tone
   5. Configure Smart Actions (Box 4): Enable summarize, tasks, meetings
   6. Activate bot using header switch
   7. Green dot appears on bot card
   8. Bot starts listening to monitored email addresses
   9. When new email arrives, bot performs all active features
   10. View bot activity in Activity Log (Box 5)

   **Example Use Case:**
   - Bot Name: "Customer Support Bot"
   - Monitor: support@mycompany.com
   - Features Active: Reply + Summarize + Tasks
   - User Prompt: "Reply professionally, offer help, and ask for more details if needed"
   - Reply Tone: Professional

   **What Happens:**
   - Customer emails support@mycompany.com
   - Bot detects new email
   - Bot generates AI summary → Saved to email
   - Bot extracts any tasks mentioned → Tasks page updated
   - Bot generates professional reply using prompt and tone → Reply sent automatically
   - All actions logged in Activity Log

7. **EMAIL AUTOMATION BOTS:**
   - Auto-Reply: Automatically respond to emails based on rules
   - Auto-Summarize: AI-powered email summaries
   - Auto-Extract Tasks: Extract actionable tasks from emails
   - Auto-Extract Meetings: Extract meeting details and calendar events
   - Custom prompts for bot behavior
   - Email-specific bot triggers

7. **TASKS PAGE (Task Management):**
   The Tasks page allows users to create, manage, filter, and track their tasks.

   **Tasks Page Structure:**

   **TOP SECTION - Add Task Button:**
   - **Add Task Button**: Located at the top of the page
   - Clicking this button opens the task creation popup/modal

   **Add Task Popup/Modal (After clicking Add Task button):**
   The form includes the following fields:

   1. **Task Description Field** (Required):
      - Text area to enter the task description
      - Main content of the task
      - Example: "Follow up with client", "Prepare presentation"

   2. **Due Date Field** (Optional):
      - Date picker to select when the task is due
      - Optional field - can be left empty
      - Format: Date/Time picker

   3. **Priority Field** (Required):
      - Dropdown/Select to choose task priority
      - Three options: **Low**, **Medium**, **High**
      - Helps prioritize tasks visually
      - Default: Medium

   4. **Gmail ID Field** (Optional):
      - Links the task to a specific email
      - If the task is related to an email, the Gmail ID is included
      - Optional field - only filled if task is email-related

   5. **Action Buttons**:
      - **Create Task Button**: Saves the task and adds it to tasks list
      - **Cancel Button**: Closes the popup without saving

   **FILTER SECTION (5 Filters):**
   Located below the Add Task button, used to filter and search tasks:

   1. **Filter 1 - Search by Title**:
      - Text input field
      - Search tasks by task description/title
      - Real-time filtering as you type
      - Example: Type "client" to find all tasks mentioning "client"

   2. **Filter 2 - Filter by Created From Date**:
      - Date picker input
      - Shows tasks created FROM a specific date onwards
      - Example: Select "2025-01-01" to see tasks created from Jan 1st onwards

   3. **Filter 3 - Filter by Created To Date**:
      - Date picker input
      - Shows tasks created UP TO a specific date
      - Combine with Filter 2 for date range filtering
      - Example: From Jan 1 TO Jan 31 shows January tasks only

   4. **Filter 4 - Filter by Priority**:
      - Dropdown/Select filter
      - Options: **All**, **Low**, **Medium**, **High**
      - Shows only tasks matching the selected priority
      - Example: Select "High" to see only high-priority tasks

   5. **Filter 5 - Filter by Status**:
      - Dropdown/Select filter
      - Three options:
        a) **Pending Tasks**: Shows tasks not yet completed (isDoneTask = false)
        b) **Done Tasks**: Shows completed tasks (isDoneTask = true)
        c) **All Tasks**: Shows all tasks regardless of status
      - Default: Shows all tasks

   **TASKS LIST (Below filters):**
   Shows all tasks matching the current filters:

   **Each Task Card/Item Displays:**

   1. **Task Description**:
      - The main task content/description
      - First line or most prominent text

   2. **Due Date**:
      - Shows the due date if it exists
      - Format: "Due: Jan 15, 2025" or similar
      - Shows "No due date" if not set

   3. **Priority Badge**:
      - Visual indicator of task priority
      - Color-coded:
        - **High**: Red badge/color
        - **Medium**: Yellow/Orange badge/color
        - **Low**: Green/Blue badge/color

   4. **Created At**:
      - Shows when the task was created
      - Format: "Created: 2 days ago" or "Created: Jan 10, 2025"

   5. **Assignment Indicator (Very Important)**:
      - Shows WHO or WHAT created this task
      - **Two types of assignments:**

      **A) Bot-Created Task (Assigned by Bot):**
      - **Indicator**: Shows a bot icon/badge
      - **Bot Name**: Displays the name of the bot that created this task
      - **Meaning**: This task was automatically extracted by an AI bot from an email
      - Example: "Assigned by: Auto-Extract Bot" with bot icon

      **B) User-Created Task (Assigned by User):**
      - **Indicator**: Shows user icon or no special icon
      - **Meaning**: This task was manually created by the user (you)
      - The user created it by clicking "Add Task" button
      - Example: "Created by: You" or just "Manual Task"

   6. **Checkbox (Done/Not Done)**:
      - Checkbox to mark task as complete or incomplete
      - **Checked**: Task is done (isDoneTask = true)
      - **Unchecked**: Task is pending (isDoneTask = false)
      - Click to toggle status
      - Completed tasks may show strikethrough text

   7. **Edit Button**:
      - Opens the task in edit mode
      - Allows you to modify description, due date, priority, Gmail ID
      - Save changes with "Update Task" button

   8. **Delete Button**:
      - Permanently removes the task
      - Usually shows confirmation dialog
      - Cannot be undone

   **PAGINATION (At the bottom of the page):**
   - Shows page numbers if there are many tasks
   - Navigate between pages
   - Shows total number of tasks

   **Key Features:**
   - **5 powerful filters**: Search by title, date range, priority, and status
   - **Two task sources**: Bot-created (automatic from emails) vs User-created (manual)
   - **Visual priority system**: Color-coded badges for Low/Medium/High
   - **Quick status toggle**: Checkbox to mark done/undone
   - **Optional due dates**: Tasks can have deadlines or be undated
   - **Email integration**: Tasks can link to specific emails via Gmail ID
   - **Complete CRUD**: Create, Read, Update, Delete all supported

   **Complete Workflow:**
   1. Click "Add Task" button at top
   2. Fill in task description (required)
   3. Optionally set due date
   4. Select priority (Low/Medium/High)
   5. Optionally link to Gmail ID if email-related
   6. Click "Create Task" (or Cancel to close)
   7. Task appears in tasks list
   8. Use 5 filters to find specific tasks
   9. Check checkbox to mark task as done
   10. Edit or delete tasks as needed
   11. Bot-created tasks show bot icon and bot name
   12. User-created tasks show user indicator

   **Understanding Task Assignment:**
   - **If you see a bot icon and bot name**: The task was automatically created by an AI bot from an email (Smart Actions feature extracted it)
   - **If you see user indicator or "Created by You"**: You manually created this task by clicking Add Task button
   - This helps you know which tasks came from AI automation vs manual entry

8. **TASK MANAGEMENT:**
   - Create and manage tasks
   - Set priorities (Low, Medium, High)
   - Mark tasks as complete
   - Tasks can be created manually or auto-extracted by bots
   - Filter by status and priority

8. **CALENDAR PAGE (Calendar Events & Meetings):**
   The Calendar page allows users to create, manage, filter, and track their calendar events and meetings.

   **Calendar Page Structure:**

   **TOP SECTION - New Event Button:**
   - **New Event Button**: Located at the top of the page
   - Clicking this button opens the event creation popup/modal

   **New Event Popup/Modal (After clicking New Event button):**
   The form includes the following fields:

   1. **Event Title Field** (Required):
      - Text input to enter the event/meeting title
      - Main name of the event
      - Example: "Team Meeting", "Client Call", "Product Demo"

   2. **Event Description Field** (Required/Optional):
      - Text area to enter detailed description of the event
      - Meeting agenda, notes, or details
      - Example: "Discuss Q1 goals and project timeline"

   3. **Due Date Field** (Required):
      - Date picker to select the event date
      - When the event/meeting will occur
      - Format: Date picker

   4. **Time Field** (Required):
      - Time picker to select the event time
      - What time the event starts
      - Format: Time picker (e.g., 2:00 PM)

   5. **Priority Field** (Required):
      - Dropdown/Select to choose event priority
      - Three options: **Low**, **Medium**, **High**
      - Helps prioritize events visually
      - Default: Medium

   6. **Action Buttons**:
      - **Create Event Button**: Saves the event and adds it to calendar
      - **Cancel Button**: Closes the popup without saving

   **FILTER SECTION (5 Filters):**
   Located below the New Event button, used to filter and search calendar events:

   1. **Filter 1 - Search by Title**:
      - Text input field
      - Search events by event title/name
      - Real-time filtering as you type
      - Example: Type "meeting" to find all meetings

   2. **Filter 2 - Filter by Created From Date (Range From)**:
      - Date picker input
      - Shows events created FROM a specific date onwards
      - Example: Select "2025-01-01" to see events created from Jan 1st onwards

   3. **Filter 3 - Filter by Created To Date (Range To)**:
      - Date picker input
      - Shows events created UP TO a specific date
      - Combine with Filter 2 for date range filtering
      - Example: From Jan 1 TO Jan 31 shows January events only

   4. **Filter 4 - Filter by Priority**:
      - Dropdown/Select filter
      - Options: **All**, **Low**, **Medium**, **High**
      - Shows only events matching the selected priority
      - Example: Select "High" to see only high-priority events

   5. **Filter 5 - Filter by Status**:
      - Dropdown/Select filter
      - Three options:
        a) **Pending**: Shows upcoming/pending events (not completed)
        b) **Completed**: Shows completed/past events
        c) **All**: Shows all events regardless of status
      - Default: Shows all events

   **CALENDAR EVENTS LIST (Below filters):**
   Shows all calendar events matching the current filters as event cards/boxes:

   **Each Calendar Event Card/Box Displays:**

   1. **Event Title**:
      - The main event/meeting name
      - First line or most prominent text
      - Example: "Team Standup Meeting"

   2. **Priority Badge**:
      - Visual indicator of event priority
      - Color-coded:
        - **High**: Red badge/color
        - **Medium**: Yellow/Orange badge/color
        - **Low**: Green/Blue badge/color

   3. **Event Date**:
      - Shows the date of the event
      - Format: "Jan 15, 2025" or similar
      - When the event is scheduled to occur

   4. **Event Time**:
      - Shows the time of the event
      - Format: "2:00 PM" or "14:00"
      - When the event starts

   5. **Synced with Google Indicator**:
      - Shows if the event is synced with Google Calendar
      - **Google Icon/Badge**: If synced with Google Calendar
      - **Local/Other Icon**: If not synced or from other source
      - Helps you know if event came from Google Calendar sync or was created locally

   6. **Event Description**:
      - Shows the event description/agenda
      - Brief preview or full description
      - Meeting details, notes, agenda items

   7. **Edit Button**:
      - Opens the event in edit mode
      - Allows you to modify title, description, date, time, priority
      - Save changes with "Update Event" button

   8. **Delete Button**:
      - Permanently removes the event
      - Usually shows confirmation dialog
      - Cannot be undone

   **PAGINATION (At the bottom of the page):**
   - Shows page numbers if there are many events
   - Navigate between pages
   - Shows total number of events

   **Key Features:**
   - **5 powerful filters**: Search by title, date range (creation), priority, and status
   - **Google Calendar sync**: Events can be synced with Google Calendar
   - **Visual priority system**: Color-coded badges for Low/Medium/High
   - **Date and time scheduling**: Precise scheduling with date and time pickers
   - **Event descriptions**: Add detailed meeting agendas and notes
   - **Complete CRUD**: Create, Read, Update, Delete all supported
   - **Status tracking**: Pending vs Completed events

   **Complete Workflow:**
   1. Click "New Event" button at top
   2. Fill in event title (required)
   3. Add event description/agenda
   4. Select due date (when event occurs)
   5. Select time (when event starts)
   6. Select priority (Low/Medium/High)
   7. Click "Create Event" (or Cancel to close)
   8. Event appears in calendar events list
   9. Use 5 filters to find specific events
   10. Edit or delete events as needed
   11. See Google sync status on each event
   12. Mark events as completed when they're done

   **Understanding Event Sources:**
   - **Google Calendar Icon**: Event was synced from your Google Calendar
   - **Local/Other Icon**: Event was created manually in the app or extracted by AI bot from email
   - This helps you know which events came from external calendar sync vs local creation

9. **CALENDAR & MEETINGS:**
   - Schedule calendar events
   - Auto-extract meetings from emails using AI
   - Set event priorities and status
   - View upcoming events
   - Meeting agendas and durations

10. **NOTIFICATIONS:**
   - System notifications
   - Email alerts
   - Task reminders
   - Mark notifications as read

11. **AI FEATURES:**
   - Generate email drafts using AI
   - Reply to emails with AI assistance
   - Improve existing drafts
   - Analyze email content
   - Extract information from emails
   - Smart inbox prioritization

12. **ADDITIONAL FEATURES:**
   - Archive emails
   - Delete emails
   - Veo Studio (AI video generation)
   - Live Chat assistant (me!)
   - Multi-account support

**Available Tools:**
You have access to 13 powerful tools to retrieve information:
- search_emails: Search inbox emails
- get_sent_emails: Get sent emails
- get_templates: Get email templates
- get_bots: Get automation bots
- get_tasks: Get tasks
- get_calendar_events: Get calendar events
- get_drafts: Get draft emails
- get_email_stats: Get email statistics
- get_notifications: Get notifications
- get_inbox_actions: Get information about inbox action buttons
- get_ai_reply_details: Get detailed information about AI Reply button features
- get_smart_actions_details: Get detailed information about Smart Actions button
- get_email_detail_view: Get information about the Email Detail View structure

**How to Help:**
- When asked about emails, ALWAYS use the search_emails tool
- When asked about inbox buttons or actions, use get_inbox_actions tool
- When asked about AI Reply features, quick prompts, or refinement options, use get_ai_reply_details tool
- When asked about Smart Actions, task extraction, or meeting extraction, use get_smart_actions_details tool
- When asked about email detail view, email structure, AI summary, or what appears after selecting an email, use get_email_detail_view tool
- When asked about templates, bots, tasks, or calendar, use the appropriate tools
- Provide specific, actionable information
- If asked about features, explain them clearly
- Suggest relevant features based on user needs
- Be proactive in offering helpful suggestions
- Explain the difference between AI-powered actions and manual actions

**Examples of What You Can Do:**
- "Show me unread emails from John"
- "What buttons appear when I select an email?"
- "What happens when I select an email?"
- "What is the email detail view?"
- "What information is shown when I open an email?"
- "Where is the AI summary in the email view?"
- "Can I see tasks related to an email?"
- "How do I edit calendar tasks from an email?"
- "Can I delete tasks directly from the email view?"
- "Where is the reply box in the email view?"
- "What's the structure of the email detail page?"
- "Does the email view show sender or receiver?"
- "What is the Drafts page?"
- "What's the difference between Inbox and Drafts?"
- "What buttons appear in the Drafts page?"
- "What does the Unarchive button do?"
- "How do I move a draft back to inbox?"
- "Can I use Smart Actions on draft emails?"
- "Does AI Reply work on drafts?"
- "What does the Smart Actions button do?"
- "How does Smart Actions extract tasks from emails?"
- "Can Smart Actions find meetings in my emails?"
- "How do I use AI to extract action items from an email?"
- "What happens when I click Smart Actions?"
- "Does Smart Actions work on sent emails too?"
- "How many tasks can Smart Actions extract from one email?"
- "Can I edit extracted tasks before saving them?"
- "How does AI understand meeting dates like 'tomorrow'?"
- "How do I reply to an email with AI?"
- "What happens when I click AI Reply button?"
- "What quick reply options are available?"
- "How can I refine an AI-generated reply?"
- "What tone adjustments can I make to replies?"
- "Can I make the reply more formal?"
- "How do I shorten an AI reply?"
- "What's the difference between Smart Actions and the Menu button?"
- "What's the difference between AI extraction and manual task creation?"
- "How do I archive an email?"
- "What is the Clean Up button for?"
- "What are my pending tasks?"
- "How many bots do I have?"
- "What's on my calendar today?"
- "Find emails about the project proposal"
- "Show me my email statistics"
- "What templates do I have for business emails?"
- "Explain the 5 action buttons in the inbox"
- "How does the AI Reply sidebar work?"
- "Explain how AI extracts tasks and meetings"
- "What appears after I click on an email?"`,
            tools: [{
              functionDeclarations: [
                emailSearchTool,
                sentEmailsTool,
                templatesTool,
                botsTool,
                tasksTool,
                calendarTool,
                draftsTool,
                emailStatsTool,
                notificationsTool,
                inboxActionsTool,
                aiReplyDetailsTool,
                smartActionsDetailsTool,
                emailDetailViewTool
              ]
            }]
          }
        });
        sessionRef.current = sessionPromise;
      } catch (err: any) {
        console.error("Failed to start live session", err);
        setError(err.message || "Failed to start");
        setStatus("Error");
      }
    };
    startSession();
    return () => {
      cleanup = true;
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (inputAudioContextRef.current) inputAudioContextRef.current.close();
      if (outputAudioContextRef.current) outputAudioContextRef.current.close();
    };
  }, []);

  return (
    <div
        style={{ left: position.x, top: position.y }}
        className={`fixed w-[350px] bg-glass backdrop-blur-2xl rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10 z-50 overflow-hidden font-sans flex flex-col items-center transition-all duration-300 ${isMinimized ? 'h-[80px]' : 'h-[420px]'}`}
    >
      {/* Header (Draggable) */}
      <div
        onMouseDown={handleMouseDown}
        className="w-full p-4 flex justify-between items-center z-20 cursor-move group select-none"
      >
         <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/5">
            <GripHorizontal className="w-3 h-3 text-slate-500 group-hover:text-white transition-colors" />
            <Sparkles className="w-3 h-3 text-fuchsia-400" />
            <span className="text-xs font-bold text-slate-300">{liveAssistantConfig.name.toUpperCase()}</span>
         </div>
         <div className="flex items-center gap-1">
            <button
                onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}
                className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"
            >
               {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
            </button>
            <button
                onClick={(e) => { e.stopPropagation(); onClose(); }}
                className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"
            >
               <X className="w-5 h-5" />
            </button>
         </div>
      </div>

      {/* Expanded View */}
      <div className={`w-full flex-1 flex flex-col items-center transition-opacity duration-300 ${isMinimized ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          {/* Visualizer */}
          <div className="relative w-full h-52 flex items-center justify-center -mt-4">
             {/* Glow effects */}
             <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-fuchsia-500 rounded-full blur-[80px] opacity-20 transition-opacity duration-1000 ${isActive ? 'opacity-40' : 'opacity-10'}`}></div>
             <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-cyan-500 rounded-full blur-[60px] opacity-20 transition-opacity duration-1000 ${isActive ? 'opacity-40' : 'opacity-10'}`}></div>

             {/* Central Orb */}
             <div className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${isActive ? 'scale-110' : 'scale-100'} ${error ? 'border-2 border-red-500/50 bg-red-500/10' : ''}`}
                  style={{
                      background: error ? 'rgba(239, 68, 68, 0.1)' : 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.2), rgba(0,0,0,0.5))',
                      boxShadow: error ? '0 0 30px rgba(239,68,68,0.2)' : `0 0 ${20 + volume}px ${volume > 10 ? '#d946ef' : '#64748b'}`
                  }}
             >
                 <div className="absolute inset-0 rounded-full border border-white/10"></div>
                 {error ? (
                     <AlertCircle className="w-8 h-8 text-red-400" />
                 ) : isActive ? (
                     <Volume2 className="w-8 h-8 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
                 ) : (
                     <MicOff className="w-8 h-8 text-slate-500" />
                 )}
             </div>
          </div>

          {/* Status */}
          <div className="pb-8 text-center px-6">
            <h3 className={`text-xl font-bold mb-1 tracking-tight ${error ? 'text-red-400' : 'text-white'}`}>
                {error ? "Connection Error" : isActive ? "Listening..." : status}
            </h3>
            <p className="text-sm text-slate-400 font-light">{error || status}</p>

            {isActive && !error && (
                <div className="mt-6 flex justify-center gap-1 h-8 items-end">
                    {[...Array(5)].map((_, i) => (
                        <div
                            key={i}
                            className="w-1 bg-gradient-to-t from-fuchsia-500 to-cyan-400 rounded-full animate-pulse"
                            style={{ height: `${20 + Math.random() * 60}%`, animationDelay: `${i * 0.1}s` }}
                        ></div>
                    ))}
                </div>
            )}

            {error && (
                <button
                    onClick={onClose}
                    className="mt-6 px-6 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-medium transition-colors"
                >
                    Close
                </button>
            )}
          </div>
      </div>
    </div>
  );
};
