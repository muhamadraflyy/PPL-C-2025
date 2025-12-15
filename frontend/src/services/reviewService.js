import api from '../utils/axiosConfig'

export const reviewService = {
  /**
   * Create a new review for a completed order
   * @param {Object} reviewData - { pesanan_id, rating, judul, komentar, gambar }
   * @returns {Promise<Object>} API response
   */
  async createReview(reviewData) {
    try {
      const response = await api.post('/reviews', reviewData)
      return response.data
    } catch (error) {
      return {
        status: 'error',
        message: error.response?.data?.message || 'Gagal mengirim ulasan',
      }
    }
  },

  /**
   * Get all reviews created by current user
   * @returns {Promise<Object>} API response with reviews
   */
  async getMyReviews() {
    try {
      const response = await api.get('/reviews/my')
      return response.data
    } catch (error) {
      return {
        status: 'error',
        message: error.response?.data?.message || 'Gagal mengambil ulasan',
        data: []
      }
    }
  },

  /**
   * Get reviews for a specific service
   * @param {string} layananId - Service ID
   * @returns {Promise<Object>} API response with reviews
   */
  async getServiceReviews(layananId) {
    try {
      const response = await api.get(`/reviews/service/${layananId}`)
      return response.data
    } catch (error) {
      return {
        status: 'error',
        message: error.response?.data?.message || 'Gagal mengambil ulasan',
        data: { reviews: [] }
      }
    }
  },

  /**
   * Get reviews for a specific freelancer
   * @param {string} freelancerId - Freelancer user ID
   * @returns {Promise<Object>} API response with reviews
   */
  async getFreelancerReviews(freelancerId) {
    try {
      const response = await api.get(`/reviews/freelancer/${freelancerId}`)
      return response.data
    } catch (error) {
      return {
        status: 'error',
        message: error.response?.data?.message || 'Gagal mengambil ulasan',
        data: { reviews: [] }
      }
    }
  },

  /**
   * Update an existing review
   * @param {string} reviewId - Review ID
   * @param {Object} updateData - { rating, judul, komentar, gambar }
   * @returns {Promise<Object>} API response
   */
  async updateReview(reviewId, updateData) {
    try {
      const response = await api.put(`/reviews/${reviewId}`, updateData)
      return response.data
    } catch (error) {
      return {
        status: 'error',
        message: error.response?.data?.message || 'Gagal mengupdate ulasan',
      }
    }
  },

  /**
   * Delete a review
   * @param {string} reviewId - Review ID
   * @returns {Promise<Object>} API response
   */
  async deleteReview(reviewId) {
    try {
      const response = await api.delete(`/reviews/${reviewId}`)
      return response.data
    } catch (error) {
      return {
        status: 'error',
        message: error.response?.data?.message || 'Gagal menghapus ulasan',
      }
    }
  },

  /**
   * Reply to a review (freelancer only)
   * @param {string} reviewId - Review ID
   * @param {string} reply - Reply text
   * @returns {Promise<Object>} API response
   */
  async replyToReview(reviewId, reply) {
    try {
      const response = await api.post(`/reviews/${reviewId}/reply`, { reply })
      return response.data
    } catch (error) {
      return {
        status: 'error',
        message: error.response?.data?.message || 'Gagal membalas ulasan',
      }
    }
  },

  /**
   * Report a review
   * @param {string} reviewId - Review ID
   * @param {string} reason - Report reason
   * @returns {Promise<Object>} API response
   */
  async reportReview(reviewId, reason) {
    try {
      const response = await api.post(`/reviews/${reviewId}/report`, { reason })
      return response.data
    } catch (error) {
      return {
        status: 'error',
        message: error.response?.data?.message || 'Gagal melaporkan ulasan',
      }
    }
  },

  /**
   * Get latest reviews (public)
   * @returns {Promise<Object>} API response with latest reviews
   */
  async getLatestReviews() {
    try {
      const response = await api.get('/reviews/latest')
      return response.data
    } catch (error) {
      return {
        status: 'error',
        message: error.response?.data?.message || 'Gagal mengambil ulasan',
        data: []
      }
    }
  }
}

export default reviewService
