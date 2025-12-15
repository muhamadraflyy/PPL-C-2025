class RemoveFavorite {
  constructor(favoriteRepository, layananRepository) {
    this.favoriteRepository = favoriteRepository;
    this.layananRepository = layananRepository;
  }

  async execute(userId, layananId, type = 'favorite') {
    try {
      const deleted = await this.favoriteRepository.delete(userId, layananId, type);

      if (!deleted) {
        return {
          success: false,
          message: `${type === 'bookmark' ? 'Bookmark' : 'Favorit'} tidak ditemukan`
        };
      }

      // Decrement favorite count in layanan table (only for favorites, not bookmarks)
      if (type === 'favorite' && this.layananRepository) {
        try {
          await this.layananRepository.decrementFavoriteCount(layananId);
        } catch (error) {
          console.error('Failed to decrement favorite count:', error);
        }
      }

      return {
        success: true,
        message: `Layanan berhasil dihapus dari ${type === 'bookmark' ? 'bookmark' : 'favorit'}`
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to remove favorite'
      };
    }
  }
}

module.exports = RemoveFavorite;
