import { shippingRepo } from "./repo";
import { notFound } from "../../lib/http-errors";
export const shippingService = {
    async listShippingAddresses(userId) {
        const addresses = await shippingRepo.listShippingAddresses(userId);
        return { addresses };
    },
    async getShippingAddress(id, userId) {
        const address = await shippingRepo.findShippingAddressById(id, userId);
        if (!address) {
            throw notFound("Shipping address not found.");
        }
        return address;
    },
    async createShippingAddress(userId, input) {
        const address = await shippingRepo.createShippingAddress(userId, input);
        return {
            id: address.id,
            firstName: address.firstName,
            lastName: address.lastName,
            phoneNumber: address.phoneNumber,
            additionalPhoneNumber: address.additionalPhoneNumber,
            deliveryAddress: address.deliveryAddress,
            additionalInformation: address.additionalInformation,
            region: address.region,
            message: address.message,
            isDefault: address.isDefault,
            createdAt: address.createdAt,
            updatedAt: address.updatedAt
        };
    },
    async updateShippingAddress(id, userId, input) {
        const existing = await shippingRepo.findShippingAddressById(id, userId);
        if (!existing) {
            throw notFound("Shipping address not found.");
        }
        const address = await shippingRepo.updateShippingAddress(id, userId, input);
        return {
            id: address.id,
            firstName: address.firstName,
            lastName: address.lastName,
            phoneNumber: address.phoneNumber,
            additionalPhoneNumber: address.additionalPhoneNumber,
            deliveryAddress: address.deliveryAddress,
            additionalInformation: address.additionalInformation,
            region: address.region,
            message: address.message,
            isDefault: address.isDefault,
            createdAt: address.createdAt,
            updatedAt: address.updatedAt
        };
    },
    async deleteShippingAddress(id, userId) {
        const existing = await shippingRepo.findShippingAddressById(id, userId);
        if (!existing) {
            throw notFound("Shipping address not found.");
        }
        await shippingRepo.deleteShippingAddress(id, userId);
    }
};
