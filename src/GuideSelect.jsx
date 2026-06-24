// GuideSelect.jsx — renders RXP guide names with their |T<fileId>:0|t icons as
// real images, and a custom dropdown (native <option> can't show images) for
// switching between sub-guides in a multi-guide file.
import { useState, useRef, useEffect } from "react";
import GameData from "./gamedata.js";

// Parse an RXP display string into ordered parts: text runs and icon tokens.
// Handles |T<fileId>:0|t (icon by FileDataID) and strips colour codes
// |cXXXXXXXX...|r → inner text. Returns [{text}|{icon:fileId}].
export function parseRxpName(str) {
  if (!str) return [];
  // Remove colour wrappers but keep their inner text.
  let s = str.replace(/\|c[0-9A-Za-z_]+_?/g, "").replace(/\|r/g, "");
  const parts = [];
  const re = /\|T(\d+):\d+\|t|\|T[^|]+\|t/g;
  let last = 0, m;
  while ((m = re.exec(s)) !== null) {
    if (m.index > last) parts.push({ text: s.slice(last, m.index) });
    if (m[1]) parts.push({ icon: Number(m[1]) });   // numeric FileDataID icon
    // non-numeric texture tokens (e.g. chatbubble path) are dropped
    last = re.lastIndex;
  }
  if (last < s.length) parts.push({ text: s.slice(last) });
  return parts;
}

// Render a parsed RXP name inline with icon images.
export function GuideName({ str, iconSize = 14 }) {
  const parts = parseRxpName(str);
  return (
    <span className="rxp-name">
      {parts.map((p, i) => {
        if (p.text != null) return <span key={i}>{p.text}</span>;
        const url = GameData.loaded ? GameData.iconUrl(p.icon) : null;
        if (!url) return <span key={i} className="rxp-icon-missing" title={`icon ${p.icon}`} />;
        return (
          <img
            key={i}
            src={url}
            alt=""
            className="rxp-inline-icon"
            style={{ width: iconSize, height: iconSize }}
            onError={(e) => { e.currentTarget.style.display = "none"; }}
          />
        );
      })}
    </span>
  );
}

// Custom dropdown that shows guide names with rendered icons + step counts.
// Also hosts sub-guide management: a "+ New sub-guide" row at the bottom,
// and a small delete icon per row (with an inline confirm step) — this is
// the one place that lists every sub-guide, so it's the natural home for
// adding/removing them too.
export function GuideSelect({ guides, activeIndex, editsFor, onSelect, onAdd, onDelete, fileName }) {
  const [open, setOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    function onDoc(e) {
      if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setPendingDelete(null); }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const active = guides[activeIndex];
  const label = (g) => g.name || g.title || "Untitled guide";

  return (
    <div className="guide-dd" ref={ref}>
      <button className="guide-dd-btn" onClick={() => setOpen(o => !o)}
        title={fileName ? `${fileName} — switch or manage sub-guides` : "Switch or manage sub-guides"}>
        <GuideName str={label(active)} />
        <span className="guide-dd-meta">· {active.steps.length} steps</span>
        <span className="guide-dd-caret">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="guide-dd-menu">
          {guides.map((g, i) => {
            const edits = editsFor(i);
            const confirming = pendingDelete === i;
            return (
              <div
                key={i}
                className={"guide-dd-row" + (i === activeIndex ? " active" : "")}
                onClick={() => { if (!confirming) { onSelect(i); setOpen(false); } }}
              >
                <GuideName str={label(g)} />
                <span className="guide-dd-meta">
                  {edits > 0 ? <span className="guide-dd-edits">✎{edits}</span> : null}
                  · {g.steps.length} steps
                </span>
                {confirming ? (
                  <span className="guide-dd-confirm" onClick={e => e.stopPropagation()}>
                    <button className="guide-dd-icon-btn guide-dd-confirm-yes" title="Confirm delete"
                      onClick={() => { onDelete(i); setPendingDelete(null); }}>✓</button>
                    <button className="guide-dd-icon-btn" title="Cancel"
                      onClick={() => setPendingDelete(null)}>✕</button>
                  </span>
                ) : (
                  <button
                    className="guide-dd-icon-btn"
                    disabled={guides.length <= 1}
                    title={guides.length <= 1 ? "Can't delete the only guide in this file" : "Delete this sub-guide"}
                    onClick={e => { e.stopPropagation(); setPendingDelete(i); }}
                  >
                    🗑
                  </button>
                )}
              </div>
            );
          })}
          <div className="guide-dd-add" onClick={() => { onAdd(); setOpen(false); }}>
            + New sub-guide
          </div>
        </div>
      )}
    </div>
  );
}
