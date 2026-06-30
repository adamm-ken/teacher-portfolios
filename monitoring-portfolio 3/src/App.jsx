import { useState, useEffect, useCallback, useRef } from "react";
import { Save, CheckCircle, AlertCircle, Loader, Printer, ChevronDown, ChevronUp } from "lucide-react";

// ── Read teacher ID from URL: /portfolio/miss-amy → "miss-amy" ──────────────
function getTeacherId() {
  const parts = window.location.pathname.split("/").filter(Boolean);
  // expect /portfolio/:id
  if (parts[0] === "portfolio" && parts[1]) return parts[1];
  // fallback: use search param ?teacher=miss-amy
  const p = new URLSearchParams(window.location.search);
  if (p.get("teacher")) return p.get("teacher");
  return null;
}

// ── Palette helpers ──────────────────────────────────────────────────────────
const C = {
  ink: "#1A1F2E", cream: "#F7F4EE", warm: "#EDE9E0",
  gold: "#B8862A", goldL: "#F5E8C4",
  teal: "#2A6B6B", tealL: "#C8E0E0",
  rose: "#8B3A52", roseL: "#F2D0D8",
  slate: "#3D5470", slateL: "#D0DCF0",
  green: "#2E6B40", greenL: "#C8E8D4",
  muted: "#7A7468", border: "#D8D2C6", white: "#FFFFFF",
};

// ── Shared UI components ─────────────────────────────────────────────────────

function SectionHeader({ title, color = C.ink, textColor = C.white, icon }) {
  return (
    <div style={{
      background: color, color: textColor,
      padding: "10px 14px", borderRadius: "6px 6px 0 0",
      fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 8
    }}>
      {icon && <span>{icon}</span>}
      {title}
    </div>
  );
}

function Card({ children, style }) {
  return (
    <div style={{
      background: C.white, border: `1px solid ${C.border}`,
      borderRadius: 8, marginBottom: 16,
      boxShadow: "0 2px 10px rgba(26,31,46,0.06)",
      overflow: "hidden", ...style
    }}>
      {children}
    </div>
  );
}

function Field({ label, name, value, onChange, multiline, placeholder, type = "text", style }) {
  const shared = {
    width: "100%", padding: "8px 10px",
    border: `1.5px solid ${C.border}`, borderRadius: 6,
    background: C.cream, color: C.ink, fontSize: 13,
    outline: "none", transition: "border-color 0.2s, background 0.2s",
    ...style
  };
  return (
    <div style={{ marginBottom: 12 }}>
      {label && (
        <label style={{
          display: "block", fontSize: 11, fontWeight: 700,
          letterSpacing: "0.07em", textTransform: "uppercase",
          color: C.muted, marginBottom: 4
        }}>{label}</label>
      )}
      {multiline ? (
        <textarea
          rows={3} value={value || ""} placeholder={placeholder}
          onChange={e => onChange(name, e.target.value)}
          style={{ ...shared, resize: "vertical", minHeight: 72 }}
          onFocus={e => { e.target.style.borderColor = C.gold; e.target.style.background = C.white; }}
          onBlur={e => { e.target.style.borderColor = C.border; e.target.style.background = C.cream; }}
        />
      ) : (
        <input
          type={type} value={value || ""} placeholder={placeholder}
          onChange={e => onChange(name, e.target.value)}
          style={shared}
          onFocus={e => { e.target.style.borderColor = C.gold; e.target.style.background = C.white; }}
          onBlur={e => { e.target.style.borderColor = C.border; e.target.style.background = C.cream; }}
        />
      )}
    </div>
  );
}

function Select({ label, name, value, onChange, options }) {
  return (
    <div style={{ marginBottom: 12 }}>
      {label && (
        <label style={{
          display: "block", fontSize: 11, fontWeight: 700,
          letterSpacing: "0.07em", textTransform: "uppercase",
          color: C.muted, marginBottom: 4
        }}>{label}</label>
      )}
      <select
        value={value || ""} onChange={e => onChange(name, e.target.value)}
        style={{
          width: "100%", padding: "8px 10px",
          border: `1.5px solid ${C.border}`, borderRadius: 6,
          background: C.cream, color: C.ink, fontSize: 13, outline: "none"
        }}
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function RadioGroup({ name, value, onChange, options }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 6 }}>
      {options.map(opt => (
        <label key={opt} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13 }}>
          <input
            type="radio" name={name} value={opt}
            checked={value === opt}
            onChange={() => onChange(name, opt)}
            style={{ accentColor: C.gold, width: 16, height: 16 }}
          />
          {opt}
        </label>
      ))}
    </div>
  );
}

function CheckItem({ label, name, value, onChange }) {
  const states = ["", "Yes", "Partial"];
  const next = () => {
    const idx = states.indexOf(value || "");
    onChange(name, states[(idx + 1) % states.length]);
  };
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "10px 12px", borderBottom: `1px solid ${C.border}`,
      background: C.cream, gap: 12, fontSize: 13
    }}>
      <span style={{ flex: 1 }}>{label}</span>
      <button onClick={next} style={{
        border: "none", borderRadius: 4, padding: "4px 12px",
        fontWeight: 700, fontSize: 11, cursor: "pointer", minWidth: 72,
        background: value === "Yes" ? C.greenL : value === "Partial" ? "#FFF3CC" : C.warm,
        color: value === "Yes" ? C.green : value === "Partial" ? "#7A5500" : C.muted,
        transition: "all 0.15s"
      }}>
        {value || "- tap -"}
      </button>
    </div>
  );
}

function FocusBadge({ text, bg, fg = C.white }) {
  return (
    <span style={{
      display: "inline-block", background: bg, color: fg,
      borderRadius: 3, padding: "3px 9px", fontSize: 11,
      fontWeight: 700, marginRight: 6, marginBottom: 4
    }}>{text}</span>
  );
}

function NextStepBox({ name, value, onChange }) {
  return (
    <div style={{
      border: `2px solid ${C.rose}`, borderRadius: 8,
      padding: "12px 14px", background: C.roseL, marginBottom: 12
    }}>
      <label style={{
        display: "block", fontSize: 11, fontWeight: 700,
        letterSpacing: "0.07em", textTransform: "uppercase",
        color: C.rose, marginBottom: 6
      }}>Next Step (one only)</label>
      <textarea
        rows={3} value={value || ""}
        onChange={e => onChange(name, e.target.value)}
        placeholder="What is the single most important next step?"
        style={{
          width: "100%", padding: "8px 10px",
          border: `1.5px solid rgba(139,58,82,0.3)`, borderRadius: 6,
          background: "rgba(255,255,255,0.8)", color: C.ink, fontSize: 13,
          outline: "none", resize: "vertical", minHeight: 72
        }}
        onFocus={e => e.target.style.borderColor = C.rose}
        onBlur={e => e.target.style.borderColor = "rgba(139,58,82,0.3)"}
      />
    </div>
  );
}

function FollowUpBox({ prefix, data, onChange }) {
  return (
    <div style={{
      border: `2px solid ${C.slate}`, borderRadius: 8,
      padding: "12px 14px", background: C.slateL, marginBottom: 12
    }}>
      <div style={{ fontWeight: 700, fontSize: 12, color: C.slate, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.07em" }}>
        Follow-Up Required?
      </div>
      <RadioGroup
        name={`${prefix}_fu_required`}
        value={data[`${prefix}_fu_required`]}
        onChange={onChange}
        options={["No - reviewed at next event", "Yes - follow-up check needed"]}
      />
      {data[`${prefix}_fu_required`] === "Yes - follow-up check needed" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
          <Field label="Follow-Up Date" name={`${prefix}_fu_date`} type="date"
            value={data[`${prefix}_fu_date`]} onChange={onChange} />
          <Select label="Method" name={`${prefix}_fu_method`}
            value={data[`${prefix}_fu_method`]} onChange={onChange}
            options={["- Select -", "Brief book look", "Short conversation", "Informal learning walk"]} />
        </div>
      )}
    </div>
  );
}

function TeacherResponse({ prefix, value, onChange }) {
  return (
    <div style={{
      borderLeft: `4px solid ${C.teal}`, borderRadius: "0 6px 6px 0",
      padding: "10px 14px", background: C.tealL, marginBottom: 12
    }}>
      <label style={{
        display: "block", fontSize: 11, fontWeight: 700,
        letterSpacing: "0.07em", textTransform: "uppercase",
        color: C.teal, marginBottom: 6
      }}>Teacher Response</label>
      <textarea
        rows={2} value={value || ""}
        onChange={e => onChange(`${prefix}_teacher_response`, e.target.value)}
        placeholder="Teacher's own comments..."
        style={{
          width: "100%", padding: "8px 10px",
          border: `1.5px solid rgba(42,107,107,0.25)`, borderRadius: 6,
          background: "rgba(255,255,255,0.7)", color: C.ink, fontSize: 13,
          outline: "none", resize: "vertical"
        }}
      />
    </div>
  );
}

function Sigs({ prefix, data, onChange }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
      <Field label="Observer Signature / Initials" name={`${prefix}_obs_sig`}
        value={data[`${prefix}_obs_sig`]} onChange={onChange} />
      <Field label="Teacher Signature / Initials" name={`${prefix}_teach_sig`}
        value={data[`${prefix}_teach_sig`]} onChange={onChange} />
    </div>
  );
}

// ── TAB COMPONENTS ───────────────────────────────────────────────────────────

function BookLook({ num, title, focuses, checkItems, data, onChange }) {
  const p = `bl${num}`;
  return (
    <div>
      <Card>
        <SectionHeader title={`Book Look ${num} — ${title}`} color={C.gold} textColor={C.ink} icon="📚" />
        <div style={{ padding: "16px 16px 4px" }}>
          {focuses.map(([t, bg, fg]) => <FocusBadge key={t} text={t} bg={bg} fg={fg} />)}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 12 }}>
            <Field label="Date" name={`${p}_date`} type="date" value={data[`${p}_date`]} onChange={onChange} />
            <Field label="Subject(s)" name={`${p}_subject`} value={data[`${p}_subject`]} onChange={onChange} placeholder="e.g. Maths, English" />
            <Field label="Reviewed By" name={`${p}_reviewer`} value={data[`${p}_reviewer`]} onChange={onChange} />
          </div>
        </div>
      </Card>

      <Card>
        <SectionHeader title="Checklist" color={C.ink} />
        <div>
          {checkItems.map((item, i) => (
            <CheckItem key={i} label={item} name={`${p}_check_${i}`}
              value={data[`${p}_check_${i}`]} onChange={onChange} />
          ))}
        </div>
      </Card>

      <Card>
        <SectionHeader title="Observations & Evidence" color={C.teal} />
        <div style={{ padding: "14px 16px" }}>
          <Field label="What is working well (strengths)" name={`${p}_strengths`}
            value={data[`${p}_strengths`]} onChange={onChange} multiline
            placeholder="Strengths observed..." />
          <Field label="Evidence / Notes" name={`${p}_notes`}
            value={data[`${p}_notes`]} onChange={onChange} multiline
            placeholder="Additional observations and evidence..." />
        </div>
      </Card>

      <Card>
        <SectionHeader title="Next Step & Follow-Up" color={C.rose} />
        <div style={{ padding: "14px 16px" }}>
          <NextStepBox name={`${p}_next_step`} value={data[`${p}_next_step`]} onChange={onChange} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field label="Agreed Timescale" name={`${p}_timescale`}
              value={data[`${p}_timescale`]} onChange={onChange} placeholder="e.g. By Spring 1" />
            <Field label="Support Offered" name={`${p}_support`}
              value={data[`${p}_support`]} onChange={onChange} placeholder="e.g. Walkthru, peer observation" />
          </div>
          <FollowUpBox prefix={p} data={data} onChange={onChange} />
          <TeacherResponse prefix={p} value={data[`${p}_teacher_response`]} onChange={onChange} />
          <Sigs prefix={p} data={data} onChange={onChange} />
        </div>
      </Card>
    </div>
  );
}

function LearningWalk({ num, title, focusBadges, checkItems, data, onChange }) {
  const p = `lw${num}`;
  return (
    <div>
      <Card>
        <SectionHeader title={`Learning Walk ${num} — ${title}`} color={C.slate} icon="👁" />
        <div style={{ padding: "16px 16px 4px" }}>
          {focusBadges.map(([t, bg, fg]) => <FocusBadge key={t} text={t} bg={bg} fg={fg || C.white} />)}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, marginTop: 12 }}>
            <Field label="Date" name={`${p}_date`} type="date" value={data[`${p}_date`]} onChange={onChange} />
            <Field label="Subject" name={`${p}_subject`} value={data[`${p}_subject`]} onChange={onChange} />
            <Field label="Observer" name={`${p}_observer`} value={data[`${p}_observer`]} onChange={onChange} />
            <Field label="Focus / Purpose" name={`${p}_focus`} value={data[`${p}_focus`]} onChange={onChange} />
          </div>
        </div>
      </Card>

      <Card>
        <SectionHeader title="Checklist" color={C.ink} />
        <div>
          {checkItems.map((item, i) => (
            <CheckItem key={i} label={item} name={`${p}_check_${i}`}
              value={data[`${p}_check_${i}`]} onChange={onChange} />
          ))}
        </div>
      </Card>

      <Card>
        <SectionHeader title="What We Saw" color={C.teal} />
        <div style={{ padding: "14px 16px" }}>
          <Field label="Observations" name={`${p}_observations`}
            value={data[`${p}_observations`]} onChange={onChange} multiline
            placeholder="What was observed during the walk..." />
          <Field label="What is working well" name={`${p}_strengths`}
            value={data[`${p}_strengths`]} onChange={onChange} multiline
            placeholder="Strengths..." />
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: C.muted, display: "block", marginBottom: 6 }}>
              Consistency Check
            </label>
            <RadioGroup name={`${p}_consistency`} value={data[`${p}_consistency`]} onChange={onChange}
              options={["Consistent with school expectations", "Some inconsistency", "Not yet consistent"]} />
          </div>
        </div>
      </Card>

      <Card>
        <SectionHeader title="Next Step & Follow-Up" color={C.rose} />
        <div style={{ padding: "14px 16px" }}>
          <NextStepBox name={`${p}_next_step`} value={data[`${p}_next_step`]} onChange={onChange} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field label="Agreed Timescale" name={`${p}_timescale`} value={data[`${p}_timescale`]} onChange={onChange} />
            <Field label="Support Offered" name={`${p}_support`} value={data[`${p}_support`]} onChange={onChange} />
          </div>
          <FollowUpBox prefix={p} data={data} onChange={onChange} />
          <TeacherResponse prefix={p} value={data[`${p}_teacher_response`]} onChange={onChange} />
          <Sigs prefix={p} data={data} onChange={onChange} />
        </div>
      </Card>
    </div>
  );
}

function PupilVoice({ data, onChange }) {
  const sessions = [
    {
      id: "pv1", title: "Session 1 - Autumn 2 (Adaptive Teaching & Oracy)",
      badges: [["Adaptive Teaching", C.teal], ["Oracy", C.rose]],
      questions: [
        "What are you learning about right now?",
        "What do you do if you are stuck?",
        "How does your teacher help you learn?",
        "Overall impression / notes"
      ]
    },
    {
      id: "pv2", title: "Session 2 - Spring 2 (Oracy Focus)",
      badges: [["Oracy", C.rose]],
      questions: [
        "Can you explain your thinking to me?",
        "How do you know you are getting better?",
        "Can you show me your best work? Why is it good?",
        "Overall impression / notes"
      ]
    }
  ];

  return (
    <div>
      {sessions.map(s => (
        <Card key={s.id}>
          <div style={{ background: C.roseL, borderBottom: `2px solid ${C.rose}`, padding: "10px 14px" }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: C.rose, marginBottom: 6 }}>{s.title}</div>
            {s.badges.map(([t, bg]) => <FocusBadge key={t} text={t} bg={bg} />)}
          </div>
          <div style={{ padding: "14px 16px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
              <Field label="Date" name={`${s.id}_date`} type="date" value={data[`${s.id}_date`]} onChange={onChange} />
              <Field label="Children Spoken To" name={`${s.id}_children`} value={data[`${s.id}_children`]} onChange={onChange} placeholder="e.g. 3 mixed-attainment pupils" />
              <Field label="Conducted By" name={`${s.id}_by`} value={data[`${s.id}_by`]} onChange={onChange} />
            </div>
            {s.questions.map((q, i) => (
              <div key={i} style={{ borderLeft: `3px solid ${C.teal}`, paddingLeft: 12, marginBottom: 12, background: i % 2 === 0 ? C.tealL : C.cream, padding: "10px 12px", borderRadius: "0 6px 6px 0" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.teal, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>{q}</div>
                <textarea
                  rows={2} value={data[`${s.id}_q${i}`] || ""}
                  onChange={e => onChange(`${s.id}_q${i}`, e.target.value)}
                  placeholder="Response..."
                  style={{
                    width: "100%", padding: "7px 10px",
                    border: `1.5px solid rgba(42,107,107,0.25)`, borderRadius: 6,
                    background: "rgba(255,255,255,0.7)", color: C.ink, fontSize: 13,
                    outline: "none", resize: "vertical"
                  }}
                />
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}

function FollowUpLog({ data, onChange }) {
  const outcomes = [
    "Next step addressed - no further action needed",
    "Progress made - continue to monitor at next event",
    "Further support needed - discuss with line manager"
  ];
  return (
    <div>
      <div style={{ background: C.ink, color: "#8FA0B0", borderRadius: 8, padding: "12px 16px", marginBottom: 16, fontSize: 13, lineHeight: 1.6 }}>
        Follow-up checks are a supportive, low-stakes part of the cycle. Complete only when a next step has not been addressed by the following monitoring event.
      </div>
      {[1, 2, 3].map(n => {
        const p = `fu${n}`;
        return (
          <Card key={n}>
            <div style={{ background: C.slate, color: C.white, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 700, fontSize: 13 }}>Follow-Up Check {n}</span>
              <span style={{ fontSize: 11, opacity: 0.6 }}>Complete only if required</span>
            </div>
            <div style={{ padding: "14px 16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                <Field label="Date of Follow-Up" name={`${p}_date`} type="date" value={data[`${p}_date`]} onChange={onChange} />
                <Select label="Original Monitoring Event" name={`${p}_event`} value={data[`${p}_event`]} onChange={onChange}
                  options={["- Select -", "Book Look 1", "Learning Walk 1", "Book Look 2", "Learning Walk 2", "Book Look 3", "Learning Walk 3"]} />
                <Field label="Conducted By" name={`${p}_by`} value={data[`${p}_by`]} onChange={onChange} />
              </div>
              <Field label="Next Step Being Followed Up" name={`${p}_next_step`}
                value={data[`${p}_next_step`]} onChange={onChange} multiline
                placeholder="Copy the original next step here..." />
              <Field label="What Did You See / Find?" name={`${p}_findings`}
                value={data[`${p}_findings`]} onChange={onChange} multiline
                placeholder="Brief observations from the follow-up check..." />
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: C.muted, display: "block", marginBottom: 6 }}>Outcome</label>
                <RadioGroup name={`${p}_outcome`} value={data[`${p}_outcome`]} onChange={onChange} options={outcomes} />
              </div>
              <Field label="Further Support Agreed (if needed)" name={`${p}_support`}
                value={data[`${p}_support`]} onChange={onChange} multiline
                placeholder="What further support will be put in place?" />
              <TeacherResponse prefix={p} value={data[`${p}_teacher_response`]} onChange={onChange} />
              <Sigs prefix={p} data={data} onChange={onChange} />
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function YearSummary({ data, onChange }) {
  const events = [
    { label: "Book Look 1", term: "Autumn 1", focus: "Feedback & Marking", color: C.gold },
    { label: "Learning Walk 1", term: "Autumn 2", focus: "Adaptive Teaching", color: C.slate },
    { label: "Pupil Voice 1", term: "Autumn 2", focus: "Oracy & Adaptive", color: C.rose },
    { label: "Book Look 2", term: "Spring 1", focus: "Feedback & Progress", color: C.gold },
    { label: "Learning Walk 2", term: "Spring 2", focus: "Oracy", color: C.slate },
    { label: "Pupil Voice 2", term: "Spring 2", focus: "Oracy", color: C.rose },
    { label: "Book Look 3", term: "Summer 1", focus: "Depth & Coverage", color: C.gold },
    { label: "Learning Walk 3", term: "Summer 1", focus: "Independence", color: C.slate },
  ];

  return (
    <div>
      <Card>
        <SectionHeader title="At a Glance - Full Year Tracker" color={C.ink} icon="📋" />
        <div style={{ padding: 0 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.6fr 0.7fr 1.2fr 2fr 0.8fr", background: C.ink, padding: "8px 14px", gap: 8 }}>
            {["Event", "Term", "Focus", "Summary / Next Step", "Status"].map(h => (
              <div key={h} style={{ fontSize: 10, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: "0.07em" }}>{h}</div>
            ))}
          </div>
          {events.map((ev, i) => (
            <div key={i} style={{
              display: "grid", gridTemplateColumns: "1.6fr 0.7fr 1.2fr 2fr 0.8fr",
              padding: "8px 14px", gap: 8, alignItems: "center",
              background: i % 2 === 0 ? C.white : C.cream,
              borderBottom: `1px solid ${C.border}`
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: ev.color, flexShrink: 0 }} />
                <span style={{ fontWeight: 600, fontSize: 12 }}>{ev.label}</span>
              </div>
              <span style={{ fontSize: 11, color: C.muted }}>{ev.term}</span>
              <span style={{ fontSize: 11, color: C.muted }}>{ev.focus}</span>
              <input
                value={data[`ov_summary_${i}`] || ""}
                onChange={e => onChange(`ov_summary_${i}`, e.target.value)}
                placeholder="Brief outcome / next step..."
                style={{ width: "100%", padding: "5px 8px", border: `1px solid ${C.border}`, borderRadius: 4, background: "transparent", fontSize: 12, outline: "none", color: C.ink }}
              />
              <select
                value={data[`ov_status_${i}`] || ""}
                onChange={e => onChange(`ov_status_${i}`, e.target.value)}
                style={{ padding: "5px 6px", border: `1px solid ${C.border}`, borderRadius: 4, background: "transparent", fontSize: 11, outline: "none" }}
              >
                {["- Status -", "Complete", "Follow-Up", "Pending"].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionHeader title="End-of-Year Summary" color={C.teal} />
        <div style={{ padding: "14px 16px" }}>
          <Field label="Overall strengths identified across the year" name="ey_strengths"
            value={data.ey_strengths} onChange={onChange} multiline
            placeholder="What has this teacher done consistently well?" />
          <Field label="Areas of greatest growth since September" name="ey_growth"
            value={data.ey_growth} onChange={onChange} multiline
            placeholder="Where has the teacher made the most progress?" />
          <Field label="Priorities to carry into 2026-27" name="ey_priorities"
            value={data.ey_priorities} onChange={onChange} multiline
            placeholder="What should be the focus next year?" />
          <div style={{ borderLeft: `4px solid ${C.teal}`, padding: "10px 14px", background: C.tealL, borderRadius: "0 6px 6px 0" }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: C.teal, textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 6 }}>
              Teacher Response - End of Year
            </label>
            <textarea rows={3} value={data.ey_teacher_response || ""}
              onChange={e => onChange("ey_teacher_response", e.target.value)}
              placeholder="Teacher's own reflection on the year's monitoring..."
              style={{ width: "100%", padding: "8px 10px", border: `1.5px solid rgba(42,107,107,0.25)`, borderRadius: 6, background: "rgba(255,255,255,0.7)", color: C.ink, fontSize: 13, outline: "none", resize: "vertical" }}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}

// ── TABS CONFIG ──────────────────────────────────────────────────────────────
const TABS = [
  { id: "overview",  label: "📋 Overview" },
  { id: "bl1",       label: "📚 Book Look 1" },
  { id: "lw1",       label: "👁 Walk 1" },
  { id: "bl2",       label: "📚 Book Look 2" },
  { id: "lw2",       label: "👁 Walk 2" },
  { id: "bl3",       label: "📚 Book Look 3" },
  { id: "lw3",       label: "👁 Walk 3" },
  { id: "pv",        label: "💬 Pupil Voice" },
  { id: "followups", label: "🔁 Follow-Ups" },
];

// ── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const teacherId = getTeacherId();
  const [data, setData] = useState({});
  const [activeTab, setActiveTab] = useState("overview");
  const [saveStatus, setSaveStatus] = useState("idle"); // idle | saving | saved | error
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const saveTimer = useRef(null);

  // Load on mount
  useEffect(() => {
    if (!teacherId) { setLoading(false); setNotFound(true); return; }
    fetch(`/api/portfolio/${teacherId}`)
      .then(r => {
        if (r.status === 404) { setNotFound(false); setLoading(false); return null; }
        return r.json();
      })
      .then(d => {
        if (d) setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [teacherId]);

  // Auto-save with 1.5s debounce
  const save = useCallback(async (latest) => {
    if (!teacherId) return;
    setSaveStatus("saving");
    try {
      const r = await fetch(`/api/portfolio/${teacherId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(latest),
      });
      if (!r.ok) throw new Error();
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2500);
    } catch {
      setSaveStatus("error");
    }
  }, [teacherId]);

  const handleChange = useCallback((name, value) => {
    setData(prev => {
      const next = { ...prev, [name]: value };
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => save(next), 1500);
      return next;
    });
    setSaveStatus("idle");
  }, [save]);

  // ── Cover / teacher meta ─────────────────────────────────────────────────
  const coverFields = [
    { label: "Teacher Name", name: "cover_teacher", placeholder: "Full name" },
    { label: "Class / Year Group", name: "cover_class", placeholder: "e.g. Year 3 Maple" },
    { label: "Phase / Key Stage", name: "cover_phase", placeholder: "e.g. KS2 / EYFS" },
    { label: "Line Manager", name: "cover_manager", placeholder: "Name" },
  ];

  if (!teacherId) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, padding: 32 }}>
      <div style={{ fontSize: 48 }}>🔗</div>
      <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: C.ink }}>No teacher link found</h1>
      <p style={{ color: C.muted, textAlign: "center", maxWidth: 400, fontSize: 14 }}>
        This page should be accessed via a unique link, for example:<br />
        <code style={{ background: C.warm, padding: "3px 8px", borderRadius: 4, fontSize: 13 }}>yourschool.pages.dev/portfolio/miss-amy</code>
      </p>
    </div>
  );

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
      <Loader size={32} color={C.gold} style={{ animation: "spin 1s linear infinite" }} />
      <p style={{ color: C.muted }}>Loading portfolio...</p>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: C.cream, paddingBottom: 80 }}>

      {/* ── COVER BAR ── */}
      <div style={{ background: C.ink, padding: "0 0 24px" }}>
        <div style={{ background: C.gold, height: 4 }} />
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 24px 0" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: C.gold, marginBottom: 6 }}>
                Academic Year 2025-2026 · Monitoring Portfolio
              </div>
              <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 700, color: C.white, lineHeight: 1.1 }}>
                Teacher Monitoring <span style={{ color: C.gold, fontStyle: "italic" }}>Portfolio</span>
              </h1>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
              {[["Feedback & Marking", C.gold, C.ink], ["Adaptive Teaching", C.teal, C.white], ["Oracy", C.rose, C.white]].map(([t, bg, fg]) => (
                <span key={t} style={{ background: bg, color: fg, borderRadius: 4, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>{t}</span>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "12px 20px" }}>
            {coverFields.map(f => (
              <div key={f.name}>
                <label style={{ display: "block", fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#6A8099", marginBottom: 4 }}>{f.label}</label>
                <input
                  value={data[f.name] || ""} placeholder={f.placeholder}
                  onChange={e => handleChange(f.name, e.target.value)}
                  style={{ background: "transparent", border: "none", borderBottom: "1px solid rgba(255,255,255,0.2)", color: C.white, fontFamily: "'DM Sans', sans-serif", fontSize: 14, padding: "4px 0", width: "100%", outline: "none" }}
                  onFocus={e => e.target.style.borderColor = C.gold}
                  onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.2)"}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── STICKY TABS + SAVE ── */}
      <div className="no-print" style={{
        position: "sticky", top: 0, zIndex: 100,
        background: C.ink, borderBottom: `2px solid rgba(255,255,255,0.08)`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 24px", maxWidth: "100%", overflowX: "auto"
      }}>
        <div style={{ display: "flex", gap: 2, overflowX: "auto" }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              background: activeTab === t.id ? C.gold : "transparent",
              color: activeTab === t.id ? C.ink : "#8FA0B0",
              border: "none", padding: "12px 14px", fontSize: 12, fontWeight: activeTab === t.id ? 700 : 400,
              cursor: "pointer", whiteSpace: "nowrap", borderBottom: `3px solid ${activeTab === t.id ? C.gold : "transparent"}`,
              transition: "all 0.15s"
            }}>{t.label}</button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, paddingLeft: 16, flexShrink: 0 }}>
          {saveStatus === "saving" && <><Loader size={14} color="#8FA0B0" /><span style={{ fontSize: 11, color: "#8FA0B0" }}>Saving...</span></>}
          {saveStatus === "saved" && <><CheckCircle size={14} color={C.green} /><span style={{ fontSize: 11, color: C.green }}>Saved</span></>}
          {saveStatus === "error" && <><AlertCircle size={14} color={C.rose} /><span style={{ fontSize: 11, color: C.rose }}>Error saving</span></>}
          <button
            onClick={() => save(data)}
            style={{ background: C.gold, color: C.ink, border: "none", borderRadius: 6, padding: "7px 14px", fontWeight: 700, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
          >
            <Save size={13} /> Save
          </button>
          <button
            onClick={() => window.print()}
            style={{ background: "transparent", color: "#8FA0B0", border: `1px solid rgba(255,255,255,0.15)`, borderRadius: 6, padding: "7px 12px", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
          >
            <Printer size={13} /> Print
          </button>
        </div>
      </div>

      {/* ── PANEL CONTENT ── */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 24px 0" }}>

        {activeTab === "overview" && <YearSummary data={data} onChange={handleChange} />}

        {activeTab === "bl1" && <BookLook num={1} title="Establishing Expectations"
          focuses={[["Feedback & Marking", C.gold, C.ink]]}
          checkItems={[
            "Books set up consistently and presented well",
            "Teacher feedback visible in books",
            "Feedback is specific and moves learning forward",
            "Children responding to feedback (purple pen etc.)",
            "Age-appropriate expectations evident",
            "Work matches planning and objectives",
          ]}
          data={data} onChange={handleChange} />}

        {activeTab === "lw1" && <LearningWalk num={1} title="Adaptive Teaching in Action"
          focusBadges={[["Adaptive Teaching", C.teal]]}
          checkItems={[
            "Challenge structure visible on board (Mild/Spicy/Hot or Core/Deepen/Challenge)",
            "All children accessing appropriate level of challenge",
            "Children moving between levels independently",
            "Teacher circulating and adapting support live",
            "Input phase concise (10-15 mins max)",
            "Children working independently and at pace",
            "Reasoning / explanation expected, not just fluency",
          ]}
          data={data} onChange={handleChange} />}

        {activeTab === "bl2" && <BookLook num={2} title="Progress Over Time & Feedback Quality"
          focuses={[["Feedback & Marking", C.gold, C.ink], ["Adaptive Teaching", C.teal]]}
          checkItems={[
            "Clear progress evident since Autumn",
            "Feedback has moved learning forward",
            "Children responding to feedback",
            "Variation in challenge visible across books",
            "Written output grown in quantity and quality",
            "Book Look 1 next step addressed",
            "Planning matches curriculum coverage",
          ]}
          data={data} onChange={handleChange} />}

        {activeTab === "lw2" && <LearningWalk num={2} title="Oracy & Talk in Learning"
          focusBadges={[["Oracy", C.rose]]}
          checkItems={[
            "Structured talk built into the lesson purposefully",
            "Talk partners used effectively",
            "Sentence stems displayed and used by children",
            "Subject vocabulary used accurately in discussion",
            "Discussion deepens understanding (not superficial)",
            "Children can explain their thinking clearly",
            "Teacher questioning promotes extended responses",
          ]}
          data={data} onChange={handleChange} />}

        {activeTab === "bl3" && <BookLook num={3} title="Depth, Challenge & Curriculum Coverage"
          focuses={[["Feedback & Marking", C.gold, C.ink], ["Adaptive Teaching", C.teal]]}
          checkItems={[
            "Curriculum covered - clear progression through the year",
            "Challenge evident across all attainment groups",
            "Written output grown in quantity and quality since September",
            "Mathematical / subject vocabulary in children's writing",
            "Evidence of reasoning in books",
            "Book Look 2 next step addressed",
            "Feedback quality maintained / improved",
          ]}
          data={data} onChange={handleChange} />}

        {activeTab === "lw3" && <LearningWalk num={3} title="Consolidation & Independence"
          focusBadges={[["Adaptive Teaching", C.teal], ["Oracy", C.rose]]}
          checkItems={[
            "Children working independently and at pace",
            "Teacher talk has reduced since Autumn",
            "Pupils self-selecting challenge without being directed",
            "Children less reliant on adults for next steps",
            "Oracy is a natural part of learning, not bolted on",
            "Learning Walk 2 next step addressed",
          ]}
          data={data} onChange={handleChange} />}

        {activeTab === "pv" && <PupilVoice data={data} onChange={handleChange} />}
        {activeTab === "followups" && <FollowUpLog data={data} onChange={handleChange} />}

      </div>
    </div>
  );
}
