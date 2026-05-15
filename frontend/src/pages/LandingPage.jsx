import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const LandingPage = () => {
  const { isAuthenticated, user, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect authenticated users to their dashboards
  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      if (user.role === "SUPERADMIN") navigate("/platform-admin");
      else if (user.role === "ADMIN") navigate("/company-dashboard");
      else if (user.role === "PROJECT_MANAGER")
        navigate("/project-manager-dashboard");
      else if (user.role === "EMPLOYEE") navigate("/employee-dashboard");
    }
  }, [isAuthenticated, user, loading, navigate]);

  // Smooth scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // State for meeting scheduler modal
  const [showScheduler, setShowScheduler] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [meetingTitle, setMeetingTitle] = useState("");

  const handleScheduleMeeting = (e) => {
    e.preventDefault();
    alert(
      `Meeting "${meetingTitle}" scheduled for ${selectedDate} at ${selectedTime}`,
    );
    setShowScheduler(false);
    setMeetingTitle("");
    setSelectedDate("");
    setSelectedTime("");
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white font-sans overflow-x-hidden selection:bg-[#FF6B2C] selection:text-white">
      {/* Dark theme background glows */}
      <div className="fixed top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#FF6B2C]/5 rounded-full blur-[150px] pointer-events-none"></div>
      <div className="fixed bottom-[-15%] right-[-5%] w-[45%] h-[45%] bg-[#FF6B2C]/5 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="fixed top-[30%] right-[20%] w-80 h-80 bg-[#FF6B2C]/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* --- NAVBAR --- */}
      <nav className="relative z-50 flex items-center justify-between px-6 md:px-12 py-5 max-w-7xl mx-auto border-b border-white/5 bg-[#0A0A0F]/80 backdrop-blur-xl sticky top-0">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 bg-gradient-to-br from-[#FF6B2C] to-[#FF8533] rounded-xl flex items-center justify-center shadow-lg shadow-[#FF6B2C]/20">
            <span className="text-white text-xl font-bold">B</span>
          </div>
          <span className="text-2xl font-bold tracking-tighter bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
            Binford
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-300">
          <a href="#home" className="hover:text-[#FF6B2C] transition-colors">
            Home
          </a>
          <a
            href="#features"
            className="hover:text-[#FF6B2C] transition-colors"
          >
            Features
          </a>
          <a
            href="#services"
            className="hover:text-[#FF6B2C] transition-colors"
          >
            Services
          </a>
          <a href="#team" className="hover:text-[#FF6B2C] transition-colors">
            Team
          </a>
          <a href="#contact" className="hover:text-[#FF6B2C] transition-colors">
            Contact
          </a>
        </div>

        <div className="flex items-center gap-4">
          <Link
            to="/login"
            className="text-sm font-semibold text-gray-300 hover:text-white transition px-3 py-2 rounded-full"
          >
            Log In
          </Link>
          <Link
            to="/signup"
            className="bg-gradient-to-r from-[#FF6B2C] to-[#FF8533] text-white text-sm font-semibold px-6 py-2.5 rounded-full shadow-lg shadow-[#FF6B2C]/25 hover:shadow-xl transition-all active:scale-95"
          >
            Sign Up
          </Link>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section
        id="home"
        className="relative pt-20 pb-28 px-6 md:px-12 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-14 lg:gap-20 z-10"
      >
        <div className="flex-1 space-y-6">
          <span className="inline-flex items-center gap-2 text-[#FF6B2C] bg-[#FF6B2C]/10 text-[11px] font-semibold uppercase tracking-wider px-4 py-1.5 rounded-full border border-[#FF6B2C]/20 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B2C]"></span>
            Project Management • Analytics • Multi-Tenant • Security
          </span>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter leading-[1.1]">
            Manage Your{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B2C] to-[#FF8533]">
              Business Empire
            </span>
          </h1>
          <p className="text-lg text-gray-400 max-w-lg leading-relaxed font-medium">
            Streamline your company operations with our advanced AI-poweredmulti-tenant business management platform. Manage employees,projects, tasks, finances, and client workflows in one secure and
            scalable system. Monitor performance, automate processes insights to grow your business with confidence.
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <button
              onClick={() => setShowScheduler(true)}
              className="inline-flex items-center bg-gradient-to-r from-[#FF6B2C] to-[#FF8533] text-white font-semibold px-7 py-3.5 rounded-xl hover:shadow-lg hover:shadow-[#FF6B2C]/25 transition-all"
            >
              Schedule Meeting →
            </button>
            <button className="inline-flex items-center border border-white/20 bg-white/5 text-white font-medium px-7 py-3.5 rounded-xl hover:bg-white/10 transition-all">
              Learn More
            </button>
          </div>
          <div className="flex items-center gap-8 pt-4">
            <div className="flex -space-x-2">
              <img
                className="w-8 h-8 rounded-full ring-2 ring-[#0A0A0F] object-cover"
                src="https://randomuser.me/api/portraits/women/68.jpg"
                alt="user"
              />
              <img
                className="w-8 h-8 rounded-full ring-2 ring-[#0A0A0F] object-cover"
                src="https://randomuser.me/api/portraits/men/32.jpg"
                alt="user"
              />
              <img
                className="w-8 h-8 rounded-full ring-2 ring-[#0A0A0F] object-cover"
                src="https://randomuser.me/api/portraits/women/44.jpg"
                alt="user"
              />
            </div>
            <span className="font-medium text-gray-400">
              Trusted by 10,000+ teams
            </span>
          </div>
        </div>

        <div className="flex-1 relative">
          <div className="absolute -inset-4 bg-gradient-to-tr from-[#FF6B2C]/20 to-[#FF8533]/10 rounded-3xl blur-3xl animate-pulse"></div>
          <div className="relative bg-white/5 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/10 p-2 overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1551434678-e076c2236a9a?q=80&w=2070&auto=format&fit=crop"
              alt="Team collaboration"
              className="w-full h-auto rounded-2xl object-cover hover:scale-[1.02] transition duration-700"
              onError={(e) => {
                e.target.src =
                  "https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?q=80&w=800&auto=format&fit=crop";
              }}
            />
          </div>
        </div>
      </section>

      {/* --- PARTNER LOGOS STRIP --- */}
      <div className="border-y border-white/5 bg-white/[0.02] py-8 relative z-10">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-5 gap-8 text-center">
          <PartnerLogo name="Jerde Group" />
          <PartnerLogo name="Collier LLC" />
          <PartnerLogo name="Walker Inc" />
          <PartnerLogo name="Hudson Inc" />
          <PartnerLogo name="Binford Ltd" />
        </div>
      </div>

      {/* --- KEY FEATURES SECTION --- */}
      <section
        id="features"
        className="py-28 px-6 max-w-7xl mx-auto relative z-10"
      >
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-[#FF6B2C] text-sm font-semibold uppercase tracking-wider bg-[#FF6B2C]/10 px-4 py-1 rounded-full">
            Key Features
          </span>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tighter text-white mt-5">
            Powerful Tools for Modern Management
          </h2>
          <p className="text-gray-400 text-lg mt-4">
            Discover a comprehensive suite of tools designed to optimize your
            project lifecycle and mitigate operational risks.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard
            icon="📅"
            title="Meeting Scheduler"
            description="Seamless calendar integration with automated reminders and conflict detection for efficient team coordination."
            action="Schedule"
            onAction={() => setShowScheduler(true)}
          />
          <FeatureCard
            icon="📊"
            title="Project Management"
            description="Track milestones, assign tasks, monitor progress with real-time dashboards and analytics."
            action="Track Projects"
          />
          <FeatureCard
            icon="🤝"
            title="Team Collaboration"
            description="Built-in chat, file sharing, and collaborative workspaces for seamless communication."
            action="Collaborate"
          />
        </div>
      </section>

      {/* --- NFT / PLATFORM AGGREGATOR SECTION --- */}
      <section className="py-24 px-6 max-w-7xl mx-auto relative z-10">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tighter">
              Comprehensive Oversight. Manage every project from one portal.
            </h2>
            <p className="text-gray-400 text-lg">
              Centralized risk monitoring and resource allocation — All your
              tenant data unified in one powerful interface.
            </p>
            <div className="flex gap-4 pt-4">
              <button className="bg-gradient-to-r from-[#FF6B2C] to-[#FF8533] px-8 py-3 rounded-full text-sm font-semibold">
                Buy
              </button>
              <button className="border border-white/20 px-8 py-3 rounded-full text-sm font-semibold hover:bg-white/5 transition">
                Send
              </button>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-[#FF6B2C]/20 to-transparent rounded-3xl blur-2xl"></div>
            <div className="relative bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white/5 text-center">
                  <span className="text-3xl block mb-2">🛡️</span>
                  <p className="text-sm font-medium">Risk Shield</p>
                </div>
                <div className="p-4 rounded-xl bg-white/5 text-center">
                  <span className="text-3xl block mb-2">📈</span>
                  <p className="text-sm font-medium">Growth Analytics</p>
                </div>
                <div className="p-4 rounded-xl bg-white/5 text-center">
                  <span className="text-3xl block mb-2">🏗️</span>
                  <p className="text-sm font-medium">Site Monitor</p>
                </div>
                <div className="p-4 rounded-xl bg-white/5 text-center">
                  <span className="text-3xl block mb-2">📋</span>
                  <p className="text-sm font-medium">Audit Logs</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- PROJECT MANAGEMENT DASHBOARD PREVIEW --- */}
      <section className="py-24 px-6 max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold tracking-tighter">
            Project Management Dashboard
          </h2>
          <p className="text-gray-400 mt-3">
            Real-time insights into your team's progress
          </p>
        </div>
        <div className="bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 overflow-hidden">
          <div className="p-6 border-b border-white/10 flex justify-between items-center">
            <div className="flex gap-4">
              <span className="text-sm font-medium text-[#FF6B2C]">
                All Projects
              </span>
              <span className="text-sm text-gray-400">In Progress</span>
              <span className="text-sm text-gray-400">Completed</span>
            </div>
            <button className="text-sm bg-[#FF6B2C]/20 text-[#FF6B2C] px-4 py-1.5 rounded-full">
              + New Project
            </button>
          </div>
          <div className="p-6">
            <ProjectRow
              project="NFT Marketplace Launch"
              progress={75}
              team="8 members"
              deadline="Dec 15, 2024"
            />
            <ProjectRow
              project="Mobile App Redesign"
              progress={45}
              team="5 members"
              deadline="Jan 10, 2025"
            />
            <ProjectRow
              project="Smart Contract Audit"
              progress={90}
              team="3 members"
              deadline="Nov 30, 2024"
            />
            <ProjectRow
              project="Community Dashboard"
              progress={30}
              team="6 members"
              deadline="Feb 1, 2025"
            />
          </div>
        </div>
      </section>

      {/* --- TEAM SECTION --- */}
      <section
        id="team"
        className="py-28 bg-white/[0.02] border-y border-white/5 relative z-10"
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold tracking-tighter">
              Meet Our Team
            </h2>
            <p className="text-gray-400 text-lg mt-2">
              Our expert team is dedicated to providing the best solutions for
              your business needs.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <TeamCard
              name="Robert Fox"
              role="Chief Technology Officer"
              img="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=400&auto=format&fit=crop"
            />
            <TeamCard
              name="Jenny Wilson"
              role="Senior Project Manager"
              img="https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400&auto=format&fit=crop"
            />
            <TeamCard
              name="Guy Hawkins"
              role="Lead Risk Analyst"
              img="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop"
            />
          </div>
          <div className="text-center mt-12">
            <button className="border border-white/20 bg-white/5 text-white hover:bg-white/10 px-8 py-2.5 rounded-full text-sm font-medium transition">
              View All Members
            </button>
          </div>
        </div>
      </section>

      {/* --- CALL TO ACTION --- */}
      <section className="py-28 px-6 max-w-5xl mx-auto text-center relative z-10">
        <div className="bg-gradient-to-r from-[#FF6B2C]/10 to-[#FF8533]/10 backdrop-blur-md rounded-3xl p-12 md:p-16 border border-white/10">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tighter">
            Join Our Platform To Scale Safely.
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto mt-4">
            Take the first step towards a more secure and efficient project
            management experience. Register now and start managing your risks
            like a pro.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mt-8">
            <button className="bg-white text-black font-semibold px-8 py-3 rounded-xl hover:bg-gray-100 transition flex items-center gap-2">
               Download on the App Store
            </button>
            <button className="bg-white text-black font-semibold px-8 py-3 rounded-xl hover:bg-gray-100 transition flex items-center gap-2">
               Get it on Google Play
            </button>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="border-t border-white/5 pt-16 pb-8 relative z-10">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-gradient-to-br from-[#FF6B2C] to-[#FF8533] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">B</span>
              </div>
              <span className="text-xl font-bold">Binford Ltd.</span>
            </div>
            <p className="text-gray-500 text-sm mt-4">Follow us</p>
            <div className="flex gap-4 mt-3">
              <span className="text-gray-400 hover:text-[#FF6B2C] cursor-pointer text-sm">
                Facebook
              </span>
              <span className="text-gray-400 hover:text-[#FF6B2C] cursor-pointer text-sm">
                Twitter
              </span>
              <span className="text-gray-400 hover:text-[#FF6B2C] cursor-pointer text-sm">
                LinkedIn
              </span>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
              Product
            </h4>
            <ul className="mt-4 space-y-2 text-gray-500 text-sm">
              <li>
                <a href="#" className="hover:text-[#FF6B2C] transition">
                  Features
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#FF6B2C] transition">
                  Pricing
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#FF6B2C] transition">
                  Security
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
              Company
            </h4>
            <ul className="mt-4 space-y-2 text-gray-500 text-sm">
              <li>
                <a href="#" className="hover:text-[#FF6B2C] transition">
                  About
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#FF6B2C] transition">
                  Careers
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#FF6B2C] transition">
                  Press
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
              Legal
            </h4>
            <ul className="mt-4 space-y-2 text-gray-500 text-sm">
              <li>
                <a href="#" className="hover:text-[#FF6B2C] transition">
                  Privacy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#FF6B2C] transition">
                  Terms
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#FF6B2C] transition">
                  Cookie Policy
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="text-center text-gray-600 text-xs border-t border-white/5 mt-14 pt-8">
          © 2024 Binford Ltd. All rights reserved.
        </div>
      </footer>

      {/* --- MEETING SCHEDULER MODAL --- */}
      {showScheduler && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowScheduler(false)}
          ></div>
          <div className="relative bg-[#0A0A0F] border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <button
              onClick={() => setShowScheduler(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl"
            >
              ×
            </button>
            <h3 className="text-2xl font-bold mb-6">Schedule a Meeting</h3>
            <form onSubmit={handleScheduleMeeting} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Meeting Title
                </label>
                <input
                  type="text"
                  value={meetingTitle}
                  onChange={(e) => setMeetingTitle(e.target.value)}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[#FF6B2C] text-white"
                  placeholder="Project Kickoff"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[#FF6B2C] text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Time
                </label>
                <input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[#FF6B2C] text-white"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-[#FF6B2C] to-[#FF8533] text-white font-semibold py-3 rounded-xl hover:shadow-lg transition"
              >
                Schedule Meeting
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Sub-components ---
const PartnerLogo = ({ name }) => (
  <div className="text-gray-500 font-semibold text-sm tracking-wider hover:text-[#FF6B2C] transition">
    {name}
  </div>
);

const FeatureCard = ({ icon, title, description, action, onAction }) => (
  <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-[#FF6B2C]/30 hover:-translate-y-1 transition-all duration-300">
    <div className="text-4xl mb-4">{icon}</div>
    <h3 className="text-xl font-bold mb-2">{title}</h3>
    <p className="text-gray-400 text-sm leading-relaxed mb-4">{description}</p>
    {onAction && (
      <button
        onClick={onAction}
        className="text-[#FF6B2C] text-sm font-semibold hover:underline"
      >
        {action} →
      </button>
    )}
  </div>
);

const ProjectRow = ({ project, progress, team, deadline }) => (
  <div className="flex flex-col md:flex-row justify-between items-start md:items-center py-4 border-b border-white/5 last:border-0">
    <div className="flex-1">
      <h4 className="font-semibold">{project}</h4>
      <div className="flex gap-4 text-xs text-gray-500 mt-1">
        <span>{team}</span>
        <span>Due: {deadline}</span>
      </div>
    </div>
    <div className="flex items-center gap-4 mt-2 md:mt-0">
      <div className="w-32 bg-white/10 rounded-full h-2">
        <div
          className="bg-gradient-to-r from-[#FF6B2C] to-[#FF8533] h-2 rounded-full"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <span className="text-sm font-medium text-[#FF6B2C]">{progress}%</span>
    </div>
  </div>
);

const TeamCard = ({ name, role, img }) => (
  <div className="bg-white/5 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10 hover:border-[#FF6B2C]/30 transition-all">
    <div className="h-64 overflow-hidden">
      <img
        className="w-full h-full object-cover hover:scale-105 transition duration-500"
        src={img}
        alt={name}
      />
    </div>

    <div className="p-6 text-center">
      <h3 className="text-xl font-bold">{name}</h3>
      <p className="text-gray-400 text-sm mt-1">{role}</p>
    </div>
  </div>
);

export default LandingPage;
