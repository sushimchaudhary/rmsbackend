const QRCode = require('qrcode');
const uploadToCloudinary = require('../utils/cloudinaryUpload');
// ✅ १. Prisma Client लाई सही तरिकाले Import गर्नुहोस्
const prisma = require('../config/dbConnect').prisma || require('../config/dbConnect');

class RestaurantTableService {
  static async generateQrFor(table) {
    const FRONTEND_MENU_URL = process.env.FRONTEND_MENU_URL || 'http://localhost:3000';

    // Menu URL निर्माण गर्ने
    const fullUrl = `${FRONTEND_MENU_URL}/menu/?table_number=${table.table_number}&branch=${table.branch_id}`;

    // 1. QR Code Buffer Generate गर्ने
    const qrBuffer = await QRCode.toBuffer(fullUrl, { width: 300, margin: 2 });

    // 2. Cloudinary मा Upload गर्ने
    const result = await uploadToCloudinary(qrBuffer, 'kitchenos/table_qrcodes');

    // 3. Database मा qr_code update गर्ने
    // ⚠️ (यहाँ prisma undefined भएर वा `.restaurantTable` नमिल्दा error आएको हो)
    const updatedTable = await prisma.restaurantTable.update({
      where: { id: table.id },
      data: { qr_code: result.secure_url },
    });

    return updatedTable;
  }
}

module.exports = RestaurantTableService;