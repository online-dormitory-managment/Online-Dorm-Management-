// src/middleware/campusMiddleware.js
const authorizeCampus = (action) => {
  return (req, res, next) => {
    if (req.user.role === 'SuperAdmin') return next();  // SuperAdmin has full access

    if (req.user.role === 'CampusAdmin') {
      // For edit actions, check if resource belongs to their campus
      if (action === 'edit') {
        const resourceCampus = req.body.campus || req.building?.campus || req.application?.building?.campus;
        if (resourceCampus === req.user.campus) return next();
      }
      if (action === 'view') return next();  // CampusAdmin can view all
    }

    if (req.user.role === 'Proctor') {
      if (action === 'view' && req.application?.assignedRoom?.building.toString() === req.user.assignedBuilding?.toString()) {
        return next();
      }
    }

    return res.status(403).json({ message: 'Access denied — insufficient campus permissions' });
  };
};

module.exports = { authorizeCampus };