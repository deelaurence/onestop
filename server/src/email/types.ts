export interface EmailAddress {
  email: string;
  name?: string;
}

export interface EmailPayload {
  to: EmailAddress | EmailAddress[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: EmailAddress;
}

export interface EmailSendResult {
  id?: string;
}

export interface EmailProvider {
  readonly name: string;
  send(payload: EmailPayload): Promise<EmailSendResult>;
}
