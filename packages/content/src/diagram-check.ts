import { mapDiagrams, renderDiagram } from "./diagram.js";

/** Parse and render every diagram in a Markdown string; return the problems found (SPEC §9.4). */
export function diagramErrors(markdown: string): string[] {
  const errors: string[] = [];
  mapDiagrams(
    markdown,
    (d) => {
      try {
        renderDiagram(d);
      } catch (err) {
        errors.push(`diagram failed to render: ${(err as Error).message}`);
      }
      return "";
    },
    (err) => (errors.push(err.message), ""),
  );
  return errors;
}
