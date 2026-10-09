import { Link } from 'expo-router';
import type { Href } from 'expo-router';
import { routes } from '../../shared/routes';
import StackPillShape from '../StackPillShape';
import { createStyles } from './styles.native';
import LandingOverview from '../LandingOverview';
import type { LandingSectionsProps } from './types';
import { useMemo, useState, useEffect } from 'react';
import LandingDomainCard from '../LandingDomainCard';
import { elementProps } from '../../shared/elementProps';
import { getBlogHref } from '../../shared/blog/metadata';
import { useTheme } from '../../shared/themeContext/useTheme';
import { useReducedMotion } from '../../shared/common/useReducedMotion';
import { activityCells, domainBasics, landingPlans, portfolioSteps } from './content';
import { Text, View, Easing, Animated, Pressable, useWindowDimensions } from 'react-native';
import { Check, LockKeyhole, Globe2, Server, PanelTop, Sparkles, TrendingUp, ArrowUpRight } from 'lucide-react-native';

const LandingSections = ({ search }: LandingSectionsProps) => {
  const { palette } = useTheme();
  const { width } = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const [phases] = useState(() => Array.from({ length: 8 }, () => new Animated.Value(1)));
  const compact = width < 600;
  const columns = width >= 900 ? 3 : 1;
  const trendingColumns = width >= 1000 ? 3 : width >= 600 ? 2 : 1;
  const contentWidth = Math.max(0, Math.min(width, 1120) - (compact ? 40 : 64));
  const cardWidth = (contentWidth - (columns - 1) * 14) / columns;
  const trendingWidth = (contentWidth - (trendingColumns - 1) * 14) / trendingColumns;
  const discovery = search.discovery;
  const trending = discovery.results.filter(result => result.statuses.includes(`trending`)).slice(0, 6);
  const trendingLoading = search.trendingCountLoading || discovery.accessLoading || discovery.loading;
  const activityRows = Array.from({ length: 7 }, (_, row) => activityCells.filter(cell => cell.index % 7 === row));
  const activityColors = [palette.line, `${palette.accent}40`, `${palette.accent}70`, `${palette.accent}b0`, palette.accent];

  useEffect(() => {
    phases.forEach(phase => phase.setValue(1));
    if (reducedMotion) return;
    const animations = phases.map((phase, index) => Animated.sequence([
      Animated.delay(index * 240),
      Animated.loop(Animated.sequence([
        Animated.timing(phase, { toValue: .35, duration: 1800 + index * 170, easing: Easing.inOut(Easing.quad), isInteraction: false, useNativeDriver: true }),
        Animated.timing(phase, { toValue: 1, duration: 2200 + index * 130, easing: Easing.inOut(Easing.quad), isInteraction: false, useNativeDriver: true }),
      ])),
    ]));
    animations.forEach(animation => animation.start());
    return () => animations.forEach(animation => animation.stop());
  }, [phases, reducedMotion]);

  const renderLink = (id: string, href: Href, label: string, secondary = false, small = false) => (
    <Link asChild href={href}>
      <Pressable
        accessibilityRole={`link`}
        accessibilityLabel={label}
        {...elementProps(id)}
        style={({ pressed }) => [styles.button, secondary && styles.secondaryButton, small && styles.smallButton, pressed && styles.pressed]}
      >
        <Text {...elementProps(`${id}-text`)} style={[styles.buttonText, secondary && styles.secondaryButtonText]}>{label}</Text>
        <ArrowUpRight {...elementProps(`${id}-icon`)} size={small ? 12 : 14} color={secondary ? palette.accent : palette.contrast} accessible={false} />
      </Pressable>
    </Link>
  );

  const renderHeading = (id: string, eyebrow: string, title: string, description: string) => (
    <View {...elementProps(`${id}-heading`)} style={styles.heading}>
      <Text {...elementProps(`${id}-eyebrow`)} style={styles.eyebrow}>{eyebrow}</Text>
      <Text {...elementProps(`${id}-title`)} style={styles.title} accessibilityRole={`header`}>{title}</Text>
      <Text {...elementProps(`${id}-description`)} style={styles.description}>{description}</Text>
    </View>
  );

  const renderCardShape = (id: string, fill = palette.input, stroke = palette.line) => (
    <>
      <View
        accessible={false}
        pointerEvents={`none`}
        accessibilityElementsHidden
        importantForAccessibility={`no-hide-descendants`}
        {...elementProps(`landing-card-backing`, id)}
        style={styles.cardBacking}
      >
        <StackPillShape id={`${id}-backing`} fill={palette.subtle} stroke={`${palette.accent}30`} />
      </View>
      <View
        accessible={false}
        pointerEvents={`none`}
        accessibilityElementsHidden
        importantForAccessibility={`no-hide-descendants`}
        {...elementProps(`landing-card-foreground`, id)}
        style={styles.cardForeground}
      >
        <StackPillShape id={`${id}-foreground`} fill={fill} stroke={stroke} />
      </View>
    </>
  );

  return (
    <View {...elementProps(`landing-sections`)} style={styles.sections}>
      <View {...elementProps(`landing-domain-basics`)} style={[styles.section, compact && styles.compactSection]}>
        <View {...elementProps(`landing-domain-basics-inner`)} style={styles.inner}>
          {renderHeading(`landing-domain-basics`, `THE BASICS`, `What are domains?`, `Your address, your hosting, and your website work together. Each has a different job.`)}
          <View {...elementProps(`landing-domain-basics-grid`)} style={styles.grid}>
            {domainBasics.map(item => {
              const Icon = item.id === `domain` ? Globe2 : item.id === `hosting` ? Server : PanelTop;
              return (
                <View key={item.id} {...elementProps(`landing-domain-basic-card`, item.id)} style={[styles.basicCard, { width: cardWidth }]}>
                  {renderCardShape(`landing-basic-${item.id}`)}
                  <View {...elementProps(`landing-domain-basic-top`, item.id)} style={styles.cardTop}>
                    <Text {...elementProps(`landing-domain-basic-label`, item.id)} style={styles.cardLabel}>{item.label}</Text>
                    <Icon {...elementProps(`landing-domain-basic-icon`, item.id)} size={20} color={palette.accent} accessible={false} />
                  </View>
                  <Text {...elementProps(`landing-domain-basic-title`, item.id)} style={styles.cardTitle} accessibilityRole={`header`}>{item.title}</Text>
                  <Text {...elementProps(`landing-domain-basic-description`, item.id)} style={styles.cardDescription}>{item.description}</Text>
                  <Text {...elementProps(`landing-domain-basic-example`, item.id)} style={styles.example}>{item.example}</Text>
                </View>
              );
            })}
          </View>
          <View {...elementProps(`landing-domain-basics-guide`)} style={styles.sectionAction}>
            {renderLink(`landing-domain-guide-link`, getBlogHref(`domain-vs-hosting-vs-website`), `Read The Full Guide`, true, true)}
          </View>
        </View>
      </View>

      <LandingOverview />

      <View {...elementProps(`landing-portfolio-cta`)} style={[styles.section, styles.alternateSection, compact && styles.compactSection]}>
        <View {...elementProps(`landing-portfolio-cta-inner`)} style={[styles.inner, styles.cta, width >= 800 && styles.wideCta]}>
          <View {...elementProps(`landing-portfolio-cta-copy`)} style={styles.ctaCopy}>
            <Text {...elementProps(`landing-portfolio-cta-eyebrow`)} style={styles.eyebrow}>{`PUT YOUR IDEAS IN ORDER`}</Text>
            <Text {...elementProps(`landing-portfolio-cta-title`)} style={styles.title} accessibilityRole={`header`}>{`Good names deserve a place to grow`}</Text>
            <Text {...elementProps(`landing-portfolio-cta-description`)} style={styles.description}>{`Bring your domains, registrars, and renewal dates together. Keep your next move in view.`}</Text>
          </View>
          {renderLink(`landing-open-portfolio-link`, routes.domains.href, `Open Your Portfolio`)}
        </View>
      </View>

      <View {...elementProps(`landing-trending`)} style={[styles.section, compact && styles.compactSection]}>
        <View {...elementProps(`landing-trending-inner`)} style={styles.inner}>
          <View {...elementProps(`landing-trending-heading-row`)} style={[styles.headingRow, width >= 700 && styles.wideHeadingRow]}>
            {renderHeading(`landing-trending`, `A LITTLE INSPIRATION`, `Trending domains`, `Explore curated name ideas checked with your connected registrars. Select a name to check its latest availability.`)}
            {renderLink(`landing-explore-domains-link`, routes.search.href, `Explore Domains`, true, true)}
          </View>
          <View
            {...elementProps(`landing-trending-results`)}
            style={styles.grid}
            accessibilityLiveRegion={`polite`}
            accessibilityState={{ busy: trendingLoading }}
          >
            {trendingLoading ? Array.from({ length: 6 }, (_, index) => (
              <View key={index} {...elementProps(`landing-trending-skeleton`, `${index}`)} style={[styles.trendingSkeleton, { width: trendingWidth }]} accessible={false}>
                {renderCardShape(`landing-trending-loading-${index}`)}
                <Animated.View {...elementProps(`landing-trending-skeleton-name`, `${index}`)} style={[styles.skeletonName, { opacity: phases[0] }]} />
                <Animated.View {...elementProps(`landing-trending-skeleton-line`, `${index}`)} style={[styles.skeletonLine, { opacity: phases[0] }]} />
                <Animated.View {...elementProps(`landing-trending-skeleton-price`, `${index}`)} style={[styles.skeletonPrice, { opacity: phases[0] }]} />
              </View>
            )) : !discovery.eligible ? (
              <View {...elementProps(`landing-trending-connection-state`)} style={styles.emptyState}>
                {renderCardShape(`landing-trending-connection`)}
                <Globe2 {...elementProps(`landing-trending-connection-icon`)} size={24} color={palette.accent} style={styles.cardContent} accessible={false} />
                <Text {...elementProps(`landing-trending-connection-title`)} style={styles.cardTitle}>{`Connect A Registrar To Discover Names`}</Text>
                <Text {...elementProps(`landing-trending-connection-description`)} style={styles.cardDescription}>{discovery.error || `Trending domains appear when a registrar connection is available.`}</Text>
                {renderLink(`landing-trending-connect-link`, routes.connections.href, `Manage Connections`, true, true)}
              </View>
            ) : discovery.error ? (
              <View {...elementProps(`landing-trending-error-state`)} style={styles.emptyState}>
                {renderCardShape(`landing-trending-error`)}
                <Text {...elementProps(`landing-trending-error-title`)} style={styles.cardTitle}>{`Trending Domains Are Unavailable`}</Text>
                <Text {...elementProps(`landing-trending-error-description`)} style={[styles.cardDescription, styles.errorText]}>{discovery.error}</Text>
                <Pressable
                  onPress={discovery.refresh}
                  accessibilityRole={`button`}
                  {...elementProps(`landing-trending-retry`)}
                  style={({ pressed }) => [styles.button, styles.secondaryButton, styles.smallButton, pressed && styles.pressed]}
                >
                  <Text {...elementProps(`landing-trending-retry-text`)} style={[styles.buttonText, styles.secondaryButtonText]}>{`Try Again`}</Text>
                  <TrendingUp {...elementProps(`landing-trending-retry-icon`)} size={12} color={palette.accent} accessible={false} />
                </Pressable>
              </View>
            ) : trending.length ? trending.map(result => (
              <View key={result.domain} {...elementProps(`landing-trending-card-slot`, result.domain.replace(/[^a-z0-9-]/gi, `-`))} style={{ width: trendingWidth }}>
                <LandingDomainCard result={result} onSearch={search.searchDomain} />
              </View>
            )) : (
              <View {...elementProps(`landing-trending-empty-state`)} style={styles.emptyState}>
                {renderCardShape(`landing-trending-empty`)}
                <Text {...elementProps(`landing-trending-empty-title`)} style={styles.cardTitle}>{`No Trending Names Right Now`}</Text>
                <Text {...elementProps(`landing-trending-empty-description`)} style={styles.cardDescription}>{`Search for your own idea or check back for more available name ideas.`}</Text>
                {renderLink(`landing-trending-empty-search-link`, routes.search.href, `Search Domains`, true, true)}
              </View>
            )}
          </View>
          <Text {...elementProps(`landing-trending-note`)} style={styles.note}>{`Availability and prices can change. Confirm the latest quote with the registrar.`}</Text>
        </View>
      </View>

      <View {...elementProps(`landing-activity`)} style={[styles.section, styles.alternateSection, compact && styles.compactSection]}>
        <View {...elementProps(`landing-activity-inner`)} style={[styles.inner, styles.activityLayout, width >= 900 && styles.wideActivityLayout]}>
          <View {...elementProps(`landing-activity-copy`)} style={[styles.activityCopy, width >= 900 && styles.wideActivityCopy]}>
            {renderHeading(`landing-activity`, `SMALL MOVES. BIG POSSIBILITIES.`, `Keep your ideas moving`, `A name today. A plan tomorrow. Build a portfolio that moves with you, one useful step at a time.`)}
            <View {...elementProps(`landing-portfolio-steps`)} style={styles.steps}>
              {portfolioSteps.map((step, index) => (
                <View key={step.id} {...elementProps(`landing-portfolio-step`, step.id)} style={styles.step}>
                  <Text {...elementProps(`landing-portfolio-step-number`, step.id)} style={styles.stepNumber}>{`${index + 1}`.padStart(2, `0`)}</Text>
                  <View {...elementProps(`landing-portfolio-step-copy`, step.id)} style={styles.stepCopy}>
                    <Text {...elementProps(`landing-portfolio-step-label`, step.id)} style={styles.stepLabel}>{step.label}</Text>
                    <Text {...elementProps(`landing-portfolio-step-description`, step.id)} style={styles.stepDescription}>{step.description}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
          <View {...elementProps(`landing-activity-panel`)} style={styles.activityPanel}>
            {renderCardShape(`landing-activity-panel`, palette.paper)}
            <View {...elementProps(`landing-activity-panel-label`)} style={styles.cardTop}>
              <View {...elementProps(`landing-activity-label`)} style={styles.activityLabel}>
                <Sparkles {...elementProps(`landing-activity-label-icon`)} size={13} color={palette.accent} accessible={false} />
                <Text {...elementProps(`landing-activity-label-text`)} style={styles.cardLabel}>{`Ideas In Motion`}</Text>
              </View>
              <Text {...elementProps(`landing-activity-decoration-note`)} style={styles.note}>{`A Little Momentum`}</Text>
            </View>
            <View
              accessible={false}
              pointerEvents={`none`}
              accessibilityElementsHidden
              importantForAccessibility={`no-hide-descendants`}
              {...elementProps(`landing-activity-grid`)}
              style={styles.activityGrid}
            >
              {activityRows.map((row, index) => (
                <View key={index} {...elementProps(`landing-activity-row`, `${index}`)} style={styles.activityRow}>
                  {row.map(cell => (
                    <Animated.View
                      key={cell.index}
                      accessible={false}
                      {...elementProps(`landing-activity-cell`, `${cell.index}`)}
                      style={[styles.activityCell, { backgroundColor: activityColors[cell.level], opacity: cell.level ? phases[cell.index % phases.length] : .4 }]}
                    />
                  ))}
                </View>
              ))}
            </View>
            <View {...elementProps(`landing-activity-legend`)} style={styles.activityLegend}>
              <Text {...elementProps(`landing-activity-legend-start`)} style={styles.note}>{`Every Name Starts Somewhere`}</Text>
              <View {...elementProps(`landing-activity-legend-cells`)} style={styles.legendCells}>
                {activityColors.map((color, index) => <View key={index} {...elementProps(`landing-activity-legend-cell`, `${index}`)} style={[styles.legendCell, { backgroundColor: color }]} />)}
              </View>
            </View>
          </View>
        </View>
      </View>

      <View {...elementProps(`landing-pricing`)} style={[styles.section, compact && styles.compactSection]}>
        <View {...elementProps(`landing-pricing-inner`)} style={styles.inner}>
          {renderHeading(`landing-pricing`, `ROOM TO GROW`, `Start free. Plan for more.`, `Get your portfolio organized today. Higher tiers are a preview of what we plan to unlock next.`)}
          <View {...elementProps(`landing-pricing-grid`)} style={styles.grid}>
            {landingPlans.map(plan => (
              <View key={plan.id} {...elementProps(`landing-pricing-plan`, plan.id)} style={[styles.plan, { width: cardWidth }]}>
                {renderCardShape(`landing-plan-${plan.id}`, plan.id === `pro` ? palette.subtle : palette.input, plan.id === `pro` ? palette.accent : palette.line)}
                <View {...elementProps(`landing-pricing-plan-heading`, plan.id)} style={styles.cardTop}>
                  <Text {...elementProps(`landing-pricing-plan-name`, plan.id)} style={styles.cardTitle} accessibilityRole={`header`}>{plan.name}</Text>
                  <Text {...elementProps(`landing-pricing-plan-status`, plan.id)} style={styles.planStatus}>{plan.id === `free` ? `Available Now` : `Plan Preview`}</Text>
                </View>
                <Text {...elementProps(`landing-pricing-plan-label`, plan.id)} style={styles.cardLabel}>{plan.label}</Text>
                <Text {...elementProps(`landing-pricing-plan-price`, plan.id)} style={[styles.price, plan.id !== `free` && styles.plannedPrice]}>{plan.price}</Text>
                <Text {...elementProps(`landing-pricing-plan-description`, plan.id)} style={styles.cardDescription}>{plan.description}</Text>
                <View {...elementProps(`landing-pricing-plan-features`, plan.id)} style={styles.features}>
                  {plan.features.map((feature, index) => (
                    <View key={feature} {...elementProps(`landing-pricing-feature`, `${plan.id}-${index}`)} style={styles.feature}>
                      <Check {...elementProps(`landing-pricing-feature-icon`, `${plan.id}-${index}`)} size={14} color={palette.accent} accessible={false} />
                      <Text {...elementProps(`landing-pricing-feature-text`, `${plan.id}-${index}`)} style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
                  {plan.plannedFeatures.map((feature, index) => (
                    <View key={feature} {...elementProps(`landing-pricing-planned-feature`, `${plan.id}-${index}`)} style={styles.feature}>
                      <LockKeyhole {...elementProps(`landing-pricing-planned-icon`, `${plan.id}-${index}`)} size={13} color={palette.muted} accessible={false} />
                      <Text {...elementProps(`landing-pricing-planned-text`, `${plan.id}-${index}`)} style={[styles.featureText, styles.plannedFeatureText]}>{`${feature} · Planned`}</Text>
                    </View>
                  ))}
                </View>
                {renderLink(`landing-pricing-plan-link-${plan.id}`, plan.id === `free` ? routes.domains.href : routes.contact.href, plan.action, plan.id !== `free`)}
              </View>
            ))}
          </View>
          <Text {...elementProps(`landing-pricing-note`)} style={styles.note}>{`Pro and Team are coming soon. Planned features and pricing may change. Domain registration and hosting are purchased separately.`}</Text>
        </View>
      </View>

      <View {...elementProps(`landing-final-cta`)} style={[styles.section, styles.alternateSection, compact && styles.compactSection]}>
        <View {...elementProps(`landing-final-cta-inner`)} style={[styles.inner, styles.finalCta]}>
          <Globe2 {...elementProps(`landing-final-cta-icon`)} size={25} color={palette.accent} accessible={false} />
          <Text {...elementProps(`landing-final-cta-eyebrow`)} style={styles.eyebrow}>{`YOUR NEXT CHAPTER STARTS WITH A NAME`}</Text>
          <Text {...elementProps(`landing-final-cta-title`)} style={[styles.title, styles.centeredText]} accessibilityRole={`header`}>{`Make room for your next idea`}</Text>
          <Text {...elementProps(`landing-final-cta-description`)} style={[styles.description, styles.centeredText]}>{`Keep the names you own organized, discover what could be next, and give every idea a direction.`}</Text>
          <View {...elementProps(`landing-final-cta-actions`)} style={styles.finalActions}>
            {renderLink(`landing-final-portfolio-link`, routes.domains.href, `Start Your Portfolio`)}
            {renderLink(`landing-final-blog-link`, routes.blog.href, `Explore The Blog`, true)}
          </View>
        </View>
      </View>
    </View>
  );
};

export default LandingSections;
