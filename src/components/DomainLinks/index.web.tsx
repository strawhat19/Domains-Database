import './styles.scss';
import { ExternalLink } from 'lucide-react';
import type { DomainInput } from '../../shared/types';
import SettingsField from '../SettingsField/index.web';
import { normalizeDomainLink } from '../../shared/domainLinks';

export type DomainLinkField =
  | `parentLink`
  | `childLinks`
  | `previewLinks`
  | `relatedLinks`
  | `githubRepoLink`
  | `productionLink`
  | `socialMediaLinks`;

interface DomainLinksProps {
  id: string;
  input: DomainInput;
  disabled?: boolean;
  onChange: <Key extends DomainLinkField>(field: Key, value: DomainInput[Key]) => void;
}

const fields: { key: DomainLinkField; label: string; multiple?: boolean }[] = [
  { key: `previewLinks`, label: `Preview Links`, multiple: true },
  { key: `relatedLinks`, label: `Related Links`, multiple: true },
  { key: `parentLink`, label: `Parent Link` },
  { key: `childLinks`, label: `Child Links`, multiple: true },
  { key: `productionLink`, label: `Production Link` },
  { key: `githubRepoLink`, label: `GitHub Repository Link` },
  { key: `socialMediaLinks`, label: `Social Media Links`, multiple: true },
];

const getOpenHref = (value: string) => {
  try {
    return normalizeDomainLink(value, `Link`) || undefined;
  } catch {
    return undefined;
  }
};

const DomainLinks = ({ id, input, onChange, disabled = false }: DomainLinksProps) => (
  <aside id={id} className={`domain-links`} aria-labelledby={`${id}-title`}>
    <h3 id={`${id}-title`} className={`domain-links-title`}>
      {`Links`}
    </h3>
    <div id={`${id}-fields`} className={`domain-links-fields`}>
      {fields.map(field => {
        const fieldId = `${id}-${field.key}`;
        const value = input[field.key];
        const draft = Array.isArray(value) ? value.join(`\n`) : value ?? ``;
        const links = (Array.isArray(value) ? value : [value ?? ``]).map(link => link.trim()).filter(Boolean);
        const openLinks = links.map((link, index) => ({ link, index, href: getOpenHref(link) }));

        return (
          <div key={field.key} id={`${fieldId}-field`} className={`domain-links-field`}>
            <label id={`${fieldId}-label`} className={`domain-editor-label`} htmlFor={`${fieldId}-input`}>
              {field.label}
            </label>
            <div id={`${fieldId}-value-row`} className={`domain-links-value-row`}>
              <SettingsField
                disabled={disabled}
                label={field.label}
                id={`${fieldId}-setting`}
                value={links.length ? links.map((link, index) => (
                  <span key={index} id={`${fieldId}-value-${index}`} className={`domain-links-value`}>
                    {link}
                  </span>
                )) : undefined}
              >
                {field.multiple ? (
                  <>
                    <textarea
                      rows={3}
                      value={draft}
                      inputMode={`url`}
                      disabled={disabled}
                      autoComplete={`off`}
                      spellCheck={false}
                      id={`${fieldId}-input`}
                      placeholder={`https://example.com`}
                      aria-describedby={`${fieldId}-help`}
                      className={`domain-editor-input domain-links-textarea`}
                      onChange={event => onChange(field.key, event.target.value.split(`\n`))}
                    />
                    <p id={`${fieldId}-help`} className={`domain-links-help`}>
                      {`One URL per line`}
                    </p>
                  </>
                ) : (
                  <input
                    type={`url`}
                    value={draft}
                    inputMode={`url`}
                    maxLength={2048}
                    disabled={disabled}
                    autoComplete={`off`}
                    spellCheck={false}
                    id={`${fieldId}-input`}
                    placeholder={field.key === `githubRepoLink` ? `https://github.com/owner/repository` : `https://example.com`}
                    className={`domain-editor-input domain-links-input`}
                    onChange={event => onChange(field.key, event.target.value)}
                  />
                )}
              </SettingsField>
              {openLinks.some(link => link.href) && (
                <div id={`${fieldId}-open-actions`} className={`domain-links-open-actions`}>
                  {openLinks.map(link => (
                    <span key={link.index} id={`${fieldId}-open-wrap-${link.index}`} className={`domain-links-open-wrap`}>
                      {link.href && (
                        <a
                          target={`_blank`}
                          href={link.href}
                          rel={`noopener noreferrer`}
                          id={`${fieldId}-open-${link.index}`}
                          className={`domain-links-open`}
                          title={`Open ${field.label}${field.multiple ? ` ${link.index + 1}` : ``}`}
                          aria-label={`Open ${field.label}${field.multiple ? ` ${link.index + 1}` : ``} in a New Tab`}
                        >
                          <ExternalLink size={13} aria-hidden={`true`} id={`${fieldId}-open-icon-${link.index}`} className={`domain-links-open-icon`} />
                        </a>
                      )}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  </aside>
);

export default DomainLinks;
