import { Body, Controller, Get, Headers, Post, UseGuards } from "@nestjs/common";
import { Module } from "@nestjs/common";
import { AuthGuard, CurrentUserId } from "../../platform/auth.guard.js";
import { BillingService } from "./billing.service.js";

@Controller("billing")
@UseGuards(AuthGuard)
class BillingController {
  constructor(private readonly billing: BillingService) {}

  @Get("plans")
  getPlans() {
    return this.billing.getPlans();
  }

  @Get("subscription")
  getSubscription(@CurrentUserId() userId: string) {
    return this.billing.getSubscription(userId);
  }

  @Post("upgrade/preview")
  previewUpgrade(@CurrentUserId() userId: string, @Body() body: { planVersionId: string }) {
    return this.billing.previewUpgrade(userId, body.planVersionId);
  }

  @Post("upgrade/confirm")
  confirmUpgrade(
    @CurrentUserId() userId: string,
    @Body() body: { planVersionId: string },
    @Headers("idempotency-key") idempotencyKey?: string,
  ) {
    return this.billing.confirmUpgrade(userId, body.planVersionId, idempotencyKey);
  }

  @Post("downgrade")
  scheduleDowngrade(@CurrentUserId() userId: string, @Body() body: { planVersionId: string }) {
    return this.billing.scheduleDowngrade(userId, body.planVersionId);
  }
}

@Controller("billing/webhooks")
class BillingWebhookController {
  constructor(private readonly billing: BillingService) {}

  @Post("mock")
  mockWebhook(
    @Body()
    body: {
      paymentId: string;
      event: string;
      providerEventId?: string;
    },
  ) {
    return this.billing.processMockWebhook(body);
  }
}

@Module({
  providers: [BillingService],
  controllers: [BillingController, BillingWebhookController],
})
export class BillingModule {}
