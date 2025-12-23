const { validateFileType, validateFileSize } = require('../../../../shared/utils/fileValidator');

// Maximum allowed length for description fields
const MAX_DESCRIPTION_LENGTH = 1000;

class UpdateFreelancerProfile {
  constructor({ userRepository }) {
    this.userRepository = userRepository;
  }

  /**
   * Validate file size (for base64 or file path strings)
   * @param {string} fileData - Base64 string or file path
   * @param {string} fieldName - Field name for error message
   */
  // Using shared validators from src/shared/utils/fileValidator.js

  async execute(userId, profileData) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    // Check if freelancer profile exists
    const profile = (typeof this.userRepository.findFreelancerProfile === 'function')
      ? await this.userRepository.findFreelancerProfile(userId)
      : null;

    if (!profile) {
      const error = new Error('Freelancer profile not found. Create profile first.');
      error.statusCode = 400;
      throw error;
    }

    // Update user's basic contact/profile fields
    const userUpdates = {};
    if (profileData.nama_lengkap) {
      const parts = profileData.nama_lengkap.trim().split(/\s+/);
      userUpdates.nama_depan = parts.shift() || '';
      userUpdates.nama_belakang = parts.join(' ') || '';
    } else {
      if (profileData.nama_depan) userUpdates.nama_depan = profileData.nama_depan;
      if (profileData.nama_belakang) userUpdates.nama_belakang = profileData.nama_belakang;
    }
    if (profileData.no_telepon) {
      const phone = String(profileData.no_telepon).trim();
      if (/[A-Za-z]/.test(phone)) {
        const error = new Error('Nomor telepon tidak boleh mengandung huruf');
        error.statusCode = 400;
        throw error;
      }
      if (phone.length > 15) {
        const error = new Error('Nomor telepon maksimal 15 karakter');
        error.statusCode = 400;
        throw error;
      }
      userUpdates.no_telepon = phone;
    }
    // Validate bio / deskripsi length when updating user
    if (profileData.bio) {
      if (String(profileData.bio).length > MAX_DESCRIPTION_LENGTH) {
        const error = new Error('Deskripsi maksimal ' + MAX_DESCRIPTION_LENGTH + ' karakter');
        error.statusCode = 400;
        throw error;
      }
      userUpdates.bio = profileData.bio;
    } else if (profileData.deskripsi) {
      if (String(profileData.deskripsi).length > MAX_DESCRIPTION_LENGTH) {
        const error = new Error('Deskripsi maksimal ' + MAX_DESCRIPTION_LENGTH + ' karakter');
        error.statusCode = 400;
        throw error;
      }
      userUpdates.bio = profileData.deskripsi;
    }
    // Map `lokasi` -> kota / provinsi (accept formats like 'Kota, Provinsi' or 'Kota/Provinsi')
    if (profileData.lokasi !== undefined && profileData.lokasi !== null) {
      const loc = String(profileData.lokasi).trim();
      let city = null;
      let province = null;
      if (loc.includes(',')) {
        const parts = loc.split(',').map(s => s.trim()).filter(Boolean);
        city = parts[0] || null;
        province = parts[1] || null;
      } else if (loc.includes('/')) {
        const parts = loc.split('/').map(s => s.trim()).filter(Boolean);
        city = parts[0] || null;
        province = parts[1] || null;
      } else {
        // If only one value provided, put it into kota
        city = loc || null;
      }
      if (city) userUpdates.kota = city;
      if (province) userUpdates.provinsi = province;
    } else {
      // Backwards compatibility: accept kota/provinsi separately
      if (profileData.kota) userUpdates.kota = profileData.kota;
      if (profileData.provinsi) userUpdates.provinsi = profileData.provinsi;
    }
    
    // ✅ Update avatar and foto_latar in users table (shared across roles)
    if (profileData.avatar) userUpdates.avatar = profileData.avatar;
    if (profileData.foto_latar) userUpdates.foto_latar = profileData.foto_latar;

    // Validate file types and sizes for user updates using shared util
    // Skip validation for local file paths (already validated by multer)
    const isLocalPath = (path) => typeof path === 'string' && path.startsWith('/');
    
    if (userUpdates.avatar && !isLocalPath(userUpdates.avatar)) {
      validateFileType(userUpdates.avatar, 'Avatar');
      validateFileSize(userUpdates.avatar, 'Avatar');
    }
    if (userUpdates.foto_latar && !isLocalPath(userUpdates.foto_latar)) {
      validateFileType(userUpdates.foto_latar, 'Cover photo');
      validateFileSize(userUpdates.foto_latar, 'Cover photo');
    }

    // Apply user updates
    if (Object.keys(userUpdates).length > 0) {
      await user.update(userUpdates);
    }

    // Prepare freelancer profile payload
    const profilePayload = {};
    
    // Basic fields
    if (profileData.judul_profesi !== undefined) profilePayload.judul_profesi = profileData.judul_profesi;
    if (profileData.gelar !== undefined) profilePayload.judul_profesi = profileData.gelar; // gelar also maps to judul_profesi if provided
    if (profileData.deskripsi_lengkap !== undefined) {
      if (profileData.deskripsi_lengkap !== null && String(profileData.deskripsi_lengkap).length > MAX_DESCRIPTION_LENGTH) {
        const error = new Error('Deskripsi lengkap maksimal ' + MAX_DESCRIPTION_LENGTH + ' karakter');
        error.statusCode = 400;
        throw error;
      }
      profilePayload.deskripsi_lengkap = profileData.deskripsi_lengkap;
    }
    
    // Handle array/JSON fields
    if (profileData.keahlian !== undefined) {
      profilePayload.keahlian = this._normalizeArray(profileData.keahlian);
    }
    if (profileData.bahasa !== undefined) {
      profilePayload.bahasa = this._normalizeArray(profileData.bahasa);
    }
    if (profileData.edukasi !== undefined) {
      profilePayload.edukasi = this._normalizeArrayOfObjects(profileData.edukasi);
    }
    if (profileData.lisensi !== undefined) {
      profilePayload.lisensi = this._normalizeArrayOfObjects(profileData.lisensi);
    }

    // Portfolio fields
    if (profileData.portfolio_url !== undefined) profilePayload.portfolio_url = profileData.portfolio_url;
    if (profileData.judul_portfolio !== undefined) profilePayload.judul_portfolio = profileData.judul_portfolio;
    if (profileData.deskripsi_portfolio !== undefined) {
      if (profileData.deskripsi_portfolio !== null && String(profileData.deskripsi_portfolio).length > MAX_DESCRIPTION_LENGTH) {
        const error = new Error('Deskripsi portfolio maksimal ' + MAX_DESCRIPTION_LENGTH + ' karakter');
        error.statusCode = 400;
        throw error;
      }
      profilePayload.deskripsi_portfolio = profileData.deskripsi_portfolio;
    }
    if (profileData.file_portfolio !== undefined) profilePayload.file_portfolio = profileData.file_portfolio;
    
    // Photo fields
    if (profileData.avatar !== undefined) profilePayload.avatar = profileData.avatar;
    if (profileData.foto_latar !== undefined) profilePayload.foto_latar = profileData.foto_latar;

    // Validate file types and sizes for profile using shared util
    // Skip validation for local file paths (already validated by multer)
    if (profilePayload.avatar && !isLocalPath(profilePayload.avatar)) {
      validateFileType(profilePayload.avatar, 'Avatar');
      validateFileSize(profilePayload.avatar, 'Avatar');
    }
    if (profilePayload.foto_latar && !isLocalPath(profilePayload.foto_latar)) {
      validateFileType(profilePayload.foto_latar, 'Background photo');
      validateFileSize(profilePayload.foto_latar, 'Background photo');
    }

    // Update profile
    if (Object.keys(profilePayload).length > 0) {
      await this.userRepository.updateFreelancerProfile(userId, profilePayload);
    }

    // Fetch updated profile to return
    const updatedProfile = await this.userRepository.findFreelancerProfile(userId);

    return {
      profile: {
        id: updatedProfile.id,
        user_id: updatedProfile.user_id,
        judul_profesi: updatedProfile.judul_profesi,
        keahlian: updatedProfile.keahlian,
        bahasa: updatedProfile.bahasa,
        edukasi: updatedProfile.edukasi,
        lisensi: updatedProfile.lisensi,
        deskripsi_lengkap: updatedProfile.deskripsi_lengkap,
        portfolio_url: updatedProfile.portfolio_url,
        judul_portfolio: updatedProfile.judul_portfolio,
        deskripsi_portfolio: updatedProfile.deskripsi_portfolio,
        file_portfolio: updatedProfile.file_portfolio,
        avatar: updatedProfile.avatar,
        foto_latar: updatedProfile.foto_latar
      },
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        nama_depan: user.nama_depan,
        nama_belakang: user.nama_belakang,
        no_telepon: user.no_telepon,
        kota: user.kota,
        provinsi: user.provinsi,
        bio: user.bio,
        avatar: user.avatar,
        foto_latar: user.foto_latar
      }
    };
  }

  /**
   * Normalize input to array (accept string/array/JSON)
   */
  _normalizeArray(input) {
    if (Array.isArray(input)) return input;
    if (typeof input === 'string') {
      try {
        const parsed = JSON.parse(input);
        return Array.isArray(parsed) ? parsed : [input];
      } catch (e) {
        // Treat as comma-separated
        return input.split(',').map(s => s.trim()).filter(Boolean);
      }
    }
    return [];
  }

  /**
   * Normalize input to array of objects (for edukasi/lisensi)
   */
  _normalizeArrayOfObjects(input) {
    if (Array.isArray(input)) return input;
    if (typeof input === 'string') {
      try {
        const parsed = JSON.parse(input);
        return Array.isArray(parsed) ? parsed : [{ name: input }];
      } catch (e) {
        return [{ name: input }];
      }
    }
    return [];
  }
}

module.exports = UpdateFreelancerProfile;
