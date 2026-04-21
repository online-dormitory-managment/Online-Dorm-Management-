const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { createSingleUpload } = require('../config/singleUpload');
const eventsUpload = createSingleUpload('events');

router.get('/', eventController.getEvents);
router.get('/mine', protect, authorize('Student', 'EventPoster', 'CampusAdmin', 'SuperAdmin'), eventController.getMyEvents);
router.post(
  '/',
  protect,
  authorize('Student', 'EventPoster', 'CampusAdmin', 'SuperAdmin'),
  eventsUpload.single('image'),
  eventController.createEvent
);
router.put(
  '/:id',
  protect,
  authorize('Student', 'EventPoster', 'CampusAdmin', 'SuperAdmin'),
  eventsUpload.single('image'),
  eventController.updateEvent
);
router.delete('/:id', protect, authorize('Student', 'EventPoster', 'CampusAdmin', 'SuperAdmin', 'Proctor'), eventController.deleteEvent);

module.exports = router;
