import { useRef } from 'react';
import type { Registrar } from '../../shared/types';
import { useModalFocus } from '../DomainEditor/useDomainEditor';

const registrarLinks: Record<Registrar, string> = {
  Hostinger: `https://www.hostinger.com/`,
  GoDaddy: `https://www.godaddy.com/`,
  Namecheap: `https://www.namecheap.com/`,
  [`GoDaddy Auctions`]: `https://www.godaddy.com/`,
};

export const useConnections = (onClose: () => void) => {
  const modalRef = useRef<HTMLDivElement>(null);
  useModalFocus(modalRef, true, onClose);
  return { modalRef, registrarLinks };
};
