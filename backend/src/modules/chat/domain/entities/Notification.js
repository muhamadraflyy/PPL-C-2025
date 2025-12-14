/**
 * Notification Domain Entity
 * Represents a notification in the domain layer
 */
class Notification {
  constructor(data) {
    this.id = data.id;
    this.userId = data.user_id || data.userId;
    this.tipe = data.tipe;
    this.judul = data.judul;
    this.pesan = data.pesan;
    this.relatedId = data.related_id || data.relatedId;
    this.relatedType = data.related_type || data.relatedType;
    this.isRead = data.is_read ?? data.isRead ?? false;
    this.dibacaPada = data.dibaca_pada || data.dibacaPada;
    this.dikirimViaEmail = data.dikirim_via_email ?? data.dikirimViaEmail ?? false;
    this.createdAt = data.created_at || data.createdAt;
  }

  /**
   * Mark notification as read
   */
  markAsRead() {
    this.isRead = true;
    this.dibacaPada = new Date();
  }

  /**
   * Check if notification is read
   */
  hasBeenRead() {
    return this.isRead === true;
  }

  /**
   * Check if notification was sent via email
   */
  wasSentViaEmail() {
    return this.dikirimViaEmail === true;
  }

  /**
   * Mark as sent via email
   */
  markAsSentViaEmail() {
    this.dikirimViaEmail = true;
  }

  /**
   * Convert to JSON for API response
   */
  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      tipe: this.tipe,
      judul: this.judul,
      pesan: this.pesan,
      relatedId: this.relatedId,
      relatedType: this.relatedType,
      isRead: this.isRead,
      dibacaPada: this.dibacaPada,
      dikirimViaEmail: this.dikirimViaEmail,
      createdAt: this.createdAt
    };
  }

  /**
   * Validate notification type
   */
  static isValidType(tipe) {
    const validTypes = [
      'pesanan_baru',
      'pesanan_diterima',
      'pesanan_ditolak',
      'pesanan_selesai',
      'pembayaran_berhasil',
      'pesan_baru',
      'ulasan_baru'
    ];
    return validTypes.includes(tipe);
  }
}

module.exports = Notification;
