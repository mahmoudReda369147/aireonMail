import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGmailThreads, useGmailThreadById } from '../apis/hooks';
import { MessageSquare, Send, Loader2, ArrowLeft, MoreVertical, Search, Phone, Video, ChevronDown, ChevronUp, Maximize2 } from 'lucide-react';
import { GmailThread, ThreadMessage } from '../apis/services';

// Thread list item component
const ThreadListItem: React.FC<{
  thread: GmailThread;
  isSelected: boolean;
  onClick: () => void;
}> = ({ thread, isSelected, onClick }) => {
  // Extract sender name
  const extractName = (fromField: string): string => {
    const match = fromField.match(/^(.+?)\s*<.*>$/);
    return match ? match[1].trim() : fromField;
  };

  const senderName = extractName(thread.from);
  const lastMessage = thread.messages[thread.messages.length - 1];

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (diffInHours < 168) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div
      onClick={onClick}
      className={`p-4 cursor-pointer border-b border-white/5 transition-all duration-200 ${
        isSelected
          ? 'bg-gradient-to-r from-purple-500/10 to-fuchsia-500/10 border-l-4 border-l-fuchsia-500'
          : 'hover:bg-white/[0.02]'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${
          isSelected
            ? 'bg-gradient-to-br from-purple-500 to-fuchsia-500 text-white shadow-lg shadow-fuchsia-500/20'
            : 'bg-gradient-to-br from-slate-700 to-slate-600 text-slate-300'
        }`}>
          {getInitials(senderName)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between mb-1">
            <h3 className="font-semibold text-white text-sm truncate">
              {senderName}
            </h3>
            <span className="text-xs text-slate-500 ml-2 flex-shrink-0">
              {formatDate(thread.lastDate)}
            </span>
          </div>
          <p className="text-sm text-slate-300 font-medium truncate mb-1">
            {thread.subject}
          </p>
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 truncate flex-1">
              {lastMessage?.snippet || 'No preview'}
            </p>
            <span className="text-xs text-fuchsia-400 ml-2 flex-shrink-0 bg-fuchsia-500/10 px-2 py-0.5 rounded-full">
              {thread.messageCount}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Chat message component with collapsible HTML
const ChatMessage: React.FC<{
  message: ThreadMessage;
  isOutgoing: boolean;
  isFullHeight: boolean;
}> = ({ message, isOutgoing, isFullHeight }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const extractName = (fromField: string): string => {
    const match = fromField.match(/^(.+?)\s*<.*>$/);
    return match ? match[1].trim() : fromField;
  };

  const senderName = extractName(message.from);

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Format time
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const hasHtmlBody = message.htmlBody && message.htmlBody.trim().length > 0;

  return (
    <div className={`flex gap-3 mb-6 ${isOutgoing ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${
        isOutgoing
          ? 'bg-gradient-to-br from-purple-500 to-fuchsia-500 text-white'
          : 'bg-gradient-to-br from-slate-700 to-slate-600 text-slate-300'
      }`}>
        {getInitials(senderName)}
      </div>

      {/* Message content */}
      <div className={`flex flex-col max-w-[70%] ${isOutgoing ? 'items-end' : 'items-start'}`}>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-xs font-medium text-slate-400">
            {senderName}
          </span>
          <span className="text-xs text-slate-600">
            {formatTime(message.date)}
          </span>
        </div>

        {/* Snippet bubble */}
        <div className={`relative px-4 py-3 rounded-2xl ${
          isOutgoing
            ? 'bg-gradient-to-br from-purple-500 to-fuchsia-500 text-white rounded-tr-sm shadow-lg shadow-fuchsia-500/20'
            : 'bg-slate-800/80 text-slate-100 rounded-tl-sm border border-white/5'
        }`}>
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
            {message.snippet}
          </p>
        </div>

        {/* Collapsible HTML content */}
        {hasHtmlBody && (
          <div className="mt-2 w-full">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                isOutgoing
                  ? 'bg-purple-500/10 text-purple-300 hover:bg-purple-500/20'
                  : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-3 h-3" />
                  Hide full message
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3" />
                  Show full message
                </>
              )}
            </button>

            {isExpanded && (
              <div className={`mt-2 p-4 rounded-lg border ${isFullHeight ? 'overflow-auto h-[80vh]' : 'overflow-auto max-h-96'} custom-scrollbar ${
                isOutgoing
                  ? 'bg-purple-900/20 border-purple-500/20'
                  : 'bg-slate-800/50 border-white/10'
              }`}>
                <div
                  className="prose prose-invert prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: message.htmlBody! }}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export const ChatsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } = useGmailThreads();
  const { data: threadData, isLoading: isThreadLoading } = useGmailThreadById(id);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFullHeight, setIsFullHeight] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Flatten all threads from all pages
  const allThreads = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.data);
  }, [data]);

  // Filter threads based on search
  const filteredThreads = useMemo(() => {
    if (!searchQuery.trim()) return allThreads;
    const query = searchQuery.toLowerCase();
    return allThreads.filter(thread =>
      thread.subject.toLowerCase().includes(query) ||
      thread.from.toLowerCase().includes(query) ||
      thread.messages.some(msg => msg.snippet.toLowerCase().includes(query))
    );
  }, [allThreads, searchQuery]);

  // Use thread data from API when available, fallback to list data
  const selectedThread = threadData?.data || allThreads.find((thread) => thread.id === id);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedThread?.messages]);

  // Determine if a message is outgoing (sent by current user)
  const isOutgoingMessage = (message: ThreadMessage): boolean => {
    return message.from.includes('tuvsnake@gmail.com');
  };

  const handleSendMessage = () => {
    if (!messageText.trim()) return;
    // TODO: Implement send message functionality
    console.log('Sending message:', messageText);
    setMessageText('');
  };

  // Extract sender name
  const extractName = (fromField: string): string => {
    const match = fromField.match(/^(.+?)\s*<.*>$/);
    return match ? match[1].trim() : fromField;
  };

  return (
    <div className="flex h-full w-full">
      {/* Thread List */}
      <div
        className={`flex flex-col w-full md:w-[380px] border-r border-white/5 bg-gradient-to-b from-slate-900/50 to-slate-950/50 backdrop-blur-sm z-0 transition-transform ${
          id ? 'hidden md:flex' : 'flex'
        }`}
      >
        {/* Header */}
        <div className="p-5 border-b border-white/5 bg-gradient-to-r from-purple-900/20 to-fuchsia-900/20 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-fuchsia-500 rounded-lg shadow-lg shadow-fuchsia-500/20">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              Messages
            </h2>
            <span className="text-xs text-slate-400 bg-white/5 px-3 py-1 rounded-full">
              {allThreads.length} chats
            </span>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-white/10 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 focus:border-fuchsia-500/50 transition-all"
            />
          </div>
        </div>

        {/* Thread List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-16">
              <Loader2 className="w-8 h-8 text-fuchsia-500 animate-spin mb-3" />
              <p className="text-sm text-slate-400">Loading conversations...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center p-16">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-3">
                <MessageSquare className="w-8 h-8 text-red-500" />
              </div>
              <p className="text-sm text-red-400">Failed to load chats</p>
            </div>
          ) : filteredThreads.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16">
              <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-3">
                <MessageSquare className="w-8 h-8 text-slate-600" />
              </div>
              <p className="text-sm text-slate-500">
                {searchQuery ? 'No chats found' : 'No conversations yet'}
              </p>
            </div>
          ) : (
            <>
              {filteredThreads.map((thread) => (
                <ThreadListItem
                  key={thread.id}
                  thread={thread}
                  isSelected={thread.id === id}
                  onClick={() => navigate(`/chats/${thread.id}`)}
                />
              ))}
              {hasNextPage && !searchQuery && (
                <div className="p-4">
                  <button
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    className="w-full py-3 px-4 bg-gradient-to-r from-purple-500/10 to-fuchsia-500/10 hover:from-purple-500/20 hover:to-fuchsia-500/20 text-fuchsia-400 rounded-xl transition-all duration-200 disabled:opacity-50 font-medium text-sm border border-fuchsia-500/20"
                  >
                    {isFetchingNextPage ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading...
                      </span>
                    ) : (
                      'Load More Conversations'
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Chat View */}
      <div className={`flex-1 flex flex-col bg-gradient-to-br from-slate-900/30 to-slate-950/50 w-full ${!id ? 'hidden md:flex' : 'flex'}`}>
        {selectedThread ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-white/5 bg-gradient-to-r from-slate-900/50 to-slate-950/50 backdrop-blur-sm w-full">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => navigate('/chats')}
                    className="md:hidden p-2 hover:bg-white/5 rounded-lg transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5 text-slate-400" />
                  </button>

                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center text-sm font-semibold text-white shadow-lg shadow-fuchsia-500/20">
                    {selectedThread.from.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>

                  <div>
                    <h3 className="text-base font-semibold text-white">
                      {extractName(selectedThread.from)}
                    </h3>
                    <p className="text-xs text-slate-400 truncate max-w-[200px]">
                      {selectedThread.subject}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button className="p-2 hover:bg-white/5 rounded-lg transition-colors group">
                    <Phone className="w-5 h-5 text-slate-400 group-hover:text-fuchsia-400 transition-colors" />
                  </button>
                  <button className="p-2 hover:bg-white/5 rounded-lg transition-colors group">
                    <Video className="w-5 h-5 text-slate-400 group-hover:text-fuchsia-400 transition-colors" />
                  </button>
                  <button
                    onClick={() => setIsFullHeight(!isFullHeight)}
                    className={`p-2 rounded-lg transition-all group ${
                      isFullHeight
                        ? 'bg-gradient-to-br from-purple-500 to-fuchsia-500 shadow-lg shadow-fuchsia-500/30'
                        : 'hover:bg-white/5'
                    }`}
                    title={isFullHeight ? 'Restore height' : 'Expand to full height'}
                  >
                    <Maximize2 className={`w-5 h-5 transition-colors ${
                      isFullHeight
                        ? 'text-white'
                        : 'text-slate-400 group-hover:text-fuchsia-400'
                    }`} />
                  </button>
                  <button className="p-2 hover:bg-white/5 rounded-lg transition-colors group">
                    <MoreVertical className="w-5 h-5 text-slate-400 group-hover:text-fuchsia-400 transition-colors" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar w-full">
              {isThreadLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-8 h-8 text-fuchsia-500 animate-spin" />
                </div>
              ) : (
                <div className="w-full">
                  {/* Date divider */}
                  <div className="flex items-center justify-center mb-8">
                    <div className="px-4 py-1.5 bg-slate-800/50 border border-white/5 rounded-full text-xs text-slate-400">
                      {new Date(selectedThread.firstDate).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  </div>

                  {selectedThread.messages.map((message) => (
                    <ChatMessage
                      key={message.id}
                      message={message}
                      isOutgoing={isOutgoingMessage(message)}
                      isFullHeight={isFullHeight}
                    />
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-white/5 bg-gradient-to-r from-slate-900/50 to-slate-950/50 backdrop-blur-sm">
              <div className="max-w-4xl mx-auto">
                <div className="flex items-end gap-3">
                  <div className="flex-1 relative">
                    <textarea
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder="Type your message..."
                      rows={1}
                      className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-2xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 focus:border-fuchsia-500/50 transition-all resize-none custom-scrollbar max-h-32"
                      style={{ minHeight: '48px' }}
                    />
                  </div>
                  <button
                    onClick={handleSendMessage}
                    disabled={!messageText.trim()}
                    className="p-3 bg-gradient-to-br from-purple-500 to-fuchsia-500 hover:from-purple-600 hover:to-fuchsia-600 text-white rounded-2xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-fuchsia-500/20 hover:shadow-fuchsia-500/40 disabled:shadow-none"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-2 text-center">
                  Press Enter to send, Shift + Enter for new line
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500/10 to-fuchsia-500/10 flex items-center justify-center mb-6">
              <MessageSquare className="w-12 h-12 text-fuchsia-500/50" />
            </div>
            <h3 className="text-xl font-semibold text-slate-300 mb-2">Select a conversation</h3>
            <p className="text-sm text-slate-500 text-center max-w-sm">
              Choose a chat from the sidebar to view the full conversation and send messages
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
