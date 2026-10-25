// ──────────────────────────────────────────────
// Storage: 소르베 백그라운드 생성 (runs)
// ──────────────────────────────────────────────
//
// 왜 필요한가:
//   엔진의 dry-run 라우트는 클라이언트 소켓이 닫히면 LLM 호출을 즉시 중단한다.
//     const onClose = () => { abortController.abort(); ... };
//     req.raw.on("close", onClose);
//   그래서 모바일에서 브라우저를 내리면 생성이 서버에서도 죽어 회수할 방법이 없다.
//
//   해결: 생성을 '서버가 자기 자신에게 거는 요청'으로 돌린다. 그러면 그 소켓의
//   주인이 서버 자신이라 모바일이 끊겨도 onClose 가 터지지 않는다.
//
// 진행 상태는 메모리에 두고(토큰이 실시간으로 쌓이므로), 끝난 결과만 디스크에
// 남긴다. 컨테이너가 재시작되면 진행 중이던 run 은 사라지지만, 끝난 결과는 남는다.
//
// 주의: 패치 도구의 문법 검사를 통과하도록 import 는 한 줄로, top-level await 는 쓰지 않는다.
import { existsSync } from "node:fs";
import { mkdir, readFile, readdir, rename, rm, stat, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { DATA_DIR } from "../../utils/data-dir.js";
import { assertInsideDir } from "../../utils/security.js";

const SORBET_ROOT = assertInsideDir(DATA_DIR, join(DATA_DIR, "sorbet"));
const RUNS_DIR = assertInsideDir(SORBET_ROOT, join(SORBET_ROOT, "runs"));

// 메모리가 작은 서버(2GB 안팎)에서도 버티도록 잡은 값이다.
// 동시 실행 수와 버퍼 크기에 상한을 둬서 생성 폭주로 서버가 죽는 일을 막는다.
// 동시 실행 수는 클라이언트가 maxConcurrent 로 바꿀 수 있지만 CAP 을 넘지는 못한다.
export const SORBET_RUNS_MAX_CONCURRENT = 4;
export const SORBET_RUNS_MAX_CONCURRENT_CAP = 16;
export const SORBET_RUNS_MAX_PARTIAL_BYTES = 2 * 1024 * 1024;   // 진행 중 누적 상한
export const SORBET_RUNS_FILE_TTL_MS = 24 * 60 * 60 * 1000;     // 끝난 결과 보관 기간
export const SORBET_RUNS_MEM_TTL_MS = 30 * 60 * 1000;           // 끝난 run 을 메모리에서 비우는 시간
const RUN_ID_RE = /^[A-Za-z0-9_-]{1,128}$/;

// runId -> { status, chatId, partial, content, error, innerRunId, startedAt, finishedAt, abort }
const liveRuns = new Map();

export function validateRunId(runId) {
  if (!RUN_ID_RE.test(String(runId ?? ""))) throw new Error("Invalid QR run ID");
  return String(runId);
}

function runPath(runId) {
  return assertInsideDir(RUNS_DIR, join(RUNS_DIR, `${validateRunId(runId)}.json`));
}

async function atomicWriteJson(path, value) {
  await mkdir(dirname(path), { recursive: true });
  const temporaryPath = assertInsideDir(SORBET_ROOT, `${path}.${process.pid}.${Date.now()}.tmp`);
  await writeFile(temporaryPath, `${JSON.stringify(value)}\n`, { encoding: "utf8", mode: 0o600 });
  try {
    await rename(temporaryPath, path);
  } catch (error) {
    await rm(temporaryPath, { force: true }).catch(() => undefined);
    throw error;
  }
}

export function countActiveRuns() {
  let n = 0;
  for (const run of liveRuns.values()) if (run.status === "running") n += 1;
  return n;
}

export function createRun(runId, chatId) {
  const run = {
    runId: validateRunId(runId),
    chatId: String(chatId ?? ""),
    status: "running",
    partial: "",
    truncated: false,
    content: null,
    error: null,
    innerRunId: null,      // 엔진이 dryrun_started 로 알려주는 실제 run id (중단용)
    startedAt: new Date().toISOString(),
    finishedAt: null,
  };
  liveRuns.set(run.runId, run);
  return run;
}

export function getLiveRun(runId) {
  return liveRuns.get(String(runId ?? "")) ?? null;
}

export function appendToken(run, text) {
  if (!run || run.status !== "running") return;
  if (run.truncated) return;
  const next = run.partial + String(text ?? "");
  if (Buffer.byteLength(next, "utf8") > SORBET_RUNS_MAX_PARTIAL_BYTES) {
    // 상한을 넘으면 더 쌓지 않는다. 최종 결과는 result 이벤트로 따로 오므로
    // 진행 표시만 멈출 뿐 결과가 잘리지는 않는다.
    run.truncated = true;
    return;
  }
  run.partial = next;
}

/* 끝난 run 을 디스크에 남긴다. 폴링이 늦게 와도, 컨테이너가 재시작돼도 읽을 수 있다. */
export async function finishRun(run, patch) {
  if (!run) return null;
  Object.assign(run, patch, { finishedAt: new Date().toISOString() });
  const envelope = {
    runId: run.runId,
    chatId: run.chatId,
    status: run.status,
    content: run.content,
    error: run.error,
    startedAt: run.startedAt,
    finishedAt: run.finishedAt,
  };
  try {
    await atomicWriteJson(runPath(run.runId), envelope);
  } catch {
    // 디스크 저장에 실패해도 메모리에는 남아 있으므로 폴링은 계속 동작한다.
  }
  return envelope;
}

export async function readFinishedRun(runId) {
  const path = runPath(runId);
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch {
    return null;
  }
}

export async function deleteRun(runId) {
  liveRuns.delete(String(runId ?? ""));
  await rm(runPath(runId), { force: true }).catch(() => undefined);
}

/* 오래된 것 정리. 새 run 을 만들 때마다 한 번씩 돌린다(별도 타이머를 두지 않는다). */
export async function sweepRuns() {
  const now = Date.now();
  for (const [id, run] of liveRuns) {
    if (run.status === "running") continue;
    const at = Date.parse(run.finishedAt ?? run.startedAt ?? "") || 0;
    if (now - at > SORBET_RUNS_MEM_TTL_MS) liveRuns.delete(id);
  }
  try {
    await mkdir(RUNS_DIR, { recursive: true });
    const entries = await readdir(RUNS_DIR, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith(".json")) continue;
      const path = assertInsideDir(RUNS_DIR, join(RUNS_DIR, entry.name));
      const info = await stat(path).catch(() => null);
      if (info && now - info.mtimeMs > SORBET_RUNS_FILE_TTL_MS) {
        await rm(path, { force: true }).catch(() => undefined);
      }
    }
  } catch {
    // 정리는 실패해도 본 기능에 영향이 없다.
  }
}

export async function ensureRunsDir() {
  await mkdir(RUNS_DIR, { recursive: true });
  return RUNS_DIR;
}

export const SORBET_RUNS_DIR = RUNS_DIR;
