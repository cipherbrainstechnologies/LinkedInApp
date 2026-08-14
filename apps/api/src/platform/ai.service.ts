import { Injectable } from "@nestjs/common";
import { getConfig } from "@applyflow/config";
import { AiGateway } from "@applyflow/ai";

@Injectable()
export class AiService {
  private readonly gateway: AiGateway;

  constructor() {
    const config = getConfig();
    this.gateway = new AiGateway({
      mockEnabled: true,
      openaiEnabled: config.OPENAI_ENABLED,
      anthropicEnabled: config.ANTHROPIC_ENABLED,
    });
  }

  getGateway(): AiGateway {
    return this.gateway;
  }
}
