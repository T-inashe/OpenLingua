/**
 * Script to clean up duplicate enrollments before adding unique constraint
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanupDuplicates() {
  console.log('🔍 Finding duplicate enrollments...');
  
  try {
    // Find all enrollments grouped by userId and courseId
    const enrollments = await prisma.courseEnrollment.findMany({
      orderBy: [
        { userId: 'asc' },
        { courseId: 'asc' },
        { createdAt: 'desc' } // Keep the most recent one
      ]
    });

    console.log(`📊 Total enrollments: ${enrollments.length}`);

    const seen = new Map();
    const duplicatesToDelete = [];

    for (const enrollment of enrollments) {
      const key = `${enrollment.userId}-${enrollment.courseId}`;
      
      if (seen.has(key)) {
        // This is a duplicate, mark for deletion
        duplicatesToDelete.push(enrollment.id);
        console.log(`🗑️  Duplicate found: User ${enrollment.userId}, Course ${enrollment.courseId}`);
      } else {
        // First occurrence, keep it
        seen.set(key, enrollment.id);
      }
    }

    console.log(`\n📈 Summary:`);
    console.log(`   Unique enrollments: ${seen.size}`);
    console.log(`   Duplicates to remove: ${duplicatesToDelete.length}`);

    if (duplicatesToDelete.length > 0) {
      console.log('\n🧹 Cleaning up duplicates...');
      
      const result = await prisma.courseEnrollment.deleteMany({
        where: {
          id: {
            in: duplicatesToDelete
          }
        }
      });

      console.log(`✅ Deleted ${result.count} duplicate enrollments`);
    } else {
      console.log('✅ No duplicates found!');
    }

    // Check for duplicate reviews
    console.log('\n🔍 Checking for duplicate reviews...');
    const reviews = await prisma.courseReview.findMany({
      orderBy: [
        { userId: 'asc' },
        { courseId: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    const reviewsSeen = new Map();
    const reviewsToDelete = [];

    for (const review of reviews) {
      const key = `${review.userId}-${review.courseId}`;
      
      if (reviewsSeen.has(key)) {
        reviewsToDelete.push(review.id);
        console.log(`🗑️  Duplicate review: User ${review.userId}, Course ${review.courseId}`);
      } else {
        reviewsSeen.set(key, review.id);
      }
    }

    if (reviewsToDelete.length > 0) {
      console.log(`\n🧹 Cleaning up ${reviewsToDelete.length} duplicate reviews...`);
      
      const result = await prisma.courseReview.deleteMany({
        where: {
          id: {
            in: reviewsToDelete
          }
        }
      });

      console.log(`✅ Deleted ${result.count} duplicate reviews`);
    } else {
      console.log('✅ No duplicate reviews found!');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupDuplicates();
