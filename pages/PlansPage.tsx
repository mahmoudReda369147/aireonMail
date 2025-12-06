import React from 'react';
import { Check, CreditCard, Sparkles, Shield, Zap } from 'lucide-react';
import { Button } from '../components/common/Button';
import { useAppContext } from '../contexts/AppContext';

export const PlansPage: React.FC = () => {
    const { t } = useAppContext();

    const plans = [
        {
            name: 'Free',
            price: '$0',
            period: '/mo',
            description: 'Essential AI features for personal use.',
            features: [
                'Basic Gemini Flash Lite Model',
                '50 Smart Inbox Analysis/mo',
                'Standard Email Composition',
                '7-day History Retention',
                'Community Support'
            ],
            current: true,
            highlight: false,
            color: 'border-glass-border bg-surface/30'
        },
        {
            name: 'Pro',
            price: '$19',
            period: '/mo',
            description: 'Advanced reasoning and creative tools.',
            features: [
                'Gemini 1.5 Pro & Veo Access',
                'Unlimited Smart Analysis',
                'Thread Automation Bots',
                'Veo Video Studio (4K)',
                'Priority Support',
                'Advanced Security Checks'
            ],
            current: false,
            highlight: true,
            color: 'border-fuchsia-500/50 bg-fuchsia-900/10 shadow-[0_0_30px_rgba(217,70,239,0.1)]'
        },
        {
            name: 'Enterprise',
            price: 'Custom',
            period: '',
            description: 'Scalable security and control for teams.',
            features: [
                'Dedicated Gemini Instances',
                'Custom Model Fine-tuning',
                'SSO & Audit Logs',
                'Unlimited Team Members',
                '24/7 Dedicated Support',
                'On-premise Deployment Options'
            ],
            current: false,
            highlight: false,
            color: 'border-cyan-500/50 bg-cyan-900/10 shadow-[0_0_30px_rgba(6,182,212,0.1)]'
        }
    ];

    return (
        <div className="h-full overflow-y-auto custom-scrollbar p-8 max-w-7xl mx-auto flex flex-col items-center">
            <div className="text-center mb-12 max-w-2xl">
                <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-cyan-400 mb-4 tracking-tight">Choose Your Power</h1>
                <p className="text-slate-400 text-lg">Unlock the full potential of Aireon with our flexible pricing plans designed for individuals and teams.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full">
                {plans.map((plan) => (
                    <div key={plan.name} className={`relative flex flex-col p-8 rounded-3xl border backdrop-blur-md transition-all duration-300 hover:scale-[1.02] ${plan.color}`}>
                        {plan.highlight && (
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1">
                                <Sparkles className="w-3 h-3 fill-current" /> MOST POPULAR
                            </div>
                        )}
                        <div className="mb-6">
                            <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                            <p className="text-sm text-slate-400">{plan.description}</p>
                        </div>
                        <div className="mb-8 flex items-baseline gap-1">
                            <span className="text-4xl font-bold text-white">{plan.price}</span>
                            <span className="text-sm text-slate-500 font-medium">{plan.period}</span>
                        </div>
                        
                        <div className="space-y-4 mb-8 flex-1">
                            {plan.features.map((feat, i) => (
                                <div key={i} className="flex items-start gap-3">
                                    <div className={`mt-1 p-0.5 rounded-full ${plan.highlight ? 'bg-fuchsia-500/20 text-fuchsia-400' : 'bg-slate-700/50 text-slate-400'}`}>
                                        <Check className="w-3 h-3" />
                                    </div>
                                    <span className="text-sm text-slate-300">{feat}</span>
                                </div>
                            ))}
                        </div>

                        <Button 
                            variant={plan.highlight ? 'primary' : 'secondary'} 
                            className="w-full py-4 text-base"
                            disabled={plan.current}
                        >
                            {plan.current ? 'Current Plan' : plan.name === 'Enterprise' ? 'Contact Sales' : `Upgrade to ${plan.name}`}
                        </Button>
                    </div>
                ))}
            </div>

            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
                 <div className="p-6 rounded-2xl bg-glass border border-glass-border flex flex-col items-center text-center">
                     <Shield className="w-10 h-10 text-emerald-400 mb-4" />
                     <h3 className="font-bold text-white mb-2">Secure by Design</h3>
                     <p className="text-sm text-slate-400">Enterprise-grade encryption and SOC2 compliance readiness.</p>
                 </div>
                 <div className="p-6 rounded-2xl bg-glass border border-glass-border flex flex-col items-center text-center">
                     <Zap className="w-10 h-10 text-amber-400 mb-4" />
                     <h3 className="font-bold text-white mb-2">Ultra Low Latency</h3>
                     <p className="text-sm text-slate-400">Powered by Gemini Flash for instant responses.</p>
                 </div>
                 <div className="p-6 rounded-2xl bg-glass border border-glass-border flex flex-col items-center text-center">
                     <CreditCard className="w-10 h-10 text-blue-400 mb-4" />
                     <h3 className="font-bold text-white mb-2">Transparent Billing</h3>
                     <p className="text-sm text-slate-400">No hidden fees. Cancel anytime directly from the dashboard.</p>
                 </div>
            </div>
        </div>
    );
};