import { useRef } from 'react';
import type { Registrar } from '../../shared/types';
import { useModalFocus } from '../DomainEditor/useDomainEditor';

const registrarLinks: Record<Registrar, string> = {
  GoDaddy: `https://www.godaddy.com/`,
  Porkbun: `https://porkbun.com/account/`,
  NameSilo: `https://www.namesilo.com/`,
  Hostinger: `https://www.hostinger.com/`,
  Namecheap: `https://www.namecheap.com/`,
  Squarespace: `https://account.squarespace.com/domains`,
  [`GoDaddy Auctions`]: `https://www.godaddy.com/`,
};

export const useConnections = (onClose: () => void) => {
  const modalRef = useRef<HTMLDivElement>(null);
  useModalFocus(modalRef, true, onClose);
  return { modalRef, registrarLinks };
};
