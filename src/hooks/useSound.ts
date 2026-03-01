import { useContext } from 'react';
import { GameContext } from '../context/GameContext';
import { Sounds } from '../utils/audioUtils';

type SoundKey = keyof typeof Sounds;

export function useSound() {
  const { soundEnabled } = useContext(GameContext);

  function play(key: SoundKey) {
    if (soundEnabled) Sounds[key]();
  }

  return { play };
}
