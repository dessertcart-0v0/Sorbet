// ──────────────────────────────────────────────
// Routes: 소르베 백그라운드 생성  (prefix: /api/sorbet-runs)
// ──────────────────────────────────────────────
//
//   POST   /            { chatId, payload, images?, connectionId?, userTurn?, maxConcurrent? }  → { runId }   즉시 반환
//                        동시 상한을 넘으면 429 { error, limit, active } — 클라이언트가 기다렸다 다시 보낸다
//   GET    /:runId      → { status, partial, content, error }
//   POST   /:runId/abort
//   DELETE /:runId      결과 회수 후 정리
//
// 서버가 자기 자신의 /api/generate/dryRun 을 호출한다. 그 소켓의 주인이
// 모바일 브라우저가 아니라 서버 자신이라, 모바일이 끊겨도 엔진의
// req.raw.on("close") → abortController.abort() 가 터지지 않는다.
//
// 이미지가 붙으면 dryRun 한 번으로는 안 된다 — dryRun 요청에는 이미지를 실을 칸이 없다.
// 그래서 브라우저와 같은 두 단계를 서버가 대신 한다:
//   1) dryRun(returnPrompt:true) 로 조립된 프롬프트만 받는다 (LLM 호출 없음)
//   2) 마지막 user 턴에 이미지를 붙여 /api/generate/raw 로 스트리밍 생성한다
// raw 도 dryRun 과 같은 SSE(token/result/done)를 보내므로 받는 쪽은 그대로 쓴다.
//
// 루프백 호출에 필요한 헤더는 X-Marinara-CSRF 하나뿐임을 실측으로 확인했다
// (Basic Auth · TRUSTED_HOSTS · CSRF 모두 루프백에는 걸리지 않음).
//
// 주의: 패치 도구의 문법 검사를 통과하도록 import 는 한 줄로, top-level await 는 쓰지 않는다.
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { SORBET_RUNS_MAX_CONCURRENT, SORBET_RUNS_MAX_CONCURRENT_CAP, appendToken, countActiveRuns, createRun, deleteRun, ensureRunsDir, finishRun, getLiveRun, readFinishedRun, sweepRuns, validateRunId } from "../services/storage/sorbet-runs.storage.js";

const ENGINE_PORT = process.env.PORT || "7860";
const ENGINE_BASE = `http://127.0.0.1:${ENGINE_PORT}`;
const CSRF_HEADERS = { "Content-Type": "application/json", "X-Marinara-CSRF": "1" };

const startSchema = z.object({
  chatId: z.string().regex(/^[A-Za-z0-9_-]{1,128}$/),
  payload: z.record(z.unknown()),
  images: z.array(z.string().min(1)).max(8).optional(),
  connectionId: z.string().min(1).max(200).optional(),
  userTurn: z.string().max(2000).optional(),
  // 동시 생성 상한(클라이언트 설정). 없으면 기본값, 있어도 CAP 을 넘지 못한다.
  maxConcurrent: z.number().int().min(1).max(SORBET_RUNS_MAX_CONCURRENT_CAP).optional(),
});

// raw 가 받는 파라미터 키. 모르는 키가 섞이면 raw 가 400 으로 거절한다(strict).
const RAW_PARAM_KEYS = ["temperature", "maxTokens", "maxContext", "topP", "topK", "minP",
  "frequencyPenalty", "presencePenalty", "reasoningEffort", "verbosity", "serviceTier",
  "customParameters", "enabledParameters"];

/* SSE 프레임 하나를 파싱한다. 클라이언트(Sorbet_v1.0.0.js)의 파서와 같은 규칙. */
function parseFrame(frame) {
  const dataText = frame
    .split("\n")
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).replace(/^ /, ""))
    .join("\n");
  if (!dataText) return null;   // keepalive 주석 등
  try {
    return JSON.parse(dataText);
  } catch {
    return null;
  }
}

/* 엔진의 dryRun 을 스트리밍으로 받아 run 에 누적한다. 라우트 응답과 분리해
   돌리므로(await 하지 않음) 클라이언트는 runId 만 받고 바로 끊어도 된다. */
async function pumpDryRun(run, payload) {
  let response;
  try {
    response = await fetch(`${ENGINE_BASE}/api/generate/dryRun`, {
      method: "POST",
      headers: CSRF_HEADERS,
      body: JSON.stringify({ ...payload, chatId: run.chatId, streaming: true }),
    });
  } catch (error) {
    await finishRun(run, { status: "error", error: `엔진 호출 실패: ${error.message}` });
    return;
  }
  await pumpStream(run, response, "dryRun");
}

/* 이미지 생성 — 1) 프롬프트 조립만 받고 2) 이미지를 붙여 raw 로 스트리밍. */
async function pumpWithImages(run, input) {
  const payload = input.payload;
  let built;
  try {
    const res = await fetch(`${ENGINE_BASE}/api/generate/dryRun`, {
      method: "POST",
      headers: CSRF_HEADERS,
      body: JSON.stringify({ ...payload, chatId: run.chatId, returnPrompt: true, streaming: false }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      await finishRun(run, { status: "error", error: `dryRun(프롬프트) ${res.status}: ${text.slice(0, 300)}` });
      return;
    }
    built = await res.json();
  } catch (error) {
    await finishRun(run, { status: "error", error: `엔진 호출 실패: ${error.message}` });
    return;
  }
  if (run.status === "aborted") { await finishRun(run, { status: "aborted", content: "" }); return; }

  const msgs = Array.isArray(built?.prompt?.messages) ? built.prompt.messages : [];
  if (!msgs.length) { await finishRun(run, { status: "error", error: "프롬프트를 조립하지 못했습니다." }); return; }
  let target = null;
  for (let i = msgs.length - 1; i >= 0; i--) { if (msgs[i].role === "user") { target = msgs[i]; break; } }
  if (!target) { target = { role: "user", content: input.userTurn || "Continue." }; msgs.push(target); }
  target.images = [...(Array.isArray(target.images) ? target.images : []), ...input.images].slice(0, 32);

  const connectionId = input.connectionId || (typeof payload.connectionId === "string" ? payload.connectionId : null);
  if (!connectionId) {
    await finishRun(run, { status: "error", error: "이미지를 보내려면 API 연결이 지정돼야 합니다." });
    return;
  }
  const parameters = {};
  for (const k of RAW_PARAM_KEYS) {
    if (built?.parameters && built.parameters[k] !== undefined && built.parameters[k] !== null) parameters[k] = built.parameters[k];
  }
  // raw 의 runId 를 우리가 정해 둔다 — 중단할 때 /raw/abort 에 쓴다
  run.innerRunId = `srb-${randomUUID()}`;
  run.rawMode = true;
  let response;
  try {
    response = await fetch(`${ENGINE_BASE}/api/generate/raw`, {
      method: "POST",
      headers: CSRF_HEADERS,
      body: JSON.stringify({
        connectionId,
        messages: msgs.map((m) => ({ role: m.role, content: String(m.content ?? ""),
          ...(Array.isArray(m.images) && m.images.length ? { images: m.images } : {}),
          ...(Array.isArray(m.files) && m.files.length ? { files: m.files } : {}),
          ...(m.providerMetadata ? { providerMetadata: m.providerMetadata } : {}) })),
        streaming: true,
        runId: run.innerRunId,
        ...(Object.keys(parameters).length ? { parameters } : {}),
      }),
    });
  } catch (error) {
    await finishRun(run, { status: "error", error: `엔진 호출 실패: ${error.message}` });
    return;
  }
  await pumpStream(run, response, "raw");
}

/* dryRun·raw 의 SSE 를 받아 run 에 누적한다. 두 엔드포인트의 이벤트 모양이 같다. */
async function pumpStream(run, response, label) {
  if (!response.ok || !response.body) {
    const text = await response.text().catch(() => "");
    await finishRun(run, { status: "error", error: `${label} ${response.status}: ${text.slice(0, 300)}` });
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let completed = false;
  let resultContent = null;

  const handle = (frame) => {
    const event = parseFrame(frame);
    if (!event) return;
    if (event.type === "dryrun_started") {
      run.innerRunId = event.data?.runId ?? null;   // 중단할 때 쓴다
    } else if (event.type === "raw_started") {
      if (event.data?.runId) run.innerRunId = event.data.runId;
    } else if (event.type === "token") {
      appendToken(run, event.data ?? "");
    } else if (event.type === "result") {
      const data = event.data;
      resultContent = String((data && typeof data === "object" ? data.content : data) ?? "");
    } else if (event.type === "error") {
      run.error = typeof event.data === "string" ? event.data : JSON.stringify(event.data ?? "");
    } else if (event.type === "aborted") {
      run.status = "aborted";
    } else if (event.type === "done") {
      completed = true;
    }
  };

  const drain = () => {
    buffer = buffer.replace(/\r\n/g, "\n");
    let cut;
    while ((cut = buffer.indexOf("\n\n")) >= 0) {
      handle(buffer.slice(0, cut));
      buffer = buffer.slice(cut + 2);
    }
  };

  try {
    for (;;) {
      const chunk = await reader.read();
      if (chunk.done) break;
      buffer += decoder.decode(chunk.value, { stream: true });
      drain();
    }
    buffer += decoder.decode();
    drain();
    if (buffer.trim()) handle(buffer);
  } catch (error) {
    await finishRun(run, { status: "error", error: `스트림 오류: ${error.message}` });
    return;
  } finally {
    try { reader.releaseLock(); } catch { /* 이미 해제됨 */ }
  }

  if (run.status === "aborted") {
    await finishRun(run, { status: "aborted", content: resultContent ?? run.partial });
    return;
  }
  if (run.error) {
    await finishRun(run, { status: "error" });
    return;
  }
  if (!completed) {
    await finishRun(run, { status: "error", error: "완료 신호 전에 엔진 스트림이 끝났습니다." });
    return;
  }
  await finishRun(run, { status: "done", content: resultContent ?? run.partial, error: null });
}

export async function sorbetRunsRoutes(app) {
  app.get("/health", async () => {
    await ensureRunsDir();
    return { ok: true, mode: "background-runs", engine: ENGINE_BASE, active: countActiveRuns(), features: ["images", "maxConcurrent"], maxConcurrentCap: SORBET_RUNS_MAX_CONCURRENT_CAP };
  });

  // 생성 시작 — 결과를 기다리지 않고 runId 만 즉시 돌려준다
  app.post("/", async (req, reply) => {
    const input = startSchema.parse(req.body);
    const limit = Math.min(input.maxConcurrent ?? SORBET_RUNS_MAX_CONCURRENT, SORBET_RUNS_MAX_CONCURRENT_CAP);
    const active = countActiveRuns();
    if (active >= limit) {
      return reply.code(429).send({ error: `동시 생성은 ${limit}개까지입니다.`, limit, active });
    }
    await ensureRunsDir();
    sweepRuns().catch(() => undefined);   // 정리는 기다리지 않는다

    const runId = randomUUID();
    const run = createRun(runId, input.chatId);
    // 의도적으로 await 하지 않는다 — 이 요청은 바로 끝나고 생성은 뒤에서 계속된다.
    const job = input.images?.length ? pumpWithImages(run, input) : pumpDryRun(run, input.payload);
    job.catch(async (error) => {
      await finishRun(run, { status: "error", error: String(error?.message ?? error) });
    });
    return { runId, status: "running" };
  });

  // 진행 상태 조회 (폴링)
  app.get("/:runId", async (req, reply) => {
    const runId = validateRunId(req.params.runId);
    const live = getLiveRun(runId);
    if (live) {
      return {
        runId,
        status: live.status,
        partial: live.status === "running" ? live.partial : undefined,
        truncated: live.truncated || undefined,
        content: live.content,
        error: live.error,
        startedAt: live.startedAt,
        finishedAt: live.finishedAt,
      };
    }
    const saved = await readFinishedRun(runId);
    if (saved) return saved;
    return reply.code(404).send({ error: "그런 run 이 없습니다. 만료되었을 수 있습니다." });
  });

  // 중단 — 엔진 쪽 run 을 실제로 끊는다
  app.post("/:runId/abort", async (req) => {
    const runId = validateRunId(req.params.runId);
    const live = getLiveRun(runId);
    if (!live || live.status !== "running") return { aborted: false, reason: "실행 중이 아닙니다." };
    live.status = "aborted";
    if (live.innerRunId) {
      try {
        await fetch(`${ENGINE_BASE}/api/generate/${live.rawMode ? "raw/abort" : "dryRun/abort"}`, {
          method: "POST",
          headers: CSRF_HEADERS,
          body: JSON.stringify(live.rawMode ? { runId: live.innerRunId } : { runId: live.innerRunId, chatId: live.chatId }),
        });
      } catch {
        // 엔진이 이미 끝냈을 수 있다. 상태는 aborted 로 둔다.
      }
    }
    return { aborted: true };
  });

  // 결과를 받아간 뒤 정리
  app.delete("/:runId", async (req) => {
    const runId = validateRunId(req.params.runId);
    await deleteRun(runId);
    return { deleted: true };
  });
}
