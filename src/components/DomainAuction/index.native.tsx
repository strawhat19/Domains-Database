import { useMemo, useState } from 'react';
import { Link } from 'expo-router';
import Toast from '../Toast';
import AuctionRow from '../AuctionRow';
import { File } from 'expo-file-system';
import { createStyles } from './styles.native';
import { useDomainAuction } from './useDomainAuction';
import { routes } from '../../shared/routes';
import * as DocumentPicker from 'expo-document-picker';
import { elementProps } from '../../shared/elementProps';
import { useTheme } from '../../shared/themeContext/useTheme';
import type { AuctionFilters } from '../../shared/domainAuction/types';
import { Gavel, Eye, X, Search, Upload, Trash2, Download, PlugZap, RotateCcw, RefreshCw, ChevronLeft, ChevronRight, ArrowUpRight, SlidersHorizontal } from 'lucide-react-native';
import { auctionSources, auctionSortOptions, auctionMatchOptions, auctionTextFields, auctionNumericFields } from '../../shared/domainAuction/values';
import { auctionSelectFields, auctionInventoryHref, auctionInventoryGuideHref } from './fields';
import { Text, View, Switch, Pressable, TextInput, ActivityIndicator, useWindowDimensions } from 'react-native';

const DomainAuction = () => {
  const state = useDomainAuction();
  const { palette } = useTheme();
  const { width } = useWindowDimensions();
  const [readingFile, setReadingFile] = useState(false);
  const styles = useMemo(() => createStyles(palette), [palette]);
  const disabled = state.loading || state.busy || readingFile;
  const choices = (key: string, label: string, options: readonly { id: string; label: string }[], value: string, onChange: (value: string) => void) => (
    <View key={key} {...elementProps(`auction-filter-choice-field`, key)} style={styles.field}>
      <Text {...elementProps(`auction-filter-choice-label`, key)} style={styles.label}>{label}</Text>
      <View {...elementProps(`auction-filter-choices`, key)} style={styles.choices} accessibilityRole={`radiogroup`} accessibilityLabel={label}>
        {options.map(option => {
          const selected = option.id === value;
          return (
            <Pressable
              key={option.id}
              accessibilityRole={`radio`}
              accessibilityLabel={option.label}
              accessibilityState={{ checked: selected }}
              onPress={() => onChange(option.id)}
              {...elementProps(`auction-filter-choice`, `${key}-${option.id}`)}
              style={[styles.choice, selected && styles.selectedChoice]}
            >
              <Text {...elementProps(`auction-filter-choice-text`, `${key}-${option.id}`)} style={[styles.choiceText, selected && styles.selectedChoiceText]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
  const importFile = async () => {
    if (disabled) return;
    setReadingFile(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({ multiple: false, copyToCacheDirectory: true, type: [`application/json`, `text/*`] });
      const document = result.assets?.[0];
      if (result.canceled || !document) return;
      if (!/\.json$/i.test(document.name)) throw new Error(`Choose An Unzipped .json Inventory File`);
      if ((document.size ?? 0) > 8 * 1024 * 1024) throw new Error(`Choose A JSON File Up To 8 MB`);
      await state.importInventory(await new File(document.uri).text());
    } catch (reason) {
      state.reportError(reason instanceof Error ? reason.message : `Inventory File Could Not Be Read`);
    } finally { setReadingFile(false); }
  };

  return (
    <View {...elementProps(`domain-auction-page`)} style={[styles.page, width < 600 && styles.compactPage]}>
      <View {...elementProps(`auction-heading`)} style={styles.heading}>
        <View {...elementProps(`auction-eyebrow`)} style={styles.eyebrow}>
          <Gavel {...elementProps(`auction-eyebrow-icon`)} size={14} color={palette.accent} />
          <Text {...elementProps(`auction-eyebrow-text`)} style={styles.eyebrowText}>{`DOMAIN MARKETPLACE`}</Text>
        </View>
        <Text {...elementProps(`auction-title`)} style={styles.title} accessibilityRole={`header`}>{`Domain Auction`}</Text>
        <Text {...elementProps(`auction-description`)} style={styles.description}>{`Explore auction sources, narrow your search, and research domains before buying.`}</Text>
        <View {...elementProps(`auction-heading-actions`)} style={styles.actions}>
          <Pressable {...elementProps(`auction-preview-toggle`)} style={[styles.button, disabled && styles.disabled]} disabled={disabled} onPress={() => state.setPreview(!state.preview)} accessibilityRole={`button`} accessibilityState={{ selected: state.preview, disabled }}>
            <Eye {...elementProps(`auction-preview-icon`)} size={15} color={palette.ink} />
            <Text {...elementProps(`auction-preview-text`)} style={styles.buttonText}>{state.preview ? `Hide Preview` : `Show Preview`}</Text>
          </Pressable>
          <Pressable {...elementProps(`auction-import-toggle`)} style={[styles.button, disabled && styles.disabled]} disabled={disabled} onPress={() => state.setImportOpen(!state.importOpen)} accessibilityRole={`button`} accessibilityState={{ expanded: state.importOpen, disabled }}>
            <Upload {...elementProps(`auction-import-icon`)} size={15} color={palette.ink} />
            <Text {...elementProps(`auction-import-text`)} style={styles.buttonText}>{`Import Inventory`}</Text>
          </Pressable>
          <Link href={routes.connections.href} asChild>
            <Pressable {...elementProps(`auction-connections-link`)} style={[styles.button, styles.primaryButton]} accessibilityRole={`link`}>
              <PlugZap {...elementProps(`auction-connections-icon`)} size={15} color={palette.contrast} />
              <Text {...elementProps(`auction-connections-text`)} style={[styles.buttonText, styles.primaryButtonText]}>{`Connections`}</Text>
            </Pressable>
          </Link>
        </View>
      </View>
      <View {...elementProps(`auction-preview-notice`)} style={styles.notice}>
        <Text {...elementProps(`auction-preview-notice-title`)} style={styles.noticeTitle}>{state.preview ? `Frontend Preview` : `Local Auction Inventory`}</Text>
        <Text {...elementProps(`auction-preview-notice-copy`)} style={styles.description}>{`Import free GoDaddy inventory JSON to browse a saved snapshot. Live syncing is not connected. Show Preview loads fictional domains, prices, bids, dates, and ages; it is separate from your imported inventory and saved domains.`}</Text>
        <Text {...elementProps(`auction-connection-description`)} style={styles.description}>{`Browse provider auctions below or download free GoDaddy inventory. Live auction syncing needs a supported provider and backend connection. Bidding and purchases happen on the provider website.`}</Text>
      </View>
      {!!state.error && <Toast id={`auction-error`} message={state.error} onDismiss={state.clearError} />}
      {!!state.notice && <Toast kind={`success`} id={`auction-notice`} message={state.notice} onDismiss={state.clearNotice} />}
      {state.importOpen && (
        <View {...elementProps(`auction-import-panel`)} style={styles.panel}>
          <View {...elementProps(`auction-import-heading`)} style={styles.sectionHeading}>
            <Text {...elementProps(`auction-import-title`)} style={styles.sectionTitle}>{`Import GoDaddy Inventory`}</Text>
            <Pressable {...elementProps(`auction-import-close`)} style={styles.textButton} disabled={disabled} onPress={() => state.setImportOpen(false)} accessibilityRole={`button`} accessibilityLabel={`Close Inventory Import`}>
              <X {...elementProps(`auction-import-close-icon`)} size={16} color={palette.muted} />
              <Text {...elementProps(`auction-import-close-text`)} style={styles.textButtonText}>{`Close`}</Text>
            </Pressable>
          </View>
          <Text {...elementProps(`auction-import-description`)} style={styles.description}>{`Download an inventory JSON ZIP, unzip it, then choose the .json file or paste it below. Each import replaces the saved snapshot. Files up to 8 MB and 10,000 records are supported.`}</Text>
          <Pressable {...elementProps(`auction-import-file`)} style={[styles.button, disabled && styles.disabled]} disabled={disabled} onPress={() => void importFile()} accessibilityRole={`button`} accessibilityLabel={`Choose An Unzipped JSON File`}>
            {readingFile ? <ActivityIndicator {...elementProps(`auction-import-file-progress`)} size={`small`} color={palette.ink} /> : <Upload {...elementProps(`auction-import-file-icon`)} size={14} color={palette.ink} />}
            <Text {...elementProps(`auction-import-file-text`)} style={styles.buttonText}>{readingFile ? `Reading File…` : `Choose JSON File`}</Text>
          </Pressable>
          <Text {...elementProps(`auction-import-paste-label`)} style={styles.label}>{`Or Paste Inventory JSON`}</Text>
          <TextInput
            multiline
            autoCorrect={false}
            autoCapitalize={`none`}
            editable={!disabled}
            value={state.importText}
            style={[styles.input, styles.pasteInput]}
            placeholder={`{ "meta": { ... }, "data": [ ... ] }`}
            placeholderTextColor={palette.placeholder}
            onChangeText={state.setImportText}
            {...elementProps(`auction-import-paste`)}
            accessibilityLabel={`Paste GoDaddy Inventory JSON`}
          />
          <Pressable {...elementProps(`auction-import-submit`)} style={[styles.button, styles.primaryButton, (disabled || !state.importText.trim()) && styles.disabled]} disabled={disabled || !state.importText.trim()} onPress={() => void state.importInventory()} accessibilityRole={`button`}>
            {state.busy ? <ActivityIndicator {...elementProps(`auction-import-submit-progress`)} size={`small`} color={palette.contrast} /> : <Upload {...elementProps(`auction-import-submit-icon`)} size={14} color={palette.contrast} />}
            <Text {...elementProps(`auction-import-submit-text`)} style={[styles.buttonText, styles.primaryButtonText]}>{state.busy ? `Importing…` : `Import JSON`}</Text>
          </Pressable>
          <Text {...elementProps(`auction-import-storage`)} style={styles.hint}>{state.storageMessage}</Text>
        </View>
      )}
      <View {...elementProps(`auction-filters`)} style={styles.panel}>
        <Text {...elementProps(`auction-query-label`)} style={styles.label}>{`Domain Search`}</Text>
        <View {...elementProps(`auction-query-wrap`)} style={styles.queryWrap}>
          <Search {...elementProps(`auction-query-icon`)} size={16} color={palette.muted} />
          <TextInput {...elementProps(`auction-query`)} style={styles.queryInput} value={state.filters.query} autoCorrect={false} autoCapitalize={`none`} placeholder={`Search domain names…`} placeholderTextColor={palette.placeholder} onChangeText={value => state.updateFilter(`query`, value)} accessibilityLabel={`Search Auction Domain Names`} />
        </View>
        {choices(`match`, `Name Match`, auctionMatchOptions, state.filters.match, value => state.updateFilter(`match`, value as AuctionFilters[`match`]))}
        <View {...elementProps(`auction-filter-actions`)} style={styles.sectionHeading}>
          <Pressable {...elementProps(`auction-advanced-toggle`)} style={styles.textButton} onPress={() => state.setAdvanced(!state.advanced)} accessibilityRole={`button`} accessibilityState={{ expanded: state.advanced }}>
            <SlidersHorizontal {...elementProps(`auction-advanced-icon`)} size={14} color={palette.accent} />
            <Text {...elementProps(`auction-advanced-text`)} style={styles.textButtonText}>{`Advanced Filters${state.filterCount ? ` (${state.filterCount})` : ``}`}</Text>
          </Pressable>
          <Pressable {...elementProps(`auction-reset-filters`)} style={styles.textButton} onPress={state.resetFilters} accessibilityRole={`button`}>
            <RotateCcw {...elementProps(`auction-reset-icon`)} size={13} color={palette.accent} />
            <Text {...elementProps(`auction-reset-text`)} style={styles.textButtonText}>{`Reset`}</Text>
          </Pressable>
        </View>
        {state.advanced && (
          <View {...elementProps(`auction-advanced-filters`)} style={styles.advanced}>
            {choices(`sort`, `Sort By`, auctionSortOptions, state.filters.sort, value => state.updateFilter(`sort`, value as AuctionFilters[`sort`]))}
            {auctionSelectFields.map(field => choices(field.key, field.label, [{ id: `all`, label: field.allLabel }, ...field.options], state.filters[field.key], value => state.updateFilter(field.key, value as AuctionFilters[typeof field.key])))}
            <View {...elementProps(`auction-text-filters`)} style={styles.fields}>
              {auctionTextFields.map(field => (
                <View key={field.key} {...elementProps(`auction-field`, field.key)} style={styles.field}>
                  <Text {...elementProps(`auction-label`, field.key)} style={styles.label}>{field.label}</Text>
                  <TextInput {...elementProps(`auction-input`, field.key)} style={styles.input} value={state.filters[field.key]} autoCorrect={false} autoCapitalize={`none`} placeholder={field.placeholder} placeholderTextColor={palette.placeholder} onChangeText={value => state.updateFilter(field.key, value)} accessibilityLabel={field.label} />
                </View>
              ))}
              {auctionNumericFields.map(field => {
                const usd = field.key === `minPrice` || field.key === `maxPrice`;
                const input = (
                  <TextInput
                    {...elementProps(`auction-input`, field.key)}
                    style={usd ? [styles.input, styles.priceInput] : styles.input}
                    value={state.filters[field.key]}
                    keyboardType={field.key.includes(`Price`) ? `decimal-pad` : `number-pad`}
                    placeholder={`Any`}
                    placeholderTextColor={palette.placeholder}
                    onChangeText={value => state.updateFilter(field.key, value)}
                    accessibilityLabel={field.label}
                  />
                );
                return (
                  <View key={field.key} {...elementProps(`auction-field`, field.key)} style={styles.field}>
                    <Text {...elementProps(`auction-label`, field.key)} style={styles.label}>{field.label}</Text>
                    {usd ? (
                      <View {...elementProps(`auction-price-wrap`, field.key)} style={styles.priceWrap}>
                        {input}
                        <View
                          pointerEvents={`none`}
                          accessibilityElementsHidden
                          importantForAccessibility={`no-hide-descendants`}
                          {...elementProps(`auction-price-prefix`, field.key)}
                          style={styles.pricePrefix}
                        >
                          <Text {...elementProps(`auction-price-symbol`, field.key)} style={styles.priceSymbol}>{`$`}</Text>
                        </View>
                      </View>
                    ) : input}
                  </View>
                );
              })}
            </View>
            {[
              { key: `noDigits`, label: `No Numbers` },
              { key: `noHyphens`, label: `No Hyphens` },
            ].map(option => (
              <View key={option.key} {...elementProps(`auction-name-option`, option.key)} style={styles.sectionHeading}>
                <Text {...elementProps(`auction-name-option-label`, option.key)} style={styles.label}>{option.label}</Text>
                <Switch {...elementProps(`auction-name-option-switch`, option.key)} value={state.filters[option.key as `noDigits` | `noHyphens`]} onValueChange={value => state.updateFilter(option.key as `noDigits` | `noHyphens`, value)} trackColor={{ false: palette.line, true: palette.accent }} thumbColor={palette.paper} accessibilityLabel={option.label} />
              </View>
            ))}
            <Text {...elementProps(`auction-filter-hint`)} style={styles.hint}>{`Name length excludes the extension. Age, bids, price, and ending filters omit records with unknown values. Separate extensions and excluded words with commas.`}</Text>
          </View>
        )}
      </View>
      <View {...elementProps(`auction-sources`)} style={styles.sources}>
        <Text {...elementProps(`auction-sources-label`)} style={styles.label}>{`Browse Sources`}</Text>
        <View {...elementProps(`auction-provider-links`)} style={styles.choices}>
          {auctionSources.map(source => (
            <Link key={source.id} href={source.href} asChild>
              <Pressable {...elementProps(`auction-provider`, source.id)} style={styles.textButton} accessibilityRole={`link`}>
                <Text {...elementProps(`auction-provider-text`, source.id)} style={styles.textButtonText}>{source.label}</Text>
                <ArrowUpRight {...elementProps(`auction-provider-icon`, source.id)} size={13} color={palette.accent} />
              </Pressable>
            </Link>
          ))}
        </View>
        <View {...elementProps(`auction-inventory-links`)} style={styles.choices}>
          <Link href={auctionInventoryHref} asChild>
            <Pressable {...elementProps(`auction-inventory-download`)} style={styles.textButton} accessibilityRole={`link`}>
              <Download {...elementProps(`auction-inventory-icon`)} size={13} color={palette.accent} />
              <Text {...elementProps(`auction-inventory-text`)} style={styles.textButtonText}>{`Free GoDaddy Inventory`}</Text>
            </Pressable>
          </Link>
          <Link href={auctionInventoryGuideHref} asChild>
            <Pressable {...elementProps(`auction-inventory-guide`)} style={styles.textButton} accessibilityRole={`link`}>
              <Text {...elementProps(`auction-inventory-guide-text`)} style={styles.textButtonText}>{`Download Guide`}</Text>
              <ArrowUpRight {...elementProps(`auction-inventory-guide-icon`)} size={13} color={palette.accent} />
            </Pressable>
          </Link>
        </View>
      </View>
      <View {...elementProps(`auction-results-heading`)} style={styles.sectionHeading}>
        <Text {...elementProps(`auction-results-title`)} style={styles.sectionTitle}>{state.preview ? `Preview Auction Inventory` : `Auction Inventory`}</Text>
        <Text {...elementProps(`auction-results-count`)} style={styles.hint} accessibilityLiveRegion={`polite`}>{state.loading ? `Loading…` : `${state.matchingCount} of ${state.records.length} domain(s)`}</Text>
      </View>
      <View {...elementProps(`auction-results-tools`)} style={styles.choices}>
        <Pressable {...elementProps(`auction-reload-snapshot`)} style={[styles.textButton, disabled && styles.disabled]} disabled={disabled} onPress={state.reloadListings} accessibilityRole={`button`} accessibilityLabel={`Reload Saved Inventory`}>
          <RefreshCw {...elementProps(`auction-reload-icon`)} size={13} color={palette.accent} />
          <Text {...elementProps(`auction-reload-text`)} style={styles.textButtonText}>{`Reload Saved`}</Text>
        </Pressable>
        <Pressable {...elementProps(`auction-clear-inventory`)} style={[styles.textButton, (disabled || state.preview || (!state.records.length && !state.error)) && styles.disabled]} disabled={disabled || state.preview || (!state.records.length && !state.error)} onPress={() => void state.clearInventory()} accessibilityRole={`button`}>
          <Trash2 {...elementProps(`auction-clear-icon`)} size={13} color={palette.danger} />
          <Text {...elementProps(`auction-clear-text`)} style={[styles.textButtonText, { color: palette.danger }]}>{`Clear Imported`}</Text>
        </Pressable>
      </View>
      <View {...elementProps(`auction-records`)} style={styles.records}>
        {state.loading ? [0, 1, 2].map(index => (
          <View key={index} {...elementProps(`auction-skeleton-card`, String(index))} style={styles.panel} accessibilityLabel={`Loading Auction Inventory`}>
            <View {...elementProps(`auction-skeleton-name`, String(index))} style={[styles.skeleton, styles.skeletonName]} />
            <View {...elementProps(`auction-skeleton-price`, String(index))} style={styles.skeleton} />
            <View {...elementProps(`auction-skeleton-source`, String(index))} style={styles.skeleton} />
          </View>
        )) : state.visibleRecords.map(record => <AuctionRow key={record.id} record={record} />)}
        {!state.loading && !state.visibleRecords.length && (
          <View {...elementProps(`auction-empty`)} style={styles.empty}>
            <Gavel {...elementProps(`auction-empty-icon`)} size={25} color={palette.muted} />
            <Text {...elementProps(`auction-empty-title`)} style={styles.emptyTitle}>{state.error ? `Auction Data Could Not Be Loaded` : state.records.length ? `No Matching Domains` : `Choose An Auction Source`}</Text>
            <Text {...elementProps(`auction-empty-copy`)} style={[styles.description, styles.emptyCopy]}>{state.error ? `Review the error above before trying again.` : state.records.length ? `Try fewer filters or reset them to view the inventory.` : `Import free GoDaddy inventory to fill the table, browse provider listings, or show the frontend preview to explore the filters.`}</Text>
            <Pressable {...elementProps(`auction-empty-action`)} style={styles.button} onPress={state.records.length ? state.resetFilters : () => state.setPreview(!state.preview)} accessibilityRole={`button`}>
              {state.records.length ? <RotateCcw {...elementProps(`auction-empty-action-icon`)} size={14} color={palette.ink} /> : <Eye {...elementProps(`auction-empty-action-icon`)} size={14} color={palette.ink} />}
              <Text {...elementProps(`auction-empty-action-text`)} style={styles.buttonText}>{state.records.length ? `Reset Filters` : state.preview ? `Hide Preview` : `Show Preview`}</Text>
            </Pressable>
          </View>
        )}
      </View>
      {!!state.matchingCount && !state.loading && (
        <View {...elementProps(`auction-pagination`)} style={styles.pagination}>
          <Text {...elementProps(`auction-page-range`)} numberOfLines={1} style={[styles.hint, styles.pageRange]}>{`${state.resultStart}–${state.resultEnd} of ${state.matchingCount} · Page ${state.currentPage} of ${state.pageCount}`}</Text>
          <View {...elementProps(`auction-page-actions`)} style={styles.pageActions}>
            <Pressable {...elementProps(`auction-previous-page`)} style={[styles.button, state.currentPage <= 1 && styles.disabled]} disabled={state.currentPage <= 1} onPress={state.previousPage} accessibilityRole={`button`}>
              <ChevronLeft {...elementProps(`auction-previous-icon`)} size={14} color={palette.ink} />
              <Text {...elementProps(`auction-previous-text`)} style={styles.buttonText}>{`Previous`}</Text>
            </Pressable>
            <Pressable {...elementProps(`auction-next-page`)} style={[styles.button, state.currentPage >= state.pageCount && styles.disabled]} disabled={state.currentPage >= state.pageCount} onPress={state.nextPage} accessibilityRole={`button`}>
              <Text {...elementProps(`auction-next-text`)} style={styles.buttonText}>{`Next`}</Text>
              <ChevronRight {...elementProps(`auction-next-icon`)} size={14} color={palette.ink} />
            </Pressable>
          </View>
        </View>
      )}
      <Text {...elementProps(`auction-data-footnote`)} style={styles.hint}>{state.preview ? `Preview values are fictional and do not represent domains offered for sale.` : `${state.storageMessage} Import a fresh file to update prices and metrics; Reload Saved opens the last imported snapshot.`} {`Source valuations are estimates. Verify current listing details, bid, eligibility, fees, renewal cost, and closing time with the provider.`}</Text>
    </View>
  );
};

export default DomainAuction;
