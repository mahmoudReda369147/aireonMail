import React from 'react';
import { Users } from 'lucide-react';

export const ContactsPage: React.FC = () => {
    return (
        <div className="p-8 flex flex-col items-center justify-center h-full text-slate-500">
            <Users className="w-24 h-24 mb-6 opacity-20" />
            <p className="text-xl">Contacts Module Coming Soon</p>
        </div>
    );
}