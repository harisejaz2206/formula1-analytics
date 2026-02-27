import React, { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Activity,
  BookOpen,
  ChevronRight,
  Gauge,
  MapPin,
  Sparkles,
  Timer,
  TrendingUp,
  Trophy,
  Users,
} from 'lucide-react';

type Compound = 'soft' | 'medium' | 'hard';

interface StrategyDriver {
  id: string;
  name: string;
  team: string;
  baselinePit: number;
  baseDelta: number;
  baseRisk: number;
}

const telemetryMessages = [
  'MODEL: RACE PACE WINDOW ACTIVE',
  'SIM: OVERTAKE PROBABILITY RECOMPUTED',
  'TRACK EVOLUTION: +0.12S TREND',
  'LIVE GAP ENGINE: TOP 5 DRIVERS LOCKED',
  'PIT LOSS MODEL: GREEN WINDOW OPEN',
];

const raceControlSignals = [
  { label: 'Data Freshness', value: '2.4s ago', tone: 'text-emerald-400' },
  { label: 'Model Confidence', value: '93.2%', tone: 'text-f1-text' },
  { label: 'Risk Engine', value: 'Low Volatility', tone: 'text-cyan-400' },
  { label: 'Telemetry Status', value: 'Healthy', tone: 'text-emerald-400' },
];

const strategyDrivers: StrategyDriver[] = [
  { id: 'verstappen', name: 'Max Verstappen', team: 'Red Bull', baselinePit: 24, baseDelta: -1.5, baseRisk: 28 },
  { id: 'hamilton', name: 'Lewis Hamilton', team: 'Mercedes', baselinePit: 25, baseDelta: -0.8, baseRisk: 34 },
  { id: 'leclerc', name: 'Charles Leclerc', team: 'Ferrari', baselinePit: 23, baseDelta: -0.9, baseRisk: 36 },
  { id: 'norris', name: 'Lando Norris', team: 'McLaren', baselinePit: 24, baseDelta: -0.6, baseRisk: 31 },
];

const compoundImpact: Record<
  Compound,
  { label: string; timeImpact: number; risk: number; confidencePenalty: number; summary: string }
> = {
  soft: {
    label: 'Soft',
    timeImpact: -0.45,
    risk: 16,
    confidencePenalty: 6,
    summary: 'Higher pace upside, higher degradation volatility.',
  },
  medium: {
    label: 'Medium',
    timeImpact: 0,
    risk: 0,
    confidencePenalty: 0,
    summary: 'Balanced race pace and predictable tire life.',
  },
  hard: {
    label: 'Hard',
    timeImpact: 0.42,
    risk: -6,
    confidencePenalty: 2,
    summary: 'Stability first, pace trade-off likely.',
  },
};

const proofItems = [
  { icon: Activity, title: 'API-integrated', text: 'Live race and season feeds in production pipeline.' },
  { icon: Gauge, title: 'Performance-first', text: 'Route-split frontend with fast first interaction.' },
  { icon: Sparkles, title: 'Product-grade UX', text: 'Designed for premium analytics workflows.' },
  { icon: TrendingUp, title: 'Insight-led', text: 'Comparative metrics with strategy interpretation.' },
];

const capabilityCards = [
  {
    icon: Timer,
    title: 'Live Race Intelligence',
    insight: 'Top-5 delta model updates every race context switch.',
    stat: 'Realtime',
    href: '/live',
  },
  {
    icon: Users,
    title: 'Driver and Team Modeling',
    insight: 'Teammate parity and championship pressure mapped together.',
    stat: '20 Drivers',
    href: '/profiles',
  },
  {
    icon: MapPin,
    title: 'Circuit Context Engine',
    insight: 'Track geography layered with weekend performance framing.',
    stat: '24 Circuits',
    href: '/tracks',
  },
  {
    icon: Trophy,
    title: 'Season Storyline Lab',
    insight: 'Points progression, constructor share, and momentum arcs.',
    stat: 'Season-wide',
    href: '/season',
  },
];

const Home: React.FC = () => {
  const strategyRef = useRef<HTMLElement | null>(null);
  const [messageIndex, setMessageIndex] = useState(0);
  const [selectedDriverId, setSelectedDriverId] = useState(strategyDrivers[0].id);
  const [pitLap, setPitLap] = useState(24);
  const [compound, setCompound] = useState<Compound>('medium');
  const [isSimulating, setIsSimulating] = useState(false);
  const [lastSimulation, setLastSimulation] = useState<Date>(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((previous) => (previous + 1) % telemetryMessages.length);
    }, 2600);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isSimulating) {
      return;
    }

    const timer = window.setTimeout(() => {
      setIsSimulating(false);
      setLastSimulation(new Date());
    }, 1150);

    return () => window.clearTimeout(timer);
  }, [isSimulating]);

  const selectedDriver = useMemo(
    () => strategyDrivers.find((driver) => driver.id === selectedDriverId) ?? strategyDrivers[0],
    [selectedDriverId],
  );

  const simulation = useMemo(() => {
    const compoundModel = compoundImpact[compound];
    const pitShift = pitLap - selectedDriver.baselinePit;
    const projectedDeltaSeconds = selectedDriver.baseDelta + pitShift * 0.16 + compoundModel.timeImpact;
    const positionSwing =
      projectedDeltaSeconds <= -1.6
        ? 2
        : projectedDeltaSeconds <= -0.5
          ? 1
          : projectedDeltaSeconds < 0.8
            ? 0
            : projectedDeltaSeconds < 1.8
              ? -1
              : -2;
    const riskScore = Math.min(95, Math.max(18, selectedDriver.baseRisk + Math.abs(pitShift) * 2.8 + compoundModel.risk));
    const confidence = Math.min(
      98,
      Math.max(52, 95 - Math.abs(pitShift) * 2 - compoundModel.confidencePenalty - selectedDriver.baseRisk * 0.35),
    );
    const recommendedLap = selectedDriver.baselinePit + (compound === 'hard' ? 2 : compound === 'soft' ? -1 : 0);

    return {
      pitShift,
      projectedDeltaSeconds,
      positionSwing,
      riskScore,
      confidence,
      recommendedLap,
      recommendation:
        riskScore > 70
          ? `High volatility detected. Consider pit lap ${recommendedLap} for a safer window.`
          : projectedDeltaSeconds < 0
            ? `This setup is projected to gain ${Math.abs(projectedDeltaSeconds).toFixed(2)}s versus baseline.`
            : `Current setup is conservative. Move pit window closer to lap ${recommendedLap} for upside.`,
      compoundSummary: compoundModel.summary,
    };
  }, [compound, pitLap, selectedDriver]);

  const onRunDemo = () => {
    strategyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setIsSimulating(true);
  };

  return (
    <div className="space-y-8 pb-8">
      <section className="f1-card overflow-hidden p-0">
        <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="relative space-y-7 p-7 sm:p-10">
            <div className="pointer-events-none absolute -top-24 right-10 h-56 w-56 rounded-full bg-f1-red/20 blur-3xl" />
            <p className="f1-overline">PREMIUM FORMULA 1 ANALYTICS</p>
            <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-f1-text sm:text-5xl lg:text-6xl">
              Race Intelligence,
              <span className="block text-f1-red">Not Just Race Data.</span>
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-f1-muted sm:text-lg">
              F1IQ turns raw race feeds into a premium product demo experience with live context, strategic simulation, and
              data-story clarity from the first interaction.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button type="button" onClick={onRunDemo} className="f1-button">
                <Sparkles className="h-4 w-4" />
                {isSimulating ? 'Running Demo...' : 'Run 30s Demo'}
              </button>
              <NavLink to="/live" className="f1-button-secondary">
                <Timer className="h-4 w-4" />
                Open Live Dashboard
                <ChevronRight className="h-4 w-4" />
              </NavLink>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-f1-muted">
              <span className="rounded-full border border-f1-gray/35 bg-f1-surface-soft px-3 py-1.5 uppercase tracking-[0.12em]">
                React + TypeScript
              </span>
              <span className="rounded-full border border-f1-gray/35 bg-f1-surface-soft px-3 py-1.5 uppercase tracking-[0.12em]">
                API-Integrated
              </span>
              <span className="rounded-full border border-f1-gray/35 bg-f1-surface-soft px-3 py-1.5 uppercase tracking-[0.12em]">
                Product Demo Ready
              </span>
            </div>

            <p className="text-sm text-f1-muted">
              Built by <NavLink to="/about" className="text-f1-text underline decoration-f1-red/70 underline-offset-4">Haris Ejaz</NavLink> for
              premium motorsport analytics experiences.
            </p>
          </div>

          <div className="hero-control-grid relative border-t border-f1-gray/30 bg-f1-black/40 p-6 sm:p-8 lg:border-l lg:border-t-0">
            <div className="f1-card h-full p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-f1-muted">Race Control Preview</p>
                  <p className="mt-1 text-lg font-semibold text-f1-text">Live Weekend Intelligence</p>
                </div>
                <div className="hero-signal-dot" />
              </div>

              <div className="mb-4 rounded-xl border border-f1-gray/30 bg-f1-black/35 p-3 font-mono text-xs text-f1-red sm:text-sm">
                {telemetryMessages[messageIndex]}
              </div>

              <div className="relative mb-4 rounded-xl border border-f1-gray/30 bg-f1-surface-soft/75 p-4">
                <svg viewBox="0 0 320 150" className="h-32 w-full">
                  <path
                    d="M22 106C18 67 44 38 82 33H147C173 33 190 46 199 62L227 96C238 110 250 117 266 117H297"
                    className="hero-track-path"
                  />
                  <path d="M22 106H89L122 83H158L187 104H240L297 117" className="hero-track-path-secondary" />
                  <circle cx="199" cy="62" r="5" fill="rgb(var(--f1-neon))" />
                  <circle cx="122" cy="83" r="4" fill="rgb(var(--f1-red))" />
                </svg>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {raceControlSignals.map((signal) => (
                  <div key={signal.label} className="rounded-lg border border-f1-gray/30 bg-f1-surface-soft/60 p-3">
                    <p className="text-[11px] uppercase tracking-[0.12em] text-f1-muted">{signal.label}</p>
                    <p className={`mt-1 text-sm font-semibold ${signal.tone}`}>{signal.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {proofItems.map((item) => (
          <article key={item.title} className="f1-card p-4">
            <item.icon className="mb-3 h-5 w-5 text-f1-red" />
            <h2 className="text-base font-semibold text-f1-text">{item.title}</h2>
            <p className="mt-1 text-sm text-f1-muted">{item.text}</p>
          </article>
        ))}
      </section>

      <section ref={strategyRef} className="f1-card p-6 sm:p-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="f1-overline">SIGNATURE INTERACTION</p>
            <h2 className="text-3xl font-semibold text-f1-text">Strategy Sandbox (Lite)</h2>
            <p className="mt-2 max-w-2xl text-f1-muted">
              Adjust the pit window and compound, then see projected race impact instantly. This is the first step toward a full strategy engine.
            </p>
          </div>
          <div className="rounded-lg border border-f1-gray/35 bg-f1-surface-soft px-3 py-2 text-sm text-f1-muted">
            Last run: <span className="text-f1-text">{lastSimulation.toLocaleTimeString()}</span>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium uppercase tracking-[0.12em] text-f1-muted">Driver</label>
              <select
                className="f1-select"
                value={selectedDriverId}
                onChange={(event) => setSelectedDriverId(event.target.value)}
              >
                {strategyDrivers.map((driver) => (
                  <option key={driver.id} value={driver.id}>
                    {driver.name} ({driver.team})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium uppercase tracking-[0.12em] text-f1-muted">Pit Lap Window</label>
                <span className="text-sm font-semibold text-f1-text">Lap {pitLap}</span>
              </div>
              <input
                type="range"
                min={15}
                max={40}
                value={pitLap}
                onChange={(event) => setPitLap(Number(event.target.value))}
                className="strategy-slider"
                aria-label="Pit lap slider"
              />
              <div className="mt-2 flex justify-between text-xs text-f1-muted">
                <span>Conservative (15)</span>
                <span>Aggressive (40)</span>
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium uppercase tracking-[0.12em] text-f1-muted">Compound</p>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(compoundImpact) as Compound[]).map((compoundType) => (
                  <button
                    key={compoundType}
                    type="button"
                    onClick={() => setCompound(compoundType)}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                      compound === compoundType
                        ? 'border-f1-red/55 bg-f1-red/15 text-f1-text'
                        : 'border-f1-gray/45 bg-f1-surface-soft text-f1-muted hover:text-f1-text'
                    }`}
                  >
                    {compoundImpact[compoundType].label}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-sm text-f1-muted">{simulation.compoundSummary}</p>
            </div>

            <button type="button" className="f1-button" onClick={() => setIsSimulating(true)}>
              <Activity className="h-4 w-4" />
              {isSimulating ? 'Recomputing Scenario...' : 'Recompute Scenario'}
            </button>
          </div>

          <div className="rounded-2xl border border-f1-gray/30 bg-gradient-to-br from-f1-surface-soft to-f1-surface p-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-f1-muted">Projected Outcome</p>
                <p className="mt-1 text-xl font-semibold text-f1-text">{selectedDriver.name}</p>
              </div>
              <span className="rounded-full bg-f1-red/10 px-3 py-1 text-sm font-semibold text-f1-red">{selectedDriver.team}</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-f1-gray/35 bg-f1-black/35 p-3">
                <p className="text-xs uppercase tracking-[0.1em] text-f1-muted">Delta vs Baseline</p>
                <p
                  className={`mt-1 text-2xl font-semibold ${
                    simulation.projectedDeltaSeconds <= 0 ? 'text-emerald-400' : 'text-amber-300'
                  }`}
                >
                  {simulation.projectedDeltaSeconds > 0 ? '+' : ''}
                  {simulation.projectedDeltaSeconds.toFixed(2)}s
                </p>
              </div>
              <div className="rounded-lg border border-f1-gray/35 bg-f1-black/35 p-3">
                <p className="text-xs uppercase tracking-[0.1em] text-f1-muted">Position Swing</p>
                <p className={`mt-1 text-2xl font-semibold ${simulation.positionSwing >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {simulation.positionSwing >= 0 ? '+' : ''}
                  {simulation.positionSwing}
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <div className="mb-1 flex justify-between text-xs text-f1-muted">
                  <span>Risk Score</span>
                  <span>{Math.round(simulation.riskScore)} / 100</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-f1-gray/40">
                  <div className="h-full rounded-full bg-amber-400" style={{ width: `${simulation.riskScore}%` }} />
                </div>
              </div>
              <div>
                <div className="mb-1 flex justify-between text-xs text-f1-muted">
                  <span>Confidence</span>
                  <span>{Math.round(simulation.confidence)}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-f1-gray/40">
                  <div className="h-full rounded-full bg-emerald-400" style={{ width: `${simulation.confidence}%` }} />
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-lg border border-f1-gray/30 bg-f1-surface-soft/70 p-3">
              <p className="text-xs uppercase tracking-[0.12em] text-f1-muted">Recommendation</p>
              <p className="mt-1 text-sm text-f1-text">{simulation.recommendation}</p>
              <p className="mt-2 text-xs text-f1-muted">
                Baseline lap {selectedDriver.baselinePit}; suggested test lap {simulation.recommendedLap}.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {capabilityCards.map((card) => (
          <NavLink key={card.title} to={card.href} className="f1-card group p-5">
            <div className="mb-4 flex items-center justify-between">
              <card.icon className="h-6 w-6 text-f1-red" />
              <span className="rounded-full bg-f1-red/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-f1-red">
                {card.stat}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-f1-text">{card.title}</h3>
            <p className="mt-2 text-sm text-f1-muted">{card.insight}</p>
            <div className="mt-4 inline-flex items-center text-sm font-medium text-f1-red">
              Explore module
              <ChevronRight className="ml-1 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </div>
          </NavLink>
        ))}
      </section>

      <section className="f1-card p-6 text-center sm:p-8">
        <h2 className="text-2xl font-semibold text-f1-text sm:text-3xl">Need context before diving into analytics?</h2>
        <p className="mx-auto mt-3 max-w-2xl text-f1-muted">
          New to the sport or onboarding non-F1 stakeholders? Start with the guide, then jump into live strategy and standings modules.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <NavLink to="/guide" className="f1-button">
            <BookOpen className="h-4 w-4" />
            Open F1 Guide
          </NavLink>
          <NavLink to="/profiles" className="f1-button-secondary">
            <Users className="h-4 w-4" />
            Compare Drivers and Teams
          </NavLink>
        </div>
      </section>

      <footer className="px-2 pt-2 text-center text-sm text-f1-muted">
        Built as a portfolio-grade analytics product for high-end data product engineering and UI delivery.
        <span className="ml-1 text-f1-text">F1IQ by Haris Ejaz.</span>
      </footer>
    </div>
  );
};

export default Home;
