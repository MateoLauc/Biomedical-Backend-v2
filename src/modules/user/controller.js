import { userService } from "./service";
export const userController = {
    async getMe(req, res) {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: "Please sign in to view your profile." });
        }
        const user = await userService.getMe(userId);
        res.json({ user });
    },
    async updateProfile(req, res) {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: "Please sign in to update your profile." });
        }
        const user = await userService.updateProfile(userId, req.body);
        res.json({ message: "Your profile has been updated successfully.", user });
    }
};
