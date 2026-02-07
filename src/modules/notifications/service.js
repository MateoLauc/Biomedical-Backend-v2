import { notificationsRepo } from "./repo";
import { notFound } from "../../lib/http-errors";
export const notificationsService = {
    async list(userId, query) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const offset = (page - 1) * limit;
        const unreadOnly = query.unreadOnly === "true" || query.unreadOnly === true;
        const [notificationsList, total] = await Promise.all([
            notificationsRepo.listByUserId(userId, { unreadOnly, limit, offset }),
            notificationsRepo.countByUserId(userId, unreadOnly)
        ]);
        return {
            notifications: notificationsList,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit) || 1
            }
        };
    },
    async getById(id, userId) {
        const notification = await notificationsRepo.findById(id, userId);
        if (!notification) {
            throw notFound("Notification not found.");
        }
        return notification;
    },
    async markAsRead(id, userId) {
        const notification = await notificationsRepo.markAsRead(id, userId);
        if (!notification) {
            throw notFound("Notification not found.");
        }
        return notification;
    },
    async markAllAsRead(userId) {
        const marked = await notificationsRepo.markAllAsRead(userId);
        return { marked };
    }
};
