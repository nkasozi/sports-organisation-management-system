import fs from "node:fs";
import path from "node:path";

const ENV_FILE_NAME = ".env.local";
const LIVE_SECRET_KEY_PREFIX = "sk_live_";
const ENV_LINE_PATTERN = /^[A-Z_][A-Z0-9_]*=/;
const TRAILING_COMMENT_PATTERN = /\s+#.*$/;
const WRAPPING_QUOTES_PATTERN = /^"|"$/g;

function read_env_file(): Record<string, string> {
  const env_path = path.resolve(process.cwd(), ENV_FILE_NAME);
  if (!fs.existsSync(env_path)) return {};
  return Object.fromEntries(
    fs
      .readFileSync(env_path, "utf8")
      .split("\n")
      .filter((line) => ENV_LINE_PATTERN.test(line))
      .map((line) => {
        const separator_index = line.indexOf("=");
        return [
          line.slice(0, separator_index),
          line
            .slice(separator_index + 1)
            .replace(TRAILING_COMMENT_PATTERN, "")
            .replace(WRAPPING_QUOTES_PATTERN, ""),
        ];
      }),
  );
}

const file_values = read_env_file();

function read_setting(name: string): string {
  return process.env[name] ?? file_values[name] ?? "";
}

type SecretKeyResult =
  | { success: true; secret_key: string }
  | { success: false; error: string };

export function read_clerk_secret_key(): SecretKeyResult {
  const secret_key = read_setting("CLERK_SECRET_KEY");
  if (!secret_key)
    return {
      success: false,
      error: "CLERK_SECRET_KEY is required to sign in e2e profiles",
    };
  if (secret_key.startsWith(LIVE_SECRET_KEY_PREFIX))
    return {
      success: false,
      error: "E2E tests must run against a Clerk development instance",
    };
  return { success: true, secret_key };
}

export const E2E_BASE_URL =
  read_setting("E2E_BASE_URL") || "http://localhost:5173";
