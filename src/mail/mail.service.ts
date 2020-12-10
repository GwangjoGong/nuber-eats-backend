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

  private async sendEmail(
    subject: string,
    template: string,
    emailVars: EmailVar[],
  ) {
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
      await got(`https://api.mailgun.net/v3/${this.options.domain}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(
            `api:${this.options.apiKey}`,
          ).toString('base64')}`,
        },
        body: formData,
      });
    } catch (error) {
      console.log(error);
    }
  }

  sendVerificationEmail(email: string, code: string) {
    this.sendEmail('Verify Your Email', 'verification', [
      { key: 'v:code', value: code },
      { key: 'v:username', value: email },
    ]);
  }
}
