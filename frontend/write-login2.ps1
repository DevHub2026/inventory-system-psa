$file = "src\index.css"
$enc  = [System.Text.Encoding]::UTF8
$lines = [System.IO.File]::ReadAllLines($file, $enc)

$startIdx = -1; $endIdx = -1
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($startIdx -eq -1 -and $lines[$i] -match '^\s*/\* LOGIN PAGE') { $startIdx = $i }
    if ($startIdx -ge 0  -and $endIdx -eq -1 -and $lines[$i] -match '19\. DASHBOARD') { $endIdx = $i - 1 }
}
Write-Host "Replacing lines $startIdx to $endIdx"

$css = @'
/* LOGIN PAGE
   ================================================================
   Two-column: 44% blue brand panel / 56% light login panel.
   All content centred in both panels.
   Simple PSA-colour accents on the right panel for visual interest.
   ================================================================ */

/* -- html/body reset for auth pages ----------------------------- */
html:has(.auth-page),
html:has(.auth-page) body,
html:has(.auth-page) #root {
  height: 100%;
  height: 100dvh;
  max-height: 100dvh;
  width: 100%;
  min-height: 100%;
  overflow-x: hidden;
}

/* -- Page shell ------------------------------------------------- */
.auth-page {
  --auth-blue:   #003da5;
  --auth-bright: #0b6fe8;
  --auth-yellow: #f9c900;
  --auth-red:    #e51c23;
  position: fixed;
  inset: 0;
  display: grid;
  grid-template-columns: 44% 56%;
  min-height: 100dvh;
  overflow: hidden;
}

/* ================================================================
   LEFT PANEL — PSA deep blue branding
   ================================================================ */
.auth-brand-panel {
  position: relative;
  overflow: hidden;
  background: linear-gradient(150deg,
    #1462d4 0%,
    #0049b8 28%,
    #003da5 54%,
    #002680 100%
  );
}

/* Inner light — soft radial burst top-left */
.auth-brand-panel::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse 70% 58% at 14% 10%,
    rgba(55, 135, 245, .44) 0%,
    transparent 62%
  );
  pointer-events: none;
  z-index: 0;
}

/* Fine dot-grid texture — subtle professional depth */
.auth-brand-panel::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(circle, rgba(255,255,255,.10) 1px, transparent 1px);
  background-size: 28px 28px;
  pointer-events: none;
  z-index: 0;
}

/* Ambient glow ball — top-right of panel */
.auth-brand-glow {
  position: absolute;
  top: -90px;
  right: -90px;
  width: 340px;
  height: 340px;
  border-radius: 50%;
  background: radial-gradient(circle,
    rgba(90, 170, 255, .20) 0%,
    transparent 68%
  );
  pointer-events: none;
  z-index: 1;
}

/* ── Brand content — fully centred ────────────────────────────── */
.auth-brand-content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;       /* horizontal centre */
  justify-content: center;   /* vertical centre   */
  width: 100%;
  min-height: 100%;
  padding: 48px clamp(20px, 5vw, 72px);
  color: #fff;
  text-align: center;
}

/* PSA logo */
.auth-brand-logo {
  width: clamp(108px, 10vw, 160px);
  height: auto;
  filter: drop-shadow(0 6px 20px rgba(0, 14, 60, .36));
}

/* Title */
.auth-brand-title {
  display: grid;
  margin: clamp(20px, 2.4vw, 36px) 0 0;
  color: #fff;
  font-size: clamp(26px, 2.8vw, 48px);
  font-weight: 800;
  letter-spacing: .025em;
  line-height: 1.06;
  text-align: center;
  text-transform: uppercase;
}
.auth-brand-title span { display: block; }

/* Three PSA colour bars — centred under title */
.auth-brand-bars {
  display: flex;
  width: clamp(140px, 14vw, 210px);
  gap: 6px;
  margin: clamp(16px, 1.8vw, 26px) auto 0;  /* auto left/right = centred */
}
.auth-brand-bars span { height: 4px; flex: 1; border-radius: 99px; }
.auth-brand-bars span:nth-child(1) { background: #5cc4ff; }
.auth-brand-bars span:nth-child(2) { background: var(--auth-yellow); }
.auth-brand-bars span:nth-child(3) { background: #ff4a52; }

/* Tagline — centred, never wraps */
.auth-brand-tagline {
  margin: 12px 0 0;
  color: rgba(255,255,255,.82);
  font-size: clamp(12px, 1.05vw, 15px);
  font-weight: 400;
  line-height: 1.5;
  text-align: center;
  white-space: nowrap;
}
.auth-brand-tagline b {
  margin: 0 .18em;
  color: rgba(255,255,255,.96);
  font-weight: 700;
}

/* ================================================================
   RIGHT PANEL — light login area with PSA colour accents
   ================================================================ */
.auth-login-panel {
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 0;
  padding: 48px clamp(20px, 5vw, 88px);
  background: #f0f4fb;
}

/* Layered background — very subtle blue gradient */
.auth-login-panel::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 60% 50% at 80%  5%, rgba(14,75,181,.07) 0%, transparent 65%),
    radial-gradient(ellipse 55% 45% at 20% 95%, rgba(14,75,181,.06) 0%, transparent 65%);
  pointer-events: none;
  z-index: 0;
}

/* ── PSA corner accents ──────────────────────────────────────────
   Three thin horizontal bars in PSA colours sit at the top-left
   and bottom-right corners of the login panel.  Simple, clean,
   on-brand.  No diagonal shapes, no complexity.
   ─────────────────────────────────────────────────────────────── */
.auth-corner-accent {
  position: absolute;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 5px;
  pointer-events: none;
}

/* Each bar */
.auth-corner-accent span {
  display: block;
  border-radius: 99px;
}

/* Top-left — three horizontal bars, stacked */
.auth-corner-accent--tl {
  top: 28px;
  left: 28px;
}
.auth-corner-accent--tl span:nth-child(1) { width: 36px; height: 4px; background: #0b6fe8; }
.auth-corner-accent--tl span:nth-child(2) { width: 24px; height: 4px; background: var(--auth-yellow); }
.auth-corner-accent--tl span:nth-child(3) { width: 16px; height: 4px; background: var(--auth-red); }

/* Bottom-right — mirrored, right-aligned */
.auth-corner-accent--br {
  bottom: 28px;
  right: 28px;
  align-items: flex-end;
}
.auth-corner-accent--br span:nth-child(1) { width: 36px; height: 4px; background: #0b6fe8; }
.auth-corner-accent--br span:nth-child(2) { width: 24px; height: 4px; background: var(--auth-yellow); }
.auth-corner-accent--br span:nth-child(3) { width: 16px; height: 4px; background: var(--auth-red); }

/* ── Floating orbs — very faint ambient colour ───────────────── */
.auth-orb {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  z-index: 0;
}
.auth-orb--blue {
  width: 280px;
  height: 280px;
  top: -80px;
  right: -60px;
  background: radial-gradient(circle, rgba(11,111,232,.09) 0%, transparent 70%);
}
.auth-orb--yellow {
  width: 200px;
  height: 200px;
  bottom: -50px;
  left: 10%;
  background: radial-gradient(circle, rgba(249,201,0,.08) 0%, transparent 70%);
}

/* ── Login card ─────────────────────────────────────────────────
   Clean white card, centred, soft shadow, rounded.
   z-index 20 — always above all decorative elements.
   ─────────────────────────────────────────────────────────────── */
.auth-card {
  position: relative;
  z-index: 20;
  width: min(100%, 520px);
  padding: clamp(30px, 3.6vw, 54px) clamp(26px, 3.6vw, 54px) clamp(26px, 3.2vw, 48px);
  border: 1px solid rgba(210, 224, 244, .85);
  border-radius: 20px;
  background: #ffffff;
  box-shadow:
    0 2px  4px rgba(10, 36, 90, .04),
    0 8px 20px rgba(10, 36, 90, .07),
    0 24px 50px rgba(10, 36, 90, .10);
}

/* Card PSA logo */
.auth-card-logo {
  display: block;
  width: clamp(60px, 5vw, 82px);
  margin: 0 auto clamp(12px, 1.4vw, 20px);
  filter: drop-shadow(0 2px 6px rgba(0, 26, 96, .10));
}

/* Card heading */
.auth-card-header h2 {
  margin: 0;
  color: #063491;
  font-size: clamp(16px, 1.55vw, 23px);
  font-weight: 800;
  letter-spacing: -.01em;
  line-height: 1.22;
  text-align: center;
  text-transform: uppercase;
}

/* IMS subtitle with flanking lines */
.auth-subtitle {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: clamp(9px, 1.2vw, 16px);
}
.auth-subtitle span {
  height: 1px;
  flex: 1;
  background: linear-gradient(90deg, transparent, #c0d2ec);
}
.auth-subtitle span:last-child { transform: rotate(180deg); }
.auth-subtitle p {
  margin: 0;
  color: #4a6490;
  font-size: clamp(6.5px, .60vw, 10px);
  font-weight: 700;
  letter-spacing: clamp(2px, .22vw, 3.8px);
  line-height: 1.3;
  text-align: center;
  text-transform: uppercase;
  white-space: nowrap;
}

/* -- Form ------------------------------------------------------- */
.auth-form {
  display: grid;
  gap: 15px;
  margin-top: clamp(22px, 3vw, 40px);
}
.auth-input-wrapper { position: relative; }

.auth-input {
  width: 100%;
  height: clamp(50px, 4.3vw, 62px);
  padding: 0 52px;
  border: 1.5px solid #cfdaf0;
  border-radius: 12px;
  background: #f8fbff;
  color: #1a3460;
  font: 500 clamp(13.5px, 1.02vw, 15px) Inter, sans-serif;
  outline: none;
  transition: border-color .18s, box-shadow .18s, background .18s;
}
.auth-input::placeholder { color: #8fa6c8; opacity: 1; }
.auth-input:focus {
  background: #fff;
  border-color: var(--auth-bright) !important;
  box-shadow: 0 0 0 3px rgba(11,111,232,.12);
}

/* Input icons */
.auth-input-icon {
  position: absolute;
  top: 50%;
  display: grid;
  width: 20px;
  height: 20px;
  place-items: center;
  transform: translateY(-50%);
}
.auth-input-icon--left  { left: 17px; color: #3e6dc6; pointer-events: none; }
.auth-input-icon--right {
  right: 17px;
  border: 0; padding: 0;
  background: transparent;
  color: #90a5c4;
  cursor: pointer;
}
.auth-input-icon--right:hover { color: #3e6dc6; }

/* Forgot password */
.auth-forgot-row  { display: flex; justify-content: flex-end; margin-top: 2px; }
.auth-forgot-password {
  border: 0; padding: 0;
  background: transparent;
  color: #1455c8;
  font: 600 clamp(12px, .88vw, 13.5px) Inter, sans-serif;
  cursor: pointer;
}
.auth-forgot-password:hover { color: var(--auth-blue); text-decoration: underline; }

/* Feedback */
.auth-message { margin: -2px 0 0; font-size: 12.5px; font-weight: 600; line-height: 1.45; }
.auth-message--error   { color: #b42318; }
.auth-message--success { color: #087443; }

/* Sign In button */
.auth-submit {
  width: 100%;
  height: clamp(48px, 4.1vw, 60px);
  margin-top: clamp(4px, .6vw, 8px);
  border: 0;
  border-radius: 12px;
  background: linear-gradient(108deg, #063aa2 0%, #0b6fe8 100%);
  color: #fff;
  box-shadow: 0 4px 14px rgba(6,56,164,.28), 0 1px 3px rgba(6,56,164,.18);
  font: 700 clamp(13px, 1.05vw, 15.5px) Inter, sans-serif;
  letter-spacing: .08em;
  text-transform: uppercase;
  cursor: pointer;
  transition: filter .16s, transform .16s, box-shadow .16s;
}
.auth-submit:hover:not(:disabled) {
  filter: brightness(1.08);
  transform: translateY(-1px);
  box-shadow: 0 8px 22px rgba(6,56,164,.34);
}
.auth-submit:active:not(:disabled) { transform: translateY(0); filter: brightness(.97); }
.auth-submit:disabled { cursor: not-allowed; opacity: .60; }

/* -- Dot grids -------------------------------------------------- */
.auth-dot-grid {
  position: absolute;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(5, 5px);
  gap: 11px;
}
.auth-dot-grid span { width: 5px; height: 5px; border-radius: 50%; }
.auth-dot-grid--brand  { top: 22px; left: 28px; opacity: .35; }
.auth-dot-grid--brand span { background: #60b8ff; }
.auth-dot-grid--top    { top: 15%; right: 4%; }
.auth-dot-grid--bottom { bottom: 7%; left: 13%; }
.auth-dot-grid--top span,
.auth-dot-grid--bottom span { background: #2255b8; opacity: .38; }

/* -- Footer ----------------------------------------------------- */
.auth-footer {
  position: relative;
  z-index: 2;
  margin-top: clamp(14px, 2vw, 28px);
  color: #6878a0;
  font-size: 11.5px;
  text-align: center;
}

/* ================================================================
   RESPONSIVE
   ================================================================ */

/* -- 1050 px: slightly narrower left panel ---------------------- */
@media (max-width: 1050px) {
  .auth-page          { grid-template-columns: 42% 58%; }
  .auth-brand-content { padding: 44px clamp(16px, 4vw, 52px); }
  .auth-brand-tagline { font-size: 12px; }
  .auth-card          { border-radius: 18px; }
}

/* -- 900 px: stack into single column --------------------------- */
@media (max-width: 900px) {
  html:has(.auth-page),
  html:has(.auth-page) body,
  html:has(.auth-page) #root {
    height: auto;
    max-height: none;
    overflow: auto !important;
  }
  .auth-page           { position: relative; display: block; overflow: visible; }

  /* Brand panel — compact header */
  .auth-brand-panel    { min-height: 280px; }
  .auth-brand-content  {
    min-height: 280px;
    padding: 28px 24px 38px;
    justify-content: center;
  }
  .auth-brand-logo     { width: 80px; }
  .auth-brand-title    { font-size: clamp(20px, 5.5vw, 30px); margin-top: 12px; }
  .auth-brand-bars     { margin-top: 12px; }
  .auth-brand-tagline  { font-size: 12px; }
  .auth-brand-glow     { display: none; }

  /* Corner accents — hide on small screens */
  .auth-corner-accent  { display: none; }
  .auth-orb            { display: none; }

  /* Login panel */
  .auth-login-panel    { min-height: auto; padding: 28px 16px 22px; }
  .auth-card           { width: min(100%, 480px); padding: 24px 18px; border-radius: 16px; }
  .auth-card-logo      { width: 60px; }
  .auth-dot-grid--top,
  .auth-dot-grid--bottom { display: none; }
  .auth-footer         { font-size: 11px; }
}

/* -- 460 px: compact mobile ------------------------------------ */
@media (max-width: 460px) {
  .auth-brand-panel,
  .auth-brand-content  { min-height: 240px; }
  .auth-brand-title    { font-size: 23px; }
  .auth-brand-tagline  { font-size: 11px; }
  .auth-login-panel    { padding: 22px 10px 18px; }
  .auth-card           { padding: 20px 14px; border-radius: 14px; }
  .auth-card-header h2 { font-size: 15px; }
  .auth-subtitle       { gap: 6px; }
  .auth-subtitle p     { font-size: 6px; letter-spacing: 1.3px; }
  .auth-input,
  .auth-submit         { height: 47px; border-radius: 10px; }
}
'@

$before  = $lines[0..($startIdx - 1)]
$after   = $lines[($endIdx + 1)..($lines.Count - 1)]
$newLines = $before + $css.Split("`n") + $after
[System.IO.File]::WriteAllLines($file, $newLines, $enc)
Write-Host "Done. Total lines: $($newLines.Count)"
