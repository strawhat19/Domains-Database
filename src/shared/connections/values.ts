import { connectionFields, type ConnectionValues } from './types';

export const normalizeConnections = (input: ConnectionValues): ConnectionValues => {
  const result: ConnectionValues = { godaddy: ``, hostinger: ``, namecheap: `` };
  for (const field of connectionFields) {
    const text = input?.[field.id];
    if (typeof text !== `string` || text.length > 12000) throw new Error(`Enter Valid ${field.label} Values`);
    const values: Record<string, string> = {};
    const formatted: Record<string, string> = {};
    const lines = text.split(/\r?\n/).map(line => line.trim()).filter(line => line && !line.startsWith(`#`));
    for (const line of lines) {
      const match = /^(?:export\s+)?([A-Z][A-Z0-9_]*)\s*=\s*(.*)$/.exec(line);
      const key = match?.[1] ?? (field.id === `godaddy` ? `GODADDY_PAT` : field.id === `hostinger` ? `HOSTINGER_API_TOKEN` : ``);
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
    if (field.id === `hostinger` && !values.HOSTINGER_API_TOKEN) throw new Error(`Enter A Hostinger API Token`);
    if (field.id === `namecheap`) {
      if (!values.NAMECHEAP_API_KEY || !values.NAMECHEAP_USERNAME || !values.NAMECHEAP_CLIENT_IP) throw new Error(`Enter All Three Namecheap Values`);
      const parts = values.NAMECHEAP_CLIENT_IP.split(`.`);
      if (parts.length !== 4 || parts.some(part => !/^\d{1,3}$/.test(part) || Number(part) > 255)) throw new Error(`Enter A Valid Namecheap Server IPv4`);
    }
    result[field.id] = Object.entries(formatted).map(([key, value]) => `${key}=${value}`).join(`\n`);
  }
  return result;
};
