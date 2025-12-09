/**
 * Entity: HiddenService
 * Represents a service that user has hidden from recommendations
 */
class HiddenService {
    constructor({ id, userId, serviceId, hiddenAt, createdAt, serviceData = null }) {
        this.id = id;
        this.userId = userId;
        this.serviceId = serviceId;
        this.hiddenAt = hiddenAt || createdAt || new Date();
        this.createdAt = createdAt || new Date();
        this.serviceData = serviceData; // Optional: service details
    }

    // Convert to JSON
    toJSON() {
        return {
            id: this.id,
            userId: this.userId,
            serviceId: this.serviceId,
            hiddenAt: this.hiddenAt,
            createdAt: this.createdAt,
            serviceData: this.serviceData
        };
    }

    // Validasi
    static validate(data) {
        if (!data.userId) throw new Error('User ID is required');
        if (!data.serviceId) throw new Error('Service ID is required');
        return true;
    }

    // Factory method
    static create(userId, serviceId) {
        const data = { userId, serviceId };
        this.validate(data);
        return new HiddenService(data);
    }

    // Check if hidden record is recent (within last 30 days)
    isRecent() {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return this.hiddenAt >= thirtyDaysAgo;
    }
}

module.exports = HiddenService;