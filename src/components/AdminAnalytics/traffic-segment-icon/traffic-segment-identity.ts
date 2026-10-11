import type { TrafficSegment } from '../data';
import type { LucideIcon } from 'lucide-react';
import { getTrafficSegmentDetails, type TrafficSegmentDetails, type TrafficSegmentIconName } from './traffic-segment-data';
import { Eye, Bell, Info, Mail, House, Gavel, Globe, Link2, LogIn, MapPin, Search, Laptop, Tablet, Wallet, Globe2, Monitor, FileText, BookOpen, UserPlus, UserRound, UsersRound, PlugZap, Activity, Smartphone, ShieldCheck, MessageCircle, LayoutDashboard, MonitorSmartphone, ChartNoAxesCombined } from 'lucide-react';

export type TrafficSegmentIdentity = TrafficSegmentDetails & { Icon: LucideIcon };
const navigationIcons: Record<TrafficSegmentIconName, LucideIcon> = {
  Eye, Bell, Info, Mail,
  House, Gavel, Globe, Link2, LogIn,
  MapPin, Search, Laptop, Tablet, Wallet, Globe2,
  Monitor, FileText, BookOpen, UserPlus, PlugZap, Activity,
  UserRound, UsersRound, Smartphone, ShieldCheck, MessageCircle,
  LayoutDashboard, MonitorSmartphone, ChartNoAxesCombined,
};
export const getTrafficSegmentIdentity = (segment: TrafficSegment, value: string): TrafficSegmentIdentity => {
  const details = getTrafficSegmentDetails(segment, value);
  return { ...details, Icon: navigationIcons[details.icon] };
};
