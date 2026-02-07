import { eq, desc } from "drizzle-orm";
import { db } from "../../db";
import { shippingAddresses } from "../../db/schema";
export const shippingRepo = {
    async findShippingAddressById(id, userId) {
        const [address] = await db
            .select()
            .from(shippingAddresses)
            .where(eq(shippingAddresses.id, id))
            .limit(1);
        // Ensure the address belongs to the user
        if (address && address.userId !== userId) {
            return null;
        }
        return address || null;
    },
    async listShippingAddresses(userId) {
        const addresses = await db
            .select()
            .from(shippingAddresses)
            .where(eq(shippingAddresses.userId, userId))
            .orderBy(desc(shippingAddresses.isDefault), desc(shippingAddresses.createdAt));
        // Sort: default first, then by creation date
        return addresses.sort((a, b) => {
            if (a.isDefault && !b.isDefault)
                return -1;
            if (!a.isDefault && b.isDefault)
                return 1;
            return b.createdAt.getTime() - a.createdAt.getTime();
        });
    },
    async findDefaultAddress(userId) {
        const [address] = await db
            .select()
            .from(shippingAddresses)
            .where(eq(shippingAddresses.userId, userId))
            .limit(1);
        if (!address) {
            return null;
        }
        // Find the default address
        const addresses = await db
            .select()
            .from(shippingAddresses)
            .where(eq(shippingAddresses.userId, userId));
        const defaultAddr = addresses.find((a) => a.isDefault === true);
        return defaultAddr || null;
    },
    async createShippingAddress(userId, data) {
        // If this is set as default, unset all other defaults for this user
        if (data.isDefault) {
            await db
                .update(shippingAddresses)
                .set({ isDefault: false, updatedAt: new Date() })
                .where(eq(shippingAddresses.userId, userId));
        }
        const [address] = await db
            .insert(shippingAddresses)
            .values({
            userId,
            firstName: data.firstName,
            lastName: data.lastName,
            phoneNumber: data.phoneNumber,
            additionalPhoneNumber: data.additionalPhoneNumber,
            deliveryAddress: data.deliveryAddress,
            additionalInformation: data.additionalInformation,
            region: data.region,
            message: data.message,
            isDefault: data.isDefault ?? false
        })
            .returning();
        return address;
    },
    async updateShippingAddress(id, userId, data) {
        // If this is set as default, unset all other defaults for this user
        if (data.isDefault) {
            await db
                .update(shippingAddresses)
                .set({ isDefault: false, updatedAt: new Date() })
                .where(eq(shippingAddresses.userId, userId));
        }
        const [address] = await db
            .update(shippingAddresses)
            .set({
            ...data,
            updatedAt: new Date()
        })
            .where(eq(shippingAddresses.id, id))
            .returning();
        // Verify ownership
        if (address && address.userId !== userId) {
            throw new Error("Unauthorized");
        }
        return address;
    },
    async deleteShippingAddress(id, userId) {
        const address = await this.findShippingAddressById(id, userId);
        if (!address) {
            throw new Error("Not found");
        }
        await db.delete(shippingAddresses).where(eq(shippingAddresses.id, id));
    }
};
