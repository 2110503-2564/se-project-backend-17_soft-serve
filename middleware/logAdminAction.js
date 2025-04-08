const AdminLog = require('../models/AdminLog');

const logAdminAction = (action, resource) => async (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    await AdminLog.create({
      adminId: req.user.id,
      action,
      resource,
      resourceId: req.params.id || null
    });
  }
  next();
};

module.exports = logAdminAction;
