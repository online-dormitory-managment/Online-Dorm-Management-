const MarketplaceListing = require('../models/MarketplaceListing');

exports.listPublic = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
    const { search } = req.query;
    const filter = { status: 'Active' };

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const items = await MarketplaceListing.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('seller', 'name userID email');
    return res.json({ success: true, count: items.length, data: items });
  } catch (err) {
    console.error('Marketplace listPublic:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.listMine = async (req, res) => {
  try {
    const items = await MarketplaceListing.find({ seller: req.user._id }).sort({ createdAt: -1 });
    return res.json({ success: true, count: items.length, data: items });
  } catch (err) {
    console.error('Marketplace listMine:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.createListing = async (req, res) => {
  try {
    // Only allow Vendor, Student or Admin roles
    const allowedRoles = ['Student', 'Vendor', 'MarketPoster', 'CampusAdmin', 'SuperAdmin'];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Marketplace selling is restricted to authorized university vendors.' 
      });
    }

    const { title, description, price, currency, category, condition, contactHint, stock, deliveryTime } = req.body;
    const priceNum = Number(price);
    if (!title || Number.isNaN(priceNum) || priceNum < 0) {
      return res.status(400).json({ success: false, message: 'Title and valid price are required.' });
    }

    const { normalizeFilePath } = require('../utils/fileNormalization');
    const doc = await MarketplaceListing.create({
      title: String(title).trim(),
      description: description || '',
      price: priceNum,
      currency: currency || 'ETB',
      category: category || 'Other',
      condition: condition || 'Good',
      contactHint: contactHint || '',
      stock: parseInt(stock, 10) || 1,
      deliveryTime: deliveryTime || '10 minutes',
      image: req.file
        ? { path: normalizeFilePath(req.file.path), originalName: req.file.originalname, mimeType: req.file.mimetype }
        : undefined,
      seller: req.user._id,
      status: 'Active',
    });

    return res.status(201).json({ success: true, data: doc });
  } catch (err) {
    console.error('Marketplace create:', err);
    return res.status(400).json({ success: false, message: err.message });
  }
};

exports.restackListing = async (req, res) => {
  try {
    const item = await MarketplaceListing.findOne({ _id: req.params.id, seller: req.user._id });
    if (!item) return res.status(404).json({ success: false, message: 'Listing not found' });
    
    // "Restack" means making it active/available again if it was sold or removed
    item.status = 'Active';
    item.updatedAt = Date.now();
    await item.save();
    
    return res.json({ success: true, message: 'Inventory restacked successfully', data: item });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteMine = async (req, res) => {
  try {
    const item = await MarketplaceListing.findOne({ _id: req.params.id, seller: req.user._id });
    if (!item) return res.status(404).json({ success: false, message: 'Listing not found' });
    item.status = 'Removed';
    await item.save();
    return res.json({ success: true, data: item });
  } catch (err) {
    console.error('Marketplace delete:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.markSold = async (req, res) => {
  try {
    const item = await MarketplaceListing.findOne({ _id: req.params.id, seller: req.user._id });
    if (!item) return res.status(404).json({ success: false, message: 'Listing not found' });
    item.status = 'Sold';
    await item.save();
    return res.json({ success: true, data: item });
  } catch (err) {
    console.error('Marketplace markSold:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
