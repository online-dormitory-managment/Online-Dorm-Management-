const Order = require('../models/Order');
const MarketplaceListing = require('../models/MarketplaceListing');
const Notification = require('../models/Notification');

// Student places an order
exports.placeOrder = async (req, res) => {
  try {
    const { listingId, quantity, note } = req.body;
    const qty = parseInt(quantity, 10) || 1;

    const listing = await MarketplaceListing.findById(listingId);
    if (!listing || listing.status !== 'Active') {
      return res.status(404).json({ success: false, message: 'Product not available.' });
    }
    if (listing.stock < qty) {
      return res.status(400).json({ success: false, message: `Only ${listing.stock} left in stock.` });
    }

    // Decrease stock
    listing.stock -= qty;
    if (listing.stock === 0) listing.status = 'Sold';
    await listing.save();

    const order = await Order.create({
      listing: listing._id,
      buyer: req.user._id,
      seller: listing.seller,
      quantity: qty,
      totalPrice: listing.price * qty,
      deliveryTime: listing.deliveryTime || '10 minutes',
      note: note || '',
    });

    // Notify vendor
    await Notification.create({
      user: listing.seller,
      type: 'Marketplace',
      title: 'New Order Received!',
      message: `A student ordered ${qty}x "${listing.title}" for ${order.totalPrice} ETB. Payment on delivery.`,
      data: { orderId: order._id, listingId: listing._id },
    });

    return res.status(201).json({ success: true, data: order });
  } catch (err) {
    console.error('Order place:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Vendor accepts order & notifies buyer
exports.acceptOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, seller: req.user._id }).populate('listing');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    order.status = 'Accepted';
    await order.save();

    // Notify buyer
    await Notification.create({
      user: order.buyer,
      type: 'Marketplace',
      title: 'Order Accepted!',
      message: `Your order for "${order.listing.title}" has been accepted. Delivery in ${order.deliveryTime}. Payment on delivery.`,
      data: { orderId: order._id },
    });

    return res.json({ success: true, data: order });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Vendor cancels order (restores stock)
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, seller: req.user._id });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // Restore stock
    const listing = await MarketplaceListing.findById(order.listing);
    if (listing) {
      listing.stock += order.quantity;
      if (listing.status === 'Sold') listing.status = 'Active';
      await listing.save();
    }

    order.status = 'Cancelled';
    await order.save();

    // Notify buyer
    await Notification.create({
      user: order.buyer,
      type: 'Marketplace',
      title: 'Order Cancelled',
      message: `Your order has been cancelled by the vendor. No payment needed.`,
      data: { orderId: order._id },
    });

    return res.json({ success: true, data: order });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// List vendor's orders
exports.vendorOrders = async (req, res) => {
  try {
    const orders = await Order.find({ seller: req.user._id })
      .sort({ createdAt: -1 })
      .populate('listing', 'title price image')
      .populate('buyer', 'name userID');
    return res.json({ success: true, data: orders });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// List student's orders
exports.myOrders = async (req, res) => {
  try {
    const orders = await Order.find({ buyer: req.user._id })
      .sort({ createdAt: -1 })
      .populate('listing', 'title price image deliveryTime')
      .populate('seller', 'name');
    return res.json({ success: true, data: orders });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
