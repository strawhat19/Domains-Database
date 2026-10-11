import { useMemo } from 'react';
import { createStyles } from './styles.native';
import { elementProps } from '../../shared/elementProps';
import { useTheme } from '../../shared/themeContext/useTheme';
import type { AdminSnapshot } from '../../shared/admin/types';
import { Text, View, Pressable, TextInput } from 'react-native';
import { getDomainStatus, formatDate } from '../../shared/domainUtils';
import { useAdminDomains, formatAnnualPrice } from './useAdminDomains';
import { AdminPanel, AdminStats, StatusCell, AdminLoading } from '../AdminWidgets';

const AdminDomains = ({ snapshot, loading }: { snapshot: AdminSnapshot | null; loading: boolean }) => {
  const { palette } = useTheme();
  const { search, status, domains, summary, accountNames, setSearch, setStatus } = useAdminDomains(snapshot);
  const styles = useMemo(() => createStyles(palette), [palette]);
  return <View {...elementProps(`admin-domains`)} style={styles.root}>
    <AdminStats id={`domains`} loading={loading} stats={[
      { id: `loaded`, label: `Domains Loaded`, value: snapshot?.domains.length ?? `—` },
      { id: `renewals`, label: `Renewing Soon`, value: summary?.renewing ?? `—` },
      { id: `cost`, label: `Annual Renewal Cost`, value: summary?.cost ?? `—`, hint: `Loaded Record Window` },
    ]} />
    <AdminPanel id={`domains`} title={`Domain Inventory`} note={`Read Only · Up To ${snapshot?.domainCoverage.limit ?? 500} Domain Records Across Accounts · Filters Apply To Loaded Records`}>
      <TextInput {...elementProps(`admin-domain-search`)} value={search} onChangeText={setSearch} style={styles.input} placeholder={`Search Domain, Owner, Or Registrar`} placeholderTextColor={palette.placeholder} accessibilityLabel={`Search Loaded Domains`} />
      <View {...elementProps(`admin-domain-filters`)} style={styles.filters}>
        {[`All`, `Active`, `Renewing Soon`, `Expired`, `Unknown`].map(label => <Pressable key={label} {...elementProps(`admin-domain-filter`, label.replaceAll(` `, `-`))} style={[styles.filter, status === label && styles.active]} accessibilityRole={`button`} accessibilityState={{ selected: status === label }} onPress={() => setStatus(label)}><Text {...elementProps(`admin-domain-filter-label`, label.replaceAll(` `, `-`))} style={styles.detail}>{label}</Text></Pressable>)}
      </View>
      {loading ? <AdminLoading id={`domains`} /> : domains.length ? domains.map(domain => {
        const domainStatus = getDomainStatus(domain);
        return <View key={domain.id} {...elementProps(`admin-domain-row`, domain.id)} style={styles.row}>
          <View {...elementProps(`admin-domain-identity`, domain.id)} style={styles.identity}><Text {...elementProps(`admin-domain-name`, domain.id)} style={styles.name} selectable>{domain.name}</Text><Text {...elementProps(`admin-domain-account`, domain.id)} style={styles.detail}>{accountNames.get(domain.uid) || domain.owner || domain.uid} · {domain.registrar || `Unknown Registrar`}</Text></View>
          <View {...elementProps(`admin-domain-renewal`, domain.id)} style={styles.expiry}><Text {...elementProps(`admin-domain-expiry`, domain.id)} style={styles.name}>{formatDate(domain.expiresAt)}</Text><Text {...elementProps(`admin-domain-price`, domain.id)} style={styles.detail}>{`${formatAnnualPrice(domain.renewalPrice, domain.currency || `USD`)} / Year`}</Text></View>
          <StatusCell id={domain.id} label={domainStatus} tone={domainStatus === `Expired` ? `red` : domainStatus === `Unknown` ? `gray` : `green`} />
          <Text {...elementProps(`admin-domain-auto-renew`, domain.id)} style={styles.detail}>{domain.autoRenew ? `Auto Renew On` : `Auto Renew Off`}</Text>
        </View>;
      }) : <Text {...elementProps(`admin-domains-empty`)} style={styles.detail}>{!snapshot ? `Domain Records Unavailable` : search || status !== `All` ? `No Matching Domains In Loaded Records` : `No Domain Records Yet`}</Text>}
      {snapshot?.domainCoverage.hasMore ? <Text {...elementProps(`admin-domains-coverage`)} style={styles.detail}>{`More Domain Records Exist · This View Covers The Loaded Window`}</Text> : null}
    </AdminPanel>
  </View>;
};

export default AdminDomains;
