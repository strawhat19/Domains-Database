import type { TrafficSegment } from '../data';
import type { LucideIcon } from 'lucide-react-native';
import { getTrafficSegmentDetails, type TrafficSegmentDetails, type TrafficSegmentIconName } from './traffic-segment-data';
import { Bot, Eye, Bell, Info, Mail, Star, Gavel, Globe, House, Link2, LogIn, Laptop, MapPin, Search, Tablet, Wallet, Globe2, Monitor, PlugZap, Activity, BookOpen, FileText, UserPlus, UserRound, Smartphone, UsersRound, CalendarDays, ClipboardList, ShieldCheck, MessageCircle, MessagesSquare, LayoutDashboard, SlidersHorizontal, MonitorSmartphone, ChartNoAxesCombined } from 'lucide-react-native';

const navigationIcons: Record<TrafficSegmentIconName, LucideIcon> = {
  Bot, Eye, Bell, Info, Mail, Star, Gavel, Globe, House, Link2, LogIn, Laptop, MapPin, Search, Tablet,
  Wallet, Globe2, Monitor, PlugZap, Activity, BookOpen, FileText, UserPlus, UserRound, Smartphone,
  UsersRound, CalendarDays, ClipboardList, ShieldCheck, MessageCircle, MessagesSquare, LayoutDashboard, SlidersHorizontal, MonitorSmartphone, ChartNoAxesCombined,
};
export type NativeTrafficSegmentIdentity = TrafficSegmentDetails & { Icon: LucideIcon };
export const getTrafficSegmentIdentity = (segment: TrafficSegment, value: string): NativeTrafficSegmentIdentity => {
  const details = getTrafficSegmentDetails(segment, value);
  return { ...details, Icon: navigationIcons[details.icon] ?? Globe };
};
