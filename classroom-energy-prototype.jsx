import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Users, Thermometer, Fan, Lightbulb, Wifi, Battery, BatteryCharging,
  Zap, Power, AlertTriangle, Droplets, Sun, Cpu
} from "lucide-react";

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');`;

const FAN_WATT = 70;
const LIGHT_WATT = 20;
const TARIFF_PER_KWH = 6; // rupees
const TEMP_THRESHOLD = 26;
const SIM_MINUTES_PER_SECOND = 6; // simulated-time acceleration

const INITIAL_BENCHES = [1, 2, 3, 4, 5, 6, 7].map((n) => ({
  id: n,
  occupied: [1, 3, 5].includes(n),
  temp: 25 + Math.round(Math.random() * 4),
}));

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

function pad(n) {
  return n.toString().padStart(2, "0");
}

function simClock(elapsedSeconds) {
  const totalMinutes = Math.floor(elapsedSeconds * SIM_MINUTES_PER_SECOND);
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  const s = Math.floor((elapsedSeconds * SIM_MINUTES_PER_SECOND * 60) % 60);
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export default function ClassroomEnergySim() {
  const [benches, setBenches] = useState(INITIAL_BENCHES);
  const [humidity, setHumidity] = useState(58);
  const [daylight, setDaylight] = useState(35);
  const [mainsOn, setMainsOn] = useState(true);
  const [battery, setBattery] = useState(100);
  const [elapsed, setElapsed] = useState(0);
  const [log, setLog] = useState([
    { t: "00:00:00", msg: "System boot complete — 1 main controller, 7 sub-sensors linked.", tone: "info" },
    { t: "00:00:00", msg: "Python control loop started (poll interval 2s).", tone: "info" },
  ]);
  const [savedKwh, setSavedKwh] = useState(0);
  const [savedRupees, setSavedRupees] = useState(0);
  const prevZoneState = useRef({});
  const logEndRef = useRef(null);

  const pushLog = useCallback((msg, tone = "info") => {
    setLog((prev) => {
      const next = [...prev, { t: simClock(elapsed), msg, tone }];
      return next.length > 60 ? next.slice(next.length - 60) : next;
    });
  }, [elapsed]);

  // master clock
  useEffect(() => {
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // bench temperature drift
  useEffect(() => {
    const id = setInterval(() => {
      setBenches((prev) =>
        prev.map((b) => {
          const drift = (Math.random() - 0.45) * 1.1;
          const target = b.occupied ? b.temp + drift + 0.15 : b.temp + drift - 0.1;
          return { ...b, temp: clamp(target, 21, 34) };
        })
      );
    }, 2200);
    return () => clearInterval(id);
  }, []);

  // battery drain / recharge
  useEffect(() => {
    const id = setInterval(() => {
      setBattery((prev) => {
        if (!mainsOn) return clamp(prev - 1.6, 0, 100);
        return clamp(prev + 3, 0, 100);
      });
    }, 1000);
    return () => clearInterval(id);
  }, [mainsOn]);

  // decision engine + logging on state changes
  useEffect(() => {
    const systemLive = mainsOn || battery > 0;
    const zones = {};
    benches.forEach((b) => {
      const fanOn = systemLive && b.occupied && b.temp >= TEMP_THRESHOLD;
      const lightOn = systemLive && b.occupied && daylight < 45;
      zones[b.id] = { fanOn, lightOn };
    });

    const prev = prevZoneState.current;
    Object.keys(zones).forEach((id) => {
      const before = prev[id];
      const after = zones[id];
      if (!before) return;
      if (before.fanOn !== after.fanOn) {
        pushLog(
          `Bench ${id}: fan zone ${after.fanOn ? "ON" : "OFF"} (occupied=${benches.find(b=>String(b.id)===id).occupied}, temp=${benches.find(b=>String(b.id)===id).temp.toFixed(1)}°C)`,
          after.fanOn ? "on" : "off"
        );
      }
      if (before.lightOn !== after.lightOn) {
        pushLog(
          `Bench ${id}: light zone ${after.lightOn ? "ON" : "OFF"} (daylight=${daylight}%)`,
          after.lightOn ? "on" : "off"
        );
      }
    });
    prevZoneState.current = zones;
  }, [benches, daylight, mainsOn, battery, pushLog]);

  // mains toggle logging
  const prevMains = useRef(true);
  useEffect(() => {
    if (prevMains.current !== mainsOn) {
      if (!mainsOn) pushLog("⚠ Main power lost — switching to battery backup.", "alert");
      else pushLog("Mains power restored — battery charging.", "info");
      prevMains.current = mainsOn;
    }
  }, [mainsOn, pushLog]);

  const prevOutage = useRef(false);
  useEffect(() => {
    const outage = !mainsOn && battery <= 0;
    if (outage && !prevOutage.current) {
      pushLog("Battery depleted — all zones forced OFF. Sensing paused.", "alert");
    }
    if (!outage && prevOutage.current) {
      pushLog("Battery recovered — system resuming normal control.", "info");
    }
    prevOutage.current = outage;
  }, [mainsOn, battery, pushLog]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [log]);

  // energy accounting
  useEffect(() => {
    const id = setInterval(() => {
      const systemLive = mainsOn || battery > 0;
      const anyOccupied = benches.some((b) => b.occupied);
      const baselineW = anyOccupied ? benches.length * (FAN_WATT + LIGHT_WATT) : 0;
      const smartW = benches.reduce((sum, b) => {
        const fanOn = systemLive && b.occupied && b.temp >= TEMP_THRESHOLD;
        const lightOn = systemLive && b.occupied && daylight < 45;
        return sum + (fanOn ? FAN_WATT : 0) + (lightOn ? LIGHT_WATT : 0);
      }, 0);
      const savedW = Math.max(0, baselineW - smartW);
      const simHoursPerTick = SIM_MINUTES_PER_SECOND / 60;
      const kwhTick = (savedW / 1000) * simHoursPerTick;
      setSavedKwh((k) => k + kwhTick);
      setSavedRupees((r) => r + kwhTick * TARIFF_PER_KWH);
    }, 1000);
    return () => clearInterval(id);
  }, [benches, daylight, mainsOn, battery]);

  const systemLive = mainsOn || battery > 0;
  const anyOccupied = benches.some((b) => b.occupied);
  const baselineW = anyOccupied ? benches.length * (FAN_WATT + LIGHT_WATT) : 0;
  const smartW = benches.reduce((sum, b) => {
    const fanOn = systemLive && b.occupied && b.temp >= TEMP_THRESHOLD;
    const lightOn = systemLive && b.occupied && daylight < 45;
    return sum + (fanOn ? FAN_WATT : 0) + (lightOn ? LIGHT_WATT : 0);
  }, 0);
  const savingsPct = baselineW > 0 ? Math.round(((baselineW - smartW) / baselineW) * 100) : 0;
  const classroomTemp = (benches.reduce((s, b) => s + b.temp, 0) / benches.length).toFixed(1);

  const toggleBench = (id) => {
    setBenches((prev) =>
      prev.map((b) => (b.id === id ? { ...b, occupied: !b.occupied } : b))
    );
  };

  const topRow = benches.slice(0, 4);
  const bottomRow = benches.slice(4, 7);

  return (
    <div
      style={{
        fontFamily: "'Inter', sans-serif",
        background: "#0A0E14",
        minHeight: "100vh",
        color: "#E6EDF3",
      }}
    >
      <style>{`
        ${FONT_IMPORT}
        .disp { font-family: 'Space Grotesk', sans-serif; }
        .mono { font-family: 'JetBrains Mono', monospace; }
        @keyframes pulseDot { 0%,100% { opacity: 1; } 50% { opacity: 0.25; } }
        @keyframes blinkCursor { 0%,49% { opacity: 1; } 50%,100% { opacity: 0; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .fan-spin { animation: spin 0.9s linear infinite; }
        .live-dot { animation: pulseDot 1.6s ease-in-out infinite; }
        .cursor { animation: blinkCursor 1s step-start infinite; }
        input[type=range] { accent-color: #FFB020; }
      `}</style>

      {/* Header */}
      <div style={{ borderBottom: "1px solid #1C232E", background: "#0D1420" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "18px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg,#FFB020,#F4A100)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Zap size={22} color="#0A0E14" strokeWidth={2.5} />
            </div>
            <div>
              <div className="disp" style={{ fontSize: 18, fontWeight: 700, letterSpacing: 0.2 }}>
                Smart Classroom Energy Management
              </div>
              <div className="mono" style={{ fontSize: 11.5, color: "#6B7684" }}>
                LIVE SIMULATION · 1 MAIN CONTROLLER · 7 SUB-SENSORS
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <div className="mono" style={{ display: "flex", alignItems: "center", gap: 7, background: "#131B27", border: "1px solid #232B36", borderRadius: 8, padding: "8px 12px", fontSize: 12.5 }}>
              <span className="live-dot" style={{ width: 7, height: 7, borderRadius: 99, background: systemLive ? "#3DD68C" : "#FF5C5C", display: "inline-block" }} />
              {simClock(elapsed)}
            </div>

            <div className="mono" style={{ display: "flex", alignItems: "center", gap: 7, background: "#131B27", border: "1px solid #232B36", borderRadius: 8, padding: "8px 12px", fontSize: 12.5, color: battery < 20 ? "#FF8A65" : "#8FE3C7" }}>
              {mainsOn ? <BatteryCharging size={15} /> : <Battery size={15} />}
              {Math.round(battery)}%
            </div>

            <button
              onClick={() => setMainsOn((v) => !v)}
              className="mono"
              style={{
                display: "flex", alignItems: "center", gap: 7, cursor: "pointer",
                border: mainsOn ? "1px solid #2A3542" : "1px solid #6E2A24",
                background: mainsOn ? "#131B27" : "#26120F",
                color: mainsOn ? "#C6D1DE" : "#FF8A75",
                borderRadius: 8, padding: "8px 14px", fontSize: 12.5, fontWeight: 600
              }}
            >
              <Power size={14} />
              {mainsOn ? "MAINS ON — simulate power cut" : "POWER CUT — restore mains"}
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "24px", display: "grid", gridTemplateColumns: "1.55fr 1fr", gap: 20 }}>
        {/* Classroom floor plan */}
        <div style={{ background: "#0D1420", border: "1px solid #1C232E", borderRadius: 14, padding: 22 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div className="disp" style={{ fontSize: 15, fontWeight: 600 }}>Classroom Floor — Bench Zones</div>
            <div className="mono" style={{ fontSize: 11, color: "#6B7684" }}>tap a bench to seat / clear a student</div>
          </div>

          <div style={{ textAlign: "center", marginBottom: 22 }}>
            <div className="mono" style={{ display: "inline-block", fontSize: 10.5, letterSpacing: 3, color: "#4C5665", border: "1px solid #232B36", borderRadius: 6, padding: "5px 22px" }}>
              — BOARD —
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "center" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, width: "100%" }}>
              {topRow.map((b) => (
                <BenchCard key={b.id} bench={b} systemLive={systemLive} daylight={daylight} onToggle={toggleBench} />
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, width: "75%" }}>
              {bottomRow.map((b) => (
                <BenchCard key={b.id} bench={b} systemLive={systemLive} daylight={daylight} onToggle={toggleBench} />
              ))}
            </div>
          </div>

          {!systemLive && (
            <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 10, background: "#26120F", border: "1px solid #6E2A24", borderRadius: 10, padding: "12px 14px", color: "#FF8A75" }}>
              <AlertTriangle size={17} />
              <span className="mono" style={{ fontSize: 12.5 }}>Battery depleted — sensing paused, all zones OFF until power is restored.</span>
            </div>
          )}
        </div>

        {/* Right column: controller + log */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ background: "#0D1420", border: "1px solid #1C232E", borderRadius: 14, padding: 22 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <Cpu size={16} color="#FFB020" />
              <div className="disp" style={{ fontSize: 15, fontWeight: 600 }}>Main Controller</div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
              <StatBox icon={<Thermometer size={14} />} label="Classroom Temp" value={`${classroomTemp}°C`} />
              <StatBox icon={<Droplets size={14} />} label="Humidity" value={`${humidity}%`} />
            </div>

            <SliderRow label="Humidity" value={humidity} onChange={setHumidity} min={20} max={95} unit="%" icon={<Droplets size={13} />} />
            <SliderRow label="Daylight level" value={daylight} onChange={setDaylight} min={0} max={100} unit="%" icon={<Sun size={13} />} />

            <div className="mono" style={{ marginTop: 14, fontSize: 10.8, color: "#5C6673", borderTop: "1px solid #1C232E", paddingTop: 12, lineHeight: 1.7 }}>
              RULE 1 — fan ON if bench occupied &amp; temp ≥ {TEMP_THRESHOLD}°C<br />
              RULE 2 — light ON if bench occupied &amp; daylight &lt; 45%
            </div>
          </div>

          <div style={{ background: "#0A0E14", border: "1px solid #1C232E", borderRadius: 14, padding: 0, flex: 1, minHeight: 260, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ padding: "13px 18px", borderBottom: "1px solid #1C232E", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: 99, background: "#FF5C5C" }} />
              <span style={{ width: 8, height: 8, borderRadius: 99, background: "#FFB020" }} />
              <span style={{ width: 8, height: 8, borderRadius: 99, background: "#3DD68C" }} />
              <span className="mono" style={{ fontSize: 11, color: "#6B7684", marginLeft: 6 }}>decision_log.py — output</span>
            </div>
            <div className="mono" style={{ padding: "14px 18px", fontSize: 11.5, lineHeight: 1.9, overflowY: "auto", flex: 1, maxHeight: 280 }}>
              {log.map((l, i) => (
                <div key={i} style={{ color: l.tone === "alert" ? "#FF8A75" : l.tone === "on" ? "#8FE3C7" : l.tone === "off" ? "#6B7684" : "#9FB0C3" }}>
                  <span style={{ color: "#3E4956" }}>[{l.t}]</span> {l.msg}
                </div>
              ))}
              <div ref={logEndRef} style={{ color: "#FFB020" }}>
                <span className="cursor">▍</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Energy footer */}
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px 28px" }}>
        <div style={{ background: "#0D1420", border: "1px solid #1C232E", borderRadius: 14, padding: 22 }}>
          <div className="disp" style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Energy Comparison — Baseline vs Smart System</div>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 20, alignItems: "center" }}>
            <div>
              <PowerBar label="Baseline (old single-sensor, room always on)" watts={baselineW} max={benches.length * (FAN_WATT + LIGHT_WATT)} color="#4C5665" />
              <div style={{ height: 10 }} />
              <PowerBar label="Smart system (now)" watts={smartW} max={benches.length * (FAN_WATT + LIGHT_WATT)} color="#FFB020" />
            </div>
            <Metric label="Draw reduction" value={`${savingsPct}%`} color="#8FE3C7" />
            <Metric label="Saved this session" value={`${savedKwh.toFixed(3)} kWh`} color="#8FE3C7" />
            <Metric label="≈ Money saved" value={`₹${savedRupees.toFixed(2)}`} color="#FFB020" />
          </div>
          <div className="mono" style={{ fontSize: 10, color: "#4C5665", marginTop: 14 }}>
            Simulated at {SIM_MINUTES_PER_SECOND} sim-minutes/second · tariff ₹{TARIFF_PER_KWH}/kWh · fan {FAN_WATT}W · light {LIGHT_WATT}W per zone — illustrative, for demo purposes.
          </div>
        </div>
      </div>
    </div>
  );
}

function BenchCard({ bench, systemLive, daylight, onToggle }) {
  const fanOn = systemLive && bench.occupied && bench.temp >= TEMP_THRESHOLD;
  const lightOn = systemLive && bench.occupied && daylight < 45;
  return (
    <button
      onClick={() => onToggle(bench.id)}
      style={{
        cursor: "pointer",
        textAlign: "left",
        background: bench.occupied ? "#151F17" : "#10161F",
        border: bench.occupied ? "1px solid #2C4A31" : "1px solid #1C232E",
        borderRadius: 12,
        padding: "12px 12px 10px",
        transition: "border-color 0.2s, background 0.2s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <span className="mono" style={{ fontSize: 11, color: "#6B7684" }}>BENCH {bench.id}</span>
        <Wifi size={11} color={systemLive ? "#3DD68C" : "#4C5665"} className={systemLive ? "live-dot" : ""} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
        <Users size={16} color={bench.occupied ? "#FFB020" : "#3E4956"} />
        <span className="mono" style={{ fontSize: 11.5, color: bench.occupied ? "#E6EDF3" : "#4C5665" }}>
          {bench.occupied ? "Occupied" : "Empty"}
        </span>
      </div>
      <div className="mono" style={{ fontSize: 13, color: "#9FB0C3", marginBottom: 10 }}>
        {bench.temp.toFixed(1)}°C
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4, color: fanOn ? "#8FE3C7" : "#3E4956" }}>
          <Fan size={13} className={fanOn ? "fan-spin" : ""} />
          <span className="mono" style={{ fontSize: 9.5 }}>{fanOn ? "ON" : "OFF"}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, color: lightOn ? "#FFD27A" : "#3E4956" }}>
          <Lightbulb size={13} />
          <span className="mono" style={{ fontSize: 9.5 }}>{lightOn ? "ON" : "OFF"}</span>
        </div>
      </div>
    </button>
  );
}

function StatBox({ icon, label, value }) {
  return (
    <div style={{ background: "#10161F", border: "1px solid #1C232E", borderRadius: 10, padding: "10px 12px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#6B7684", marginBottom: 6 }}>
        {icon}
        <span className="mono" style={{ fontSize: 10 }}>{label}</span>
      </div>
      <div className="mono" style={{ fontSize: 17, color: "#E6EDF3" }}>{value}</div>
    </div>
  );
}

function SliderRow({ label, value, onChange, min, max, unit, icon }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#9FB0C3" }}>
          {icon}
          <span className="mono" style={{ fontSize: 11 }}>{label}</span>
        </div>
        <span className="mono" style={{ fontSize: 11, color: "#FFB020" }}>{value}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: "100%" }}
      />
    </div>
  );
}

function PowerBar({ label, watts, max, color }) {
  const pct = max > 0 ? clamp((watts / max) * 100, 0, 100) : 0;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span className="mono" style={{ fontSize: 10.5, color: "#8B949E" }}>{label}</span>
        <span className="mono" style={{ fontSize: 10.5, color: "#C6D1DE" }}>{Math.round(watts)}W</span>
      </div>
      <div style={{ background: "#151B23", borderRadius: 6, height: 10, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 6, transition: "width 0.6s ease" }} />
      </div>
    </div>
  );
}

function Metric({ label, value, color }) {
  return (
    <div style={{ textAlign: "center", background: "#10161F", border: "1px solid #1C232E", borderRadius: 10, padding: "12px 8px" }}>
      <div className="disp" style={{ fontSize: 19, fontWeight: 700, color }}>{value}</div>
      <div className="mono" style={{ fontSize: 9.5, color: "#6B7684", marginTop: 4 }}>{label}</div>
    </div>
  );
}
