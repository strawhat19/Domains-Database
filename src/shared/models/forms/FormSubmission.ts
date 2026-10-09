import { Types } from '../../../types/types';
import { Data, type JSONValue } from '../Data';
import type { SubmissionStatus } from '../../formSubmissions/types';

export class FormSubmission extends Data {
  form: `contact`;
  subject: string;
  message: string;
  status: SubmissionStatus;

  constructor(data: Partial<FormSubmission> = {}) {
    super({ ...data, name: `Contact`, type: Types.FormSubmission });
    this.form = `contact`;
    this.name = data.name?.trim() ?? ``;
    this.subject = data.subject?.trim() ?? ``;
    this.message = data.message?.trim() ?? ``;
    this.status = data.status ?? `new`;
    this.refreshProperties();
  }

  toRecord(): Record<string, JSONValue> {
    return {
      id: this.id,
      uid: this.uid,
      form: this.form,
      name: this.name,
      type: this.type,
      email: this.email,
      number: this.number,
      status: this.status,
      subject: this.subject,
      message: this.message,
      created: this.created,
      updated: this.updated,
    };
  }
}
