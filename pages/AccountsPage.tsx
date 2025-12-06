import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { Check, Plus, UserPlus, LogOut, Mail, MoreVertical, Shield } from 'lucide-react';
import { Button } from '../components/common/Button';
import { useToast } from '../components/common/Toast';
import { UserAccount } from '../types';

export const AccountsPage: React.FC = () => {
  const { accounts, currentAccount, switchAccount, addAccount, t } = useAppContext();
  const { showToast } = useToast();
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State for new account
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');

  const handleSwitch = (id: string) => {
    if (id === currentAccount.id) return;
    switchAccount(id);
    const acc = accounts.find(a => a.id === id);
    showToast(`Switched to ${acc?.email}`, 'success');
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newName) {
        showToast("Please fill in all fields", "error");
        return;
    }
    
    // Auto-generate avatar/color for demo
    addAccount({
        name: newName,
        email: newEmail,
        avatar: newName.charAt(0).toUpperCase(),
        provider: newEmail.includes('gmail') ? 'google' : 'other',
        color: `from-fuchsia-400 to-pink-500` // Static random color for demo
    });
    
    setShowAddModal(false);
    setNewName('');
    setNewEmail('');
    showToast("Account added successfully", "success");
  };

  return (
    <div className="h-full flex flex-col p-8 max-w-5xl mx-auto overflow-y-auto custom-scrollbar">
       <div className="flex items-center justify-between mb-8">
           <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">{t('menu.accounts')}</h1>
                <p className="text-slate-400 mt-2">Manage your connected email accounts and profiles.</p>
           </div>
           <Button icon={UserPlus} onClick={() => setShowAddModal(true)}>Add Account</Button>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {accounts.map((account) => {
               const isActive = currentAccount.id === account.id;
               return (
                   <div 
                     key={account.id}
                     onClick={() => handleSwitch(account.id)}
                     className={`relative group rounded-3xl p-6 border transition-all duration-300 cursor-pointer overflow-hidden ${
                         isActive 
                         ? 'bg-glass-gradient border-fuchsia-500/50 shadow-[0_0_30px_rgba(217,70,239,0.15)]' 
                         : 'bg-glass border-glass-border hover:border-slate-500 hover:bg-glass-hover'
                     }`}
                   >
                       {isActive && (
                           <div className="absolute top-4 right-4 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                               <Check className="w-3 h-3" /> Active
                           </div>
                       )}

                       <div className="flex items-center gap-4 mb-6">
                           <div className={`w-14 h-14 rounded-full bg-gradient-to-tr ${account.color} flex items-center justify-center text-white font-bold text-2xl shadow-lg`}>
                               {account.avatar}
                           </div>
                           <div className="min-w-0">
                               <h3 className="font-bold text-white text-lg truncate">{account.name}</h3>
                               <p className="text-sm text-slate-400 truncate">{account.email}</p>
                           </div>
                       </div>

                       <div className="flex items-center justify-between mt-4 pt-4 border-t border-glass-border">
                           <div className="flex items-center gap-2">
                               {account.provider === 'google' && <div className="text-xs bg-white/10 px-2 py-1 rounded text-slate-300 font-medium">Google</div>}
                               {account.provider === 'microsoft' && <div className="text-xs bg-blue-500/10 text-blue-300 border border-blue-500/20 px-2 py-1 rounded font-medium">Outlook</div>}
                               {account.provider === 'other' && <div className="text-xs bg-slate-700 px-2 py-1 rounded text-slate-300 font-medium">IMAP</div>}
                           </div>
                           
                           {isActive ? (
                               <div className="text-xs text-fuchsia-400 font-bold animate-pulse">Syncing...</div>
                           ) : (
                               <button className="text-xs text-slate-500 hover:text-white transition-colors">Switch</button>
                           )}
                       </div>
                   </div>
               );
           })}

            {/* Placeholder for 'Add New' visual card if desired, currently using button above */}
            <div 
                onClick={() => setShowAddModal(true)}
                className="rounded-3xl p-6 border border-glass-border border-dashed bg-transparent hover:bg-white/5 cursor-pointer flex flex-col items-center justify-center gap-4 min-h-[180px] group transition-colors"
            >
                <div className="w-14 h-14 rounded-full bg-surface border border-glass-border flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Plus className="w-6 h-6 text-slate-400 group-hover:text-white" />
                </div>
                <div className="text-center">
                    <h3 className="font-bold text-slate-400 group-hover:text-white">Connect Account</h3>
                    <p className="text-xs text-slate-500 mt-1">Gmail, Outlook, or IMAP</p>
                </div>
            </div>
       </div>

       <div className="mt-12 p-6 rounded-3xl bg-glass border border-glass-border">
            <h3 className="font-bold text-white text-lg mb-4 flex items-center gap-2"><Shield className="w-5 h-5 text-emerald-400" /> Security & Sync</h3>
            <p className="text-slate-400 text-sm mb-6 max-w-2xl">
                Aireon uses secure OAuth 2.0 connections for Gmail and Outlook. Your credentials are never stored on our servers, only local tokens. 
                Switching accounts will refresh your local session.
            </p>
            <Button variant="ghost" className="text-red-400 hover:bg-red-500/10 gap-2">
                <LogOut className="w-4 h-4" /> Sign out of all accounts
            </Button>
       </div>

       {/* Add Account Modal */}
       {showAddModal && (
           <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
               <div className="bg-space border border-glass-border rounded-3xl p-8 max-w-md w-full shadow-2xl relative">
                   <button onClick={() => setShowAddModal(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white"><LogOut className="w-5 h-5 rotate-45" /></button>
                   
                   <h2 className="text-2xl font-bold text-white mb-2">Add Account</h2>
                   <p className="text-slate-400 mb-6">Connect a new email address to Aireon.</p>

                   <form onSubmit={handleAddSubmit} className="space-y-4">
                       <div>
                           <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Name</label>
                           <input 
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                                className="w-full bg-black/30 border border-glass-border rounded-xl px-4 py-3 text-white focus:border-fuchsia-500 outline-none"
                                placeholder="e.g. Jane Doe"
                           />
                       </div>
                       <div>
                           <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Email Address</label>
                           <input 
                                value={newEmail}
                                onChange={e => setNewEmail(e.target.value)}
                                className="w-full bg-black/30 border border-glass-border rounded-xl px-4 py-3 text-white focus:border-fuchsia-500 outline-none"
                                placeholder="name@example.com"
                           />
                       </div>
                       
                       <div className="pt-4 flex gap-3">
                           <Button type="button" variant="secondary" onClick={() => setShowAddModal(false)} className="flex-1">Cancel</Button>
                           <Button type="submit" className="flex-1">Connect</Button>
                       </div>
                   </form>
               </div>
           </div>
       )}
    </div>
  );
};