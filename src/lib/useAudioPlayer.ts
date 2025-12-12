import { useState, useRef, useEffect, useCallback } from 'react';
import { Audio } from 'expo-av';

export type AudioPlayerState = {
  isLoaded: boolean;
  isPlaying: boolean;
  position: number; // milliseconds
  duration: number; // milliseconds
  isBuffering: boolean;
  loop: boolean;
};

export type AudioPlayerActions = {
  load: (url: string) => Promise<void>;
  play: () => Promise<void>;
  pause: () => Promise<void>;
  stop: () => Promise<void>;
  seek: (positionMs: number) => Promise<void>;
  setLoop: (isLoop: boolean) => Promise<void>;
  unload: () => Promise<void>;
};

/**
 * React hook for audio playback using expo-av.
 * Maintains a single Audio.Sound instance (singleton per hook instance).
 * Provides state: {isLoaded, isPlaying, position, duration, isBuffering, loop}
 * And actions: load, play, pause, stop, seek, setLoop, unload.
 */
export function useAudioPlayer(): [AudioPlayerState, AudioPlayerActions] {
  // State
  const [state, setState] = useState<AudioPlayerState>({
    isLoaded: false,
    isPlaying: false,
    position: 0,
    duration: 0,
    isBuffering: false,
    loop: false,
  });

  // Ref to hold single Audio.Sound instance
  const soundRef = useRef<Audio.Sound | null>(null);

  // Configure audio mode on mount (once per hook)
  useEffect(() => {
    const configureAudioMode = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: false,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      } catch (e) {
        console.warn('[useAudioPlayer] setAudioModeAsync failed', e);
      }
    };
    configureAudioMode();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current
          .unloadAsync()
          .catch((e) => console.error('[useAudioPlayer] cleanup unload failed', e));
      }
    };
  }, []);

  const load = useCallback(async (url: string) => {
    try {
      // Unload previous sound if any
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      const { sound } = await Audio.Sound.createAsync({ uri: url });
      soundRef.current = sound;

      // Subscribe to playback status updates
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          setState((prev) => ({
            ...prev,
            isLoaded: true,
            isPlaying: status.isPlaying,
            position: status.positionMillis ?? 0,
            duration: status.durationMillis ?? 0,
            isBuffering: status.isBuffering ?? false,
          }));
        }
      });

      setState((prev) => ({
        ...prev,
        isLoaded: true,
        isPlaying: false,
        position: 0,
        duration: 0,
      }));
    } catch (e) {
      console.error('[useAudioPlayer] load failed', e);
      throw e;
    }
  }, []);

  const play = useCallback(async () => {
    try {
      if (!soundRef.current) {
        throw new Error('No sound loaded');
      }
      await soundRef.current.playAsync();
      setState((prev) => ({ ...prev, isPlaying: true }));
    } catch (e) {
      console.error('[useAudioPlayer] play failed', e);
      throw e;
    }
  }, []);

  const pause = useCallback(async () => {
    try {
      if (!soundRef.current) {
        throw new Error('No sound loaded');
      }
      await soundRef.current.pauseAsync();
      setState((prev) => ({ ...prev, isPlaying: false }));
    } catch (e) {
      console.error('[useAudioPlayer] pause failed', e);
      throw e;
    }
  }, []);

  const stop = useCallback(async () => {
    try {
      if (!soundRef.current) return;
      await soundRef.current.stopAsync();
      setState((prev) => ({ ...prev, isPlaying: false, position: 0 }));
    } catch (e) {
      console.error('[useAudioPlayer] stop failed', e);
      throw e;
    }
  }, []);

  const seek = useCallback(async (positionMs: number) => {
    try {
      if (!soundRef.current) {
        throw new Error('No sound loaded');
      }
      await soundRef.current.setPositionAsync(positionMs);
      setState((prev) => ({ ...prev, position: positionMs }));
    } catch (e) {
      console.error('[useAudioPlayer] seek failed', e);
      throw e;
    }
  }, []);

  const setLoop = useCallback(async (isLoop: boolean) => {
    try {
      if (!soundRef.current) {
        throw new Error('No sound loaded');
      }
      await soundRef.current.setIsLoopingAsync(isLoop);
      setState((prev) => ({ ...prev, loop: isLoop }));
    } catch (e) {
      console.error('[useAudioPlayer] setLoop failed', e);
      throw e;
    }
  }, []);

  const unload = useCallback(async () => {
    try {
      if (!soundRef.current) return;
      await soundRef.current.unloadAsync();
      soundRef.current = null;
      setState({
        isLoaded: false,
        isPlaying: false,
        position: 0,
        duration: 0,
        isBuffering: false,
        loop: false,
      });
    } catch (e) {
      console.error('[useAudioPlayer] unload failed', e);
      throw e;
    }
  }, []);

  const actions: AudioPlayerActions = {
    load,
    play,
    pause,
    stop,
    seek,
    setLoop,
    unload,
  };

  return [state, actions];
}
