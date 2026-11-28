<script lang="ts">
  /**
   * Handwriting pad (SPEC §7.2): write maths with a stylus (or a finger or mouse), read it to LaTeX, check
   * the typeset result, then put it in the answer. Once a pen is used, touches are ignored (palm rejection).
   */
  import katex from "katex";
  import { recognizeInk, type InkResult, type Stroke } from "$lib/ink";
  import { session } from "$lib/session.svelte";

  let { oninsert }: { oninsert: (latex: string) => void } = $props();

  const uid = `ink-${Math.random().toString(36).slice(2, 9)}`;
  let dialog = $state<HTMLDialogElement>();
  let canvas = $state<HTMLCanvasElement>();
  let strokes = $state<Stroke[]>([]);
  let current: Stroke | null = null;
  let penSeen = false;
  let t0 = 0;
  let reading = $state(false);
  let result = $state<InkResult | null>(null);
  let error = $state<string | null>(null);

  export function open() {
    strokes = [];
    result = null;
    error = null;
    dialog?.showModal();
    requestAnimationFrame(resize);
  }

  function resize() {
    if (!canvas) return;
    const r = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(r.width * dpr);
    canvas.height = Math.round(r.height * dpr);
    draw();
  }

  function draw() {
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = getComputedStyle(canvas).color;
    for (const s of strokes) {
      ctx.beginPath();
      s.x.forEach((x, i) => (i ? ctx.lineTo(x, s.y[i]!) : ctx.moveTo(x, s.y[i]!)));
      if (s.x.length === 1) ctx.lineTo(s.x[0]! + 0.1, s.y[0]!);
      ctx.stroke();
    }
  }

  const point = (e: PointerEvent) => {
    const r = canvas!.getBoundingClientRect();
    return [Math.round((e.clientX - r.left) * 10) / 10, Math.round((e.clientY - r.top) * 10) / 10] as const;
  };
  function down(e: PointerEvent) {
    if (e.pointerType === "pen") penSeen = true;
    else if (penSeen && e.pointerType === "touch") return;
    if (result) return;
    e.preventDefault();
    canvas!.setPointerCapture(e.pointerId);
    if (!strokes.length) t0 = performance.now();
    const [x, y] = point(e);
    current = { x: [x], y: [y], t: [Math.round(performance.now() - t0)] };
    strokes = [...strokes, current];
  }
  function move(e: PointerEvent) {
    if (!current) return;
    for (const ev of e.getCoalescedEvents?.() ?? [e]) {
      const [x, y] = point(ev);
      current.x.push(x);
      current.y.push(y);
      current.t.push(Math.round(performance.now() - t0));
    }
    draw();
  }
  function up() {
    current = null;
    draw();
  }

  /** The ink on white, for the AI reader. */
  function picture(): string {
    const out = document.createElement("canvas");
    out.width = canvas!.width;
    out.height = canvas!.height;
    const ctx = out.getContext("2d")!;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, out.width, out.height);
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "#000";
    for (const s of strokes) {
      ctx.beginPath();
      s.x.forEach((x, i) => (i ? ctx.lineTo(x, s.y[i]!) : ctx.moveTo(x, s.y[i]!)));
      ctx.stroke();
    }
    return out.toDataURL("image/png");
  }

  async function read() {
    if (!strokes.length || reading) return;
    reading = true;
    error = null;
    try {
      const r = canvas!.getBoundingClientRect();
      result = await recognizeInk(session.backend, strokes, { width: r.width, height: r.height }, picture);
      if (!result.latex) {
        result = null;
        error = "Couldn't read that. Try writing larger.";
      }
    } catch (err) {
      error = (err as Error).message || "Couldn't read that. Try again.";
    } finally {
      reading = false;
    }
  }

  function use() {
    if (!result) return;
    oninsert(result.latex);
    dialog?.close();
  }
  const undo = () => {
    strokes = strokes.slice(0, -1);
    draw();
  };
  const clear = () => {
    strokes = [];
    result = null;
    draw();
  };
  const tex = (latex: string) => katex.renderToString(latex, { throwOnError: false, displayMode: true, strict: "ignore" });
</script>

<svelte:window onresize={() => dialog?.open && resize()} />

<dialog bind:this={dialog} class="ink" aria-labelledby="{uid}-title">
  <header>
    <h2 id="{uid}-title">Handwriting</h2>
    <button type="button" class="close" aria-label="Close" onclick={() => dialog?.close()}>×</button>
  </header>
  {#if result}
    <div class="result" aria-live="polite">{@html tex(result.latex)}</div>
    {#if result.via === "ai"}<p class="muted small">Read by AI: check it</p>{/if}
    <div class="row">
      <button type="button" class="btn" onclick={() => (result = null)}>Write again</button>
      <button type="button" class="btn primary" onclick={use}>Use this</button>
    </div>
  {:else}
    <canvas bind:this={canvas} class="pad" aria-label="Write maths here" onpointerdown={down} onpointermove={move} onpointerup={up} onpointercancel={up}></canvas>
    {#if error}<p class="bad small" role="status">{error}</p>{/if}
    <div class="row">
      <button type="button" class="btn quiet" onclick={undo} disabled={!strokes.length || reading}>Undo</button>
      <button type="button" class="btn quiet" onclick={clear} disabled={!strokes.length || reading}>Clear</button>
      <button type="button" class="btn primary" onclick={read} disabled={!strokes.length || reading}>{reading ? "Reading" : "Read"}</button>
    </div>
  {/if}
</dialog>

<style>
  .ink { width: min(680px, calc(100vw - 24px)); box-sizing: border-box; border: 1px solid var(--line); border-radius: 14px; padding: 16px 18px 18px; background: var(--surface); color: var(--ink); box-shadow: 0 16px 48px rgb(0 0 0 / 0.25); }
  .ink::backdrop { background: rgb(15 20 30 / 0.45); }
  header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
  h2 { margin: 0; font-size: 18px; }
  .close { font: inherit; font-size: 24px; line-height: 1; padding: 2px 8px; border: 0; background: none; color: var(--muted); cursor: pointer; border-radius: 6px; }
  .pad { display: block; width: 100%; height: 240px; border: 1px dashed var(--edge); border-radius: 10px; background: var(--bg); color: var(--ink); touch-action: none; cursor: crosshair; }
  .result { min-height: 80px; display: flex; align-items: center; justify-content: center; overflow-x: auto; border: 1px solid var(--line); border-radius: 10px; padding: 12px; font-size: 18px; }
  .row { display: flex; justify-content: flex-end; gap: 8px; margin-top: 12px; }
  .small { font-size: 12px; margin: 6px 0 0; }
  .bad { color: var(--bad); }
  @media (max-width: 640px) {
    .ink { margin: auto 0 0; width: 100vw; max-width: 100vw; border-radius: 14px 14px 0 0; }
    .pad { height: 200px; }
  }
</style>
