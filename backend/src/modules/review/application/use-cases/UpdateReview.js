class UpdateReview {
  constructor(reviewRepository, moderationService = null) {
    this.reviewRepository = reviewRepository;
    this.moderationService = moderationService;
  }

  /**
   * Update review milik user
   * @param {string} userId - ID pengguna yang mengupdate
   * @param {string} reviewId - ID review
   * @param {object} updateData - Data ulasan baru
   */
  async execute(userId, reviewId, updateData) {
    const existing = await this.reviewRepository.findById(reviewId);
    if (!existing) throw new Error('Ulasan tidak ditemukan');

    if (existing.pemberi_ulasan_id && existing.pemberi_ulasan_id.toString() !== userId.toString()) {
      throw new Error('Tidak punya izin untuk mengubah ulasan ini');
    }

    const { komentar, rating } = updateData;

    if (rating < 1 || rating > 5) {
      throw new Error('Rating harus antara 1 sampai 5');
    }

    if (!komentar || komentar.trim().length < 5) {
      throw new Error('Komentar ulasan minimal 5 karakter');
    }

    let moderatedKomentar = komentar;
    if (
      komentar &&
      this.moderationService &&
      typeof this.moderationService.moderate === 'function'
    ) {
      moderatedKomentar = await this.moderationService.moderate(komentar);
    }

    const payload = {
      ...updateData,
    };

    if (moderatedKomentar !== undefined) {
      payload.komentar = moderatedKomentar;
    }
    
    const updated = await this.reviewRepository.update(reviewId, payload);

    return {
      success: true,
      message: 'Ulasan berhasil diperbarui',
      data: updated,
    };
  }
}

module.exports = UpdateReview;
