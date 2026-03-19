import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.config.get<string>('SMTP_HOST', 'smtp.office365.com'),
      port: this.config.get<number>('SMTP_PORT', 587),
      secure: false, // TLS requires false for Outlook
      auth: {
        user: this.config.get<string>('SMTP_USER', ''),
        pass: this.config.get<string>('SMTP_PASS', ''),
      },
      tls: {
        ciphers: 'SSLv3', // sometimes needed for outlook
        rejectUnauthorized: false
      }
    });
  }

  async sendMail(to: string, subject: string, html: string): Promise<boolean> {
    const user = this.config.get<string>('SMTP_USER');
    if (!user) {
      this.logger.warn(`Conta SMTP_USER ausente. Pulando disparo de email para: ${to}`);
      return false;
    }
    
    try {
      await this.transporter.sendMail({
        from: `"CONEXTRAVEL TI" <${user}>`,
        to,
        subject,
        html,
      });
      this.logger.log(`E-mail com assunto '${subject}' enviado para ${to}`);
      return true;
    } catch (error: any) {
      this.logger.error(`Falha ao disparar e-mail para ${to}: ${error.message}`);
      return false;
    }
  }
}
