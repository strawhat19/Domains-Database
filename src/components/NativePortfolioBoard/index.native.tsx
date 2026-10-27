import { useMemo, useRef, useState, type ReactNode } from 'react';
import { createStyles } from './styles.native';
import TagPicker from '../TagPicker/index.native';
import CurrencyField from '../CurrencyField/index.native';
import PortfolioCollapse from '../PortfolioCollapse/index.native';
import NativePortfolioSheet from '../NativePortfolioSheet/index.native';
import DomainSiteIcon from '../DomainSiteIcon/index.native';
import DomainProjectSelect from '../DomainProjectSelect/index.native';
import { useNativePortfolioBoard, type BoardTarget, type QuickField } from './useNativePortfolioBoard';
import { getDomainSource } from '../../shared/domainUtils';
import { allowDomainsInCollections } from '../../shared/config';
import { useNativeStickyGroup, useNativeStickyColumn, type NativeStickyColumn } from './useNativeStickyHeaders';
import { useTheme } from '../../shared/themeContext/useTheme';
import { normalizeDomainProjectStatus } from '../../shared/domainProject';
import { getConvertedGroupName } from '../../shared/portfolioPreferences/names';
import type { DomainRecord } from '../../shared/types';
import type { PortfolioGroup, PortfolioSections, CustomPortfolioCollection } from '../../shared/portfolioPreferences/types';
import { NativePortfolioDrag, NativeDragSource, NativeDropZone, NativeDragScroll } from '../NativePortfolioDrag/index.native';
import { Animated, ActivityIndicator, Linking, Pressable, ScrollView, Switch, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Check, CheckSquare, ChevronDown, Eye, EyeOff, AppWindow, Folder, Layers, MoreHorizontal, Plus, Save, Settings, Star, Trash2, MoveRight, Pencil, ExternalLink } from 'lucide-react-native';

type Logic = ReturnType<typeof useNativePortfolioBoard>;
type Styles = ReturnType<typeof createStyles>;
interface Props {
  domains: DomainRecord[];
  selectedIds: string[];
  showMainGroups?: boolean;
  sections?: PortfolioSections;
  onSelect: (id: string) => void;
  onEdit: (domain: DomainRecord) => void;
  renderMain: (openActions: (domain: DomainRecord) => void) => ReactNode;
}
const listFields = [
  [`childLinks`, `Child Links`],
  [`previewLinks`, `Preview Links`],
  [`relatedLinks`, `Related Links`],
  [`developmentLinks`, `Development Links`],
  [`socialMediaLinks`, `Social Media Links`],
] as const;
const linkFields = [
  [`parentLink`, `Parent Link`],
  [`productionLink`, `Production Link`],
  [`githubRepoLink`, `GitHub Repository Link`],
] as const;

const BoardDomain = ({ domain, groupId, collectionId, logic, styles, selected, disabled = false }: { domain: DomainRecord; groupId?: string; collectionId: string; logic: Logic; styles: Styles; selected: boolean; disabled?: boolean }) => {
  const { palette } = useTheme();
  const target: BoardTarget = { kind: `domain`, id: domain.id };
  return (
    <NativeDropZone
      disabled={disabled || !allowDomainsInCollections && !groupId}
      accepts={[`domain`]}
      id={`domain-${domain.id}`}
      target={{ groupId, collectionId, targetId: domain.id }}
    >
      <View
        style={[styles.domain, selected && styles.domainSelected]}
        nativeID={`native-board-domain-${domain.id}`}
        accessibilityState={{ selected }}
      >
        <NativeDragSource
          disabled={disabled}
          style={styles.domainSource}
          item={{ ...target, label: domain.name }}
          onHold={() => logic.openMenu(target, true)}
          onTap={() => logic.openEdit({ ...target, field: getDomainSource(domain) === `registrar` ? `description` : `name` })}
        >
          <DomainSiteIcon compact size={16} domain={domain.name} id={`native-board-domain-icon-${domain.id}`} />
          <Text nativeID={`native-board-domain-name-${domain.id}`} style={styles.domainName} numberOfLines={1}>
            {domain.name}
          </Text>
        </NativeDragSource>
        <Pressable
          style={styles.iconButton}
          accessibilityRole={`button`}
          disabled={disabled}
          onPress={() => logic.openMenu(target)}
          nativeID={`native-board-domain-menu-${domain.id}`}
          accessibilityLabel={`${domain.name} Actions`}
        >
          <MoreHorizontal size={17} color={palette.muted} />
        </Pressable>
      </View>
    </NativeDropZone>
  );
};

const BoardGroup = ({ group, collectionId, logic, styles, selectedIds, stickyColumn }: { group: PortfolioGroup; collectionId: string; logic: Logic; styles: Styles; selectedIds: string[]; stickyColumn: NativeStickyColumn }) => {
  const { palette } = useTheme();
  const collapsed = logic.preferences.collapsedGroupKeys.includes(group.key);
  const [collapse, setCollapse] = useState({ closed: collapsed, interactive: !collapsed });
  const sticky = useNativeStickyGroup(stickyColumn, !collapsed || !collapse.closed, group);
  if (!group.customGroupId) return null;
  const target: BoardTarget = { kind: `group`, id: group.customGroupId };
  const GroupIcon = group.isApp ? AppWindow : Folder;
  return (
    <NativeDropZone id={`group-${target.id}`} accepts={[`group`]} target={{ targetId: target.id, collectionId }}>
      <NativeDropZone id={`group-domains-${target.id}`} accepts={[`domain`]} target={{ groupId: target.id, collectionId }}>
        <View ref={sticky.ref} collapsable={false} onLayout={sticky.onLayout} nativeID={`native-board-group-${target.id}`} style={styles.card}>
          <Animated.View onLayout={sticky.onHeadingLayout} nativeID={`native-board-group-heading-${target.id}`} style={[styles.cardHeading, { transform: [{ translateY: sticky.translation }] }]}>
            <NativeDragSource
              style={styles.source}
              item={{ ...target, label: group.label }}
              onHold={() => logic.openMenu(target, true)}
              onTap={() => logic.openEdit({ ...target, field: `name` })}
            >
              <GroupIcon size={15} color={palette.accent} />
              <Text nativeID={`native-board-group-name-${target.id}`} style={styles.cardTitle} numberOfLines={1}>
                {group.label}
              </Text>
            </NativeDragSource>
            <Pressable
              style={styles.iconButton}
              accessibilityRole={`button`}
              accessibilityState={{ expanded: !collapsed }}
              nativeID={`native-board-group-collapse-${target.id}`}
              onPress={() => logic.preferences.toggleGroupCollapsed(group.key)}
              accessibilityLabel={`${group.domains.length} Domain(s), ${collapsed ? `Expand` : `Collapse`} ${group.label}`}
            >
              <Text nativeID={`native-board-group-count-${target.id}`} style={styles.count}>{group.domains.length}</Text>
            </Pressable>
            <Pressable
              style={styles.iconButton}
              accessibilityRole={`button`}
              onPress={() => logic.openMenu(target)}
              nativeID={`native-board-group-menu-${target.id}`}
              accessibilityLabel={`${group.label} Actions`}
            >
              <MoreHorizontal size={17} color={palette.muted} />
            </Pressable>
          </Animated.View>
          <PortfolioCollapse id={`native-board-group-body-${target.id}`} collapsed={collapsed} onStateChange={setCollapse}>
            {!!group.description && (
              <Pressable
                style={styles.descriptionTrigger}
                accessibilityRole={`button`}
                nativeID={`native-board-group-description-${target.id}`}
                onPress={() => logic.openEdit({ ...target, field: `description` })}
                accessibilityLabel={`Edit ${group.label} Description`}
              >
                <Text nativeID={`native-board-group-description-text-${target.id}`} numberOfLines={2} style={styles.cardDescription}>
                  {group.description}
                </Text>
              </Pressable>
            )}
            <View nativeID={`native-board-group-domains-${target.id}`} style={styles.domainList}>
              {group.domains.map(domain => (
                <BoardDomain
                  key={domain.id}
                  logic={logic}
                  styles={styles}
                  domain={domain}
                  disabled={collapsed || !collapse.interactive}
                  groupId={target.id}
                  collectionId={collectionId}
                  selected={selectedIds.includes(domain.id)}
                />
              ))}
            </View>
          </PortfolioCollapse>
        </View>
      </NativeDropZone>
    </NativeDropZone>
  );
};

const BoardColumn = ({ collection, groups, directDomains, logic, styles, width, height, selectedIds }: { collection: CustomPortfolioCollection; groups: PortfolioGroup[]; directDomains: DomainRecord[]; logic: Logic; styles: Styles; width: number; height: number; selectedIds: string[] }) => {
  const { palette } = useTheme();
  const id = collection.id;
  const collapsed = logic.preferences.collapsedCollectionIds.includes(id);
  const layoutKey = JSON.stringify([id, collapsed, groups.map(group => [group.key, group.domains.map(domain => domain.id)]), directDomains.map(domain => domain.id)]);
  const sticky = useNativeStickyColumn(layoutKey, width, height);
  return (
    <NativeDropZone id={`collection-${id}`} accepts={[`collection`]} target={{ targetId: id }} horizontal>
      <View ref={sticky.ref} collapsable={false} onLayout={sticky.refresh} nativeID={`native-board-column-${id}`} style={[styles.lane, { width, height }]}>
        <Animated.View onLayout={sticky.onHeadingLayout} nativeID={`native-board-column-heading-${id}`} style={[styles.laneHeading, { transform: [{ translateY: sticky.translation }] }]}>
          <NativeDragSource
            style={styles.source}
            item={{ kind: `collection`, id, label: collection.name }}
            onHold={() => logic.openMenu({ kind: `collection`, id }, true)}
            onTap={() => logic.openEdit({ kind: `collection`, id, field: `name` })}
          >
            <Text nativeID={`native-board-column-title-${id}`} style={styles.laneTitle} numberOfLines={1}>
              {collection.name}
            </Text>
            <Text nativeID={`native-board-column-count-${id}`} style={styles.count}>{groups.length + directDomains.length}</Text>
          </NativeDragSource>
          <Pressable
            style={styles.iconButton}
            accessibilityRole={`button`}
            nativeID={`native-board-column-menu-${id}`}
            onPress={() => logic.openMenu({ kind: `collection`, id })}
            accessibilityLabel={`${collection.name} Actions`}
          >
            <MoreHorizontal size={17} color={palette.muted} />
          </Pressable>
        </Animated.View>
        <NativeDragScroll
          style={styles.laneScroll}
          onLayout={sticky.refresh}
          removeClippedSubviews={false}
          onScrollPosition={sticky.onScrollPosition}
          onContentSizeChange={() => sticky.refresh()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.laneBody}
          nativeID={`native-board-column-scroll-${id}`}
        >
          <NativeDropZone
            style={styles.laneDropBody}
            accepts={allowDomainsInCollections ? [`group`, `domain`] : [`group`]}
            id={`column-append-${id}`}
            target={{ collectionId: id }}
          >
            {!collapsed && groups.map(group => (
              <BoardGroup key={group.key} group={group} collectionId={id} logic={logic} styles={styles} selectedIds={selectedIds} stickyColumn={sticky} />
            ))}
            {allowDomainsInCollections && !collapsed && directDomains.map(domain => (
              <BoardDomain key={domain.id} domain={domain} collectionId={id} logic={logic} styles={styles} selected={selectedIds.includes(domain.id)} />
            ))}
          </NativeDropZone>
        </NativeDragScroll>
        <View nativeID={`native-board-column-footer-${id}`} style={styles.laneFooter}>
          <Pressable
            style={styles.createButton}
            accessibilityRole={`button`}
            nativeID={`native-board-column-add-group-${id}`}
            onPress={() => logic.openEdit({ kind: `group`, collectionId: id })}
            accessibilityLabel={`Create A Group In ${collection.name}`}
          >
            <Plus size={15} color={palette.muted} />
            <Text nativeID={`native-board-column-create-label-${id}`} style={styles.createText}>{`Create Group`}</Text>
          </Pressable>
        </View>
      </View>
    </NativeDropZone>
  );
};

const BoardEditor = ({ logic, styles }: { logic: Logic; styles: Styles }) => {
  const { palette } = useTheme();
  const edit = logic.edit;
  const draft = logic.draft;
  const field = edit?.field;
  const full = !field;
  const id = `${edit?.kind ?? `item`}-${edit?.id ?? `new`}`;
  const title = edit?.convertToCollection ? `Convert To Collection` : field ? `Edit ${field === `projectStatus` ? `Status` : field === `mvp` ? `MVP` : field[0].toUpperCase() + field.slice(1)}` : edit?.id ? `${draft.name} Settings` : `Create ${edit?.kind === `collection` ? `Collection` : `Group / App`}`;
  const textField = (key: `name` | `description` | `mvp` | `future`, label: string, multiline = false) => <View nativeID={`native-board-editor-field-${id}-${key}`} style={styles.field}>
    <Text style={styles.fieldLabel}>{label}</Text><TextInput nativeID={`native-board-editor-input-${id}-${key}`} value={draft[key]} accessibilityLabel={label} editable={!logic.saving} autoFocus={Boolean(field)} multiline={multiline} maxLength={key === `name` ? edit?.kind === `domain` ? 253 : 80 : key === `description` ? 280 : 10000} placeholderTextColor={palette.placeholder} style={[styles.fieldInput, multiline && styles.multiline]} onChangeText={value => logic.change(key, value)} />
  </View>;
  return <NativePortfolioSheet id={`native-board-editor`} title={title} visible={Boolean(edit)} disabled={logic.saving} onClose={logic.closeEdit}>
    <ScrollView nativeID={`native-board-editor-scroll-${id}`} keyboardShouldPersistTaps={`handled`} contentContainerStyle={styles.form}>
      {(full || field === `name`) && textField(`name`, edit?.convertToCollection ? `Collection Name` : `Name`)}
      {(full || field === `description`) && textField(`description`, edit?.convertToCollection ? `Collection Description` : `Description`, true)}
      {edit?.convertToCollection && <Text nativeID={`native-board-editor-conversion-preview-${id}`} style={styles.hint}>{`Creates The Collection “${draft.name}” And Keeps All Domains In The Inner ${draft.isApp ? `App` : `Group`} “${getConvertedGroupName(logic.preferences, draft.name, edit.id)}”. Confirm With Convert To Collection Below`}</Text>}
      {field === `mvp` && textField(`mvp`, `MVP`, true)}
      {field === `future` && textField(`future`, `Future Plans`, true)}
      {(full || field === `projectStatus`) && <View style={styles.field}><Text style={styles.fieldLabel}>{`Project Status`}</Text><DomainProjectSelect id={`native-board-editor-status-${id}`} field={`projectStatus`} label={`Project Status`} value={draft.projectStatus} disabled={logic.saving} onChange={value => logic.change(`projectStatus`, normalizeDomainProjectStatus(value))} /></View>}
      {full && edit?.kind === `collection` && <View nativeID={`native-board-editor-visibility-${id}`} style={styles.field}><Text style={styles.fieldLabel}>{`Visibility`}</Text><View style={styles.choices}>{([`private`, `public`] as const).map(value => <Pressable key={value} nativeID={`native-board-editor-visibility-${id}-${value}`} style={[styles.button, draft.visibility === value && styles.chosen]} accessibilityRole={`radio`} accessibilityLabel={`${value} Collection`} accessibilityState={{ checked: draft.visibility === value }} disabled={logic.saving} onPress={() => logic.change(`visibility`, value)}><Text style={styles.buttonText}>{value === `public` ? `Public` : `Private`}</Text></Pressable>)}</View></View>}
      {full && edit?.kind === `group` && <>
        <View nativeID={`native-board-editor-app-${id}`} style={styles.toggle}><View style={styles.toggleCopy}><Text style={styles.fieldLabel}>{`App`}</Text><Text style={styles.hint}>{`Keep App Details On This Card`}</Text></View><Switch nativeID={`native-board-editor-app-toggle-${id}`} accessibilityLabel={`App`} value={draft.isApp === true} disabled={logic.saving} trackColor={{ true: palette.accent }} onValueChange={value => logic.change(`isApp`, value)} /></View>
        {!edit.convertToCollection && <View nativeID={`native-board-editor-collection-${id}`} style={styles.field}><Text style={styles.fieldLabel}>{`Collection`}</Text><View style={styles.choices}><Pressable nativeID={`native-board-editor-collection-${id}-none`} style={[styles.button, !draft.collectionId && styles.chosen]} accessibilityRole={`radio`} accessibilityLabel={`No Collection`} accessibilityState={{ checked: !draft.collectionId }} disabled={logic.saving} onPress={() => logic.change(`collectionId`, null)}><Text style={styles.buttonText}>{`No Collection`}</Text></Pressable>{logic.preferences.collections.map(collection => <Pressable key={collection.id} nativeID={`native-board-editor-collection-${id}-${collection.id}`} style={[styles.button, draft.collectionId === collection.id && styles.chosen]} accessibilityRole={`radio`} accessibilityLabel={collection.name} accessibilityState={{ checked: draft.collectionId === collection.id }} disabled={logic.saving} onPress={() => logic.change(`collectionId`, collection.id)}><Text style={styles.buttonText}>{collection.name}</Text></Pressable>)}</View></View>}
        <View style={styles.field}><Text style={styles.fieldLabel}>{`Tags`}</Text><TagPicker id={`native-board-editor-tags-${id}`} label={`Tags`} value={draft.tags ?? []} disabled={logic.saving} onChange={value => logic.change(`tags`, value)} /></View>
        <View style={styles.field}><Text style={styles.fieldLabel}>{`Site Icon URL`}</Text><TextInput nativeID={`native-board-editor-icon-${id}`} accessibilityLabel={`Site Icon URL`} style={styles.fieldInput} value={draft.siteIconUrl ?? ``} editable={!logic.saving} autoCorrect={false} autoCapitalize={`none`} keyboardType={`url`} onChangeText={value => logic.change(`siteIconUrl`, value)} /></View>
        {([`startingBid`, `estimatedRevenue`] as const).map(key => <View key={key} style={styles.field}><Text style={styles.fieldLabel}>{key === `startingBid` ? `Starting Bid` : `Estimated Revenue`}</Text><CurrencyField id={`native-board-editor-${key}-${id}`} label={key === `startingBid` ? `Starting Bid` : `Estimated Revenue`} value={draft[key]} disabled={logic.saving} onChange={value => logic.change(key, value)} /></View>)}
        {linkFields.map(([key, label]) => <View key={key} style={styles.field}><Text style={styles.fieldLabel}>{label}</Text><TextInput nativeID={`native-board-editor-link-${id}-${key}`} accessibilityLabel={label} value={draft[key] ?? ``} style={styles.fieldInput} editable={!logic.saving} autoCorrect={false} autoCapitalize={`none`} keyboardType={`url`} onChangeText={value => logic.change(key, value)} /></View>)}
        {listFields.map(([key, label]) => <View key={key} style={styles.field}><Text style={styles.fieldLabel}>{label}</Text><TextInput nativeID={`native-board-editor-links-${id}-${key}`} accessibilityLabel={`${label}, One Per Line`} value={(draft[key] ?? []).join(`\n`)} style={[styles.fieldInput, styles.multiline]} editable={!logic.saving} multiline autoCorrect={false} autoCapitalize={`none`} onChangeText={value => logic.change(key, value.split(`\n`))} /><Text style={styles.hint}>{`One Link Per Line`}</Text></View>)}
      </>}
      {!!logic.error && <View nativeID={`native-board-editor-error-${id}`} style={styles.error} accessibilityRole={`alert`}><Text style={styles.errorText}>{logic.error}</Text></View>}
    </ScrollView>
    <View nativeID={`native-board-editor-actions-${id}`} style={styles.footer}><Pressable nativeID={`native-board-editor-cancel-${id}`} style={[styles.button, styles.footerButton]} disabled={logic.saving} accessibilityRole={`button`} accessibilityLabel={`Cancel Edit`} onPress={logic.closeEdit}><Text style={styles.buttonText}>{`Cancel`}</Text></Pressable><Pressable nativeID={`native-board-editor-save-${id}`} style={[styles.button, styles.primary, styles.footerButton, logic.saving && styles.disabled]} disabled={logic.saving} accessibilityRole={`button`} accessibilityLabel={edit?.convertToCollection ? `Convert To Collection` : `Save Changes`} onPress={() => void logic.save()}>{logic.saving ? <ActivityIndicator color={palette.contrast} /> : <Save size={16} color={palette.contrast} />}<Text style={[styles.buttonText, styles.primaryText]}>{logic.saving ? `Saving…` : edit?.convertToCollection ? `Convert To Collection` : `Save`}</Text></Pressable></View>
  </NativePortfolioSheet>;
};

const BoardActions = ({ logic, styles, onSelect }: { logic: Logic; styles: Styles; onSelect: Props[`onSelect`] }) => {
  const { palette } = useTheme();
  const menu = logic.menu;
  const group = menu?.kind === `group` ? logic.preferences.customGroups.find(group => group.id === menu.id) : undefined;
  const collection = menu?.kind === `collection` ? logic.preferences.collections.find(collection => collection.id === menu.id) : undefined;
  const domain = menu?.kind === `domain` ? logic.context.domains.find(domain => domain.id === menu.id) : undefined;
  const menuId = `${menu?.kind ?? `item`}-${menu?.id ?? `none`}`;
  const action = (id: string, label: string, Icon: typeof Settings, onPress: () => void, destructive = false, disabled = false) => <Pressable key={id} nativeID={`native-board-action-${menuId}-${id}`} style={[styles.action, disabled && styles.disabled]} accessibilityRole={`button`} accessibilityLabel={label} disabled={disabled} onPress={onPress}><Icon size={19} color={destructive ? palette.danger : palette.accent} /><Text style={[styles.actionText, destructive && styles.destructive]}>{label}</Text></Pressable>;
  const quick = (field: QuickField) => { if (menu) logic.handoff(() => logic.openEdit({ ...menu, field })); };
  const collectionIndex = collection ? logic.preferences.collections.findIndex(value => value.id === collection.id) : -1;
  const siblingGroups = logic.preferences.customGroups.filter(value => (value.collectionId ?? null) === (group?.collectionId ?? null));
  const groupIndex = group ? siblingGroups.findIndex(value => value.id === group.id) : -1;
  const domainGroup = domain ? logic.fullGroups.find(group => group.domains.some(item => item.id === domain.id)) : undefined;
  const domainReorderable = Boolean(domainGroup?.customGroupId || domainGroup?.directCollectionId);
  const domainIndex = domainGroup?.domains.findIndex(item => item.id === domain?.id) ?? -1;
  const domainDestination = { groupId: domainGroup?.customGroupId, collectionId: domainGroup?.directCollectionId ?? logic.preferences.customGroups.find(group => group.id === domainGroup?.customGroupId)?.collectionId ?? null };
  const movingDomainIds = new Set(domain && logic.selectedIds.includes(domain.id) ? logic.selectedIds : domain ? [domain.id] : []);
  const previousDomain = domainGroup?.domains.slice(0, domainIndex).reverse().find(domain => !movingDomainIds.has(domain.id));
  const nextDomain = domainGroup?.domains.slice(domainIndex + 1).find(domain => !movingDomainIds.has(domain.id));
  const hidden = domain ? logic.preferences.hiddenDomainIds.includes(domain.id)
    : group ? logic.preferences.hiddenGroupKeys.includes(`custom:${group.id}`)
      : collection ? logic.preferences.hiddenCollectionIds.includes(collection.id) : false;
  return <NativePortfolioSheet id={`native-board-actions`} title={logic.moving ? `Move ${logic.menuName}` : logic.menuName} visible={Boolean(menu)} onClose={logic.closeMenu} onHidden={logic.afterMenu}>
    <ScrollView nativeID={`native-board-actions-scroll-${menuId}`} contentContainerStyle={styles.actions} keyboardShouldPersistTaps={`handled`}>
      {logic.moving ? <>
        {action(`move-main`, menu?.kind === `group` ? `Groups & Apps / No Collection` : `Ungrouped / No Collection`, Layers, () => logic.moveMenuItem({ collectionId: null }))}
        {(menu?.kind === `group` || allowDomainsInCollections) && logic.preferences.collections.map(value => action(`move-collection-${value.id}`, value.name, Layers, () => logic.moveMenuItem({ collectionId: value.id })))}
        {menu?.kind === `domain` && logic.preferences.customGroups.map(value => action(`move-group-${value.id}`, `${value.isApp ? `App` : `Group`}: ${value.name}`, MoveRight, () => logic.moveMenuItem({ groupId: value.id, collectionId: value.collectionId ?? null })))}
      </> : <>
        {action(`settings`, `Settings`, Settings, () => domain ? logic.openDomainSettings() : menu && logic.handoff(() => logic.openEdit(menu)))}
        {(!domain || getDomainSource(domain) !== `registrar`) && action(`name`, `Edit Name`, Pencil, () => quick(`name`))}
        {action(`description`, `Edit Description`, Pencil, () => quick(`description`))}
        {action(`status`, `Change Status`, Check, () => quick(`projectStatus`))}
        {domain && action(`select`, logic.selectedIds.includes(domain.id) ? `Unselect Domain` : `Select Domain`, CheckSquare, () => { onSelect(domain.id); logic.closeMenu(); })}
        {domain && action(`star`, domain.starred ? `Remove Star` : `Star Domain`, Star, () => { void logic.context.toggleDomainStar(domain.id).catch(() => undefined); logic.closeMenu(); })}
        {domain && action(`mvp`, `Edit MVP`, Pencil, () => quick(`mvp`))}
        {domain && action(`future`, `Edit Future Plans`, Pencil, () => quick(`future`))}
        {domain && action(`open`, `Open Website`, ExternalLink, () => { logic.closeMenu(); void Linking.openURL(`https://${domain.name}`).catch(() => undefined); })}
        {(domain || group) && action(`move`, `Move To…`, MoveRight, () => logic.setMoving(true))}
        {domain && domainReorderable && action(`up`, `Move Up`, ArrowUp, () => logic.moveMenuItem({ ...domainDestination, targetId: previousDomain?.id, placement: `before` }), false, !previousDomain)}
        {domain && domainReorderable && action(`down`, `Move Down`, ArrowDown, () => logic.moveMenuItem({ ...domainDestination, targetId: nextDomain?.id, placement: `after` }), false, !nextDomain)}
        {collection && action(`left`, `Move Left`, ArrowLeft, () => logic.moveMenuItem({ targetId: logic.preferences.collections[collectionIndex - 1]?.id, placement: `before` }), false, collectionIndex <= 0)}
        {collection && action(`right`, `Move Right`, ArrowRight, () => logic.moveMenuItem({ targetId: logic.preferences.collections[collectionIndex + 1]?.id, placement: `after` }), false, collectionIndex >= logic.preferences.collections.length - 1)}
        {group && action(`up`, `Move Up`, ArrowUp, () => logic.moveMenuItem({ targetId: siblingGroups[groupIndex - 1]?.id, placement: `before` }), false, groupIndex <= 0)}
        {group && action(`down`, `Move Down`, ArrowDown, () => logic.moveMenuItem({ targetId: siblingGroups[groupIndex + 1]?.id, placement: `after` }), false, groupIndex >= siblingGroups.length - 1)}
        {group && action(`star`, group.starred ? `Remove Star` : `Star Group / App`, Star, () => { logic.preferences.toggleGroupStar(group.id); logic.closeMenu(); })}
        {group && action(`convert-app`, group.isApp ? `Convert To Group` : `Convert To App`, Layers, logic.toggleApp)}
        {group && action(`convert-collection`, `Convert To Collection`, Layers, () => logic.handoff(() => logic.openEdit({ kind: `group`, id: group.id, convertToCollection: true })))}
        {group && logic.preferences.collections.some(collection => collection.id === group.collectionId) && action(`collapse`, logic.preferences.collapsedGroupKeys.includes(`custom:${group.id}`) ? `Expand Domains` : `Collapse Domains`, ChevronDown, () => { logic.preferences.toggleGroupCollapsed(`custom:${group.id}`); logic.closeMenu(); })}
        {collection && action(`collapse`, logic.preferences.collapsedCollectionIds.includes(collection.id) ? `Expand Collection` : `Collapse Collection`, ChevronDown, () => { logic.preferences.toggleCollectionCollapsed(collection.id); logic.closeMenu(); })}
        {action(`visibility`, hidden ? `Show On Board` : `Hide From Board`, hidden ? Eye : EyeOff, () => { if (domain) logic.preferences.toggleDomainVisibility(domain.id); else if (group) logic.preferences.toggleGroupVisibility(`custom:${group.id}`); else if (collection) logic.preferences.toggleCollectionVisibility(collection.id); logic.closeMenu(); })}
        {group && !group.isApp && action(`delete`, `Delete Group`, Trash2, logic.removeGroup, true)}
        {domain && action(`delete`, `Delete / Registrar Settings`, Settings, logic.openDomainSettings)}
      </>}
    </ScrollView>
  </NativePortfolioSheet>;
};

const NativePortfolioBoard = ({ domains, selectedIds, onSelect, onEdit, renderMain, sections, showMainGroups = false }: Props) => {
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const { width, height } = useWindowDimensions();
  const [portfolioMenu, setPortfolioMenu] = useState(false);
  const pendingAction = useRef<(() => void) | null>(null);
  const logic = useNativePortfolioBoard(domains, onEdit, selectedIds, sections);
  const columnWidth = Math.max(240, Math.min(340, width - 62));
  const columnHeight = Math.max(300, Math.min(620, height * .64));
  const looseGroups = logic.preferences.customGroups.filter(group => !group.collectionId || !logic.preferences.collections.some(collection => collection.id === group.collectionId));
  const showHidden = logic.preferences.showHiddenDomains && logic.preferences.showHiddenGroups && logic.preferences.showHiddenCollections;
  const choosePortfolioAction = (action: () => void) => { pendingAction.current = action; setPortfolioMenu(false); };
  const afterPortfolioMenu = () => { const action = pendingAction.current; pendingAction.current = null; action?.(); };
  return (
    <NativePortfolioDrag onDrop={logic.drop}>
      <View nativeID={`native-portfolio-content`} style={styles.content}>
        {renderMain(domain => logic.openMenu({ kind: `domain`, id: domain.id }, true))}
        {showMainGroups && logic.sections.mainGroups.filter(group => group.customGroupId).map(group => {
          const GroupIcon = group.isApp ? AppWindow : Folder;
          return (
            <View key={group.key} nativeID={`native-board-main-group-${group.customGroupId}`} style={styles.card}>
              <Pressable
                style={styles.source}
                accessibilityRole={`button`}
                nativeID={`native-board-main-group-actions-${group.customGroupId}`}
                accessibilityLabel={`${group.label} ${group.isApp ? `App` : `Group`} Actions`}
                onPress={() => logic.openMenu({ kind: `group`, id: group.customGroupId! })}
              >
                <GroupIcon size={15} color={palette.accent} accessible={false} />
                <Text nativeID={`native-board-main-group-name-${group.customGroupId}`} style={styles.cardTitle}>{group.label}</Text>
                <Text nativeID={`native-board-main-group-count-${group.customGroupId}`} style={styles.count}>{group.domains.length}</Text>
                <MoreHorizontal size={17} color={palette.muted} accessible={false} />
              </Pressable>
            </View>
          );
        })}
        <View nativeID={`native-portfolio-board`} style={styles.board}>
          <View nativeID={`native-portfolio-board-heading`} style={styles.heading}>
            <Text nativeID={`native-portfolio-board-title`} style={styles.headingTitle}>{`Collections`}</Text>
            <Text nativeID={`native-portfolio-board-count`} style={styles.count}>{logic.sections.collections.length}</Text>
            <Pressable
              style={styles.iconButton}
              accessibilityRole={`button`}
              accessibilityLabel={`Create Collection`}
              nativeID={`native-portfolio-board-add-collection`}
              onPress={() => logic.openEdit({ kind: `collection` })}
            >
              <Plus size={17} color={palette.muted} />
            </Pressable>
            <Pressable
              style={styles.iconButton}
              accessibilityRole={`button`}
              accessibilityLabel={`Portfolio Actions`}
              onPress={() => setPortfolioMenu(true)}
              nativeID={`native-portfolio-board-menu`}
            >
              <MoreHorizontal size={18} color={palette.muted} />
            </Pressable>
          </View>
          {!!logic.error && !logic.edit && (
            <View nativeID={`native-board-move-error`} style={styles.error} accessibilityRole={`alert`}>
              <Text style={styles.errorText}>{logic.error}</Text>
            </View>
          )}
          {logic.sections.collections.length > 0 && (
            <NativeDragScroll
              horizontal
              removeClippedSubviews={false}
              decelerationRate={`fast`}
              snapToInterval={columnWidth + 12}
              style={{ height: columnHeight + 8 }}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.lanes}
              nativeID={`native-board-column-scroll`}
            >
              {logic.sections.collections.map(section => (
                <BoardColumn
                  key={section.collection.id}
                  logic={logic}
                  styles={styles}
                  width={columnWidth}
                  height={columnHeight}
                  selectedIds={selectedIds}
                  collection={section.collection}
                  groups={section.groups.filter(group => Boolean(group.customGroupId))}
                  directDomains={section.groups.filter(group => Boolean(group.directCollectionId)).flatMap(group => group.domains)}
                />
              ))}
            </NativeDragScroll>
          )}
        </View>
      </View>
      <BoardActions logic={logic} styles={styles} onSelect={onSelect} />
      <BoardEditor logic={logic} styles={styles} />
      <NativePortfolioSheet
        title={`Portfolio Actions`}
        visible={portfolioMenu}
        id={`native-portfolio-actions`}
        onHidden={afterPortfolioMenu}
        onClose={() => setPortfolioMenu(false)}
      >
        <ScrollView nativeID={`native-portfolio-actions-scroll`} contentContainerStyle={styles.actions}>
          <Pressable nativeID={`native-portfolio-actions-add-collection`} style={styles.action} accessibilityRole={`button`} accessibilityLabel={`Create Collection`} onPress={() => choosePortfolioAction(() => logic.openEdit({ kind: `collection` }))}>
            <Plus size={18} color={palette.accent} /><Text style={styles.actionText}>{`Create Collection`}</Text>
          </Pressable>
          <Pressable nativeID={`native-portfolio-actions-add-group`} style={styles.action} accessibilityRole={`button`} accessibilityLabel={`Create Group Or App`} onPress={() => choosePortfolioAction(() => logic.openEdit({ kind: `group` }))}>
            <Plus size={18} color={palette.accent} /><Text style={styles.actionText}>{`Create Group / App`}</Text>
          </Pressable>
          <Pressable nativeID={`native-portfolio-actions-hidden`} style={styles.action} accessibilityRole={`button`} accessibilityLabel={showHidden ? `Hide Hidden Items` : `Show Hidden Items`} onPress={() => { logic.preferences.setShowHiddenDomains(!showHidden); logic.preferences.setShowHiddenGroups(!showHidden); logic.preferences.setShowHiddenCollections(!showHidden); setPortfolioMenu(false); }}>
            <Eye size={18} color={palette.accent} /><Text style={styles.actionText}>{showHidden ? `Hide Hidden Items` : `Show Hidden Items`}</Text>
          </Pressable>
          {looseGroups.map(group => (
            <Pressable key={group.id} nativeID={`native-portfolio-actions-group-${group.id}`} style={styles.action} accessibilityRole={`button`} accessibilityLabel={`${group.name} Actions`} onPress={() => choosePortfolioAction(() => logic.openMenu({ kind: `group`, id: group.id }))}>
              <Layers size={18} color={palette.accent} /><Text style={styles.actionText}>{group.name}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </NativePortfolioSheet>
    </NativePortfolioDrag>
  );
};

export default NativePortfolioBoard;
