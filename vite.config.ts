import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig, type Plugin } from "vite";

const FIT_FILE = resolve(__dirname, "src/presentation/spiritFit.json");
const STAGES = ["baby", "adult", "awakened"];

/** 피팅 페이지(spirit-fit.html)가 읽고 저장하는 길: 개발 서버에서만 GET·POST /__spirit-fit → spiritFit.json */
function spiritFit(): Plugin {
  return {
    name: "spirit-fit",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use("/__spirit-fit", (req, res) => {
        if (req.method === "GET") {
          res.setHeader("Content-Type", "application/json");
          res.end(readFileSync(FIT_FILE, "utf8"));
          return;
        }
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.end();
          return;
        }
        let body = "";
        req.on("data", (c) => {
          body += c;
          if (body.length > 200_000) req.destroy();
        });
        req.on("end", () => {
          try {
            writeFileSync(FIT_FILE, formatFits(checkFits(JSON.parse(body))), "utf8");
            res.end("ok");
          } catch (e) {
            res.statusCode = 400;
            res.end(String(e));
          }
        });
      });
    },
  };
}

type Fit = { s?: number; dx?: number; dy?: number; c?: number[] };

/** 정령 id → 단계 → 숫자 몇 개만 받아요 (다른 것은 거절) */
function checkFits(data: unknown): Record<string, Record<string, Fit>> {
  const num = (v: unknown) => typeof v === "number" && Number.isFinite(v);
  if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("객체가 아니에요");
  for (const [id, stages] of Object.entries(data)) {
    if (!/^[a-z_]+$/.test(id) || !stages || typeof stages !== "object") throw new Error(`정령 id: ${id}`);
    for (const [stage, fit] of Object.entries(stages)) {
      if (!STAGES.includes(stage) || !fit || typeof fit !== "object") throw new Error(`단계: ${id}.${stage}`);
      for (const [k, v] of Object.entries(fit)) {
        const ok = k === "c" ? Array.isArray(v) && v.length === 3 && v.every(num) : ["s", "dx", "dy"].includes(k) && num(v);
        if (!ok) throw new Error(`값: ${id}.${stage}.${k}`);
      }
    }
  }
  return data as Record<string, Record<string, Fit>>;
}

/** 정령 한 줄씩 (diff 보기 좋게) */
function formatFits(fits: Record<string, Record<string, Fit>>): string {
  const lines = Object.entries(fits)
    .filter(([, stages]) => Object.keys(stages).length)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([id, stages]) => ` ${JSON.stringify(id)}: ${JSON.stringify(stages)}`);
  return `{\n${lines.join(",\n")}\n}\n`;
}

export default defineConfig({
  base: "./",
  build: { chunkSizeWarningLimit: 4000 },
  plugins: [spiritFit()],
});
