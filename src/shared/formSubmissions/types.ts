export type SubmissionStatus = `new` | `read` | `archived`;

export interface ContactSubmissionInput {
  name: string;
  email: string;
  subject: string;
  message: string;
  website?: string;
}
