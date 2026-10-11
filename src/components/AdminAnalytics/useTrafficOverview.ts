'use client';

import { useState, type FormEvent } from 'react';
import { useAuth } from '../../shared/authContext/useAuth';
import { getTrafficDateError, type TrafficMetric, type TrafficSegment } from './data';
import { getAnalyticsDateRange, useTrafficAnalytics } from '../../shared/analytics/useTrafficAnalytics';

export type TrafficOverviewView = `overview` | `trend` | TrafficSegment;

export const useTrafficOverview = () => {
  const analytics = useTrafficAnalytics(useAuth().user);
  const { report, filters, setFilters } = analytics;
  const [dateError, setDateError] = useState(``);
  const [compare, setCompare] = useState(false);
  const [showArea, setShowArea] = useState(true);
  const [showShares, setShowShares] = useState(true);
  const [showDaySlider, setShowDaySlider] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState(filters);
  const [metric, setMetric] = useState<TrafficMetric>(`visitors`);
  const [activeView, setActiveView] = useState<TrafficOverviewView>(`overview`);
  const [presentation, setPresentation] = useState<`visual` | `list`>(`visual`);
  const [today] = useState(() => new Date().toISOString().slice(0, 10));
  const selectedDays = Math.round((Date.parse(`${filters.to}T00:00:00Z`) - Date.parse(`${filters.from}T00:00:00Z`)) / 86400000) + 1;
  const isPreset = filters.to === today && [7, 30, 90].includes(selectedDays);
  const filterCount = [filters.path, filters.device, filters.country, filters.referrer].filter(Boolean).length;
  const oldest = new Date(Date.parse(`${today}T00:00:00Z`) - 364 * 86400000).toISOString().slice(0, 10);
  const rows = { path: report?.pages ?? [], device: report?.devices ?? [], country: report?.countries ?? [], referrer: report?.referrers ?? [] };
  const selectView = (view: TrafficOverviewView) => { setActiveView(view); setFiltersOpen(false); };
  const openFilters = () => { setDateError(``); setDraftFilters(filters); setFiltersOpen(true); };
  const toggleFilters = () => { if (filtersOpen) setFiltersOpen(false); else openFilters(); };
  const setPreset = (days: number) => { setDateError(``); setFiltersOpen(false); setFilters({ ...filters, ...getAnalyticsDateRange(days) }); };
  const selectSegment = (key: TrafficSegment, value: string) => setFilters({ ...filters, [key]: filters[key] === value ? `` : value });
  const clearSegments = () => {
    setFilters({ ...filters, path: ``, device: ``, country: ``, referrer: `` });
    setDraftFilters((draft) => ({ ...draft, path: ``, device: ``, country: ``, referrer: `` }));
  };
  const clearDraftSegments = () => setDraftFilters({ ...draftFilters, path: ``, device: ``, country: ``, referrer: `` });
  const applyFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const failure = getTrafficDateError(draftFilters.from, draftFilters.to);
    setDateError(failure);
    if (failure) return;
    setFilters(draftFilters);
    setFiltersOpen(false);
    return true;
  };
  const exportReport = () => {
    if (!report) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: `application/json` }));
    const link = document.createElement(`a`);
    link.href = url;
    link.download = `domains-database-traffic-${report.filters.from}-${report.filters.to}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return {
    ...analytics, rows, today, oldest, metric, compare, showArea, isPreset, dateError, activeView, showShares, filterCount, filtersOpen,
    presentation, selectedDays, draftFilters, showDaySlider, setMetric, setCompare, selectView, openFilters, setPreset, setShowArea,
    exportReport, applyFilters, clearSegments, toggleFilters, selectSegment, setShowShares, setPresentation, setDraftFilters, setShowDaySlider, clearDraftSegments,
  };
};
