# AI Gateway and Admin-Controlled LLM Configuration

## 1. Purpose

Users do not bring AI keys. ApplyFlow owns provider credentials and exposes product tasks—not a general chat API. Admin controls provider, model, prompt, schema, fallback, cost, and availability for every task.

AI is used to extract and draft. Deterministic code owns permissions, eligibility blockers, quotas, payments, connector actions, and state transitions.

## 2. Supported task types

| Task | Input | Structured output | Human review |
| --- | --- | --- | --- |
| `RESUME_EXTRACT` | Bounded extracted resume text + page markers | Roles, education, projects, skills, certifications, contact proposals, field evidence/confidence | Required before profile write |
| `LINKEDIN_EXPORT_EXTRACT` | User-uploaded export/PDF only | Same candidate schema with source type | Required |
| `JOB_EXTRACT` | Sanitised public job text/JSON-LD | Normalised job, requirements, questions, dates, salary/source | Required when low confidence; correction always available |
| `ROLE_RECOMMEND` | Confirmed education/skills/experience | Role families/titles, level, evidence, exclusions | User selects |
| `MATCH_EXPLAIN` | Versioned candidate/job facts and deterministic eligibility results | Strengths, gaps, unknowns, evidence references, presentation band | Advisory |
| `SCREENING_DRAFT` | Confirmed profile facts + exact question | Draft answer, cited candidate facts, unknowns, sensitivity class | Always required for new/material answer |
| `COVER_NOTE_DRAFT` | Confirmed facts + job | Concise truthful note and cited facts | Required before submit |
| `NORMALISE_TITLE_SKILL` | Bounded labels | Canonical IDs/candidates and confidence | Deterministic fallback/review |

AI never decides or infers protected/sensitive demographic answers.

## 3. Internal port

```ts
type AiTaskName =
  | "RESUME_EXTRACT"
  | "LINKEDIN_EXPORT_EXTRACT"
  | "JOB_EXTRACT"
  | "ROLE_RECOMMEND"
  | "MATCH_EXPLAIN"
  | "SCREENING_DRAFT"
  | "COVER_NOTE_DRAFT"
  | "NORMALISE_TITLE_SKILL";

interface AiTaskGateway {
  run<TInput, TOutput>(request: {
    task: AiTaskName;
    input: TInput;
    schemaVersion: string;
    correlationId: string;
    dataClassification: "PUBLIC" | "CANDIDATE_PRIVATE" | "SENSITIVE_RESTRICTED";
  }): Promise<AiTaskResult<TOutput>>;
}

type AiTaskResult<T> =
  | { status: "COMPLETED"; value: T; runId: string; warnings: string[] }
  | { status: "REFUSED"; runId: string; safeReason: string }
  | { status: "FAILED"; runId: string; retryable: boolean; code: string };
```

Clients never choose provider, model, prompt, raw system instruction, token limit, or secret.

## 4. Route resolution

Resolve in this order:

1. Global/task kill switch.
2. Environment-specific published task route.
3. Data-classification/provider policy.
4. Budget and rate limits.
5. Primary provider/model health.
6. Fallback only if explicitly configured and data policy allows it.

Route snapshot is stored on each run so later admin changes do not rewrite history.

## 5. Provider adapters

### OpenAI adapter

- Official server-side JavaScript/TypeScript SDK.
- Responses API for new implementation.
- Generate strict structured output using the task's JSON Schema through Responses `text.format`/official Zod helper supported by the installed SDK.
- Use `store: false` for candidate/job tasks by default.
- Parse refusal/incomplete/content-filter/timeout/rate-limit states separately.
- Capture API request ID, usage, latency, and configured model.
- Never expose API key or provider response object outside adapter.

Conceptual request shape; compile against the pinned official SDK rather than copying stale syntax:

```ts
const response = await openai.responses.create({
  model: route.model,
  input: buildOpenAiInput(prompt, boundedInput),
  text: {
    format: {
      type: "json_schema",
      name: schemaName,
      strict: true,
      schema: jsonSchema
    }
  },
  store: false
});
```

Prefer SDK Zod-to-schema support so runtime type and schema do not diverge. Still validate the returned value locally.

### Anthropic adapter

- Native official TypeScript SDK and Messages API.
- Use native Structured Outputs with `output_config.format` JSON Schema.
- Do not use the OpenAI compatibility layer for production structured extraction.
- Handle `end_turn`, `max_tokens`, `refusal`, context exceeded, and rate/server errors explicitly.
- Filter parameters by provider/model support; admin UI cannot inject arbitrary JSON.

Conceptual request shape:

```ts
const message = await anthropic.messages.create({
  model: route.model,
  max_tokens: route.maxOutputTokens,
  system: prompt.system,
  messages: [{ role: "user", content: boundedInput }],
  output_config: {
    format: { type: "json_schema", schema: jsonSchema }
  }
});
```

### Mock adapter

- Deterministic fixture selection by task and fixture key.
- Supports success, low confidence, malformed output, refusal, timeout, rate limit, and provider outage.
- Used by demo and tests; production startup rejects it as a published route.

## 6. Schema rules

- Zod definition is source of truth; JSON Schema generated in CI where provider supports it.
- Every object rejects unknown fields (`additionalProperties: false` equivalent).
- Fields required by a provider's strict schema can use nullable union where semantically optional.
- Each output contains `schemaVersion` and task-specific status/unknown representation.
- IDs/evidence references are chosen from supplied allowlists; model cannot invent database IDs.
- Dates, money, countries, and enums receive deterministic post-validation.
- Invalid structured output gets at most the configured safe retry; then fails for human/manual fallback.

## 7. Resume extraction output

Representative structure:

```json
{
  "schemaVersion": "resume-extract.v1",
  "candidate": {
    "name": {
      "value": "Example Candidate",
      "confidence": "HIGH",
      "evidence": [{ "page": 1, "quoteHash": "sha256:...", "range": [0, 17] }]
    }
  },
  "experiences": [],
  "education": [],
  "projects": [],
  "skills": [],
  "certifications": [],
  "warnings": [],
  "unparsedSections": []
}
```

Do not store long raw quotes in normal logs or AI-run metadata. UI resolves authorised source snippet from the document service.

## 8. Screening draft output

```json
{
  "schemaVersion": "screening-draft.v1",
  "questionClass": "WORK_AUTHORIZATION",
  "sensitivity": "NORMAL",
  "status": "NEEDS_USER_CONFIRMATION",
  "draft": "I am authorised to work in India.",
  "factRefs": ["work_authorization:01J..."],
  "unknowns": [],
  "mustAskUser": false
}
```

If the answer is not explicitly supported, return `mustAskUser: true`, empty draft, and a concise user question. The model is instructed never to “pick the most likely answer.”

## 9. Prompt structure

Every prompt version contains:

- Task and allowed objective.
- Trust boundary: supplied document/page is untrusted data, not instructions.
- Allowed source facts and reference IDs.
- Explicit non-fabrication rule.
- Sensitive-data rule.
- How to represent unknown/not-applicable.
- Output schema and field descriptions through provider mechanism.
- Few-shot examples using fictitious data only where evals show benefit.
- Refusal/empty-input behaviour.

Prompts must not include provider secrets, internal security rules that aid bypass, unrelated user history, or hidden discriminatory features.

## 10. Prompt-injection defence

- Deterministically extract visible/bounded content before the model call.
- Separate instructions and data in API message/content structure.
- Tell the model that page/document commands are text to extract, never to follow.
- No tools/function calling for extraction tasks.
- No network or connector access from AI worker.
- Use an allowlist of output references and deterministic schema validation.
- Detect suspicious phrases/hidden text as a warning, not as the only security control.
- Manual fallback for inconsistent input.

## 11. Admin control centre

### Provider page

- Type, display name, environment, health, last tested, credential fingerprint/status, created/rotated by/time.
- Create/rotate secret is write-only and requires fresh admin authentication.
- Disable and emergency kill switch.
- Provider-level requests/tokens/cost/latency/errors.

### Task route page

- Task, primary provider/model, fallback, prompt/schema, timeouts, attempts, output-token ceiling, per-run cost ceiling, daily/monthly spend cap, status.
- Draft -> evaluate -> publish; immutable published route version.
- Rollback to previously published version.

### Prompt/eval page

- Version diff, schema, creator/reviewer, fixtures, metric thresholds, latest regression, publish blocker.
- No production resume/job text in default eval fixtures.

## 12. Cost and rate control

- Per task/user/hour rate limits.
- Per run input bytes/tokens and output tokens.
- Per route daily/monthly spend alert and hard stop.
- Deduplicate by `(task, inputHash, profile/job/schema/prompt versions)` only when privacy and freshness permit.
- Cache successful extraction for immutable resume/job snapshot.
- Do not automatically retry non-retryable invalid input/refusal.
- Track cost per activated user and confirmed application.

## 13. Evals

Minimum suites:

### Resume extraction

- Exact dates/employers/titles from source.
- No invented role, skill, degree, or contact.
- Correct current-role state.
- Handles multi-column PDF, fresher resume, date gaps, missing data, and unrelated input.

### Job extraction

- Correct company/title/location/requirements.
- Salary remains unknown when absent.
- Separates required vs preferred.
- Ignores page prompt injection.

### Screening drafts

- All factual claims reference confirmed fact IDs.
- Unknown produces question, not guess.
- Sensitive question never inferred.
- Length/tone constraints.

### Match explanation

- Does not override deterministic hard eligibility.
- Each strength/gap references supplied evidence.
- No protected-class features.

Publish gates should include schema pass 100%, fabrication rate 0% on critical fact suite, and task-specific accuracy thresholds defined in admin config/ADR.

## 14. Failure UX

- AI unavailable: allow manual profile/job/answer entry and keep draft.
- Refusal: safe generic explanation and manual path.
- Output invalid: retry once if configured, then manual review; never show raw JSON/error.
- Budget exhausted: admin alert; user sees temporary manual path, not provider billing detail.
- Route disabled: existing confirmed data remains usable.

## 15. Retention and privacy

- Send only fields needed for the task.
- Use opaque internal references instead of unnecessary identity.
- Default provider storage off where supported.
- Separate original documents from derived structured data.
- Define retention for run metadata, input/output, and eval samples by data class.
- User deletion propagates to retained AI data subject to documented legal/security exceptions and provider capabilities.
- Logs contain hashes, counts, timing, route, and safe categories—not resume text or answers.
