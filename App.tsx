
import React, { useState, useEffect } from 'react';
import { AppStep, UserTwinProfile, Scenario, SimulationResult, SimulationRecord } from './types.ts';
import { runDecisionSimulation } from './services/geminiService.ts';
import { saveSimulation, getHistory } from './services/persistenceService.ts';
import { DecisionIcon } from './DecisionIcon.tsx';
import { 
  Zap, 
  ChevronRight, 
  ArrowLeft, 
  Target, 
  Sparkles,
  Activity,
  History as HistoryIcon,
  ShieldCheck,
  Layers,
  Database,
  Fingerprint,
  ArrowUpRight,
  Monitor,
  Key,
  ExternalLink,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer, 
  Legend
} from 'recharts';

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    aistudio?: AIStudio;
    process?: {
      env?: {
        API_KEY?: string;
      }
    };
  }
}

const Header = ({ onHistoryClick, setStep }: { onHistoryClick: () => void, setStep: (s: AppStep) => void }) => (
  <header className="py-8 flex justify-between items-center px-12 bg-[#050505] sticky top-0 z-50 border-b border-white/5">
    <div className="flex items-center gap-4 cursor-pointer" onClick={() => setStep(AppStep.ONBOARDING)}>
      <DecisionIcon size={48} />
      <h1 className="text-2xl font-bold tracking-tight text-white flex items-baseline">
        HUMAN<span className="text-cyan-400 font-light ml-0.5">OS</span>
      </h1>
    </div>
    <div className="flex items-center gap-10">
      <button 
        onClick={onHistoryClick}
        className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-white transition-colors flex items-center gap-2"
      >
        <HistoryIcon size={14} /> JOURNEY LOGS
      </button>
      <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.1em] text-cyan-400 bg-cyan-400/5 px-4 py-2 rounded-full border border-cyan-400/20">
        <ShieldCheck size={12} /> SANDBOX MODE V1.4
      </div>
    </div>
  </header>
);

const LandingHero = ({ onStart }: { onStart: () => void }) => (
  <div className="flex flex-col items-center justify-center pt-32 pb-24 text-center px-6 max-w-6xl mx-auto">
    <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-[#0a1a1f] border border-cyan-400/20 text-[10px] font-black tracking-[0.2em] text-cyan-400 uppercase mb-16">
      <Layers size={14} /> THE SIMULATION LAYER FOR HUMAN DECISIONS
    </div>

    <h1 className="text-7xl md:text-[6.8rem] font-display font-black mb-10 tracking-tight leading-[1.0] text-white">
      Stress-test your <br/>
      <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-amber-500 bg-clip-text text-transparent">life choices.</span>
    </h1>

    <p className="text-gray-500 text-xl md:text-2xl max-w-3xl mx-auto mb-20 leading-relaxed font-light">
      Decisions are permanent. Simulations aren't. <br/>
      The first personal sandbox to map career trajectories against your <br/>
      core values using stochastic reasoning.
    </p>

    <div className="flex gap-6">
      <button 
        onClick={onStart}
        className="px-10 py-5 bg-cyan-400 hover:bg-cyan-300 text-black font-black uppercase text-xs tracking-[0.2em] rounded-xl transition-all shadow-[0_0_30px_rgba(34,211,238,0.3)] flex items-center gap-4"
      >
        INITIALIZE SANDBOX <ChevronRight size={18} />
      </button>
      <button className="px-10 py-5 bg-white/5 border border-white/10 text-white font-black uppercase text-xs tracking-[0.2em] rounded-xl transition-all hover:bg-white/10 flex items-center gap-4">
        HOW IT WORKS <ArrowUpRight size={18} className="opacity-50" />
      </button>
    </div>
  </div>
);

const GlassCard: React.FC<{ children?: React.ReactNode, className?: string, border?: string }> = ({ children, className = "", border = "border-white/10" }) => (
  <div className={`glass rounded-3xl p-8 ${border} ${className}`}>
    {children}
  </div>
);

export default function App() {
  const [step, setStep] = useState<AppStep>(AppStep.ONBOARDING);
  const [isLanding, setIsLanding] = useState(true);

  const [profile, setProfile] = useState<UserTwinProfile>({
    name: '',
    major: '',
    coreValues: [],
    topSkills: []
  });
  const [scenarioA, setScenarioA] = useState<Scenario>({ title: '', description: '' });
  const [scenarioB, setScenarioB] = useState<Scenario>({ title: '', description: '' });
  const [simulation, setSimulation] = useState<SimulationResult | null>(null);
  const [history, setHistory] = useState<SimulationRecord[]>([]);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [isBridgeUnavailable, setIsBridgeUnavailable] = useState(false);

  useEffect(() => {
    setHistory(getHistory());
  }, [step]);

  const handleConnectKey = async () => {
    try {
      if (window.aistudio) {
        await window.aistudio.openSelectKey();
        setShowKeyModal(false);
        // Requirement: Assume success and try simulation again
        await executeSimulation();
      } else {
        setIsBridgeUnavailable(true);
      }
    } catch (e) {
      console.error("Neural link bridge failure:", e);
      setIsBridgeUnavailable(true);
    }
  };

  const prefillDemo = () => {
    setProfile({
      name: 'Alex Chen',
      major: 'Bio-Systems Engineering',
      coreValues: ['Intellectual Autonomy', 'Environmental Impact', 'Stability'],
      topSkills: ['Systems Design', 'Data Ethics', 'Process Optimization']
    });
    setScenarioA({
      title: 'Global Tech Corp R&D',
      description: 'Joining a tier-1 multinational lab as a specialist. High resources, high stability, rigid hierarchies, lower individual impact.'
    });
    setScenarioB({
      title: 'Eco-Tech Seed Startup',
      description: 'Founding member of a 4-person sustainability tech team. High agency, extreme volatility, high personal growth, uncertain funding.'
    });
  };

  const startSimulation = async () => {
    // Optimistic Start: Don't block. Try to run. 
    // This allows Vercel environment variables to work if they are present.
    await executeSimulation();
  };

  const executeSimulation = async () => {
    setStep(AppStep.SIMULATING);
    try {
      const result = await runDecisionSimulation(profile, scenarioA, scenarioB);
      const record: SimulationRecord = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        profile,
        scenarioA,
        scenarioB,
        results: result
      };
      saveSimulation(record);
      setSimulation(result);
      setStep(AppStep.DASHBOARD);
    } catch (error: any) {
      console.error("Simulation engine failed:", error);
      const errorMessage = (error?.message || "").toLowerCase();
      
      // If the error indicates a missing or invalid key, trigger the modal
      if (
        errorMessage.includes("api key") || 
        errorMessage.includes("401") || 
        errorMessage.includes("403") ||
        errorMessage.includes("not found")
      ) {
        setShowKeyModal(true);
        setStep(AppStep.SCENARIO_INPUT);
      } else {
        alert(`Engine Critical Error: ${error?.message || "Stochastic process interrupted."}`);
        setStep(AppStep.SCENARIO_INPUT);
      }
    }
  };

  const loadPastSimulation = (record: SimulationRecord) => {
    setProfile(record.profile);
    setScenarioA(record.scenarioA);
    setScenarioB(record.scenarioB);
    setSimulation(record.results);
    setStep(AppStep.DASHBOARD);
  };

  const radarData = simulation ? [
    { subject: 'Skill Growth', A: simulation.scenarioA.skillGrowth, B: simulation.scenarioB.skillGrowth, C: simulation.scenarioC.skillGrowth, fullMark: 100 },
    { subject: 'Value Align', A: simulation.scenarioA.valueAlignment, B: simulation.scenarioB.valueAlignment, C: simulation.scenarioC.valueAlignment, fullMark: 100 },
    { subject: 'Optionality', A: simulation.scenarioA.futureOptionality, B: simulation.scenarioB.futureOptionality, C: simulation.scenarioC.futureOptionality, fullMark: 100 },
    { subject: 'Resistance', A: 100 - simulation.scenarioA.frictionIndicator, B: 100 - simulation.scenarioB.frictionIndicator, C: 100 - simulation.scenarioC.frictionIndicator, fullMark: 100 },
  ] : [];

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-cyan-400/30">
      <Header 
        onHistoryClick={() => { setIsLanding(false); setStep(AppStep.HISTORY); }} 
        setStep={setStep}
      />

      {isLanding ? (
        <LandingHero onStart={() => setIsLanding(false)} />
      ) : (
        <div className="animate-in fade-in duration-700 max-w-7xl mx-auto px-12 py-12">
          
          {showKeyModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md px-6">
              <GlassCard className="max-w-md w-full border-cyan-400/30 text-center py-12 shadow-[0_0_50px_rgba(34,211,238,0.1)]">
                <div className="w-20 h-20 bg-cyan-400/10 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-cyan-400/20">
                  <Key className="text-cyan-400" size={40} />
                </div>
                <h2 className="text-3xl font-display font-black mb-4">Neural Link Required</h2>
                <p className="text-gray-400 mb-10 text-sm leading-relaxed max-w-[280px] mx-auto">
                  To power high-fidelity simulations, connect your Gemini API key.
                </p>
                
                {isBridgeUnavailable && (
                  <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-3 text-left">
                    <AlertTriangle className="text-amber-500 shrink-0" size={20} />
                    <p className="text-[10px] text-amber-400 font-bold uppercase leading-tight">
                      Vercel Warning: If you've already set API_KEY, you must <span className="underline">Redeploy</span> in the Vercel dashboard for changes to take effect.
                    </p>
                  </div>
                )}
                
                <div className="space-y-4">
                  {window.aistudio && (
                    <button 
                      onClick={handleConnectKey}
                      className="w-full bg-cyan-400 text-black font-black uppercase text-[11px] tracking-[0.3em] py-5 rounded-2xl flex items-center justify-center gap-3 transition-all hover:bg-cyan-300 shadow-[0_0_30px_rgba(34,211,238,0.3)]"
                    >
                      CONNECT API KEY <ChevronRight size={16} />
                    </button>
                  )}
                  
                  <button 
                    onClick={executeSimulation}
                    className="w-full bg-white/5 border border-white/10 text-white font-black uppercase text-[11px] tracking-[0.3em] py-5 rounded-2xl flex items-center justify-center gap-3 transition-all hover:bg-white/10"
                  >
                    <RefreshCw size={14} /> RETRY SIMULATION
                  </button>

                  <a 
                    href="https://ai.google.dev/gemini-api/docs/billing" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 text-gray-500 hover:text-cyan-400 transition-colors text-[10px] font-bold uppercase tracking-widest pt-4"
                  >
                    LEARN ABOUT BILLING <ExternalLink size={12} />
                  </a>
                </div>
                
                <button 
                  onClick={() => setShowKeyModal(false)}
                  className="mt-8 text-gray-700 hover:text-gray-500 text-[9px] font-black uppercase tracking-[0.2em] transition-colors"
                >
                  DISMISS
                </button>
              </GlassCard>
            </div>
          )}

          {step === AppStep.ONBOARDING && (
            <GlassCard className="max-w-3xl mx-auto relative border-cyan-400/10">
              <div className="absolute top-0 right-0 p-8">
                 <button 
                  onClick={prefillDemo}
                  className="group text-[9px] font-black bg-white/5 text-gray-500 px-4 py-2 rounded-full border border-white/10 hover:border-cyan-400/50 hover:text-cyan-400 transition-all flex items-center gap-2"
                 >
                   <Sparkles size={12} /> INITIALIZE DEMO TWIN
                 </button>
              </div>
              
              <div className="mb-10">
                <h3 className="text-2xl font-display font-bold mb-2 flex items-center gap-4 text-white">
                  <Fingerprint className="text-cyan-400 w-6 h-6" /> Sandbox Persona
                </h3>
                <p className="text-gray-500 text-sm font-light italic">Define your current state to anchor the future trajectories.</p>
              </div>

              <div className="space-y-10">
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <label className="block text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] mb-3">Alias/Identity</label>
                    <input 
                      value={profile.name}
                      onChange={e => setProfile({...profile, name: e.target.value})}
                      placeholder="e.g. Alex"
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 focus:outline-none focus:border-cyan-400/50 transition-all text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] mb-3">Context/Domain</label>
                    <input 
                      value={profile.major}
                      onChange={e => setProfile({...profile, major: e.target.value})}
                      placeholder="e.g. Systems Design"
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 focus:outline-none focus:border-cyan-400/50 transition-all text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] mb-3">Anchoring Values</label>
                  <input 
                    value={profile.coreValues.join(', ')}
                    onChange={e => setProfile({...profile, coreValues: e.target.value.split(',').map(s => s.trim())})}
                    placeholder="e.g. Autonomy, Stability, Impact"
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 focus:outline-none focus:border-cyan-400/50 transition-all text-white"
                  />
                </div>
                <button 
                  onClick={() => setStep(AppStep.SCENARIO_INPUT)}
                  disabled={!profile.name || !profile.major}
                  className="w-full bg-cyan-400 text-black font-black uppercase text-[10px] tracking-[0.3em] py-5 rounded-2xl flex items-center justify-center gap-3 transition-all hover:bg-cyan-300 disabled:opacity-20 shadow-lg"
                >
                  CONSTRUCT PATHS <ChevronRight size={16} />
                </button>
              </div>
            </GlassCard>
          )}

          {step === AppStep.SCENARIO_INPUT && (
            <div className="space-y-16">
              <div className="text-center">
                <h3 className="text-3xl font-display font-black tracking-tight text-white">Strategic Forks</h3>
                <p className="text-gray-500 mt-2 italic font-light">Input two divergent scenarios. We hypothesize a third synthesis path.</p>
              </div>
              
              <div className="grid lg:grid-cols-2 gap-10">
                <GlassCard border="border-purple-500/20" className="relative group overflow-hidden">
                  <div className="flex items-center gap-3 mb-6 text-purple-400 uppercase text-[9px] font-black tracking-[0.2em]">
                    <div className="w-2 h-2 rounded-full bg-purple-500" /> Scenario Alpha
                  </div>
                  <input 
                    placeholder="Branch Title (e.g. Corporate Path)"
                    className="w-full bg-transparent border-b border-white/10 py-3 mb-6 text-xl font-bold focus:outline-none focus:border-purple-500/50 text-white"
                    onChange={e => setScenarioA({...scenarioA, title: e.target.value})}
                    value={scenarioA.title}
                  />
                  <textarea 
                    rows={4}
                    placeholder="Describe the environmental conditions..."
                    className="w-full bg-transparent border-none resize-none focus:outline-none text-gray-400 text-md leading-relaxed"
                    onChange={e => setScenarioA({...scenarioA, description: e.target.value})}
                    value={scenarioA.description}
                  />
                </GlassCard>
                
                <GlassCard border="border-amber-500/20" className="relative group overflow-hidden">
                  <div className="flex items-center gap-3 mb-6 text-amber-500 uppercase text-[9px] font-black tracking-[0.2em]">
                    <div className="w-2 h-2 rounded-full bg-amber-500" /> Scenario Beta
                  </div>
                  <input 
                    placeholder="Branch Title (e.g. Startup Path)"
                    className="w-full bg-transparent border-b border-white/10 py-3 mb-6 text-xl font-bold focus:outline-none focus:border-amber-500/50 text-white"
                    onChange={e => setScenarioB({...scenarioB, title: e.target.value})}
                    value={scenarioB.title}
                  />
                  <textarea 
                    rows={4}
                    placeholder="Describe the environmental conditions..."
                    className="w-full bg-transparent border-none resize-none focus:outline-none text-gray-400 text-md leading-relaxed"
                    onChange={e => setScenarioB({...scenarioB, description: e.target.value})}
                    value={scenarioB.description}
                  />
                </GlassCard>
              </div>


              
              <div className="flex justify-center gap-4">
                <button onClick={() => setStep(AppStep.ONBOARDING)} className="px-6 py-4 rounded-xl border border-white/10 hover:bg-white/5 transition-colors text-gray-500"><ArrowLeft /></button>
                <button 
                  onClick={startSimulation}
                  disabled={!scenarioA.title || !scenarioB.title}
                  className="px-12 py-4 bg-cyan-400 text-black font-black uppercase text-[10px] tracking-[0.3em] rounded-xl flex items-center justify-center gap-3 shadow-xl disabled:opacity-20"
                >
                  <Sparkles size={16} /> Run Engine
                </button>
              </div>
            </div>
          )}

          {step === AppStep.SIMULATING && (
            <div className="flex flex-col items-center justify-center py-40 text-center">
              <div className="relative mb-12">
                <div className="w-32 h-32 border-t-2 border-cyan-400 rounded-full animate-spin shadow-[0_0_40px_rgba(6,182,212,0.1)]" />
                <div className="absolute inset-0 m-auto flex items-center justify-center">
                  <DecisionIcon size={64} className="animate-pulse" />
                </div>
              </div>
              <h3 className="text-2xl font-display font-black tracking-tight mb-2 text-white">Neural Path Synthesis</h3>
              <p className="text-cyan-400/50 text-[9px] uppercase font-black tracking-[0.4em] animate-pulse">
                GENERATING FAST SNAPSHOT...
              </p>
            </div>
          )}

          {step === AppStep.DASHBOARD && simulation && (
            <div className="space-y-12 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col md:flex-row justify-between items-end gap-10">
                <div className="max-w-2xl">
                  <h2 className="text-4xl font-display font-black tracking-tight mb-3 text-white">Trajectory Comparison</h2>
                  <p className="text-gray-500 text-lg font-light italic">Comparing paths for <span className="text-cyan-400 font-bold">{profile.name}</span>.</p>
                </div>
                <div className="bg-white/[0.03] px-8 py-4 rounded-2xl border border-white/5 text-right">
                  <div className="text-[9px] uppercase font-black text-gray-600 tracking-[0.2em] mb-1">Sim Coherence</div>
                  <div className="text-3xl font-display font-black text-cyan-400">84.2%</div>
                </div>
              </div>

              <div className="grid lg:grid-cols-12 gap-8">
                <GlassCard className="lg:col-span-8 h-[500px] flex flex-col">
                  <h3 className="text-[9px] font-black uppercase text-gray-500 tracking-[0.3em] mb-10 flex items-center gap-3">
                    <Activity size={14} className="text-cyan-400" /> Stochastic Analysis
                  </h3>
                  <div className="flex-1 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                        <PolarGrid stroke="#1e293b" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 10, fontWeight: 700 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                        <Radar name={simulation.scenarioA.title} dataKey="A" stroke="#a855f7" fill="#a855f7" fillOpacity={0.1} strokeWidth={2} />
                        <Radar name={simulation.scenarioB.title} dataKey="B" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.1} strokeWidth={2} />
                        <Radar name={simulation.scenarioC.title} dataKey="C" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.2} strokeWidth={3} />
                        <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '30px' }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </GlassCard>

                <div className="lg:col-span-4 space-y-6">
                  <GlassCard className="bg-cyan-400/[0.02] border-cyan-400/20 h-full">
                    <h3 className="text-[9px] font-black uppercase text-cyan-400 tracking-[0.3em] mb-6 flex items-center gap-3">
                      <Zap size={14} className="text-cyan-400" /> Synthesis Hypothesis
                    </h3>
                    <div className="text-base italic leading-relaxed text-gray-300 font-light">
                      "{simulation.comparativeAnalysis}"
                    </div>
                  </GlassCard>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                {[simulation.scenarioA, simulation.scenarioB, simulation.scenarioC].map((s, idx) => (
                  <GlassCard 
                    key={idx} 
                    border={idx === 2 ? "border-cyan-400/30" : "border-white/5"} 
                    className={idx === 2 ? "bg-cyan-400/[0.03]" : ""}
                  >
                    <div className="flex justify-between items-start mb-6">
                       <div>
                         <span className="text-[8px] font-black uppercase tracking-[0.3em] text-gray-600 block mb-1">{idx === 2 ? 'Synthesis' : `Branch ${idx === 0 ? 'A' : 'B'}`}</span>
                         <h4 className="text-xl font-display font-black leading-tight text-white">{s.title}</h4>
                       </div>
                    </div>
                    <p className="text-sm text-gray-500 italic mb-8 leading-relaxed">"{s.narrativeSnapshot}"</p>
                  </GlassCard>
                ))}
              </div>

              <div className="text-center pt-8">
                <button onClick={() => setStep(AppStep.ONBOARDING)} className="px-10 py-4 bg-white/[0.03] border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-[0.3em] hover:bg-white/10 transition-all text-gray-600 hover:text-white flex items-center gap-3 mx-auto">
                  <Database size={14} /> RESET SANDBOX
                </button>
              </div>
            </div>
          )}

          {step === AppStep.HISTORY && (
            <div className="max-w-4xl mx-auto space-y-12">
               <div className="flex justify-between items-end border-b border-white/5 pb-8">
                 <div>
                   <h3 className="text-4xl font-display font-black tracking-tight flex items-center gap-6 text-white">
                     <HistoryIcon size={36} className="text-cyan-400" /> Journey Logs
                   </h3>
                 </div>
               </div>
               <div className="space-y-4">
                 {history.length === 0 ? (
                   <div className="glass p-20 rounded-3xl text-center text-gray-700 italic border-dashed border-white/10 text-lg">No logs detected.</div>
                 ) : (
                   history.map((record) => (
                     <div key={record.id} onClick={() => loadPastSimulation(record)} className="glass p-6 rounded-2xl border-white/5 hover:border-cyan-400/30 cursor-pointer flex justify-between items-center group transition-all">
                        <div className="flex items-center gap-8">
                           <div>
                              <div className="flex items-center gap-4 text-lg font-bold">
                                <span className="text-purple-400">{record.scenarioA.title}</span>
                                <span className="text-gray-800 text-[8px] font-black uppercase italic">vs</span>
                                <span className="text-amber-500">{record.scenarioB.title}</span>
                              </div>
                           </div>
                        </div>
                        <ChevronRight className="text-gray-800 group-hover:text-white transition-all" />
                     </div>
                   ))
                 )}
               </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
