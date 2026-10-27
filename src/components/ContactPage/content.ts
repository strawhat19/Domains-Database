import { feedbackLimits } from '../../shared/feedback/types';

export const feedbackTabs = [
  { id: `contact`, label: `Contact`, title: `Start a conversation`, description: `Send a private message and continue the conversation with our team.`, submit: `Start Chat`, pending: `Opening Chat…` },
  { id: `review`, label: `Review`, title: `Share your experience`, description: `Leave a rating and review for our team to read. Your feedback stays private.`, submit: `Submit Review`, pending: `Saving Review…` },
  { id: `bug`, label: `Bug`, title: `Help us fix a bug`, description: `Add a description or a publicly accessible screenshot or video URL. Either is enough.`, submit: `Submit Bug Report`, pending: `Saving Bug Report…` },
] as const;

interface FeedbackFormField {
  id: `subject` | `phone` | `message` | `title` | `description` | `mediaUrl`;
  label: string;
  placeholder: string;
  limit: number;
  required: boolean;
  multiline: boolean;
}
export const feedbackFormFields: Record<typeof feedbackTabs[number][`id`], readonly FeedbackFormField[]> = {
  contact: [
    { id: `subject`, label: `Subject`, placeholder: `What can we help with?`, limit: feedbackLimits.title, required: true, multiline: false },
    { id: `phone`, label: `Phone Number (Optional)`, placeholder: `Your phone number`, limit: 40, required: false, multiline: false },
    { id: `message`, label: `Message`, placeholder: `Tell us a little more…`, limit: feedbackLimits.description, required: true, multiline: true },
  ],
  review: [
    { id: `title`, label: `Title (Optional)`, placeholder: `A few words about your experience`, limit: feedbackLimits.title, required: false, multiline: false },
    { id: `description`, label: `Your Review`, placeholder: `What has your experience been like?`, limit: feedbackLimits.description, required: true, multiline: true },
  ],
  bug: [
    { id: `title`, label: `Title (Optional)`, placeholder: `A short name for the issue`, limit: feedbackLimits.title, required: false, multiline: false },
    { id: `description`, label: `Description`, placeholder: `What happened, and what did you expect?`, limit: feedbackLimits.description, required: false, multiline: true },
    { id: `mediaUrl`, label: `Public Screenshot Or Video URL`, placeholder: `https://…`, limit: feedbackLimits.mediaUrl, required: false, multiline: false },
  ],
};

export const contactFields = [
  { id: `name`, label: `Name`, limit: 100, placeholder: `Your name` },
  { id: `email`, label: `Email`, limit: 254, placeholder: `you@example.com` },
  { id: `phone`, label: `Phone Number (Optional)`, limit: 40, placeholder: `Your phone number` },
  { id: `subject`, label: `Subject`, limit: 200, placeholder: `What can we help with?` },
  { id: `message`, label: `Message`, limit: 5000, placeholder: `Tell us a little more…` },
] as const;

export const contactTopics = [
  { id: `support`, label: `A little help`, copy: `Questions about your workspace or a registrar connection? Tell us where you got stuck.` },
  { id: `ideas`, label: `Your next idea`, copy: `A feature you would love, a detail we could improve, or something worth building together.` },
] as const;

export const contactDescription = `Questions about your domain portfolio, account, billing, or privacy? Contact the Domains Database team with the form when it is available.`;
