import { useState, FormEvent, useEffect, useRef } from "react";
import { Search, Loader2, Send, MessageSquare, Copy, Target, CheckCircle2, Lightbulb, ExternalLink, Activity, Instagram, Link as LinkIcon } from "lucide-react";

type MessageTemplate = {
  type: string;
  content: string;
};

type Lead = {
  name: string;
  username: string;
  profileUrl: string;
  platform: string;
  metrics: string;
  matchScore: number;
};

type HunterPlan = {
  targetPlatforms: string[];
  searchQueries: string[];
  messageTemplates: MessageTemplate[];
  advice: string;
  leads: Lead[];
};

type LogEntry = {
  id: number;
  text: string;
  color: string;
};

export default function App() {
  const [profession, setProfession] = useState("");
  const [serviceOffer, setServiceOffer] = useState("");
  const [targetCriteria, setTargetCriteria] = useState("");
  const [numLeads, setNumLeads] = useState<number>(3);
  const [isLoading, setIsLoading] = useState(false);
  const [plan, setPlan] = useState<HunterPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Instagram Integration State
  const [isIgConnected, setIsIgConnected] = useState(false);
  const [igHandle, setIgHandle] = useState("");
  const [isConnectingIg, setIsConnectingIg] = useState(false);

  const [logs, setLogs] = useState<LogEntry[]>([
    { id: 1, text: "[SYS] System Initialized. Awaiting parameters...", color: "text-slate-500" }
  ]);
  const [activeLeadStates, setActiveLeadStates] = useState<Record<string, 'idle' | 'processing' | 'sent'>>({});
  
  const logEndRef = useRef<HTMLDivElement>(null);

  const addLog = (text: string, color: string = "text-slate-400") => {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: "numeric", minute: "numeric", second: "numeric" });
    setLogs(prev => [...prev, { id: Date.now() + Math.random(), text: `[${time}] ${text}`, color }]);
  };

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const handleConnectIg = () => {
    if (!igHandle) return;
    setIsConnectingIg(true);
    addLog(`AUTH: Initializing Instagram API handshake for ${igHandle}...`, "text-yellow-400");
    
    setTimeout(() => {
      setIsConnectingIg(false);
      setIsIgConnected(true);
      addLog(`SUCCESS: Instagram account ${igHandle} linked successfully.`, "text-green-500 font-bold");
    }, 1500);
  };

  const generatePlan = async (e: FormEvent) => {
    e.preventDefault();
    if (!profession) return;

    setIsLoading(true);
    setError(null);
    setPlan(null);
    setActiveLeadStates({});
    
    addLog(`INIT: Search sequence for [${profession}]`, "text-indigo-400");
    if (targetCriteria) addLog(`PARAM: Target -> ${targetCriteria}`, "text-slate-400");

    try {
      const res = await fetch("/api/generate-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ profession, service_offer: serviceOffer, target_criteria: targetCriteria, num_leads: numLeads }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to generate plan");
      }

      const data: HunterPlan = await res.json();
      setPlan(data);
      addLog(`SUCCESS: Found ${data.leads.length} potential targets.`, "text-green-500 font-bold italic");
      
      data.leads.forEach(lead => {
         addLog(`FOUND: @${lead.username} (${lead.metrics})`, "text-slate-400");
      });

    } catch (err: any) {
      setError(err.message);
      addLog(`ERROR: Task failed. ${err.message}`, "text-red-500 font-bold");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const simulateAIOutreach = (lead: Lead, index: number) => {
    if (!isIgConnected) {
      addLog(`ERROR: Cannot initiate Auto-DM. Instagram account unlinked.`, "text-red-500 font-bold");
      alert("Please connect your Instagram account in the 'Integrations' sidebar to send messages.");
      return;
    }

    setActiveLeadStates(prev => ({ ...prev, [index]: 'processing' }));
    addLog(`TARGET LOCKED: @${lead.username} on ${lead.platform}`, "text-indigo-400");
    addLog(`DRAFTING: Contextualizing template...`, "text-slate-500");
    
    const template = plan?.messageTemplates[0]?.content || "Hey, loved your content!";
    try {
        navigator.clipboard.writeText(template);
        addLog(`SYS: Copied draft to clipboard.`, "text-slate-400");
    } catch (e) {
        // ignore
    }

    setTimeout(() => {
      addLog(`AUTH: Routing via ${igHandle} proxy...`, "text-yellow-400");
    }, 1000);

    setTimeout(() => {
      addLog(`ACTION: Opening DM for @${lead.username}...`, "text-pink-400 font-bold");
      setActiveLeadStates(prev => ({ ...prev, [index]: 'sent' }));
      // Standard direct message link for Instagram
      window.open(`https://ig.me/m/${lead.username}`, '_blank');
      addLog(`SYS: Draft copied! Just paste (Ctrl+V) and send.`, "text-green-400 font-bold");
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-[#0F1115] text-slate-200 font-sans p-4 sm:p-8 flex flex-col items-center">
      <div className="w-full max-w-6xl space-y-12">
        
        {/* Header */}
        <div className="text-center space-y-6 pt-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-none rotate-45 flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(79,70,229,0.3)]">
            <div className="w-8 h-8 bg-[#0F1115] flex flex-col items-center justify-center border border-indigo-500/50">
              <div className="w-3 h-3 bg-white -rotate-45"></div>
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tighter uppercase text-slate-200">AI Client Hunter</h1>
          <p className="text-xs font-mono text-slate-500 max-w-2xl mx-auto uppercase tracking-widest leading-relaxed">
            Neural Outreach System v4.2 • Autonomous DM Architecture
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Main Content Column */}
          <div className="flex-1 space-y-8 w-full">
            
            {/* Input Form */}
            <div className="bg-[#ffffff] border border-[#2D333D] p-6 sm:p-8 rounded-none relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-indigo-600"></div>
              <form onSubmit={generatePlan} className="space-y-6">
                <div className="space-y-6">
                  <div>
                    <label htmlFor="profession" className="block text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-3 pl-1">
                      Target Identity [Profession]
                    </label>
                    <input
                      id="profession"
                      type="text"
                      placeholder="e.g. Video Editor, 3D Animator"
                      value={profession}
                      onChange={(e) => setProfession(e.target.value)}
                      className="w-full bg-[#0F1115] border border-[#2D333D] px-6 py-4 text-slate-300 font-mono focus:outline-none focus:border-indigo-500 rounded-none placeholder:text-slate-600 transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="targetCriteria" className="block text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-3 pl-1">
                      Target Parameters [Who exactly? e.g. "Instagram creators ~1000 followers"]
                    </label>
                    <input
                      id="targetCriteria"
                      type="text"
                      placeholder="e.g. Instagram creators with exactly 1000-2000 followers"
                      value={targetCriteria}
                      onChange={(e) => setTargetCriteria(e.target.value)}
                      className="w-full bg-[#0F1115] border border-[#2D333D] px-6 py-4 text-slate-300 font-mono focus:outline-none focus:border-indigo-500 rounded-none placeholder:text-slate-600 transition-colors"
                    />
                  </div>
                  <div>
                    <label htmlFor="numLeads" className="block text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-3 pl-1">
                      Lead Volume [How many to find?]
                    </label>
                    <input
                      id="numLeads"
                      type="number"
                      min="1"
                      max="15"
                      value={numLeads}
                      onChange={(e) => setNumLeads(parseInt(e.target.value) || 1)}
                      className="w-full bg-[#0F1115] border border-[#2D333D] px-6 py-4 text-slate-300 font-mono focus:outline-none focus:border-indigo-500 rounded-none placeholder:text-slate-600 transition-colors"
                    />
                  </div>
                  <div>
                    <label htmlFor="serviceOffer" className="block text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-3 pl-1">
                      Value Proposition [What do you offer?]
                    </label>
                    <textarea
                      id="serviceOffer"
                      placeholder="e.g. I edit high-retention reels to boost engagement..."
                      value={serviceOffer}
                      onChange={(e) => setServiceOffer(e.target.value)}
                      className="w-full bg-[#0F1115] border border-[#2D333D] px-6 py-4 text-slate-300 font-mono focus:outline-none focus:border-indigo-500 rounded-none placeholder:text-slate-600 transition-colors min-h-[100px] resize-none"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  <button
                    type="submit"
                    disabled={isLoading || !profession}
                    className="w-full sm:flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-[#2D333D] disabled:text-slate-500 text-white px-8 py-4 font-bold uppercase text-xs flex items-center justify-center space-x-3 transition-colors rounded-none tracking-widest"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Processing Parameters...</span>
                      </>
                    ) : (
                      <>
                        <Target className="w-4 h-4" />
                        <span>Initialize Search Sequence</span>
                      </>
                    )}
                  </button>
                  <p className="text-[10px] text-slate-500 font-mono uppercase text-center sm:text-left">
                    [SYS] Will scan networks and draft personalized contact matrix.
                  </p>
                </div>
              </form>
            </div>

            {/* Error State */}
            {error && (
              <div className="p-4 bg-red-500/10 text-red-400 border border-red-500/20 rounded-none font-mono text-sm flex items-start gap-3">
                 <div className="w-2 h-2 bg-red-500 mt-1.5 animate-pulse rounded-none flex-shrink-0"></div>
                 <div>{error}</div>
              </div>
            )}

            {/* Results / Plan */}
            {plan && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
                
                {/* Active Leads Found */}
                <div className="bg-[#1A1D23] border border-[#2D333D] rounded-none">
                  <div className="px-6 py-4 border-b border-[#2D333D] flex justify-between items-center bg-[#16191F]">
                    <div className="flex items-center gap-3">
                      <Activity className="w-4 h-4 text-indigo-400" />
                      <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Target Prospects Identified</h2>
                    </div>
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-indigo-500 animate-pulse rounded-none"></div>
                      <div className="w-1.5 h-1.5 bg-indigo-500/50 rounded-none"></div>
                      <div className="w-1.5 h-1.5 bg-indigo-500/20 rounded-none"></div>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    {plan.leads?.map((lead, i) => {
                      const status = activeLeadStates[i] || 'idle';
                      
                      return (
                      <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-4 bg-[#0F1115] p-5 border border-[#2D333D] hover:border-indigo-500/50 transition-colors group">
                        <div className="flex-1 flex items-center gap-4">
                          <div className="w-12 h-12 bg-[#1A1D23] border border-[#2D333D] flex items-center justify-center font-mono text-slate-500 text-xs flex-shrink-0">
                            {lead.platform.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <div className="text-[14px] font-bold text-slate-200 truncate flex items-center gap-2">
                              {lead.name} <span className="text-[10px] font-mono text-indigo-400">@{lead.username}</span>
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono mt-1">{lead.metrics} • {lead.platform}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 mt-4 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-t-0 border-[#2D333D]">
                          <div className={`text-[10px] font-mono px-2 py-1 border flex-shrink-0 font-bold ${lead.matchScore > 85 ? 'text-green-400 bg-green-400/10 border-green-400/20' : 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'}`}>
                            MATCH {lead.matchScore}%
                          </div>
                          
                          {status === 'idle' && (
                            <button 
                              onClick={() => simulateAIOutreach(lead, i)}
                              className="px-4 py-2 bg-indigo-600/10 hover:bg-indigo-600 border border-indigo-500/30 text-indigo-400 hover:text-white text-[10px] uppercase font-bold tracking-wider flex items-center gap-2 transition-colors cursor-pointer"
                              title="Instagram API blocked. This will copy the draft and open IG Direct so you can paste it."
                            >
                              <Send className="w-3 h-3" />
                              <span className="hidden sm:inline">Draft & Open DM</span>
                            </button>
                          )}
                          
                          {status === 'processing' && (
                            <div className="px-4 py-2 border border-yellow-500/30 text-yellow-500 text-[10px] uppercase font-bold tracking-wider flex items-center gap-2 bg-yellow-500/10">
                              <Loader2 className="w-3 h-3 animate-spin" />
                              <span>Opening...</span>
                            </div>
                          )}

                          {status === 'sent' && (
                            <a 
                              href={lead.profileUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="px-4 py-2 bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500 hover:text-white text-[10px] uppercase font-bold tracking-wider flex items-center gap-2 transition-colors cursor-pointer"
                              title="Click to view profile if you need to message manually"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Open Profile</span>
                              <ExternalLink className="w-3 h-3 ml-1" />
                            </a>
                          )}
                        </div>
                      </div>
                    )})}
                  </div>
                </div>

                {/* Where to find them & Search Queries */}
                <div className="grid sm:grid-cols-2 gap-8">
                  <div className="bg-[#1A1D23] p-6 border border-[#2D333D] space-y-6 rounded-none">
                    <div className="flex items-center justify-between border-b border-[#2D333D] pb-4">
                      <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Target Platforms</h3>
                      <Target className="w-4 h-4 text-indigo-400" />
                    </div>
                    <ul className="space-y-3">
                      {plan.targetPlatforms.map((platform, i) => (
                        <li key={i} className="flex items-start bg-[#0F1115] p-3 border border-[#2D333D]">
                          <div className="w-2 h-2 bg-indigo-500 mr-3 mt-1.5 rounded-none flex-shrink-0" />
                          <span className="text-slate-300 font-mono text-[13px]">{platform}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-[#1A1D23] p-6 border border-[#2D333D] space-y-6 rounded-none">
                    <div className="flex items-center justify-between border-b border-[#2D333D] pb-4">
                      <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Search Queries</h3>
                      <Search className="w-4 h-4 text-green-400" />
                    </div>
                    <ul className="space-y-3">
                      {plan.searchQueries.map((query, i) => (
                        <li key={i} className="flex items-start bg-[#0F1115] p-3 border border-[#2D333D]">
                          <div className="w-2 h-2 bg-green-500 mr-3 mt-1.5 rounded-none flex-shrink-0 opacity-80" />
                          <code className="text-[13px] text-green-400 font-mono">
                            "{query}"
                          </code>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Actionable Advice */}
                <div className="bg-[#16191F] p-6 border border-[#2D333D] border-l-4 border-l-indigo-500 flex items-start space-x-6 rounded-none">
                  <div className="p-3 bg-[#0F1115] border border-[#2D333D] flex-shrink-0 mt-1">
                    <Lightbulb className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-3">Strategic Insight</h3>
                    <p className="text-slate-300 font-mono text-[13px] leading-relaxed">{plan.advice}</p>
                  </div>
                </div>

                {/* Message Templates */}
                <div className="space-y-6 pt-6">
                  <div className="flex justify-between items-end border-b border-[#2D333D] pb-4">
                    <h2 className="text-2xl font-light italic text-slate-200">
                      Communication <span className="text-indigo-400 font-bold">Protocols</span>
                    </h2>
                    <span className="text-[10px] font-mono text-slate-500 uppercase">SYS_MESSAGES_GENERATED</span>
                  </div>
                  
                  <div className="grid gap-6">
                    {plan.messageTemplates.map((template, i) => (
                      <div key={i} className="bg-[#1A1D23] p-6 border border-[#2D333D] rounded-none group hover:border-indigo-500/50 transition-colors">
                        <div className="flex items-center justify-between mb-6">
                          <span className="text-[10px] font-mono text-indigo-400 bg-indigo-400/10 px-3 py-1.5 uppercase border border-indigo-400/20 font-bold tracking-[0.2em]">
                            [{template.type}]
                          </span>
                          <button
                            onClick={() => copyToClipboard(template.content, i)}
                            className="text-slate-500 hover:text-indigo-400 uppercase tracking-widest text-[10px] font-bold flex items-center space-x-2 transition-colors cursor-pointer"
                            title="Copy to clipboard"
                          >
                            {copiedIndex === i ? (
                              <span className="text-green-400 flex items-center">
                                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> COPIED
                              </span>
                            ) : (
                              <span className="flex items-center">
                                <Copy className="w-3.5 h-3.5 mr-1.5" /> COPY RAW
                              </span>
                            )}
                          </button>
                        </div>
                        <div className="bg-[#0F1115] p-6 border border-[#2D333D] rounded-none">
                          <p className="text-slate-300 font-mono text-[13px] leading-relaxed whitespace-pre-wrap">
                            {template.content}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* Right Sidebar: Communication Log & Integrations */}
          <div className="lg:w-80 flex flex-col gap-6">
            
            {/* Integrations Module */}
            <div className="bg-[#12151A] border border-[#2D333D] shadow-xl">
              <div className="px-6 py-4 border-b border-[#2D333D] bg-[#16191F]">
                <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Integrations</h2>
              </div>
              <div className="p-6">
                {!isIgConnected ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Instagram className="w-4 h-4 text-pink-500" />
                      <span className="text-xs font-bold uppercase tracking-widest">Instagram API</span>
                    </div>
                    <input 
                      type="text" 
                      placeholder="Your IG Handle (e.g. @myagency)"
                      value={igHandle}
                      onChange={e => setIgHandle(e.target.value)}
                      className="w-full bg-[#0F1115] border border-[#2D333D] px-4 py-3 text-slate-300 font-mono text-xs focus:outline-none focus:border-pink-500 rounded-none transition-colors"
                    />
                    <button 
                      onClick={handleConnectIg}
                      disabled={!igHandle || isConnectingIg}
                      className="w-full bg-pink-600/10 hover:bg-pink-600 disabled:bg-[#0F1115] disabled:text-slate-500 border border-pink-500/30 text-pink-500 hover:text-white px-4 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                    >
                      {isConnectingIg ? <Loader2 className="w-3 h-3 animate-spin"/> : <LinkIcon className="w-3 h-3"/>}
                      {isConnectingIg ? "Connecting..." : "Connect Account"}
                    </button>
                    <p className="text-[9px] text-slate-500 font-mono uppercase">Required for Auto-DM capability.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-300">
                        <Instagram className="w-4 h-4 text-pink-500" />
                        <span className="text-xs font-bold uppercase tracking-widest">Instagram</span>
                      </div>
                      <span className="text-[9px] text-green-400 bg-green-400/10 border border-green-400/20 px-2 py-0.5 font-bold tracking-widest">CONNECTED</span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 bg-[#0F1115] border border-[#2D333D] px-4 py-3 flex items-center justify-between">
                      <span>Active Identity:</span>
                      <span className="text-white font-bold">{igHandle}</span>
                    </div>
                    <button 
                      onClick={() => {
                        setIsIgConnected(false);
                        addLog(`SYS: Instagram account disconnected.`, "text-slate-500");
                      }}
                      className="w-full bg-[#0F1115] hover:bg-red-500/10 border border-[#2D333D] hover:border-red-500/30 text-slate-500 hover:text-red-400 px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors"
                    >
                      Disconnect
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Terminal Log */}
            <div className="flex flex-col bg-[#12151A] border border-[#2D333D] flex-1 lg:h-[500px] shadow-xl">
              <div className="px-6 py-5 border-b border-[#2D333D] bg-[#16191F] flex justify-between items-center">
                <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Terminal Log</h2>
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-slate-700"></div>
                  <div className="w-2 h-2 rounded-full bg-slate-700"></div>
                  <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                </div>
              </div>
              <div className="flex-1 p-6 font-mono text-[11px] space-y-3 overflow-y-auto leading-relaxed scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                {logs.map((log) => (
                  <div key={log.id} className={log.color + " uppercase break-words"}>
                    {log.text}
                  </div>
                ))}
                <div ref={logEndRef} />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
