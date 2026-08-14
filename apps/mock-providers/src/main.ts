import Fastify from "fastify";
import { getConfig } from "@applyflow/config";

const config = getConfig();
const app = Fastify({ logger: true });

app.get("/health", async () => ({ status: "ok", service: "mock-providers" }));

app.get("/", async () => ({
  message: "ApplyFlow Mock Providers",
  scenarios: ["payment.succeeded", "payment.failed", "connector.success", "connector.otp"],
}));

app.listen({ port: config.MOCK_PROVIDERS_PORT, host: "0.0.0.0" });
