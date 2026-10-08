import { useMemo } from 'react';
import { Text, View } from 'react-native';
import { createStyles } from './styles.native';
import { elementProps } from '../../shared/elementProps';
import { useTheme } from '../../shared/themeContext/useTheme';
import type { DomainProjectTone } from '../../shared/domainProject';
import { DOMAIN_DIFFICULTIES, DOMAIN_PROJECT_STATUSES, normalizeDomainProjectStatus } from '../../shared/domainProject';
import {
  Ban,
  Eye,
  Flag,
  Plug,
  Code2,
  Award,
  LogIn,
  Brain,
  Sprout,
  Rocket,
  Monitor,
  ListTodo,
  Database,
  Building2,
  Lightbulb,
  Briefcase,
  Megaphone,
  CreditCard,
  CheckCheck,
  Smartphone,
  CircleCheck,
  FlaskConical,
} from 'lucide-react-native';

interface DomainProjectBadgeProps {
  id: string;
  value?: string;
  field: `projectStatus` | `difficulty`;
}

const icons: Record<string, typeof Eye> = {
  Ban,
  Eye,
  Flag,
  Plug,
  Code2,
  Award,
  LogIn,
  Brain,
  Sprout,
  Rocket,
  Monitor,
  ListTodo,
  Database,
  Building2,
  Lightbulb,
  Briefcase,
  Megaphone,
  CreditCard,
  CheckCheck,
  Smartphone,
  CircleCheck,
  FlaskConical,
};

const DomainProjectBadge = ({ id, field, value }: DomainProjectBadgeProps) => {
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const iconColors: Record<DomainProjectTone, string> = {
    accent: palette.accent,
    danger: palette.danger,
    neutral: palette.muted,
    success: palette.success,
    warning: palette.warning,
  };
  const options = field === `projectStatus` ? DOMAIN_PROJECT_STATUSES : DOMAIN_DIFFICULTIES;
  const badgeValue = field === `projectStatus` ? normalizeDomainProjectStatus(value) : value;
  const option = options.find(item => item.value === badgeValue);
  const Icon = option ? icons[option.icon] : undefined;

  return (
    <View {...elementProps(`domain-project-badge`, id)} style={styles.rowStatus}>
      {Icon && (
        <View
          accessible={false}
          style={styles.statusDotWrap}
          {...elementProps(`domain-project-badge-icon-wrap`, id)}
        >
          <Icon
            size={14}
            color={iconColors[option?.tone ?? `neutral`]}
            {...elementProps(`domain-project-badge-icon`, id)}
          />
        </View>
      )}
      <Text
        numberOfLines={1}
        style={styles.statusText}
        {...elementProps(`domain-project-badge-label`, id)}
      >
        {option?.label ?? badgeValue ?? `—`}
      </Text>
    </View>
  );
};

export default DomainProjectBadge;
