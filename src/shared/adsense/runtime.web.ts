type ConsentState = `unknown` | `allowed` | `denied`;
type ConsentCallback = Record<string, () => void>;
type ConsentMap = Record<string, boolean | undefined>;

interface TcfData {
  listenerId?: number;
  eventStatus?: string;
  gdprApplies?: boolean;
  cmpStatus?: string;
  vendor?: { consents?: ConsentMap };
  purpose?: { consents?: ConsentMap };
}

interface GppEvent {
  data?: unknown;
  listenerId?: number;
  eventName?: string;
  pingData?: { signalStatus?: string };
}

interface TcfApi {
  (command: `addEventListener`, version: 2, callback: (data: TcfData | null, success: boolean) => void): void;
  (command: `removeEventListener`, version: 2, callback: (success: boolean) => void, listenerId: number): void;
}

interface GppApi {
  (command: `addEventListener`, callback: (event: GppEvent | null, success: boolean) => void): void;
  (command: `removeEventListener`, callback: (removed: boolean, success: boolean) => void, listenerId: number): void;
}

interface GoogleConsent {
  callbackQueue?: { push: (callback: ConsentCallback) => unknown };
  usstatesoptout?: {
    getInitialUsStatesOptOutStatus?: () => number;
    InitialUsStatesOptOutStatusEnum?: {
      UNKNOWN: number;
      OPTED_OUT: number;
      NOT_OPTED_OUT: number;
      DOES_NOT_APPLY: number;
    };
  };
}

interface AdSenseQueue {
  push: (entry: unknown) => unknown;
  pauseAdRequests?: number;
  requestNonPersonalizedAds?: number;
}

export interface AdSenseWindow {
  __gpp?: GppApi;
  __tcfapi?: TcfApi;
  googlefc?: GoogleConsent;
  location: Pick<Location, `href` | `assign` | `reload`>;
  adsbygoogle?: AdSenseQueue;
  addEventListener: (type: string, listener: EventListener, options?: boolean | AddEventListenerOptions) => void;
  removeEventListener: (type: string, listener: EventListener, options?: boolean | EventListenerOptions) => void;
}

export interface AdSenseRuntimeState {
  path: string;
  identity: string;
  eligible: boolean;
  settling: boolean;
}

export interface AdSenseRuntime {
  dispose: () => void;
  update: (state: AdSenseRuntimeState) => void;
}

interface AdSenseDocument {
  path: string;
  href: string;
  identity: string;
  publisherId: string;
  everResumed: boolean;
  tcfDecision?: string;
}

const loadedDocuments = new WeakMap<Document, AdSenseDocument>();
const scriptId = `domains-adsense-script`;

export const createAdSenseRuntime = (window: AdSenseWindow, document: Document, publisherId: string): AdSenseRuntime => {
  let disposed = false;
  let pageHidden = false;
  let initialized = false;
  let resetting = false;
  let scriptFailed = false;
  let resetRequired = false;
  let resetToCurrent = false;
  let tcfListenerId: number | undefined;
  let gppListenerId: number | undefined;
  let gppAvailable = false;
  let gppReady = false;
  let gppWasReady = false;
  let gppChanged = false;
  let usRegulated = false;
  let personalized = false;
  let consentApiSubscribed = false;
  let observedHref = window.location.href;
  let usConsent: ConsentState = `unknown`;
  let tcfConsent: ConsentState = `unknown`;
  let loadedDocument = loadedDocuments.get(document);
  let state: AdSenseRuntimeState = { path: ``, identity: ``, eligible: false, settling: true };

  const pause = () => {
    window.adsbygoogle ??= [] as unknown[];
    window.adsbygoogle.pauseAdRequests = 1;
  };

  const resetDocument = (path?: string) => {
    pause();
    if (disposed || resetting || state.settling || pageHidden) return;
    try {
      const current = new URL(window.location.href);
      const destination = path === undefined ? current : new URL(path, current.origin);
      if (path !== undefined && (!path.startsWith(`/`) || path.startsWith(`//`) || destination.origin !== current.origin)) return;
      resetting = true;
      if (destination.href === current.href) window.location.reload();
      else {
        window.location.assign(destination.href);
        if (destination.pathname === current.pathname && destination.search === current.search) window.location.reload();
      }
    } catch { /* Keep requests paused if navigation is unavailable */ }
  };

  const evaluate = () => {
    if (disposed || !loadedDocument) return;
    const routeChanged = state.path !== loadedDocument.path;
    const scopeChanged = routeChanged || state.identity !== loadedDocument.identity;
    if (resetting || pageHidden || state.settling) return pause();
    if (resetRequired || scopeChanged || !state.eligible) return resetDocument(routeChanged && !resetToCurrent ? state.path : undefined);
    const gppPermits = gppAvailable ? gppReady : !usRegulated;
    if (!initialized || scriptFailed || !gppPermits || tcfConsent !== `allowed` || usConsent !== `allowed`) return pause();
    window.adsbygoogle ??= [] as unknown[];
    window.adsbygoogle.requestNonPersonalizedAds = personalized ? 0 : 1;
    window.adsbygoogle.pauseAdRequests = 0;
    loadedDocument.everResumed = true;
  };

  const receiveTcf = (data: TcfData | null, success: boolean) => {
    if (disposed || resetting) return;
    if (typeof data?.listenerId === `number` && data.listenerId > 0) tcfListenerId = data.listenerId;
    personalized = false;
    tcfConsent = `unknown`;
    if (success && data?.gdprApplies === false && (data.cmpStatus === undefined || data.cmpStatus === `loaded`)) tcfConsent = `allowed`;
    else if (success && data?.gdprApplies === true && data.cmpStatus === `loaded`
      && (data.eventStatus === `tcloaded` || data.eventStatus === `useractioncomplete`)) {
      tcfConsent = data.purpose?.consents?.[1] === true && data.vendor?.consents?.[755] === true ? `allowed` : `denied`;
      personalized = data.purpose?.consents?.[3] === true && data.purpose?.consents?.[4] === true;
    }
    if (loadedDocument && tcfConsent !== `unknown`) {
      const decision = `${data?.gdprApplies}:${tcfConsent}:${personalized}`;
      if (loadedDocument.everResumed && loadedDocument.tcfDecision !== decision) resetRequired = true;
      loadedDocument.tcfDecision = decision;
    }
    if (loadedDocument?.everResumed && (tcfConsent === `denied` || !success || data?.cmpStatus === `error`)) resetRequired = true;
    evaluate();
  };

  const receiveGpp = (event: GppEvent | null, success: boolean) => {
    if (disposed || resetting) return;
    if (typeof event?.listenerId === `number` && event.listenerId > 0) gppListenerId = event.listenerId;
    if (!success || !event || event.eventName === `error`) {
      gppReady = false;
      if (loadedDocument?.everResumed) resetRequired = true;
      return evaluate();
    }
    if (gppWasReady && (event.eventName === `sectionChange` || event.pingData?.signalStatus !== `ready`)) gppChanged = true;
    gppReady = event.pingData?.signalStatus === `ready`;
    if (gppReady) {
      gppWasReady = true;
      // Google's initial US status is a snapshot; reload after later GPP changes rather than reuse it
      if (gppChanged) resetRequired = true;
    }
    evaluate();
  };

  const receiveInitialUsConsent = () => {
    if (disposed || resetting) return;
    const us = window.googlefc?.usstatesoptout;
    const statuses = us?.InitialUsStatesOptOutStatusEnum;
    usConsent = `unknown`;
    try {
      const status = us?.getInitialUsStatesOptOutStatus?.();
      if (typeof status === `number` && statuses) {
        usRegulated = status !== statuses.DOES_NOT_APPLY;
        if (status === statuses.DOES_NOT_APPLY || status === statuses.NOT_OPTED_OUT) usConsent = `allowed`;
        else if (status === statuses.OPTED_OUT) usConsent = `denied`;
      }
    } catch { usConsent = `unknown`; }
    if (loadedDocument?.everResumed && usConsent === `denied`) resetRequired = true;
    evaluate();
  };

  const subscribe = () => {
    window.googlefc ??= {};
    window.googlefc.callbackQueue ??= [] as ConsentCallback[];
    window.googlefc.callbackQueue.push({
      CONSENT_API_READY: () => {
        if (disposed || resetting || consentApiSubscribed) return;
        consentApiSubscribed = true;
        try { window.__tcfapi?.(`addEventListener`, 2, receiveTcf); } catch { tcfConsent = `unknown`; }
        if (window.__gpp) {
          gppAvailable = true;
          try { window.__gpp(`addEventListener`, receiveGpp); } catch { gppReady = false; }
        }
        evaluate();
      },
    });
    window.googlefc.callbackQueue.push({ INITIAL_US_STATES_OPT_OUT_DATA_READY: receiveInitialUsConsent });
  };

  const load = () => {
    if (disposed || loadedDocument || !state.eligible || state.settling || pageHidden) return;
    if (!/^ca-pub-\d{16}$/.test(publisherId) || /^ca-pub-0+$/.test(publisherId)) return;
    pause();
    // An unrelated existing tag must not cause duplicate initialization or become implicitly trusted
    if (document.getElementById(scriptId)) return;
    const script = document.createElement(`script`);
    script.id = scriptId;
    script.async = true;
    script.crossOrigin = `anonymous`;
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`;
    script.onerror = () => { scriptFailed = true; pause(); };
    loadedDocument = { path: state.path, href: window.location.href, identity: state.identity, publisherId, everResumed: false };
    loadedDocuments.set(document, loadedDocument);
    subscribe();
    try {
      document.head.appendChild(script);
      initialized = true;
    } catch {
      scriptFailed = true;
      pause();
    }
    evaluate();
  };

  const onPageHide: EventListener = () => { pageHidden = true; if (loadedDocument) pause(); };
  const onUrlChange: EventListener = () => {
    if (!loadedDocument) return;
    const current = new URL(window.location.href);
    if (observedHref === current.href && state.path === `${current.pathname}${current.search}${current.hash}`) return;
    observedHref = current.href;
    resetToCurrent = true;
    resetRequired = true;
    pause();
    evaluate();
  };
  const onLinkClick: EventListener = event => {
    if (disposed || resetting || !loadedDocument || event.defaultPrevented) return;
    if (state.settling) return pause();
    const mouse = event as MouseEvent;
    if (mouse.button !== 0 || mouse.altKey || mouse.ctrlKey || mouse.metaKey || mouse.shiftKey) return;
    const target = event.target as Element | null;
    const anchor = (target?.closest?.(`a[href]`) ?? target?.parentElement?.closest?.(`a[href]`)) as HTMLAnchorElement | null;
    if (!anchor || anchor.hasAttribute(`download`) || anchor.getAttribute(`aria-disabled`) === `true`) return;
    if (anchor.getAttribute(`data-app-navigation`) !== `true`) return;
    const targetName = anchor.target || document.querySelector(`base[target]`)?.getAttribute(`target`) || `_self`;
    if (targetName.toLowerCase() !== `_self`) return;
    try {
      const current = new URL(window.location.href);
      const destination = new URL(anchor.href, current.href);
      if (destination.origin !== current.origin || ![`http:`, `https:`].includes(destination.protocol)) return;
      event.preventDefault();
      event.stopPropagation();
      pause();
      resetting = true;
      window.location.assign(destination.href);
      // A fragment-only assign can reuse the document and its already-executed advertising code
      if (destination.hash && destination.pathname === current.pathname && destination.search === current.search) window.location.reload();
    } catch { pause(); }
  };
  const onPageShow: EventListener = event => {
    pageHidden = false;
    if (loadedDocument && `persisted` in event && event.persisted === true) {
      resetting = false;
      resetRequired = true;
      resetToCurrent = true;
    }
    if (!loadedDocument) load();
    else evaluate();
  };

  window.addEventListener(`pagehide`, onPageHide);
  window.addEventListener(`pageshow`, onPageShow);
  window.addEventListener(`popstate`, onUrlChange);
  window.addEventListener(`hashchange`, onUrlChange);
  window.addEventListener(`click`, onLinkClick, true);
  if (loadedDocument) {
    pause();
    if (loadedDocument.publisherId !== publisherId || loadedDocument.href !== window.location.href) resetRequired = true;
    subscribe();
    initialized = true;
  }

  return {
    update: nextState => {
      if (disposed) return;
      state = { ...nextState };
      if (!loadedDocument) load();
      else evaluate();
    },
    dispose: () => {
      if (disposed) return;
      disposed = true;
      if (loadedDocument) pause();
      window.removeEventListener(`pagehide`, onPageHide);
      window.removeEventListener(`pageshow`, onPageShow);
      window.removeEventListener(`popstate`, onUrlChange);
      window.removeEventListener(`hashchange`, onUrlChange);
      window.removeEventListener(`click`, onLinkClick, true);
      try { if (tcfListenerId !== undefined) window.__tcfapi?.(`removeEventListener`, 2, () => {}, tcfListenerId); } catch { /* Disposed callbacks remain inert */ }
      try { if (gppListenerId !== undefined) window.__gpp?.(`removeEventListener`, () => {}, gppListenerId); } catch { /* Disposed callbacks remain inert */ }
    },
  };
};
