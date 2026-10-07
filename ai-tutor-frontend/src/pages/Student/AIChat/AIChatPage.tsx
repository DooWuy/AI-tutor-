import React, { useEffect, useState } from 'react';
import { ChatSidebar } from './components/ChatSidebar';
import { ChatArea } from './components/ChatArea';
import { CreateSessionModal } from './components/CreateSessionModal';
import { RenameSessionModal } from './components/RenameSessionModal';
import { DeleteSessionModal } from './components/DeleteSessionModal';
import { getChatSessions, getChatSessionMessages, createChatSession } from '../../../services/chatApi';
import type { ChatSession, ChatMessage } from '../../../services/chatApi';
import { getStoredSession } from '../../../services/authApi';

export const AIChatPage: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [sessionToRename, setSessionToRename] = useState<ChatSession | null>(null);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<ChatSession | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const session = getStoredSession();
  const studentAvatar = session?.user?.avatarUrl || `https://ui-avatars.com/api/?name=Student&background=0A5EB0&color=fff`;

  const handleSelectSession = async (id: string) => {
    setActiveSessionId(id);
    try {
      const data = await getChatSessionMessages(id);
      setMessages(data);
    } catch (error) {
      console.error('Failed to load messages', error);
    }
  };

  const loadSessions = async () => {
    try {
      const data = await getChatSessions();
      setSessions(data);
      if (data.length > 0 && !activeSessionId) {
        handleSelectSession(data[0].id);
      }
    } catch (error) {
      console.error('Failed to load sessions', error);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const handleCreateSession = async (subject: string) => {
    try {
      const newSession = await createChatSession(subject);
      setSessions([newSession, ...sessions]);
      setActiveSessionId(newSession.id);
      setMessages([]);
    } catch (error) {
      console.error('Failed to create session', error);
    }
  };

  const handleOpenRename = (sessionItem: ChatSession) => {
    setSessionToRename(sessionItem);
    setIsRenameModalOpen(true);
  };

  const handleRenameSuccess = (updatedSession: ChatSession) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === updatedSession.id ? updatedSession : s))
    );
  };

  const handleOpenDelete = (sessionItem: ChatSession) => {
    setSessionToDelete(sessionItem);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteSuccess = (deletedSessionId: string) => {
    setSessions((prev) => {
      const remaining = prev.filter((s) => s.id !== deletedSessionId);
      if (activeSessionId === deletedSessionId) {
        if (remaining.length > 0) {
          handleSelectSession(remaining[0].id);
        } else {
          setActiveSessionId(null);
          setMessages([]);
        }
      }
      return remaining;
    });
  };

  const handleSendMessage = async (content: string) => {
    if (!activeSessionId) return;

    // Add optimistic user message
    const tempUserMsg: ChatMessage = {
      id: Date.now().toString(),
      chatSessionId: activeSessionId,
      senderType: 'STUDENT',
      content: content,
      createdAt: new Date().toISOString()
    };
    
    const tempAiMsgId = (Date.now() + 1).toString();
    const tempAiMsg: ChatMessage = {
      id: tempAiMsgId,
      chatSessionId: activeSessionId,
      senderType: 'AI',
      content: '',
      citationLinks: [],
      createdAt: new Date().toISOString()
    };

    setMessages(prev => [...prev, tempUserMsg, tempAiMsg]);
    setIsLoading(true);

    try {
      // Use fetch to support SSE with cookies
      const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8088/api/v1').replace(/\/$/, '');
      const response = await fetch(`${API_BASE_URL}/chat-sessions/${activeSessionId}/chat/stream`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: content })
      });

      if (!response.body) throw new Error("ReadableStream not supported in this browser.");
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      
      let done = false;
      let currentContent = '';
      let citations: any[] = [];

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          
          let eventType = null;
          let eventData = null;

          for (const line of lines) {
            if (line.startsWith('event:')) {
              eventType = line.substring(6).trim();
            } else if (line.startsWith('data:')) {
              eventData = line.substring(5).trim();
              if (eventType === 'message') {
                currentContent += eventData + ' ';
                // Update AI message state
                setMessages(prev => prev.map(m => m.id === tempAiMsgId ? { ...m, content: currentContent } : m));
              } else if (eventType === 'citations' && eventData !== '') {
                try {
                  const parsed = JSON.parse(eventData);
                  if (parsed.length > 0) {
                    citations = parsed;
                    setMessages(prev => prev.map(m => m.id === tempAiMsgId ? { ...m, citationLinks: citations } : m));
                  }
                } catch {}
              } else if (eventType === 'done') {
                done = true;
                break;
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('SSE Error:', error);
      setMessages(prev => prev.map(m => m.id === tempAiMsgId ? { ...m, content: m.content + ' [Lỗi kết nối]' } : m));
    } finally {
      setIsLoading(false);
    }
  };

  const activeSession = sessions.find(s => s.id === activeSessionId) || null;

  return (
    <div className="flex flex-1 overflow-hidden h-[calc(100vh-64px)] w-full -mx-space-md md:-mx-space-lg -my-6 bg-surface">
      <ChatSidebar 
        sessions={sessions} 
        activeSessionId={activeSessionId} 
        onSelectSession={handleSelectSession}
        onCreateSession={() => setIsCreateModalOpen(true)}
        onRenameSession={handleOpenRename}
        onDeleteSession={handleOpenDelete}
      />
      <ChatArea 
        session={activeSession}
        messages={messages}
        studentAvatar={studentAvatar}
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
      />
      <CreateSessionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateSession}
      />
      <RenameSessionModal
        isOpen={isRenameModalOpen}
        session={sessionToRename}
        onClose={() => {
          setIsRenameModalOpen(false);
          setSessionToRename(null);
        }}
        onSuccess={handleRenameSuccess}
      />
      <DeleteSessionModal
        isOpen={isDeleteModalOpen}
        session={sessionToDelete}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSessionToDelete(null);
        }}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
};
