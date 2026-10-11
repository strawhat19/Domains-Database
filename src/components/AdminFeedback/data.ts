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
    available: false,
    route: routes.adminReviews,
    description: `Future customer reviews and ratings`,
  },
  {
    id: `aiChats`,
    available: false,
    route: routes.adminAIChats,
    description: `Future chatbot conversation history`,
  },
  {
    id: `messages`,
    available: false,
    route: routes.adminMessages,
    description: `Future private message inbox`,
  },
] as const;

export const feedbackComingSoon = {
  reviews: {
    route: routes.adminReviews,
    description: `Customer reviews and ratings will be collected and reviewed here once the review workflow is added.`,
  },
  aiChats: {
    route: routes.adminAIChats,
    description: `Chatbot conversations will appear here after the future AI chat workflow is connected.`,
  },
  messages: {
    route: routes.adminMessages,
    description: `Private conversations will have a dedicated inbox here once the messaging workflow is added.`,
  },
} as const;
