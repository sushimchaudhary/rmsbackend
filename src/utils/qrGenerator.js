const QRCode = require('qrcode');
const { prisma } = require('../config/dbConnect');

/**
 * Table ko QR Code generate garne function
 * @param {Object} table - Prisma table object with branch included
 */
const generateQrForTable = async (table) => {
  try {
    if (!table || !table.id) return table;

    // QR ma rakhne string payload (E.g. Table ID, Branch, etc.)
    const qrData = JSON.stringify({
      tableId: table.id,
      tableNumber: table.table_number,
      branchId: table.branch_id,
    });

    // Base64 Data URL ma QR Image generate garne
    const qrCodeUrl = await QRCode.toDataURL(qrData);

    // Database ma QR Code update garne
    const updatedTable = await prisma.restaurantTable.update({
      where: { id: table.id },
      data: { qr_code: qrCodeUrl },
      include: { branch: true },
    });

    return updatedTable;
  } catch (error) {
    console.error("QR Generation Error:", error);
    return table; // Failure ma puranai table object return garne
  }
};

module.exports = { generateQrForTable };