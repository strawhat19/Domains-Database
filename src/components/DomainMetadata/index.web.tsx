import './styles.scss';
import { useDomainMetadata, type DomainMetadataProps } from './useDomainMetadata';

const DomainMetadata = ({ domain, hideProjectDetails = false }: DomainMetadataProps) => {
  const { scope, items } = useDomainMetadata({ domain, hideProjectDetails });

  return (
    <div id={scope} className={`domain-metadata`}>
      {items.length ? (
        <dl
          id={`${scope}-list`}
          className={`domain-metadata-list`}
          aria-label={`Saved Details For ${domain.name}`}
        >
          {items.map(({ key, label, value, wide }) => (
            <div
              key={key}
              id={`${scope}-field-${key}`}
              className={`domain-metadata-field${wide ? ` domain-metadata-field-wide` : ``}`}
            >
              <dt id={`${scope}-label-${key}`} className={`domain-metadata-label`}>{label}</dt>
              <dd id={`${scope}-value-${key}`} className={`domain-metadata-value`}>{value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p id={`${scope}-empty`} className={`domain-metadata-empty`}>{`No Saved Metadata`}</p>
      )}
    </div>
  );
};

export default DomainMetadata;
