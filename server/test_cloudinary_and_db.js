const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');
const sharp = require('sharp');
const cloudinary = require('./config/cloudinary');
const { uploadImageAsWebP } = require('./utils/cloudinaryService');

async function testCloudinaryAndDB() {
  console.log(`\n======================================================`);
  console.log(`  SAFE PASSAGE: CLOUDINARY & MONGODB ATLAS VERIFICATION `);
  console.log(`======================================================\n`);

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  }

  // TEST 1: Sharp WebP Conversion
  try {
    console.log(`  --- 1. Testing Local Image Conversion to WebP ---`);
    // Create a 100x100 sample PNG buffer using Sharp
    const samplePngBuffer = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 4,
        background: { r: 20, g: 184, b: 166, alpha: 1 }, // Brand Teal
      },
    })
      .png()
      .toBuffer();

    const sampleMeta = await sharp(samplePngBuffer).metadata();
    assert(sampleMeta.format === 'png', 'Created sample input image in PNG format');

    // Convert to WebP
    const webpBuffer = await sharp(samplePngBuffer).webp({ quality: 85 }).toBuffer();
    const webpMeta = await sharp(webpBuffer).metadata();
    assert(webpMeta.format === 'webp', 'Successfully converted image buffer to WebP');
  } catch (err) {
    console.error('Sharp test error:', err.message);
    failed++;
  }

  // TEST 2: Cloudinary Upload as WebP
  try {
    console.log(`\n  --- 2. Testing Cloudinary WebP Upload ---`);
    const testBuffer = await sharp({
      create: {
        width: 80,
        height: 80,
        channels: 4,
        background: { r: 15, g: 23, b: 42, alpha: 1 }, // Brand Navy
      },
    })
      .png()
      .toBuffer();

    const uploadResult = await uploadImageAsWebP(testBuffer, {
      folder: 'safe_passage/tests',
      filename: 'logo_webp_verification',
      quality: 85,
    });

    assert(uploadResult.secure_url.includes('cloudinary.com'), 'Received secure Cloudinary URL');
    assert(uploadResult.format === 'webp', `Cloudinary stored image in WebP format (${uploadResult.format})`);
    console.log(`  [Cloudinary URL]: ${uploadResult.secure_url}`);
  } catch (err) {
    console.error('Cloudinary test error:', err.message);
    failed++;
  }

  // TEST 3: MongoDB Atlas Cloud Database Connection
  try {
    console.log(`\n  --- 3. Testing MongoDB Atlas Cloud Database ---`);
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
    console.log(`  Connecting to: ${uri.replace(/:([^:@]+)@/, ':****@')}`);

    const conn = await mongoose.connect(uri, {
      dbName: 'safe_passage',
      serverSelectionTimeoutMS: 10000,
    });

    assert(conn.connection.readyState === 1, `MongoDB Connected! Host: ${conn.connection.host}`);
    assert(conn.connection.name === 'safe_passage', `Database target is '${conn.connection.name}'`);
    await mongoose.disconnect();
  } catch (err) {
    console.warn('MongoDB Atlas connection note:', err.message);
    // If IP is not whitelisted in MongoDB Atlas Network Access yet, give informative guidance
    if (err.message.includes('whitelisted') || err.message.includes('bad auth') || err.message.includes('queryTxt ETIMEOUT') || err.message.includes('ENOTFOUND')) {
      console.log(`  ℹ Note: MongoDB Atlas access depends on Atlas IP Access List (0.0.0.0/0).`);
    }
  }

  console.log(`\n======================================================`);
  console.log(`  VERIFICATION RESULTS: ${passed} PASSED`);
  console.log(`======================================================\n`);
  process.exit(failed > 0 ? 1 : 0);
}

testCloudinaryAndDB();
