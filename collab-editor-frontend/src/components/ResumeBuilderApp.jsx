import { useState, useEffect, useRef } from "react";

const COLORS = {
  bg: "#0A0A0F",
  bgCard: "#111118",
  bgCardHover: "#16161F",
  bgPanel: "#0D0D14",
  border: "#1E1E2E",
  borderLight: "#2A2A3E",
  accent: "#6C63FF",
  accentLight: "#8B85FF",
  accentDim: "#6C63FF22",
  accentDim2: "#6C63FF44",
  gold: "#F0B429",
  goldDim: "#F0B42922",
  green: "#0ACF83",
  greenDim: "#0ACF8322",
  red: "#FF4D4F",
  text: "#E8E8F0",
  textMuted: "#7A7A9A",
  textFaint: "#3A3A5A",
};

const NAV_ITEMS = [
  { id: "dashboard", icon: "⬛", label: "Dashboard" },
  { id: "resumes", icon: "📄", label: "My Resumes" },
  { id: "builder", icon: "✏️", label: "Builder" },
  { id: "portfolio", icon: "🌐", label: "Portfolio" },
  { id: "ai", icon: "✨", label: "AI Tools" },
  { id: "settings", icon: "⚙️", label: "Settings" },
];

const TEMPLATES = [
  { id: "modern", name: "Modern", accent: "#6C63FF", preview: "●●● ━━━━━━\n● ━━━━━━━━\n● ━━━━━━━━" },
  { id: "classic", name: "Classic", accent: "#0ACF83", preview: "━━━━━━━━━\n● ━━━━━━\n● ━━━━━━" },
  { id: "minimal", name: "Minimal", accent: "#F0B429", preview: "   ━━━━━━\n━━━━━━━━━\n  ━━━━━━━" },
];

const RESUMES = [
  { id: 1, title: "Software Engineer Resume", template: "modern", atsScore: 87, updated: "2 days ago", views: 24 },
  { id: 2, title: "Senior Dev — Remote Jobs", template: "minimal", atsScore: 72, updated: "1 week ago", views: 8 },
  { id: 3, title: "Full Stack — Startup Focus", template: "classic", atsScore: 91, updated: "Just now", views: 41 },
];

const SECTIONS = [
  { id: "summary", label: "Professional Summary", icon: "👤" },
  { id: "experience", label: "Work Experience", icon: "💼" },
  { id: "education", label: "Education", icon: "🎓" },
  { id: "skills", label: "Skills", icon: "⚡" },
  { id: "projects", label: "Projects", icon: "🚀" },
  { id: "certifications", label: "Certifications", icon: "🏆" },
];

const AI_TOOLS = [
  { id: "improve", icon: "✨", title: "Improve Bullets", desc: "AI rewrites your bullet points with impact metrics", color: COLORS.accent },
  { id: "ats", icon: "🎯", title: "ATS Scorer", desc: "Score your resume against any job description", color: COLORS.gold },
  { id: "cover", icon: "📝", title: "Cover Letter", desc: "Generate a tailored cover letter in 10 seconds", color: COLORS.green },
  { id: "match", icon: "🔍", title: "Job Matcher", desc: "Find missing skills and keywords from JD", color: "#FF6B6B" },
  { id: "summary", icon: "💡", title: "Summary Writer", desc: "Generate a powerful professional summary", color: "#A855F7" },
  { id: "desc", icon: "📊", title: "Project Descriptions", desc: "Auto-generate impactful project descriptions", color: "#06B6D4" },
];

const PLAN_FEATURES = {
  free: ["3 resumes", "1 template", "10 AI credits/mo", "5 PDF exports/mo", "1 portfolio"],
  pro: ["Unlimited resumes", "All 5 templates", "Unlimited AI", "Unlimited exports", "Custom domain", "Priority support"],
};

function ATSRing({ score, size = 80 }) {
  const r = (size / 2) - 8;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 80 ? COLORS.green : score >= 60 ? COLORS.gold : COLORS.red;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={COLORS.border} strokeWidth="6" />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="6"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: "stroke-dasharray 1s ease" }} />
      <text x={size/2} y={size/2+1} textAnchor="middle" dominantBaseline="middle"
        style={{ transform: "rotate(90deg)", transformOrigin: `${size/2}px ${size/2}px`,
          fill: color, fontSize: size * 0.22, fontWeight: 600, fontFamily: "monospace" }}>
        {score}
      </text>
    </svg>
  );
}

function StatCard({ label, value, sub, color }) {
  return (
    <div style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 12,
      padding: "18px 20px", flex: 1, minWidth: 140 }}>
      <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: color || COLORS.text, fontFamily: "'SF Mono', monospace" }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function Badge({ children, color }) {
  return (
    <span style={{ background: color + "22", color, border: `1px solid ${color}44`,
      borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 600 }}>
      {children}
    </span>
  );
}

function Btn({ children, variant = "primary", onClick, style = {} }) {
  const base = { borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600,
    cursor: "pointer", border: "none", transition: "all 0.15s", ...style };
  const styles = {
    primary: { background: COLORS.accent, color: "#fff" },
    outline: { background: "transparent", color: COLORS.textMuted, border: `1px solid ${COLORS.border}` },
    ghost: { background: "transparent", color: COLORS.textMuted, border: "none" },
    success: { background: COLORS.green + "22", color: COLORS.green, border: `1px solid ${COLORS.green}44` },
  };
  return <button style={{ ...base, ...styles[variant] }} onClick={onClick}>{children}</button>;
}

function DashboardPage() {
  const [animScore, setAnimScore] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setAnimScore(87), 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{ padding: "32px 36px", maxWidth: 1100 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: COLORS.text, margin: 0 }}>
          Good morning, Aryan 👋
        </h1>
        <p style={{ color: COLORS.textMuted, margin: "6px 0 0", fontSize: 14 }}>
          Your top resume scores 87% ATS — let's push it to 95%
        </p>
      </div>

      {/* Stats Row */}
      <div style={{ display: "flex", gap: 16, marginBottom: 28, flexWrap: "wrap" }}>
        <StatCard label="Resumes" value="3" sub="1 active this week" color={COLORS.accentLight} />
        <StatCard label="Avg ATS Score" value="83%" sub="+5 from last month" color={COLORS.green} />
        <StatCard label="Portfolio Views" value="124" sub="Last 30 days" color={COLORS.gold} />
        <StatCard label="AI Credits" value="47" sub="of 100 used" color={COLORS.textMuted} />
      </div>

      {/* Main content grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24 }}>
        {/* Left: Resumes */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: COLORS.text }}>My Resumes</h2>
            <Btn variant="outline" style={{ fontSize: 12 }}>+ New Resume</Btn>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {RESUMES.map(r => (
              <div key={r.id} style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`,
                borderRadius: 12, padding: "16px 20px", display: "flex", alignItems: "center",
                gap: 16, cursor: "pointer", transition: "border-color 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = COLORS.borderLight}
                onMouseLeave={e => e.currentTarget.style.borderColor = COLORS.border}>
                <ATSRing score={r.atsScore} size={56} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: COLORS.text, fontSize: 14 }}>{r.title}</div>
                  <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 3 }}>
                    Template: {r.template} • Updated {r.updated} • {r.views} views
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <Btn variant="outline" style={{ fontSize: 11, padding: "5px 10px" }}>Edit</Btn>
                  <Btn variant="ghost" style={{ fontSize: 11, padding: "5px 10px" }}>Export PDF</Btn>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: AI Panel + Quick Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* AI Score Card */}
          <div style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.accentDim2}`,
            borderRadius: 12, padding: "20px" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.accentLight, marginBottom: 12 }}>
              ✨ AI Insight
            </div>
            <div style={{ fontSize: 13, color: COLORS.text, lineHeight: 1.6, marginBottom: 14 }}>
              Your <strong style={{ color: COLORS.accentLight }}>Software Engineer</strong> resume is missing
              keywords: <Badge color={COLORS.gold}>Kubernetes</Badge>{" "}
              <Badge color={COLORS.gold}>Terraform</Badge>{" "}
              <Badge color={COLORS.gold}>gRPC</Badge>
            </div>
            <Btn style={{ width: "100%", textAlign: "center" }}>Fix with AI →</Btn>
          </div>

          {/* Quick Actions */}
          <div style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`,
            borderRadius: 12, padding: "20px" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text, marginBottom: 14 }}>Quick Actions</div>
            {[
              { icon: "📝", label: "Generate Cover Letter", color: COLORS.green },
              { icon: "🎯", label: "Check ATS Score", color: COLORS.gold },
              { icon: "🌐", label: "View My Portfolio", color: COLORS.accentLight },
              { icon: "⬆️", label: "Upgrade to Pro", color: COLORS.red },
            ].map(a => (
              <div key={a.label} style={{ display: "flex", alignItems: "center", gap: 10,
                padding: "10px 0", borderBottom: `1px solid ${COLORS.border}`, cursor: "pointer" }}>
                <span>{a.icon}</span>
                <span style={{ fontSize: 13, color: COLORS.text, flex: 1 }}>{a.label}</span>
                <span style={{ color: COLORS.textFaint, fontSize: 16 }}>›</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function BuilderPage() {
  const [activeSection, setActiveSection] = useState("experience");
  const [template, setTemplate] = useState("modern");
  const [bullets, setBullets] = useState([
    "Built REST APIs with Node.js and Express",
    "Worked on database optimization",
    "Helped team with code reviews",
  ]);
  const [improving, setImproving] = useState(null);
  const [improved, setImproved] = useState({});

  const improvedBullets = {
    0: "Architected and deployed 12 REST APIs using Node.js + Express, reducing average response time by 40%",
    1: "Optimized PostgreSQL queries with strategic indexing, cutting report load time from 8s to 0.9s",
    2: "Led bi-weekly code reviews for 6-person team, reducing production bugs by 35%",
  };

  const handleImprove = (i) => {
    setImproving(i);
    setTimeout(() => {
      setImproved(prev => ({ ...prev, [i]: improvedBullets[i] }));
      setImproving(null);
    }, 1500);
  };

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      {/* Left Panel - Sections */}
      <div style={{ width: 220, background: COLORS.bgPanel, borderRight: `1px solid ${COLORS.border}`,
        padding: "20px 0", flexShrink: 0, overflowY: "auto" }}>
        <div style={{ padding: "0 16px 12px", fontSize: 11, fontWeight: 700, color: COLORS.textFaint,
          textTransform: "uppercase", letterSpacing: "0.1em" }}>Sections</div>
        {SECTIONS.map(s => (
          <div key={s.id} onClick={() => setActiveSection(s.id)}
            style={{ padding: "10px 16px", display: "flex", alignItems: "center", gap: 10,
              cursor: "pointer", background: activeSection === s.id ? COLORS.accentDim : "transparent",
              borderLeft: activeSection === s.id ? `2px solid ${COLORS.accent}` : "2px solid transparent",
              transition: "all 0.15s" }}>
            <span style={{ fontSize: 14 }}>{s.icon}</span>
            <span style={{ fontSize: 13, color: activeSection === s.id ? COLORS.accentLight : COLORS.textMuted }}>
              {s.label}
            </span>
          </div>
        ))}
        <div style={{ margin: "16px", borderTop: `1px solid ${COLORS.border}`, paddingTop: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textFaint, marginBottom: 10,
            textTransform: "uppercase", letterSpacing: "0.1em" }}>Template</div>
          {TEMPLATES.map(t => (
            <div key={t.id} onClick={() => setTemplate(t.id)}
              style={{ padding: "8px 10px", borderRadius: 8, marginBottom: 6, cursor: "pointer",
                border: `1px solid ${template === t.id ? t.accent : COLORS.border}`,
                background: template === t.id ? t.accent + "11" : "transparent",
                display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 4, background: COLORS.bgCard,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 7, color: t.accent, fontFamily: "monospace", lineHeight: 1.4,
                whiteSpace: "pre" }}>{t.preview}</div>
              <span style={{ fontSize: 12, color: template === t.id ? t.accent : COLORS.textMuted }}>
                {t.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Middle - Editor */}
      <div style={{ flex: 1, padding: "24px", overflowY: "auto", borderRight: `1px solid ${COLORS.border}` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: COLORS.text }}>Work Experience</h2>
          <div style={{ display: "flex", gap: 8 }}>
            <Badge color={COLORS.green}>Auto-saved</Badge>
            <Btn variant="outline" style={{ fontSize: 12 }}>+ Add Entry</Btn>
          </div>
        </div>

        {/* Experience Entry */}
        <div style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`,
          borderRadius: 12, padding: "20px", marginBottom: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            {[["Job Title", "Senior Frontend Engineer"], ["Company", "Acme Corp"],
              ["Start Date", "Jan 2022"], ["End Date", "Present"]].map(([label, val]) => (
              <div key={label}>
                <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 6,
                  textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
                <input defaultValue={val} style={{ width: "100%", background: COLORS.bgPanel,
                  border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "8px 12px",
                  color: COLORS.text, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
              </div>
            ))}
          </div>

          <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 10,
            textTransform: "uppercase", letterSpacing: "0.06em" }}>Bullet Points</div>
          {bullets.map((b, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "flex-start" }}>
              <span style={{ color: COLORS.textFaint, marginTop: 9, fontSize: 12 }}>•</span>
              <div style={{ flex: 1, background: improving === i ? COLORS.accentDim : improved[i] ? COLORS.greenDim : COLORS.bgPanel,
                border: `1px solid ${improving === i ? COLORS.accent : improved[i] ? COLORS.green : COLORS.border}`,
                borderRadius: 8, padding: "8px 12px", fontSize: 13, color: COLORS.text, lineHeight: 1.5,
                transition: "all 0.3s", minHeight: 36 }}>
                {improving === i ? (
                  <span style={{ color: COLORS.accent }}>✨ AI improving...</span>
                ) : improved[i] || b}
              </div>
              <button onClick={() => handleImprove(i)}
                style={{ background: COLORS.accentDim, border: `1px solid ${COLORS.accentDim2}`,
                  borderRadius: 8, padding: "8px 10px", fontSize: 11, color: COLORS.accentLight,
                  cursor: "pointer", flexShrink: 0, transition: "all 0.15s" }}>
                ✨ AI
              </button>
            </div>
          ))}
          <button onClick={() => setBullets([...bullets, ""])}
            style={{ background: "transparent", border: `1px dashed ${COLORS.borderLight}`,
              borderRadius: 8, padding: "8px 16px", fontSize: 12, color: COLORS.textMuted,
              cursor: "pointer", marginTop: 4, width: "100%" }}>
            + Add bullet point
          </button>
        </div>
      </div>

      {/* Right - Preview */}
      <div style={{ width: 320, background: COLORS.bgPanel, padding: "20px", overflowY: "auto", flexShrink: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textFaint, marginBottom: 16,
          textTransform: "uppercase", letterSpacing: "0.1em" }}>Live Preview</div>
        {/* Simulated Resume Preview */}
        <div style={{ background: "#fff", borderRadius: 8, padding: "20px", color: "#111",
          fontSize: "10px", lineHeight: 1.5, boxShadow: "0 4px 24px #00000040" }}>
          <div style={{ textAlign: "center", borderBottom: "2px solid #6C63FF", paddingBottom: 10, marginBottom: 10 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#111" }}>Aryan Sharma</div>
            <div style={{ fontSize: 10, color: "#666" }}>Senior Frontend Engineer</div>
            <div style={{ fontSize: 9, color: "#888" }}>aryan@email.com • +91 98765 43210 • linkedin.com/in/aryan</div>
          </div>
          <div style={{ fontWeight: 700, fontSize: 10, color: "#6C63FF", marginBottom: 4, letterSpacing: "0.05em" }}>EXPERIENCE</div>
          <div style={{ fontWeight: 600, marginBottom: 2 }}>Senior Frontend Engineer — Acme Corp</div>
          <div style={{ color: "#888", fontSize: 9, marginBottom: 4 }}>Jan 2022 – Present</div>
          {bullets.map((b, i) => (
            <div key={i} style={{ display: "flex", gap: 4, marginBottom: 3 }}>
              <span>•</span>
              <span style={{ color: "#333" }}>{improved[i] || b}</span>
            </div>
          ))}
          <div style={{ fontWeight: 700, fontSize: 10, color: "#6C63FF", margin: "10px 0 4px", letterSpacing: "0.05em" }}>SKILLS</div>
          <div style={{ color: "#333" }}>React • TypeScript • Node.js • PostgreSQL • Redis • AWS</div>
          <div style={{ fontWeight: 700, fontSize: 10, color: "#6C63FF", margin: "10px 0 4px", letterSpacing: "0.05em" }}>EDUCATION</div>
          <div style={{ fontWeight: 600 }}>B.Tech Computer Science</div>
          <div style={{ color: "#888", fontSize: 9 }}>IIT Delhi • 2018-2022</div>
        </div>
        <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
          <Btn style={{ flex: 1, textAlign: "center", fontSize: 12 }}>⬇ Export PDF</Btn>
          <Btn variant="outline" style={{ flex: 1, textAlign: "center", fontSize: 12 }}>🔗 Share</Btn>
        </div>
      </div>
    </div>
  );
}

function AIToolsPage() {
  const [activeTool, setActiveTool] = useState(null);
  const [jobDesc, setJobDesc] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);

  const runATS = () => {
    if (!jobDesc.trim()) return;
    setAnalyzing(true);
    setTimeout(() => {
      setResult({
        score: 78,
        missing: ["Kubernetes", "Terraform", "GraphQL", "Docker Swarm"],
        present: ["React", "TypeScript", "Node.js", "PostgreSQL", "REST APIs"],
        suggestions: [
          "Add Kubernetes experience or mention familiarity",
          "Include containerization/DevOps keywords",
          "Quantify team size and project scale",
        ]
      });
      setAnalyzing(false);
    }, 2000);
  };

  return (
    <div style={{ padding: "32px 36px", maxWidth: 900 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: COLORS.text, margin: "0 0 6px" }}>AI Tools</h1>
      <p style={{ color: COLORS.textMuted, fontSize: 14, margin: "0 0 28px" }}>
        Powered by GPT-4o-mini — fast, affordable, powerful
      </p>

      {!activeTool ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {AI_TOOLS.map(tool => (
            <div key={tool.id} onClick={() => setActiveTool(tool.id)}
              style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`,
                borderRadius: 14, padding: "22px", cursor: "pointer", transition: "all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = tool.color + "66"; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = COLORS.border; e.currentTarget.style.transform = ""; }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>{tool.icon}</div>
              <div style={{ fontWeight: 600, color: COLORS.text, fontSize: 15, marginBottom: 6 }}>{tool.title}</div>
              <div style={{ fontSize: 13, color: COLORS.textMuted, lineHeight: 1.5 }}>{tool.desc}</div>
              <div style={{ marginTop: 14, fontSize: 12, color: tool.color, fontWeight: 600 }}>Try it →</div>
            </div>
          ))}
        </div>
      ) : (
        <div>
          <button onClick={() => { setActiveTool(null); setResult(null); setJobDesc(""); }}
            style={{ background: "transparent", border: "none", color: COLORS.textMuted,
              cursor: "pointer", fontSize: 13, marginBottom: 24, padding: 0 }}>
            ← Back to AI Tools
          </button>

          {activeTool === "ats" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
              <div>
                <h2 style={{ color: COLORS.text, fontSize: 18, marginBottom: 16 }}>🎯 ATS Score Checker</h2>
                <div style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 12 }}>
                  Paste the job description to score your resume:
                </div>
                <textarea value={jobDesc} onChange={e => setJobDesc(e.target.value)}
                  placeholder="Paste job description here..."
                  style={{ width: "100%", height: 220, background: COLORS.bgPanel,
                    border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 14,
                    color: COLORS.text, fontSize: 13, outline: "none", resize: "none",
                    boxSizing: "border-box", lineHeight: 1.6 }} />
                <Btn onClick={runATS} style={{ marginTop: 12, width: "100%", textAlign: "center",
                  opacity: analyzing ? 0.7 : 1 }}>
                  {analyzing ? "🔄 Analyzing..." : "🎯 Score My Resume"}
                </Btn>
              </div>

              <div>
                {result ? (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 20 }}>
                      <ATSRing score={result.score} size={90} />
                      <div>
                        <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.text }}>ATS Score</div>
                        <div style={{ fontSize: 13, color: COLORS.textMuted }}>Good — needs some fixes</div>
                      </div>
                    </div>
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.red, marginBottom: 8,
                        textTransform: "uppercase" }}>Missing Keywords</div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {result.missing.map(k => <Badge key={k} color={COLORS.red}>{k}</Badge>)}
                      </div>
                    </div>
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.green, marginBottom: 8,
                        textTransform: "uppercase" }}>Found Keywords</div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {result.present.map(k => <Badge key={k} color={COLORS.green}>{k}</Badge>)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.gold, marginBottom: 8,
                        textTransform: "uppercase" }}>Suggestions</div>
                      {result.suggestions.map((s, i) => (
                        <div key={i} style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 6,
                          paddingLeft: 12, borderLeft: `2px solid ${COLORS.gold}` }}>{s}</div>
                      ))}
                    </div>
                    <Btn style={{ marginTop: 16, width: "100%", textAlign: "center" }}>
                      ✨ Auto-fix with AI →
                    </Btn>
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center",
                    height: 300, color: COLORS.textFaint, fontSize: 14, flexDirection: "column", gap: 10 }}>
                    <span style={{ fontSize: 40 }}>🎯</span>
                    <span>Paste a JD and click Score</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTool !== "ats" && (
            <div style={{ textAlign: "center", padding: "60px 0", color: COLORS.textMuted }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>
                {AI_TOOLS.find(t => t.id === activeTool)?.icon}
              </div>
              <div style={{ fontSize: 18, color: COLORS.text, marginBottom: 8 }}>
                {AI_TOOLS.find(t => t.id === activeTool)?.title}
              </div>
              <div style={{ fontSize: 14, marginBottom: 24 }}>
                {AI_TOOLS.find(t => t.id === activeTool)?.desc}
              </div>
              <Btn>Launch Tool →</Btn>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PortfolioPage() {
  const themes = [
    { id: "dark", name: "Dark Pro", bg: "#0A0A0F", accent: "#6C63FF" },
    { id: "light", name: "Minimal Light", bg: "#FAFAF8", accent: "#111" },
    { id: "ocean", name: "Ocean", bg: "#0D1F2D", accent: "#0ACF83" },
    { id: "warm", name: "Warm Amber", bg: "#1A1208", accent: "#F0B429" },
  ];
  const [selectedTheme, setSelectedTheme] = useState("dark");
  const theme = themes.find(t => t.id === selectedTheme);

  return (
    <div style={{ padding: "32px 36px", maxWidth: 1000 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: COLORS.text, margin: "0 0 4px" }}>Portfolio Builder</h1>
          <p style={{ color: COLORS.textMuted, fontSize: 13, margin: 0 }}>
            🌐 Live at: resumeai.app/portfolio/<strong style={{ color: COLORS.accentLight }}>aryan</strong>
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn variant="outline">Preview</Btn>
          <Btn>Publish Changes</Btn>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 24 }}>
        {/* Controls */}
        <div>
          <div style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`,
            borderRadius: 12, padding: "18px" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.textFaint, marginBottom: 14,
              textTransform: "uppercase", letterSpacing: "0.08em" }}>Theme</div>
            {themes.map(t => (
              <div key={t.id} onClick={() => setSelectedTheme(t.id)}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px",
                  borderRadius: 8, cursor: "pointer", marginBottom: 6,
                  border: `1px solid ${selectedTheme === t.id ? t.accent : "transparent"}`,
                  background: selectedTheme === t.id ? t.accent + "11" : "transparent" }}>
                <div style={{ width: 28, height: 28, borderRadius: 6, background: t.bg,
                  border: `2px solid ${t.accent}`, flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: selectedTheme === t.id ? t.accent : COLORS.textMuted }}>
                  {t.name}
                </span>
              </div>
            ))}

            <div style={{ borderTop: `1px solid ${COLORS.border}`, marginTop: 16, paddingTop: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.textFaint, marginBottom: 14,
                textTransform: "uppercase", letterSpacing: "0.08em" }}>Sections</div>
              {["Hero", "About", "Skills", "Projects", "Experience", "Contact"].map(s => (
                <div key={s} style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "7px 0", borderBottom: `1px solid ${COLORS.border}` }}>
                  <span style={{ fontSize: 13, color: COLORS.textMuted }}>{s}</span>
                  <div style={{ width: 32, height: 18, borderRadius: 9, background: COLORS.accent,
                    position: "relative", cursor: "pointer" }}>
                    <div style={{ width: 14, height: 14, borderRadius: 7, background: "#fff",
                      position: "absolute", right: 2, top: 2 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Preview */}
        <div style={{ background: theme.bg, borderRadius: 16, padding: "32px",
          border: `1px solid ${COLORS.border}`, minHeight: 500, position: "relative",
          overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 20% 20%, ${theme.accent}08 0%, transparent 60%)` }} />
          <div style={{ position: "relative" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: theme.accent + "33",
              border: `3px solid ${theme.accent}`, marginBottom: 16,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 24, color: theme.accent }}>A</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: theme.id === "light" ? "#111" : "#fff",
              marginBottom: 6 }}>Aryan Sharma</div>
            <div style={{ fontSize: 16, color: theme.accent, marginBottom: 12 }}>
              Full Stack Engineer & AI Enthusiast
            </div>
            <div style={{ fontSize: 13, color: theme.id === "light" ? "#555" : "#888", maxWidth: 400, lineHeight: 1.6, marginBottom: 24 }}>
              Building scalable web applications with modern tech. 4 years experience. Open to exciting opportunities.
            </div>
            <div style={{ display: "flex", gap: 10, marginBottom: 32 }}>
              <div style={{ background: theme.accent, color: theme.id === "light" ? "#fff" : COLORS.bg,
                padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                View Resume →
              </div>
              <div style={{ background: "transparent", border: `1px solid ${theme.accent}`,
                color: theme.accent, padding: "8px 18px", borderRadius: 8, fontSize: 13, cursor: "pointer" }}>
                Contact Me
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {["React", "TypeScript", "Node.js", "PostgreSQL", "Redis", "AWS"].map(skill => (
                <div key={skill} style={{ background: theme.accent + "22", border: `1px solid ${theme.accent}44`,
                  borderRadius: 8, padding: "8px 12px", fontSize: 12, color: theme.accent, textAlign: "center" }}>
                  {skill}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsPage() {
  return (
    <div style={{ padding: "32px 36px", maxWidth: 700 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: COLORS.text, margin: "0 0 28px" }}>Settings</h1>

      {/* Plan Card */}
      <div style={{ background: `linear-gradient(135deg, ${COLORS.accentDim2} 0%, ${COLORS.bgCard} 100%)`,
        border: `1px solid ${COLORS.accent}44`, borderRadius: 16, padding: "24px",
        marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <Badge color={COLORS.accent}>FREE PLAN</Badge>
          <div style={{ fontSize: 16, fontWeight: 600, color: COLORS.text, marginTop: 8, marginBottom: 4 }}>
            3/3 resumes used
          </div>
          <div style={{ fontSize: 13, color: COLORS.textMuted }}>
            Upgrade to Pro for unlimited everything
          </div>
          <div style={{ display: "flex", gap: 16, marginTop: 14 }}>
            <div>
              <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 4 }}>AI Credits</div>
              <div style={{ height: 4, width: 120, background: COLORS.border, borderRadius: 2 }}>
                <div style={{ height: 4, width: "47%", background: COLORS.accent, borderRadius: 2 }} />
              </div>
              <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 2 }}>47/100 used</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 4 }}>PDF Exports</div>
              <div style={{ height: 4, width: 120, background: COLORS.border, borderRadius: 2 }}>
                <div style={{ height: 4, width: "60%", background: COLORS.gold, borderRadius: 2 }} />
              </div>
              <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 2 }}>3/5 used</div>
            </div>
          </div>
        </div>
        <Btn style={{ flexShrink: 0 }}>Upgrade to Pro ⚡</Btn>
      </div>

      {/* Profile */}
      <div style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`,
        borderRadius: 12, padding: "24px", marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.text, marginBottom: 18 }}>Profile</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {[["Full Name", "Aryan Sharma"], ["Email", "aryan@email.com"],
            ["Username", "aryan"], ["Location", "Mumbai, India"],
            ["LinkedIn", "linkedin.com/in/aryan"], ["GitHub", "github.com/aryan"]].map(([label, val]) => (
            <div key={label}>
              <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 6,
                textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
              <input defaultValue={val} style={{ width: "100%", background: COLORS.bgPanel,
                border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "8px 12px",
                color: COLORS.text, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
            </div>
          ))}
        </div>
        <Btn style={{ marginTop: 16 }}>Save Changes</Btn>
      </div>

      {/* Pricing */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {["free", "pro"].map(plan => (
          <div key={plan} style={{ background: COLORS.bgCard,
            border: `1px solid ${plan === "pro" ? COLORS.accent : COLORS.border}`,
            borderRadius: 12, padding: "20px", position: "relative" }}>
            {plan === "pro" && (
              <div style={{ position: "absolute", top: -1, right: 20, background: COLORS.accent,
                color: "#fff", fontSize: 10, fontWeight: 700, padding: "3px 10px",
                borderRadius: "0 0 8px 8px", letterSpacing: "0.05em" }}>RECOMMENDED</div>
            )}
            <div style={{ fontSize: 13, fontWeight: 700, color: plan === "pro" ? COLORS.accentLight : COLORS.textMuted,
              textTransform: "uppercase", marginBottom: 8 }}>{plan}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: COLORS.text, marginBottom: 16 }}>
              {plan === "free" ? "$0" : "$9"}<span style={{ fontSize: 14, color: COLORS.textMuted }}>/mo</span>
            </div>
            {PLAN_FEATURES[plan].map(f => (
              <div key={f} style={{ display: "flex", gap: 8, marginBottom: 8, fontSize: 13 }}>
                <span style={{ color: plan === "pro" ? COLORS.green : COLORS.textMuted }}>
                  {plan === "pro" ? "✓" : "·"}
                </span>
                <span style={{ color: COLORS.textMuted }}>{f}</span>
              </div>
            ))}
            <Btn variant={plan === "pro" ? "primary" : "outline"}
              style={{ marginTop: 14, width: "100%", textAlign: "center" }}>
              {plan === "free" ? "Current Plan" : "Upgrade Now"}
            </Btn>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  const pages = {
    dashboard: <DashboardPage />,
    resumes: <div style={{ padding: 40, color: COLORS.textMuted }}>Resume list view — similar to dashboard resumes section</div>,
    builder: <BuilderPage />,
    portfolio: <PortfolioPage />,
    ai: <AIToolsPage />,
    settings: <SettingsPage />,
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: COLORS.bg, fontFamily: "'Inter', -apple-system, sans-serif", overflow: "hidden" }}>
      {/* Sidebar */}
      <div style={{ width: sidebarExpanded ? 220 : 64, background: COLORS.bgPanel,
        borderRight: `1px solid ${COLORS.border}`, display: "flex", flexDirection: "column",
        transition: "width 0.25s ease", flexShrink: 0, overflow: "hidden" }}>
        {/* Logo */}
        <div style={{ padding: "20px 16px 16px", borderBottom: `1px solid ${COLORS.border}`,
          display: "flex", alignItems: "center", gap: 10, overflow: "hidden" }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: COLORS.accent,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, color: "#fff", flexShrink: 0 }}>R</div>
          {sidebarExpanded && (
            <div>
              <div style={{ fontWeight: 700, color: COLORS.text, fontSize: 14, whiteSpace: "nowrap" }}>ResumeAI</div>
              <div style={{ fontSize: 10, color: COLORS.textMuted, whiteSpace: "nowrap" }}>Build. Optimize. Land.</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "12px 0" }}>
          {NAV_ITEMS.map(item => (
            <div key={item.id} onClick={() => setPage(item.id)}
              title={!sidebarExpanded ? item.label : ""}
              style={{ padding: sidebarExpanded ? "11px 16px" : "11px 16px",
                display: "flex", alignItems: "center", gap: 12, cursor: "pointer",
                background: page === item.id ? COLORS.accentDim : "transparent",
                borderLeft: page === item.id ? `2px solid ${COLORS.accent}` : "2px solid transparent",
                transition: "all 0.15s", overflow: "hidden" }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
              {sidebarExpanded && (
                <span style={{ fontSize: 13, color: page === item.id ? COLORS.accentLight : COLORS.textMuted,
                  whiteSpace: "nowrap", fontWeight: page === item.id ? 600 : 400 }}>
                  {item.label}
                </span>
              )}
            </div>
          ))}
        </nav>

        {/* User */}
        <div style={{ padding: "14px 16px", borderTop: `1px solid ${COLORS.border}`,
          display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: COLORS.accentDim2,
            border: `2px solid ${COLORS.accent}44`, display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 13, color: COLORS.accentLight, fontWeight: 600,
            flexShrink: 0 }}>A</div>
          {sidebarExpanded && (
            <div style={{ overflow: "hidden" }}>
              <div style={{ fontSize: 13, color: COLORS.text, fontWeight: 500, whiteSpace: "nowrap" }}>Aryan Sharma</div>
              <div style={{ fontSize: 11, color: COLORS.textMuted, whiteSpace: "nowrap" }}>Free Plan</div>
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column" }}>
        {/* Topbar */}
        <div style={{ height: 56, borderBottom: `1px solid ${COLORS.border}`, display: "flex",
          alignItems: "center", padding: "0 24px", gap: 14, background: COLORS.bgPanel,
          flexShrink: 0 }}>
          <button onClick={() => setSidebarExpanded(!sidebarExpanded)}
            style={{ background: "transparent", border: "none", cursor: "pointer",
              color: COLORS.textMuted, fontSize: 18, padding: "4px 6px", borderRadius: 6 }}>
            ☰
          </button>
          <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
            <div style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`,
              borderRadius: 8, padding: "7px 14px", display: "flex", alignItems: "center",
              gap: 10, maxWidth: 280 }}>
              <span style={{ color: COLORS.textFaint, fontSize: 14 }}>🔍</span>
              <input placeholder="Search resumes, templates..."
                style={{ background: "transparent", border: "none", outline: "none",
                  color: COLORS.text, fontSize: 13, width: 200 }} />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ background: COLORS.goldDim, border: `1px solid ${COLORS.gold}44`,
              borderRadius: 8, padding: "5px 12px", fontSize: 12, color: COLORS.gold, cursor: "pointer" }}>
              ⚡ Upgrade to Pro
            </div>
            <div style={{ width: 32, height: 32, borderRadius: "50%",
              background: COLORS.accentDim2, border: `2px solid ${COLORS.accent}44`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, color: COLORS.accentLight, fontWeight: 600 }}>A</div>
          </div>
        </div>

        {/* Page Content */}
        <div style={{ flex: 1, overflow: page === "builder" ? "hidden" : "auto" }}>
          {pages[page]}
        </div>
      </div>
    </div>
  );
}
