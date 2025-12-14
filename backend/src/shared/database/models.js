// Load and associate all Sequelize models here
// Using lazy loading to avoid circular dependency

function getModels() {
  const UserModel = require('../../modules/user/infrastructure/models/UserModel');
  const UserTokenModel = require('../../modules/user/infrastructure/models/UserTokenModel');
  const FreelancerProfileModel = require('../../modules/user/infrastructure/models/FreelancerProfileModel');

  // Chat models
  const ConversationModel = require('../../modules/chat/infrastructure/models/ConversationModel');
  const MessageModel = require('../../modules/chat/infrastructure/models/MessageModel');
  const NotificationModel = require('../../modules/chat/infrastructure/models/NotificationModel');

  return {
    UserModel,
    UserTokenModel,
    FreelancerProfileModel,
    ConversationModel,
    MessageModel,
    NotificationModel
  };
}

function initAssociations() {
  const {
    UserModel,
    UserTokenModel,
    FreelancerProfileModel,
    ConversationModel,
    MessageModel,
    NotificationModel
  } = getModels();

  // users -> profil_freelancer (1:1)
  UserModel.hasOne(FreelancerProfileModel, {
    foreignKey: 'user_id',
    as: 'freelancerProfile',
    onDelete: 'CASCADE'
  });
  FreelancerProfileModel.belongsTo(UserModel, {
    foreignKey: 'user_id',
    as: 'user'
  });

  // users -> user_tokens (1:N)
  UserModel.hasMany(UserTokenModel, {
    foreignKey: 'user_id',
    as: 'tokens',
    onDelete: 'CASCADE'
  });
  UserTokenModel.belongsTo(UserModel, {
    foreignKey: 'user_id',
    as: 'user'
  });

  // Chat associations
  // percakapan -> users (user1)
  ConversationModel.belongsTo(UserModel, {
    foreignKey: 'user1_id',
    as: 'user1'
  });

  // percakapan -> users (user2)
  ConversationModel.belongsTo(UserModel, {
    foreignKey: 'user2_id',
    as: 'user2'
  });

  // pesan -> percakapan
  MessageModel.belongsTo(ConversationModel, {
    foreignKey: 'percakapan_id',
    as: 'conversation'
  });

  // pesan -> users (pengirim)
  MessageModel.belongsTo(UserModel, {
    foreignKey: 'pengirim_id',
    as: 'sender'
  });

  // notifikasi -> users
  NotificationModel.belongsTo(UserModel, {
    foreignKey: 'user_id',
    as: 'user'
  });
}

module.exports = { initAssociations, getModels };


