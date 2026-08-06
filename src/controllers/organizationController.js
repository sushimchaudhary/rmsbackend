const { getAll, getOne, createOne, updateOne, deleteOne } = require('../utils/crudFactory');

module.exports = {
  getAll: getAll('organizationalDetail'),
  getOne: getOne('organizationalDetail'),
  createOne: createOne('organizationalDetail', 'organization'),
  updateOne: updateOne('organizationalDetail', 'organization'),
  deleteOne: deleteOne('organizationalDetail', 'organization'),
};