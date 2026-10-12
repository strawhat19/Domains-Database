import type { TrafficSegment } from '../data';
import type { LucideIcon } from 'lucide-react';
import { getTrafficSegmentDetails, type TrafficSegmentDetails, type TrafficSegmentIconName } from './traffic-segment-data';
import { Bot, Eye, Bell, Info, Mail, Star, House, Gavel, Globe, Link2, LogIn, MapPin, Search, Laptop, Tablet, Wallet, Globe2, Monitor, FileText, BookOpen, UserPlus, UserRound, UsersRound, PlugZap, Activity, Smartphone, CalendarDays, ClipboardList, ShieldCheck, MessageCircle, MessagesSquare, LayoutDashboard, SlidersHorizontal, MonitorSmartphone, ChartNoAxesCombined } from 'lucide-react';

export type TrafficSegmentIdentity = TrafficSegmentDetails & { Icon: LucideIcon };
const navigationIcons: Record<TrafficSegmentIconName, LucideIcon> = {
  Bot, Eye, Bell, Info, Mail, Star,
  House, Gavel, Globe, Link2, LogIn,
  MapPin, Search, Laptop, Tablet, Wallet, Globe2,
  Monitor, FileText, BookOpen, UserPlus, PlugZap, Activity,
  UserRound, UsersRound, Smartphone, ShieldCheck, MessageCircle,
  CalendarDays, ClipboardList, MessagesSquare, LayoutDashboard, SlidersHorizontal, MonitorSmartphone, ChartNoAxesCombined,
};
export const getTrafficSegmentIdentity = (segment: TrafficSegment, value: string): TrafficSegmentIdentity => {
  const details = getTrafficSegmentDetails(segment, value);
  return { ...details, Icon: navigationIcons[details.icon] };
};
