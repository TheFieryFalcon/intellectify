<script lang="ts">
  /** Preview of every archive stage (SPEC §13.11), light and dark: the seven eras, nine nights, twelve skies. */
  import "$lib/archive.css";
  import "$lib/archive-tokens.css";
  import Constellations from "$lib/components/economy/Constellations.svelte";

  const ERAS = ["antiquity", "golden-age", "renaissance", "enlightenment", "steam-age", "machine-age", "space-age"];
  const stages = [
    ...ERAS.map((era) => ({ label: era, era, night: 0, stars: 0 })),
    ...Array.from({ length: 9 }, (_, i) => ({ label: `Night ${i + 1}`, era: "space-age", night: i + 1, stars: 0 })),
    ...Array.from({ length: 12 }, (_, i) => ({ label: `Conjectures ${i + 1}`, era: "space-age", night: 9, stars: i + 1 })),
  ];
</script>

<div class="wrap">
  <h1>Archive stages</h1>
  <div class="grid">
    {#each stages as st (st.label)}
      {#each ["light", "dark"] as scheme (scheme)}
        <div class="archive panel" data-scheme={scheme} data-era={st.era} data-night={st.night || undefined} data-stars={st.stars || undefined}>
          {#if st.stars}<Constellations count={st.stars} />{/if}
          <div class="era-band"></div>
          <p class="pl">Pl. I {st.label}, {scheme}</p>
          <h3>Successor Function <span class="num">Lv 12</span></h3>
          <p class="margin">S(n) = n + 1, the first step of every count.</p>
          <div class="btns"><button class="ink-btn">×1 324 ∴</button> <button class="ink-btn pencil" disabled>×10 6.58 k∴</button></div>
          <div class="plate tile">Engraved plate</div>
        </div>
      {/each}
    {/each}
  </div>
</div>

<style>
  h1 { font-size: 28px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 10px; }
  .panel { min-height: 0; padding: 12px 14px; border-radius: 8px; overflow: hidden; }
  h3 { margin: 4px 0; font-size: 17px; }
  .margin { margin: 0 0 8px; }
  .btns { display: flex; gap: 6px; margin-bottom: 8px; }
  .tile { padding: 8px 10px; font-size: 13px; }
</style>
