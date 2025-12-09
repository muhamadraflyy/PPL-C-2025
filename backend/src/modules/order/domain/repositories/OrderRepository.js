/**
 * Order Repository Interface
 *
 * Ini contract buat semua operasi database order.
 * Implement ini di SequelizeOrderRepository nanti.
 *
 * Jangan males baca dokumentasi Sequelize, banyak tutorial di YouTube.
 */

class OrderRepository {
  /**
   * Bikin order baru
   * @param {Object} orderData - Data order
   * @returns {Promise<Order>}
   */
  async create(orderData) {
    throw new Error('Method create() must be implemented - Kerjain dong');
  }

  /**
   * Cari order by ID
   * Include relasi: user, penyedia, layanan, payment
   */
  async findById(id) {
    throw new Error('Method findById() must be implemented');
  }

  /**
   * Cari semua order milik user (sebagai buyer)
   * @param {string} userId
   * @param {Object} filters - { status, page, limit }
   */
  async findByUserId(userId, filters = {}) {
    throw new Error('Method findByUserId() must be implemented');
  }

  /**
   * Cari semua order untuk penyedia (sebagai seller)
   * @param {string} penyediaId
   * @param {Object} filters - { status, page, limit }
   */
  async findByPenyediaId(penyediaId, filters = {}) {
    throw new Error('Method findByPenyediaId() must be implemented');
  }

  /**
   * Cari order by service ID
   * Buat validasi ga boleh hapus service yang ada active order
   */
  async findByServiceId(serviceId, filters = {}) {
    throw new Error('Method findByServiceId() must be implemented');
  }

  /**
   * Update status order
   * @param {string} id
   * @param {string} status - pending, accepted, in_progress, completed, cancelled
   */
  async updateStatus(id, status) {
    throw new Error('Method updateStatus() must be implemented');
  }

  /**
   * Cancel order dengan alasan
   */
  async cancel(id, cancelledBy, reason) {
    throw new Error('Method cancel() must be implemented');
  }

  /**
   * Update order (buat edit detail)
   */
  async update(id, orderData) {
    throw new Error('Method update() must be implemented');
  }

  /**
   * Tambah riwayat perubahan status pesanan.
   * @param {Object} historyData
   * @param {string} historyData.pesanan_id
   * @param {string|null} historyData.from_status
   * @param {string} historyData.to_status
   * @param {string|null} historyData.changed_by_user_id
   * @param {string} historyData.changed_by_role - 'client' | 'freelancer' | 'admin' | 'system'
   * @param {string|null} historyData.reason
   * @param {Object|null} historyData.metadata
   */
  async addStatusHistory(historyData) {
    throw new Error('Method addStatusHistory() must be implemented');
  }

  /**
   * Ambil riwayat status untuk satu pesanan.
   * @param {string} orderId
   * @returns {Promise<Array>}
   */
  async getStatusHistory(orderId) {
    throw new Error('Method getStatusHistory() must be implemented');
  }
}

module.exports = OrderRepository;
