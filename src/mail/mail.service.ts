import got from 'got';
import * as FormData from 'form-data';
import { Inject, Injectable } from '@nestjs/common';
import { CONFIG_OPTIONS } from 'src/common/common.constants';
import { EmailVar, MailModuleOptions } from './mail.interfaces';

@Injectable()
export class MailService {
  constructor(
    @Inject(CONFIG_OPTIONS) private readonly options: MailModuleOptions,
  ) {}

  async sendEmail(
    subject: string,
    template: string,
    emailVars: EmailVar[],
  ): Promise<boolean> {
    const formData = new FormData();
    formData.append(
      'from',
      `Funo from Nuber Eats <nubereats@${this.options.domain}>`,
    );
    formData.append('to', 'amthetop21@gmail.com');
    formData.append('subject', subject);
    formData.append('template', template);
    emailVars.forEach(({ key, value }) => formData.append(key, value));
    try {
      await got.post(
        `https://api.mailgun.net/v3/${this.options.domain}/messages`,
        {
          headers: {
            Authorization: `Basic ${Buffer.from(
              `api:${this.options.apiKey}`,
            ).toString('base64')}`,
          },
          body: formData,
        },
      );
      return true;
    } catch {
      return false;
    }
  }

  sendVerificationEmail(email: string, code: string) {
    this.sendEmail('Verify Your Email', 'verification', [
      { key: 'v:code', value: code },
      { key: 'v:username', value: email },
    ]);
  }
}
