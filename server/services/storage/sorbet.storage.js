// ──────────────────────────────────────────────
// Storage: 소르베
// ──────────────────────────────────────────────
//
// 소르베 data intentionally lives outside the shared chat table snapshots.
// Large generated outputs are split per chat under DATA_DIR/sorbet/results,
// while the smaller shared library/settings snapshot lives in state.json.
import { existsSync } from "node:fs";
import { mkdir, readFile, readdir, rename, rm, stat, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { DATA_DIR } from "../../utils/data-dir.js";
import { assertInsideDir } from "../../utils/security.js";

const SORBET_ROOT = assertInsideDir(DATA_DIR, join(DATA_DIR, "sorbet"));
const RESULTS_DIR = assertInsideDir(SORBET_ROOT, join(SORBET_ROOT, "results"));
const STATE_PATH = assertInsideDir(SORBET_ROOT, join(SORBET_ROOT, "state.json"));
const SCHEMA_VERSION = 1;

export const SORBET_STATE_MAX_BYTES = 32 * 1024 * 1024;
export const SORBET_RESULT_MAX_BYTES = 64 * 1024 * 1024;

                                          

                                    
                   
                    
                   
  

                                     
                   
                    
                 
                   
  

const writeQueues = new Map                       ();

function isJsonRecord(value)                      {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function validateChatId(chatId) {
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(chatId)) {
    throw new Error("Invalid 소르베 chat ID");
  }
  return chatId;
}

function resultPath(chatId) {
  return assertInsideDir(RESULTS_DIR, join(RESULTS_DIR, `${validateChatId(chatId)}.json`));
}

function serializeWithinLimit(value , maxBytes) {
  const serialized = JSON.stringify(value);
  if (Buffer.byteLength(serialized, "utf8") > maxBytes) {
    throw new Error(`소르베 payload exceeds ${Math.floor(maxBytes / 1024 / 1024)} MB`);
  }
  return `${serialized}\n`;
}

async function withWriteQueue   (path , operation)             {
  const previous = writeQueues.get(path) ?? Promise.resolve();
  const queued = previous.catch(() => undefined).then(operation);
  const marker = queued.then(
    () => undefined,
    () => undefined,
  );
  writeQueues.set(path, marker);
  try {
    return await queued;
  } finally {
    if (writeQueues.get(path) === marker) writeQueues.delete(path);
  }
}

async function atomicWriteJson(path , value , maxBytes) {
  const content = serializeWithinLimit(value, maxBytes);
  await mkdir(dirname(path), { recursive: true });
  const temporaryPath = assertInsideDir(SORBET_ROOT, `${path}.${process.pid}.${Date.now()}.tmp`);
  await writeFile(temporaryPath, content, { encoding: "utf8", mode: 0o600 });
  try {
    await rename(temporaryPath, path);
  } catch (error) {
    await rm(temporaryPath, { force: true }).catch(() => undefined);
    throw error;
  }
}

async function readJsonRecord   (path)                    {
  if (!existsSync(path)) return null;
  const raw = await readFile(path, "utf8");
  const parsed = JSON.parse(raw);
  if (!isJsonRecord(parsed)) throw new Error("소르베 storage file is not a JSON object");
  return parsed ;
}

export function createSorbetStorage() {
  return {
    rootDir: SORBET_ROOT,

    async ensureReady() {
      await mkdir(RESULTS_DIR, { recursive: true });
      return SORBET_ROOT;
    },

    async getState()                                       {
      return readJsonRecord                      (STATE_PATH);
    },

    async setState(data)                                {
      if (!isJsonRecord(data)) throw new Error("소르베 state must be a JSON object");
      const envelope = {
        schemaVersion: SCHEMA_VERSION,
        updatedAt: new Date().toISOString(),
        data,
      };
      await withWriteQueue(STATE_PATH, () => atomicWriteJson(STATE_PATH, envelope, SORBET_STATE_MAX_BYTES));
      return envelope;
    },

    async listResultChats() {
      await mkdir(RESULTS_DIR, { recursive: true });
      const entries = await readdir(RESULTS_DIR, { withFileTypes: true });
      const rows = await Promise.all(
        entries
          .filter((entry) => entry.isFile() && /^[A-Za-z0-9_-]{1,128}\.json$/.test(entry.name))
          .map(async (entry) => {
            const path = assertInsideDir(RESULTS_DIR, join(RESULTS_DIR, entry.name));
            const info = await stat(path);
            const envelope = await readJsonRecord                       (path);
            return {
              chatId: entry.name.slice(0, -5),
              updatedAt: envelope?.updatedAt ?? info.mtime.toISOString(),
              bytes: info.size,
            };
          }),
      );
      return rows.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
    },

    async getResults(chatId)                                        {
      return readJsonRecord                       (resultPath(chatId));
    },

    async setResults(chatId , data)                                 {
      if (!isJsonRecord(data)) throw new Error("소르베 results must be a JSON object");
      const safeChatId = validateChatId(chatId);
      const path = resultPath(safeChatId);
      const envelope = {
        schemaVersion: SCHEMA_VERSION,
        updatedAt: new Date().toISOString(),
        chatId: safeChatId,
        data,
      };
      await withWriteQueue(path, () => atomicWriteJson(path, envelope, SORBET_RESULT_MAX_BYTES));
      return envelope;
    },

    async deleteResults(chatId) {
      const path = resultPath(chatId);
      await withWriteQueue(path, () => rm(path, { force: true }));
    },

    async clear() {
      await withWriteQueue(SORBET_ROOT, async () => {
        await rm(SORBET_ROOT, { recursive: true, force: true });
        await mkdir(RESULTS_DIR, { recursive: true });
      });
    },
  };
}
