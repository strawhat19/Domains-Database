import { Check, Minus } from 'lucide-react';
import SegmentedControl from './index.web';

interface BooleanSettingProps {
  id: string;
  value: boolean;
  label?: string;
  disabled?: boolean;
  className?: string;
  labelledBy?: string;
  describedBy?: string;
  onChange: (value: boolean) => void;
}

const BOOLEAN_OPTIONS = [
  { value: `off`, label: `Off`, Icon: Minus },
  { value: `on`, label: `On`, Icon: Check },
] as const;

const BooleanSetting = ({ value, onChange, ...props }: BooleanSettingProps) => (
  <SegmentedControl
    {...props}
    options={BOOLEAN_OPTIONS}
    value={value ? `on` : `off`}
    onChange={option => onChange(option === `on`)}
  />
);

export default BooleanSetting;
