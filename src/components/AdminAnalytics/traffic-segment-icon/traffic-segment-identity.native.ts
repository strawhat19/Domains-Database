import type { TrafficSegment } from '../data';
import type { LucideIcon } from 'lucide-react-native';
import { getTrafficSegmentDetails, type TrafficSegmentDetails, type TrafficSegmentIconName } from './traffic-segment-data';
import { Eye, Bell, Info, Mail, Gavel, Globe, House, Link2, LogIn, Laptop, MapPin, Search, Tablet, Wallet, Globe2, Monitor, PlugZap, Activity, BookOpen, FileText, UserPlus, UserRound, Smartphone, UsersRound, ShieldCheck, MessageCircle, LayoutDashboard, MonitorSmartphone, ChartNoAxesCombined } from 'lucide-react-native';

const navigationIcons: Record<TrafficSegmentIconName, LucideIcon> = {
  Eye, Bell, Info, Mail, Gavel, Globe, House, Link2, LogIn, Laptop, MapPin, Search, Tablet,
  Wallet, Globe2, Monitor, PlugZap, Activity, BookOpen, FileText, UserPlus, UserRound, Smartphone,
  UsersRound, ShieldCheck, MessageCircle, LayoutDashboard, MonitorSmartphone, ChartNoAxesCombined,
};
export type NativeTrafficSegmentIdentity = TrafficSegmentDetails & { Icon: LucideIcon };
export const getTrafficSegmentIdentity = (segment: TrafficSegment, value: string): NativeTrafficSegmentIdentity => {
  const details = getTrafficSegmentDetails(segment, value);
  return { ...details, Icon: navigationIcons[details.icon] ?? Globe };
};
