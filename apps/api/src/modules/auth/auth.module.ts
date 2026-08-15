import { Module } from "@nestjs/common";
import { AuthController, SessionsController } from "./auth.controller.js";
import { AuthService } from "./auth.service.js";

@Module({
  controllers: [AuthController, SessionsController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
