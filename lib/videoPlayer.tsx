"use client";

// Lightweight context that lets any component on the Results screen
// seek the hero video player without prop-drilling. The hero
// component (`VideoHero`) registers an actual seek implementation on
// mount; consumers (region sparklines, suggestion timestamp pills)
// read `useVideoSeek()` and call it with a seconds value.
//
// Two contexts are exposed: `useVideoSeek` for read access, and
// `useRegisterVideoSeek` for the player itself to publish its
// implementation. Splitting them keeps the read path stable
// (consumers don't re-render when the registration ref changes).

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  type ReactNode,
} from "react";

type SeekFn = (seconds: number) => void;

const noopSeek: SeekFn = () => {};

const VideoSeekContext = createContext<SeekFn>(noopSeek);
const VideoSeekRegisterContext = createContext<(fn: SeekFn) => void>(() => {});

export function useVideoSeek(): SeekFn {
  return useContext(VideoSeekContext);
}

export function useRegisterVideoSeek(): (fn: SeekFn) => void {
  return useContext(VideoSeekRegisterContext);
}

export function VideoPlayerProvider({ children }: { children: ReactNode }) {
  // The currently-registered seek function. Held in a ref so the
  // provider never re-renders when the player swaps its implementation
  // (e.g. when the YouTube IFrame API finishes loading).
  const seekRef = useRef<SeekFn>(noopSeek);

  // Stable wrapper consumers can call. Always defers to `seekRef`,
  // which is updated by the player.
  const seekTo = useCallback<SeekFn>((seconds) => {
    seekRef.current(seconds);
  }, []);

  const register = useCallback((fn: SeekFn) => {
    seekRef.current = fn;
  }, []);

  // Memoize the value identity so context consumers don't rebroadcast.
  const seekValue = useMemo(() => seekTo, [seekTo]);

  return (
    <VideoSeekContext.Provider value={seekValue}>
      <VideoSeekRegisterContext.Provider value={register}>
        {children}
      </VideoSeekRegisterContext.Provider>
    </VideoSeekContext.Provider>
  );
}
