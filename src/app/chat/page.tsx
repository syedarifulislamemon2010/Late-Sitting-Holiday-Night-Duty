'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Search, 
  PlusCircle, 
  Users, 
  MessageSquare, 
  ShieldCheck, 
  Paperclip, 
  Image as ImageIcon, 
  Trash2, 
  Smile, 
  Download, 
  FileText,
  Clock,
  MoreVertical,
  X,
  FileCheck,
  CheckCircle2
} from 'lucide-react';

interface Participant {
  userId: number;
  name: string;
  username: string;
  role: string;
  lastReadAt?: string;
}

interface Message {
  id: number;
  chatId: number;
  senderId: number;
  sender: {
    id: number;
    name: string;
    username: string;
    role: string;
  };
  message: string;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentSize?: number;
  isUnsent: boolean;
  createdAt: string;
}

interface Chat {
  id: number;
  type: 'DIRECT' | 'GROUP';
  name: string;
  avatar?: string;
  creatorId?: number;
  createdAt: string;
  updatedAt: string;
  participants: Participant[];
  lastMessage?: Message | null;
}

interface DirectoryUser {
  id: number;
  username: string;
  name: string;
  role: string;
  cells: { id: number; name: string }[];
  designation?: string | null;
}

const PRESET_EMOJIS = ['😀', '😂', '😍', '👍', '❤️', '🎉', '🔥', '👏', '🙏', '💡', '⚠️', '✅'];

export default function ChatPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [directory, setDirectory] = useState<DirectoryUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchDirQuery, setSearchDirQuery] = useState('');

  // Form states
  const [replyText, setReplyText] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);

  // File Upload Stage
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [fileUploading, setFileUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Group Create Modal
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showDmModal, setShowDmModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedGroupMembers, setSelectedGroupMembers] = useState<Set<number>>(new Set());

  // Emoji Popover
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  // Message Options Dropdown
  const [activeMsgOptionsId, setActiveMsgOptionsId] = useState<number | null>(null);

  // Sync references
  const lastSyncTimeRef = useRef<string>(new Date().toISOString());
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Initial configuration
  useEffect(() => {
    const loadUser = () => {
      const stored = localStorage.getItem('currentUser');
      if (stored) {
        try {
          setCurrentUser(JSON.parse(stored));
        } catch {
          setCurrentUser(null);
        }
      } else {
        // Fallback to API if not in localStorage yet
        fetch('/api/auth')
          .then(res => res.json())
          .then(data => {
            if (data.authenticated) {
              setCurrentUser(data.user);
              localStorage.setItem('currentUser', JSON.stringify(data.user));
            }
          })
          .catch(() => setCurrentUser(null));
      }
    };

    loadUser();
    window.addEventListener('storage', loadUser);
    window.addEventListener('user-profile-updated', loadUser);

    fetchChats();
    fetchDirectory();

    return () => {
      window.removeEventListener('storage', loadUser);
      window.removeEventListener('user-profile-updated', loadUser);
    };
  }, []);

  // 2. Fetch list of chats and directory
  const fetchChats = async () => {
    try {
      const res = await fetch('/api/chats');
      if (res.ok) {
        const data = await res.json();
        setChats(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching chats:', err);
    }
  };

  const fetchDirectory = async () => {
    try {
      const res = await fetch('/api/chats/directory');
      if (res.ok) {
        const data = await res.json();
        setDirectory(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching chat directory:', err);
    }
  };

  // 3. Fetch messages for active chat
  useEffect(() => {
    if (!activeChatId) {
      setMessages([]);
      return;
    }
    fetchMessages(activeChatId);
    handleClearStagedFile();
  }, [activeChatId]);

  const fetchMessages = async (chatId: number) => {
    try {
      const res = await fetch(`/api/chats/${chatId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(Array.isArray(data) ? data : []);
        // Set sync marker to now
        lastSyncTimeRef.current = new Date().toISOString();
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  // 4. Scroll to bottom
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // 5. Active synchronization polling loop (2 seconds)
  useEffect(() => {
    const syncInterval = setInterval(async () => {
      if (!currentUser) return;
      try {
        const res = await fetch(`/api/chats/sync?since=${encodeURIComponent(lastSyncTimeRef.current)}`);
        if (res.ok) {
          const data = await res.json();
          const { timestamp, messages: newMsgs, chats: updatedChats } = data;
          
          // Update last sync reference
          lastSyncTimeRef.current = timestamp;

          // Merge any chat metadata changes
          if (Array.isArray(updatedChats) && updatedChats.length > 0) {
            setChats(prev => {
              const prevMap = new Map(prev.map(c => [c.id, c]));
              updatedChats.forEach(updated => {
                const existing = prevMap.get(updated.id);
                if (existing) {
                  prevMap.set(updated.id, {
                    ...existing,
                    ...updated
                  });
                } else {
                  // Fetch full chats to get proper consumer formatting
                  fetchChats();
                }
              });
              return Array.from(prevMap.values()).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
            });
          }

          // Merge new messages
          if (Array.isArray(newMsgs) && newMsgs.length > 0) {
            // Update active chat history
            if (activeChatId) {
              const activeMsgs = newMsgs.filter(m => m.chatId === activeChatId);
              if (activeMsgs.length > 0) {
                setMessages(prev => {
                  const prevMap = new Map(prev.map(m => [m.id, m]));
                  activeMsgs.forEach(m => prevMap.set(m.id, m));
                  return Array.from(prevMap.values()).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
                });
              }
            }

            // Push chat cards to the top and update card snippets
            setChats(prev => {
              const prevMap = new Map(prev.map(c => [c.id, c]));
              newMsgs.forEach(m => {
                const targetChat = prevMap.get(m.chatId);
                if (targetChat) {
                  prevMap.set(m.chatId, {
                    ...targetChat,
                    updatedAt: m.createdAt,
                    lastMessage: m
                  });
                } else {
                  fetchChats();
                }
              });
              return Array.from(prevMap.values()).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
            });
          }
        }
      } catch (err) {
        console.warn('Real-time sync poll failed, retrying...', err);
      }
    }, 2000);

    return () => clearInterval(syncInterval);
  }, [currentUser, activeChatId]);

  // 6. DM Thread Initializer
  const handleStartDM = async (targetUserId: number) => {
    try {
      const res = await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'DIRECT',
          participantIds: [targetUserId]
        })
      });

      if (res.ok) {
        const chat = await res.json();
        setChats(prev => {
          if (prev.some(c => c.id === chat.id)) return prev;
          return [chat, ...prev];
        });
        setActiveChatId(chat.id);
        setShowDmModal(false);
      }
    } catch (err) {
      console.error('Error starting DM:', err);
    }
  };

  // 7. Group Creation Thread Trigger
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim() || selectedGroupMembers.size === 0) return;

    try {
      const res = await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'GROUP',
          name: newGroupName.trim(),
          participantIds: Array.from(selectedGroupMembers)
        })
      });

      if (res.ok) {
        const chat = await res.json();
        setChats(prev => [chat, ...prev]);
        setActiveChatId(chat.id);
        setNewGroupName('');
        setSelectedGroupMembers(new Set());
        setShowGroupModal(false);
      }
    } catch (err) {
      console.error('Error creating group chat:', err);
    }
  };

  const toggleGroupMember = (uid: number) => {
    const next = new Set(selectedGroupMembers);
    if (next.has(uid)) {
      next.delete(uid);
    } else {
      next.add(uid);
    }
    setSelectedGroupMembers(next);
  };

  // 8. Staged files handlers
  const handleClearStagedFile = () => {
    setSelectedFile(null);
    if (filePreviewUrl) {
      URL.revokeObjectURL(filePreviewUrl);
      setFilePreviewUrl(null);
    }
  };

  const stageFileAttachment = (file: File) => {
    setSelectedFile(file);
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setFilePreviewUrl(url);
    } else {
      setFilePreviewUrl(null); // non-image file
    }
  };

  // 9. File attachment server uploading handler
  const uploadAttachmentToServer = async () => {
    if (!selectedFile) return null;
    try {
      setFileUploading(true);
      const form = new FormData();
      form.append('file', selectedFile);
      const res = await fetch('/api/chats/upload', {
        method: 'POST',
        body: form
      });
      if (res.ok) {
        const data = await res.json();
        return data; // returns { filePath, fileName, fileSize }
      }
      return null;
    } catch (err) {
      console.error('Upload failed:', err);
      return null;
    } finally {
      setFileUploading(false);
    }
  };

  // 10. Direct copy-paste clipboard hook
  const handleClipboardPaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1 || items[i].type.indexOf('pdf') !== -1 || items[i].kind === 'file') {
        const file = items[i].getAsFile();
        if (file) {
          stageFileAttachment(file);
          e.preventDefault();
          break;
        }
      }
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      stageFileAttachment(files[0]);
    }
  };

  // 11. Send Message Trigger
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChatId) return;
    if (!replyText.trim() && !selectedFile) return;

    try {
      setReplyLoading(true);

      // Upload attachment first if staged
      let uploadResult = null;
      if (selectedFile) {
        uploadResult = await uploadAttachmentToServer();
        if (!uploadResult) {
          alert('ফাইল আপলোড ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
          setReplyLoading(false);
          return;
        }
      }

      const res = await fetch(`/api/chats/${activeChatId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: replyText.trim(),
          attachmentUrl: uploadResult?.filePath || null,
          attachmentName: uploadResult?.fileName || null,
          attachmentSize: uploadResult?.fileSize || null
        })
      });

      if (res.ok) {
        const newMsg = await res.json();
        setMessages(prev => [...prev, newMsg]);
        setReplyText('');
        handleClearStagedFile();
        
        // Dynamic push chat lists metadata
        setChats(prev => prev.map(c => {
          if (c.id === activeChatId) {
            return {
              ...c,
              updatedAt: new Date().toISOString(),
              lastMessage: newMsg
            };
          }
          return c;
        }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
      }
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setReplyLoading(false);
    }
  };

  // 12. Message Unsend Handler (Everyone / Me)
  const handleUnsendMessage = async (msgId: number, type: 'EVERYONE' | 'ME') => {
    try {
      const res = await fetch(`/api/chats/messages/${msgId}/unsend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      });

      if (res.ok) {
        // Toggle view instantly
        if (type === 'EVERYONE') {
          setMessages(prev => prev.map(m => {
            if (m.id === msgId) {
              return {
                ...m,
                isUnsent: true,
                message: '🚫 এই বার্তাটি আনসেন্ট করা হয়েছে',
                attachmentUrl: undefined,
                attachmentName: undefined,
                attachmentSize: undefined
              };
            }
            return m;
          }));
        } else {
          // Hide message for me
          setMessages(prev => prev.filter(m => m.id !== msgId));
        }
        setActiveMsgOptionsId(null);
      }
    } catch (err) {
      console.error('Error unsending message:', err);
    }
  };

  // Format bytes helper
  const formatBytes = (bytes?: number): string => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  };

  // Standard date translator helper
  const translateTime = (dateStr: string): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${minutes} ${ampm}`;
  };

  // Category tags helper
  const getCategoryColor = (role: string) => {
    return role === 'ADMIN' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-650';
  };

  // Active chat selected object
  const activeChat = chats.find(c => c.id === activeChatId);

  // Filters chat lists based on search
  const filteredChats = chats.filter(c => {
    return c.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Filters directory list based on search
  const filteredDir = directory.filter(u => {
    return u.name.toLowerCase().includes(searchDirQuery.toLowerCase()) || 
           u.username.toLowerCase().includes(searchDirQuery.toLowerCase());
  });

  return (
    <div className="space-y-0 h-[calc(100vh-80px)] max-w-7xl mx-auto font-sans flex border border-slate-200 bg-white rounded-3xl overflow-hidden shadow-sm select-none">
      
      {/* LEFT PANEL: CONVERSATIONS SIDEBAR (35%) */}
      <div className="w-1/3 flex flex-col border-r border-slate-200 h-full">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
              <MessageSquare size={16} className="text-indigo-600" />
              মেসেঞ্জার চ্যাট
            </h2>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowDmModal(true)}
                title="নতুন মেসেজ পাঠান"
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 hover:text-slate-900 rounded-lg transition-all cursor-pointer hover:scale-105 active:scale-95"
              >
                <PlusCircle size={15} />
              </button>
              <button
                onClick={() => setShowGroupModal(true)}
                title="নতুন গ্রুপ চ্যাট তৈরি করুন"
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 hover:text-slate-900 rounded-lg transition-all cursor-pointer hover:scale-105 active:scale-95"
              >
                <Users size={15} />
              </button>
            </div>
          </div>

          {/* Search conversations */}
          <div className="relative">
            <input
              type="text"
              placeholder="চ্যাট অনুসন্ধান করুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-100 border border-transparent focus:border-slate-200 focus:bg-white rounded-xl text-xs font-semibold outline-none transition-all"
            />
            <Search size={12} className="absolute left-2.5 top-2.5 text-slate-400" />
          </div>
        </div>

        {/* Scrollable list card list */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-50 pr-1 p-2 space-y-1">
          {filteredChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
              <MessageSquare size={36} className="text-slate-300 mb-2" />
              <p className="text-xs font-bold text-slate-500">কোনো চ্যাট পাওয়া যায়নি।</p>
              <button
                onClick={() => setShowDmModal(true)}
                className="mt-3 px-3 py-1.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-extrabold transition-all cursor-pointer"
              >
                পছন্দের কর্মকর্তাকে মেসেজ করুন
              </button>
            </div>
          ) : (
            filteredChats.map((chat) => {
              const isActive = chat.id === activeChatId;
              const hasLastMsg = !!chat.lastMessage;
              
              return (
                <div
                  key={chat.id}
                  onClick={() => setActiveChatId(chat.id)}
                  className={`p-3 rounded-2xl cursor-pointer transition-all border flex items-center gap-3 ${isActive ? 'bg-indigo-50/20 border-indigo-200/60 ring-1 ring-indigo-100 shadow-xs' : 'border-transparent hover:bg-slate-50/50 bg-white'}`}
                >
                  {/* Avatar bubble circle */}
                  <div className={`w-10 h-10 rounded-full font-bold flex items-center justify-center text-sm text-white shrink-0 shadow-xs uppercase select-none ${chat.type === 'GROUP' ? 'bg-indigo-600' : 'bg-blue-600'}`}>
                    {chat.type === 'GROUP' ? <Users size={16} /> : chat.name.charAt(0)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-extrabold text-slate-800 truncate leading-tight">
                        {chat.name}
                      </h4>
                      {chat.lastMessage && (
                        <span className="text-[8px] font-bold text-slate-400 shrink-0">
                          {translateTime(chat.lastMessage.createdAt)}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 truncate mt-1">
                      {hasLastMsg ? (
                        <>
                          <span className="font-extrabold text-slate-700">{chat.lastMessage?.senderId === currentUser?.id ? 'আমি: ' : `${chat.lastMessage?.sender.name.split(' ').pop()}: `}</span>
                          {chat.lastMessage?.message || (chat.lastMessage?.attachmentUrl ? '📂 ফাইল সংযুক্তি...' : '')}
                        </>
                      ) : (
                        'কোনো বার্তা পাঠানো হয়নি।'
                      )}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT PANEL: CHAT WINDOW VIEWPORT (65%) */}
      <div className="flex-1 flex flex-col h-full bg-slate-50/20">
        {activeChat ? (
          <div 
            className="flex flex-col h-full relative"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {/* Visual drag-drop overlay */}
            {isDragging && (
              <div className="absolute inset-0 bg-indigo-500/10 backdrop-blur-xs border-2 border-dashed border-indigo-500 rounded-r-3xl flex items-center justify-center pointer-events-none z-10">
                <p className="text-xs font-black text-indigo-700 bg-white dark:bg-slate-900 px-4 py-2 rounded-full shadow-md">
                  📂 ফাইল বা স্ক্রিনশটটি চ্যাটে পাঠাতে এখানে ছেড়ে দিন
                </p>
              </div>
            )}

            {/* Chat Room Header */}
            <div className="px-6 py-4 bg-white border-b border-slate-200/80 flex items-center justify-between shrink-0 select-none shadow-xs">
              <div className="space-y-1 min-w-0">
                <h3 className="text-xs font-black text-slate-800 truncate leading-snug">
                  {activeChat.name}
                </h3>
                <div className="flex items-center gap-1.5 text-[8px] font-bold text-slate-400">
                  <span className={`px-2 py-0.5 rounded border leading-none bg-slate-100 border-slate-200 text-slate-650`}>
                    {activeChat.type === 'GROUP' ? 'গ্রুপ চ্যাট' : 'ব্যক্তিগত মেসেজ'}
                  </span>
                  <span>•</span>
                  <div className="flex items-center gap-0.5 text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded leading-none border border-emerald-150/40 shadow-xs">
                    <ShieldCheck size={9} />
                    <span>ইন্ড-টু-ইন্ড এনক্রিপশন</span>
                  </div>
                </div>
              </div>

              {/* Members preview dropdown tooltip */}
              {activeChat.type === 'GROUP' && (
                <div className="text-[9px] font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
                  সদস্যঃ {toBanglaDigits(activeChat.participants.length)} জন
                </div>
              )}
            </div>

            {/* Scrollable Conversation Bubbles */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 max-h-[calc(100vh-230px)] bg-slate-50/10">
              {messages.map((msg) => {
                const isMyMessage = msg.senderId === currentUser?.id;
                const senderInitial = msg.sender.name ? msg.sender.name.trim().charAt(0) : 'U';
                const isSenderAdmin = msg.sender.role === 'ADMIN';
                const isImage = msg.attachmentUrl && (
                  msg.attachmentUrl.endsWith('.png') ||
                  msg.attachmentUrl.endsWith('.jpg') ||
                  msg.attachmentUrl.endsWith('.jpeg') ||
                  msg.attachmentUrl.endsWith('.webp') ||
                  msg.attachmentUrl.endsWith('.gif')
                );

                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3 items-start relative group/msg ${isMyMessage ? 'flex-row-reverse' : ''}`}
                  >
                    {/* Avatar initial circle */}
                    <div className={`w-8 h-8 rounded-full font-bold flex items-center justify-center text-xs text-white shrink-0 shadow-xs uppercase select-none ${isSenderAdmin ? 'bg-indigo-600' : 'bg-blue-600'}`}>
                      {senderInitial}
                    </div>

                    <div className="space-y-1 max-w-[70%] relative">
                      {/* Sender Name label (only for group chats) */}
                      {!isMyMessage && activeChat.type === 'GROUP' && (
                        <div className="text-[8px] font-bold text-slate-400 flex items-center gap-1 px-1">
                          <span>{msg.sender.name}</span>
                          <span className="text-[7px] text-slate-350">
                            ({msg.sender.role === 'ADMIN' ? 'অ্যাডমিন' : `@${msg.sender.username}`})
                          </span>
                        </div>
                      )}

                      {/* Telegram styled message bubble */}
                      <div className={`px-4 py-2.5 rounded-2xl text-[11px] leading-relaxed shadow-xs relative ${isMyMessage ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white border border-slate-150 text-slate-800 rounded-tl-none'}`}>
                        {/* File Attachment render */}
                        {msg.attachmentUrl && (
                          <div className="mb-2.5 max-w-full rounded-lg overflow-hidden border border-slate-200/50 shadow-inner bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-1 select-text">
                            {isImage ? (
                              <a 
                                href={msg.attachmentUrl} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="block relative cursor-zoom-in group"
                              >
                                <img 
                                  src={msg.attachmentUrl} 
                                  alt="Attachment Screenshot" 
                                  className="max-h-48 w-auto object-contain hover:opacity-90 transition-opacity" 
                                />
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[8px] text-white font-bold transition-opacity">
                                  🔍 নতুন ট্যাবে দেখুন
                                </div>
                              </a>
                            ) : (
                              <div className="flex items-center gap-3 p-1.5 w-full">
                                <FileText size={24} className="text-indigo-600 shrink-0" />
                                <div className="min-w-0 flex-1 text-[9px] text-slate-500 font-semibold">
                                  <p className="truncate text-slate-800 font-bold">{msg.attachmentName || 'file'}</p>
                                  <p>{formatBytes(msg.attachmentSize)}</p>
                                </div>
                                <a 
                                  href={msg.attachmentUrl} 
                                  download={msg.attachmentName}
                                  className="p-1.5 bg-indigo-50 border border-indigo-200 text-indigo-650 hover:bg-indigo-600 hover:text-white rounded-lg transition-all shrink-0 cursor-pointer"
                                  title="ডাউনলোড করুন"
                                >
                                  <Download size={12} />
                                </a>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Message body text */}
                        <span className={msg.isUnsent ? 'text-slate-400 italic text-[10px]' : ''}>
                          {msg.message}
                        </span>

                        {/* Timestamp */}
                        <div className={`text-[7px] font-bold text-right mt-1.5 select-none ${isMyMessage ? 'text-indigo-200' : 'text-slate-400'}`}>
                          {translateTime(msg.createdAt)}
                        </div>
                      </div>
                    </div>

                    {/* Unsend / Options Menu dropdown on hover */}
                    {!msg.isUnsent && (
                      <div className="opacity-0 group-hover/msg:opacity-100 transition-opacity duration-200 flex items-center self-center z-10 shrink-0">
                        <button
                          onClick={() => setActiveMsgOptionsId(activeMsgOptionsId === msg.id ? null : msg.id)}
                          className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer transition-all"
                        >
                          <MoreVertical size={13} />
                        </button>

                        {activeMsgOptionsId === msg.id && (
                          <div className="absolute bg-white border border-slate-200/80 shadow-md rounded-xl py-1.5 w-36 text-[10px] font-extrabold text-slate-650 z-20 mt-12 select-none">
                            {isMyMessage && (
                              <button
                                onClick={() => handleUnsendMessage(msg.id, 'EVERYONE')}
                                className="w-full text-left px-3 py-1.5 hover:bg-rose-50 hover:text-rose-600 transition-colors flex items-center gap-1.5 cursor-pointer border-b border-slate-50"
                              >
                                <Trash2 size={11} />
                                সবার জন্য আনসেন্ট
                              </button>
                            )}
                            <button
                              onClick={() => handleUnsendMessage(msg.id, 'ME')}
                              className="w-full text-left px-3 py-1.5 hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center gap-1.5 cursor-pointer"
                            >
                              <X size={11} />
                              আমার জন্য মুছুন
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                );
              })}
              <div ref={chatBottomRef} />
            </div>

            {/* Staged file attachment preview block */}
            {selectedFile && (
              <div className="mx-6 mb-2.5 p-2 bg-indigo-50/20 border border-indigo-150/40 rounded-xl flex items-center justify-between gap-3 shadow-inner shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  {filePreviewUrl ? (
                    <img 
                      src={filePreviewUrl} 
                      alt="Attachment Preview" 
                      className="w-10 h-10 object-cover rounded-lg border border-slate-200 dark:border-slate-800 shrink-0" 
                    />
                  ) : (
                    <div className="w-10 h-10 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center text-slate-500 shrink-0">
                      <FileText size={18} />
                    </div>
                  )}
                  <div className="min-w-0 text-[9px] font-semibold text-slate-500">
                    <p className="truncate text-slate-800 font-extrabold">{selectedFile.name}</p>
                    <p>{formatBytes(selectedFile.size)}</p>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={handleClearStagedFile}
                  className="p-1 hover:bg-rose-100 hover:text-rose-600 text-slate-400 rounded-lg transition-colors cursor-pointer shrink-0"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            )}

            {/* Message Input Form Footer */}
            <div className="p-4 bg-white border-t border-slate-150 shrink-0">
              <form onSubmit={handleSendMessage} className="flex gap-2 items-center relative">
                {/* Hidden File Picker Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    const files = e.target.files;
                    if (files && files.length > 0) {
                      stageFileAttachment(files[0]);
                    }
                  }}
                  className="hidden"
                />

                {/* File picker dialog trigger button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-xl transition-all flex items-center justify-center cursor-pointer shrink-0 border border-slate-200/50 hover:scale-[1.02] active:scale-[0.98]"
                  title="ফাইল/মিডিয়া যুক্ত করুন"
                >
                  <Paperclip size={14} />
                </button>

                {/* Emoji popover selector trigger button */}
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-2 hover:bg-slate-100 text-slate-500 hover:text-slate-850 rounded-xl transition-all flex items-center justify-center cursor-pointer shrink-0 border border-slate-200/50 hover:scale-[1.02] active:scale-[0.98]"
                  title="ইমোজি প্যানেল"
                >
                  <Smile size={14} />
                </button>

                {/* Curated Emojis Picker Overlay Panel */}
                {showEmojiPicker && (
                  <div className="absolute bg-white border border-slate-200 shadow-md rounded-2xl p-2.5 flex gap-2 bottom-12 left-10 z-30 select-none animate-in fade-in slide-in-from-bottom-2 duration-200">
                    {PRESET_EMOJIS.map(em => (
                      <button
                        key={em}
                        type="button"
                        onClick={() => {
                          setReplyText(prev => prev + em);
                          setShowEmojiPicker(false);
                        }}
                        className="text-sm p-1.5 hover:bg-slate-50 active:scale-90 rounded-lg transition-all cursor-pointer"
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                )}

                <input
                  type="text"
                  placeholder="বার্তা লিখুন... (Ctrl+V দিয়ে ফাইল/ছবি পেস্ট করতে পারেন)"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onPaste={handleClipboardPaste}
                  className="flex-1 px-4 py-2 border border-slate-200 bg-slate-50 focus:bg-white rounded-xl outline-none focus:border-indigo-500 text-xs font-semibold"
                  disabled={replyLoading || fileUploading}
                />

                <button
                  type="submit"
                  disabled={replyLoading || fileUploading || (!replyText.trim() && !selectedFile)}
                  className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-md hover:bg-indigo-700 active:scale-95 transition-all shrink-0 cursor-pointer disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 hover:scale-[1.02]"
                >
                  {replyLoading || fileUploading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send size={13} />
                  )}
                </button>
              </form>
            </div>

          </div>
        ) : (
          /* Empty/Initial Selection landing viewport illustration */
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 select-none">
            <div className="w-16 h-16 rounded-full bg-indigo-50 text-indigo-650 flex items-center justify-center shadow-inner mb-4 animate-pulse">
              <MessageSquare size={26} />
            </div>
            <h3 className="text-sm font-black text-slate-800">লেট সিটিং মেসেঞ্জার ড্যাশবোর্ড</h3>
            <p className="text-[10px] text-slate-400 mt-1 max-w-sm leading-relaxed">
              সিস্টেমের যেকোনো কর্মকর্তার সাথে ফেসবুক কিংবা হোয়াটসএপের মত রিয়েল-টাইম চ্যাট ও ফাইল ট্রান্সফার করুন। বার্তা বা ফাইল পাঠাতে বামদিকের তালিকা থেকে চ্যাট নির্বাচন করুন অথবা নতুন টিকিট চ্যাট বা গ্রুপ চালু করুন।
            </p>
          </div>
        )}
      </div>

      {/* A. DM/START NEW CHAT DIALOG MODAL */}
      {showDmModal && (
        <div className="no-print fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 animate-in fade-in duration-200 select-none">
          <div className="bg-white rounded-3xl w-full max-w-md border border-slate-200 p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="font-extrabold text-slate-850 text-xs flex items-center gap-1.5">
                <MessageSquare size={14} className="text-indigo-600" />
                নতুন চ্যাট বা মেসেজ চালু করুন
              </h3>
              <button 
                onClick={() => setShowDmModal(false)}
                className="p-1 hover:bg-slate-50 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            {/* Search directory */}
            <div className="relative">
              <input
                type="text"
                placeholder="কর্মকর্তার নাম বা ব্যাংক আইডি দিয়ে খুঁজুন..."
                value={searchDirQuery}
                onChange={(e) => setSearchDirQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-xs font-semibold outline-none transition-all"
              />
              <Search size={12} className="absolute left-2.5 top-2.5 text-slate-400" />
            </div>

            {/* Directory listing list */}
            <div className="max-h-[280px] overflow-y-auto space-y-3 pr-1">
              {filteredDir.length === 0 ? (
                <p className="text-[10px] text-slate-400 font-bold text-center py-8">কোনো কর্মকর্তা পাওয়া যায়নি।</p>
              ) : (
                Object.entries(groupUsersByCell(filteredDir)).map(([cellName, cellUsers]) => (
                  <div key={cellName} className="space-y-1">
                    <div className="sticky top-0 bg-white z-10 py-1 border-b border-slate-100/80 mb-1 flex items-center justify-between">
                      <span className="text-[9px] font-extrabold text-indigo-600 bg-indigo-50/60 border border-indigo-100/50 px-2.5 py-0.5 rounded-full">
                        🏢 {cellName} ({toBanglaDigits(cellUsers.length)} জন)
                      </span>
                    </div>
                    {cellUsers.map((u) => (
                      <div
                        key={u.id}
                        onClick={() => handleStartDM(u.id)}
                        className="p-2 rounded-xl hover:bg-slate-50 cursor-pointer transition-all flex items-center justify-between border border-transparent hover:border-slate-200/50"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-extrabold flex items-center justify-center text-xs uppercase shrink-0">
                            {u.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-extrabold text-slate-800 truncate">{u.name}</p>
                            <p className="text-[8px] text-slate-400 -mt-0.5 truncate">
                              {u.designation ? `${u.designation} • ` : ''}আইডিঃ {u.username}
                            </p>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[7px] font-black border leading-none shrink-0 ${getCategoryColor(u.role)}`}>
                          {u.role === 'ADMIN' ? 'অ্যাডমিন' : 'ইউজার'}
                        </span>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* B. GROUP CHAT CREATOR DIALOG MODAL */}
      {showGroupModal && (
        <div className="no-print fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 animate-in fade-in duration-200 select-none">
          <div className="bg-white rounded-3xl w-full max-w-md border border-slate-200 p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="font-extrabold text-slate-855 text-xs flex items-center gap-1.5">
                <Users size={14} className="text-indigo-650" />
                নতুন গ্রুপ চ্যাট তৈরি করুন
              </h3>
              <button 
                onClick={() => {
                  setShowGroupModal(false);
                  setNewGroupName('');
                  setSelectedGroupMembers(new Set());
                }}
                className="p-1 hover:bg-slate-50 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-4 flex flex-col h-full">
              {/* Group Name input */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500">গ্রুপের নামঃ</label>
                <input
                  type="text"
                  placeholder="গ্রুপ চ্যাটের একটি আকর্ষণীয় নাম দিন (যেমন: সেল-৩ আলোচনা)"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:bg-white text-xs font-semibold"
                  required
                />
              </div>

              {/* Members selector directory list */}
              <div className="space-y-2 flex-1 flex flex-col min-h-[220px]">
                <label className="text-[10px] font-bold text-slate-500 flex items-center justify-between">
                  <span>গ্রুপ সদস্য নির্বাচন করুনঃ</span>
                  <span className="text-[9px] text-indigo-650 bg-indigo-50 border border-indigo-150 px-2 py-0.5 rounded-full">
                    সিলেক্টঃ {toBanglaDigits(selectedGroupMembers.size)} জন
                  </span>
                </label>

                {/* Directory search inside Group modal */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="নাম বা আইডি দিয়ে খুঁজুন..."
                    value={searchDirQuery}
                    onChange={(e) => setSearchDirQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-xs font-semibold outline-none transition-all"
                  />
                  <Search size={11} className="absolute left-2.5 top-2.5 text-slate-400" />
                </div>

                <div className="max-h-[190px] overflow-y-auto space-y-3 pr-1">
                  {filteredDir.length === 0 ? (
                    <p className="text-[10px] text-slate-400 font-bold text-center py-6">কোনো কর্মকর্তা পাওয়া যায়নি।</p>
                  ) : (
                    Object.entries(groupUsersByCell(filteredDir)).map(([cellName, cellUsers]) => (
                      <div key={cellName} className="space-y-1">
                        <div className="sticky top-0 bg-white z-10 py-1 border-b border-slate-100/80 mb-1">
                          <span className="text-[8px] font-extrabold text-indigo-650 bg-indigo-50/60 border border-indigo-150/40 px-2 py-0.5 rounded-full">
                            🏢 {cellName}
                          </span>
                        </div>
                        {cellUsers.map((u) => {
                          const isChecked = selectedGroupMembers.has(u.id);
                          return (
                            <div
                              key={u.id}
                              onClick={() => toggleGroupMember(u.id)}
                              className="p-2 rounded-xl hover:bg-slate-50 cursor-pointer transition-all flex items-center justify-between border border-transparent hover:border-slate-200/50"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => toggleGroupMember(u.id)}
                                  className="w-3.5 h-3.5 accent-indigo-600 rounded cursor-pointer shrink-0"
                                />
                                <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-extrabold flex items-center justify-center text-[10px] uppercase shrink-0">
                                  {u.name.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-[10px] font-extrabold text-slate-800 truncate">{u.name}</p>
                                  <p className="text-[7px] text-slate-400 -mt-0.5 truncate">
                                    {u.designation ? `${u.designation} • ` : ''}আইডিঃ {u.username}
                                  </p>
                                </div>
                              </div>
                              <span className={`px-2 py-0.5 rounded-full text-[7px] font-black border leading-none shrink-0 ${getCategoryColor(u.role)}`}>
                                {u.role === 'ADMIN' ? 'অ্যাডমিন' : 'ইউজার'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={!newGroupName.trim() || selectedGroupMembers.size === 0}
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 hover:scale-[1.02]"
              >
                <CheckCircle2 size={12} />
                গ্রুপ তৈরি করুন
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

// Convert numbers and dates to premium Bengali local digits
function toBanglaDigits(num: number | string): string {
  const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).split('').map(d => banglaDigits[parseInt(d, 10)] || d).join('');
}

// Group directory users cell-wise
function groupUsersByCell(usersList: DirectoryUser[]): { [cellName: string]: DirectoryUser[] } {
  const groups: { [cellName: string]: DirectoryUser[] } = {};
  usersList.forEach(u => {
    const cellName = u.cells[0]?.name || 'সাধারণ সেকশন';
    if (!groups[cellName]) {
      groups[cellName] = [];
    }
    groups[cellName].push(u);
  });
  return groups;
}
