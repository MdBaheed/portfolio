/**
 * Mohamed Baheed Portfolio - Interactive Engine
 * Multi-Stage Navigation, Dynamic Achievement Vault, SIH Project Deep Dives & Web Audio
 */

// ================= GLOBAL STATE =================
const STAGE_CONFIG = [
  { id: 1, name: "Identity & Vision", sectionId: "stage-1" },
  { id: 2, name: "Academic Honors", sectionId: "stage-2" },
  { id: 3, name: "Technical Skills", sectionId: "stage-3" },
  { id: 4, name: "Projects & SIH", sectionId: "stage-4" },
  { id: 5, name: "Certificates Vault", sectionId: "stage-5" },
  { id: 6, name: "Extracurricular", sectionId: "stage-6" },
  { id: 7, name: "Contact & Connect", sectionId: "stage-7" }
];

let currentStage = 1;
let isScrollMode = false;
let isSoundEnabled = true;

// Default Pre-loaded Certificates
// Default Pre-loaded Certificates with Verified Images & Credentials
const DEFAULT_CERTIFICATES = [
  {
    id: "cert-nptel-python",
    title: "Python for Data Science (Elite)",
    issuer: "NPTEL (IIT Madras / MoE)",
    category: "nptel",
    date: "Jul-Aug 2026",
    link: "https://nptel.ac.in/",
    code: "NPTEL26CS107S266800123",
    score: "62% Consolidated (Elite)",
    image: "assets/images/certificates/nptel-python.jpg",
    desc: "Elite certification funded by MoE, Govt. of India. Comprehensive data science curriculum in scientific Python, NumPy, Pandas, data wrangling, and analytics (Score: 62% - Roll: NPTEL26CS107S266800123)."
  },
  {
    id: "cert-hp-critical",
    title: "Critical Thinking in the AI Era",
    issuer: "HP LIFE / HP Foundation",
    category: "hp",
    date: "March 24, 2026",
    link: "https://www.life-global.org/",
    code: "f3d5728e-3279-419f-9de1-374fdcaa3330",
    image: "assets/images/certificates/hp-critical-thinking.jpg",
    desc: "Verified course completion on critical thinking, countering bias in decision-making, fact-checking AI-generated content, and practical evaluation tools (Certificate serial: f3d5728e-3279-419f-9de1-374fdcaa3330)."
  },
  {
    id: "cert-hp-ai-beginners",
    title: "AI for Beginners",
    issuer: "HP LIFE / HP Foundation",
    category: "hp",
    date: "April 28, 2026",
    link: "https://www.life-global.org/",
    code: "954c3584-cd96-4fa0-83d4-0b0c58d73818",
    image: "assets/images/certificates/hp-ai-beginners.jpg",
    desc: "Mastered fundamental concepts of Artificial Intelligence, business data strategies, machine learning paradigms, and ethical implications (Certificate serial: 954c3584-cd96-4fa0-83d4-0b0c58d73818)."
  },
  {
    id: "cert-simplilearn-dsa",
    title: "Basics of Data Structures & Algorithms",
    issuer: "Simplilearn SkillUp",
    category: "simplilearn",
    date: "13th October 2026",
    link: "https://www.simplilearn.com/",
    code: "10885388",
    image: "assets/images/certificates/simplilearn-dsa.jpg",
    desc: "Verified foundational course in arrays, linked lists, stacks, queues, trees, searching & sorting algorithms, and Big-O computational time & space complexity (Certificate code: 10885388)."
  },
  {
    id: "cert-hp-cybersecurity",
    title: "Introduction to Cybersecurity Awareness",
    issuer: "HP LIFE / HP Foundation",
    category: "hp",
    date: "March 24, 2026",
    link: "https://www.life-global.org/",
    code: "3c9d2534-25a0-41f9-86c8-7f69033873ec",
    image: "assets/images/certificates/hp-cybersecurity.jpg",
    desc: "Verified HP LIFE certification in cybersecurity awareness, fundamental threat models, data protection principles, credential hygiene, and digital risk mitigation (Certificate serial: 3c9d2534-25a0-41f9-86c8-7f69033873ec)."
  },
  {
    id: "cert-synkronix-prompt-clash",
    title: "SYNKRONIX'26 — Prompt Clash (Tech Event)",
    issuer: "Anna University Regional Campus Madurai",
    category: "symposium",
    date: "SYNKRONIX '26",
    link: "https://www.annauniv.edu/",
    image: "assets/images/certificates/synkronix-prompt-clash.jpg",
    desc: "National Level Technical Symposium Certificate of Participation for PROMPT CLASH (Tech Event) organized by the Department of Computer Science and Engineering & CSE (AI & ML), Anna University Regional Campus, Madurai."
  },
  {
    id: "cert-synkronix-mission-impossible",
    title: "SYNKRONIX'26 — Mission Impossible (Non-Tech Event)",
    issuer: "Anna University Regional Campus Madurai",
    category: "symposium",
    date: "SYNKRONIX '26",
    link: "https://www.annauniv.edu/",
    image: "assets/images/certificates/synkronix-mission-impossible.jpg",
    desc: "National Level Technical Symposium Certificate of Participation for MISSION IMPOSSIBLE (Non-Tech Event) organized by the Department of Computer Science and Engineering & CSE (AI & ML), Anna University Regional Campus, Madurai."
  }
];

// Project Modal Details Database
const PROJECT_DETAILS = {
  "sih-classroom": {
    title: "Smart Classroom Energy Management System",
    subtitle: "Smart India Hackathon (SIH) &bull; IoT & Intelligent Automation",
    icon: "fa-leaf",
    category: "Smart India Hackathon",
    body: `
      <div class="callout" style="background: rgba(63,167,107,0.12); border: 1px solid rgba(63,167,107,0.4); border-radius: 10px; padding: 14px 16px; margin-bottom: 20px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
        <div>
          <strong style="color: #5fd3d3; font-size: 1rem;"><i class="fa-solid fa-bolt"></i> Live Prototype Available!</strong>
          <p style="margin: 4px 0 0 0; font-size: 0.85rem; color: var(--text-dim);">Explore the interactive IoT energy dashboard and classroom simulation prototype.</p>
        </div>
        <a href="classroom-energy.html" target="_blank" rel="noopener noreferrer" class="btn-primary-sm" style="display:inline-flex; align-items:center; gap:6px; text-decoration:none;">
          <i class="fa-solid fa-play"></i> Launch Prototype
        </a>
      </div>

      <div class="modal-proj-section">
        <h4><i class="fa-solid fa-bullseye"></i> Problem Statement & Vision</h4>
        <p>Institutional classrooms frequently run lighting, high-wattage fans, and projectors when vacant or under natural sunlight, leading to significant electrical waste and carbon footprints. This project engineers an autonomous, sensor-orchestrated system that minimizes consumption without hindering academic comfort.</p>
      </div>

      <div class="modal-proj-section">
        <h4><i class="fa-solid fa-microchip"></i> System Architecture & Hardware Stack</h4>
        <ul class="modal-list">
          <li><strong>Occupancy Sensing:</strong> PIR (Passive Infrared) and ultrasonic sensor arrays detect student presence and count room capacity in real-time.</li>
          <li><strong>Ambient Light Harvesting (LDR):</strong> Measures ambient sunlight through windows and dims or switches off redundant lighting rows.</li>
          <li><strong>Microcontroller & Relay Control:</strong> Central ESP32/NodeMCU unit connected to high-voltage relay switches controls lights, projectors, and HVAC.</li>
          <li><strong>Energy Analytics Dashboard:</strong> Central telemetry logging energy kWh saved per classroom, peak usage periods, and fault alerts.</li>
        </ul>
      </div>

      <div class="modal-proj-section">
        <h4><i class="fa-solid fa-chart-line"></i> Impact & Results</h4>
        <p>Achieves up to <strong>35% - 42% reduction</strong> in unnecessary academic power wastage, providing a smart, cost-effective blueprint easily scalable across collegiate campuses.</p>
      </div>
    `
  },
  "sih-manganese": {
    title: "MANGANEX — Manganese Prospectivity Intelligence",
    subtitle: "Smart India Hackathon (SIH) &bull; AI/ML & Geospatial Analytics (Synthetic Data)",
    icon: "fa-satellite",
    category: "Smart India Hackathon & AI/ML",
    body: `
      <div class="callout" style="background: rgba(34,211,238,0.12); border: 1px solid rgba(34,211,238,0.4); border-radius: 10px; padding: 14px 16px; margin-bottom: 20px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
        <div>
          <strong style="color: #22d3ee; font-size: 1rem;"><i class="fa-solid fa-satellite"></i> Live Working Prototype Integrated!</strong>
          <p style="margin: 4px 0 0 0; font-size: 0.85rem; color: var(--text-dim);">Explore the interactive CartoDB geospatial prospectivity map, target explainability, what-if supply scenario simulator, and AI strategic recommendations.</p>
        </div>
        <a href="manganese-prototype.html" target="_blank" rel="noopener noreferrer" class="btn-primary-sm" style="display:inline-flex; align-items:center; gap:6px; text-decoration:none;">
          <i class="fa-solid fa-play"></i> Launch Prototype
        </a>
      </div>

      <div class="modal-proj-section">
        <h4><i class="fa-solid fa-mountain"></i> Problem Statement & Prototype Scope</h4>
        <p>MANGANEX explores how geospatial features and machine learning can support manganese prospectivity screening and production planning. This demonstration uses locally generated synthetic data rather than live satellite imagery, licensed geological datasets, or validated field measurements.</p>
      </div>

      <div class="modal-proj-section">
        <h4><i class="fa-solid fa-brain"></i> Model & Dashboard Workflow</h4>
        <ul class="modal-list">
          <li><strong>Sample geospatial features:</strong> Synthetic spectral bands and features such as vegetation/water indices, iron-oxide index, elevation, slope, and geology score.</li>
          <li><strong>Prospectivity model:</strong> A Random Forest classifier ranks sample exploration targets; scores are exploration-priority indicators, not reserve estimates.</li>
          <li><strong>Production planning:</strong> A linear-regression forecast and scenario simulator illustrate potential production-demand gaps using synthetic history.</li>
          <li><strong>Interactive dashboard:</strong> Explore a sample map heatmap, target explanations, forecast charts, supply-risk scenarios, analytics, and recommendations.</li>
        </ul>
      </div>

      <div class="modal-proj-section">
        <h4><i class="fa-solid fa-circle-exclamation"></i> Validation & Limitations</h4>
        <p>All displayed exploration and production figures are synthetic. Real-world use requires reliable satellite and geological inputs plus field validation; a prospectivity score cannot confirm a manganese reserve. The prototype is a workflow demonstration, not a validated exploration or forecasting service.</p>
      </div>
    `
  },
  "ai-schedule": {
    title: "Z CRACKERS — AI Study Scheduler & Quiz Engine",
    subtitle: "Adaptive Timetable Generator &bull; Dynamic Priority Scoring &bull; Material PDF Parser",
    icon: "fa-calendar-check",
    category: "Full-Stack & Applied AI",
    body: `
      <div class="callout" style="background: rgba(23,162,162,0.12); border: 1px solid rgba(23,162,162,0.4); border-radius: 10px; padding: 14px 16px; margin-bottom: 20px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
        <div>
          <strong style="color: #5fd3d3; font-size: 1rem;"><i class="fa-solid fa-bolt"></i> Live Working Prototype Integrated!</strong>
          <p style="margin: 4px 0 0 0; font-size: 0.85rem; color: var(--text-dim);">You can test syllabus PDF upload, keyword extraction, practice quiz generation, timetable scheduling, and smart rescheduling directly.</p>
        </div>
        <div style="display:flex; gap:8px;">
          <button class="btn-primary-sm" onclick="closeAllModals(); openStudySchedulerModal();" style="display:inline-flex; align-items:center; gap:6px;">
            <i class="fa-solid fa-play"></i> Launch Inside Portfolio
          </button>
          <a href="study-scheduler.html" target="_blank" rel="noopener noreferrer" class="btn-outline-sm" style="display:inline-flex; align-items:center; gap:6px; text-decoration:none;">
            <i class="fa-solid fa-arrow-up-right-from-square"></i> Fullscreen Tab
          </a>
        </div>
      </div>

      <div class="modal-proj-section">
        <h4><i class="fa-solid fa-bullseye"></i> Problem Statement & Vision</h4>
        <p>Students face cognitive overload and exam anxiety when trying to structure revision for multiple heavy engineering subjects. Static study planners fail because they don't adapt when a student misses a session or finds a particular topic difficult. Z CRACKERS solves this with a composite priority algorithm and automated learning reinforcement.</p>
      </div>

      <div class="modal-proj-section">
        <h4><i class="fa-solid fa-calculator"></i> 4-Variable Live Priority Score Algorithm</h4>
        <p>Every subject receives an algorithmic priority score out of 100 calculated in real-time:</p>
        <div style="background: rgba(11,31,58,0.7); border: 1px solid rgba(23,162,162,0.3); border-radius: 8px; padding: 12px; font-family: var(--font-mono); font-size: 0.82rem; color: #5fd3d3; margin: 8px 0 12px 0;">
          Composite Score = (0.40 × Urgency) + (0.25 × Difficulty) + (0.20 × Remaining Work) + (0.15 × Weakness)
        </div>
        <ul class="modal-list">
          <li><strong>Urgency (40%):</strong> Proximity of the exam date.</li>
          <li><strong>Difficulty (25%):</strong> Student's perceived complexity level.</li>
          <li><strong>Remaining Work (20%):</strong> Uncovered syllabus proportion.</li>
          <li><strong>Weakness (15%):</strong> Dynamic factor automatically recalculated by quiz test scores (&lt;60% triggers High priority).</li>
        </ul>
      </div>

      <div class="modal-proj-section">
        <h4><i class="fa-solid fa-file-pdf"></i> Material Syllabus Parser &amp; Auto Quiz Generation</h4>
        <ul class="modal-list">
          <li><strong>PDF.js Integration:</strong> Ingests chapter PDFs or pasted text directly in the browser with client-side text stream extraction.</li>
          <li><strong>Term Frequency &amp; Stopword Filtering:</strong> Removes standard English stopwords and extracts high-frequency technical domain keywords.</li>
          <li><strong>Sentence Selection &amp; Distractor Pool:</strong> Generates context-aware multiple choice questions (MCQs) with plausible distractor options on-the-fly.</li>
        </ul>
      </div>

      <div class="modal-proj-section">
        <h4><i class="fa-solid fa-calendar-days"></i> Timetable Generation &amp; Smart Rescheduling</h4>
        <ul class="modal-list">
          <li><strong>Cognitive Block Capping:</strong> Maximum 45–60 min per study block with mandatory 15 min breaks to prevent burnout.</li>
          <li><strong>Dedicated Revision Buffer:</strong> Last 30 minutes always reserved for high-weakness review and practice quizzes.</li>
          <li><strong>Smart Reschedule Engine:</strong> Missed blocks aren't just pushed back indefinitely; they are promoted to tomorrow's top priority while completed sessions deduct syllabus weightage.</li>
        </ul>
      </div>
    `
  },
  "gpa-calc": {
    title: "CGPA, GPA & SGPA Calculator",
    subtitle: "High-Precision Academic Grading & Projection Suite",
    icon: "fa-calculator",
    category: "Web & JavaFX Application",
    body: `
      <div class="callout" style="background: rgba(217,164,65,0.12); border: 1px solid rgba(217,164,65,0.4); border-radius: 10px; padding: 14px 16px; margin-bottom: 20px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
        <div>
          <strong style="color: #D9A441; font-size: 1rem;"><i class="fa-solid fa-calculator"></i> Try the Live Calculator!</strong>
          <p style="margin: 4px 0 0 0; font-size: 0.85rem; color: var(--text-dim);">Calculate your SGPA and CGPA in real-time with full credit weightage support.</p>
        </div>
        <a href="academic-calculator.html" target="_blank" rel="noopener noreferrer" class="btn-primary-sm" style="display:inline-flex; align-items:center; gap:6px; text-decoration:none; background: linear-gradient(135deg,#D9A441,#c08930);">
          <i class="fa-solid fa-calculator"></i> Launch Calculator
        </a>
      </div>

      <div class="modal-proj-section">
        <p>Designed specifically for collegiate engineering grading scales (e.g., 10-point Anna University / Autonomous credit system). Calculates exact Semester Grade Point Average (SGPA) and Cumulative Grade Point Average (CGPA) with zero rounding discrepancies.</p>
      </div>

      <div class="modal-proj-section">
        <h4><i class="fa-solid fa-code"></i> Engineering Highlights & Implementations</h4>
        <ul class="modal-list">
          <li><strong>Credit Weightage Algorithm:</strong> Evaluates subject credits (3, 4, 1.5, etc.) multiplied by grade points (O:10, A+:9, A:8, B+:7, B:6, C:5, U:0) to compute weighted averages.</li>
          <li><strong>Goal Seek / Target Projection:</strong> Allows students to input their dream CGPA and calculates the exact SGPA needed in upcoming semesters to achieve it.</li>
          <li><strong>Dual Interface Prototypes:</strong> Implemented both as a responsive web app using JavaScript and modern CSS Grid, and as an offline desktop GUI using <strong>Java & JavaFX</strong>.</li>
        </ul>
      </div>
    `
  }
};

// ================= AUDIO SYNTHESIZER (WEB AUDIO API) =================
let audioCtx = null;

function playUiTone(type = "click") {
  if (!isSoundEnabled) return;
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    const now = audioCtx.currentTime;

    if (type === "click") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(480, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.05);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === "success") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === "swoosh") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.1);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    }
  } catch (err) {
    // Audio context may be restricted before user interaction
  }
}

// ================= STAGE NAVIGATION CONTROLLER =================
function goToStage(stageNumber) {
  if (stageNumber < 1) stageNumber = 1;
  if (stageNumber > STAGE_CONFIG.length) stageNumber = STAGE_CONFIG.length;

  currentStage = stageNumber;
  const stageInfo = STAGE_CONFIG[currentStage - 1];

  // Update HUD
  const hudCurrent = document.getElementById("hudCurrent");
  const hudTitle = document.getElementById("hudTitle");
  if (hudCurrent) hudCurrent.textContent = String(currentStage).padStart(2, "0");
  if (hudTitle) hudTitle.textContent = stageInfo.name;

  // Update Progress Bar
  const progressPercent = (currentStage / STAGE_CONFIG.length) * 100;
  const progressFill = document.getElementById("stageProgressFill");
  if (progressFill) progressFill.style.width = `${progressPercent}%`;

  // Update Dock Pills
  document.querySelectorAll(".dock-pill").forEach(pill => {
    const pillStage = parseInt(pill.getAttribute("data-stage"));
    if (pillStage === currentStage) {
      pill.classList.add("active");
    } else {
      pill.classList.remove("active");
    }
  });

  // Update Floating Controller
  const ctrlCounter = document.getElementById("ctrlCounter");
  const ctrlCurrentTitle = document.getElementById("ctrlCurrentTitle");
  const prevBtn = document.getElementById("prevStageBtn");
  const nextBtn = document.getElementById("nextStageBtn");

  if (ctrlCounter) ctrlCounter.textContent = `STAGE ${currentStage} OF ${STAGE_CONFIG.length}`;
  if (ctrlCurrentTitle) ctrlCurrentTitle.textContent = stageInfo.name;

  if (prevBtn) {
    prevBtn.disabled = currentStage === 1;
  }

  if (nextBtn) {
    if (currentStage === STAGE_CONFIG.length) {
      nextBtn.innerHTML = `<span>Back to Start</span> <i class="fa-solid fa-arrow-rotate-left"></i>`;
    } else {
      const nextStageName = STAGE_CONFIG[currentStage].name;
      nextBtn.innerHTML = `<span>Review Next Page</span> <i class="fa-solid fa-arrow-right"></i>`;
    }
  }

  // Handle Stage Display
  if (!isScrollMode) {
    document.querySelectorAll(".stage-section").forEach(sec => {
      sec.classList.remove("active");
    });
    const activeSection = document.getElementById(stageInfo.sectionId);
    if (activeSection) {
      activeSection.classList.add("active");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  } else {
    // In scroll mode, smooth scroll to section
    const targetSection = document.getElementById(stageInfo.sectionId);
    if (targetSection) {
      targetSection.scrollIntoView({ behavior: "smooth" });
    }
  }

  playUiTone("click");
}

function nextStage() {
  if (currentStage >= STAGE_CONFIG.length) {
    goToStage(1);
  } else {
    goToStage(currentStage + 1);
  }
}

function prevStage() {
  if (currentStage > 1) {
    goToStage(currentStage - 1);
  }
}

// ================= HERO TYPING ANIMATION =================
const TYPING_ROLES = [
  "Full-Stack Developer",
  "Data Scientist",
  "Analytics Engineer",
  "SIH Hackathon Innovator",
  "AI & Prompt Engineer"
];

let roleIndex = 0;
let charIndex = 0;
let isDeleting = false;

function handleRoleTyping() {
  const typedRoleElem = document.getElementById("typedRole");
  if (!typedRoleElem) return;

  const currentRole = TYPING_ROLES[roleIndex];

  if (!isDeleting) {
    typedRoleElem.textContent = currentRole.substring(0, charIndex + 1);
    charIndex++;
    if (charIndex === currentRole.length) {
      isDeleting = true;
      setTimeout(handleRoleTyping, 2200);
      return;
    }
  } else {
    typedRoleElem.textContent = currentRole.substring(0, charIndex - 1);
    charIndex--;
    if (charIndex === 0) {
      isDeleting = false;
      roleIndex = (roleIndex + 1) % TYPING_ROLES.length;
      setTimeout(handleRoleTyping, 400);
      return;
    }
  }

  const speed = isDeleting ? 40 : 80;
  setTimeout(handleRoleTyping, speed);
}

// ================= CERTIFICATES & DYNAMIC VAULT =================
function getStoredCertificates() {
  const raw = localStorage.getItem("mb_portfolio_certificates");
  if (raw) {
    try {
      const stored = JSON.parse(raw);
      // Ensure verified images, codes, and scores are updated for default records
      const updated = stored.map(c => {
        const def = DEFAULT_CERTIFICATES.find(d => d.id === c.id);
        if (def) {
          return {
            ...c,
            image: def.image || c.image,
            code: def.code || c.code,
            date: def.date || c.date,
            desc: def.desc || c.desc,
            title: def.title || c.title,
            issuer: def.issuer || c.issuer
          };
        }
        return c;
      });
      // Ensure newly added defaults are included
      DEFAULT_CERTIFICATES.forEach(def => {
        if (!updated.some(c => c.id === def.id)) {
          updated.push({ ...def });
        }
      });
      // Filter out old unverified placeholders if replaced
      return updated.filter(c => c.id !== "cert-madurai-symposium");
    } catch (e) {
      console.error("Error parsing stored certificates", e);
    }
  }
  return [...DEFAULT_CERTIFICATES];
}

function saveCertificates(certs) {
  localStorage.setItem("mb_portfolio_certificates", JSON.stringify(certs));
}

function renderCertificates(filter = "all") {
  const grid = document.getElementById("certificatesGrid");
  const totalCountElem = document.getElementById("certCountTotal");
  if (!grid) return;

  const certs = getStoredCertificates();
  if (totalCountElem) totalCountElem.textContent = certs.length;

  const filtered = filter === "all" ? certs : certs.filter(c => c.category === filter);

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">
        <i class="fa-solid fa-folder-open" style="font-size: 2.5rem; margin-bottom: 12px; opacity: 0.5;"></i>
        <p>No certificates found in this category.</p>
        <button class="btn-primary-sm" onclick="document.getElementById('openAddModalBtn').click()" style="margin: 14px auto 0 auto;">
          <i class="fa-solid fa-plus"></i> Add one now
        </button>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(cert => {
    let badgeClass = "badge-custom";
    if (cert.category === "nptel") badgeClass = "badge-nptel";
    else if (cert.category === "hp") badgeClass = "badge-hp";
    else if (cert.category === "simplilearn") badgeClass = "badge-simplilearn";
    else if (cert.category === "symposium") badgeClass = "badge-symposium";

    const isUserAdded = cert.isUserAdded === true;

    return `
      <div class="cert-card glass-card" id="${cert.id}">
        <div class="cert-top-row">
          <span class="cert-issuer-badge ${badgeClass}">
            <i class="fa-solid fa-shield-check"></i> ${escapeHtml(cert.issuer)}
          </span>
          <span class="cert-date">${escapeHtml(cert.date || "Completed")}</span>
        </div>

        <h3 class="cert-name">${escapeHtml(cert.title)}</h3>
        <p class="cert-summary">${escapeHtml(cert.desc)}</p>

        ${cert.code ? `
          <div style="margin-bottom: 14px;">
            <span class="cert-code-tag"><i class="fa-solid fa-fingerprint"></i> ID: ${escapeHtml(cert.code)}</span>
          </div>
        ` : ''}

        <div class="cert-footer-row">
          <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
            ${cert.image ? `
              <button class="cert-btn-view-photo" onclick="openCertViewerModal('${escapeHtml(cert.image)}', '${escapeHtml(cert.title)}', '${escapeHtml(cert.issuer)}', '${escapeHtml(cert.code || '')}', '${escapeHtml(cert.date || '')}')" title="View official verified certificate photo">
                <i class="fa-solid fa-eye"></i> View Certificate
              </button>
            ` : ''}

            ${cert.link ? `
              <a href="${escapeHtml(cert.link)}" target="_blank" rel="noopener noreferrer" class="cert-link-btn">
                <span>Credential Link</span>
                <i class="fa-solid fa-arrow-up-right-from-square"></i>
              </a>
            ` : `<span style="font-size: 0.75rem; color: var(--text-dim);"><i class="fa-solid fa-check"></i> Verified Record</span>`}
          </div>

          ${isUserAdded ? `
            <button class="btn-delete-cert" onclick="deleteCertificate('${cert.id}')" title="Delete from vault">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          ` : `
            <span title="Verified Completion" style="color: var(--cyan-primary); font-size: 0.85rem;">
              <i class="fa-solid fa-certificate"></i>
            </span>
          `}
        </div>
      </div>
    `;
  }).join("");
}

function handleNewAchievement(e) {
  e.preventDefault();
  const title = document.getElementById("achTitle").value.trim();
  const issuer = document.getElementById("achIssuer").value.trim();
  const category = document.getElementById("achCategory").value;
  const date = document.getElementById("achDate").value.trim() || "Completed";
  const link = document.getElementById("achLink").value.trim();
  const desc = document.getElementById("achDesc").value.trim() || "Milestone achieved and verified in academic journey.";

  if (!title || !issuer) return;

  const newCert = {
    id: "user-cert-" + Date.now(),
    title,
    issuer,
    category,
    date,
    link,
    desc,
    isUserAdded: true
  };

  const certs = getStoredCertificates();
  certs.unshift(newCert);
  saveCertificates(certs);

  renderCertificates();
  closeAllModals();
  document.getElementById("addAchievementForm").reset();

  showToast(`Achievement "${title}" added to your Vault!`);
  playUiTone("success");

  // Move to stage 5 so user sees it right away
  goToStage(5);
}

function deleteCertificate(certId) {
  let certs = getStoredCertificates();
  certs = certs.filter(c => c.id !== certId);
  saveCertificates(certs);
  renderCertificates();
  showToast("Certificate removed from vault.");
  playUiTone("click");
}

function resetAchievementsToDefault() {
  if (confirm("Reset achievement vault to initial verified certificates?")) {
    localStorage.removeItem("mb_portfolio_certificates");
    renderCertificates();
    showToast("Vault reset to default certificates.");
    playUiTone("click");
  }
}

// ================= PROJECT FILTER & MODAL =================
function initProjectFilters() {
  const filterBtns = document.querySelectorAll(".filter-btn");
  const cards = document.querySelectorAll(".project-card");

  filterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      filterBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const filter = btn.getAttribute("data-filter");
      cards.forEach(card => {
        const cats = card.getAttribute("data-category") || "";
        if (filter === "all" || cats.includes(filter)) {
          card.style.display = "flex";
        } else {
          card.style.display = "none";
        }
      });
      playUiTone("click");
    });
  });
}

function openProjectModal(projectId) {
  const data = PROJECT_DETAILS[projectId];
  if (!data) return;

  const modal = document.getElementById("projectDetailsModal");
  const titleElem = document.getElementById("projModalTitle");
  const subElem = document.getElementById("projModalSubtitle");
  const iconElem = document.getElementById("projModalIcon");
  const bodyElem = document.getElementById("projModalBody");

  titleElem.textContent = data.title;
  subElem.innerHTML = data.subtitle;
  iconElem.innerHTML = `<i class="fa-solid ${data.icon}"></i>`;
  bodyElem.innerHTML = data.body;

  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  playUiTone("click");
}

// ================= MINI GPA SIMULATOR LOGIC =================
function updateGpaSimulator() {
  const s1Input = document.getElementById("calcSem1");
  const s2Input = document.getElementById("calcSem2");
  const s3Input = document.getElementById("calcSem3");
  const resultElem = document.getElementById("calcCgpaResult");

  if (!s1Input || !s2Input || !s3Input || !resultElem) return;

  const s1 = parseFloat(s1Input.value) || 0;
  const s2 = parseFloat(s2Input.value) || 0;
  const s3 = parseFloat(s3Input.value) || 0;

  // Assuming equal semester credit weightage for demonstration
  const avg = ((s1 + s2 + s3) / 3).toFixed(2);
  resultElem.textContent = avg;
}

// ================= CONTACT FORM & TOAST =================
function handleContactSubmit(e) {
  e.preventDefault();
  const name = document.getElementById("senderName").value.trim();
  const email = document.getElementById("senderEmail").value.trim();
  const subject = document.getElementById("subject").value;
  const message = document.getElementById("messageText").value.trim();

  if (!name || !email || !message) return;

  showToast(`Thank you, ${name}! Your transmission has been sent.`);
  playUiTone("success");
  document.getElementById("contactForm").reset();
}

function showToast(text) {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = "toast-msg";
  toast.innerHTML = `<i class="fa-solid fa-circle-check" style="color: var(--cyan-primary);"></i> <span>${escapeHtml(text)}</span>`;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(50px)";
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ================= MODALS UTILITIES =================
function closeAllModals() {
  document.querySelectorAll(".modal-overlay").forEach(m => {
    m.classList.remove("open");
    m.setAttribute("aria-hidden", "true");
  });
}

// Study Scheduler Modal Handlers
function openStudySchedulerModal() {
  const modal = document.getElementById("studySchedulerModal");
  if (!modal) return;
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  playUiTone("click");
}

function closeStudySchedulerModal() {
  const modal = document.getElementById("studySchedulerModal");
  if (!modal) return;
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
}

// Certificate Photo Lightbox Handlers
function openCertViewerModal(imgSrc, title, issuer, code, date) {
  const modal = document.getElementById("certViewerModal");
  const imgElem = document.getElementById("certViewerImage");
  const titleElem = document.getElementById("certViewerTitle");
  const subElem = document.getElementById("certViewerSubtitle");
  const metaElem = document.getElementById("certViewerMeta");

  if (!modal || !imgElem) return;

  imgElem.src = imgSrc;
  imgElem.alt = `${title} - ${issuer}`;
  if (titleElem) titleElem.textContent = title;
  if (subElem) subElem.textContent = `Issued by ${issuer} • ${date}`;

  if (metaElem) {
    metaElem.innerHTML = `
      <span><i class="fa-solid fa-building-columns"></i> ${escapeHtml(issuer)}</span>
      ${code ? `<span class="cert-code-tag"><i class="fa-solid fa-fingerprint"></i> Credential ID: ${escapeHtml(code)}</span>` : ''}
      <span><i class="fa-solid fa-calendar-check"></i> ${escapeHtml(date)}</span>
      <a href="${escapeHtml(imgSrc)}" target="_blank" class="cert-link-btn" title="Open full-resolution image in new tab">
        <i class="fa-solid fa-expand"></i> Full Res
      </a>
    `;
  }

  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  playUiTone("click");
}

function closeCertViewerModal() {
  const modal = document.getElementById("certViewerModal");
  if (!modal) return;
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
}

function escapeHtml(str) {
  if (!str) return "";
  const div = document.createElement("div");
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

// ================= INITIALIZATION & EVENT LISTENERS =================
document.addEventListener("DOMContentLoaded", () => {
  // 1. Initialize Typing Effect
  handleRoleTyping();

  // 2. Initialize Certificates Grid
  renderCertificates();

  // 3. Certificate Filter Buttons
  document.querySelectorAll(".cert-filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".cert-filter-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const f = btn.getAttribute("data-cert-filter");
      renderCertificates(f);
      playUiTone("click");
    });
  });

  // 4. Stage Controller Buttons
  const nextBtn = document.getElementById("nextStageBtn");
  const prevBtn = document.getElementById("prevStageBtn");
  const heroNextBtn = document.getElementById("heroStartJourneyBtn");

  if (nextBtn) nextBtn.addEventListener("click", nextStage);
  if (prevBtn) prevBtn.addEventListener("click", prevStage);
  if (heroNextBtn) heroNextBtn.addEventListener("click", () => goToStage(2));

  // 5. Dock Navigation Pills
  document.querySelectorAll(".dock-pill").forEach(pill => {
    pill.addEventListener("click", () => {
      const target = parseInt(pill.getAttribute("data-stage"));
      goToStage(target);
    });
  });

  // 6. View Mode Toggle (Stage Flow vs Continuous Scroll)
  const viewModeBtn = document.getElementById("viewModeBtn");
  const viewModeLabel = document.getElementById("viewModeLabel");
  if (viewModeBtn) {
    viewModeBtn.addEventListener("click", () => {
      isScrollMode = !isScrollMode;
      if (isScrollMode) {
        document.body.classList.add("scroll-all-mode");
        viewModeLabel.textContent = "Scroll Mode";
        viewModeBtn.style.borderColor = "var(--cyan-primary)";
        showToast("Switched to Continuous Scroll Mode");
      } else {
        document.body.classList.remove("scroll-all-mode");
        viewModeLabel.textContent = "Stage Mode";
        viewModeBtn.style.borderColor = "var(--border-glass)";
        goToStage(currentStage);
        showToast("Switched to Step-by-Step Stage Mode");
      }
      playUiTone("click");
    });
  }

  // 7. Sound Toggle
  const soundBtn = document.getElementById("soundToggleBtn");
  const soundIcon = document.getElementById("soundIcon");
  if (soundBtn) {
    soundBtn.addEventListener("click", () => {
      isSoundEnabled = !isSoundEnabled;
      if (isSoundEnabled) {
        soundIcon.className = "fa-solid fa-volume-high";
        showToast("UI Audio Enabled");
        playUiTone("click");
      } else {
        soundIcon.className = "fa-solid fa-volume-xmark";
        showToast("UI Audio Muted");
      }
    });
  }

  // 8. Add Achievement Modal Triggers
  const openAddModalBtn = document.getElementById("openAddModalBtn");
  const quickAddBtn = document.getElementById("quickAddBtn");
  const closeAddModalBtn = document.getElementById("closeAddModalBtn");
  const cancelAddBtn = document.getElementById("cancelAddBtn");
  const addModal = document.getElementById("addAchievementModal");

  const openAddModal = () => {
    addModal.classList.add("open");
    addModal.setAttribute("aria-hidden", "false");
    playUiTone("click");
  };

  if (openAddModalBtn) openAddModalBtn.addEventListener("click", openAddModal);
  if (quickAddBtn) quickAddBtn.addEventListener("click", openAddModal);
  if (closeAddModalBtn) closeAddModalBtn.addEventListener("click", closeAllModals);
  if (cancelAddBtn) cancelAddBtn.addEventListener("click", closeAllModals);

  // 9. Reset Achievements
  const resetBtn = document.getElementById("resetAchievementsBtn");
  if (resetBtn) resetBtn.addEventListener("click", resetAchievementsToDefault);

  // 10. Project Modal Closers
  const closeProjModalBtn = document.getElementById("closeProjModalBtn");
  if (closeProjModalBtn) closeProjModalBtn.addEventListener("click", closeAllModals);

  // 11. Resume Modal
  const openResumeBtn = document.getElementById("openResumeModalBtn");
  const resumeModal = document.getElementById("resumeModal");
  const closeResumeModalBtn = document.getElementById("closeResumeModalBtn");

  if (openResumeBtn && resumeModal) {
    openResumeBtn.addEventListener("click", () => {
      resumeModal.classList.add("open");
      resumeModal.setAttribute("aria-hidden", "false");
      playUiTone("click");
    });
  }
  if (closeResumeModalBtn) closeResumeModalBtn.addEventListener("click", closeAllModals);

  // 12. Close Modals on Overlay Click or Escape Key
  document.querySelectorAll(".modal-overlay").forEach(overlay => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        closeAllModals();
      }
    });
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeAllModals();
    } else if (e.key === "ArrowRight" && !document.querySelector(".modal-overlay.open") && document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA") {
      nextStage();
    } else if (e.key === "ArrowLeft" && !document.querySelector(".modal-overlay.open") && document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA") {
      prevStage();
    }
  });

  // 13. GPA Simulator Listeners
  ["calcSem1", "calcSem2", "calcSem3"].forEach(id => {
    const input = document.getElementById(id);
    if (input) input.addEventListener("input", updateGpaSimulator);
  });

  // 14. Projects Filters
  initProjectFilters();

  // 15. Initial Stage State
  goToStage(1);
});
