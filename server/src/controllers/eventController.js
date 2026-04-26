const Event = require('../models/Event');
const Student = require('../models/Student');
const { normalizeFilePath } = require('../utils/fileNormalization');

exports.getEvents = async (req, res) => {
  try {
    const events = await Event.find().sort({ date: 1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMyEvents = async (req, res) => {
  try {
    const events = await Event.find({ postedBy: req.user._id }).sort({ date: -1 });
    res.json({ success: true, data: events });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createEvent = async (req, res) => {
  try {
    const payload = { ...req.body };
    const userRole = req.user.role;

    // Check permission - Allowed roles include EventPoster, Admin roles, and Proctor
    if (!['CampusAdmin', 'SuperAdmin', 'Proctor', 'EventPoster'].includes(userRole)) {
      return res.status(403).json({ success: false, message: 'Your role does not have permission to post events.' });
    }

    if (req.user) payload.postedBy = req.user._id;
    if (payload.date) payload.date = new Date(payload.date);
    
    // Handle image upload
    if (req.file) {
      const { persistFileToDb } = require('../utils/dbStorage');
      persistFileToDb(req.file.path).catch(() => {});
      payload.image = {
        path: normalizeFilePath(req.file.path),
        originalName: req.file.originalname,
        mimeType: req.file.mimetype
      };
    }
    
    const event = new Event(payload);
    await event.save();
    res.status(201).json(event);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const admin = ['CampusAdmin', 'SuperAdmin'].includes(req.user.role);
    const owner = event.postedBy && event.postedBy.toString() === req.user._id.toString();
    if (!owner && !admin) {
      return res.status(403).json({ message: 'Not allowed to edit this event' });
    }

    const payload = { ...req.body };
    if (payload.date) payload.date = new Date(payload.date);
    
    if (req.file) {
      const { persistFileToDb } = require('../utils/dbStorage');
      persistFileToDb(req.file.path).catch(() => {});
      payload.image = {
        path: normalizeFilePath(req.file.path),
        originalName: req.file.originalname,
        mimeType: req.file.mimetype
      };
    }

    Object.assign(event, payload);
    await event.save();
    res.json(event);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const admin = ['CampusAdmin', 'SuperAdmin'].includes(req.user.role);
    const owner = event.postedBy && event.postedBy.toString() === req.user._id.toString();
    if (!owner && !admin) {
      return res.status(403).json({ message: 'Not allowed to delete this event' });
    }

    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: 'Event deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
