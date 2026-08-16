/**
 * Resolves and manages MerchantAccount rows.
 *
 * Resolution order for a customer order payment:
 *   1. Active branch-level account for (branch_id, provider)
 *   2. Active restaurant-level account for (restaurant_id, provider)
 *   3. Throw — restaurant/branch hasn't configured that gateway yet.
 *
 * This is the single place that decides "whose money does this payment
 * belong to" — every payment controller should go through here instead
 * of reading gateway credentials from env/config directly.
 */

const { prisma } = require('../config/dbConnect');
const { encrypt, decrypt } = require('../utils/encryption');

/**
 * @param {{branch_id: string, provider: 'esewa'|'khalti'}} params
 * @returns {{
 *   id: string,
 *   scope: 'restaurant'|'branch',
 *   provider: string,
 *   secretKey: string,      // decrypted
 *   productCode: string|null,
 *   publicKey: string|null,
 *   restaurant_id: string,
 *   branch_id: string|null,
 * }}
 */
async function resolveMerchantAccount({ branch_id, provider }) {
  if (!branch_id || !provider) {
    const err = new Error('branch_id and provider are required to resolve a merchant account.');
    err.statusCode = 400;
    throw err;
  }

  const branch = await prisma.branch.findUnique({
    where: { id: branch_id },
    select: { id: true, restaurant_id: true },
  });

  if (!branch) {
    const err = new Error('Branch not found.');
    err.statusCode = 404;
    throw err;
  }

  // 1. Branch-level account
  let account = await prisma.merchantAccount.findFirst({
    where: { scope: 'branch', branch_id: branch.id, provider, is_active: true },
  });

  // 2. Fallback: restaurant-level account (shared across all branches)
  if (!account) {
    account = await prisma.merchantAccount.findFirst({
      where: {
        scope: 'restaurant',
        restaurant_id: branch.restaurant_id,
        branch_id: null,
        provider,
        is_active: true,
      },
    });
  }

  if (!account) {
    const err = new Error(
      `No active ${provider} merchant account configured for this restaurant/branch. ` +
        `Ask the restaurant admin to add one before accepting payments.`
    );
    err.statusCode = 422;
    throw err;
  }

  return {
    id: account.id,
    scope: account.scope,
    provider: account.provider,
    secretKey: decrypt(account.encrypted_secret_key),
    productCode: account.product_code,
    publicKey: account.public_key,
    restaurant_id: account.restaurant_id || branch.restaurant_id,
    branch_id: account.branch_id,
  };
}

/**
 * Create or replace a merchant account. Enforces:
 *  - scope/restaurant_id/branch_id are internally consistent
 *  - caller (checked by controller) actually owns this restaurant/branch
 *  - secret key is encrypted before it ever reaches Prisma
 */
async function upsertMerchantAccount({
  scope,
  provider,
  restaurant_id,
  branch_id,
  secret_key,
  product_code,
  public_key,
}) {
  if (!['restaurant', 'branch'].includes(scope)) {
    throw badRequest("scope must be 'restaurant' or 'branch'.");
  }
  if (!['esewa', 'khalti'].includes(provider)) {
    throw badRequest("provider must be 'esewa' or 'khalti'.");
  }
  if (!secret_key || !secret_key.trim()) {
    throw badRequest('secret_key is required.');
  }

  if (scope === 'restaurant') {
    if (!restaurant_id) throw badRequest('restaurant_id is required for scope=restaurant.');
    branch_id = null;
  } else {
    if (!branch_id) throw badRequest('branch_id is required for scope=branch.');
    const branch = await prisma.branch.findUnique({ where: { id: branch_id } });
    if (!branch) throw notFound('Branch not found.');
    restaurant_id = branch.restaurant_id; // always derive from the branch
  }

  const encrypted_secret_key = encrypt(secret_key.trim());

  // 1. Existing record check garne (Prisma null-in-unique key error bypass garna)
  const existing = await prisma.merchantAccount.findFirst({
    where: {
      provider,
      restaurant_id,
      branch_id: scope === 'restaurant' ? null : branch_id,
    },
  });

  let account;
  if (existing) {
    // 2. Existing bhetie update garne
    account = await prisma.merchantAccount.update({
      where: { id: existing.id },
      data: {
        scope,
        encrypted_secret_key,
        product_code: product_code || null,
        public_key: public_key || null,
        is_active: true,
      },
    });
  } else {
    // 3. Xaina bhane naya create garne
    account = await prisma.merchantAccount.create({
      data: {
        scope,
        provider,
        restaurant_id,
        branch_id,
        encrypted_secret_key,
        product_code: product_code || null,
        public_key: public_key || null,
        is_active: true,
      },
    });
  }

  // Never return the encrypted secret to the caller.
  const { encrypted_secret_key: _omit, ...safe } = account;
  return safe;
}

async function deactivateMerchantAccount(id) {
  return prisma.merchantAccount.update({ where: { id }, data: { is_active: false } });
}

async function listMerchantAccounts({ restaurant_id }) {
  const accounts = await prisma.merchantAccount.findMany({
    where: { restaurant_id },
    include: { branch: { select: { id: true, name: true, branch_code: true } } },
    orderBy: { created_at: 'desc' },
  });
  return accounts.map(({ encrypted_secret_key, ...safe }) => safe);
}

function badRequest(msg) {
  const err = new Error(msg);
  err.statusCode = 400;
  return err;
}
function notFound(msg) {
  const err = new Error(msg);
  err.statusCode = 404;
  return err;
}

module.exports = {
  resolveMerchantAccount,
  upsertMerchantAccount,
  deactivateMerchantAccount,
  listMerchantAccounts,
};