const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class ReportGenerator {
  constructor(sequelize, adminLogService) {
    if (!sequelize) {
      throw new Error('sequelize is required in ReportGenerator');
    }
    this.sequelize = sequelize;
    this.adminLogService = adminLogService;
    
    // Setup reports directory
    this.reportsDir = path.join(__dirname, '../../../exports/reports');
    if (!fs.existsSync(this.reportsDir)) {
      fs.mkdirSync(this.reportsDir, { recursive: true });
    }
  }

  async generate(reportType, format, filters) {
    try {
      let data;

      if (reportType === 'users') {
        data = await this.getUserReport(filters);
      } else if (reportType === 'services') {
        data = await this.getServiceReport(filters);
      } else if (reportType === 'revenue') {
        data = await this.getRevenueReport(filters);
      } else if (reportType === 'orders') {
        data = await this.getOrderReport(filters);
      } else {
        throw new Error(`Unknown report type: ${reportType}`);
      }

      if (!data || data.length === 0) {
        throw new Error('No data available for report');
      }

      if (format === 'csv') {
        return await this.generateCSV(data, reportType);
      } else if (format === 'pdf') {
        return await this.generatePDF(data, reportType, filters);
      } else if (format === 'excel') {
        return await this.generateExcel(data, reportType);
      } else {
        throw new Error(`Unknown format: ${format}`);
      }
    } catch (error) {
      console.error('Error in ReportGenerator.generate:', error);
      throw error;
    }
  }

  async getUserReport(filters) {
    try {
      // Use adminLogService.getUserList() to get all users (same as API)
      // Fetch all pages to get complete data
      const allUsers = [];
      let page = 1;
      const limit = 100; // Fetch 100 per page
      let hasMore = true;

      while (hasMore) {
        const apiFilters = {
          role: filters?.role || null,
          status: filters?.status || 'all',
          page: page,
          limit: limit
        };

        const result = await this.adminLogService.getUserList(apiFilters);
        
        if (result.data && result.data.length > 0) {
          allUsers.push(...result.data);
          
          // Check if there are more pages
          const totalPages = Math.ceil(result.total / limit);
          hasMore = page < totalPages;
          page++;
        } else {
          hasMore = false;
        }
      }

      // Get block reasons for blocked users
      const userIds = allUsers.map(u => u.id);
      let blockReasons = {};
      
      if (userIds.length > 0) {
        const blockQuery = `
          SELECT 
            l.target_id,
            l.detail,
            l.created_at as blocked_at
          FROM log_aktivitas_admin l
          WHERE l.target_type = 'user' 
            AND l.aksi = 'block_user'
            AND l.target_id IN (${userIds.map(() => '?').join(',')})
        `;
        
        const blockLogs = await this.sequelize.query(blockQuery, {
          replacements: userIds,
          raw: true,
          type: this.sequelize.QueryTypes.SELECT
        });

        blockLogs.forEach(log => {
          const detail = typeof log.detail === 'string' ? JSON.parse(log.detail) : log.detail;
          blockReasons[log.target_id] = detail?.reason || 'Tidak ada alasan tersedia';
        });
      }

      // Format data for report
      return allUsers.map(user => {
        const namaPengguna = (user.nama_depan && user.nama_belakang)
          ? `${user.nama_depan} ${user.nama_belakang}`.trim()
          : user.nama_depan || user.nama_belakang || user.email || 'N/A';
        const status = user.is_active === 1 || user.is_active === true ? 'Aktif' : 'Diblokir';
        const keterangan = blockReasons[user.id] || (status === 'Aktif' ? '' : 'Tidak ada alasan tersedia');

        return {
          'Nama Pengguna': namaPengguna,
          'Email': user.email || '-',
          'Role': user.role || '-',
          'Status': status,
          'Keterangan': keterangan
        };
      });
    } catch (error) {
      console.error('Error in getUserReport:', error);
      throw error;
    }
  }

  async getServiceReport(filters) {
    try {
      // Use same query as getServices in AdminController
      // Fetch all pages to get complete data
      const allServices = [];
      let page = 1;
      const limit = 100; // Fetch 100 per page
      let hasMore = true;

      while (hasMore) {
        const offset = (page - 1) * limit;
        
        let query = `
          SELECT 
            l.id,
            l.judul,
            l.status,
            l.created_at,
            u.id as freelancer_user_id,
            u.email as freelancer_email,
            u.nama_depan as freelancer_nama_depan,
            u.nama_belakang as freelancer_nama_belakang,
            k.nama as kategori_nama
          FROM layanan l
          LEFT JOIN users u ON l.freelancer_id = u.id
          LEFT JOIN kategori k ON l.kategori_id = k.id
          WHERE 1=1
        `;
        
        const replacements = [];
        
        if (filters?.status && filters.status !== 'all') {
          query += ' AND l.status = ?';
          replacements.push(filters.status);
        }
        
        if (filters?.kategori && filters.kategori !== 'all') {
          query += ' AND l.kategori_id = ?';
          replacements.push(filters.kategori);
        }
        
        if (filters?.search) {
          query += ' AND l.judul LIKE ?';
          replacements.push(`%${filters.search}%`);
        }
        
        // Get total count
        const countQuery = query.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM');
        const [countResult] = await this.sequelize.query(countQuery, {
          replacements,
          raw: true,
          type: this.sequelize.QueryTypes.SELECT
        });
        
        // Add pagination
        query += ' ORDER BY l.created_at DESC LIMIT ? OFFSET ?';
        replacements.push(limit, offset);
        
        const services = await this.sequelize.query(query, {
          replacements,
          raw: true,
          type: this.sequelize.QueryTypes.SELECT
        });
        
        if (services && services.length > 0) {
          allServices.push(...services);
          
          // Check if there are more pages
          const totalPages = Math.ceil(countResult.total / limit);
          hasMore = page < totalPages;
          page++;
        } else {
          hasMore = false;
        }
      }

      // Get block reasons for blocked services
      const serviceIds = allServices.map(s => s.id);
      let blockReasons = {};
      
      if (serviceIds.length > 0) {
        const blockQuery = `
          SELECT 
            l.target_id,
            l.detail,
            l.created_at as blocked_at
          FROM log_aktivitas_admin l
          WHERE l.target_type = 'layanan' 
            AND l.aksi = 'block_service'
            AND l.target_id IN (${serviceIds.map(() => '?').join(',')})
        `;
        
        const blockLogs = await this.sequelize.query(blockQuery, {
          replacements: serviceIds,
          raw: true,
          type: this.sequelize.QueryTypes.SELECT
        });

        blockLogs.forEach(log => {
          const detail = typeof log.detail === 'string' ? JSON.parse(log.detail) : log.detail;
          blockReasons[log.target_id] = detail?.reason || 'Tidak ada alasan tersedia';
        });
      }

      // Format data for report
      return allServices.map(service => {
        const namaFreelancer = service.freelancer_nama_depan && service.freelancer_nama_belakang
          ? `${service.freelancer_nama_depan} ${service.freelancer_nama_belakang}`.trim()
          : service.freelancer_email || 'N/A';
        const status = service.status === 'aktif' ? 'Aktif' : service.status === 'nonaktif' ? 'Diblokir' : service.status || 'N/A';
        const keterangan = blockReasons[service.id] || (status === 'Aktif' ? '' : 'Tidak ada alasan tersedia');

        return {
          'Judul': service.judul || '-',
          'Nama Freelancer': namaFreelancer,
          'Kategori': service.kategori_nama || '-',
          'Status': status,
          'Keterangan': keterangan
        };
      });
    } catch (error) {
      console.error('Error in getServiceReport:', error);
      throw error;
    }
  }

  async getRevenueReport(filters) {
    try {
      let query = 'SELECT id, transaction_id, jumlah, biaya_platform, total_bayar, created_at FROM pembayaran WHERE status = ?';
      const replacements = ['berhasil'];

      if (filters?.startDate && filters?.endDate) {
        query += ' AND created_at >= ? AND created_at <= ?';
        replacements.push(filters.startDate, filters.endDate);
      }

      query += ' ORDER BY created_at DESC LIMIT 1000';

      const data = await this.sequelize.query(query, {
        replacements,
        raw: true,
        type: this.sequelize.QueryTypes.SELECT
      });

      return data || [];
    } catch (error) {
      console.error('Error in getRevenueReport:', error);
      throw error;
    }
  }

  async getOrderReport(filters) {
    try {
      // Query lengkap dengan payment data + fees
      let query = `
        SELECT
          pes.nomor_pesanan as 'No. Order',
          pes.judul as 'Judul',
          CONCAT(COALESCE(client.nama_depan, ''), ' ', COALESCE(client.nama_belakang, '')) as 'Klien',
          CONCAT(COALESCE(freelancer.nama_depan, ''), ' ', COALESCE(freelancer.nama_belakang, '')) as 'Freelancer',
          COALESCE(p.jumlah, pes.harga, 0) as 'Harga Order',
          COALESCE(p.biaya_platform, pes.harga * 0.05, 0) as 'Biaya Platform (5%)',
          COALESCE(p.biaya_payment_gateway, pes.harga * 0.01, 0) as 'Biaya Gateway (1%)',
          COALESCE(p.total_bayar, pes.harga, 0) as 'Total Bayar',
          CASE
            WHEN pes.status = 'menunggu_pembayaran' THEN 'Menunggu Pembayaran'
            WHEN pes.status = 'dibayar' THEN 'Dibayar'
            WHEN pes.status = 'dikerjakan' THEN 'Dikerjakan'
            WHEN pes.status = 'selesai' THEN 'Selesai'
            WHEN pes.status = 'dibatalkan' THEN 'Dibatalkan'
            ELSE pes.status
          END as 'Status',
          p.transaction_id as 'Transaction ID',
          CASE
            WHEN p.metode_pembayaran = 'qris' THEN 'QRIS'
            WHEN p.metode_pembayaran = 'virtual_account' THEN 'Virtual Account'
            WHEN p.metode_pembayaran = 'e_wallet' THEN 'E-Wallet'
            WHEN p.metode_pembayaran = 'transfer_bank' THEN 'Transfer Bank'
            WHEN p.metode_pembayaran = 'kartu_kredit' THEN 'Kartu Kredit'
            ELSE p.metode_pembayaran
          END as 'Metode Pembayaran',
          CASE
            WHEN p.status = 'berhasil' THEN 'Berhasil'
            WHEN p.status = 'menunggu' THEN 'Menunggu'
            WHEN p.status = 'gagal' THEN 'Gagal'
            WHEN p.status = 'kadaluarsa' THEN 'Kadaluarsa'
            ELSE p.status
          END as 'Status Pembayaran',
          DATE_FORMAT(pes.created_at, '%d/%m/%Y %H:%i') as 'Tanggal Dibuat',
          DATE_FORMAT(p.created_at, '%d/%m/%Y %H:%i') as 'Tanggal Pembayaran'
        FROM pesanan pes
        LEFT JOIN pembayaran p ON pes.id = p.pesanan_id
        LEFT JOIN users client ON pes.client_id = client.id
        LEFT JOIN layanan l ON pes.layanan_id = l.id
        LEFT JOIN users freelancer ON l.freelancer_id = freelancer.id
        WHERE 1=1
      `;

      const replacements = [];

      // Filter by order status
      if (filters?.status && filters.status !== 'all') {
        query += ' AND pes.status = ?';
        replacements.push(filters.status);
      }

      // Filter by payment status
      if (filters?.paymentStatus && filters.paymentStatus !== 'all') {
        query += ' AND p.status = ?';
        replacements.push(filters.paymentStatus);
      }

      // Filter by date range
      if (filters?.startDate && filters?.endDate) {
        query += ' AND pes.created_at BETWEEN ? AND ?';
        replacements.push(filters.startDate, filters.endDate);
      }

      // Filter by search (order number or title)
      if (filters?.search) {
        query += ' AND (pes.nomor_pesanan LIKE ? OR pes.judul LIKE ?)';
        replacements.push(`%${filters.search}%`, `%${filters.search}%`);
      }

      // Order by latest first, NO LIMIT - export ALL data
      query += ' ORDER BY pes.created_at DESC';

      const data = await this.sequelize.query(query, {
        replacements,
        raw: true,
        type: this.sequelize.QueryTypes.SELECT
      });

      return data || [];
    } catch (error) {
      console.error('Error in getOrderReport:', error);
      throw error;
    }
  }

  async generateCSV(data, reportType) {
    try {
      if (!data || data.length === 0) {
        throw new Error('No data to generate CSV');
      }

      const columns = Object.keys(data[0]);
      
      // Use BOM for UTF-8 to support Indonesian characters in Excel
      let csv = '\ufeff';
      csv += columns.join(',') + '\n';

      data.forEach(row => {
        const values = columns.map(col => {
          const val = row[col];
          if (val === null || val === undefined) return '';
          const strVal = String(val);
          // Escape quotes and wrap in quotes if contains comma, newline, or quote
          if (strVal.includes(',') || strVal.includes('\n') || strVal.includes('"')) {
            return `"${strVal.replace(/"/g, '""')}"`;
          }
          return strVal;
        });
        csv += values.join(',') + '\n';
      });

      const filename = `report_${reportType}_${Date.now()}.csv`;
      const filepath = path.join(this.reportsDir, filename);
      
      fs.writeFileSync(filepath, csv, 'utf8');

      return { 
        filename, 
        filepath,
        success: true, 
        rowCount: data.length 
      };
    } catch (error) {
      console.error('Error in generateCSV:', error);
      throw error;
    }
  }

  async generateExcel(data, reportType) {
    try {
      if (!data || data.length === 0) {
        throw new Error('No data to generate Excel');
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Report');

      const columns = Object.keys(data[0]);
      
      // Set column headers with styling
      worksheet.columns = columns.map(key => ({
        header: key,
        key: key,
        width: 20
      }));

      // Style header row
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
      worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

      // Add data rows
      data.forEach(row => {
        const excelRow = worksheet.addRow(row);
        excelRow.alignment = { vertical: 'middle', horizontal: 'left' };
      });

      // Auto-fit columns
      worksheet.columns.forEach(column => {
        let maxLength = 0;
        column.eachCell({ includeEmpty: false }, (cell) => {
          const columnLength = cell.value ? cell.value.toString().length : 10;
          if (columnLength > maxLength) {
            maxLength = columnLength;
          }
        });
        column.width = Math.min(Math.max(maxLength + 2, 15), 50);
      });

      const filename = `report_${reportType}_${Date.now()}.xlsx`;
      const filepath = path.join(this.reportsDir, filename);
      
      await workbook.xlsx.writeFile(filepath);

      return { 
        filename, 
        filepath,
        success: true, 
        rowCount: data.length 
      };
    } catch (error) {
      console.error('Error in generateExcel:', error);
      throw error;
    }
  }

  async generatePDF(data, reportType, filters = {}) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          margin: 40,
          size: 'A4',
          layout: 'landscape' // Landscape untuk lebih banyak kolom
        });
        const filename = `transaksi_${new Date().toISOString().split('T')[0]}.pdf`;
        const filepath = path.join(this.reportsDir, filename);
        const stream = fs.createWriteStream(filepath);

        doc.on('error', reject);
        stream.on('error', reject);

        doc.pipe(stream);

        // ===== HEADER SECTION =====
        // Logo/Brand (opsional - bisa ditambahin logo)
        doc.fontSize(24).font('Helvetica-Bold').text('SkillConnect', 40, 30);
        doc.fontSize(10).font('Helvetica').text('Platform Freelance Terpercaya', 40, 58);

        // Report Title
        const reportTitle = reportType === 'users' ? 'Daftar Pengguna'
          : reportType === 'services' ? 'Daftar Layanan'
          : reportType === 'orders' ? 'Daftar Transaksi'
          : reportType === 'revenue' ? 'Laporan Revenue'
          : reportType;

        doc.fontSize(18).font('Helvetica-Bold').text(
          `Laporan ${reportTitle}`,
          40,
          90
        );

        // Date & Summary Info
        const today = new Date().toLocaleDateString('id-ID', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        doc.fontSize(9).font('Helvetica').text(`Tanggal: ${today}`, 40, 115);
        doc.fontSize(9).font('Helvetica-Bold').text(`Total Data: ${data.length} transaksi`, 40, 128);

        // ===== FILTER INFO SECTION =====
        let filterY = 141;
        if (filters && Object.keys(filters).length > 0) {
          const filterTexts = [];

          if (filters.status && filters.status !== 'all') {
            const statusLabel = filters.status === 'menunggu_pembayaran' ? 'Menunggu Pembayaran'
              : filters.status === 'dibayar' ? 'Dibayar'
              : filters.status === 'dikerjakan' ? 'Dikerjakan'
              : filters.status === 'selesai' ? 'Selesai'
              : filters.status === 'dibatalkan' ? 'Dibatalkan'
              : filters.status;
            filterTexts.push(`Status: ${statusLabel}`);
          }

          if (filters.paymentStatus && filters.paymentStatus !== 'all') {
            const paymentLabel = filters.paymentStatus === 'berhasil' ? 'Berhasil'
              : filters.paymentStatus === 'menunggu' ? 'Menunggu'
              : filters.paymentStatus === 'gagal' ? 'Gagal'
              : filters.paymentStatus === 'kadaluarsa' ? 'Kadaluarsa'
              : filters.paymentStatus;
            filterTexts.push(`Pembayaran: ${paymentLabel}`);
          }

          if (filters.startDate && filters.endDate) {
            const startDate = new Date(filters.startDate).toLocaleDateString('id-ID');
            const endDate = new Date(filters.endDate).toLocaleDateString('id-ID');
            filterTexts.push(`Periode: ${startDate} - ${endDate}`);
          }

          if (filters.search) {
            filterTexts.push(`Pencarian: "${filters.search}"`);
          }

          if (filterTexts.length > 0) {
            doc.fontSize(8).font('Helvetica').fillColor('#666666').text(
              `Filter: ${filterTexts.join(' | ')}`,
              40,
              filterY
            );
            filterY += 13;
            doc.fillColor('#000000'); // Reset color
          }
        }

        // Draw separator line
        doc.moveTo(40, filterY).lineTo(800, filterY).stroke();

        if (data && data.length > 0) {
          const columns = Object.keys(data[0]);
          const columnWidths = this.calculateColumnWidths(columns, data, doc);
          let startY = 160; // More space after header
          const rowHeight = 20;
          const pageHeight = 550; // Landscape height
          let currentY = startY;
          const tableStartX = 40;
          const tableEndX = 802; // Landscape width - margin

          // Draw table with borders for each cell
          const drawTableWithBorders = (startYPos, isHeader = false, rowData = null) => {
            const cellPadding = 5;
            let xPos = tableStartX;
            
            // Draw header row with borders
            if (isHeader) {
              doc.fontSize(9).font('Helvetica-Bold');
              
              // Draw top border of header
              doc.moveTo(xPos, startYPos).lineTo(tableEndX, startYPos).stroke();
              
              columns.forEach((col, idx) => {
                const cellWidth = columnWidths[idx];
                const cellRight = xPos + cellWidth;
                
                // Draw vertical borders
                doc.moveTo(xPos, startYPos).lineTo(xPos, startYPos + rowHeight).stroke();
                if (idx === columns.length - 1) {
                  doc.moveTo(cellRight, startYPos).lineTo(cellRight, startYPos + rowHeight).stroke();
                }
                
                // Draw text in cell
                doc.text(col, xPos + cellPadding, startYPos + 5, { 
                  width: cellWidth - (cellPadding * 2), 
                  align: 'left' 
                });
                
                xPos = cellRight;
              });
              
              // Draw bottom border of header
              doc.moveTo(tableStartX, startYPos + rowHeight).lineTo(tableEndX, startYPos + rowHeight).stroke();
            } else {
              // Draw data rows with borders
              doc.fontSize(8).font('Helvetica');
              
              columns.forEach((col, idx) => {
                const cellWidth = columnWidths[idx];
                const cellRight = xPos + cellWidth;
                
                // Draw vertical borders
                doc.moveTo(xPos, startYPos).lineTo(xPos, startYPos + rowHeight).stroke();
                if (idx === columns.length - 1) {
                  doc.moveTo(cellRight, startYPos).lineTo(cellRight, startYPos + rowHeight).stroke();
                }
                
                // Draw text in cell
                const cellValue = String(rowData[col] || '-');
                const displayValue = cellValue.length > 40 ? cellValue.substring(0, 37) + '...' : cellValue;
                doc.text(displayValue, xPos + cellPadding, startYPos + 5, { 
                  width: cellWidth - (cellPadding * 2), 
                  align: 'left' 
                });
                
                xPos = cellRight;
              });
              
              // Draw bottom border of row
              doc.moveTo(tableStartX, startYPos + rowHeight).lineTo(tableEndX, startYPos + rowHeight).stroke();
            }
          };

          // Draw header
          drawTableWithBorders(currentY, true);
          currentY += rowHeight;

          // Draw data rows
          data.forEach((row, rowIdx) => {
            // Check if we need a new page
            if (currentY + rowHeight > pageHeight) {
              doc.addPage();
              currentY = 50;
              
              // Redraw header on new page
              drawTableWithBorders(currentY, true);
              currentY += rowHeight;
            }

            // Draw row data with borders
            drawTableWithBorders(currentY, false, row);
            currentY += rowHeight;
          });

          // ===== SUMMARY SECTION (for orders/transactions report) =====
          if (reportType === 'orders' && data.length > 0) {
            try {
              // Check if we need a new page for summary
              if (currentY + 150 > pageHeight) {
                doc.addPage();
                currentY = 50;
              }

              currentY += 30; // Add spacing

              // Draw separator line
              doc.moveTo(tableStartX, currentY).lineTo(tableEndX, currentY).stroke();
              currentY += 15;

              // Summary Title
              doc.fontSize(12).font('Helvetica-Bold').text('Ringkasan Laporan', tableStartX, currentY);
              currentY += 25;

              // Helper function untuk format currency Indonesian style
              const formatCurrency = (amount) => {
                try {
                  const num = parseFloat(amount) || 0;
                  // Format: Rp 1.000.000 (titik sebagai separator ribuan)
                  return 'Rp ' + num.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
                } catch (e) {
                  return 'Rp 0';
                }
              };

              // Calculate statistics with error handling
              const totalTransactions = data.length;

              let totalRevenue = 0;
              let totalPlatformFee = 0;
              let totalGatewayFee = 0;

              data.forEach(row => {
                try {
                  // Use actual fee columns if available, otherwise calculate
                  const hargaOrder = parseFloat(row['Harga Order'] || row['Harga'] || row['Total Bayar']) || 0;
                  const platformFee = parseFloat(row['Biaya Platform (5%)']) || (hargaOrder * 0.05);
                  const gatewayFee = parseFloat(row['Biaya Gateway (1%)']) || (hargaOrder * 0.01);

                  totalRevenue += hargaOrder;
                  totalPlatformFee += platformFee;
                  totalGatewayFee += gatewayFee;
                } catch (e) {
                  console.error('Error calculating revenue for row:', e);
                }
              });

              // Count by status
              const statusCount = {};
              data.forEach(row => {
                try {
                  const status = row['Status'] || 'Unknown';
                  statusCount[status] = (statusCount[status] || 0) + 1;
                } catch (e) {
                  console.error('Error counting status:', e);
                }
              });

              // Count by payment status
              const paymentStatusCount = {};
              data.forEach(row => {
                try {
                  const paymentStatus = row['Status Pembayaran'] || 'Belum Bayar';
                  paymentStatusCount[paymentStatus] = (paymentStatusCount[paymentStatus] || 0) + 1;
                } catch (e) {
                  console.error('Error counting payment status:', e);
                }
              });

              // Display summary
              doc.fontSize(10).font('Helvetica');

              // Total Transactions
              doc.text(`Total Transaksi: ${totalTransactions}`, tableStartX, currentY);
              currentY += 18;

              // Total Revenue
              doc.text(`Total Revenue: ${formatCurrency(totalRevenue)}`, tableStartX, currentY);
              currentY += 15;

              // Platform Fee (Biaya Operasional Website - 5%)
              doc.fontSize(9).fillColor('#666666').text(
                `  Biaya Operasional Website (5%): ${formatCurrency(totalPlatformFee)}`,
                tableStartX,
                currentY
              );
              currentY += 15;

              // Gateway Fee (Biaya Midtrans - 1%)
              doc.text(
                `  Biaya Payment Gateway Midtrans (1%): ${formatCurrency(totalGatewayFee)}`,
                tableStartX,
                currentY
              );
              currentY += 15;

              // Net Revenue
              const netRevenue = totalRevenue - totalPlatformFee - totalGatewayFee;
              doc.fontSize(10).fillColor('#000000').font('Helvetica-Bold').text(
                `Net Revenue (setelah biaya): ${formatCurrency(netRevenue)}`,
                tableStartX,
                currentY
              );
              currentY += 20;

              // Status Breakdown
              doc.font('Helvetica-Bold').text('Breakdown Status Order:', tableStartX, currentY);
              currentY += 15;
              doc.font('Helvetica').fontSize(9);
              Object.entries(statusCount).forEach(([status, count]) => {
                try {
                  const percentage = ((count/totalTransactions)*100).toFixed(1);
                  doc.text(`  • ${status}: ${count} transaksi (${percentage}%)`, tableStartX, currentY);
                  currentY += 14;
                } catch (e) {
                  console.error('Error displaying status:', e);
                }
              });

              currentY += 5;

              // Payment Status Breakdown
              doc.fontSize(10).font('Helvetica-Bold').text('Breakdown Status Pembayaran:', tableStartX, currentY);
              currentY += 15;
              doc.font('Helvetica').fontSize(9);
              Object.entries(paymentStatusCount).forEach(([status, count]) => {
                try {
                  const percentage = ((count/totalTransactions)*100).toFixed(1);
                  doc.text(`  • ${status}: ${count} transaksi (${percentage}%)`, tableStartX, currentY);
                  currentY += 14;
                } catch (e) {
                  console.error('Error displaying payment status:', e);
                }
              });

              doc.fillColor('#000000'); // Reset color
            } catch (summaryError) {
              console.error('Error generating summary section:', summaryError);
              // Continue without summary if error occurs
              doc.fontSize(10).font('Helvetica').fillColor('#FF0000').text(
                'Error: Tidak dapat membuat ringkasan',
                tableStartX,
                currentY
              );
              doc.fillColor('#000000');
            }
          }
        }

        // ===== FOOTER =====
        const pages = doc.bufferedPageRange();
        for (let i = 0; i < pages.count; i++) {
          doc.switchToPage(pages.start + i);
          doc.fontSize(8).font('Helvetica').text(
            `SkillConnect - Halaman ${i + 1} dari ${pages.count}`,
            0,
            doc.page.height - 30,
            { align: 'center' }
          );
        }

        doc.end();
        stream.on('finish', () => {
          resolve({ 
            filename, 
            filepath,
            success: true, 
            rowCount: data.length 
          });
        });
      } catch (error) {
        console.error('Error in generatePDF:', error);
        reject(error);
      }
    });
  }

  calculateColumnWidths(columns, data, doc) {
    // Landscape A4: 842pt width, minus margins (40 * 2)
    const totalWidth = 762; // 842 - 80 (margins)
    const minWidth = 70;
    const maxWidth = 180;
    
    // Calculate width for each column based on content
    const widths = columns.map(col => {
      const headerWidth = doc.widthOfString(col, { fontSize: 9 });
      const maxDataWidth = Math.max(
        ...data.slice(0, 100).map(row => {
          const val = String(row[col] || '-');
          const displayVal = val.length > 30 ? val.substring(0, 27) + '...' : val;
          return doc.widthOfString(displayVal, { fontSize: 8 });
        })
      );
      return Math.max(minWidth, Math.min(maxWidth, Math.max(headerWidth, maxDataWidth) + 10));
    });

    // Normalize widths to fit total width
    const totalCalculated = widths.reduce((sum, w) => sum + w, 0);
    const ratio = totalWidth / totalCalculated;
    
    return widths.map(w => Math.floor(w * ratio));
  }
}

module.exports = ReportGenerator;