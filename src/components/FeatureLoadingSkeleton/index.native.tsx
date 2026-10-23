import { Animated, Platform, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { elementProps } from '../../shared/elementProps';
import { useFeatureLoadingSkeleton } from './useFeatureLoadingSkeleton';

type FeatureLoadingSkeletonProps = { feature: `auction` | `community` };
type PlaceholderProps = { id: string; style: StyleProp<ViewStyle> };

const Placeholder = ({ id, style }: PlaceholderProps) => <View {...elementProps(`feature-loading-placeholder`, id)} style={style} />;

const FeatureLoadingSkeleton = ({ feature }: FeatureLoadingSkeletonProps) => {
  const { styles, motion, compact } = useFeatureLoadingSkeleton();
  const community = feature === `community`;
  const placeholder = (id: string, style: StyleProp<ViewStyle>) => <Placeholder id={`${feature}-${id}`} style={[styles.placeholder, style]} />;
  const decorativeProps = Platform.OS === `web`
    ? { 'aria-hidden': true as const }
    : { accessible: false, accessibilityElementsHidden: true, importantForAccessibility: `no-hide-descendants` as const };

  return <View
    accessible
    pointerEvents={`none`}
    accessibilityRole={`progressbar`}
    accessibilityState={{ busy: true }}
    {...elementProps(`feature-loading-skeleton`, feature)}
    style={[styles.root, community && styles.communityRoot]}
    accessibilityLabel={community ? `Loading Community` : `Loading Auction`}
  >
    <Animated.View
      {...decorativeProps}
      {...elementProps(`feature-loading-content`, feature)}
      style={[styles.content, community && styles.communityContent, motion]}
    >
      <View {...elementProps(`feature-loading-heading`, feature)} style={styles.heading}>
        <View {...elementProps(`feature-loading-heading-copy`, feature)} style={styles.headingCopy}>
          {placeholder(`eyebrow`, styles.eyebrow)}
          {placeholder(`title`, [styles.title, community && styles.communityTitle])}
          {placeholder(`description-0`, styles.description)}
          {placeholder(`description-1`, [styles.description, styles.medium])}
        </View>
        {!community && <View {...elementProps(`feature-loading-actions`, feature)} style={styles.actions}>
          {[0, 1, 2, 3].map(index => <Placeholder key={index} id={`${feature}-action-${index}`} style={[styles.placeholder, styles.action]} />)}
        </View>}
      </View>
      {community ? <>
        <View {...elementProps(`feature-loading-profiles`, feature)} style={styles.profiles}>
          {(compact ? [0, 1] : [0, 1, 2]).map(index => <View key={index} {...elementProps(`feature-loading-profile`, `${feature}-${index}`)} style={styles.profile}>
            {placeholder(`profile-${index}-avatar`, styles.avatar)}
            {placeholder(`profile-${index}-name`, [styles.line, styles.medium])}
            {placeholder(`profile-${index}-description`, styles.line)}
            {placeholder(`profile-${index}-detail`, [styles.line, styles.short])}
          </View>)}
        </View>
        <View {...elementProps(`feature-loading-columns`, feature)} style={styles.columns}>
          <View {...elementProps(`feature-loading-feed`, feature)} style={styles.feed}>
            <View {...elementProps(`feature-loading-composer`, feature)} style={styles.panel}>
              {placeholder(`composer-title`, styles.sectionTitle)}
              {placeholder(`composer-input`, styles.composer)}
              <View {...elementProps(`feature-loading-composer-footer`, feature)} style={styles.composerFooter}>
                {placeholder(`composer-audience`, [styles.line, styles.short])}
                {placeholder(`composer-action`, styles.smallAction)}
              </View>
            </View>
            <View {...elementProps(`feature-loading-tabs`, feature)} style={styles.tabs}>
              {[0, 1, 2].map(index => <Placeholder key={index} id={`${feature}-tab-${index}`} style={[styles.placeholder, styles.tab]} />)}
            </View>
            {placeholder(`search`, styles.input)}
            {[0, 1, 2].map(index => <View key={index} {...elementProps(`feature-loading-post`, `${feature}-${index}`)} style={styles.panel}>
              <View {...elementProps(`feature-loading-post-heading`, `${feature}-${index}`)} style={styles.row}>
                {placeholder(`post-${index}-avatar`, styles.avatar)}
                <View {...elementProps(`feature-loading-post-author`, `${feature}-${index}`)} style={styles.copy}>
                  {placeholder(`post-${index}-name`, styles.personName)}
                  {placeholder(`post-${index}-metadata`, styles.metadata)}
                </View>
              </View>
              <View {...elementProps(`feature-loading-post-body`, `${feature}-${index}`)} style={styles.postBody}>
                {placeholder(`post-${index}-line-0`, styles.line)}
                {placeholder(`post-${index}-line-1`, styles.line)}
                {placeholder(`post-${index}-line-2`, [styles.line, index % 2 ? styles.medium : styles.short])}
              </View>
              <View {...elementProps(`feature-loading-post-footer`, `${feature}-${index}`)} style={styles.postFooter}>
                {[0, 1].map(stat => <Placeholder key={stat} id={`${feature}-post-${index}-stat-${stat}`} style={[styles.placeholder, styles.postStat]} />)}
              </View>
            </View>)}
          </View>
          <View {...elementProps(`feature-loading-sidebar`, feature)} style={styles.sidebar}>
            {[0, 1].map(section => <View key={section} {...elementProps(`feature-loading-sidebar-panel`, `${feature}-${section}`)} style={styles.panel}>
              {placeholder(`sidebar-${section}-title`, styles.sectionTitle)}
              {[0, 1, 2].map(index => <View key={index} {...elementProps(`feature-loading-sidebar-person`, `${feature}-${section}-${index}`)} style={styles.sidebarRow}>
                {placeholder(`sidebar-${section}-${index}-avatar`, styles.avatarSmall)}
                <View {...elementProps(`feature-loading-sidebar-copy`, `${feature}-${section}-${index}`)} style={styles.copy}>
                  {placeholder(`sidebar-${section}-${index}-name`, [styles.line, styles.medium])}
                  {placeholder(`sidebar-${section}-${index}-detail`, styles.metadata)}
                </View>
              </View>)}
            </View>)}
          </View>
        </View>
      </> : <>
        <View {...elementProps(`feature-loading-notice`, feature)} style={styles.notice}>
          {placeholder(`notice-title`, styles.sectionTitle)}
          {placeholder(`notice-copy-0`, styles.line)}
          {placeholder(`notice-copy-1`, [styles.line, styles.medium])}
          {placeholder(`notice-copy-2`, [styles.line, styles.short])}
        </View>
        <View {...elementProps(`feature-loading-filters`, feature)} style={styles.panel}>
          <View {...elementProps(`feature-loading-fields`, feature)} style={styles.fields}>
            {[`search`, `match`, `sort`].map((field, index) => <View key={field} {...elementProps(`feature-loading-field`, `${feature}-${field}`)} style={index ? styles.select : styles.search}>
              {placeholder(`field-${field}-label`, styles.fieldLabel)}
              {placeholder(`field-${field}-input`, styles.input)}
            </View>)}
          </View>
          {placeholder(`filter-action`, styles.filterAction)}
        </View>
        <View {...elementProps(`feature-loading-sources`, feature)} style={styles.sources}>
          {[0, 1, 2, 3].map(index => <Placeholder key={index} id={`${feature}-source-${index}`} style={[styles.placeholder, styles.source]} />)}
        </View>
        <View {...elementProps(`feature-loading-listings`, feature)} style={[styles.panel, styles.table]}>
          <View {...elementProps(`feature-loading-listings-heading`, feature)} style={styles.tableHeading}>
            {placeholder(`listings-title`, styles.sectionTitle)}
            {placeholder(`listings-count`, styles.fieldLabel)}
          </View>
          <View {...elementProps(`feature-loading-table-header`, feature)} style={styles.tableHeader}>
            {(compact ? [0, 1, 2] : [0, 1, 2, 3, 4]).map(index => <Placeholder key={index} id={`${feature}-column-${index}`} style={[styles.placeholder, styles.tableCell, !index && { flex: 2 }]} />)}
          </View>
          {[0, 1, 2, 3, 4].map(index => <View key={index} {...elementProps(`feature-loading-listing`, `${feature}-${index}`)} style={styles.tableRow}>
            <View {...elementProps(`feature-loading-listing-name`, `${feature}-${index}`)} style={styles.tableName}>
              {placeholder(`listing-${index}-name`, [styles.line, index % 2 ? styles.medium : undefined])}
              {placeholder(`listing-${index}-source`, [styles.line, styles.short, { height: 8 }])}
            </View>
            {(compact ? [0, 1] : [0, 1, 2, 3]).map(column => <Placeholder key={column} id={`${feature}-listing-${index}-cell-${column}`} style={[styles.placeholder, styles.tableCell]} />)}
          </View>)}
          <View {...elementProps(`feature-loading-table-footer`, feature)} style={styles.tableFooter} />
        </View>
      </>}
    </Animated.View>
  </View>;
};

export default FeatureLoadingSkeleton;
