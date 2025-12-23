const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../../shared/database/connection');

const Favorite = sequelize.define('Favorite', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
        comment: 'Primary key UUID'
    },
    user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'user_id',
        comment: 'Foreign key ke users'
    },
    layanan_id: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'layanan_id',
        comment: 'Foreign key ke layanan'
    },
    type: {
        type: DataTypes.ENUM('favorite', 'bookmark'),
        allowNull: false,
        defaultValue: 'favorite',
        field: 'type',
        comment: 'Type: favorite (public like) or bookmark (private save)'
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'created_at'
    }
}, {
    tableName: 'favorit',
    timestamps: false,
    underscored: true,
    indexes: [
        {
            unique: true,
            fields: ['user_id', 'layanan_id', 'type'],
            name: 'unique_user_layanan_type'
        },
        { fields: ['user_id'] },
        { fields: ['layanan_id'] }
    ]
});

// Optional: asosiasi model (kalau User dan Layanan sudah ada di Sequelize)
Favorite.associate = (models) => {
    Favorite.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
    });

    Favorite.belongsTo(models.Layanan, {
        foreignKey: 'layanan_id',
        as: 'layanan'
    });
};

module.exports = Favorite;
