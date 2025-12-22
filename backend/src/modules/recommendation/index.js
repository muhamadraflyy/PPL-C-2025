const initializeRoutes = require('./presentation/routes/recommendationRoutes');

/**
 * Initialize Recommendation Module
 * CLEANED VERSION - Removed unused cron jobs
 * 
 * @param {Object} sequelize - Sequelize instance
 * @returns {Object} Router dan controllers untuk digunakan oleh aplikasi utama
 */
const initializeRecommendationModule = (sequelize) => {
    console.log('Initializing Recommendation Module...');

    // Import controllers
    const RecommendationController = require('./presentation/controllers/RecommendationController');
    const FavoriteController = require('./presentation/controllers/FavoriteController');

    // Initialize controllers dengan sequelize
    const recommendationController = new RecommendationController(sequelize);
    const favoriteController = new FavoriteController(sequelize);

    console.log('Controllers initialized');

    // Initialize routes
    const router = initializeRoutes(recommendationController, favoriteController);

    console.log('Routes initialized');
    console.log('Recommendation Module ready');

    return {
        router,
        recommendationController,
        favoriteController
    };
};

module.exports = initializeRecommendationModule;