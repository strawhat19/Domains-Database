import { useMemo } from 'react';
import { Link } from 'expo-router';
import { createStyles } from './styles.native';
import { routes } from '../../shared/routes';
import type { AdminFeedbackProps } from './types';
import { Text, View, Pressable } from 'react-native';
import { elementProps } from '../../shared/elementProps';
import { feedbackCards, feedbackComingSoon } from './data';
import { useTheme } from '../../shared/themeContext/useTheme';
import { Bot, Star, ArrowLeft, ArrowUpRight, ClipboardList, MessageCircle, MessagesSquare } from 'lucide-react-native';

const icons = { Bot, Star, ClipboardList, MessageCircle, MessagesSquare };

const AdminFeedback = ({ section = `feedback` }: AdminFeedbackProps = {}) => {
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const detail = section === `feedback` ? null : feedbackComingSoon[section];
  const route = detail?.route ?? routes.adminFeedback;
  const Icon = icons[route.icon];

  return (
    <View {...elementProps(`admin-feedback`, section)} style={styles.root}>
      <View {...elementProps(`admin-feedback-heading`, section)} style={styles.heading}>
        <View {...elementProps(`admin-feedback-title-row`, section)} style={styles.titleRow}>
          <Icon {...elementProps(`admin-feedback-title-icon`, section)} size={21} color={palette.accent} accessible={false} />
          <Text {...elementProps(`admin-feedback-title`, section)} style={styles.title} accessibilityRole={`header`}>{route.label}</Text>
        </View>
        <Text {...elementProps(`admin-feedback-intro`, section)} style={styles.copy}>
          {detail ? `A planned feedback channel` : `Browse feedback channels and saved submissions`}
        </Text>
      </View>

      {detail ? (
        <View {...elementProps(`admin-feedback-coming-soon`, section)} style={styles.comingSoon}>
          <View {...elementProps(`admin-feedback-coming-soon-heading`, section)} style={styles.comingSoonHeading}>
            <View {...elementProps(`admin-feedback-coming-soon-icon-wrap`, section)} style={styles.iconWrap}>
              <Icon {...elementProps(`admin-feedback-coming-soon-icon`, section)} size={23} color={palette.accent} accessible={false} />
            </View>
            <Text {...elementProps(`admin-feedback-coming-soon-title`, section)} style={styles.comingSoonTitle} accessibilityRole={`header`}>{`Coming Soon`}</Text>
          </View>
          <Text {...elementProps(`admin-feedback-coming-soon-copy`, section)} style={styles.copy}>{detail.description}</Text>
          <View {...elementProps(`admin-feedback-coming-soon-actions`, section)} style={styles.actions}>
            <Link href={routes.adminFeedback.href} asChild>
              <Pressable
                accessibilityRole={`link`}
                {...elementProps(`admin-feedback-back`, section)}
                style={({ pressed }) => [styles.link, pressed && styles.pressed]}
              >
                <ArrowLeft {...elementProps(`admin-feedback-back-icon`, section)} size={14} color={palette.accent} accessible={false} />
                <Text {...elementProps(`admin-feedback-back-label`, section)} style={styles.linkText}>{routes.adminFeedback.label}</Text>
              </Pressable>
            </Link>
            <Link href={routes.adminFormSubmissions.href} asChild>
              <Pressable
                accessibilityRole={`link`}
                {...elementProps(`admin-feedback-submissions`, section)}
                style={({ pressed }) => [styles.link, pressed && styles.pressed]}
              >
                <ClipboardList {...elementProps(`admin-feedback-submissions-icon`, section)} size={14} color={palette.accent} accessible={false} />
                <Text {...elementProps(`admin-feedback-submissions-label`, section)} style={styles.linkText}>{routes.adminFormSubmissions.label}</Text>
              </Pressable>
            </Link>
          </View>
        </View>
      ) : (
        <View {...elementProps(`admin-feedback-cards`)} style={styles.cards}>
          {feedbackCards.map(card => {
            const CardIcon = icons[card.route.icon];
            const status = card.available ? `Available` : `Coming Soon`;
            return (
              <Link key={card.id} href={card.route.href} asChild>
                <Pressable
                  accessibilityRole={`link`}
                  {...elementProps(`admin-feedback-card`, card.id)}
                  style={({ pressed }) => [styles.card, pressed && styles.pressed]}
                  accessibilityLabel={`${card.route.label} · ${status} · ${card.description}`}
                >
                  <View {...elementProps(`admin-feedback-card-icon-wrap`, card.id)} style={styles.iconWrap}>
                    <CardIcon {...elementProps(`admin-feedback-card-icon`, card.id)} size={23} color={palette.accent} accessible={false} />
                  </View>
                  <View {...elementProps(`admin-feedback-card-copy`, card.id)} style={styles.cardCopy}>
                    <View {...elementProps(`admin-feedback-card-heading`, card.id)} style={styles.cardHeading}>
                      <Text {...elementProps(`admin-feedback-card-title`, card.id)} style={styles.cardTitle}>{card.route.label}</Text>
                      <View {...elementProps(`admin-feedback-card-status`, card.id)} style={[styles.badge, card.available && styles.availableBadge]}>
                        <Text {...elementProps(`admin-feedback-card-status-label`, card.id)} style={[styles.badgeText, card.available && styles.availableBadgeText]}>{status}</Text>
                      </View>
                    </View>
                    <Text {...elementProps(`admin-feedback-card-description`, card.id)} style={styles.copy}>{card.description}</Text>
                    <View {...elementProps(`admin-feedback-card-open`, card.id)} style={styles.cardOpen}>
                      <Text {...elementProps(`admin-feedback-card-open-label`, card.id)} style={styles.linkText}>{`Open ${card.route.label}`}</Text>
                      <ArrowUpRight {...elementProps(`admin-feedback-card-arrow`, card.id)} size={13} color={palette.accent} accessible={false} />
                    </View>
                  </View>
                </Pressable>
              </Link>
            );
          })}
        </View>
      )}
    </View>
  );
};

export default AdminFeedback;
