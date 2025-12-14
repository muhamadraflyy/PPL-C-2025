/**
 * UpdateMessageStatus Use Case
 * Handles updating message delivery status (sent -> delivered -> read)
 */

class UpdateMessageStatus {
  constructor(messageRepository) {
    this.messageRepository = messageRepository;
  }

  /**
   * @param {string} messageId - ID of the message
   * @param {string} status - New status ('delivered' or 'read')
   * @returns {Promise<object>}
   */
  async execute(messageId, status) {
    // Validate status
    const validStatuses = ['delivered', 'read'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status: ${status}. Must be 'delivered' or 'read'`);
    }

    // Update message status
    const updated = await this.messageRepository.updateStatus(messageId, status);

    if (!updated) {
      throw new Error('Message not found or status update failed');
    }

    return {
      success: true,
      message: `Message status updated to ${status}`,
      messageId,
      status
    };
  }
}

module.exports = UpdateMessageStatus;
