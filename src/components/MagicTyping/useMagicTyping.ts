import { AppState } from 'react-native';
import { useEffect, useState } from 'react';
import { useReducedMotion } from '../../shared/common/useReducedMotion';

const examples = [`orbitgrove.com`, `quietorbit.co`, `makerorbit.app`];

export const useMagicTyping = (paused = false) => {
  const reducedMotion = useReducedMotion();
  const [appActive, setAppActive] = useState(AppState.currentState !== `background` && AppState.currentState !== `inactive`);
  const [state, setState] = useState({ index: 0, deleting: false, characters: examples[0].length });
  const example = examples[state.index];
  const stopped = paused || reducedMotion || !appActive;

  useEffect(() => {
    const subscription = AppState.addEventListener(`change`, status => setAppActive(status !== `background` && status !== `inactive`));
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (stopped) {
      setState(current => current.characters === example.length && !current.deleting
        ? current : { ...current, deleting: false, characters: example.length });
      return;
    }
    const delay = state.deleting ? state.characters > 0 ? 45 : 350 : state.characters < example.length ? 90 : 2200;
    const timer = setTimeout(() => {
      setState(current => {
        if (current.deleting) return current.characters > 0
          ? { ...current, characters: current.characters - 1 }
          : { index: (current.index + 1) % examples.length, deleting: false, characters: 0 };
        return current.characters < example.length
          ? { ...current, characters: current.characters + 1 }
          : { ...current, deleting: true };
      });
    }, delay);
    return () => clearTimeout(timer);
  }, [state, example, stopped]);

  return { animateCaret: !stopped, text: stopped ? example : example.slice(0, state.characters) };
};
