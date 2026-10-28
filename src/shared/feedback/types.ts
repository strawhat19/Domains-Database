export type FeedbackKind = `review` | `bug`;
export type FeedbackStatus = `new` | `read` | `archived`;

export interface SupportThread {
  id: string;
  number: number;
  type: `SupportThread`;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  subject: string;
  status: `open` | `closed`;
  created: string;
  updated: string;
  lastMessageNumber: number;
  lastMessageAt: string;
  lastMessageText: string;
  lastSenderId: string;
}

export interface SupportMessage {
  id: string;
  number: number;
  type: `SupportMessage`;
  threadId: string;
  senderId: string;
  senderName: string;
  senderKind: `customer` | `owner`;
  body: string;
  created: string;
}

export interface SupportReadState {
  threadId: string;
  userId: string;
  lastMessageNumber: number;
  updated: string;
}

export interface FeedbackEntry {
  id: string;
  number: number;
  type: `Feedback`;
  kind: FeedbackKind;
  authorId: string;
  authorName: string;
  authorEmail: string;
  authorPhone?: string;
  title: string;
  description: string;
  mediaUrl: string;
  rating: number | null;
  status: FeedbackStatus;
  created: string;
  updated: string;
}

export interface SupportContactInput { subject: string; message: string; phone?: string }
export interface ReviewInput { rating: number; title?: string; description: string }
export interface BugReportInput { title?: string; description?: string; mediaUrl?: string }
export interface GuestFeedbackIdentity { name: string; email: string; phone?: string; website?: string }
export interface GuestReviewInput extends GuestFeedbackIdentity, ReviewInput {}
export interface GuestBugReportInput extends GuestFeedbackIdentity, BugReportInput {}
export type FeedbackReceipt = Pick<FeedbackEntry, `id` | `number` | `kind`>;

export const feedbackLimits = { threads: 40, messages: 50, entries: 50, title: 200, description: 5000, mediaUrl: 2000 } as const;
