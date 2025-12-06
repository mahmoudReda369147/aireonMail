import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface DropdownOption {
  label: string;
  value: string;
  icon?: React.ElementType;
}

interface DropdownProps {
  label?: string; // Header label inside dropdown
  value?: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  icon?: React.ElementType; // Icon for the main button
  className?: string;
  placeholder?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({ 
  label, 
  value, 
  options, 
  onChange, 
  icon: Icon,
  className = '',
  placeholder = 'Select...'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between bg-black/30 border border-glass-border rounded-2xl px-4 py-3.5 text-sm text-white transition-all duration-200 group outline-none ${
            isOpen ? 'border-fuchsia-500 ring-1 ring-fuchsia-500/50 bg-black/40' : 'hover:bg-white/5 hover:border-slate-500'
        }`}
      >
        <div className="flex items-center gap-3">
            {Icon && <Icon className={`w-5 h-5 transition-colors ${isOpen ? 'text-fuchsia-500' : 'text-slate-500 group-hover:text-fuchsia-400'}`} />}
            {selectedOption ? (
                <span className="font-medium text-white">{selectedOption.label}</span>
            ) : (
                <span className="text-slate-500">{placeholder}</span>
            )}
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180 text-fuchsia-500' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#1A1B2E] border border-glass-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 z-50 max-h-64 flex flex-col">
            {label && (
                <div className="px-4 py-3 bg-black/20 border-b border-glass-border text-[10px] font-bold text-slate-400 uppercase tracking-widest sticky top-0 backdrop-blur-md">
                    {label}
                </div>
            )}
            <div className="p-1 overflow-y-auto custom-scrollbar flex-1">
                {options.map((option) => {
                    const isSelected = option.value === value;
                    const OptionIcon = option.icon;
                    return (
                        <button
                            type="button"
                            key={option.value}
                            onClick={() => {
                                onChange(option.value);
                                setIsOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-3 rounded-xl text-sm transition-all duration-200 group/item ${
                                isSelected 
                                ? 'bg-fuchsia-500/10 text-fuchsia-400 font-bold' 
                                : 'text-slate-300 hover:bg-white/5 hover:text-white'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                {OptionIcon && <OptionIcon className={`w-4 h-4 ${isSelected ? 'text-fuchsia-500' : 'text-slate-500 group-hover/item:text-slate-300'}`} />}
                                <span>{option.label}</span>
                            </div>
                            {isSelected && <Check className="w-3.5 h-3.5" />}
                        </button>
                    );
                })}
            </div>
        </div>
      )}
    </div>
  );
};