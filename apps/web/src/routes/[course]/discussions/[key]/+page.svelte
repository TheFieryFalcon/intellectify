<script lang="ts">
  /** One daily problem's discussion (SPEC §14.1): the problem, posts with comments, and a composer. */
  import { page } from "$app/state";
  import { dateOfDay } from "@intellectify/engine";
  import Markdown from "$lib/components/Markdown.svelte";
  import PostBody from "$lib/components/PostBody.svelte";
  import type { Post } from "$lib/backend";
  import { dailyProblem, parseDailyKey } from "$lib/dailyProblem";
  import { loadPosts, noteChange } from "$lib/discussions";
  import { findBanned, loadBannedWords, safeName } from "$lib/moderation";
  import type { Served } from "$lib/practice";
  import { courseProgress, session } from "$lib/session.svelte";
  import { achievementsFor } from "$lib/achievements.svelte";
  import { onPost } from "$lib/achievements";
  import { profileFor } from "$lib/profile.svelte";

  let { data } = $props();
  const key = $derived(page.params.key!);
  const parsed = $derived(parseDailyKey(key));

  let served = $state<Served | null | undefined>(undefined);
  let tier = $state(0);
  let posts = $state<Post[] | null>(null);
  let failed = $state(false);

  $effect(() => {
    const p = parsed;
    if (!p || p.course !== data.course.id) return void (served = null);
    dailyProblem(fetch, data.course, p.day, p.year).then((d) => ((served = d.served), (tier = d.tier)));
  });
  $effect(() => {
    if (!session.backend) return;
    const k = key;
    loadPosts(session.backend, k)
      .then((x) => k === key && (posts = x))
      .catch(() => ((failed = true), (posts = [])));
  });
  $effect(() => void loadBannedWords());

  const top = $derived((posts ?? []).filter((p) => !p.parent || !posts!.some((x) => x.id === p.parent)));
  const commentsOf = (id: string) => (posts ?? []).filter((p) => p.parent === id);

  let draft = $state("");
  let preview = $state(false);
  let replyTo = $state<string | null>(null);
  let reply = $state("");
  let busy = $state(false);
  let error = $state<string | null>(null);

  async function send(body: string, parent: string | null) {
    const user = session.user;
    if (!session.backend || !user || !parsed || !served || busy) return false;
    body = body.trim();
    if (!body) return false;
    if (findBanned(body)) {
      error = "That post has a word that isn't allowed here.";
      return false;
    }
    busy = true;
    error = null;
    try {
      const post = await session.backend.addPost(user, { key, day: parsed.day, course: parsed.course, year: parsed.year, questionId: served.question.id }, body, parent, safeName(user.displayName));
      posts = [...(posts ?? []), post];
      noteChange(key, posts);
      const store = courseProgress(data.course.id);
      if (store) void achievementsFor(session.backend, user, data.course)?.event((s) => onPost(s, key), store, profileFor(session.backend, user));
      // A solution (not a comment) earns XP, at most 3 a day (SPEC §12.4).
      if (!parent) void profileFor(session.backend, user)?.grantPost();
      return true;
    } catch {
      error = "Couldn't post. Try again.";
      return false;
    } finally {
      busy = false;
    }
  }
  async function postTop() {
    if (await send(draft, null)) ((draft = ""), (preview = false));
  }
  async function postReply(parent: string) {
    if (await send(reply, parent)) ((reply = ""), (replyTo = null));
  }
  async function remove(p: Post) {
    if (!session.backend || !confirm("Delete this post?")) return;
    try {
      await session.backend.deletePost(key, p);
      posts = (posts ?? []).filter((x) => x.id !== p.id);
      noteChange(key, posts);
    } catch {
      error = "Couldn't delete. Try again.";
    }
  }

  const dayLabel = (d: string) => new Intl.DateTimeFormat("en-AU", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(dateOfDay(d));
  const when = (t: number) => new Date(t).toLocaleString(undefined, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
</script>

{#snippet postView(p: Post, isComment: boolean)}
  <article class="post" class:comment={isComment}>
    <header>
      <a class="who" href="/profile/{p.uid}">{p.name}</a>
      <span class="muted">{when(p.at)}</span>
      {#if p.uid === session.user?.uid}<button class="link" onclick={() => remove(p)}>Delete</button>{/if}
    </header>
    <PostBody text={p.body} />
    {#if !isComment}
      <div class="post-actions">
        {#if replyTo === p.id}
          <textarea bind:value={reply} rows="3" placeholder="Comment" aria-label="Comment"></textarea>
          <div class="row">
            <button class="btn primary small" disabled={busy || !reply.trim()} onclick={() => postReply(p.id)}>Comment</button>
            <button class="btn quiet small" onclick={() => ((replyTo = null), (reply = ""))}>Cancel</button>
          </div>
        {:else}
          <button class="link" onclick={() => ((replyTo = p.id), (reply = ""))}>Comment</button>
        {/if}
      </div>
    {/if}
  </article>
{/snippet}

<div class="wrap narrow">
  <p class="crumbs"><a href="/{data.course.id}">{data.course.name}</a> › <a href="/{data.course.id}/discussions">Discussions</a></p>

  {#if !parsed}
    <p class="muted">No discussion here</p>
  {:else}
    <h1>Daily problem</h1>
    <dl class="facts">
      <div><dt>Day</dt><dd>{dayLabel(parsed.day)}</dd></div>
      <div><dt>Year</dt><dd>{parsed.year}</dd></div>
      {#if tier}<div><dt>Tier</dt><dd>{tier}</dd></div>{/if}
    </dl>

    {#if served === undefined}
      <p class="muted">Loading…</p>
    {:else if served === null}
      <p class="muted">No daily problem that day</p>
    {:else}
      <section class="card problem">
        <Markdown text={served.question.stem} />
        {#each served.question.parts as p (p.id)}
          {#if p.prompt}<div class="part"><span class="muted">({p.id})</span> <Markdown text={p.prompt} inline /></div>{/if}
        {/each}
        <details>
          <summary>Solution</summary>
          <Markdown text={served.question.solution} />
        </details>
      </section>

      <h2>Posts <span class="muted">{posts?.length ?? ""}</span></h2>
      {#if failed}<p class="bad">Couldn't load posts</p>{/if}
      {#if posts === null}
        <p class="muted">Loading…</p>
      {:else if !top.length}
        <p class="muted">No posts yet</p>
      {:else}
        {#each top as p (p.id)}
          <div class="thread">
            {#if p.parent}<p class="muted small">Reply to a deleted post</p>{/if}
            {@render postView(p, false)}
            {#each commentsOf(p.id) as c (c.id)}{@render postView(c, true)}{/each}
          </div>
        {/each}
      {/if}

      <section class="compose">
        <div class="tabs">
          <button class:on={!preview} onclick={() => (preview = false)}>Write</button>
          <button class:on={preview} onclick={() => (preview = true)} disabled={!draft.trim()}>Preview</button>
        </div>
        {#if preview}
          <div class="preview"><PostBody text={draft} /></div>
        {:else}
          <textarea bind:value={draft} rows="6" placeholder="Share a solution, hint or question" aria-label="Post"></textarea>
        {/if}
        <div class="row">
          <span class="muted small">Markdown and LaTeX, spoilers: <code>||hint: hidden text||</code></span>
          <button class="btn primary" disabled={busy || !draft.trim()} onclick={postTop}>Post</button>
        </div>
        {#if error}<p class="bad small">{error}</p>{/if}
      </section>
    {/if}
  {/if}
</div>

<style>
  .crumbs { margin: 0 0 14px; font-size: 13px; color: var(--muted); }
  .crumbs a { color: var(--muted); text-decoration: none; }
  h1 { margin: 0 0 8px; font-size: 24px; }
  .facts { display: flex; gap: 6px 22px; margin: 0 0 14px; flex-wrap: wrap; }
  .facts div { display: flex; flex-direction: column; }
  dt { font-size: 11px; color: var(--muted); }
  dd { margin: 0; font-weight: 500; }
  .card { background: var(--surface); border: 1px solid var(--line); border-radius: 12px; padding: 18px 20px; }
  .part { margin: 6px 0; }
  details { margin-top: 12px; }
  summary { cursor: pointer; font-size: 13px; color: var(--muted); }
  h2 { font-family: var(--font-body); font-size: 14px; font-weight: 600; margin: 22px 0 10px; }
  .thread { background: var(--surface); border: 1px solid var(--line); border-radius: 10px; margin-bottom: 10px; overflow: hidden; }
  .post { padding: 12px 16px; }
  .post.comment { margin-left: 22px; border-left: 2px solid var(--line); padding: 8px 14px; }
  .post header { display: flex; gap: 10px; align-items: baseline; font-size: 12px; margin-bottom: 6px; }
  .who { font-weight: 600; color: var(--ink); text-decoration: none; font-size: 13px; }
  .who:hover { color: var(--accent); }
  .post-actions { margin-top: 6px; display: flex; flex-direction: column; gap: 6px; }
  .link { font: inherit; font-size: 12px; background: none; border: 0; padding: 0; color: var(--muted); cursor: pointer; text-decoration: underline; align-self: flex-start; }
  .compose { margin-top: 18px; display: flex; flex-direction: column; gap: 8px; }
  .tabs { display: flex; gap: 4px; }
  .tabs button { font: inherit; font-size: 13px; background: none; border: 0; padding: 4px 10px; border-radius: 6px; color: var(--muted); cursor: pointer; }
  .tabs button.on { background: var(--region); color: var(--ink); }
  textarea { font: inherit; width: 100%; box-sizing: border-box; border: 1px solid var(--line); border-radius: 8px; padding: 10px 12px; background: var(--surface); color: var(--ink); resize: vertical; }
  .preview { border: 1px dashed var(--line); border-radius: 8px; padding: 10px 12px; min-height: 80px; background: var(--surface); }
  .row { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; }
  .post-actions .row { justify-content: flex-start; }
  .small { font-size: 12px; }
  .btn.small { padding: 4px 10px; font-size: 13px; }
  code { font-size: 12px; }
  .bad { color: var(--bad); }
</style>
