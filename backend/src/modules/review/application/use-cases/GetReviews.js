class GetReviews {
  constructor(reviewRepository) {
    this.reviewRepository = reviewRepository;
  }

  async byService(serviceId, filters = {}) {
    const items = await this.reviewRepository.findByServiceId(serviceId, filters);
    const total = await this.reviewRepository.countByServiceId(serviceId, filters);
    return { items, total };
  }

  async byFreelancer(freelancerId, filters = {}) {
    const items = await this.reviewRepository.findByFreelancerId(freelancerId, filters);
    const total = await this.reviewRepository.countByFreelancerId(freelancerId, filters);
    return { items, total };
  }

  async byUser(userId, filters = {}) {
    const items = await this.reviewRepository.findByUserId(userId, filters);
    const total = await this.reviewRepository.countByUserId(userId, filters);
    return { items, total };
  }

  async latest(limit = 5) {
    return this.reviewRepository.findLatest(limit);
  }

  async byId(id) {
    return await this.reviewRepository.findById(id);
  }
}

module.exports = GetReviews;
