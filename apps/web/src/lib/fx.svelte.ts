/**
 * Answer celebrations (SPEC §13.8): the equipped one plays on a correct answer and on a rank-up. The
 * overlay in the layout watches this; reduced motion shows a still frame.
 */
export const fx = $state<{ play: { id: string; kind: "correct" | "rankUp"; at: number } | null }>({ play: null });

export function playCelebration(id: string | null | undefined, kind: "correct" | "rankUp") {
  if (!id) return;
  fx.play = { id, kind, at: Date.now() };
}
