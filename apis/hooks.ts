import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createTemplate, CreateTemplateRequest, UpdateTemplateRequest, updateTemplate, DeleteTemplateResponse, deleteTemplate, fetchGmailEmails, fetchGmailSentEmails, fetchUserTemplates, GmailEmailsResponse, GmailSentEmailsResponse, UserTemplatesResponse, createCalendarTask, CalendarTaskRequest, CalendarTaskResponse, saveGmailSummary, GmailSummaryRequest, GmailSummaryResponse, fetchGmailEmailById, SingleGmailEmailResponse, createTask, TaskRequest, TaskResponse, fetchTasks, TasksResponse, updateTask, UpdateTaskRequest as UpdateTaskRequestType, deleteTask as deleteTaskService, fetchAllTasks, FetchAllTasksParams, fetchCalendarTasks, FetchCalendarTasksParams, CalendarTasksResponse, updateCalendarTask, UpdateCalendarTaskRequest, deleteCalendarTask, sendEmailReply, SendEmailReplyRequest } from './services';
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
    staleTime: 1000 * 60 * 5, // 5 minutes
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
    },
  });
};

// Hook for fetching a single Gmail email by ID
export const useGmailEmailById = (emailId: string) => {
  return useQuery<SingleGmailEmailResponse>({
    queryKey: [GMAIL_EMAIL_BY_ID_QUERY_KEY, emailId],
    queryFn: () => fetchGmailEmailById(emailId),
    enabled: !!emailId,
    refetchOnWindowFocus: false,
    staleTime: 0, // No cache - always fetch fresh data
    gcTime: 0, // Don't keep unused data in cache
  });
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
      // Optionally invalidate email queries to refresh the inbox
      // This could be added later if needed
    },
  });
};

// Hook for creating calendar task
export const useCreateCalendarTask = () => {
  return useMutation({
    mutationKey: [CALENDAR_TASK_MUTATION_KEY],
    mutationFn: (data: CalendarTaskRequest) => createCalendarTask(data),
  });
};

// Hook for saving gmail summary
export const useSaveGmailSummary = () => {
  return useMutation({
    mutationKey: [GMAIL_SUMMARY_MUTATION_KEY],
    mutationFn: (data: GmailSummaryRequest) => saveGmailSummary(data),
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
    },
  });
};

export const useDeleteCalendarTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCalendarTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CALENDAR_TASKS_QUERY_KEY] });
    },
  });
};

// Hook for sending email reply
export const useSendEmailReply = () => {
  return useMutation({
    mutationFn: (data: SendEmailReplyRequest) => sendEmailReply(data),
  });
};