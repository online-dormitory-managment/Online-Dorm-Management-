// src/routes/adminDormRoutes.js
const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const { authorizeCampus } = require('../middleware/campusMiddleware');
const {
  getAllBuildings,
  getBuildingById,
  createBuilding,
  updateBuilding,
  deleteBuilding,
  getFloorsByBuilding,
  addFloor,
  updateFloor,
  deleteFloor,
  getRoomsByFloor,
  addRoom,
  updateRoom,
  deleteRoom,
  reviewApplication
} = require('../controllers/adminDormcontroller');

const router = express.Router();

// Middleware for all dorm admin routes
router.use(protect);
router.use(authorize('CampusAdmin', 'SuperAdmin'));

// Building CRUD
router.get('/buildings', getAllBuildings);
router.get('/buildings/:id', getBuildingById);
router.post('/buildings', createBuilding);
router.put('/buildings/:id', updateBuilding);
router.delete('/buildings/:id', deleteBuilding);

// Floor CRUD
router.get('/buildings/:buildingId/floors', getFloorsByBuilding);
router.post('/floors', addFloor);
router.put('/floors/:id', updateFloor);
router.delete('/floors/:id', deleteFloor);

// Room CRUD
router.get('/floors/:floorId/rooms', getRoomsByFloor);
router.post('/rooms', addRoom);
router.put('/rooms/:id', updateRoom);
router.delete('/rooms/:id', deleteRoom);

// Application review - with campus permission check
router.put(
  '/applications/:id/review',
  authorize('Proctor', 'CampusAdmin', 'SuperAdmin'),
  authorizeCampus('edit'),
  reviewApplication
);

module.exports = router;