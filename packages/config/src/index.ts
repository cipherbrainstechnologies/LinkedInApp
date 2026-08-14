import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_ENV: z.enum(["local", "demo", "staging", "production"]).default("local"),

  // URLs
  API_URL: z.string().url().default("http://localhost:4000"),
  WEB_URL: z.string().url().default("http://localhost:3000"),
  ADMIN_URL: z.string().url().default("http://localhost:3001"),

  // Database
  DATABASE_URL: z
    .string()
    .default("postgresql://applyflow:applyflow@localhost:5432/applyflow"),

  // Redis
  REDIS_URL: z.string().default("redis://localhost:6379"),

  // Object storage
  S3_ENDPOINT: z.string().default("http://localhost:9000"),
  S3_ACCESS_KEY: z.string().default("minioadmin"),
  S3_SECRET_KEY: z.string().default("minioadmin"),
  S3_BUCKET: z.string().default("applyflow"),
  S3_REGION: z.string().default("us-east-1"),
  S3_FORCE_PATH_STYLE: z.coerce.boolean().default(true),

  // Auth
  SESSION_SECRET: z.string().min(32).default("local-dev-session-secret-min-32-chars!!"),
  JWT_ACCESS_SECRET: z.string().min(32).default("local-dev-jwt-access-secret-min-32!!"),
  ENCRYPTION_KEY: z.string().min(32).default("local-dev-encryption-key-32chars!!"),

  // Demo adapters
  DEMO_AUTH_ENABLED: z.coerce.boolean().default(true),
  MOCK_PROVIDERS_URL: z.string().url().default("http://localhost:4100"),

  // Feature flags
  LINKEDIN_OIDC_ENABLED: z.coerce.boolean().default(false),
  OPENAI_ENABLED: z.coerce.boolean().default(false),
  ANTHROPIC_ENABLED: z.coerce.boolean().default(false),
  STRIPE_ENABLED: z.coerce.boolean().default(false),
  RAZORPAY_ENABLED: z.coerce.boolean().default(false),

  // Ports
  API_PORT: z.coerce.number().default(4000),
  WEB_PORT: z.coerce.number().default(3000),
  ADMIN_PORT: z.coerce.number().default(3001),
  MOCK_PROVIDERS_PORT: z.coerce.number().default(4100),

  // Observability
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  OTEL_ENABLED: z.coerce.boolean().default(false),

  LOCAL_STORAGE_PATH: z.string().default("./uploads"),
});

export type AppConfig = z.infer<typeof envSchema>;

let cached: AppConfig | null = null;

export function loadConfig(env: Record<string, string | undefined> = process.env): AppConfig {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Invalid configuration: ${issues}`);
  }

  const config = parsed.data;

  if (config.APP_ENV === "production") {
    if (config.DEMO_AUTH_ENABLED) {
      throw new Error("DEMO_AUTH_ENABLED must be false in production");
    }
    if (
      config.SESSION_SECRET === "local-dev-session-secret-min-32-chars!!" ||
      config.JWT_ACCESS_SECRET === "local-dev-jwt-access-secret-min-32!!"
    ) {
      throw new Error("Production requires non-default secrets");
    }
  }

  return config;
}

export function getConfig(): AppConfig {
  if (!cached) {
    cached = loadConfig();
  }
  return cached;
}

export function resetConfigForTests(): void {
  cached = null;
}
