import { useState, useEffect } from 'react';
import type { CurrencyFieldProps } from './types';
import { formatPriceAmount } from '../../shared/domainPricing';

const displayAmount = (value?: number) => value == null ? `` : formatPriceAmount(value);

export const useCurrencyField = ({ value, disabled, onChange }: CurrencyFieldProps) => {
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState(() => displayAmount(value));

  useEffect(() => {
    if (!focused) setDraft(displayAmount(value));
  }, [value, focused]);

  const focus = () => {
    if (disabled) return;
    setFocused(true);
    setDraft(displayAmount(value).replace(/,/g, ``));
  };

  const blur = () => {
    setFocused(false);
    setDraft(displayAmount(value));
  };

  const change = (input: string) => {
    if (disabled) return;
    const nextDraft = input.replace(/[$,\s]/g, ``);
    if (!/^\d*(?:\.\d{0,2})?$/.test(nextDraft)) return;
    const amount = nextDraft === `` || nextDraft === `.` ? undefined : Number(nextDraft);
    if (amount != null && (!Number.isFinite(amount) || !Number.isSafeInteger(Math.round(amount * 100)))) return;
    setDraft(nextDraft);
    onChange(amount);
  };

  return { blur, draft, focus, change, focused };
};
