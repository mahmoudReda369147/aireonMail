import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { fetchGmailEmails, GmailEmailsResponse } from './services';

// React Query key for Gmail emails
export const GMAIL_EMAILS_QUERY_KEY = 'gmail-emails';

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