import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { 
  Calendar, 
  Clock, 
  Users, 
  Plus, 
  Video, 
  X 
} from "lucide-react";

import {
  createMeeting,
  getMeetings,
  cancelMeeting,
  updateMeeting,
} from "../api/meeting";

import { fetchChatUsers } from "../api/chat";

const MeetingsPage = () => {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    participants: [],
    start_time: "",
    end_time: "",
    meeting_link: "",
  });

  useEffect(() => {
    loadMeetings();
    loadEmployees();
  }, []);

  const loadMeetings = async () => {
    try {
      setLoading(true);
      const data = await getMeetings();
      setMeetings(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load meetings.");
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const data = await fetchChatUsers();
      setEmployees(data.data || data.results || data || []);
    } catch (err) {
      console.error("Employee fetching error:", err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError("");

      if (editingMeeting) {
        await updateMeeting(editingMeeting.id, formData);
      } else {
        await createMeeting(formData);
      }

      setShowModal(false);
      setEditingMeeting(null);
      setFormData({
        title: "",
        description: "",
        participants: [],
        start_time: "",
        end_time: "",
        meeting_link: "",
      });
      await loadMeetings();
    } catch (err) {
      setError(err.message || "Something went wrong saving the meeting.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelMeeting = async (meetingId) => {
    if (!window.confirm("Are you sure you want to cancel this meeting?")) return;
    
    try {
      await cancelMeeting(meetingId);
      // Remove it from the local UI array state immediately
      setMeetings((prev) => prev.filter((m) => m.id !== meetingId));
    } catch (err) {
      alert(err.message || "Failed to cancel meeting.");
    }
  };

  // Filters out any meetings that are already cancelled or canceled
  const activeMeetings = useMemo(() => {
    return meetings.filter((meeting) => {
      const status = (meeting.status || "").toLowerCase();
      return status !== "canceled" && status !== "cancelled";
    });
  }, [meetings]);

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white p-6 md:p-8 font-sans relative overflow-hidden">
      {/* Decorative Neon Background Gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[55%] h-[55%] bg-[#FF6B2C]/8 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-18%] right-[-10%] w-[50%] h-[50%] bg-blue-500/8 rounded-full blur-[140px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* HEADER SECTION */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#FF6B2C]/20 bg-[#FF6B2C]/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#FF6B2C]">
              Sync Board
            </span>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mt-2">
              Team{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B2C] to-[#FF8533]">
                Meetings
              </span>
            </h1>
            <p className="text-sm text-gray-400 leading-relaxed mt-1">
              Organize, update, and enter secure digital rooms inside your custom workspace environment.
            </p>
          </div>

          <button
            onClick={() => {
              setEditingMeeting(null);
              setFormData({
                title: "",
                description: "",
                participants: [],
                start_time: "",
                end_time: "",
                meeting_link: "",
              });
              setShowModal(true);
            }}
            className="self-start sm:self-center flex items-center gap-2 rounded-2xl bg-[#FF6B2C] px-5 py-3.5 text-xs font-bold uppercase tracking-widest text-white transition-all hover:bg-[#FF8533] shadow-lg shadow-[#FF6B2C]/10"
          >
            <Plus size={16} />
            Schedule Meeting
          </button>
        </div>

        {/* MESSAGING ERRORS */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* MAIN EVENTS CONTAINER */}
        {loading ? (
          <div className="py-20 text-center text-[#FF6B2C] font-bold tracking-widest uppercase animate-pulse">
            Loading scheduled events...
          </div>
        ) : activeMeetings.length === 0 ? (
          <div className="rounded-[36px] border border-white/10 bg-white/5 backdrop-blur-xl p-12 text-center max-w-2xl mx-auto shadow-2xl">
            <Calendar className="mx-auto text-[#FF6B2C]/40 mb-4" size={48} />
            <h2 className="text-xl font-bold tracking-tight">No Meetings Present</h2>
            <p className="text-sm text-gray-400 mt-2 max-w-sm mx-auto">
              Your agenda is completely open. Tap the button above to build an interactive video conference room.
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {activeMeetings.map((meeting) => {
              // 1. Extract every possible ID key from your Auth User context
              const isUserTheOrganizer =
  meeting.is_organizer;
              return (
                <div
                  key={meeting.id}
                  className="rounded-[28px] border border-white/10 bg-white/5 backdrop-blur-xl p-6 md:p-8 transition-all hover:border-[#FF6B2C]/30 shadow-xl flex flex-col md:flex-row justify-between gap-6"
                >
                  <div className="space-y-4 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-xl font-bold tracking-tight text-white truncate">
                        {meeting.title}
                      </h2>
                      <span className="inline-flex items-center rounded-full bg-[#FF6B2C]/10 border border-[#FF6B2C]/20 text-[#FF6B2C] px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
                        {meeting.status || "Scheduled"}
                      </span>
                      {isUserTheOrganizer && (
                        <span className="inline-flex items-center rounded-full bg-blue-500/10 border border-blue-500/20 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-blue-400">
                          Organizer
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-gray-400 leading-relaxed max-w-3xl whitespace-pre-wrap">
                      {meeting.description || "No description provided for this session."}
                    </p>

                    <div className="flex flex-wrap gap-5 text-gray-300 text-xs font-medium pt-2">
                      <div className="flex items-center gap-2 rounded-xl bg-[#0A0A0F]/50 border border-white/5 px-3 py-2">
                        <Calendar size={14} className="text-[#FF6B2C]" />
                        <span>
                          {new Date(meeting.start_time).toLocaleDateString([], { 
                            weekday: 'short', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 rounded-xl bg-[#0A0A0F]/50 border border-white/5 px-3 py-2">
                        <Clock size={14} className="text-[#FF6B2C]" />
                        <span>
                          {new Date(meeting.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(meeting.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 rounded-xl bg-[#0A0A0F]/50 border border-white/5 px-3 py-2">
                        <Users size={14} className="text-[#FF6B2C]" />
                        <span>{meeting.participants?.length || 0} Participants</span>
                      </div>
                    </div>
                  </div>

                  {/* ROOM CONTROLS PANEL */}
                  <div className="flex items-center md:flex-col justify-end gap-3 md:min-w-[160px] border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 md:pl-6">
                    {meeting.meeting_link && (
                      <a
                        href={meeting.meeting_link}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full text-center inline-flex items-center justify-center gap-2 rounded-xl bg-white/5 border border-white/10 hover:border-[#FF6B2C]/40 px-4 py-3 text-xs font-bold uppercase tracking-widest transition-all text-white"
                      >
                        <Video size={14} className="text-[#FF6B2C]" />
                        Join Room
                      </a>
                    )}

                    {/* Action buttons reveal themselves when user is verified as the creator */}
                    {isUserTheOrganizer && (
                      <div className="flex w-full gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({
                              title: meeting.title || "",
                              description: meeting.description || "",
                              participants: meeting.participants?.map((p) => p.id || p) || [],
                              start_time: meeting.start_time?.slice(0, 16) || "",
                              end_time: meeting.end_time?.slice(0, 16) || "",
                              meeting_link: meeting.meeting_link || "",
                            });
                            setEditingMeeting(meeting);
                            setShowModal(true);
                          }}
                          className="flex-1 text-center rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-all text-white"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCancelMeeting(meeting.id)}
                          className="flex-1 text-center rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SYNC SCHEDULER MANAGEMENT MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-[#0A0A0F]/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-2xl rounded-[32px] border border-white/10 bg-[#0A0A0F] p-6 md:p-8 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold tracking-tight">
                {editingMeeting ? "Modify Meeting" : "Create Sync Room"}
              </h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-xl border border-white/10 bg-white/5 p-2 text-gray-400 hover:text-white transition-all"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">
                  Topic Title
                </label>
                <input
                  type="text"
                  name="title"
                  placeholder="e.g., Core API Architecture Check"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="w-full rounded-2xl border border-white/10 bg-[#0A0A0F]/70 px-5 py-4 text-sm text-white outline-none transition-all focus:border-[#FF6B2C]/40"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">
                  Agenda Context
                </label>
                <textarea
                  name="description"
                  placeholder="Outline key targets or preparation documentation notes..."
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full rounded-2xl border border-white/10 bg-[#0A0A0F]/70 px-5 py-4 text-sm text-white outline-none transition-all focus:border-[#FF6B2C]/40 resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">
                  Invite Members
                </label>
                <select
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    if (selectedId && !formData.participants.includes(selectedId)) {
                      setFormData((prev) => ({
                        ...prev,
                        participants: [...prev.participants, selectedId],
                      }));
                    }
                    e.target.value = ""; 
                  }}
                  className="w-full rounded-2xl border border-white/10 bg-[#0A0A0F]/70 px-5 py-4 text-sm text-gray-400 outline-none transition-all focus:border-[#FF6B2C]/40"
                >
                  <option value="">Choose an active workspace member...</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.full_name || employee.email}
                    </option>
                  ))}
                </select>

                <div className="flex flex-wrap gap-2 mt-3">
                  {employees
                    .filter((emp) => formData.participants.includes(emp.id))
                    .map((employee) => (
                      <div
                        key={employee.id}
                        className="flex items-center gap-2 border border-[#FF6B2C]/20 bg-[#FF6B2C]/5 text-[#FF6B2C] px-3 py-1.5 rounded-xl text-xs font-bold"
                      >
                        <span>{employee.full_name || employee.email}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              participants: prev.participants.filter((id) => id !== employee.id),
                            }));
                          }}
                          className="hover:text-white transition-all text-[10px] font-black"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">
                    Start Window
                  </label>
                  <input
                    type="datetime-local"
                    name="start_time"
                    value={formData.start_time}
                    onChange={handleChange}
                    required
                    className="w-full rounded-2xl border border-white/10 bg-[#0A0A0F]/70 px-5 py-4 text-sm text-white outline-none transition-all focus:border-[#FF6B2C]/40"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">
                    Closing Window
                  </label>
                  <input
                    type="datetime-local"
                    name="end_time"
                    value={formData.end_time}
                    onChange={handleChange}
                    required
                    className="w-full rounded-2xl border border-white/10 bg-[#0A0A0F]/70 px-5 py-4 text-sm text-white outline-none transition-all focus:border-[#FF6B2C]/40"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">
                  Virtual Connection Link (URL)
                </label>
                <input
                  type="url"
                  name="meeting_link"
                  placeholder="https://meet.google.com/abc-defg-hij"
                  value={formData.meeting_link}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-white/10 bg-[#0A0A0F]/70 px-5 py-4 text-sm text-white outline-none transition-all focus:border-[#FF6B2C]/40"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-4 rounded-2xl bg-[#FF6B2C] px-6 py-4 text-xs font-bold uppercase tracking-widest text-white transition-all hover:bg-[#FF8533] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting
                  ? editingMeeting ? "Committing Updates..." : "Configuring Room..."
                  : editingMeeting ? "Update Session Parameters" : "Finalize Event Space"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingsPage;