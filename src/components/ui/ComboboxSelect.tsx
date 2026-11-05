'use client';

/**
 * src/components/ui/ComboboxSelect.tsx
 * ==============================================================================
 * Accessible Searchable Combobox with Custom Value Fallback
 * Designed according to /ui-ux-pro-max guidelines (touch >= 44px, contrast 4.5:1)
 * ==============================================================================
 */

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search, Plus, X } from 'lucide-react';

export interface ComboboxOption {
  label: string;
  value: string;
}

export interface ComboboxSelectProps {
  id?: string;
  label?: string;
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  allowCustom?: boolean;
  required?: boolean;
  error?: string;
  className?: string;
  disabled?: boolean;
}

export function ComboboxSelect({
  id,
  label,
  options,
  value,
  onChange,
  placeholder = 'เลือกรายการหรือค้นหา...',
  allowCustom = true,
  required = false,
  error,
  className = '',
  disabled = false,
}: ComboboxSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customValue, setCustomValue] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check if current value exists in predefined options
  const matchedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    // If value is non-empty and not in options, set custom mode
    if (value && !matchedOption && allowCustom) {
      setIsCustomMode(true);
      setCustomValue(value);
    } else if (matchedOption) {
      setIsCustomMode(false);
    }
  }, [value, matchedOption, allowCustom]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(
    (opt) =>
      opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opt.value.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (val: string) => {
    setIsCustomMode(false);
    onChange(val);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleEnableCustom = () => {
    setIsCustomMode(true);
    setCustomValue(searchQuery || '');
    onChange(searchQuery || '');
    setIsOpen(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleCancelCustom = () => {
    setIsCustomMode(false);
    setCustomValue('');
    const firstVal = options[0]?.value || '';
    onChange(firstVal);
  };

  return (
    <div className={`relative w-full ${className}`} ref={containerRef}>
      {label && (
        <label htmlFor={id} className="block text-sm md:text-base font-medium text-slate-700 mb-1.5">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {isCustomMode ? (
        // Custom text input mode
        <div className="relative flex items-center">
          <input
            ref={inputRef}
            id={id}
            type="text"
            value={customValue}
            onChange={(e) => {
              setCustomValue(e.target.value);
              onChange(e.target.value);
            }}
            placeholder="ระบุข้อมูลที่ต้องการ..."
            disabled={disabled}
            className={`w-full min-h-[46px] px-3.5 py-2.5 pr-20 text-base bg-white border rounded-lg focus:outline-none focus:ring-2 ${
              error ? 'border-red-400 focus:ring-red-400' : 'border-sky-500 focus:ring-sky-500'
            }`}
          />
          <button
            type="button"
            onClick={handleCancelCustom}
            title="กลับไปเลือกจากรายการ"
            className="absolute right-2 px-2.5 py-1 text-xs font-medium text-slate-500 hover:text-sky-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
          >
            เลือกจากลิสต์
          </button>
        </div>
      ) : (
        // Combobox trigger button
        <div>
          <button
            type="button"
            id={id}
            disabled={disabled}
            onClick={() => !disabled && setIsOpen(!isOpen)}
            className={`w-full min-h-[46px] px-3.5 py-2.5 text-left text-base bg-slate-50 border rounded-lg flex items-center justify-between transition-colors focus:outline-none focus:ring-2 ${
              disabled ? 'opacity-60 cursor-not-allowed bg-slate-100' : 'hover:bg-white cursor-pointer'
            } ${error ? 'border-red-400 focus:ring-red-400' : 'border-slate-200 focus:ring-sky-500'}`}
          >
            <span className={`truncate ${matchedOption ? 'text-slate-800' : 'text-slate-400'}`}>
              {matchedOption ? matchedOption.label : placeholder}
            </span>
            <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Popover */}
          {isOpen && (
            <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden animate-in fade-in-50 zoom-in-95">
              {/* Search Bar */}
              <div className="p-2 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
                <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="พิมพ์เพื่อค้นหา..."
                  autoFocus
                  className="w-full text-sm bg-transparent border-none focus:outline-none text-slate-800 placeholder-slate-400"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-full"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Options List */}
              <div className="max-h-60 overflow-y-auto py-1">
                {filteredOptions.length > 0 ? (
                  filteredOptions.map((opt) => {
                    const isSelected = opt.value === value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleSelect(opt.value)}
                        className={`w-full min-h-[42px] px-3.5 py-2 text-left text-sm flex items-center justify-between transition-colors ${
                          isSelected ? 'bg-sky-50 text-sky-700 font-medium' : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="truncate">{opt.label}</span>
                        {isSelected && <Check className="w-4 h-4 text-sky-600 flex-shrink-0" />}
                      </button>
                    );
                  })
                ) : (
                  <div className="p-3 text-center text-xs text-slate-400">
                    ไม่พบตัวเลือกที่ค้นหา
                  </div>
                )}

                {/* Custom Option Button */}
                {allowCustom && (
                  <div className="border-t border-slate-100 mt-1 pt-1">
                    <button
                      type="button"
                      onClick={handleEnableCustom}
                      className="w-full min-h-[42px] px-3.5 py-2 text-left text-sm text-sky-600 hover:bg-sky-50 font-medium flex items-center gap-2 transition-colors"
                    >
                      <Plus className="w-4 h-4 flex-shrink-0" />
                      <span>{searchQuery ? `ระบุ "${searchQuery}" เอง...` : 'ระบุค่าอื่น ๆ เอง...'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {error && <p className="text-xs md:text-sm text-red-500 mt-1">{error}</p>}
    </div>
  );
}
