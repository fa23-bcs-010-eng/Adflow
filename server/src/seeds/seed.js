const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

const {
  User,
  Category,
  City,
  Package,
  LearningQuestion,
} = require('../models');

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    console.log('🌱 Seeding database...');
    console.log(`📍 Connecting to: ${mongoUri}`);

    await mongoose.connect(mongoUri, {
      dbName: process.env.MONGODB_DB_NAME || 'adflow',
    });

    console.log('✅ Connected to MongoDB');

    // ── Clear existing data (optional - comment out to keep data) ──
    // await Category.deleteMany({});
    // await City.deleteMany({});
    // await Package.deleteMany({});
    // await LearningQuestion.deleteMany({});

    // ── Seed Categories ──
    const categories = await Category.insertMany(
      [
        {
          name: 'Electronics',
          slug: 'electronics',
          description: 'Mobile phones, laptops, tablets, and accessories',
          icon: '📱',
          is_active: true,
          display_order: 1,
        },
        {
          name: 'Vehicles',
          slug: 'vehicles',
          description: 'Cars, motorcycles, bicycles, and parts',
          icon: '🚗',
          is_active: true,
          display_order: 2,
        },
        {
          name: 'Real Estate',
          slug: 'real-estate',
          description: 'Houses, apartments, plots, and commercial spaces',
          icon: '🏠',
          is_active: true,
          display_order: 3,
        },
        {
          name: 'Fashion',
          slug: 'fashion',
          description: 'Clothing, shoes, bags, and accessories',
          icon: '👗',
          is_active: true,
          display_order: 4,
        },
        {
          name: 'Furniture',
          slug: 'furniture',
          description: 'Beds, chairs, tables, and home decor',
          icon: '🛋️',
          is_active: true,
          display_order: 5,
        },
        {
          name: 'Books & Education',
          slug: 'books-education',
          description: 'Books, courses, and educational materials',
          icon: '📚',
          is_active: true,
          display_order: 6,
        },
        {
          name: 'Services',
          slug: 'services',
          description: 'Professional and personal services',
          icon: '🔧',
          is_active: true,
          display_order: 7,
        },
        {
          name: 'Sports & Hobbies',
          slug: 'sports-hobbies',
          description: 'Sports equipment and hobby items',
          icon: '⚽',
          is_active: true,
          display_order: 8,
        },
      ],
      { skipValidation: false }
    );
    console.log(`✅ Seeded ${categories.length} categories`);

    // ── Seed Cities ──
    const cities = await City.insertMany(
      [
        {
          name: 'Karachi',
          slug: 'karachi',
          country: 'Pakistan',
          province: 'Sindh',
          is_active: true,
          display_order: 1,
        },
        {
          name: 'Lahore',
          slug: 'lahore',
          country: 'Pakistan',
          province: 'Punjab',
          is_active: true,
          display_order: 2,
        },
        {
          name: 'Islamabad',
          slug: 'islamabad',
          country: 'Pakistan',
          province: 'Islamabad',
          is_active: true,
          display_order: 3,
        },
        {
          name: 'Rawalpindi',
          slug: 'rawalpindi',
          country: 'Pakistan',
          province: 'Punjab',
          is_active: true,
          display_order: 4,
        },
        {
          name: 'Multan',
          slug: 'multan',
          country: 'Pakistan',
          province: 'Punjab',
          is_active: true,
          display_order: 5,
        },
        {
          name: 'Peshawar',
          slug: 'peshawar',
          country: 'Pakistan',
          province: 'KP',
          is_active: true,
          display_order: 6,
        },
        {
          name: 'Faisalabad',
          slug: 'faisalabad',
          country: 'Pakistan',
          province: 'Punjab',
          is_active: true,
          display_order: 7,
        },
        {
          name: 'Quetta',
          slug: 'quetta',
          country: 'Pakistan',
          province: 'Balochistan',
          is_active: true,
          display_order: 8,
        },
      ],
      { skipValidation: false }
    );
    console.log(`✅ Seeded ${cities.length} cities`);

    // ── Seed Packages ──
    const packages = await Package.insertMany(
      [
        {
          name: 'Basic',
          slug: 'basic',
          duration_days: 7,
          weight: 1,
          is_featured: false,
          price: 0,
          description: 'Perfect for trying out AdFlow',
          features: [
            'Up to 5 listings',
            '7 days validity',
            'Basic support',
          ],
          is_active: true,
        },
        {
          name: 'Standard',
          slug: 'standard',
          duration_days: 30,
          weight: 2,
          is_featured: false,
          price: 49,
          description: 'For active sellers',
          features: [
            'Unlimited listings',
            '30 days validity',
            'Email support',
            'Basic analytics',
          ],
          is_active: true,
        },
        {
          name: 'Premium',
          slug: 'premium',
          duration_days: 90,
          weight: 3,
          is_featured: true,
          price: 99,
          description: 'For professional sellers',
          features: [
            'Unlimited listings',
            '90 days validity',
            'Priority support',
            'Advanced analytics',
            'Featured badge',
            'Bulk upload',
          ],
          is_active: true,
        },
        {
          name: 'Enterprise',
          slug: 'enterprise',
          duration_days: 365,
          weight: 5,
          is_featured: true,
          price: 299,
          description: 'Full-featured business solution',
          features: [
            'Unlimited everything',
            '365 days validity',
            '24/7 dedicated support',
            'Custom analytics',
            'API access',
            'Team management',
            'Custom workflows',
          ],
          is_active: true,
        },
      ],
      { skipValidation: false }
    );
    console.log(`✅ Seeded ${packages.length} packages`);

    // ── Seed Learning Questions ──
    const questions = await LearningQuestion.insertMany(
      [
        {
          question: 'How do I create my first listing?',
          answer:
            'Click on "Post an Ad" button, select a category, fill in the details, upload photos, and submit. Your ad will be reviewed by our team.',
          topic: 'posting',
          difficulty: 'beginner',
          is_active: true,
          display_order: 1,
        },
        {
          question: 'What is the difference between Basic and Standard packages?',
          answer:
            'Basic package is free with 5 listings and 7 days validity. Standard costs PKR 49 with unlimited listings and 30 days validity.',
          topic: 'pricing',
          difficulty: 'beginner',
          is_active: true,
          display_order: 2,
        },
        {
          question: 'How long does payment verification take?',
          answer:
            'Typically 1-2 hours during business hours. Please provide a clear screenshot of your payment proof.',
          topic: 'payment',
          difficulty: 'beginner',
          is_active: true,
          display_order: 3,
        },
        {
          question: 'Can I edit my ad after posting?',
          answer:
            'Yes, you can edit your active listings anytime from your dashboard. Changes will be applied immediately.',
          topic: 'posting',
          difficulty: 'beginner',
          is_active: true,
          display_order: 4,
        },
        {
          question: 'What payment methods do you accept?',
          answer:
            'We accept bank transfers, JazzCash, EasyPaisa, credit cards, and cryptocurrency. Choose the method that works best for you.',
          topic: 'payment',
          difficulty: 'beginner',
          is_active: true,
          display_order: 5,
        },
        {
          question: 'Why was my ad rejected?',
          answer:
            'Ads are rejected if they violate our policy (spam, prohibited items, etc.). Check the rejection reason in your dashboard and repost with corrections.',
          topic: 'moderation',
          difficulty: 'intermediate',
          is_active: true,
          display_order: 6,
        },
        {
          question: 'Can I schedule my ads to go live at a specific time?',
          answer:
            'Yes, when creating or editing an ad, you can set a custom publish date and time. The ad will automatically go live at that moment.',
          topic: 'posting',
          difficulty: 'intermediate',
          is_active: true,
          display_order: 7,
        },
        {
          question: 'How does the featured badge help my listings?',
          answer:
            'Featured listings appear at the top of search results and category pages, getting more visibility. Available with Standard and Premium packages.',
          topic: 'features',
          difficulty: 'intermediate',
          is_active: true,
          display_order: 8,
        },
        {
          question: 'Is there a safe way to meet buyers?',
          answer:
            'Always meet in public places during daylight hours. Verify buyer details, tell someone where you are, and never share your home address initially.',
          topic: 'safety',
          difficulty: 'intermediate',
          is_active: true,
          display_order: 9,
        },
        {
          question: 'Can I integrate AdFlow with my business system?',
          answer:
            'Yes, Enterprise package includes API access for custom integrations. Contact our support team to set up your API credentials.',
          topic: 'features',
          difficulty: 'advanced',
          is_active: true,
          display_order: 10,
        },
      ],
      { skipValidation: false }
    );
    console.log(`✅ Seeded ${questions.length} learning questions`);

    console.log('\n✨ Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error.message);
    process.exit(1);
  }
};

seedDatabase();
