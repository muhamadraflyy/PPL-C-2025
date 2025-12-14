"use strict";

const { v4: uuidv4 } = require("uuid");

class SequelizeServiceRepository {
  /**
   * @param {import("sequelize").Sequelize} sequelize
   */
  constructor(sequelize) {
    this.sequelize = sequelize;
    this.USER_COL = process.env.SERVICE_USER_COLUMN || "freelancer_id";

    this.columns = [
      "id",
      `${this.USER_COL} AS freelancer_id`,
      "kategori_id",
      "sub_kategori_id",
      "judul",
      "slug",
      "deskripsi",
      "harga",
      "waktu_pengerjaan",
      "batas_revisi",
      "thumbnail",
      "gambar",
      "rating_rata_rata",
      "jumlah_rating",
      "total_pesanan",
      "jumlah_dilihat",
      "jumlah_favorit",
      "status",
      "created_at",
      "updated_at",
    ];

    this.SORTABLE = new Set([
      "created_at",
      "harga",
      "rating_rata_rata",
      "total_pesanan",
      "updated_at",
    ]);
  }

  // =========================================================
  // Utils
  // =========================================================

  _selectColumnsWithJoin() {
    const layananCols = this.columns.map((c) => {
      if (c.includes(" AS ")) {
        const [left, right] = c.split(/\s+AS\s+/i);
        return `l.${left} AS ${right}`;
      }
      return `l.${c}`;
    });

    // expose nama kategori & nama freelancer
    layananCols.push("k.nama AS nama_kategori");
    
    layananCols.push("sk.nama AS nama_sub_kategori");

    layananCols.push(
      "CONCAT(u.nama_depan, ' ', u.nama_belakang) AS freelancer_name"
    );
    return layananCols.join(", ");
  }

  _parseRow(row) {
    if (!row) return null;
    const clone = { ...row };

    // parse kolom gambar (JSON string -> array)
    try {
      if (clone.gambar && typeof clone.gambar === "string") {
        clone.gambar = JSON.parse(clone.gambar);
      }
    } catch {
      // kalau gagal parse, biarin string mentah
    }

    return clone;
  }

  _toSlug(text) {
    return String(text || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80);
  }

  async _generateUniqueSlug(baseTitle) {
    const base = this._toSlug(baseTitle) || "service";
    let slug = base;
    let i = 0;

    /* eslint-disable no-await-in-loop */
    while (true) {
      const [rows] = await this.sequelize.query(
        "SELECT id FROM layanan WHERE slug = ? LIMIT 1",
        { replacements: [slug] }
      );
      if (!rows || rows.length === 0) return slug;

      i += 1;
      slug = `${base}-${i}`;
    }
  }

  _buildWhere(filters = {}) {
    const where = [];
    const params = [];

    if (filters.kategori_id) {
      where.push("l.kategori_id = ?");
      params.push(filters.kategori_id);
    }
    // Filter Sub Kategori
    if (filters.sub_kategori_id) {
      where.push("l.sub_kategori_id = ?");
      params.push(filters.sub_kategori_id);
    }
    if (filters.status) {
      where.push("l.status = ?");
      params.push(filters.status);
    }
    if (filters.freelancer_id) {
      where.push(`l.${this.USER_COL} = ?`);
      params.push(filters.freelancer_id);
    }
    if (filters.user_id) {
      where.push(`l.${this.USER_COL} = ?`);
      params.push(filters.user_id);
    }

    // --- Filter harga (min / max) ---
    if (Number.isFinite(filters.harga_min)) {
      where.push("l.harga >= ?");
      params.push(Number(filters.harga_min));
    }
    if (Number.isFinite(filters.harga_max)) {
      where.push("l.harga <= ?");
      params.push(Number(filters.harga_max));
    }

    // --- Filter rating minimum (dipakai di /api/services & /search) ---
    if (Number.isFinite(filters.rating_min)) {
      where.push("l.rating_rata_rata >= ?");
      params.push(Number(filters.rating_min));
    }

    return {
      clause: where.length ? "WHERE " + where.join(" AND ") : "",
      params,
    };
  }

  _buildOrder(options = {}) {
    const sortBy =
      options.sortBy && this.SORTABLE.has(options.sortBy)
        ? options.sortBy
        : "created_at";

    const sortDir =
      (options.sortDir || options.sortOrder || "desc").toLowerCase() === "asc"
        ? "ASC"
        : "DESC";

    return `ORDER BY l.${sortBy} ${sortDir}`;
  }

  _buildPaging(options = {}) {
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(options.limit) || 10));
    const offset = (page - 1) * limit;

    return {
      page,
      limit,
      offset,
      clause: `LIMIT ${limit} OFFSET ${offset}`,
    };
  }

  async _count(whereClause, params) {
    const [rows] = await this.sequelize.query(
      `SELECT COUNT(*) AS cnt FROM layanan l ${whereClause}`,
      { replacements: params }
    );
    const r = Array.isArray(rows) ? rows[0] : rows;
    return Number(r?.cnt || 0);
  }

  // =========================================================
  // Guards / helpers
  // =========================================================

  async existsFreelancer(userId) {
    if (!userId) return false;
    const [rows] = await this.sequelize.query(
      `SELECT id FROM users WHERE id = ? AND role = 'freelancer' LIMIT 1`,
      { replacements: [userId] }
    );
    const r = Array.isArray(rows) ? rows[0] : rows;
    return Boolean(r?.id);
  }

  async existsKategori(kategoriId) {
    if (!kategoriId) return false;
    const [rows] = await this.sequelize.query(
      `SELECT id FROM kategori WHERE id = ? LIMIT 1`,
      { replacements: [kategoriId] }
    );
    const r = Array.isArray(rows) ? rows[0] : rows;
    return Boolean(r?.id);
  }

  // =========================================================
  // findBySlug: AMAN + sekalian embed data freelancer
  // =========================================================

  async findBySlug(slug) {
    // 1) Ambil data layanan + kategori + sub kategori
    const [rows] = await this.sequelize.query(
      `
      SELECT ${this._selectColumnsWithJoin()}
      FROM layanan l
      LEFT JOIN kategori k ON k.id = l.kategori_id
      LEFT JOIN sub_kategori sk ON sk.id = l.sub_kategori_id 
      LEFT JOIN users u ON u.id = l.freelancer_id
      WHERE l.slug = ?
      LIMIT 1
      `,
      { replacements: [slug] }
    );

    const row = Array.isArray(rows) ? rows[0] : rows;
    const service = this._parseRow(row || null);

    if (!service) return null;

    // 2) Ambil data freelancer dari tabel users + profil_freelancer (portfolio)
    if (service.freelancer_id) {
      const [uRows] = await this.sequelize.query(
        `
        SELECT
          id,
          email,
          role,
          nama_depan,
          nama_belakang,
          no_telepon,
          avatar,
          foto_latar,
          bio,
          kota,
          provinsi,
          is_verified,
          created_at,
          updated_at
        FROM users
        WHERE id = ?
        LIMIT 1
        `,
        { replacements: [service.freelancer_id] }
      );

      const u = Array.isArray(uRows) ? uRows[0] : uRows;
      if (u) {
        // Attach user (sanitize sensitive fields defensively)
        service.freelancer = u;
        if (service.freelancer && typeof service.freelancer === "object") {
          delete service.freelancer.password;
          delete service.freelancer.google_id;
        }

        // Attach profil freelancer (1:1)
        try {
          const [pRows] = await this.sequelize.query(
            `
            SELECT *
            FROM profil_freelancer
            WHERE user_id = ?
            LIMIT 1
            `,
            { replacements: [service.freelancer_id] }
          );

          const p = Array.isArray(pRows) ? pRows[0] : pRows;
          if (p) {
            // Parse file_portfolio if stored as string JSON
            if (p.file_portfolio && typeof p.file_portfolio === "string") {
              try {
                p.file_portfolio = JSON.parse(p.file_portfolio);
              } catch {
                // ignore
              }
            }

            // Konsisten dengan endpoint public user: profil_freelancer
            service.freelancer.profil_freelancer = p;

            // Fallback avatar dari profil kalau avatar user kosong
            if (!service.freelancer.avatar && p.avatar) {
              service.freelancer.avatar = p.avatar;
            }
          }
        } catch (e) {
          console.error(
            "[SequelizeServiceRepository.findBySlug] Failed to load profil_freelancer:",
            e.message
          );
        }
      }
    }

    return service;
  }

  // =========================================================
  // CRUD & Status
  // =========================================================

  async create(arg1, arg2) {
    // Pola (freelancerId, dto)
    if (typeof arg1 === "string" && arg2 && typeof arg2 === "object") {
      const freelancerId = arg1;
      const dto = arg2;
      const id = uuidv4();

      let slug =
        dto.slug && String(dto.slug).trim()
          ? this._toSlug(dto.slug)
          : await this._generateUniqueSlug(dto.judul);

      if (dto.slug && dto.slug !== slug) {
        const [exists] = await this.sequelize.query(
          "SELECT id FROM layanan WHERE slug = ? LIMIT 1",
          { replacements: [slug] }
        );
        if (exists && exists.length) {
          slug = await this._generateUniqueSlug(slug);
        }
      }

      const gambarJson = Array.isArray(dto.gambar)
        ? JSON.stringify(dto.gambar)
        : typeof dto.gambar === "string"
        ? dto.gambar
        : null;

      
      await this.sequelize.query(
        `
          INSERT INTO layanan
            (id, ${this.USER_COL}, kategori_id, sub_kategori_id, judul, slug, deskripsi,
             harga, waktu_pengerjaan, batas_revisi, thumbnail, gambar, status, created_at, updated_at)
          VALUES
            (?,  ?,            ?,               ?,               ?,    ?,    ?, 
             ?,    ?,                 ?,            ?,         ?,      ?,      NOW(), NOW())
        `,
        {
          replacements: [
            id,
            freelancerId,
            dto.kategori_id,
            dto.sub_kategori_id || null,
            dto.judul,
            slug,
            dto.deskripsi,
            dto.harga,
            dto.waktu_pengerjaan,
            dto.batas_revisi ?? 1,
            dto.thumbnail ?? null,
            gambarJson,
            dto.status || "draft",
          ],
        }
      );

      const [rows] = await this.sequelize.query(
        `
        SELECT ${this._selectColumnsWithJoin()}
        FROM layanan l
        LEFT JOIN kategori k ON k.id = l.kategori_id
        LEFT JOIN sub_kategori sk ON sk.id = l.sub_kategori_id
        LEFT JOIN users u ON u.id = l.freelancer_id
        WHERE l.id = ? LIMIT 1
        `,
        { replacements: [id] }
      );
      const row = Array.isArray(rows) ? rows[0] : rows;
      return this._parseRow(row || null);
    }

    // Pola (serviceObject)
    if (arg1 && typeof arg1 === "object" && !arg2) {
      const svc = arg1;
      const freelancerId = svc.freelancerId || svc.freelancer_id;

      const dto = {
        kategori_id: svc.kategoriId || svc.kategori_id,
        sub_kategori_id: svc.subKategoriId || svc.sub_kategori_id || null,
        judul: svc.judul,
        slug: svc.slug,
        deskripsi: svc.deskripsi,
        harga: svc.harga,
        waktu_pengerjaan: svc.waktuPengerjaan || svc.waktu_pengerjaan,
        batas_revisi: svc.batasRevisi || svc.batas_revisi,
        thumbnail: svc.thumbnail || null,
        gambar: Array.isArray(svc.gambar) ? svc.gambar : svc.foto_layanan || [],
        status: svc.status || "draft",
      };

      return this.create(freelancerId, dto);
    }

    throw new Error(
      "Invalid arguments for create(): expected (freelancerId, dto) or (serviceObject)"
    );
  }

  async update(id, patch) {
    if (!patch || Object.keys(patch).length === 0) {
      return this.findById(id);
    }

    // Menambahkan sub_kategori_id ke allowed fields
    const allowed = new Set([
      "kategori_id",
      "sub_kategori_id",
      "judul",
      "slug",
      "deskripsi",
      "harga",
      "waktu_pengerjaan",
      "batas_revisi",
      "thumbnail",
      "gambar",
    ]);

    const sets = [];
    const params = [];

    for (const [k, v] of Object.entries(patch)) {
      if (!allowed.has(k)) continue;

      if (k === "slug") {
        const normalized = this._toSlug(v);
        sets.push(`${k} = ?`);
        params.push(normalized || null);
      } else if (k === "gambar") {
        const gj = Array.isArray(v)
          ? JSON.stringify(v)
          : typeof v === "string"
          ? v
          : null;
        sets.push(`${k} = ?`);
        params.push(gj);
      } else {
        sets.push(`${k} = ?`);
        params.push(v ?? null);
      }
    }

    sets.push("updated_at = ?");
    params.push(new Date());
    params.push(id);

    if (sets.length <= 1) {
      return this.findById(id);
    }

    await this.sequelize.query(
      `UPDATE layanan SET ${sets.join(", ")} WHERE id = ?`,
      { replacements: params }
    );

    return this.findById(id);
  }

  async softDelete(id) {
    await this.sequelize.query(
      `UPDATE layanan SET status = 'nonaktif', updated_at = ? WHERE id = ?`,
      { replacements: [new Date(), id] }
    );
    return { id, deleted: true };
  }

  async approve(id) {
    await this.sequelize.query(
      `UPDATE layanan SET status = 'aktif', updated_at = ? WHERE id = ?`,
      { replacements: [new Date(), id] }
    );
    return this.findById(id);
  }

  // General setter utk menghindari mismatch enum
  async setStatus(id, statusValue) {
    await this.sequelize.query(
      `UPDATE layanan SET status = ?, updated_at = ? WHERE id = ?`,
      { replacements: [statusValue, new Date(), id] }
    );
    return this.findById(id);
  }

  // =========================================================
  // Queries
  // =========================================================

  async findById(id) {
    // Join sub_kategori
    const [rows] = await this.sequelize.query(
      `
      SELECT ${this._selectColumnsWithJoin()}
      FROM layanan l
      LEFT JOIN kategori k ON k.id = l.kategori_id
      LEFT JOIN sub_kategori sk ON sk.id = l.sub_kategori_id
      LEFT JOIN users u ON u.id = l.freelancer_id
      WHERE l.id = ?
      LIMIT 1
      `,
      { replacements: [id] }
    );
    const row = Array.isArray(rows) ? rows[0] : rows;
    return this._parseRow(row || null);
  }

  async findAll(filters = {}, options = {}) {
    const { clause, params } = this._buildWhere(filters);
    const order = this._buildOrder(options);
    const paging = this._buildPaging(options);

    // Join sub_kategori
    const [rows] = await this.sequelize.query(
      `
      SELECT ${this._selectColumnsWithJoin()}
      FROM layanan l
      LEFT JOIN kategori k ON k.id = l.kategori_id
      LEFT JOIN sub_kategori sk ON sk.id = l.sub_kategori_id
      LEFT JOIN users u ON u.id = l.freelancer_id
      ${clause} ${order} ${paging.clause}
      `,
      { replacements: params }
    );

    const items = (rows || []).map((r) => this._parseRow(r));
    const total = await this._count(clause, params);

    return {
      items,
      pagination: {
        page: paging.page,
        limit: paging.limit,
        total,
        totalPages: Math.ceil(total / paging.limit) || 1,
      },
    };
  }

  /**
   * Search services
   * - bisa dipanggil dengan:
   * search("keyword", filters, options)
   * ATAU
   * search({ q, kategori_id, sub_kategori_id, status, harga_min, harga_max, rating_min, page, limit, sortBy, sortOrder })
   */
  async search(arg1 = "", arg2 = {}, arg3 = {}) {
    let q = "";
    let filters = {};
    let options = {};

    if (arg1 && typeof arg1 === "object" && !Array.isArray(arg1)) {
      const payload = arg1;
      q = (payload.q || "").toString();

      filters = {
        kategori_id: payload.kategori_id,
        sub_kategori_id: payload.sub_kategori_id,
        status: payload.status,
        harga_min: payload.harga_min,
        harga_max: payload.harga_max,
        rating_min: payload.rating_min,
        freelancer_id: payload.freelancer_id,
        user_id: payload.user_id,
      };

      options = {
        page: payload.page,
        limit: payload.limit,
        sortBy: payload.sortBy,
        sortDir: payload.sortDir || payload.sortOrder,
        sortOrder: payload.sortOrder,
      };
    } else {
      q = (arg1 || "").toString();
      filters = arg2 || {};
      options = arg3 || {};
    }

    const term = `%${q}%`;
    const base = this._buildWhere(filters);

    const whereClause = base.clause
      ? `${base.clause} AND (l.judul LIKE ? OR l.deskripsi LIKE ?)`
      : `WHERE (l.judul LIKE ? OR l.deskripsi LIKE ?)`;

    const params = [...base.params, term, term];
    const order = this._buildOrder(options);
    const paging = this._buildPaging(options);

    // Join sub_kategori
    const [rows] = await this.sequelize.query(
      `
      SELECT ${this._selectColumnsWithJoin()}
      FROM layanan l
      LEFT JOIN kategori k ON k.id = l.kategori_id
      LEFT JOIN sub_kategori sk ON sk.id = l.sub_kategori_id
      LEFT JOIN users u ON u.id = l.freelancer_id
      ${whereClause} ${order} ${paging.clause}
      `,
      { replacements: params }
    );

    const items = (rows || []).map((r) => this._parseRow(r));
    const total = await this._count(whereClause, params);

    return {
      items,
      pagination: {
        page: paging.page,
        limit: paging.limit,
        total,
        totalPages: Math.ceil(total / paging.limit) || 1,
      },
    };
  }

  async findByUserId(userId, filters = {}, options = {}) {
    const merged = { ...filters, freelancer_id: userId };
    return this.findAll(merged, options);
  }

  // =========================================================
  // Favorite Count Management
  // =========================================================

  async incrementFavoriteCount(layananId) {
    console.log(
      `[SequelizeServiceRepository] Incrementing favorite count for layanan: ${layananId}`
    );

    // Get current count
    const [before] = await this.sequelize.query(
      `SELECT jumlah_favorit FROM layanan WHERE id = ?`,
      { replacements: [layananId] }
    );
    const beforeCount = before && before[0] ? before[0].jumlah_favorit : 0;
    console.log(`[SequelizeServiceRepository] Current count: ${beforeCount}`);

    // Increment
    await this.sequelize.query(
      `UPDATE layanan SET jumlah_favorit = COALESCE(jumlah_favorit, 0) + 1, updated_at = NOW() WHERE id = ?`,
      { replacements: [layananId] }
    );

    // Get new count
    const [after] = await this.sequelize.query(
      `SELECT jumlah_favorit FROM layanan WHERE id = ?`,
      { replacements: [layananId] }
    );
    const afterCount = after && after[0] ? after[0].jumlah_favorit : 0;
    console.log(
      `[SequelizeServiceRepository] ✅ New count: ${afterCount} (was ${beforeCount})`
    );
  }

  async decrementFavoriteCount(layananId) {
    console.log(
      `[SequelizeServiceRepository] Decrementing favorite count for layanan: ${layananId}`
    );

    // Get current count
    const [before] = await this.sequelize.query(
      `SELECT jumlah_favorit FROM layanan WHERE id = ?`,
      { replacements: [layananId] }
    );
    const beforeCount = before && before[0] ? before[0].jumlah_favorit : 0;
    console.log(`[SequelizeServiceRepository] Current count: ${beforeCount}`);

    // Decrement
    await this.sequelize.query(
      `UPDATE layanan SET jumlah_favorit = GREATEST(COALESCE(jumlah_favorit, 0) - 1, 0), updated_at = NOW() WHERE id = ?`,
      { replacements: [layananId] }
    );

    // Get new count
    const [after] = await this.sequelize.query(
      `SELECT jumlah_favorit FROM layanan WHERE id = ?`,
      { replacements: [layananId] }
    );
    const afterCount = after && after[0] ? after[0].jumlah_favorit : 0;
    console.log(
      `[SequelizeServiceRepository] ✅ New count: ${afterCount} (was ${beforeCount})`
    );
  }
}

module.exports = SequelizeServiceRepository;