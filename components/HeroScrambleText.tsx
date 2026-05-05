"use client";

import { useEffect, useMemo, useState } from "react";

type TextPart = {
  text: string;
  highlighted?: boolean;
};

type HeroScrambleTextProps = {
  parts: TextPart[];
};

type CharacterMeta = {
  char: string;
  order: number | null;
};

const SCRAMBLE_SET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*?";
const STAGGER_MS = 28;
const SCRAMBLE_MS = 220;

function buildCharacterMeta(text: string, startOrder: number) {
  let order = startOrder;
  const characters: CharacterMeta[] = [];

  for (const char of text) {
    if (char === " ") {
      characters.push({ char, order: null });
      continue;
    }

    characters.push({ char, order });
    order += 1;
  }

  return {
    characters,
    nextOrder: order,
  };
}

function getScrambledCharacter(target: string, elapsed: number, order: number) {
  if (target === " ") {
    return target;
  }

  const index = Math.abs(Math.floor(elapsed / 30) + order * 11) % SCRAMBLE_SET.length;
  const candidate = SCRAMBLE_SET[index] ?? target;

  if (target === target.toLowerCase()) {
    return candidate.toLowerCase();
  }

  return candidate;
}

export function HeroScrambleText({ parts }: HeroScrambleTextProps) {
  const [elapsed, setElapsed] = useState(0);

  const preparedParts = useMemo(() => {
    return parts.reduce<
      Array<
        TextPart & {
          characters: CharacterMeta[];
        }
      >
    >((accumulator, part) => {
      const currentOrder = accumulator.reduce(
        (count, entry) => count + entry.characters.filter((character) => character.order !== null).length,
        0
      );
      const result = buildCharacterMeta(part.text, currentOrder);

      accumulator.push({
        ...part,
        characters: result.characters,
      });

      return accumulator;
    }, []);
  }, [parts]);

  const finalText = useMemo(() => parts.map((part) => part.text).join(""), [parts]);
  const totalAnimatedCharacters = useMemo(
    () => preparedParts.flatMap((part) => part.characters).filter((character) => character.order !== null).length,
    [preparedParts]
  );

  useEffect(() => {
    let frame = 0;
    const start = performance.now();
    const totalDuration = totalAnimatedCharacters * STAGGER_MS + SCRAMBLE_MS + 120;

    const tick = (now: number) => {
      const nextElapsed = now - start;
      setElapsed(nextElapsed >= totalDuration ? totalDuration : nextElapsed);

      if (nextElapsed < totalDuration) {
        frame = window.requestAnimationFrame(tick);
      }
    };

    frame = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [totalAnimatedCharacters]);

  return (
    <>
      <span className="sr-only">{finalText}</span>
      <span aria-hidden="true">
        {preparedParts.map((part, partIndex) => (
          <span className={part.highlighted ? "hero-accent hero-accent-noise" : undefined} key={`${part.text}-${partIndex}`}>
            {part.characters.map((character, index) => {
              if (character.char === " ") {
                return <span key={`space-${partIndex}-${index}`}> </span>;
              }

              const start = (character.order ?? 0) * STAGGER_MS;
              const isFinal = elapsed >= start + SCRAMBLE_MS;
              const isActive = elapsed >= start && !isFinal;
              const scrambleChar = character.order === null ? character.char : getScrambledCharacter(character.char, elapsed - start, character.order);

              return (
                <span className="hero-char" key={`${partIndex}-${index}`}>
                  <span className={isFinal ? "hero-char-final" : "hero-char-placeholder"}>{character.char}</span>
                  {!isFinal ? (
                    <span className={`hero-char-overlay ${isActive ? "hero-char-overlay-active" : "hero-char-overlay-pending"}`}>
                      {isActive ? scrambleChar : character.char}
                    </span>
                  ) : null}
                </span>
              );
            })}
          </span>
        ))}
      </span>
    </>
  );
}
