import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { createOrGetRoom, fetchChatUsers, fetchMessages } from "../api/chat";

const getChatBackendBaseURL = () => {
  const company = localStorage.getItem("company") || "";
  const cleanedCompany = company.trim().toLowerCase();

  if (!cleanedCompany) {
    return "http://localhost:8000";
  }

  return `http://${cleanedCompany}.localhost:8000`;
};

const ChatPage = () => {
  const { user } = useAuth();
  const [chatUsers, setChatUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [search, setSearch] = useState("");
  const [roomId, setRoomId] = useState("");
  const [activeUser, setActiveUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [loadingRoom, setLoadingRoom] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState("");
  const socketRef = useRef(null);
  const endRef = useRef(null);

  // Safely extract identity labels from global Auth context
  const currentUserLabel = useMemo(() => {
    if (typeof user === "string") return user;
    return user?.name || user?.full_name || user?.user || user?.email || "";
  }, [user]);

  const currentUserEmail = useMemo(() => {
    if (typeof user === "string") return "";
    return user?.email || "";
  }, [user]);

  const currentUserId = useMemo(() => {
    if (typeof user === "string") return "";
    return user?.id ? String(user.id) : "";
  }, [user]);

  // Keep a mutable ref of activeUser so WebSocket listeners always read the fresh state values
  const activeUserRef = useRef(activeUser);
  useEffect(() => {
    activeUserRef.current = activeUser;
  }, [activeUser]);

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return chatUsers;

    return chatUsers.filter((item) => {
      const fullName = (item.full_name || "").toLowerCase();
      const role = (item.role || "").toLowerCase();
      return (
        fullName.includes(term) ||
        role.includes(term) ||
        String(item.id).includes(term)
      );
    });
  }, [chatUsers, search]);

  const loadChatUsers = async (silent = false) => {
    if (!silent) {
      setLoadingUsers(true);
      setError("");
    }

    try {
      const data = await fetchChatUsers();
      setChatUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      if (!silent) {
        setError(err?.message || "Failed to load chat users.");
      }
    } finally {
      if (!silent) {
        setLoadingUsers(false);
      }
    }
  };

  useEffect(() => {
    loadChatUsers(false);

    const interval = setInterval(() => {
      loadChatUsers(true);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!roomId) return;

    const loadMessages = async () => {
      setLoadingMessages(true);
      setError("");
      try {
        const data = await fetchMessages(roomId);
        setMessages(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err?.message || "Failed to load chat history.");
      } finally {
        setLoadingMessages(false);
      }
    };

    loadMessages();
  }, [roomId]);

  useEffect(() => {
    if (!roomId) return;

    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }

    const backendBaseURL = getChatBackendBaseURL();
    const backendHost = new URL(backendBaseURL).host;
    const protocol = backendBaseURL.startsWith("https://") ? "wss" : "ws";
    const token = localStorage.getItem("access");
    const socketUrl = `${protocol}://${backendHost}/ws/chat/${roomId}/?token=${token}`;

    const socket = new WebSocket(socketUrl);
    socketRef.current = socket;

    setConnecting(true);
    setError("");

    socket.onopen = () => {
      setConnecting(false);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const senderId = String(data.sender_id || "");
        const incomingSenderName = String(data.sender_name || "").trim().toLowerCase();
        
        const localLabel = String(currentUserLabel || "").trim().toLowerCase();
        const localEmail = String(currentUserEmail || "").trim().toLowerCase();

        // Comprehensive match logic (Checks ID, Name, Emails, and substrings like username matching email)
        const isFromMe = 
          (currentUserId && senderId === currentUserId) || 
          (localLabel && incomingSenderName === localLabel) || 
          (localEmail && incomingSenderName === localEmail) ||
          (localLabel && incomingSenderName.includes(localLabel)) ||
          (localEmail && incomingSenderName.includes(localEmail));

        // Background handler for unread badges from other channels
        if (!isFromMe && activeUserRef.current?.id !== senderId) {
          setChatUsers((prev) =>
            prev.map((item) => {
              if (String(item.id) === senderId) {
                return {
                  ...item,
                  unread_count: Number(item.unread_count || 0) + 1,
                };
              }
              return item;
            }),
          );
        }

        setMessages((prev) => {
          // ===================================
          // THE BROADCAST CAME FROM YOU
          // ===================================
          if (isFromMe) {
            const updated = [...prev];
            // Locate local preview wrapper by text contents matching the WebSocket broadcast string
            const pendingIndex = updated.findIndex(
              (msg) => msg.pending === true && msg.content === data.message
            );

            // Successfully switch out the optimistic preview with official values
            if (pendingIndex !== -1) {
              updated[pendingIndex] = {
                ...updated[pendingIndex],
                id: data.message_id || updated[pendingIndex].id,
                sender_name: data.sender_name || updated[pendingIndex].sender_name,
                pending: false,
                created_at: data.created_at,
              };
              return updated;
            }
            
            // Safety filter bypass guard: avoid inserting duplicates if processing delays happen
            const alreadyAdded = updated.some(msg => msg.id === data.message_id);
            if (alreadyAdded) return prev;
          }

          // ===================================
          // THE BROADCAST CAME FROM A TEAMMATE
          // ===================================
          const alreadyExists = prev.some(
            (msg) =>
              msg.content === data.message &&
              msg.created_at === data.created_at
          );

          if (alreadyExists) {
            return prev;
          }

          return [
            ...prev,
            {
              id: data.message_id || `${Date.now()}-${Math.random()}`,
              content: data.message,
              sender: Number(senderId) || senderId,
              sender_name: data.sender_name || "User",
              created_at: data.created_at,
              pending: false,
            },
          ];
        });
      } catch (err) {
        console.error("Socket incoming stream processing failure:", err);
      }
    };

    socket.onerror = () => {
      setError("Live chat connection failed. Messages can still be loaded.");
      setConnecting(false);
    };

    socket.onclose = () => {
      setConnecting(false);
    };

    return () => {
      socket.close();
    };
  }, [roomId, currentUserId, currentUserLabel, currentUserEmail]);

  const openChatWithUser = async (targetUser) => {
    if (!targetUser?.id) return;
    setLoadingRoom(true);
    setError("");

    try {
      const response = await createOrGetRoom(targetUser.id);
      setRoomId(response.room_id);
      setActiveUser(targetUser);
      setMessages([]);
      setChatUsers((prev) =>
        prev.map((item) =>
          item.id === targetUser.id
            ? {
                ...item,
                unread_count: 0,
              }
            : item
        )
      );
    } catch (err) {
      setError(err?.message || "Failed to open chat.");
    } finally {
      setLoadingRoom(false);
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();

    const trimmed = draft.trim();
    if (
      !trimmed ||
      !socketRef.current ||
      socketRef.current.readyState !== WebSocket.OPEN
    ) {
      return;
    }

    socketRef.current.send(
      JSON.stringify({
        message: trimmed,
        sender_id: user?.id,
      })
    );

    // Push local state placeholder to provide instantaneous right-hand side text bubble feedback
    setMessages((prev) => [
      ...prev,
      {
        id: `local-${Date.now()}-${Math.random()}`,
        content: trimmed,
        sender: Number(user?.id) || user?.id,
        sender_name: currentUserLabel || currentUserEmail || "You",
        created_at: new Date().toISOString(),
        pending: true,
      },
    ]);

    setDraft("");
  };

  const selectedRoomLabel = roomId
    ? `Room ${roomId.slice(0, 8)}`
    : "No room selected";

  const isMyMessage = (message) => {
    // Check ID match
    const senderId = String(message?.sender || message?.sender_id || "");
    if (currentUserId && senderId === currentUserId) return true;

    // Check case-insensitive label matching
    const incomingSenderName = String(message?.sender_name || "").trim().toLowerCase();
    const localLabel = String(currentUserLabel || "").trim().toLowerCase();
    const localEmail = String(currentUserEmail || "").trim().toLowerCase();

    return (
      (localLabel && incomingSenderName === localLabel) ||
      (localEmail && incomingSenderName === localEmail) ||
      (localLabel && incomingSenderName.includes(localLabel)) ||
      (localEmail && incomingSenderName.includes(localEmail))
    );
  };

  // WhatsApp-style human-readable group date formatting engine
  const formatMessageGroupDate = (dateString) => {
    if (!dateString) return "";
    const messageDate = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    today.setHours(0, 0, 0, 0);
    yesterday.setHours(0, 0, 0, 0);
    const compareDate = new Date(messageDate);
    compareDate.setHours(0, 0, 0, 0);

    if (compareDate.getTime() === today.getTime()) {
      return "Today";
    } else if (compareDate.getTime() === yesterday.getTime()) {
      return "Yesterday";
    } else {
      return messageDate.toLocaleDateString([], { month: "long", day: "numeric", year: "numeric" });
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white p-6 md:p-8 font-sans relative overflow-hidden">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[55%] h-[55%] bg-[#FF6B2C]/8 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-18%] right-[-10%] w-[50%] h-[50%] bg-blue-500/8 rounded-full blur-[140px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-8">
        <aside className="rounded-[36px] border border-white/10 bg-white/5 backdrop-blur-xl p-6 md:p-8 shadow-2xl">
          <div className="space-y-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#FF6B2C]/20 bg-[#FF6B2C]/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#FF6B2C]">
              Private Chat
            </span>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              One-to-One{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B2C] to-[#FF8533]">
                Messages
              </span>
            </h1>
            <p className="text-sm text-gray-400 leading-relaxed">
              Pick a teammate from your workspace and open a private direct chat
              instantly.
            </p>
          </div>

          <div className="mt-8 space-y-4">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">
              Search Teammates
            </label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, role, or ID"
              className="w-full rounded-2xl border border-white/10 bg-[#0A0A0F]/70 px-5 py-4 text-sm font-bold text-white outline-none transition-all focus:border-[#FF6B2C]/40"
            />
          </div>

          <div className="mt-6 rounded-[28px] border border-white/10 bg-[#0A0A0F]/60 p-4">
            <div className="flex items-center justify-between px-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                Team Members
              </p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600">
                {loadingUsers ? "Loading..." : `${filteredUsers.length} found`}
              </p>
            </div>

            <div className="mt-4 max-h-[320px] overflow-y-auto space-y-2 pr-1">
              {loadingUsers ? (
                <div className="py-10 text-center text-[#FF6B2C] font-bold tracking-widest uppercase animate-pulse">
                  Loading users...
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="py-10 text-center text-gray-500 text-sm">
                  No teammates found.
                </div>
              ) : (
                filteredUsers.map((item) => {
                  const isActive = activeUser?.id === item.id;
                  const unreadCount = Number(item.unread_count || 0);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => openChatWithUser(item)}
                      disabled={loadingRoom}
                      className={`w-full rounded-2xl border px-4 py-3 text-left transition-all ${
                        isActive
                          ? "border-[#FF6B2C]/40 bg-[#FF6B2C]/10"
                          : "border-white/10 bg-white/5 hover:border-[#FF6B2C]/25 hover:bg-white/10"
                      } disabled:opacity-60`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-white">
                            {item.full_name || "Unnamed User"}
                          </p>
                          <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-gray-500">
                            {item.role || "Member"} • ID{" "}
                            {String(item.id).slice(0, 8)}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-[#FF6B2C]">
                            Chat
                          </span>
                          {unreadCount > 0 && (
                            <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-black text-white shadow-lg shadow-red-500/30">
                              {unreadCount > 99 ? "99+" : unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-8 rounded-[28px] border border-white/10 bg-[#0A0A0F]/60 p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
              Current Room
            </p>
            <p className="mt-2 text-sm font-bold text-white">
              {selectedRoomLabel}
            </p>
            <p className="mt-1 text-[10px] uppercase tracking-widest text-gray-600">
              {connecting ? "Connecting..." : roomId ? "Live" : "Idle"}
            </p>
          </div>

          {error && (
            <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}
        </aside>

        <section className="rounded-[36px] border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col min-h-[70vh]">
          <div className="border-b border-white/10 px-6 md:px-8 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-500">
                Conversation
              </p>
              <h2 className="text-2xl font-bold tracking-tight mt-1">
                {activeUser ? activeUser.full_name : selectedRoomLabel}
              </h2>
            </div>
            <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-gray-500">
              {user?.name || user?.email}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-4 bg-[#0A0A0F]/40">
            {!roomId ? (
              <div className="h-full min-h-[40vh] flex items-center justify-center rounded-[28px] border border-dashed border-white/10 bg-white/5 text-center px-8">
                <div className="max-w-md space-y-3">
                  <h3 className="text-xl font-bold">
                    Start a direct conversation
                  </h3>
                  <p className="text-sm text-gray-400">
                    Choose a teammate from the left panel to open a private 1:1
                    room.
                  </p>
                </div>
              </div>
            ) : loadingMessages ? (
              <div className="py-20 text-center text-[#FF6B2C] font-bold tracking-widest uppercase animate-pulse">
                Loading messages...
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full min-h-[40vh] flex items-center justify-center rounded-[28px] border border-dashed border-white/10 bg-white/5 text-center px-8">
                <div className="max-w-md space-y-3">
                  <h3 className="text-xl font-bold">No messages yet</h3>
                  <p className="text-sm text-gray-400">
                    Say hello and the conversation will appear here.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {(() => {
                  let lastDateHeader = "";

                  return messages.map((message, index) => {
                    const isMine = isMyMessage(message);
                    
                    // Evaluate group divider criteria
                    const currentGroupDate = formatMessageGroupDate(message.created_at);
                    let showDateHeader = false;

                    if (currentGroupDate && currentGroupDate !== lastDateHeader) {
                      showDateHeader = true;
                      lastDateHeader = currentGroupDate;
                    }

                    return (
                      <div key={message.id || index} className="space-y-4">
                        {/* WhatsApp-style Sticky Center Separator */}
                        {showDateHeader && (
                          <div className="flex justify-center my-6">
                            <span className="bg-white/5 border border-white/10 text-gray-400 text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full backdrop-blur-md shadow-lg">
                              {currentGroupDate}
                            </span>
                          </div>
                        )}

                        <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`max-w-[85%] md:max-w-[70%] rounded-[28px] px-5 py-4 border ${
                              isMine
                                ? "bg-gradient-to-r from-[#FF6B2C] to-[#FF8533] border-[#FF6B2C]/30 text-white"
                                : "bg-white/5 border-white/10 text-gray-200"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-4 mb-2">
                              <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">
                                {message.sender_name || (isMine ? "You" : "Member")}
                              </span>
                              <span className="text-[10px] uppercase tracking-widest opacity-60">
                                {message.created_at
                                  ? new Date(message.created_at).toLocaleTimeString(
                                      [],
                                      { hour: "2-digit", minute: "2-digit" }
                                    )
                                  : ""}
                              </span>
                            </div>
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">
                              {message.content || message.message}
                            </p>
                            {message.pending && isMine && (
                              <div className="mt-2 text-right text-[9px] font-bold uppercase tracking-[0.25em] opacity-70">
                                sending...
                              </div>
                            )}
                            {isMine && !message.pending && (
                              <div className="mt-2 text-right text-[9px] font-bold uppercase tracking-[0.25em] opacity-70">
                                ✓✓
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
                <div ref={endRef} />
              </div>
            )}
          </div>

          <form
            onSubmit={sendMessage}
            className="border-t border-white/10 p-4 md:p-6 bg-[#0A0A0F]/70"
          >
            <div className="flex flex-col md:flex-row gap-3">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={
                  roomId ? "Type a message..." : "Select a teammate first"
                }
                disabled={!roomId}
                rows={3}
                className="flex-1 resize-none rounded-[24px] border border-white/10 bg-white/5 px-5 py-4 text-sm text-white outline-none transition-all focus:border-[#FF6B2C]/40 disabled:cursor-not-allowed disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={!roomId || !draft.trim()}
                className="rounded-[24px] bg-[#FF6B2C] px-6 py-4 text-xs font-bold uppercase tracking-widest text-white transition-all hover:bg-[#FF8533] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Send
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
};

export default ChatPage;