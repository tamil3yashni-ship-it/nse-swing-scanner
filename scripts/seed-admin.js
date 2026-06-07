/**
 * Run this script once to create the admin user in Firebase.
 * Usage: node scripts/seed-admin.js
 *
 * Requires: Firebase Admin SDK + service account key
 * 1. Download service account key from Firebase Console
 * 2. Save as scripts/serviceAccountKey.json
 * 3. npm install firebase-admin
 * 4. node scripts/seed-admin.js
 */

const admin = require('firebase-admin')
const serviceAccount = require('./serviceAccountKey.json')

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
})

const auth = admin.auth()
const db = admin.firestore()

async function createAdmin() {
  const adminEmail = 'admin@herbacoach.com'
  const adminPassword = 'admin123'
  const adminName = 'Coach Admin'

  try {
    let userRecord
    try {
      userRecord = await auth.getUserByEmail(adminEmail)
      console.log('Admin user already exists:', userRecord.uid)
    } catch {
      userRecord = await auth.createUser({
        email: adminEmail,
        password: adminPassword,
        displayName: adminName,
      })
      console.log('Admin user created:', userRecord.uid)
    }

    await db.collection('users').doc(userRecord.uid).set({
      email: adminEmail,
      fullName: adminName,
      phone: '+919876543210',
      age: 30,
      height: 170,
      startWeight: 70,
      currentWeight: 70,
      targetWeight: 65,
      joinDate: new Date().toISOString().split('T')[0],
      isAdmin: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true })

    console.log('Admin profile set in Firestore')
    console.log('Admin credentials:')
    console.log('  Email:', adminEmail)
    console.log('  Password:', adminPassword)
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    process.exit(0)
  }
}

createAdmin()
