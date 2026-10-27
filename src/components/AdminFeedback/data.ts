import { routes } from '../../shared/routes';

export const feedbackCards = [
  {
    id: `formSubmissions`,
    available: true,
    route: routes.adminFormSubmissions,
    description: `Review saved contact form submissions`,
  },
  {
    id: `reviews`,
    available: true,
    route: routes.adminReviews,
    description: `Review private customer ratings and feedback`,
  },
  {
    id: `bugReports`,
    available: true,
    route: routes.adminBugReports,
    description: `Review bug descriptions and supplied screenshot or video links`,
  },
  {
    id: `aiChats`,
    available: true,
    route: routes.adminAIChats,
    description: `Review private support conversations`,
  },
  {
    id: `messages`,
    available: true,
    route: routes.adminMessages,
    description: `Reply to signed-in users and review their message history`,
  },
] as const;

