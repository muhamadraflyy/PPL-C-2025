class AddFavorite {
  constructor(favoriteRepository, layananRepository) {
    this.favoriteRepository = favoriteRepository;
    this.layananRepository = layananRepository;
  }

  async execute(userId, layananId, type = 'favorite') {
    try {
      // Check if already favorited with this type
      const exists = await this.favoriteRepository.exists(userId, layananId, type);

      if (exists) {
        return {
          success: false,
          message: `Layanan sudah ada di ${type === 'bookmark' ? 'bookmark' : 'favorit'}`
        };
      }

      const favorite = await this.favoriteRepository.create(userId, layananId, type);

      // Increment favorite count in layanan table (only for favorites, not bookmarks)
      if (type === 'favorite' && this.layananRepository) {
        try {
          console.log(`[AddFavorite] Incrementing favorite count for layanan: ${layananId}`);
          await this.layananRepository.incrementFavoriteCount(layananId);
          console.log(`[AddFavorite] ✅ Successfully incremented favorite count for layanan: ${layananId}`);
        } catch (error) {
          console.error('[AddFavorite] ❌ Failed to increment favorite count:', error);
        }
      } else {
        if (type === 'favorite') {
          console.error('[AddFavorite] ❌ layananRepository is null/undefined!');
        }
      }

      return {
        success: true,
        message: `Layanan berhasil ditambahkan ke ${type === 'bookmark' ? 'bookmark' : 'favorit'}`,
        data: { favorite }
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to add favorite'
      };
    }
  }
}

module.exports = AddFavorite;
