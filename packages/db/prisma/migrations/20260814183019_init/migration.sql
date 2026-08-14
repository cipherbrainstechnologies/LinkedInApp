-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "primary_email_id" UUID,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "time_zone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "onboarding_path" TEXT,
    "onboarding_state" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "onboarding_step" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_active_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_identities" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_subject" TEXT NOT NULL,
    "email_claim" TEXT,
    "claim_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_used_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_identities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emails" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "value_hash" TEXT NOT NULL,
    "display_value" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "verified_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "emails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "family_id" UUID NOT NULL,
    "device_label" TEXT,
    "assurance_level" TEXT NOT NULL DEFAULT 'standard',
    "expires_at" TIMESTAMPTZ NOT NULL,
    "revoked_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_token_families" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "revoked_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_token_families_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consents" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "purpose" TEXT NOT NULL,
    "scope_type" TEXT NOT NULL,
    "scope_id" TEXT,
    "copy_version" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "granted_at" TIMESTAMPTZ,
    "revoked_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidate_profiles" (
    "user_id" UUID NOT NULL,
    "preferred_name" TEXT,
    "legal_name" TEXT,
    "summary" TEXT,
    "notice_period_days" INTEGER,
    "availability_date" TIMESTAMPTZ,
    "profile_version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "candidate_profiles_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "experiences" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "employer" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "employment_type" TEXT,
    "location" TEXT,
    "start_date" TIMESTAMPTZ,
    "end_date" TIMESTAMPTZ,
    "is_current" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "source" TEXT NOT NULL DEFAULT 'USER',
    "confirmation_state" TEXT NOT NULL DEFAULT 'CONFIRMED',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "experiences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "educations" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "institution" TEXT NOT NULL,
    "degree" TEXT,
    "field" TEXT,
    "start_date" TIMESTAMPTZ,
    "end_date" TIMESTAMPTZ,
    "grade" TEXT,
    "source" TEXT NOT NULL DEFAULT 'USER',
    "confirmation_state" TEXT NOT NULL DEFAULT 'CONFIRMED',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "educations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT,
    "source" TEXT NOT NULL DEFAULT 'USER',
    "confirmation_state" TEXT NOT NULL DEFAULT 'CONFIRMED',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidate_skills" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "level" TEXT,
    "source" TEXT NOT NULL DEFAULT 'USER',
    "confirmation_state" TEXT NOT NULL DEFAULT 'CONFIRMED',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "candidate_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_targets" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "custom_title" TEXT,
    "level" TEXT,
    "include_internships" BOOLEAN NOT NULL DEFAULT false,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_targets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidate_preferences" (
    "user_id" UUID NOT NULL,
    "locations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "remote_modes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "employment_types" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "salary_min_minor" INTEGER,
    "salary_target_minor" INTEGER,
    "salary_currency" TEXT,
    "salary_period" TEXT,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "candidate_preferences_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "work_authorisations" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "country" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "sponsorship_required" BOOLEAN NOT NULL DEFAULT false,
    "expiry_date" TIMESTAMPTZ,
    "confirmation_state" TEXT NOT NULL DEFAULT 'CONFIRMED',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "work_authorisations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "object_key" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "content_hash" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "pages" INTEGER,
    "scan_status" TEXT NOT NULL DEFAULT 'PENDING',
    "extraction_status" TEXT NOT NULL DEFAULT 'PENDING',
    "retention_class" TEXT NOT NULL DEFAULT 'STANDARD',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resumes" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "active_version_id" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "resumes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resume_versions" (
    "id" UUID NOT NULL,
    "resume_id" UUID NOT NULL,
    "version_number" INTEGER NOT NULL,
    "document_id" UUID NOT NULL,
    "extracted_text" TEXT,
    "extraction_status" TEXT NOT NULL DEFAULT 'PENDING',
    "extraction_data" JSONB,
    "reviewed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resume_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_sources" (
    "id" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "source_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "capabilities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jobs" (
    "id" UUID NOT NULL,
    "source_id" UUID,
    "canonical_source_id" TEXT,
    "source_url" TEXT,
    "title" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "location" TEXT,
    "work_mode" TEXT,
    "employment_type" TEXT,
    "description" TEXT,
    "requirements" TEXT,
    "salary_min_minor" INTEGER,
    "salary_max_minor" INTEGER,
    "salary_currency" TEXT,
    "posted_at" TIMESTAMPTZ,
    "expires_at" TIMESTAMPTZ,
    "captured_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "fingerprint" TEXT,
    "policy_mode" TEXT NOT NULL DEFAULT 'AUTO',
    "domain" TEXT,
    "eligibility_blockers" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "search_vector" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_snapshots" (
    "id" UUID NOT NULL,
    "job_id" UUID NOT NULL,
    "schema_version" TEXT NOT NULL DEFAULT '1',
    "snapshot_data" JSONB NOT NULL,
    "source_hash" TEXT,
    "captured_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_jobs" (
    "user_id" UUID NOT NULL,
    "job_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_jobs_pkey" PRIMARY KEY ("user_id","job_id")
);

-- CreateTable
CREATE TABLE "hidden_jobs" (
    "user_id" UUID NOT NULL,
    "job_id" UUID NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hidden_jobs_pkey" PRIMARY KEY ("user_id","job_id")
);

-- CreateTable
CREATE TABLE "job_imports" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "job_id" UUID,
    "failure_reason" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_imports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match_assessments" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "job_id" UUID NOT NULL,
    "resume_version_id" UUID,
    "eligible" BOOLEAN NOT NULL,
    "score" DOUBLE PRECISION,
    "strengths" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "gaps" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "unknowns" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "evidence" JSONB,
    "generated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ,

    CONSTRAINT "match_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "job_id" UUID NOT NULL,
    "job_snapshot_id" UUID,
    "profile_version" INTEGER NOT NULL DEFAULT 1,
    "resume_version_id" UUID,
    "mode" TEXT NOT NULL DEFAULT 'CONFIRM_EACH',
    "state" TEXT NOT NULL DEFAULT 'DRAFT',
    "connector_id" UUID,
    "connector_version" TEXT,
    "domain_policy_id" UUID,
    "domain_policy_version" TEXT,
    "quota_reservation_id" UUID,
    "idempotency_key" TEXT,
    "next_action" TEXT,
    "next_action_detail" JSONB,
    "evidence_level" TEXT,
    "submitted_at" TIMESTAMPTZ,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_answers" (
    "id" UUID NOT NULL,
    "application_id" UUID NOT NULL,
    "question_key" TEXT NOT NULL,
    "question_text" TEXT NOT NULL,
    "answer_type" TEXT NOT NULL,
    "answer_value" TEXT NOT NULL,
    "sensitivity" TEXT NOT NULL DEFAULT 'STANDARD',
    "source" TEXT NOT NULL DEFAULT 'USER',
    "confirmation_state" TEXT NOT NULL DEFAULT 'NEEDS_CONFIRMATION',
    "confirmed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "application_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_events" (
    "id" UUID NOT NULL,
    "application_id" UUID NOT NULL,
    "event_type" TEXT NOT NULL,
    "actor_type" TEXT NOT NULL,
    "actor_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "application_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submission_evidence" (
    "id" UUID NOT NULL,
    "application_id" UUID NOT NULL,
    "receipt_id" TEXT,
    "final_url" TEXT,
    "response_hash" TEXT,
    "evidence_level" TEXT NOT NULL,
    "captured_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "submission_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "domain_policies" (
    "id" UUID NOT NULL,
    "domain" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "capabilities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "allowed_modes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" TEXT NOT NULL DEFAULT 'ENABLED',
    "kill_switch_active" BOOLEAN NOT NULL DEFAULT false,
    "terms_url" TEXT,
    "reviewed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "domain_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "connectors" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "connector_type" TEXT NOT NULL,
    "target_domain" TEXT NOT NULL,
    "domain_policy_id" UUID,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "health_status" TEXT NOT NULL DEFAULT 'HEALTHY',
    "current_version" TEXT NOT NULL DEFAULT '1.0.0',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "connectors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "connector_versions" (
    "id" UUID NOT NULL,
    "connector_id" UUID NOT NULL,
    "version" TEXT NOT NULL,
    "capabilities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "fixture_version" TEXT,
    "published_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "connector_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "connector_runs" (
    "id" UUID NOT NULL,
    "application_id" UUID NOT NULL,
    "connector_id" UUID NOT NULL,
    "operation_key" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'QUEUED',
    "attempt" INTEGER NOT NULL DEFAULT 1,
    "failure_category" TEXT,
    "trace_id" TEXT,
    "started_at" TIMESTAMPTZ,
    "completed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "connector_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_providers" (
    "id" UUID NOT NULL,
    "provider_type" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "secret_ref" TEXT,
    "secret_fingerprint" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "health_status" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_task_routes" (
    "id" UUID NOT NULL,
    "task_type" TEXT NOT NULL,
    "environment" TEXT NOT NULL DEFAULT 'demo',
    "provider_id" UUID NOT NULL,
    "model" TEXT NOT NULL,
    "prompt_version" TEXT NOT NULL,
    "schema_version" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "timeout_ms" INTEGER NOT NULL DEFAULT 30000,
    "max_attempts" INTEGER NOT NULL DEFAULT 2,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_task_routes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_runs" (
    "id" UUID NOT NULL,
    "route_id" UUID NOT NULL,
    "user_id" UUID,
    "task_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "input_hash" TEXT,
    "output_hash" TEXT,
    "token_usage" INTEGER,
    "latency_ms" INTEGER,
    "error_code" TEXT,
    "trace_id" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plans" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_versions" (
    "id" UUID NOT NULL,
    "plan_id" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "price_minor" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "interval" TEXT NOT NULL DEFAULT 'month',
    "application_quota" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "effective_from" TIMESTAMPTZ,
    "published_at" TIMESTAMPTZ,
    "stripe_price_id" TEXT,
    "razorpay_plan_id" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plan_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_customers" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_customer_id" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "billing_customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "plan_version_id" UUID NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'mock',
    "provider_sub_id" TEXT,
    "state" TEXT NOT NULL DEFAULT 'FREE',
    "current_period_start" TIMESTAMPTZ,
    "current_period_end" TIMESTAMPTZ,
    "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
    "scheduled_plan_version_id" UUID,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entitlement_periods" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "plan_version_id" UUID NOT NULL,
    "period_start" TIMESTAMPTZ NOT NULL,
    "period_end" TIMESTAMPTZ NOT NULL,
    "quota_limit" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "entitlement_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quota_ledger_entries" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "entitlement_period_id" UUID,
    "application_id" UUID,
    "entry_type" TEXT NOT NULL,
    "units" INTEGER NOT NULL,
    "operation_key" TEXT NOT NULL,
    "reason_code" TEXT,
    "actor_type" TEXT,
    "actor_id" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quota_ledger_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_events" (
    "id" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_event_id" TEXT NOT NULL,
    "signature_verified" BOOLEAN NOT NULL DEFAULT false,
    "state" TEXT NOT NULL DEFAULT 'RECEIVED',
    "payload_hash" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "processed_at" TIMESTAMPTZ,
    "error" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_transactions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_txn_id" TEXT NOT NULL,
    "amount_minor" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'PENDING',
    "plan_version_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "assurance_level" TEXT NOT NULL DEFAULT 'standard',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_roles" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_permissions" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_role_permissions" (
    "role_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,

    CONSTRAINT "admin_role_permissions_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateTable
CREATE TABLE "admin_role_assignments" (
    "admin_user_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,

    CONSTRAINT "admin_role_assignments_pkey" PRIMARY KEY ("admin_user_id","role_id")
);

-- CreateTable
CREATE TABLE "audit_events" (
    "id" UUID NOT NULL,
    "actor_type" TEXT NOT NULL,
    "actor_id" TEXT,
    "admin_user_id" UUID,
    "action" TEXT NOT NULL,
    "target_type" TEXT,
    "target_id" TEXT,
    "reason" TEXT,
    "outcome" TEXT NOT NULL DEFAULT 'SUCCESS',
    "trace_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_cases" (
    "id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "category" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_access_grants" (
    "id" UUID NOT NULL,
    "case_id" UUID NOT NULL,
    "admin_user_id" UUID NOT NULL,
    "scope" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "revoked_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_access_grants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "category" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "params" JSONB,
    "channel" TEXT NOT NULL DEFAULT 'IN_APP',
    "state" TEXT NOT NULL DEFAULT 'PENDING',
    "read_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outbox_events" (
    "id" UUID NOT NULL,
    "event_type" TEXT NOT NULL,
    "aggregate_id" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "processed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "outbox_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "idempotency_records" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "user_id" UUID,
    "request_path" TEXT NOT NULL,
    "response_body" JSONB,
    "status_code" INTEGER,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "idempotency_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_identities_provider_provider_subject_key" ON "user_identities"("provider", "provider_subject");

-- CreateIndex
CREATE UNIQUE INDEX "emails_user_id_value_hash_key" ON "emails"("user_id", "value_hash");

-- CreateIndex
CREATE UNIQUE INDEX "resume_versions_resume_id_version_number_key" ON "resume_versions"("resume_id", "version_number");

-- CreateIndex
CREATE UNIQUE INDEX "jobs_fingerprint_key" ON "jobs"("fingerprint");

-- CreateIndex
CREATE INDEX "applications_user_id_job_id_idx" ON "applications"("user_id", "job_id");

-- CreateIndex
CREATE UNIQUE INDEX "domain_policies_domain_version_key" ON "domain_policies"("domain", "version");

-- CreateIndex
CREATE UNIQUE INDEX "connector_versions_connector_id_version_key" ON "connector_versions"("connector_id", "version");

-- CreateIndex
CREATE UNIQUE INDEX "connector_runs_operation_key_key" ON "connector_runs"("operation_key");

-- CreateIndex
CREATE UNIQUE INDEX "products_slug_key" ON "products"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "plans_slug_key" ON "plans"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "plan_versions_plan_id_version_key" ON "plan_versions"("plan_id", "version");

-- CreateIndex
CREATE UNIQUE INDEX "billing_customers_provider_provider_customer_id_key" ON "billing_customers"("provider", "provider_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_user_id_key" ON "subscriptions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "quota_ledger_entries_operation_key_key" ON "quota_ledger_entries"("operation_key");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_events_provider_provider_event_id_key" ON "webhook_events"("provider", "provider_event_id");

-- CreateIndex
CREATE UNIQUE INDEX "payment_transactions_provider_provider_txn_id_key" ON "payment_transactions"("provider", "provider_txn_id");

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_email_key" ON "admin_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "admin_roles_name_key" ON "admin_roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "admin_permissions_code_key" ON "admin_permissions"("code");

-- CreateIndex
CREATE UNIQUE INDEX "idempotency_records_key_request_path_key" ON "idempotency_records"("key", "request_path");

-- AddForeignKey
ALTER TABLE "user_identities" ADD CONSTRAINT "user_identities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emails" ADD CONSTRAINT "emails_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consents" ADD CONSTRAINT "consents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_profiles" ADD CONSTRAINT "candidate_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experiences" ADD CONSTRAINT "experiences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "candidate_profiles"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "educations" ADD CONSTRAINT "educations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "candidate_profiles"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "candidate_profiles"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_skills" ADD CONSTRAINT "candidate_skills_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "candidate_profiles"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_targets" ADD CONSTRAINT "job_targets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "candidate_profiles"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_preferences" ADD CONSTRAINT "candidate_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "candidate_profiles"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_authorisations" ADD CONSTRAINT "work_authorisations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "candidate_profiles"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resumes" ADD CONSTRAINT "resumes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resume_versions" ADD CONSTRAINT "resume_versions_resume_id_fkey" FOREIGN KEY ("resume_id") REFERENCES "resumes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resume_versions" ADD CONSTRAINT "resume_versions_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "job_sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_snapshots" ADD CONSTRAINT "job_snapshots_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_jobs" ADD CONSTRAINT "saved_jobs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_jobs" ADD CONSTRAINT "saved_jobs_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hidden_jobs" ADD CONSTRAINT "hidden_jobs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hidden_jobs" ADD CONSTRAINT "hidden_jobs_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_assessments" ADD CONSTRAINT "match_assessments_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_answers" ADD CONSTRAINT "application_answers_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_events" ADD CONSTRAINT "application_events_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission_evidence" ADD CONSTRAINT "submission_evidence_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connectors" ADD CONSTRAINT "connectors_domain_policy_id_fkey" FOREIGN KEY ("domain_policy_id") REFERENCES "domain_policies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connector_versions" ADD CONSTRAINT "connector_versions_connector_id_fkey" FOREIGN KEY ("connector_id") REFERENCES "connectors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connector_runs" ADD CONSTRAINT "connector_runs_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connector_runs" ADD CONSTRAINT "connector_runs_connector_id_fkey" FOREIGN KEY ("connector_id") REFERENCES "connectors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_task_routes" ADD CONSTRAINT "ai_task_routes_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "ai_providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_runs" ADD CONSTRAINT "ai_runs_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "ai_task_routes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plans" ADD CONSTRAINT "plans_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_versions" ADD CONSTRAINT "plan_versions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_version_id_fkey" FOREIGN KEY ("plan_version_id") REFERENCES "plan_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entitlement_periods" ADD CONSTRAINT "entitlement_periods_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entitlement_periods" ADD CONSTRAINT "entitlement_periods_plan_version_id_fkey" FOREIGN KEY ("plan_version_id") REFERENCES "plan_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quota_ledger_entries" ADD CONSTRAINT "quota_ledger_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quota_ledger_entries" ADD CONSTRAINT "quota_ledger_entries_entitlement_period_id_fkey" FOREIGN KEY ("entitlement_period_id") REFERENCES "entitlement_periods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_role_permissions" ADD CONSTRAINT "admin_role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "admin_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_role_permissions" ADD CONSTRAINT "admin_role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "admin_permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_role_assignments" ADD CONSTRAINT "admin_role_assignments_admin_user_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "admin_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_role_assignments" ADD CONSTRAINT "admin_role_assignments_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "admin_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_admin_user_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
