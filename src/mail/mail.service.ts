import { Injectable, Logger } from '@nestjs/common';
import * as Mailjet from 'node-mailjet';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
    private mailjet: any;
    private readonly logger = new Logger(MailService.name);

    constructor(private configService: ConfigService) {
        const apiKey = this.configService.get<string>('MAILJET_API_KEY_PUBLIC') || this.configService.get<string>('MJ_APIKEY_PUBLIC');
        const apiSecret = this.configService.get<string>('MAILJET_API_KEY_PRIVATE') || this.configService.get<string>('MJ_APIKEY_PRIVATE');

        if (apiKey && apiSecret) {
            this.mailjet = new Mailjet.Client({
                apiKey,
                apiSecret,
            });
        } else {
            this.logger.warn('Mailjet API keys are missing. Email sending will be disabled.');
        }
    }

    async sendInvitation(email: string, token: string) {
        if (!this.mailjet) {
            this.logger.warn(`Cannot send invitation to ${email}: Mailjet not configured.`);
            return;
        }

        const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
        const link = `${frontendUrl}/invite/${token}`;

        try {
            const response = await this.mailjet.post('send', { version: 'v3.1' }).request({
                Messages: [
                    {
                        From: {
                            Email: this.configService.get<string>('MAILJET_FROM_EMAIL') || "admin@dailyfoot.com",
                            Name: this.configService.get<string>('MAILJET_FROM_NAME') || "DailyFoot Admin"
                        },
                        To: [
                            {
                                Email: email,
                                Name: "New Player"
                            }
                        ],
                        Subject: "Bienvenue sur DailyFoot - Finalisez votre inscription",
                        HTMLPart: `
                            <h3>Bienvenue sur DailyFoot !</h3>
                            <p>Votre agent vous a invité à rejoindre la plateforme.</p>
                            <p>Cliquez sur le lien ci-dessous pour créer votre mot de passe et accéder à votre espace :</p>
                            <a href="${link}">Finaliser mon inscription</a>
                            <p>Ce lien expirera dans 15 minutes.</p>
                        `,
                    }
                ]
            });
            this.logger.log(`Invitation sent to ${email}. MessageID: ${response.body.Messages[0]?.To[0]?.MessageID}`);
        } catch (error: any) {
            this.logger.error(`Error sending invitation email: ${error.message}`, error.stack);
            if (error.response) this.logger.error('API Response:', JSON.stringify(error.response.data));
            throw error;
        }
    }

    async sendPasswordReset(email: string, token: string) {
        if (!this.mailjet) {
            this.logger.warn(`Cannot send password reset to ${email}: Mailjet not configured.`);
            return;
        }

        const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
        const link = `${frontendUrl}/reset-password/${token}`;

        try {
            const response = await this.mailjet.post('send', { version: 'v3.1' }).request({
                Messages: [
                    {
                        From: {
                            Email: this.configService.get<string>('MAILJET_FROM_EMAIL') || "admin@dailyfoot.com",
                            Name: this.configService.get<string>('MAILJET_FROM_NAME') || "DailyFoot Security"
                        },
                        To: [
                            {
                                Email: email
                            }
                        ],
                        Subject: "Réinitialisation de votre mot de passe",
                        HTMLPart: `
                            <h3>Mot de passe oublié ?</h3>
                            <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
                            <p>Cliquez sur le lien ci-dessous pour en créer un nouveau :</p>
                            <a href="${link}">Réinitialiser mon mot de passe</a>
                            <p>Ce lien expirera dans 15 minutes.</p>
                        `,
                    }
                ]
            });
            this.logger.log(`Password reset sent to ${email}. Status: ${response.body.Messages[0]?.Status}`);
        } catch (error: any) {
            this.logger.error(`Error sending reset email: ${error.message}`, error.stack);
            if (error.response) this.logger.error('API Response:', JSON.stringify(error.response.data));
            throw error;
        }
    }
}
