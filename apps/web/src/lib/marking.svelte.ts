/**
 * Free-response marking queue (SPEC §10.2). Answers are saved as jobs first, then marked one at a
 * time: by /api/mark (the free, shared Gemini key) or directly by the student's own key (SPEC §10.4).
 * Busy or offline: the job waits and retries with backoff, and resumes on the next visit. A result is
 * applied to θ, ranks, XP and achievements when it lands, using θ as it is then.
 */
import {
  GEMINI_ENDPOINT,
  MARKING_MODELS,
  MARK_SCHEMA,
  markingMessages,
  markWithModels,
  MarkingError,
  scoreMarking,
  type Appeal,
  type MarkResult,
} from "@intellectify/content/marking";
import { fillTemplate } from "@intellectify/content/template";
import type { Backend, MarkingJob, User } from "./backend";
import { loadByok, type Byok } from "./byok";
import { loadCourse, loadQuestions, type QuestionT } from "./content";
import { achievementsFor } from "./achievements.svelte";
import { profileFor } from "./profile.svelte";
import { recordAppeal, recordMarked } from "./record";
import { courseProgress } from "./session.svelte";

/** "Marked" toasts for the layout to show. */
export const markingToasts = $state<{ jobId: string; course: string; score: number; appeal: boolean }[]>([]);

const MIN_DELAY = 15_000;
const MAX_DELAY = 30 * 60_000;
/** Backoff: 15 s, 30 s, 1 min, … capped at 30 min, ±20% jitter; Retry-After wins if longer. */
export function nextDelay(attempts: number, retryAfterMs = 0): number {
  const base = Math.min(MAX_DELAY, MIN_DELAY * 2 ** Math.max(0, attempts - 1));
  return Math.max(retryAfterMs, Math.round(base * (0.8 + Math.random() * 0.4)));
}

/** The filled question a job was answered on (null if it no longer exists). */
export async function jobQuestion(job: Pick<MarkingJob, "course" | "skill" | "questionId" | "variant">): Promise<QuestionT | null> {
  const pool = await loadQuestions(fetch, job.course, job.skill);
  const q = pool.find((x) => x.id === job.questionId);
  if (!q) return null;
  if (job.variant === null) return q;
  const v = q.variants?.[job.variant];
  return v ? fillTemplate(q, v) : null;
}

class RetryLater extends Error {
  constructor(
    message: string,
    readonly retryAfterMs = 0,
  ) {
    super(message);
  }
}
class GiveUp extends Error {}

/** Mark with the student's own key, straight from the browser. */
async function markWithOwnKey(byok: Byok, question: QuestionT, answers: Record<string, string>, appeal?: Appeal): Promise<MarkResult> {
  if (byok.provider === "anthropic") {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey: byok.key, dangerouslyAllowBrowser: true, maxRetries: 1 });
    const [system, user] = markingMessages(question, answers, appeal);
    try {
      const res = await client.beta.messages.create({
        model: "claude-opus-5-5",
        max_tokens: 16000,
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        output_config: { effort: "medium", format: { type: "json_schema", schema: MARK_SCHEMA as unknown as Record<string, unknown> } },
        system: system!.content,
        messages: [{ role: "user", content: user!.content }],
      });
      if (res.stop_reason === "refusal") throw new GiveUp("Claude declined to mark this answer.");
      if (res.stop_reason === "max_tokens") throw new RetryLater("Claude's reply was cut off.");
      const text = res.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
      return scoreMarking(question, text, res.model);
    } catch (e) {
      if (e instanceof GiveUp || e instanceof RetryLater) throw e;
      if (e instanceof Anthropic.AuthenticationError || e instanceof Anthropic.PermissionDeniedError) throw new GiveUp("Your Claude key was refused. Check it in Settings.");
      if (e instanceof Anthropic.RateLimitError) throw new RetryLater("Your Claude key is rate-limited.", 60_000);
      if (e instanceof Anthropic.APIError) throw new RetryLater(`Claude: ${e.message}`);
      throw new RetryLater((e as Error).message);
    }
  }
  const openai = byok.provider === "openai";
  try {
    return await markWithModels({
      question,
      answers,
      appeal,
      endpoint: openai ? "https://api.openai.com/v1/chat/completions" : GEMINI_ENDPOINT,
      key: byok.key,
      models: openai ? ["gpt-5-mini"] : MARKING_MODELS,
      reasoningEffort: "low",
    });
  } catch (e) {
    const err = e instanceof MarkingError ? e : new MarkingError((e as Error).message, 503);
    if (err.status === 401 || err.status === 403) throw new GiveUp(`Your ${openai ? "OpenAI" : "Gemini"} key was refused. Check it in Settings.`);
    throw new RetryLater(err.message, err.status === 429 ? 60_000 : 0);
  }
}

/** Mark with the free shared key on the server. */
async function markOnServer(backend: Backend, job: MarkingJob, appeal?: Appeal): Promise<MarkResult> {
  const token = await backend.idToken();
  let res: Response;
  try {
    res = await fetch("/api/mark", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ course: job.course, skill: job.skill, questionId: job.questionId, variant: job.variant, answers: job.answers, appeal }),
    });
  } catch {
    throw new RetryLater("Offline");
  }
  const body = (await res.json().catch(() => ({}))) as { result?: MarkResult; error?: string };
  if (res.ok && body.result) return body.result;
  const retryAfter = Number(res.headers.get("Retry-After")) * 1000 || 0;
  // Unknown question, bad request: retrying won't help.
  if (res.status === 400 || res.status === 404 || res.status === 405) throw new GiveUp(body.error ?? `HTTP ${res.status}`);
  throw new RetryLater(body.error ?? `HTTP ${res.status}`, retryAfter);
}

export class MarkingQueue {
  jobs = $state<MarkingJob[]>([]);
  loaded = $state(false);
  /** Job id being marked right now. */
  busy = $state<string | null>(null);
  private timer: ReturnType<typeof setTimeout> | null = null;
  private loading: Promise<void> | null = null;
  private applying = new Set<string>();

  constructor(
    private readonly backend: Backend,
    private readonly user: User,
  ) {}

  load(): Promise<void> {
    return (this.loading ??= (async () => {
      try {
        this.jobs = await this.backend.loadMarkingJobs(this.user.uid);
      } catch {
        this.jobs = [];
      }
      this.loaded = true;
      this.schedule(0);
    })());
  }

  job(id: string) {
    return this.jobs.find((j) => j.id === id) ?? null;
  }

  /** Answers waiting for a mark (first marks and appeals). */
  get waiting() {
    return this.jobs.filter((j) => j.status === "pending" || j.appeal?.status === "pending").length;
  }

  /** Queue an answer for marking. Saved before anything else, so it survives closing the app. */
  async submit(input: { course: string; skill: string; question: QuestionT; variant: number | null; answers: Record<string, string> }): Promise<MarkingJob> {
    await this.load();
    const now = Date.now();
    const job: MarkingJob = {
      id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
      course: input.course,
      skill: input.skill,
      questionId: input.question.id,
      questionVersion: input.question.version,
      variant: input.variant,
      answers: input.answers,
      createdAt: now,
      status: "pending",
      attempts: 0,
      nextTryAt: now,
      lastError: null,
      result: null,
      applied: false,
      appeal: null,
    };
    await this.put(job);
    this.schedule(0);
    return job;
  }

  /** One appeal per marked answer (SPEC §10.3). */
  async appeal(jobId: string, argument: string) {
    const job = this.job(jobId);
    if (!job || job.status !== "marked" || job.appeal) return;
    await this.put({ ...job, appeal: { argument, status: "pending", attempts: 0, nextTryAt: Date.now(), lastError: null, result: null, applied: false } });
    this.schedule(0);
  }

  /** Try now (the "Retry" button). */
  retryNow(jobId: string) {
    const job = this.job(jobId);
    if (!job) return;
    if (job.status === "pending") void this.put({ ...job, nextTryAt: Date.now() });
    else if (job.appeal?.status === "pending") void this.put({ ...job, appeal: { ...job.appeal, nextTryAt: Date.now() } });
    this.schedule(0);
  }

  stop() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
  }

  private async put(job: MarkingJob) {
    const i = this.jobs.findIndex((j) => j.id === job.id);
    this.jobs = i < 0 ? [job, ...this.jobs] : this.jobs.map((j) => (j.id === job.id ? job : j));
    try {
      await this.backend.saveMarkingJob(this.user.uid, job);
    } catch {
      /* kept in memory; saved again on the next change */
    }
  }

  /** Run again when the next job is due. */
  private schedule(ms: number) {
    if (typeof window === "undefined") return;
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => void this.tick(), Math.max(0, ms));
  }

  private async tick() {
    this.timer = null;
    if (this.busy) return;
    // Apply any results not yet applied (e.g. marked on another device, or before a reload).
    for (const job of this.jobs) void this.apply(job);

    const now = Date.now();
    const due = this.jobs
      .filter((j) => (j.status === "pending" && j.nextTryAt <= now) || (j.appeal?.status === "pending" && j.appeal.nextTryAt <= now))
      .sort((a, b) => a.createdAt - b.createdAt)[0];
    if (due) await this.attempt(due);

    const next = Math.min(
      ...this.jobs.flatMap((j) => [j.status === "pending" ? j.nextTryAt : Infinity, j.appeal?.status === "pending" ? j.appeal.nextTryAt : Infinity]),
    );
    if (Number.isFinite(next)) this.schedule(next - Date.now());
  }

  private async attempt(job: MarkingJob) {
    const isAppeal = job.status === "marked" && job.appeal?.status === "pending";
    this.busy = job.id;
    try {
      const question = await jobQuestion(job);
      if (!question) throw new GiveUp("This question no longer exists.");
      const appeal: Appeal | undefined = isAppeal ? { argument: job.appeal!.argument, previous: job.result! } : undefined;
      const byok = loadByok();
      const result = byok ? await markWithOwnKey(byok, question, job.answers, appeal) : await markOnServer(this.backend, job, appeal);
      const updated: MarkingJob = isAppeal
        ? { ...job, appeal: { ...job.appeal!, status: "marked", result, lastError: null, attempts: job.appeal!.attempts + 1 } }
        : { ...job, status: "marked", result, lastError: null, attempts: job.attempts + 1 };
      await this.put(updated);
      await this.apply(updated);
      markingToasts.push({ jobId: job.id, course: job.course, score: result.score, appeal: isAppeal });
    } catch (e) {
      const msg = (e as Error).message;
      if (e instanceof GiveUp) {
        await this.put(isAppeal ? { ...job, appeal: { ...job.appeal!, status: "failed", lastError: msg } } : { ...job, status: "failed", lastError: msg });
      } else {
        const retryAfter = e instanceof RetryLater ? e.retryAfterMs : 0;
        if (isAppeal) {
          const a = job.appeal!;
          await this.put({ ...job, appeal: { ...a, attempts: a.attempts + 1, nextTryAt: Date.now() + nextDelay(a.attempts + 1, retryAfter), lastError: msg } });
        } else {
          await this.put({ ...job, attempts: job.attempts + 1, nextTryAt: Date.now() + nextDelay(job.attempts + 1, retryAfter), lastError: msg });
        }
      }
    } finally {
      this.busy = null;
    }
  }

  /** Apply a mark (or an appeal's correction) to progress, once. */
  private async apply(job: MarkingJob) {
    const first = job.status === "marked" && job.result && !job.applied;
    const appeal = job.applied && job.appeal?.status === "marked" && job.appeal.result && !job.appeal.applied;
    if ((!first && !appeal) || this.applying.has(job.id)) return;
    this.applying.add(job.id);
    try {
      const [course, question] = await Promise.all([loadCourse(fetch, job.course), jobQuestion(job)]);
      const store = courseProgress(job.course);
      if (!question || !store) return;
      await store.ready;
      const profile = profileFor(this.backend, this.user);
      if (first) {
        await recordMarked({
          course,
          store,
          profile,
          achievements: achievementsFor(this.backend, this.user, course),
          question,
          variant: job.variant,
          answers: job.answers,
          mark: job.result!,
          jobId: job.id,
        });
        await this.put({ ...(this.job(job.id) ?? job), applied: true });
      } else {
        await recordAppeal({ course, store, profile, question, first: job.result!, second: job.appeal!.result! });
        const cur = this.job(job.id) ?? job;
        await this.put({ ...cur, appeal: { ...cur.appeal!, applied: true } });
      }
    } finally {
      this.applying.delete(job.id);
    }
  }
}

let current: { key: string; queue: MarkingQueue } | null = null;
/** The signed-in student's marking queue, loaded on first use. */
export function markingFor(backend: Backend | null, user: User | null): MarkingQueue | null {
  if (!backend || !user) return null;
  if (current?.key !== user.uid) {
    current?.queue.stop();
    current = { key: user.uid, queue: new MarkingQueue(backend, user) };
    void current.queue.load();
  }
  return current.queue;
}
