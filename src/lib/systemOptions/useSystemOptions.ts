'use client';

/**
 * src/lib/systemOptions/useSystemOptions.ts
 * ==============================================================================
 * Hook for consuming dynamic dropdown options per category
 * ==============================================================================
 */

import { useState, useEffect, useCallback } from 'react';
import type { SystemOption, OptionCategory } from '@/types/systemOptions';
import { DEFAULT_SYSTEM_OPTIONS } from './defaultOptions';

export function useSystemOptions(category?: OptionCategory | string) {
  const [options, setOptions] = useState<SystemOption[]>(() => {
    if (category) {
      return DEFAULT_SYSTEM_OPTIONS.filter((opt) => opt.category === category);
    }
    return DEFAULT_SYSTEM_OPTIONS;
  });
  const [isLoading, setIsLoading] = useState(false);

  const fetchOptions = useCallback(async () => {
    setIsLoading(true);
    try {
      const url = category ? `/api/system-options?category=${encodeURIComponent(category)}` : '/api/system-options';
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        if (json.options && json.options.length > 0) {
          setOptions(json.options);
        }
      }
    } catch (err) {
      console.warn('[useSystemOptions] Error fetching options, using fallback:', err);
    } finally {
      setIsLoading(false);
    }
  }, [category]);

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  return {
    options,
    isLoading,
    refresh: fetchOptions,
    comboboxOptions: options.map((opt) => ({ label: opt.label, value: opt.value })),
  };
}
