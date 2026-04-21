const LostFoundItem = require('../models/LostFoundItem');

exports.createItem = async (req, res) => {
  try {
    const { type, itemName, category, description, location, date, contactInfo, additionalContact } = req.body;

    const name = itemName != null ? String(itemName).trim() : '';
    const cat = category != null ? String(category).trim() : '';
    const loc = location != null ? String(location).trim() : '';
    const dateStr = date != null ? String(date).trim() : '';

    // Note: description may be empty from the form — do not use !description (empty string is valid; we default below)
    if (!type || !name || !cat || !loc || !dateStr) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: type, item name, category, location, and date are required.',
      });
    }

    const desc =
      description != null && String(description).trim().length > 0
        ? String(description).trim()
        : 'No additional details provided.';

    const when = new Date(dateStr);
    if (Number.isNaN(when.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid date.' });
    }

    const t = String(type).toLowerCase();
    if (!['lost', 'found'].includes(t)) {
      return res.status(400).json({ success: false, message: 'type must be "lost" or "found".' });
    }

    console.log('📦 Creating LostFoundItem with payload:', { type: t, itemName: name, category: cat, reportedBy: req.user._id });
    
    const item = await LostFoundItem.create({
      type: t,
      itemName: name,
      category: cat,
      description: desc,
      location: loc,
      date: when,
      contactInfo: contactInfo || '',
      additionalContact: additionalContact || '',
      image: req.file
        ? { path: req.file.path, originalName: req.file.originalname, mimeType: req.file.mimetype }
        : undefined,
      reportedBy: req.user._id
    });

    console.log('✅ LostFoundItem created:', item._id);

    try {
      const { createNotification } = require('./notificationController');
      if (createNotification) {
        await createNotification({
          user: req.user._id,
          type: 'LostFound',
          title: t === 'lost' ? 'Lost item posted' : 'Found item posted',
          message: `Your listing “${name}” is now visible on Lost & Found.`,
          data: { itemId: item._id.toString() },
        });
        console.log('🔔 Notification sent to user');
      }
    } catch (e) {
      console.error('⚠️ Lost&Found self-notification error (non-fatal):', e.message);
    }

    return res.status(201).json({ success: true, data: item });
  } catch (err) {
    console.error('❌ Lost&Found create error:', err);
    
    if (err.name === 'ValidationError') {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation Error: ' + Object.values(err.errors).map(e => e.message).join(', ') 
      });
    }
    
    return res.status(500).json({ success: false, message: 'Server Error: ' + err.message });
  }
};

exports.listItems = async (req, res) => {
  try {
    const { type, status, search } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (status) {
      filter.status = status;
    } else {
      // By default, hide items that have been reported found or closed
      filter.status = { $in: ['Open', 'Claimed'] };
    }
    if (search) {
      filter.$or = [
        { itemName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const items = await LostFoundItem.find(filter).sort({ createdAt: -1 });
    return res.json({ success: true, count: items.length, data: items });
  } catch (err) {
    console.error('Lost&Found list error:', err);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

/** Public homepage / unauthenticated listing — open items only. */
exports.listPublicItems = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
    const { search } = req.query;
    const filter = { status: 'Open' };
    
    if (search) {
      filter.$or = [
        { itemName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const items = await LostFoundItem.find(filter).sort({ createdAt: -1 }).limit(limit);
    return res.json({ success: true, count: items.length, data: items });
  } catch (err) {
    console.error('Lost&Found public list error:', err);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.listMine = async (req, res) => {
  try {
    const items = await LostFoundItem.find({ reportedBy: req.user._id }).sort({ createdAt: -1 });
    return res.json({ success: true, count: items.length, data: items });
  } catch (err) {
    console.error('Lost&Found mine error:', err);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.claimItem = async (req, res) => {
  try {
    const item = await LostFoundItem.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

    item.status = 'Claimed';
    item.claimedBy = req.user._id;
    await item.save();

    // Notify original reporter
    if (item.reportedBy) {
      const { createNotification } = require('./notificationController');
      try {
        await createNotification({
          user: item.reportedBy,
          type: 'LostFound',
          title: 'Item Claimed',
          message: `Someone has claimed the item: ${item.itemName}. Check your contacts to coordinate.`,
          data: { itemId: item._id.toString() }
        });
      } catch (notifErr) {
        console.error('Failed to notify reporter:', notifErr);
      }
    }

    return res.json({ success: true, data: item });
  } catch (err) {
    console.error('Lost&Found claim error:', err);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.closeItem = async (req, res) => {
  try {
    const item = await LostFoundItem.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

    item.status = 'Closed';
    await item.save();

    return res.json({ success: true, data: item });
  } catch (err) {
    console.error('Lost&Found close error:', err);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.reportFound = async (req, res) => {
  try {
    const { locationDetails, contactNumber } = req.body;
    if (!locationDetails || !contactNumber) {
      return res.status(400).json({ success: false, message: 'Location details and contact number are required.' });
    }

    const item = await LostFoundItem.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
    if (item.type !== 'lost') {
      return res.status(400).json({ success: false, message: 'Only lost items can be reported as found.' });
    }

    item.status = 'ReportedFound';
    item.foundBy = req.user._id;
    item.foundLocationDetails = locationDetails;
    item.finderContactNumber = contactNumber;
    await item.save();

    // Notify original owner (reportedBy)
    if (item.reportedBy) {
      const { createNotification } = require('./notificationController');
      try {
        await createNotification({
          user: item.reportedBy,
          type: 'LostFound',
          title: 'Your Lost Item Was Found!',
          message: `Good news! Someone found your item "${item.itemName}" and placed it at "${locationDetails}". You can contact them at ${contactNumber}.`,
          data: { itemId: item._id.toString() }
        });
      } catch (notifErr) {
        console.error('Failed to notify owner:', notifErr);
      }
    }

    return res.json({
      success: true,
      message: 'Found report submitted successfully. The owner has been notified.',
      data: item
    });
  } catch (err) {
    console.error('Lost&Found report found error:', err);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

