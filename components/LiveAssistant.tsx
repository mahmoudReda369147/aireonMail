
import React, { useEffect, useRef, useState } from 'react';
import { X, Mic, MicOff, Volume2, Sparkles, Minus, Maximize2, GripHorizontal } from 'lucide-react';
import { getLiveClient } from '../services/geminiService';
import { createPcmBlob, decodeAudioData, base64ToUint8Array } from '../services/audioUtils';
import { Modality, LiveServerMessage, Type, FunctionDeclaration } from '@google/genai';
import { Email } from '../types';
import { useAppContext } from '../contexts/AppContext';

interface LiveAssistantProps {
  onClose: () => void;
  emails: Email[];
}

export const LiveAssistant: React.FC<LiveAssistantProps> = ({ onClose, emails }) => {
  const { liveAssistantConfig } = useAppContext();
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState("Connecting...");
  const [volume, setVolume] = useState(0); 

  // UI State for Drag & Minimize
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: window.innerWidth - 380, y: window.innerHeight - 500 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);
  
  const emailsRef = useRef(emails);
  useEffect(() => {
    emailsRef.current = emails;
  }, [emails]);

  // Dragging Logic
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging) return;
        setPosition({
            x: e.clientX - dragOffset.current.x,
            y: e.clientY - dragOffset.current.y
        });
    };
    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragOffset.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y
    };
  };

  useEffect(() => {
    let cleanup = false;

    const startSession = async () => {
      try {
        const liveClient = getLiveClient();
        inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

        const emailTool: FunctionDeclaration = {
          name: "get_emails",
          description: "Search for emails in the user's inbox. Use this to answer questions about who sent emails, what they are about, or specific details. Returns a list of matching emails.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              query: { type: Type.STRING, description: "Keywords to search for in subject or body" },
              sender: { type: Type.STRING, description: "Filter by sender name" }
            }
          }
        };

        const sessionPromise = liveClient.connect({
          model: 'gemini-2.5-flash-native-audio-preview-09-2025',
          callbacks: {
            onopen: () => {
              if (cleanup) return;
              setStatus("Listening...");
              setIsActive(true);
              const ctx = inputAudioContextRef.current!;
              const source = ctx.createMediaStreamSource(stream);
              const processor = ctx.createScriptProcessor(4096, 1, 1);

              processor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                let sum = 0;
                for(let i=0; i<inputData.length; i++) sum += inputData[i] * inputData[i];
                setVolume(Math.sqrt(sum / inputData.length) * 100);

                const pcmBlob = createPcmBlob(inputData);
                sessionPromise.then(session => {
                    session.sendRealtimeInput({ media: pcmBlob });
                });
              };
              source.connect(processor);
              processor.connect(ctx.destination);
            },
            onmessage: async (msg: LiveServerMessage) => {
              if (cleanup) return;
              if (msg.toolCall) {
                console.log("Tool call received:", msg.toolCall);
                for (const fc of msg.toolCall.functionCalls) {
                  if (fc.name === 'get_emails') {
                    const { query, sender } = fc.args as any;
                    const allEmails = emailsRef.current;
                    const results = allEmails.filter(e => {
                      let match = true;
                      if (sender) match = match && e.sender.toLowerCase().includes(sender.toLowerCase());
                      if (query) {
                        const q = query.toLowerCase();
                        match = match && (
                          e.subject.toLowerCase().includes(q) || 
                          e.body.toLowerCase().includes(q) ||
                          e.sender.toLowerCase().includes(q)
                        );
                      }
                      return match;
                    }).map(e => ({
                       from: e.sender,
                       subject: e.subject,
                       snippet: e.body.substring(0, 150),
                       time: e.timestamp
                    }));

                    sessionPromise.then(session => {
                      session.sendToolResponse({
                        functionResponses: {
                          id: fc.id,
                          name: fc.name,
                          response: { result: results }
                        }
                      });
                    });
                  }
                }
              }
              const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
              if (audioData && outputAudioContextRef.current) {
                const ctx = outputAudioContextRef.current;
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                const buffer = await decodeAudioData(base64ToUint8Array(audioData), ctx);
                const source = ctx.createBufferSource();
                source.buffer = buffer;
                source.connect(ctx.destination);
                source.addEventListener('ended', () => sourcesRef.current.delete(source));
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += buffer.duration;
                sourcesRef.current.add(source);
              }
              if (msg.serverContent?.interrupted) {
                 sourcesRef.current.forEach(s => s.stop());
                 sourcesRef.current.clear();
                 nextStartTimeRef.current = 0;
              }
            },
            onclose: () => {
              setStatus("Disconnected");
              setIsActive(false);
            },
            onerror: (err) => {
              console.error(err);
              setStatus("Error occurred");
            }
          },
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: liveAssistantConfig.voice } }
            },
            systemInstruction: `You are ${liveAssistantConfig.name}, the AI Mail assistant. You must communicate in ${liveAssistantConfig.language}. You have access to the user's inbox via the 'get_emails' tool. When asked about emails, always use the tool to find the information. Be concise, helpful and speak with a natural tone.`,
            tools: [{ functionDeclarations: [emailTool] }]
          }
        });
        sessionRef.current = sessionPromise;
      } catch (err) {
        console.error("Failed to start live session", err);
        setStatus("Failed to connect");
      }
    };
    startSession();
    return () => {
      cleanup = true;
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (inputAudioContextRef.current) inputAudioContextRef.current.close();
      if (outputAudioContextRef.current) outputAudioContextRef.current.close();
    };
  }, []);

  return (
    <div 
        style={{ left: position.x, top: position.y }}
        className={`fixed w-[350px] bg-glass backdrop-blur-2xl rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10 z-50 overflow-hidden font-sans flex flex-col items-center transition-all duration-300 ${isMinimized ? 'h-[80px]' : 'h-[420px]'}`}
    >
      {/* Header (Draggable) */}
      <div 
        onMouseDown={handleMouseDown}
        className="w-full p-4 flex justify-between items-center z-20 cursor-move group select-none"
      >
         <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/5">
            <GripHorizontal className="w-3 h-3 text-slate-500 group-hover:text-white transition-colors" />
            <Sparkles className="w-3 h-3 text-fuchsia-400" />
            <span className="text-xs font-bold text-slate-300">{liveAssistantConfig.name.toUpperCase()}</span>
         </div>
         <div className="flex items-center gap-1">
            <button 
                onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}
                className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"
            >
               {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
            </button>
            <button 
                onClick={(e) => { e.stopPropagation(); onClose(); }} 
                className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"
            >
               <X className="w-5 h-5" />
            </button>
         </div>
      </div>

      {/* Expanded View */}
      <div className={`w-full flex-1 flex flex-col items-center transition-opacity duration-300 ${isMinimized ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          {/* Visualizer */}
          <div className="relative w-full h-52 flex items-center justify-center -mt-4">
             {/* Glow effects */}
             <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-fuchsia-500 rounded-full blur-[80px] opacity-20 transition-opacity duration-1000 ${isActive ? 'opacity-40' : 'opacity-10'}`}></div>
             <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-cyan-500 rounded-full blur-[60px] opacity-20 transition-opacity duration-1000 ${isActive ? 'opacity-40' : 'opacity-10'}`}></div>
             
             {/* Central Orb */}
             <div className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${isActive ? 'scale-110' : 'scale-100'}`}
                  style={{
                      background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.2), rgba(0,0,0,0.5))',
                      boxShadow: `0 0 ${20 + volume}px ${volume > 10 ? '#d946ef' : '#64748b'}`
                  }}
             >
                 <div className="absolute inset-0 rounded-full border border-white/10"></div>
                 {isActive ? <Volume2 className="w-8 h-8 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]" /> : <MicOff className="w-8 h-8 text-slate-500" />}
             </div>
          </div>
          
          {/* Status */}
          <div className="pb-8 text-center px-6">
            <h3 className="text-xl font-bold text-white mb-1 tracking-tight">{isActive ? "Listening..." : "Paused"}</h3>
            <p className="text-sm text-slate-400 font-light">{status}</p>
            
            {isActive && (
                <div className="mt-6 flex justify-center gap-1 h-8 items-end">
                    {[...Array(5)].map((_, i) => (
                        <div 
                            key={i} 
                            className="w-1 bg-gradient-to-t from-fuchsia-500 to-cyan-400 rounded-full animate-pulse"
                            style={{ height: `${20 + Math.random() * 60}%`, animationDelay: `${i * 0.1}s` }}
                        ></div>
                    ))}
                </div>
            )}
          </div>
      </div>
    </div>
  );
};
