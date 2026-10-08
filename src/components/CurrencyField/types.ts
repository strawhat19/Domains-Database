export interface CurrencyFieldProps {
  id: string;
  label: string;
  value?: number;
  disabled?: boolean;
  onChange: (value: number | undefined) => void;
}
