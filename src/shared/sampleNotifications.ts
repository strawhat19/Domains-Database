export interface HeaderNotification {
  id: string;
  title: string;
  before: string;
  after: string;
  icon: `Info` | `Sparkles`;
}

export const sampleNotifications: readonly HeaderNotification[] = [
  {
    id: `development`,
    icon: `Info`,
    title: `In development`,
    after: ` to let us know you are interested`,
    before: `This application is in development, `,
  },
  {
    id: `support`,
    icon: `Sparkles`,
    after: ` to support us!`,
    title: `A note about ads`,
    before: `We are sorry to show ads, we are only doing this to support our small business, please `,
  },
];

export const sampleNotificationCount = sampleNotifications.length;
