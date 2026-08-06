const { getAll, getOne, createOne, updateOne, deleteOne } = require('../utils/crudFactory');

module.exports = {
  getAll: getAll('staff', { order: 'asc' }),
  getOne: getOne('staff'),
  createOne: createOne('staff', 'staff'),
  updateOne: updateOne('staff', 'staff'),
  deleteOne: deleteOne('staff', 'staff'),
};