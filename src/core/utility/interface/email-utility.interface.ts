export interface SendEmailPayload {
    to: string | string[];
    subject: string;
    html: string;
    text?: string;
}

export interface IEmailUtility {
    sendEmail(
        payload: SendEmailPayload,
    ): Promise<void>;
}