class CheckFavorite {
  constructor(favoriteRepository) {
    this.favoriteRepository = favoriteRepository;
  }

  async execute(userId, layananId, type = 'favorite') {
    try {
      const isFavorite = await this.favoriteRepository.exists(userId, layananId, type);

      return {
        success: true,
        message: `${type === 'bookmark' ? 'Bookmark' : 'Favorite'} status checked successfully`,
        data: { isFavorite }
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to check favorite status',
        data: { isFavorite: false }
      };
    }
  }
}

module.exports = CheckFavorite;
