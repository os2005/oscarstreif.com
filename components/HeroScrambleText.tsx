"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";

type TextPart = {
  text: string;
  highlighted?: boolean;
};

type HeroScrambleTextProps = {
  parts: TextPart[];
};

type CharacterMeta = {
  char: string;
  globalIndex: number | null;
};

type PreparedPart = TextPart & {
  characters: CharacterMeta[];
};

const SCRAMBLE_SET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789∙·•/\\|_-";
const CHAR_STAGGER_MS = 24;
const SCRAMBLE_STEP_MS = 34;
const BASE_SCRAMBLE_STEPS = 4;
const EXTRA_SCRAMBLE_STEPS = 4;
const SETTLE_PADDING_MS = 120;

function splitCharacters(text: string, startIndex: number) {
  let nextIndex = startIndex;
  const characters: CharacterMeta[] = [];

  for (const char of text) {
    if (char === " ") {
      characters.push({ char, globalIndex: null });
      continue;
    }

    characters.push({ char, globalIndex: nextIndex });
    nextIndex += 1;
  }

  return {
    characters,
    nextIndex,
  };
}

function getScrambleSteps(globalIndex: number) {
  return BASE_SCRAMBLE_STEPS + (globalIndex % (EXTRA_SCRAMBLE_STEPS + 1));
}

function getCharacterDelay(globalIndex: number) {
  return globalIndex * CHAR_STAGGER_MS;
}

function getCharacterDuration(globalIndex: number) {
  return getScrambleSteps(globalIndex) * SCRAMBLE_STEP_MS;
}

function getRandomCharacter(target: string, phase: number, globalIndex: number) {
  const seed = globalIndex * 17 + phase * 13;
  const char = SCRAMBLE_SET[seed % SCRAMBLE_SET.length] ?? target;

  return target === target.toLowerCase() ? char.toLowerCase() : char;
}

export function HeroScrambleText({ parts }: HeroScrambleTextProps) {
  const hasAnimatedRef = useRef(false);
  const [elapsed, setElapsed] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  const preparedParts = useMemo<PreparedPart[]>(() => {
    return parts.reduce<{ items: PreparedPart[]; nextIndex: number }>(
      (accumulator, part) => {
        const result = splitCharacters(part.text, accumulator.nextIndex);

        accumulator.items.push({
          ...part,
          characters: result.characters,
        });

        return {
          items: accumulator.items,
          nextIndex: result.nextIndex,
        };
      },
      { items: [], nextIndex: 0 }
    ).items;
  }, [parts]);

  const finalText = useMemo(() => parts.map((part) => part.text).join(""), [parts]);
  const animatedCharacterCount = useMemo(
    () => preparedParts.flatMap((part) => part.characters).filter((character) => character.globalIndex !== null).length,
    [preparedParts]
  );

  const totalDuration = useMemo(() => {
    if (animatedCharacterCount === 0) {
      return 0;
    }

    const finalIndex = animatedCharacterCount - 1;
    return getCharacterDelay(finalIndex) + getCharacterDuration(finalIndex) + SETTLE_PADDING_MS;
  }, [animatedCharacterCount]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReducedMotion(mediaQuery.matches);

    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);

    return () => {
      mediaQuery.removeEventListener("change", updatePreference);
    };
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      return;
    }

    if (hasAnimatedRef.current || totalDuration === 0) {
      return;
    }

    hasAnimatedRef.current = true;

    const startedAt = performance.now();
    const intervalId = window.setInterval(() => {
      const nextElapsed = Math.min(performance.now() - startedAt, totalDuration);
      setElapsed(nextElapsed);

      if (nextElapsed >= totalDuration) {
        window.clearInterval(intervalId);
      }
    }, SCRAMBLE_STEP_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [reducedMotion, totalDuration]);

  const displayElapsed = reducedMotion ? totalDuration : elapsed;

  return (
    <span aria-label={finalText}>
      <span className="sr-only">{finalText}</span>
      <span aria-hidden="true">
        {preparedParts.map((part, partIndex) => {
          const highlightedReady =
            !part.highlighted ||
            part.characters.every((character) => {
              if (character.globalIndex === null) return true;
              return displayElapsed >= getCharacterDelay(character.globalIndex) + getCharacterDuration(character.globalIndex);
            });

          return (
            <span
              className={part.highlighted ? `hero-accent hero-accent-noise${highlightedReady ? " hero-accent-noise-ready" : ""}` : undefined}
              key={`${part.text}-${partIndex}`}
            >
              {part.characters.map((character, index) => {
                if (character.char === " ") {
                  return <span key={`space-${partIndex}-${index}`}> </span>;
                }

                const globalIndex = character.globalIndex ?? 0;
                const delay = getCharacterDelay(globalIndex);
                const duration = getCharacterDuration(globalIndex);
                const phase = Math.max(0, displayElapsed - delay);
                const isStarted = displayElapsed >= delay;
                const isFinal = displayElapsed >= delay + duration;
                const scramblePhase = Math.max(0, Math.floor(phase / SCRAMBLE_STEP_MS));
                const displayChar = isFinal ? character.char : getRandomCharacter(character.char, scramblePhase, globalIndex);

                return (
                  <span className="hero-char" key={`${partIndex}-${index}`}>
                    <span className="hero-char-placeholder">{character.char}</span>
                    <span
                      className={`hero-char-live ${
                        !isStarted ? "hero-char-live-pending" : isFinal ? "hero-char-live-final" : "hero-char-live-active"
                      }`}
                    >
                      {displayChar}
                    </span>
                  </span>
                );
              })}
            </span>
          );
        })}
      </span>
    </span>
  );
}

export default memo(HeroScrambleText);
