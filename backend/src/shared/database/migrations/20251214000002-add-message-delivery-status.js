'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      console.log('🔧 Adding delivery status tracking to pesan table...');

      // Add status column (sent, delivered, read)
      await queryInterface.addColumn(
        'pesan',
        'status',
        {
          type: Sequelize.ENUM('sent', 'delivered', 'read'),
          allowNull: false,
          defaultValue: 'sent',
          comment: 'Message delivery status'
        },
        { transaction }
      );
      console.log('✅ Added status column');

      // Add terkirim_pada (delivered_at timestamp)
      await queryInterface.addColumn(
        'pesan',
        'terkirim_pada',
        {
          type: Sequelize.DATE,
          allowNull: true,
          comment: 'Timestamp when message was delivered'
        },
        { transaction }
      );
      console.log('✅ Added terkirim_pada column');

      // Update existing messages to have appropriate status
      await queryInterface.sequelize.query(
        `UPDATE pesan
         SET status = CASE
           WHEN is_read = 1 THEN 'read'
           ELSE 'delivered'
         END
         WHERE status = 'sent'`,
        { transaction }
      );
      console.log('✅ Updated existing messages with appropriate status');

      await transaction.commit();
      console.log('✅ Migration completed successfully!');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Migration failed:', error.message);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      console.log('🔧 Reverting message delivery status tracking...');

      // Remove terkirim_pada column
      await queryInterface.removeColumn('pesan', 'terkirim_pada', { transaction });
      console.log('✅ Removed terkirim_pada column');

      // Remove status column
      await queryInterface.removeColumn('pesan', 'status', { transaction });
      console.log('✅ Removed status column');

      await transaction.commit();
      console.log('✅ Rollback completed successfully!');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Rollback failed:', error.message);
      throw error;
    }
  }
};
