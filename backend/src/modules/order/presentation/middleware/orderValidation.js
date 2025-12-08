/**
 * Order Validation Middleware
 * Validasi input untuk order endpoints menggunakan Joi
 */

const Joi = require('joi');

const orderValidation = {
  /**
   * Validasi untuk create order
   */
  createOrder: (req, res, next) => {
    const schema = Joi.object({
      layanan_id: Joi.string().uuid().required().messages({
        'string.empty': 'layanan_id tidak boleh kosong',
        'string.uuid': 'layanan_id harus berformat UUID',
        'any.required': 'layanan_id wajib diisi'
      }),
      paket_id: Joi.string().uuid().allow(null, '').optional().messages({
        'string.uuid': 'paket_id harus berformat UUID'
      }),
      // Wajib diisi minimal beberapa karakter supaya deskripsi order tidak kosong total
      catatan_client: Joi.string().trim().min(10).max(1000).required().messages({
        'string.empty': 'Catatan tidak boleh kosong!',
        'string.min': 'Catatan minimal 10 karakter!',
        'string.max': 'Catatan maksimal 1000 karakter!',
        'any.required': 'Catatan wajib diisi!'
      }),
      // Lampiran client berupa array string (biasanya URL/file path)
      lampiran_client: Joi.array()
        .items(Joi.string().trim().max(500).messages({
          'string.max': 'Setiap lampiran maksimal 500 karakter',
        }))
        .max(10)
        .optional()
        .allow(null)
        .messages({
          'array.max': 'Maksimal 10 lampiran yang boleh dikirim',
        }),
    });

    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path[0],
        message: detail.message
      }));

      // Pakai pesan error pertama sebagai message utama agar FE langsung dapat info yang jelas
      const firstMessage = errors[0]?.message || 'Data pesanan tidak valid';

      return res.status(400).json({
        success: false,
        message: firstMessage,
        errors
      });
    }

    next();
  },

  /**
   * Validasi untuk cancel order
   */
  cancelOrder: (req, res, next) => {
    const schema = Joi.object({
      reason: Joi.string().max(500).allow(null, '').optional().messages({
        'string.max': 'reason maksimal 500 karakter'
      })
    });

    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path[0],
        message: detail.message
      }));

      const firstMessage = errors[0]?.message || 'Data pembatalan pesanan tidak valid';

      return res.status(400).json({
        success: false,
        message: firstMessage,
        errors
      });
    }

    next();
  },

  /**
   * Validasi query params untuk list orders
   */
  listOrders: (req, res, next) => {
    const schema = Joi.object({
      page: Joi.number().integer().min(1).default(1).messages({
        'number.base': 'page harus berupa angka',
        'number.integer': 'page harus berupa integer',
        'number.min': 'page minimal 1'
      }),
      limit: Joi.number().integer().min(1).max(100).default(10).messages({
        'number.base': 'limit harus berupa angka',
        'number.integer': 'limit harus berupa integer',
        'number.min': 'limit minimal 1',
        'number.max': 'limit maksimal 100'
      }),
      status: Joi.string().valid(
        'menunggu_pembayaran',
        'dibayar',
        'dikerjakan',
        'menunggu_review',
        'revisi',
        'selesai',
        'dispute',
        'dibatalkan',
        'refunded'
      ).optional().messages({
        'string.base': 'status harus berupa string',
        'any.only': 'status tidak valid'
      }),
      q: Joi.string().max(100).optional().messages({
        'string.max': 'q maksimal 100 karakter'
      }),
      created_from: Joi.date().iso().optional().messages({
        'date.base': 'created_from harus berupa tanggal',
        'date.format': 'created_from harus berformat ISO 8601'
      }),
      created_to: Joi.date().iso().optional().messages({
        'date.base': 'created_to harus berupa tanggal',
        'date.format': 'created_to harus berformat ISO 8601'
      }),
      sortBy: Joi.string().valid('created_at', 'total_bayar', 'harga', 'status', 'tenggat_waktu').default('created_at').optional(),
      sortOrder: Joi.string().valid('ASC', 'DESC', 'asc', 'desc').default('DESC').optional()
    });

    const { error, value } = schema.validate(req.query, { abortEarly: false });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path[0],
        message: detail.message
      }));

      const firstMessage = errors[0]?.message || 'Parameter pencarian pesanan tidak valid';

      return res.status(400).json({
        success: false,
        message: firstMessage,
        errors
      });
    }

    // Set validated values back to req.query
    req.query = value;
    next();
  },

  /**
   * Validasi UUID parameter
   */
  validateUUID: (req, res, next) => {
    const schema = Joi.object({
      id: Joi.string().uuid().required().messages({
        'string.empty': 'id tidak boleh kosong',
        'string.uuid': 'id harus berformat UUID',
        'any.required': 'id wajib diisi'
      })
    });

    const { error } = schema.validate(req.params, { abortEarly: false });

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'ID tidak valid'
      });
    }

    next();
  }
};

module.exports = orderValidation;
