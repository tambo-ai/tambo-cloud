import { Controller, Post, Body } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { EmailService } from "../common/services/email.service";

@ApiTags("scheduler")
@Controller("scheduler")
export class SchedulerController {
  constructor(private readonly emailService: EmailService) {}

  @Post("test-reactivation-email")
  async testReactivationEmail(
    @Body() body: { email: string; firstName?: string; projectName?: string },
  ) {
    console.log(`Sending test reactivation email to ${body.email}`);

    const result = await this.emailService.sendReactivationEmail(
      body.email,
      body.firstName ? 0 : 1,
      body.projectName ? true : false,
    );

    return {
      message: "Test reactivation email sent",
      success: result.success,
      email: body.email,
    };
  }

  @Post("test-first-message-email")
  async testFirstMessageEmail(
    @Body() body: { email: string; firstName?: string; projectName?: string },
  ) {
    console.log(`Sending test first message email to ${body.email}`);

    const result = await this.emailService.sendFirstMessageEmail(
      body.email,
      body.firstName,
      body.projectName,
    );

    return {
      message: "Test first message email sent",
      success: result.success,
      email: body.email,
    };
  }
}
