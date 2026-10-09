import { Animated, Text, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { elementProps } from '../../shared/elementProps';
import { useAccountLoadingSkeleton } from './useAccountLoadingSkeleton';
import { Plug, Layers3, UserRound, ShieldCheck, LayoutDashboard } from 'lucide-react-native';

const navigation = [
  { id: `profile`, Icon: UserRound },
  { id: `connections`, Icon: Plug },
  { id: `dashboard`, Icon: LayoutDashboard },
];
const summaryCards = [`profile`, `connections`, `portfolio`];
const fields = [`name`, `email`];
const Placeholder = ({ id, style }: { id: string; style: StyleProp<ViewStyle> }) => (
  <View {...elementProps(`account-loading-placeholder`, id)} style={style} />
);

const AccountLoadingSkeleton = () => {
  const { styles, motion, palette, compact } = useAccountLoadingSkeleton();

  return (
    <View
      accessible
      style={styles.root}
      accessibilityRole={`progressbar`}
      accessibilityState={{ busy: true }}
      accessibilityLabel={`Loading Your Account`}
      {...elementProps(`account-loading-skeleton`)}
    >
      <View {...elementProps(`account-loading-heading`)} style={styles.heading}>
        <Animated.View
          accessibilityElementsHidden
          importantForAccessibility={`no-hide-descendants`}
          {...elementProps(`account-loading-avatar`)}
          style={[styles.avatar, motion]}
        >
          <UserRound {...elementProps(`account-loading-avatar-icon`)} size={compact ? 26 : 34} color={palette.accent} />
        </Animated.View>
        <View {...elementProps(`account-loading-heading-copy`)} style={styles.headingCopy}>
          <Text {...elementProps(`account-loading-eyebrow`)} style={styles.eyebrow}>{`ACCOUNT WORKSPACE`}</Text>
          <Text {...elementProps(`account-loading-label`)} style={styles.label}>{`Loading your account…`}</Text>
          <Text {...elementProps(`account-loading-description`)} style={styles.description}>{`Preparing your account workspace`}</Text>
        </View>
        {!compact && (
          <View {...elementProps(`account-loading-dots`)} style={styles.dots} accessibilityElementsHidden>
            {[0, 1, 2].map(index => (
              <Animated.View key={index} {...elementProps(`account-loading-dot`, `${index}`)} style={[styles.dot, motion]} />
            ))}
          </View>
        )}
      </View>
      <Animated.View
        accessibilityElementsHidden
        importantForAccessibility={`no-hide-descendants`}
        {...elementProps(`account-loading-workspace`)}
        style={[styles.workspace, motion]}
      >
        <View {...elementProps(`account-loading-sidebar`)} style={styles.sidebar}>
          {!compact && (
            <View {...elementProps(`account-loading-sidebar-profile`)} style={styles.sidebarProfile}>
              <Placeholder id={`sidebar-avatar`} style={[styles.placeholder, styles.smallAvatar]} />
              <Placeholder id={`sidebar-name`} style={[styles.placeholder, styles.name]} />
              <Placeholder id={`sidebar-email`} style={[styles.placeholder, styles.shortLine]} />
            </View>
          )}
          <View {...elementProps(`account-loading-navigation`)} style={styles.navigation}>
            {navigation.map(({ id, Icon }, index) => (
              <View key={id} {...elementProps(`account-loading-navigation-item`, id)} style={[styles.navigationItem, !index && styles.navigationSelected]}>
                <Icon {...elementProps(`account-loading-navigation-icon`, id)} size={17} color={!index ? palette.accent : palette.muted} />
                <Placeholder id={`navigation-${id}`} style={[styles.placeholder, styles.navigationLine]} />
              </View>
            ))}
          </View>
          {!compact && (
            <View {...elementProps(`account-loading-sidebar-note`)} style={styles.sidebarNote}>
              <ShieldCheck {...elementProps(`account-loading-sidebar-note-icon`)} size={22} color={palette.accent} />
              <Placeholder id={`sidebar-note-title`} style={[styles.placeholder, styles.shortLine]} />
              <Placeholder id={`sidebar-note-copy`} style={[styles.placeholder, styles.longLine]} />
            </View>
          )}
        </View>
        <View {...elementProps(`account-loading-content`)} style={styles.content}>
          <View {...elementProps(`account-loading-summary`)} style={styles.summary}>
            {summaryCards.map(id => (
              <View key={id} {...elementProps(`account-loading-summary-card`, id)} style={styles.summaryCard}>
                <View {...elementProps(`account-loading-summary-heading`, id)} style={styles.panelHeading}>
                  <Placeholder id={`summary-label-${id}`} style={[styles.placeholder, styles.shortLine]} />
                  <View {...elementProps(`account-loading-summary-mark`, id)} style={styles.summaryMark} />
                </View>
                <Placeholder id={`summary-value-${id}`} style={[styles.placeholder, styles.summaryValue]} />
              </View>
            ))}
          </View>
          <View {...elementProps(`account-loading-panels`)} style={styles.panels}>
            <View {...elementProps(`account-loading-form`)} style={styles.form}>
              <View {...elementProps(`account-loading-form-heading`)} style={styles.panelHeading}>
                <Placeholder id={`form-title`} style={[styles.placeholder, styles.titleLine]} />
                <Layers3 {...elementProps(`account-loading-form-icon`)} size={18} color={palette.accent} />
              </View>
              <View {...elementProps(`account-loading-fields`)} style={styles.fields}>
                {fields.map(id => (
                  <View key={id} {...elementProps(`account-loading-field`, id)} style={styles.field}>
                    <Placeholder id={`field-label-${id}`} style={[styles.placeholder, styles.fieldLabel]} />
                    <Placeholder id={`field-input-${id}`} style={[styles.placeholder, styles.input]} />
                  </View>
                ))}
                <View {...elementProps(`account-loading-field`, `bio`)} style={[styles.field, styles.fullField]}>
                  <Placeholder id={`field-label-bio`} style={[styles.placeholder, styles.fieldLabel]} />
                  <Placeholder id={`field-input-bio`} style={[styles.placeholder, styles.textarea]} />
                </View>
              </View>
              <View {...elementProps(`account-loading-preferences`)} style={styles.preference}>
                <View {...elementProps(`account-loading-preferences-copy`)} style={styles.preferenceCopy}>
                  <Placeholder id={`preference-label`} style={[styles.placeholder, styles.shortLine]} />
                  <Placeholder id={`preference-description`} style={[styles.placeholder, styles.longLine]} />
                </View>
                <Placeholder id={`preference-toggle`} style={[styles.placeholder, styles.toggle]} />
              </View>
              <View {...elementProps(`account-loading-form-footer`)} style={styles.formFooter}>
                <Placeholder id={`form-save`} style={[styles.placeholder, styles.save]} />
                <Placeholder id={`form-status`} style={[styles.placeholder, styles.status]} />
              </View>
            </View>
            <View {...elementProps(`account-loading-details`)} style={styles.details}>
              <View {...elementProps(`account-loading-detail-card`, `account`)} style={styles.detailCard}>
                <View {...elementProps(`account-loading-detail-heading`, `account`)} style={styles.panelHeading}>
                  <Placeholder id={`detail-account-title`} style={[styles.placeholder, styles.titleLine]} />
                  <ShieldCheck {...elementProps(`account-loading-detail-icon`, `account`)} size={18} color={palette.accent} />
                </View>
                {[`identity`, `role`, `privacy`].map(id => (
                  <View key={id} {...elementProps(`account-loading-detail-field`, id)} style={styles.detailField}>
                    <Placeholder id={`detail-label-${id}`} style={[styles.placeholder, styles.shortLine]} />
                    <Placeholder id={`detail-value-${id}`} style={[styles.placeholder, styles.longLine]} />
                  </View>
                ))}
              </View>
              <View {...elementProps(`account-loading-detail-card`, `connections`)} style={[styles.detailCard, styles.accentCard]}>
                <Plug {...elementProps(`account-loading-detail-icon`, `connections`)} size={22} color={palette.accent} />
                <Placeholder id={`detail-connections-title`} style={[styles.placeholder, styles.titleLine]} />
                <Placeholder id={`detail-connections-copy`} style={[styles.placeholder, styles.longLine]} />
                <View {...elementProps(`account-loading-connection-marks`)} style={styles.connectionMarks}>
                  {[0, 1, 2, 3].map(index => (
                    <Placeholder key={index} id={`connection-mark-${index}`} style={[styles.placeholder, styles.connectionMark]} />
                  ))}
                </View>
              </View>
            </View>
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

export default AccountLoadingSkeleton;
