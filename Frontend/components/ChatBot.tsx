"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, ChevronRight, GraduationCap, BookOpen, BarChart2, Target, Globe, AlignLeft } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import SUGGESTION_POOL from "../data/suggestions.json";

// Pick `n` random items from an array (no repeats)
function pickRandom(arr: string[], n: number): string[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

// â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface Message {
  id: number;
  text: string;
  isBot: boolean;
  followUps?: string[];
  toolsUsed?: string[];
  counsellingPrompt?: boolean;
}

interface HistoryTurn {
  role: "user" | "assistant";
  content: string;
}

// â”€â”€ Constants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const API_URL = "http://localhost:8000/chat";

// Category cards shown on the home screen
const CATEGORIES = [
  {
    id: "colleges",
    label: "Colleges",
    icon: GraduationCap,
    subtitle: "Ask your query related to admissions, fees, placements, cutoffs etc",
    tabs: ["All", "Admissions", "Fees", "Facility", "Placements"],
    questions: {
      All: [
        "How can I get admission to VIPS College?",
        "How much is the fee at Amity University Greater Noida?",
        "What are the hostel facilities like at Christ University Bangalore?",
        "Which companies visited IIM Ahmedabad for placements?",
      ],
      Admissions: [
        "How can I get admission to VIT Vellore?",
        "What is the cutoff for NIT Trichy CSE branch?",
        "How to apply at BITS Pilani?",
        "What documents are needed for IIT Delhi admission?",
      ],
      Fees: [
        "What is the total BTech fee at Manipal University?",
        "Fee structure of SRM University Chennai?",
        "Annual fee at LPU Punjab for CSE?",
        "How much is the MBA fee at IIM Bangalore?",
      ],
      Facility: [
        "What are the hostel facilities at IIT Delhi?",
        "Does Amity University have sports facilities?",
        "Library and labs at KIIT University?",
        "What campus facilities does VIT Vellore offer?",
      ],
      Placements: [
        "Which companies visited IIT Bombay for placements?",
        "What is the average package at VIT Vellore?",
        "Placement stats of Chandigarh University?",
        "Top recruiters at BITS Pilani?",
      ],
    },
  },
  {
    id: "exams",
    label: "Exams",
    icon: BookOpen,
    subtitle: "Get details on entrance exam dates, syllabus, eligibility and more",
    tabs: ["All", "Dates", "Syllabus", "Eligibility"],
    questions: {
      All: [
        "What is the JEE Main 2026 exam date?",
        "How to apply for MHT CET 2026?",
        "What is the NEET 2026 syllabus?",
        "What is the CLAT 2026 exam pattern?",
      ],
      Dates: [
        "When is JEE Advanced 2026?",
        "What are the GATE 2026 exam dates?",
        "When does NEET 2026 registration open?",
        "CLAT 2026 application deadline?",
      ],
      Syllabus: [
        "What is the JEE Main Mathematics syllabus?",
        "NEET 2026 Biology chapter list?",
        "GATE CSE 2026 syllabus?",
        "MHT CET Physics topics?",
      ],
      Eligibility: [
        "Who is eligible for JEE Advanced?",
        "What is the age limit for NEET?",
        "Eligibility for GATE 2026?",
        "Can PCM students apply for CLAT?",
      ],
    },
  },
  {
    id: "compare",
    label: "Compare",
    icon: BarChart2,
    subtitle: "Compare colleges on fees, rankings, placements and facilities",
    tabs: ["All", "IITs", "NITs", "Private"],
    questions: {
      All: [
        "Compare IIT Bombay vs IIT Delhi",
        "VIT Vellore vs Manipal University for CSE?",
        "BITS Pilani vs NIT Trichy — which is better?",
        "IIM Bangalore vs IIM Calcutta for MBA?",
      ],
      IITs: [
        "IIT Bombay vs IIT Madras — fees and placements?",
        "IIT Delhi vs IIT Kharagpur for ECE?",
        "Best IIT for Computer Science?",
        "IIT Roorkee vs IIT Guwahati?",
      ],
      NITs: [
        "NIT Trichy vs NIT Surathkal?",
        "Best NIT for Mechanical Engineering?",
        "NIT Warangal vs NIT Calicut placements?",
        "Which NIT has the highest package?",
      ],
      Private: [
        "VIT vs SRM for BTech CSE?",
        "Amity University vs LPU fees and placements?",
        "Manipal vs KIIT — which is better?",
        "Chandigarh University vs Thapar University?",
      ],
    },
  },
  {
    id: "predictor",
    label: "Predictor",
    icon: Target,
    subtitle: "Find colleges matching your JEE / NEET / MHT CET rank or percentile",
    tabs: ["All", "JEE Main", "NEET", "MHT CET"],
    questions: {
      All: [
        "Which colleges can I get with 70 percentile in JEE Main?",
        "Best BTech colleges for 90 percentile in MHT CET?",
        "What colleges are available for 500 marks in NEET?",
        "Cutoffs for top NITs in JEE Main 2025?",
      ],
      "JEE Main": [
        "Which NITs accept 80 percentile in JEE Main?",
        "JEE Main cutoff for IIITs?",
        "Colleges for OBC students with 70 percentile?",
        "What rank do I need for NIT Trichy CSE?",
      ],
      NEET: [
        "Medical colleges for 400 marks in NEET?",
        "Top private medical colleges cutoff NEET 2025?",
        "AIIMS cutoff 2025?",
        "BDS colleges for 350 marks in NEET?",
      ],
      "MHT CET": [
        "Best colleges in Mumbai for 85 percentile MHT CET?",
        "COEP Pune cutoff in MHT CET?",
        "Which Pune colleges accept 70 percentile?",
        "Top Nagpur BTech colleges MHT CET cutoff?",
      ],
    },
  },
] as const;

// "Get Free Counselling" is always shown; the rest rotate from the pool

// â”€â”€ Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [history, setHistory] = useState<HistoryTurn[]>([]);

  // Home screen state
  const [activeCategoryIdx, setActiveCategoryIdx] = useState(0);
  const [activeTab, setActiveTab] = useState("All");

  // Counselling form state (one form per session, replaces last counselling message)
  const [counsellingName, setCounsellingName] = useState("");
  const [counsellingPhone, setCounsellingPhone] = useState("");
  const [counsellingEmail, setCounsellingEmail] = useState("");
  const [counsellingSubmitted, setCounsellingSubmitted] = useState(false);

  // Response mode + web search toggles
  const [mode, setMode] = useState<"concise" | "detailed">("detailed");
  const [webSearch, setWebSearch] = useState(false);

  // Dynamic interest pills — reshuffled every time the chat is opened
  const [dynamicPills, setDynamicPills] = useState<string[]>(() =>
    pickRandom(SUGGESTION_POOL as string[], 4)
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasChatStarted = messages.length > 0;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Reset tab when switching category
  const handleCategoryChange = (idx: number) => {
    setActiveCategoryIdx(idx);
    setActiveTab("All");
  };

  // Close + full reset (same effect as page refresh)
  const handleClose = () => {
    setIsOpen(false);
    setMessages([]);
    setInput("");
    setIsTyping(false);
    setHistory([]);
    setActiveCategoryIdx(0);
    setDynamicPills(pickRandom(SUGGESTION_POOL as string[], 4)); // fresh picks on next open
    setActiveTab("All");
    setCounsellingName("");
    setCounsellingPhone("");
    setCounsellingEmail("");
    setCounsellingSubmitted(false);
    setMode("detailed");
    setWebSearch(false);
  };

  // â”€â”€ Core send â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;

    const userMsg: Message = { id: Date.now(), text: trimmed, isBot: false };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    const currentHistory = history;

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          history: currentHistory,
          mode,
          web_search: webSearch,
          category: CATEGORIES[activeCategoryIdx].label,
        }),
      });

      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      const data = await response.json();

      const botMsg: Message = {
        id: Date.now() + 1,
        text: data.counselling_prompt
          ? "Please share your details and our counsellor will reach out to you shortly:"
          : (data.response || "Sorry, I couldn't process that."),
        isBot: true,
        followUps: data.counselling_prompt ? [] : (data.follow_ups ?? []),
        counsellingPrompt: data.counselling_prompt ?? false,
      };
      setMessages((prev) => [...prev, botMsg]);

      setHistory((prev) => {
        const next: HistoryTurn[] = [
          ...prev,
          { role: "user", content: trimmed },
          { role: "assistant", content: data.response ?? "" },
        ];
        return next.slice(-16);
      });
    } catch (error) {
      console.error("Chat Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          text: "I'm having trouble connecting to the server. Please make sure the backend is running on port 8000.",
          isBot: true,
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = () => sendMessage(input);
  const handleChip = (question: string) => sendMessage(question);

  const handleCounsellingSubmit = () => {
    const name = counsellingName.trim();
    const phone = counsellingPhone.trim();
    const email = counsellingEmail.trim();
    if (!name) {
      alert("Please enter your name.");
      return;
    }
    if (phone.length !== 10 || !/^\d{10}$/.test(phone)) {
      alert("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (!email.includes("@")) {
      alert("Please enter a valid email address.");
      return;
    }
    setCounsellingSubmitted(true);
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        text: `✅ Thanks, **${name}**! Your counselling session has been booked. Our team will reach out to you at **${phone}** and **${email}** within 24 hours. Good luck with your admissions!`,
        isBot: true,
        followUps: [
          "Top engineering colleges in India?",
          "Compare IIT Bombay vs IIT Delhi",
          "JEE Main 2026 exam dates?",
        ],
      },
    ]);
  };

  const activeCategory = CATEGORIES[activeCategoryIdx];
  const currentQuestions =
    activeCategory.questions[activeTab as keyof typeof activeCategory.questions] ??
    activeCategory.questions["All"];

  // â”€â”€ Icon component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const CategoryIcon = activeCategory.icon;

  // â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  return (
    <>
      {/* Floating prompt bubble — shown when chat is closed */}
      {!isOpen && (
        <div className="fixed bottom-24 right-6 z-[200] bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 max-w-[240px] animate-in slide-in-from-bottom-2">
          <button
            onClick={() => setIsOpen(false)}
            className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center"
          >
            <X className="h-3 w-3 text-gray-500" />
          </button>
          <p className="text-sm text-gray-700 leading-snug">
            🎓 Confused about college admissions?{" "}
            <strong className="text-indigo-600">Ask DegreeFYD</strong> — free guidance in seconds.
          </p>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => (isOpen ? handleClose() : setIsOpen(true))}
        className="fixed bottom-6 right-6 z-[200] w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl flex items-center justify-center transition-transform hover:scale-105"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {/* Chat window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-[200] w-[590px] h-[600px] bg-white border border-gray-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4">

          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-4 flex items-center gap-3 flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg">
              D
            </div>
            <div>
              <p className="font-bold text-base leading-tight">DegreeFYD</p>
              <p className="text-xs text-white/70">AI-powered college counsellor</p>
            </div>
            <button onClick={handleClose} className="ml-auto opacity-80 hover:opacity-100">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* â”€â”€ HOME SCREEN (no messages yet) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          {!hasChatStarted ? (
            <div className="flex-1 overflow-y-auto flex flex-col">

              {/* Category tabs row */}
              <div className="flex gap-0 border-b border-gray-100 flex-shrink-0">
                {CATEGORIES.map((cat, idx) => {
                  const Icon = cat.icon;
                  const isActive = idx === activeCategoryIdx;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => handleCategoryChange(idx)}
                      className={`flex-1 flex flex-col items-center gap-1 py-3 text-[11px] font-medium transition-colors border-b-2 ${
                        isActive
                          ? "border-indigo-600 text-indigo-600"
                          : "border-transparent text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {cat.label}
                    </button>
                  );
                })}
              </div>

              {/* Category card */}
              <div className="mx-4 mt-4 bg-gray-50 border border-gray-200 rounded-xl p-4 flex-shrink-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 text-base">{activeCategory.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-snug">{activeCategory.subtitle}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <CategoryIcon className="h-5 w-5 text-indigo-600" />
                  </div>
                </div>

                {/* Sub-tabs */}
                <div className="flex gap-2 mt-3 flex-wrap">
                  {activeCategory.tabs.map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        activeTab === tab
                          ? "bg-gray-900 text-white"
                          : "bg-white border border-gray-200 text-gray-600 hover:border-gray-400"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question chips */}
              <div className="flex flex-col gap-0 mx-4 mt-3 border border-gray-200 rounded-xl overflow-hidden flex-shrink-0">
                {currentQuestions.map((q, i) => (
                  <button
                    key={q}
                    onClick={() => handleChip(q)}
                    className={`flex items-center justify-between px-4 py-3 text-sm text-gray-700 text-left hover:bg-indigo-50 hover:text-indigo-700 transition-colors ${
                      i > 0 ? "border-t border-gray-100" : ""
                    }`}
                  >
                    <span className="flex-1 pr-2">{q}</span>
                    <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  </button>
                ))}
              </div>

              {/* You might be interested in */}
              <div className="mx-4 mt-4 flex-shrink-0">
                <p className="text-xs text-gray-500 mb-2">You might be interested in:</p>
                <div className="flex flex-wrap gap-2">
                  {/* Counselling pill — always first */}
                  <button
                    onClick={() => handleChip("Get Free Counselling")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors border-emerald-400 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                    Get Free Counselling
                  </button>

                  {/* 4 random pills from the pool */}
                  {dynamicPills.map((label) => (
                    <button
                      key={label}
                      onClick={() => handleChip(label)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors border-gray-200 text-gray-600 bg-white hover:border-indigo-300 hover:text-indigo-600"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1" />
            </div>
          ) : (
            /* â”€â”€ CHAT VIEW (messages exist) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((msg) => (
                <div key={msg.id}>
                  <div className={`flex ${msg.isBot ? "justify-start" : "justify-end"}`}>
                    {/* Bot avatar */}
                    {msg.isBot && (
                      <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center mr-2 flex-shrink-0 mt-1 text-white text-xs font-bold">
                        D
                      </div>
                    )}

                    {/* Bubble */}
                    <div
                      className={`rounded-2xl px-4 py-2.5 max-w-[88%] text-sm shadow-sm ${
                        msg.isBot
                          ? "bg-white text-gray-800 border border-gray-200"
                          : "bg-indigo-600 text-white"
                      }`}
                    >
                      {msg.isBot ? (
                        <div className="prose prose-sm max-w-none
                          [&_table]:w-full [&_table]:border-collapse [&_table]:text-xs
                          [&_th]:border [&_th]:border-gray-200 [&_th]:px-2 [&_th]:py-1 [&_th]:bg-gray-50 [&_th]:font-semibold
                          [&_td]:border [&_td]:border-gray-200 [&_td]:px-2 [&_td]:py-1
                          [&_strong]:font-semibold [&_p]:my-1 [&_ul]:my-1 [&_li]:my-0.5
                          [&_h2]:text-sm [&_h2]:font-bold [&_h2]:mt-2 [&_h2]:mb-1
                          [&_h3]:text-sm [&_h3]:font-bold [&_h3]:mt-2 [&_h3]:mb-1">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {msg.text}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <span>{msg.text}</span>
                      )}
                    </div>
                  </div>

                  {/* Counselling inline form */}
                  {msg.isBot && msg.counsellingPrompt && !counsellingSubmitted && (
                    <div className="ml-9 mt-3 bg-indigo-50 border border-indigo-200 rounded-xl p-4 space-y-3 max-w-[88%]">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Rahul Sharma"
                          value={counsellingName}
                          onChange={(e) => setCounsellingName(e.target.value)}
                          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">10-digit Mobile Number</label>
                        <input
                          type="tel"
                          maxLength={10}
                          placeholder="e.g. 9876543210"
                          value={counsellingPhone}
                          onChange={(e) => setCounsellingPhone(e.target.value.replace(/\D/g, ""))}
                          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
                        <input
                          type="email"
                          placeholder="e.g. you@email.com"
                          value={counsellingEmail}
                          onChange={(e) => setCounsellingEmail(e.target.value)}
                          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400"
                        />
                      </div>
                      <button
                        onClick={handleCounsellingSubmit}
                        className="w-full bg-indigo-600 text-white text-sm font-semibold rounded-lg py-2 hover:bg-indigo-700 transition-colors"
                      >
                        Book Free Counselling Session
                      </button>
                    </div>
                  )}

                  {/* Follow-up chips */}
                  {msg.isBot && msg.followUps && msg.followUps.length > 0 && (
                    <div className="flex flex-wrap gap-2 ml-9 mt-2">
                      {msg.followUps.map((q) => (
                        <button
                          key={q}
                          onClick={() => handleChip(q)}
                          disabled={isTyping}
                          className="text-xs border border-indigo-300 text-indigo-600 bg-indigo-50
                            hover:bg-indigo-100 hover:border-indigo-500
                            rounded-full px-3 py-1 transition-colors disabled:opacity-40
                            disabled:cursor-not-allowed text-left"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center mr-2 flex-shrink-0 mt-1 text-white text-xs font-bold">
                    D
                  </div>
                  <div className="bg-white border border-gray-200 rounded-2xl px-4 py-2.5 text-sm shadow-sm">
                    <span className="flex gap-1 items-center">
                      <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0ms]" />
                      <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:150ms]" />
                      <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:300ms]" />
                    </span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* â”€â”€ Input area (always visible) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <div className="px-4 pb-4 pt-3 border-t border-gray-100 flex-shrink-0 bg-white">
            {/* Toggle pills row */}
            <div className="flex items-center gap-2 mb-2">
              {/* Concise / Detailed toggler */}
              <button
                onClick={() => setMode(mode === "detailed" ? "concise" : "detailed")}
                title={mode === "detailed" ? "Switch to concise mode" : "Switch to detailed mode"}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                  mode === "concise"
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-gray-500 border-gray-300 hover:border-indigo-400 hover:text-indigo-600"
                }`}
              >
                <AlignLeft className="h-3 w-3" />
                {mode === "concise" ? "Concise" : "Detailed"}
              </button>

              {/* Web search toggler */}
              <button
                onClick={() => setWebSearch((prev) => !prev)}
                title={webSearch ? "Web search ON — click to disable" : "Web search OFF — click to enable"}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                  webSearch
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-white text-gray-500 border-gray-300 hover:border-emerald-400 hover:text-emerald-600"
                }`}
              >
                <Globe className="h-3 w-3" />
                {webSearch ? "Web: ON" : "Web: OFF"}
              </button>
            </div>

            {/* Input row */}
            <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-4 py-2">
              <input
                type="text"
                placeholder="Ask about colleges, fees, exams..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                disabled={isTyping}
                maxLength={2000}
                className="flex-1 bg-transparent text-sm text-gray-800 placeholder:text-gray-400 outline-none disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={isTyping || !input.trim()}
                className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>

        </div>
      )}
    </>
  );
};

export default ChatBot;

