import * as service from '../shared/feedback/service';

export const feedbackAPI = {
  submitBug: service.submitBug,
  sendMessage: service.sendMessage,
  submitReview: service.submitReview,
  submitContact: service.submitContact,
  markThreadRead: service.markThreadRead,
  subscribeThreads: service.subscribeThreads,
  getMessagesPage: service.getMessagesPage,
  getOlderMessages: service.getOlderMessages,
  subscribeFeedback: service.subscribeFeedback,
  subscribeMessages: service.subscribeMessages,
  updateFeedbackStatus: service.updateFeedbackStatus,
  subscribeThreadReadState: service.subscribeThreadReadState,
};
