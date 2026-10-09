import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { ErrorMessagesEnum } from 'src/core/enums/errors.enum';

import { IEmailUtility, SendEmailPayload, } from 'src/core/utility/interface/email-utility.interface';

@Injectable()
export class ResendUtility implements IEmailUtility {

    private readonly resend: Resend;
    private readonly from: string;

    constructor(
        private readonly configService: ConfigService,
    ) {
        const apiKey = this.configService.getOrThrow<string>(
            'RESEND_API_KEY',
        );

        this.from = this.configService.getOrThrow<string>(
            'MAIL_FROM',
        );

        this.resend = new Resend(apiKey);
    }

    async sendEmail(payload: SendEmailPayload): Promise<void> {

        const { error } = await this.resend.emails.send({
            from: this.from,
            to: payload.to,
            subject: payload.subject,
            html: payload.html,
            text: payload.text,
        });

        if (error) {
            throw new InternalServerErrorException(ErrorMessagesEnum.EmailSentFailed);
        }
    }
}