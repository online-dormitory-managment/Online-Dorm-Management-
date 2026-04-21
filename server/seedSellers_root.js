const mongoose = require('mongoose');
const User = require('./src/models/User');
const Seller = require('./src/models/Seller');
const bcrypt = require('bcryptjs');

const seedSellers = async () => {
  try {
    // Attempt local if MongoDB is local, otherwise check .env for URI
    await mongoose.connect('mongodb://localhost:27017/dorm_management'); 
    
    // Create User account first
    const sellerPassword = await bcrypt.hash('seller123', 12);
    
    const user = await User.findOneAndUpdate(
      { userID: 'legal_seller_01' },
      {
        userID: 'legal_seller_01',
        name: 'University Bookstore',
        email: 'bookstore@university.edu.et',
        password: sellerPassword,
        role: 'MarketPoster',
        campus: 'Main Campus'
      },
      { upsert: true, new: true }
    );

    await Seller.findOneAndUpdate(
      { sellerID: 'SELL-001' },
      {
        user: user._id,
        businessName: 'AAU Official Bookstore',
        sellerID: 'SELL-001',
        description: 'Authorized campus vendor for books and stationary.',
        contactPhone: '+251911223344',
        category: 'Stationary',
        isApproved: true,
        assignedCampus: 'Main Campus'
      },
      { upsert: true }
    );

    console.log('✅ Marketplace Seller seeded: legal_seller_01 / seller123');
    process.exit();
  } catch (err) {
    console.error('Seed Error:', err);
    process.exit(1);
  }
};

seedSellers();
