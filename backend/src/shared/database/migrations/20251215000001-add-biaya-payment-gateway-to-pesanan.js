'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      console.log('🔧 Adding biaya_payment_gateway column to pesanan table...');

      // Add biaya_payment_gateway column after biaya_platform
      await queryInterface.addColumn(
        'pesanan',
        'biaya_payment_gateway',
        {
          type: Sequelize.DECIMAL(10, 2),
          allowNull: false,
          defaultValue: 0.00,
          comment: 'Biaya payment gateway (Midtrans) - 1% dari harga',
          after: 'biaya_platform'
        },
        { transaction }
      );
      console.log('✅ Added biaya_payment_gateway column');

      // Update existing orders to calculate gateway fee (1% of harga)
      // For old orders without payment gateway, set to 0
      await queryInterface.sequelize.query(
        `UPDATE pesanan
         SET biaya_payment_gateway = ROUND(harga * 0.01, 2)
         WHERE biaya_payment_gateway = 0.00`,
        { transaction }
      );
      console.log('✅ Updated existing orders with calculated gateway fee');

      await transaction.commit();
      console.log('✅ Migration completed successfully!');
      console.log('ℹ️  Catatan: Kolom biaya_payment_gateway ditambahkan untuk memisahkan:');
      console.log('   - Biaya Platform (5%) = Biaya operasional SkillConnect');
      console.log('   - Biaya Payment Gateway (1%) = Biaya Midtrans');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Migration failed:', error.message);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      console.log('🔧 Reverting biaya_payment_gateway column...');

      // Remove biaya_payment_gateway column
      await queryInterface.removeColumn('pesanan', 'biaya_payment_gateway', { transaction });
      console.log('✅ Removed biaya_payment_gateway column');

      await transaction.commit();
      console.log('✅ Rollback completed successfully!');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Rollback failed:', error.message);
      throw error;
    }
  }
};
