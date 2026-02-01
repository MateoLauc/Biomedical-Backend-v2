export type Notification = {
  id: string;
  userId: string;
  title: string;
  body: string;
  readAt: Date | null;
  createdAt: Date;
};

export type ListNotificationsQuery = {
  unreadOnly?: boolean | string;
  page?: number;
  limit?: number;
};
