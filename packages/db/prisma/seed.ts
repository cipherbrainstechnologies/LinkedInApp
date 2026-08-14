import { config } from "dotenv";
import { resolve } from "node:path";
config({ path: resolve(import.meta.dirname, "../../../.env") });

import { PrismaClient } from "@prisma/client";
import { createHash } from "node:crypto";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding ApplyFlow demo data...");

  // Products & Plans
  const product = await prisma.product.upsert({
    where: { slug: "applyflow" },
    create: { name: "ApplyFlow", slug: "applyflow", status: "ACTIVE" },
    update: {},
  });

  const freePlan = await prisma.plan.upsert({
    where: { slug: "free" },
    create: { productId: product.id, name: "Free", slug: "free", status: "ACTIVE" },
    update: {},
  });

  const launchPlan = await prisma.plan.upsert({
    where: { slug: "launch" },
    create: { productId: product.id, name: "Launch 50", slug: "launch", status: "ACTIVE" },
    update: {},
  });

  const powerPlan = await prisma.plan.upsert({
    where: { slug: "power" },
    create: { productId: product.id, name: "Power 100", slug: "power", status: "ACTIVE" },
    update: {},
  });

  const freeVersion = await prisma.planVersion.upsert({
    where: { planId_version: { planId: freePlan.id, version: 1 } },
    create: {
      planId: freePlan.id,
      version: 1,
      priceMinor: 0,
      currency: "INR",
      applicationQuota: 5,
      status: "PUBLISHED",
      publishedAt: new Date(),
      effectiveFrom: new Date(),
    },
    update: {},
  });

  const launchVersion = await prisma.planVersion.upsert({
    where: { planId_version: { planId: launchPlan.id, version: 1 } },
    create: {
      planId: launchPlan.id,
      version: 1,
      priceMinor: 99900,
      currency: "INR",
      applicationQuota: 50,
      status: "PUBLISHED",
      publishedAt: new Date(),
      effectiveFrom: new Date(),
    },
    update: {},
  });

  const powerVersion = await prisma.planVersion.upsert({
    where: { planId_version: { planId: powerPlan.id, version: 1 } },
    create: {
      planId: powerPlan.id,
      version: 1,
      priceMinor: 149900,
      currency: "INR",
      applicationQuota: 100,
      status: "PUBLISHED",
      publishedAt: new Date(),
      effectiveFrom: new Date(),
    },
    update: {},
  });

  // Job source
  const jobSource = await prisma.jobSource.upsert({
    where: { id: "00000000-0000-4000-8000-000000000001" },
    create: {
      id: "00000000-0000-4000-8000-000000000001",
      provider: "mock",
      name: "Mock Jobs",
      sourceType: "LICENSED",
      status: "ACTIVE",
      capabilities: ["DISCOVER", "IMPORT_PUBLIC_JOB"],
    },
    update: {},
  });

  // Seed jobs
  const jobs = [
    {
      title: "Software Engineer",
      company: "TechCorp India",
      location: "Bangalore",
      workMode: "HYBRID",
      employmentType: "FULL_TIME",
      description: "Build scalable backend services with TypeScript and PostgreSQL.",
      salaryMinMinor: 12000000,
      salaryMaxMinor: 18000000,
      salaryCurrency: "INR",
      policyMode: "AUTO",
      domain: "mock-ats.applyflow.local",
      fingerprint: "job:software-engineer-techcorp",
    },
    {
      title: "Frontend Developer",
      company: "DesignFirst",
      location: "Mumbai",
      workMode: "REMOTE",
      employmentType: "FULL_TIME",
      description: "React and TypeScript for responsive job search experiences.",
      policyMode: "AUTO",
      domain: "mock-ats.applyflow.local",
      fingerprint: "job:frontend-designfirst",
    },
    {
      title: "Data Analyst Intern",
      company: "AnalyticsHub",
      location: "Hyderabad",
      workMode: "ON_SITE",
      employmentType: "INTERNSHIP",
      description: "Entry-level data analysis internship for fresh graduates.",
      policyMode: "AUTO",
      domain: "mock-ats.applyflow.local",
      fingerprint: "job:data-analyst-intern",
    },
    {
      title: "Senior Backend Engineer",
      company: "Enterprise Co",
      location: "Delhi",
      workMode: "HYBRID",
      employmentType: "FULL_TIME",
      description: "Requires 8+ years experience. US work authorization required.",
      eligibilityBlockers: ["REQUIRES_8_PLUS_YEARS", "REQUIRES_US_WORK_AUTHORIZATION"],
      policyMode: "AUTO",
      domain: "mock-ats.applyflow.local",
      fingerprint: "job:senior-backend-enterprise",
    },
    {
      title: "Product Manager",
      company: "StartupXYZ",
      location: "Pune",
      workMode: "HYBRID",
      employmentType: "FULL_TIME",
      description: "Lead product strategy for B2B SaaS platform.",
      policyMode: "AUTO",
      domain: "mock-ats.applyflow.local",
      fingerprint: "job:product-manager-startup",
    },
  ];

  for (const job of jobs) {
    await prisma.job.upsert({
      where: { fingerprint: job.fingerprint },
      create: {
        ...job,
        sourceId: jobSource.id,
        postedAt: new Date(),
        status: "ACTIVE",
      },
      update: job,
    });
  }

  // Domain policy for mock ATS
  const policy = await prisma.domainPolicy.upsert({
    where: { domain_version: { domain: "mock-ats.applyflow.local", version: 1 } },
    create: {
      domain: "mock-ats.applyflow.local",
      version: 1,
      capabilities: ["IMPORT_PUBLIC_JOB", "EXTRACT_PUBLIC_JOB", "PREFILL", "UPLOAD_RESUME", "ANSWER_SCREENING", "SUBMIT", "VERIFY"],
      allowedModes: ["AUTO", "CONFIRM_EACH"],
      status: "ENABLED",
    },
    update: {},
  });

  const connector = await prisma.connector.upsert({
    where: { id: "00000000-0000-4000-8000-000000000002" },
    create: {
      id: "00000000-0000-4000-8000-000000000002",
      name: "Mock ATS Connector",
      connectorType: "API",
      targetDomain: "mock-ats.applyflow.local",
      domainPolicyId: policy.id,
      status: "ACTIVE",
      healthStatus: "HEALTHY",
      currentVersion: "1.0.0",
    },
    update: {},
  });

  await prisma.connectorVersion.upsert({
    where: { connectorId_version: { connectorId: connector.id, version: "1.0.0" } },
    create: {
      connectorId: connector.id,
      version: "1.0.0",
      capabilities: ["SUBMIT", "VERIFY"],
      status: "ACTIVE",
      fixtureVersion: "1",
    },
    update: {},
  });

  // LinkedIn policy - assisted only
  await prisma.domainPolicy.upsert({
    where: { domain_version: { domain: "linkedin.com", version: 1 } },
    create: {
      domain: "linkedin.com",
      version: 1,
      capabilities: ["IMPORT_PUBLIC_JOB"],
      allowedModes: ["ASSISTED", "TRACK_ONLY"],
      status: "ENABLED",
    },
    update: {},
  });

  // AI provider mock
  const aiProvider = await prisma.aiProvider.upsert({
    where: { id: "00000000-0000-4000-8000-000000000003" },
    create: {
      id: "00000000-0000-4000-8000-000000000003",
      providerType: "mock",
      displayName: "Mock AI",
      enabled: true,
      healthStatus: "HEALTHY",
    },
    update: {},
  });

  await prisma.aiTaskRoute.upsert({
    where: { id: "00000000-0000-4000-8000-000000000004" },
    create: {
      id: "00000000-0000-4000-8000-000000000004",
      taskType: "RESUME_EXTRACTION",
      environment: "demo",
      providerId: aiProvider.id,
      model: "mock-extractor-v1",
      promptVersion: "1.0",
      schemaVersion: "1.0",
      status: "PUBLISHED",
    },
    update: {},
  });

  // Admin roles & permissions
  const permissions = [
    "customers.read",
    "quota.adjust",
    "connectors.manage",
    "audit.read",
    "plans.manage",
    "billing.read",
    "ai.manage",
  ];

  for (const code of permissions) {
    await prisma.adminPermission.upsert({
      where: { code },
      create: { code },
      update: {},
    });
  }

  const supportRole = await prisma.adminRole.upsert({
    where: { name: "support" },
    create: { name: "support" },
    update: {},
  });

  const financeRole = await prisma.adminRole.upsert({
    where: { name: "finance" },
    create: { name: "finance" },
    update: {},
  });

  const opsRole = await prisma.adminRole.upsert({
    where: { name: "ops" },
    create: { name: "ops" },
    update: {},
  });

  const auditorRole = await prisma.adminRole.upsert({
    where: { name: "auditor" },
    create: { name: "auditor" },
    update: {},
  });

  const supportPerms = ["customers.read", "quota.adjust", "audit.read"];
  const financePerms = ["customers.read", "billing.read", "plans.manage", "audit.read"];
  const opsPerms = ["connectors.manage", "audit.read"];
  const auditorPerms = ["audit.read"];

  for (const code of supportPerms) {
    const perm = await prisma.adminPermission.findUniqueOrThrow({ where: { code } });
    await prisma.adminRolePermission.upsert({
      where: { roleId_permissionId: { roleId: supportRole.id, permissionId: perm.id } },
      create: { roleId: supportRole.id, permissionId: perm.id },
      update: {},
    });
  }

  for (const code of financePerms) {
    const perm = await prisma.adminPermission.findUniqueOrThrow({ where: { code } });
    await prisma.adminRolePermission.upsert({
      where: { roleId_permissionId: { roleId: financeRole.id, permissionId: perm.id } },
      create: { roleId: financeRole.id, permissionId: perm.id },
      update: {},
    });
  }

  for (const code of opsPerms) {
    const perm = await prisma.adminPermission.findUniqueOrThrow({ where: { code } });
    await prisma.adminRolePermission.upsert({
      where: { roleId_permissionId: { roleId: opsRole.id, permissionId: perm.id } },
      create: { roleId: opsRole.id, permissionId: perm.id },
      update: {},
    });
  }

  for (const code of auditorPerms) {
    const perm = await prisma.adminPermission.findUniqueOrThrow({ where: { code } });
    await prisma.adminRolePermission.upsert({
      where: { roleId_permissionId: { roleId: auditorRole.id, permissionId: perm.id } },
      create: { roleId: auditorRole.id, permissionId: perm.id },
      update: {},
    });
  }

  const admins = [
    { email: "support@demo.applyflow.local", role: supportRole.id },
    { email: "finance@demo.applyflow.local", role: financeRole.id },
    { email: "ops@demo.applyflow.local", role: opsRole.id },
    { email: "auditor@demo.applyflow.local", role: auditorRole.id },
  ];

  for (const admin of admins) {
    const user = await prisma.adminUser.upsert({
      where: { email: admin.email },
      create: { email: admin.email, displayName: admin.email.split("@")[0] },
      update: {},
    });
    await prisma.adminRoleAssignment.upsert({
      where: { adminUserId_roleId: { adminUserId: user.id, roleId: admin.role } },
      create: { adminUserId: user.id, roleId: admin.role },
      update: {},
    });
  }

  // Seed experienced-launch persona with subscription and consumed quota
  const launchEmail = "experienced.launch@demo.applyflow.local";
  let launchUser = await prisma.user.findFirst({
    where: { emails: { some: { displayValue: launchEmail } } },
  });

  if (!launchUser) {
    launchUser = await prisma.user.create({
      data: {
        onboardingPath: "EXPERIENCED",
        onboardingState: "COMPLETED",
        emails: {
          create: {
            displayValue: launchEmail,
            valueHash: createHash("sha256").update(launchEmail).digest("hex"),
            verified: true,
            isPrimary: true,
            verifiedAt: new Date(),
          },
        },
        identities: {
          create: {
            provider: "demo",
            providerSubject: "experienced-launch",
            emailClaim: launchEmail,
            claimVerified: true,
          },
        },
        candidateProfile: {
          create: {
            preferredName: "Launch User",
            legalName: "Launch User",
            jobTargets: {
              create: [{ title: "Software Engineer", priority: 0 }],
            },
            preferences: {
              create: { locations: ["Bangalore"], remoteModes: ["HYBRID", "REMOTE"] },
            },
          },
        },
      },
    });
  }

  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  const period = await prisma.entitlementPeriod.upsert({
    where: { id: "00000000-0000-4000-8000-000000000010" },
    create: {
      id: "00000000-0000-4000-8000-000000000010",
      userId: launchUser.id,
      planVersionId: launchVersion.id,
      periodStart: now,
      periodEnd,
      quotaLimit: 50,
      status: "ACTIVE",
    },
    update: {},
  });

  await prisma.subscription.upsert({
    where: { userId: launchUser.id },
    create: {
      userId: launchUser.id,
      planVersionId: launchVersion.id,
      state: "ACTIVE",
      provider: "mock",
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
    },
    update: {},
  });

  // Grant 50, consume 20
  await prisma.quotaLedgerEntry.upsert({
    where: { operationKey: `seed-grant:${launchUser.id}` },
    create: {
      userId: launchUser.id,
      entitlementPeriodId: period.id,
      entryType: "GRANT",
      units: 50,
      operationKey: `seed-grant:${launchUser.id}`,
      reasonCode: "SEED_LAUNCH_PLAN",
      actorType: "SYSTEM",
    },
    update: {},
  });

  for (let i = 0; i < 20; i++) {
    const opKey = `seed-consume:${launchUser.id}:${i}`;
    await prisma.quotaLedgerEntry.upsert({
      where: { operationKey: opKey },
      create: {
        userId: launchUser.id,
        entitlementPeriodId: period.id,
        entryType: "CONSUME",
        units: 1,
        operationKey: opKey,
        reasonCode: "SEED_USAGE",
        actorType: "SYSTEM",
      },
      update: {},
    });
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
