import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { createTemplate, CreateTemplateRequest, UpdateTemplateRequest, updateTemplate, DeleteTemplateResponse, deleteTemplate, fetchGmailEmails, fetchGmailSentEmails, fetchUserTemplates, GmailEmailsResponse, GmailSentEmailsResponse, UserTemplatesResponse, createCalendarTask, CalendarTaskRequest, CalendarTaskResponse, saveGmailSummary, GmailSummaryRequest, GmailSummaryResponse, fetchGmailEmailById, SingleGmailEmailResponse, createTask, TaskRequest, TaskResponse, fetchTasks, TasksResponse, updateTask, UpdateTaskRequest as UpdateTaskRequestType, deleteTask as deleteTaskService, fetchAllTasks, FetchAllTasksParams, fetchCalendarTasks, FetchCalendarTasksParams, CalendarTasksResponse, updateCalendarTask, UpdateCalendarTaskRequest, deleteCalendarTask, sendEmailReply, SendEmailReplyRequest, fetchBots, BotsResponse, updateBot, UpdateBotRequest, createBot, CreateBotRequest, deleteGmailEmail, archiveGmailEmail, unarchiveGmailEmail, fetchArchivedEmails, ArchivedEmailsResponse, fetchGmailThreads, GmailThreadsResponse, fetchGmailThreadById, SingleThreadResponse, fetchEmailCounts, EmailCountsResponse, fetchNotifications, NotificationsResponse, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification, deleteAllEmails, fetchBotLogs, BotLogsResponse } from './services';
import { post } from './apiCall';

// React Query key for Gmail emails
export const GMAIL_EMAILS_QUERY_KEY = 'gmail-emails';

// React Query key for single Gmail email
export const GMAIL_EMAIL_BY_ID_QUERY_KEY = 'gmail-email-by-id';

// React Query key for Gmail sent emails
export const GMAIL_SENT_EMAILS_QUERY_KEY = 'gmail-sent-emails';

// React Query key for User templates
export const USER_TEMPLATES_QUERY_KEY = 'user-templates';

// React Query key for create template
export const CREATE_TEMPLATE_MUTATION_KEY = 'create-template';

// React Query key for update template
export const UPDATE_TEMPLATE_MUTATION_KEY = 'update-template';

// React Query key for delete template
export const DELETE_TEMPLATE_MUTATION_KEY = 'delete-template';

// React Query key for delete email
export const DELETE_EMAIL_MUTATION_KEY = 'delete-email';

// React Query key for archive email
export const ARCHIVE_EMAIL_MUTATION_KEY = 'archive-email';

// React Query key for unarchive email
export const UNARCHIVE_EMAIL_MUTATION_KEY = 'unarchive-email';

// React Query key for Gmail send
export const GMAIL_SEND_MUTATION_KEY = 'gmail-send';

// React Query key for calendar task
export const CALENDAR_TASK_MUTATION_KEY = 'calendar-task';

// React Query key for gmail summary
export const GMAIL_SUMMARY_MUTATION_KEY = 'gmail-summary';

// React Query key for tasks
export const TASKS_QUERY_KEY = 'tasks';
export const CREATE_TASK_MUTATION_KEY = 'create-task';
export const UPDATE_TASK_MUTATION_KEY = 'update-task';
export const DELETE_TASK_MUTATION_KEY = 'delete-task';

// React Query key for calendar tasks
export const CALENDAR_TASKS_QUERY_KEY = 'calendar-tasks';

// React Query key for bots
export const BOTS_QUERY_KEY = 'bots';

// React Query key for archived emails
export const ARCHIVED_EMAILS_QUERY_KEY = 'archived-emails';

// React Query key for Gmail threads
export const GMAIL_THREADS_QUERY_KEY = 'gmail-threads';

// React Query key for single Gmail thread
export const GMAIL_THREAD_BY_ID_QUERY_KEY = 'gmail-thread-by-id';

// Hook for fetching Gmail emails with infinite scroll pagination
export const useGmailEmails = () => {
  return useInfiniteQuery<GmailEmailsResponse>({
    queryKey: [GMAIL_EMAILS_QUERY_KEY],
    queryFn: ({ pageParam }) => fetchGmailEmails(pageParam as string | undefined),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      return lastPage.meta.hasMore ? lastPage.meta.nextPageToken : undefined;
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 1, // 5 minutes
  });
};

// Hook for fetching Gmail sent emails with infinite scroll pagination
export const useGmailSentEmails = () => {
  return useInfiniteQuery<GmailSentEmailsResponse>({
    queryKey: [GMAIL_SENT_EMAILS_QUERY_KEY],
    queryFn: ({ pageParam }) => fetchGmailSentEmails(pageParam as string | undefined),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      return lastPage.meta.hasMore ? lastPage.meta.nextPageToken : undefined;
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Hook for fetching user templates
export const useUserTemplates = () => {
  return useQuery<UserTemplatesResponse>({
    queryKey: [USER_TEMPLATES_QUERY_KEY],
    queryFn: fetchUserTemplates,
    enabled: true,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

export const useCreateTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [CREATE_TEMPLATE_MUTATION_KEY],
    mutationFn: (data: CreateTemplateRequest) => createTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USER_TEMPLATES_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [EMAIL_COUNTS_QUERY_KEY] });
    },
  });
};

export const useUpdateTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [UPDATE_TEMPLATE_MUTATION_KEY],
    mutationFn: ({ id, data }: { id: string; data: UpdateTemplateRequest }) => updateTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USER_TEMPLATES_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [EMAIL_COUNTS_QUERY_KEY] });
    },
  });
};

export const useDeleteTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [DELETE_TEMPLATE_MUTATION_KEY],
    mutationFn: (id: string) => deleteTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USER_TEMPLATES_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [EMAIL_COUNTS_QUERY_KEY] });
    },
  });
};

// Hook for deleting Gmail email
export const useDeleteGmailEmail = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [DELETE_EMAIL_MUTATION_KEY],
    mutationFn: (id: string) => deleteGmailEmail(id),
    onSuccess: () => {
      // Invalidate and refetch Gmail emails after deleting
      queryClient.invalidateQueries({ queryKey: [GMAIL_EMAILS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [EMAIL_COUNTS_QUERY_KEY] });
    },
  });
};

// Hook for archiving Gmail email
export const useArchiveGmailEmail = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [ARCHIVE_EMAIL_MUTATION_KEY],
    mutationFn: (id: string) => archiveGmailEmail(id),
    onSuccess: () => {
      // Invalidate and refetch Gmail emails after archiving
      queryClient.invalidateQueries({ queryKey: [GMAIL_EMAILS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [EMAIL_COUNTS_QUERY_KEY] });
    },
  });
};

// Hook for unarchiving Gmail email
export const useUnarchiveGmailEmail = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [UNARCHIVE_EMAIL_MUTATION_KEY],
    mutationFn: (id: string) => unarchiveGmailEmail(id),
    onSuccess: () => {
      // Invalidate and refetch Gmail emails and archived emails after unarchiving
      queryClient.invalidateQueries({ queryKey: [GMAIL_EMAILS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [ARCHIVED_EMAILS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [EMAIL_COUNTS_QUERY_KEY] });
    },
  });
};

// Hook for fetching a single Gmail email by ID
export const useGmailEmailById = (emailId: string) => {
  const queryClient = useQueryClient();
  
  const query = useQuery<SingleGmailEmailResponse>({
    queryKey: [GMAIL_EMAIL_BY_ID_QUERY_KEY, emailId],
    queryFn: () => fetchGmailEmailById(emailId),
    enabled: !!emailId,
    refetchOnWindowFocus: false,
    staleTime: 0, // No cache - always fetch fresh data
    gcTime: 0, // Don't keep unused data in cache
  });

  // Use useEffect to invalidate queries when the query succeeds
  useEffect(() => {
    if (query.isSuccess && query.data) {
      // Invalidate Gmail emails page queries to refresh the list
      queryClient.invalidateQueries({ queryKey: [GMAIL_EMAILS_QUERY_KEY] });
      // Invalidate archived emails query to refresh the drafts list
      queryClient.invalidateQueries({ queryKey: [ARCHIVED_EMAILS_QUERY_KEY] });
    }
  }, [query.isSuccess, query.data, queryClient]);

  return query;
};

// Hook for fetching a single page of Gmail emails (if needed)
export const useGmailEmailsPage = (pageToken?: string) => {
  return useQuery<GmailEmailsResponse>({
    queryKey: [GMAIL_EMAILS_QUERY_KEY, pageToken],
    queryFn: () => fetchGmailEmails(pageToken),
    enabled: true,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Hook for fetching a single page of Gmail sent emails (if needed)
export const useGmailSentEmailsPage = (pageToken?: string) => {
  return useQuery<GmailSentEmailsResponse>({
    queryKey: [GMAIL_SENT_EMAILS_QUERY_KEY, pageToken],
    queryFn: () => fetchGmailSentEmails(pageToken),
    enabled: true,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Hook for sending Gmail emails
export const useGmailSend = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [GMAIL_SEND_MUTATION_KEY],
    mutationFn: async (emailData: {
      to: string;
      subject: string;
      body: string;
      cc?: string;
      bcc?: string;
    }) => {
      const response = await post('/gmail/send', emailData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [EMAIL_COUNTS_QUERY_KEY] });
    },
  });
};

// Hook for creating calendar task
export const useCreateCalendarTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [CALENDAR_TASK_MUTATION_KEY],
    mutationFn: (data: CalendarTaskRequest) => createCalendarTask(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [EMAIL_COUNTS_QUERY_KEY] });
    },
  });
};

// Hook for saving gmail summary
export const useSaveGmailSummary = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [GMAIL_SUMMARY_MUTATION_KEY],
    mutationFn: (data: GmailSummaryRequest) => saveGmailSummary(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [EMAIL_COUNTS_QUERY_KEY] });
    },
  });
};

// Hook for fetching tasks by Gmail ID with page-based pagination
export const useTasks = (gmailId: string, page: number = 1, limit: number = 10) => {
  return useQuery<TasksResponse>({
    queryKey: [TASKS_QUERY_KEY, gmailId, page, limit],
    queryFn: () => fetchTasks(gmailId, page, limit),
    enabled: !!gmailId,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Hook for fetching all tasks with filters
export const useAllTasks = (params: FetchAllTasksParams) => {
  return useQuery<TasksResponse>({
    queryKey: [TASKS_QUERY_KEY, 'all', params],
    queryFn: () => fetchAllTasks(params),
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Hook for creating task
export const useCreateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [CREATE_TASK_MUTATION_KEY],
    mutationFn: (data: TaskRequest) => createTask(data),
    onSuccess: () => {
      // Invalidate and refetch tasks after creating a new one
      queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [EMAIL_COUNTS_QUERY_KEY] });
    },
  });
};

// Hook for updating task
export const useUpdateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [UPDATE_TASK_MUTATION_KEY],
    mutationFn: ({ id, data }: { id: string; data: UpdateTaskRequestType }) => updateTask(id, data),
    onSuccess: () => {
      // Invalidate and refetch tasks after updating
      queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [EMAIL_COUNTS_QUERY_KEY] });
    },
  });
};

// Hook for deleting task
export const useDeleteTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [DELETE_TASK_MUTATION_KEY],
    mutationFn: (id: string) => deleteTaskService(id),
    onSuccess: () => {
      // Invalidate and refetch tasks after deleting
      queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [EMAIL_COUNTS_QUERY_KEY] });
    },
  });
};

// Hook for fetching calendar tasks with filters
export const useCalendarTasks = (params: FetchCalendarTasksParams) => {
  return useQuery<CalendarTasksResponse>({
    queryKey: [CALENDAR_TASKS_QUERY_KEY, params],
    queryFn: () => fetchCalendarTasks(params),
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useUpdateCalendarTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCalendarTaskRequest }) =>
      updateCalendarTask(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CALENDAR_TASKS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [EMAIL_COUNTS_QUERY_KEY] });
    },
  });
};

export const useDeleteCalendarTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCalendarTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CALENDAR_TASKS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [EMAIL_COUNTS_QUERY_KEY] });
    },
  });
};

// Hook for sending email reply
export const useSendEmailReply = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SendEmailReplyRequest) => sendEmailReply(data),
    onSuccess: () => {
      // Invalidate and refetch Gmail threads after sending reply
      queryClient.invalidateQueries({ queryKey: [GMAIL_THREADS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [GMAIL_THREAD_BY_ID_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [EMAIL_COUNTS_QUERY_KEY] });
    },
  });
};

// Hook for fetching bots with infinite scroll pagination
export const useBots = () => {
  return useInfiniteQuery<BotsResponse>({
    queryKey: [BOTS_QUERY_KEY],
    queryFn: ({ pageParam = 1 }) => fetchBots(pageParam as number, 10),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      return lastPage.meta.pagination.hasNextPage
        ? lastPage.meta.pagination.page + 1
        : undefined;
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Hook for updating bot
export const useUpdateBot = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBotRequest }) => updateBot(id, data),
    onSuccess: () => {
      // Invalidate and refetch bots after updating
      queryClient.invalidateQueries({ queryKey: [BOTS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [EMAIL_COUNTS_QUERY_KEY] });
    },
  });
};

// Hook for creating bot
export const useCreateBot = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBotRequest) => createBot(data),
    onSuccess: () => {
      // Invalidate and refetch bots after creating
      queryClient.invalidateQueries({ queryKey: [BOTS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [EMAIL_COUNTS_QUERY_KEY] });
    },
  });
};

// Hook for fetching archived emails (drafts)
export const useArchivedEmails = () => {
  return useQuery<ArchivedEmailsResponse>({
    queryKey: [ARCHIVED_EMAILS_QUERY_KEY],
    queryFn: fetchArchivedEmails,
    enabled: true,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Hook for fetching Gmail threads with infinite scroll pagination
export const useGmailThreads = () => {
  return useInfiniteQuery<GmailThreadsResponse>({
    queryKey: [GMAIL_THREADS_QUERY_KEY],
    queryFn: ({ pageParam }) => fetchGmailThreads(pageParam as string | undefined),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      return lastPage.meta.hasMore ? lastPage.meta.nextPageToken : undefined;
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Hook for fetching a single Gmail thread by ID
export const useGmailThreadById = (threadId: string | undefined) => {
  const queryClient = useQueryClient();
  
  const result = useQuery<SingleThreadResponse>({
    queryKey: [GMAIL_THREAD_BY_ID_QUERY_KEY, threadId],
    queryFn: () => fetchGmailThreadById(threadId!),
    enabled: !!threadId,
    refetchOnWindowFocus: false,
    staleTime: 0, // Always fetch fresh data
    gcTime: 1000 * 60 * 5, // Keep in cache for 5 minutes
  });

  // Refresh threads list when thread data is successfully fetched
  useEffect(() => {
    if (result.data && !result.isLoading) {
      queryClient.invalidateQueries({ queryKey: [GMAIL_THREADS_QUERY_KEY] });
    }
  }, [result.data, result.isLoading, queryClient]);

  return result;
};

// React Query key for email counts
export const EMAIL_COUNTS_QUERY_KEY = 'email-counts';

// Hook for fetching email counts
export const useEmailCounts = () => {
  return useQuery<EmailCountsResponse>({
    queryKey: [EMAIL_COUNTS_QUERY_KEY],
    queryFn: fetchEmailCounts,
    refetchOnWindowFocus: true,
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
  });
};

// React Query key for notifications
export const NOTIFICATIONS_QUERY_KEY = 'notifications';

// Hook for fetching notifications with infinite scroll pagination
export const useNotifications = () => {
  return useInfiniteQuery<NotificationsResponse>({
    queryKey: [NOTIFICATIONS_QUERY_KEY],
    queryFn: ({ pageParam = 1 }) => fetchNotifications(pageParam as number, 10),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.meta;
      return page < totalPages ? page + 1 : undefined;
    },
    refetchOnWindowFocus: true,
    staleTime: 1000 * 60 * 1, // 1 minutes
    refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
  });
};

// Hook for marking a notification as read
export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => markNotificationAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [EMAIL_COUNTS_QUERY_KEY] });
    },
  });
};

// Hook for marking all notifications as read
export const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => markAllNotificationsAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [EMAIL_COUNTS_QUERY_KEY] });
    },
  });
};

// Hook for deleting a notification
export const useDeleteNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [EMAIL_COUNTS_QUERY_KEY] });
    },
  });
};

// Hook for deleting all emails (cleanup)
export const useDeleteAllEmails = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => deleteAllEmails(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [GMAIL_EMAILS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [GMAIL_THREADS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [EMAIL_COUNTS_QUERY_KEY] });
    },
  });
};

// React Query key for bot logs
export const BOT_LOGS_QUERY_KEY = 'bot-logs';

// Hook for fetching bot logs with infinite scroll pagination
export const useBotLogs = (botId: string | undefined) => {
  return useInfiniteQuery<BotLogsResponse>({
    queryKey: [BOT_LOGS_QUERY_KEY, botId],
    queryFn: ({ pageParam = 1 }) => fetchBotLogs(botId!, pageParam as number, 20),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      return lastPage.data.pagination.hasNextPage
        ? lastPage.data.pagination.currentPage + 1
        : undefined;
    },
    enabled: !!botId,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};