const { getAll, getOne, createOne, updateOne, deleteOne } = require('../utils/crudFactory');

module.exports = {
  getAll: getAll('gallery'),
  getOne: getOne('gallery'),
  createOne: createOne('gallery', 'gallery'),
  updateOne: updateOne('gallery', 'gallery'),
  deleteOne: deleteOne('gallery', 'gallery'),
};