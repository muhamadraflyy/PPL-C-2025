/**
 * Message Entity
 * Domain model untuk pesan chat
 */

class Message {
  constructor({
    id,
    percakapan_id,
    pengirim_id,
    isi_pesan,
    tipe_pesan,
    attachment_url,
    status,
    is_read,
    dibaca_pada,
    terkirim_pada,
    created_at,
    updated_at,
    // Support database column names (Indonesian)
    pesan,
    tipe,
    lampiran
  }) {
    this.id = id;
    this.percakapan_id = percakapan_id;
    this.pengirim_id = pengirim_id;

    // Support both naming conventions
    this.isi_pesan = isi_pesan || pesan;
    this.tipe_pesan = tipe_pesan || tipe; // 'text', 'image', 'file', 'system'
    this.attachment_url = attachment_url || lampiran;

    this.status = status || 'sent'; // 'sent', 'delivered', 'read'
    this.is_read = is_read;
    this.dibaca_pada = dibaca_pada;
    this.terkirim_pada = terkirim_pada;
    this.created_at = created_at;
    this.updated_at = updated_at;

    // Aliases for compatibility (database column names)
    this.pesan = this.isi_pesan;
    this.tipe = this.tipe_pesan;
    this.lampiran = this.attachment_url;
  }

  // Business logic
  isText() {
    return this.tipe_pesan === 'text';
  }

  hasAttachment() {
    return ['image', 'file'].includes(this.tipe_pesan);
  }

  isSystemMessage() {
    return this.tipe_pesan === 'system';
  }

  markAsRead() {
    this.is_read = true;
    this.status = 'read';
    this.dibaca_pada = new Date();
  }

  markAsDelivered() {
    if (this.status === 'sent') {
      this.status = 'delivered';
      this.terkirim_pada = new Date();
    }
  }

  isSent() {
    return this.status === 'sent';
  }

  isDelivered() {
    return this.status === 'delivered' || this.status === 'read';
  }

  isRead() {
    return this.status === 'read';
  }
}

module.exports = Message;
