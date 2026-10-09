import { Inject } from "@nestjs/common";
import { RESEND_UTILITY } from "src/core/tokens/utility.token";
import { IEmailUtility } from "src/core/utility/interface/email-utility.interface";
import { IEmailService } from "src/infra/interface/email-service.interface";

export class EmailService implements IEmailService {
    constructor(
        @Inject(RESEND_UTILITY)
        private readonly _emailUtility: IEmailUtility,
    ) { }

    async sendOtp(email: string, otp: string,): Promise<void> {
        await this._emailUtility.sendEmail({
            to: email,
            subject: 'Your verification code',
            text: `
Your verification code is ${otp}.

This code will expire in 10 minutes.

If you did not request this code, you can ignore this email.
            `,
            html: `
                <div style="
                    font-family: Arial, sans-serif;
                    max-width: 500px;
                    margin: 0 auto;
                    padding: 30px;
                ">

                    <h2>Email Verification</h2>

                    <p>
                        Use the following code to verify your email:
                    </p>

                    <div style="
                        font-size: 32px;
                        font-weight: bold;
                        letter-spacing: 8px;
                        margin: 25px 0;
                    ">
                        ${otp}
                    </div>

                    <p>
                        This code will expire in
                        <strong>5 minutes</strong>.
                    </p>

                    <p>
                        If you did not request this code,
                        you can safely ignore this email.
                    </p>

                </div>
            `,
        });
    }
}