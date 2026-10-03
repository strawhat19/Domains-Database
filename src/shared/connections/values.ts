import { EMPTY_CONNECTIONS, connectionFields, type ConnectionValues } from './types';

export const normalizeConnections = (input: ConnectionValues): ConnectionValues => {
  const result: ConnectionValues = { ...EMPTY_CONNECTIONS };
  for (const field of connectionFields) {
    const savedText = input?.[field.id];
    const text = savedText === undefined && (field.id === `porkbun` || field.id === `namesilo`) ? `` : savedText;
    if (typeof text !== `string` || text.length > 12000) throw new Error(`Enter Valid ${field.label} Values`);
    const values: Record<string, string> = {};
    const formatted: Record<string, string> = {};
    const lines = text.split(/\r?\n/).map(line => line.trim()).filter(line => line && !line.startsWith(`#`));
    for (const line of lines) {
      const match = /^(?:export\s+)?([A-Z][A-Z0-9_]*)\s*=\s*(.*)$/.exec(line);
      const key = match?.[1] ?? (field.id === `godaddy` ? `GODADDY_PAT` : field.id === `hostinger` ? `HOSTINGER_API_TOKEN` : field.id === `namesilo` ? `NAMESILO_API_KEY` : ``);
      const literal = match?.[2] ?? line;
      let value = literal;
      if (!field.keys.some(allowed => allowed === key) || key in values) throw new Error(`Use The Listed ${field.label} Variable Names`);
      if ((value.startsWith(`'`) && value.endsWith(`'`)) || (value.startsWith(`"`) && value.endsWith(`"`))) value = value.slice(1, -1);
      if (!value || /[\r\n\u0000]/.test(value)) throw new Error(`Enter A Value For ${key}`);
      values[key] = value;
      formatted[key] = value !== literal ? literal : /[#\s]/.test(value) ? JSON.stringify(value) : value;
    }
    if (!lines.length) continue;
    if (field.id === `godaddy` && !values.GODADDY_PAT && !(values.GODADDY_API_KEY && values.GODADDY_API_SECRET)) throw new Error(`Enter A GoDaddy Token Or Key And Secret`);
    if (values.GODADDY_CUSTOMER_ID && !/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(values.GODADDY_CUSTOMER_ID)) throw new Error(`Enter GODADDY_CUSTOMER_ID As The Account UUID`);
    if (values.GODADDY_SHOPPER_ID && !/^\d{1,10}$/.test(values.GODADDY_SHOPPER_ID)) throw new Error(`Enter GODADDY_SHOPPER_ID As Up To 10 Digits`);
    if (values.GODADDY_CUSTOMER_ID && values.GODADDY_SHOPPER_ID) throw new Error(`Enter A GoDaddy Customer UUID Or Shopper ID`);
    if (field.id === `hostinger` && !values.HOSTINGER_API_TOKEN) throw new Error(`Enter A Hostinger API Token`);
    if (values.HOSTINGER_EXTERNAL_DOMAINS) {
      const names = values.HOSTINGER_EXTERNAL_DOMAINS.split(`,`).map(name => name.trim().toLowerCase());
      if (names.length > 200 || names.some(name => name.length > 253 || /^\d+$/.test(name.split(`.`).at(-1) ?? ``) || name.split(`.`).length < 2 || name.split(`.`).some(label => !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label)))) {
        throw new Error(`Enter Confirmed External Domain Names Separated By Commas`);
      }
      values.HOSTINGER_EXTERNAL_DOMAINS = [...new Set(names)].join(`,`);
      formatted.HOSTINGER_EXTERNAL_DOMAINS = values.HOSTINGER_EXTERNAL_DOMAINS;
    }
    if (field.id === `namesilo` && !values.NAMESILO_API_KEY) throw new Error(`Enter A NameSilo API Key`);
    if (field.id === `porkbun` && (!values.PORKBUN_API_KEY || !values.PORKBUN_SECRET_API_KEY)) throw new Error(`Enter Both Porkbun API Keys`);
    if (field.id === `namecheap`) {
      if (!values.NAMECHEAP_API_KEY || !values.NAMECHEAP_USERNAME || !values.NAMECHEAP_CLIENT_IP) throw new Error(`Enter All Three Namecheap Values`);
      const parts = values.NAMECHEAP_CLIENT_IP.split(`.`);
      if (parts.length !== 4 || parts.some(part => !/^\d{1,3}$/.test(part) || Number(part) > 255)) throw new Error(`Enter A Valid Namecheap Server IPv4`);
    }
    result[field.id] = Object.entries(formatted).map(([key, value]) => `${key}=${value}`).join(`\n`);
  }
  return result;
};
