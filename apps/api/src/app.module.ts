import { Module } from "@nestjs/common";
import { HealthModule } from "./modules/health/health.module.js";
import { AuthModule } from "./modules/auth/auth.module.js";
import { MeModule } from "./modules/me/me.module.js";
import { OnboardingModule } from "./modules/onboarding/onboarding.module.js";
import { ProfileModule } from "./modules/profile/profile.module.js";
import { ResumesModule } from "./modules/resumes/resumes.module.js";
import { JobsModule } from "./modules/jobs/jobs.module.js";
import { ApplicationsModule } from "./modules/applications/applications.module.js";
import { BillingModule } from "./modules/billing/billing.module.js";
import { AdminModule } from "./modules/admin/admin.module.js";
import { PlatformModule } from "./platform/platform.module.js";

@Module({
  imports: [
    PlatformModule,
    HealthModule,
    AuthModule,
    MeModule,
    OnboardingModule,
    ProfileModule,
    ResumesModule,
    JobsModule,
    ApplicationsModule,
    BillingModule,
    AdminModule,
  ],
})
export class AppModule {}
