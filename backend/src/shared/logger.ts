import type { Application } from "express";
import morgan from "morgan";
import chalk from "chalk";


const pad = (s: string, n: number) => (s.length >= n ? s : s + " ".repeat(n - s.length));

function methodBadge(method?: string): string {
  const m = (method ?? "").toUpperCase();
  switch (m) {
    case "GET":    return chalk.bgBlue.white.bold(` ${m} `);
    case "POST":   return chalk.bgGreen.white.bold(` ${m} `);
    case "PUT":    return chalk.bgYellow.black.bold(` ${m} `);
    case "PATCH":  return chalk.bgMagenta.white.bold(` ${m} `);
    case "DELETE": return chalk.bgRed.white.bold(` ${m} `);
    default:       return chalk.bgWhite.black.bold(` ${m || "UNK"} `);
  }
}

function statusBadge(code?: number): string {
  const t = ` ${String(code ?? "")} `;
  if (!code) return chalk.bgWhite.black.bold("     ");
  if (code >= 500) return chalk.bgRed.white.bold(t);
  if (code >= 400) return chalk.bgYellow.black.bold(t);
  if (code >= 300) return chalk.bgCyan.black.bold(t);
  return chalk.bgGreen.black.bold(t);
}

function timeColor(ms?: number): string {
  if (ms == null || !isFinite(ms)) return chalk.gray("-");
  if (ms < 150) return chalk.green(`${ms.toFixed(1)} ms`);
  if (ms < 800) return chalk.yellow(`${ms.toFixed(1)} ms`);
  return chalk.red(`${ms.toFixed(1)} ms`);
}

function sizePretty(size?: string): string {
  if (!size) return "";
  const n = Number(size);
  if (!isFinite(n) || n <= 0) return "";
  if (n < 1024) return `${n}B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)}KB`;
  return `${(n / (1024 * 1024)).toFixed(1)}MB`;
}


morgan.token("coloredMethod", (req) => methodBadge(req.method));
morgan.token("coloredStatus", (_req, res) => statusBadge(res.statusCode));

export function applyHttpLogger(app: Application) {
  app.use(
    morgan((tokens, req, res) => {
      const method = tokens.coloredMethod?.(req, res) ?? "";
      const status = tokens.coloredStatus?.(req, res) ?? "";
      const url = chalk.white.bold(pad(tokens.url(req, res) ?? "", 32));

 
      const rtNum = Number(tokens["response-time"]?.(req, res) ?? "0");
      const rt = timeColor(rtNum);

      const len = tokens.res?.(req, res, "content-length");
      const size = sizePretty(len);
      const sizePart = size ? chalk.gray(` • ${size}`) : "";

      const when = chalk.gray(new Date().toLocaleTimeString());


      return `${when}  ${method} ${status} ${url}  - ${rt}${sizePart}`;
    })
  );
}

export default applyHttpLogger;
