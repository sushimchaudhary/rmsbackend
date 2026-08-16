const {
    upsertMerchantAccount,
    deactivateMerchantAccount,
    listMerchantAccounts,
  } = require('../services/merchantaccountService');
  
  const { prisma } = require('../config/dbConnect');
  
  // Shared tenant-isolation check: super_user can touch anything;
  // a normal admin can only touch their own restaurant / its branches.
  async function assertOwnsTarget(req, { restaurant_id, branch_id }) {
    if (req.user.super_user) return;
  
    if (branch_id) {
      const branch = await prisma.branch.findUnique({ where: { id: branch_id } });
      if (!branch || branch.restaurant_id !== req.user.restaurant_id) {
        const err = new Error('Access denied to this branch.');
        err.statusCode = 403;
        throw err;
      }
      return;
    }
  
    if (restaurant_id && restaurant_id !== req.user.restaurant_id) {
      const err = new Error('Access denied to this restaurant.');
      err.statusCode = 403;
      throw err;
    }
  }
  
  /* ===================== CREATE / UPDATE MERCHANT ACCOUNT ===================== */
  exports.upsertAccount = async (req, res) => {
    try {
      const { scope, provider, restaurant_id, branch_id, secret_key, product_code, public_key } = req.body;
  
      // Non-super admins can only set credentials for their own tenant
      const targetRestaurantId = req.user.super_user ? restaurant_id : req.user.restaurant_id;
  
      await assertOwnsTarget(req, { restaurant_id: targetRestaurantId, branch_id });
  
      const account = await upsertMerchantAccount({
        scope,
        provider,
        restaurant_id: targetRestaurantId,
        branch_id,
        secret_key,
        product_code,
        public_key,
      });
  
      res.status(200).json({ response: 'Merchant account saved.', data: account });
    } catch (err) {
      console.error('UPSERT MERCHANT ACCOUNT ERROR:', err);
      res.status(err.statusCode || 500).json({ response: err.message || 'Server error' });
    }
  };
  
  /* ===================== LIST MERCHANT ACCOUNTS (per restaurant) ===================== */
  exports.getAccounts = async (req, res) => {
    try {
      const restaurant_id = req.user.super_user
        ? req.params.restaurant_id || req.query.restaurant_id
        : req.user.restaurant_id;
  
      if (!restaurant_id) {
        return res.status(400).json({ response: 'restaurant_id is required.' });
      }
  
      await assertOwnsTarget(req, { restaurant_id });
  
      const accounts = await listMerchantAccounts({ restaurant_id });
      res.status(200).json({ data: accounts });
    } catch (err) {
      console.error('LIST MERCHANT ACCOUNTS ERROR:', err);
      res.status(err.statusCode || 500).json({ response: err.message || 'Server error' });
    }
  };
  
  /* ===================== DEACTIVATE ===================== */
  exports.deactivateAccount = async (req, res) => {
    try {
      const { id } = req.params;
  
      const existing = await prisma.merchantAccount.findUnique({ where: { id } });
      if (!existing) return res.status(404).json({ response: 'Merchant account not found.' });
  
      await assertOwnsTarget(req, {
        restaurant_id: existing.restaurant_id,
        branch_id: existing.branch_id,
      });
  
      await deactivateMerchantAccount(id);
      res.status(200).json({ response: 'Merchant account deactivated.' });
    } catch (err) {
      console.error('DEACTIVATE MERCHANT ACCOUNT ERROR:', err);
      res.status(err.statusCode || 500).json({ response: err.message || 'Server error' });
    }
  };