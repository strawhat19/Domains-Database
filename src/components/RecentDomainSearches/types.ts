export interface RecentDomainSearchRecord {
  query: string;
  submittedAt: string;
}

export interface RecentDomainSearchesProps {
  error: string;
  inline?: boolean;
  loading: boolean;
  disabled?: boolean;
  onClear: () => void;
  records: RecentDomainSearchRecord[];
  onSearch: (query: string) => void;
}
