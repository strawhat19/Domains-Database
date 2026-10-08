import { useEffect, useState } from 'react';

interface DomainProjectSelectInput {
  disabled?: boolean;
  onChange: (value: string | undefined) => void;
}

export const useDomainProjectSelect = ({ onChange, disabled = false }: DomainProjectSelectInput) => {
  const [open, setOpen] = useState(false);
  const toggle = () => setOpen(current => !current);
  const choose = (value: string | undefined) => {
    onChange(value);
    setOpen(false);
  };

  useEffect(() => { if (disabled) setOpen(false); }, [disabled]);

  return { open, toggle, choose };
};
