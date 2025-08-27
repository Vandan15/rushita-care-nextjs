const { initializeApp, cert } = require("firebase-admin/app")
const { getAuth } = require("firebase-admin/auth")
require("dotenv").config({ path: ".env" })

// Service account configuration from environment variables
const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
}

// Initialize Firebase Admin
const app = initializeApp({
  credential: cert(serviceAccount),
})

const auth = getAuth(app)

async function createAdminUser() {
  try {
    // Change these values to your desired admin credentials
    const adminEmail = "rushita@gmail.com" // Change this to your email
    const adminPassword = "rushita123" // Change this to your desired password

    const userRecord = await auth.createUser({
      email: adminEmail,
      password: adminPassword,
      displayName: "Rushita Patil",
      emailVerified: true,
    })

    console.log("✅ Successfully created admin user!")
    console.log("📧 Email:", userRecord.email)
    console.log("🆔 UID:", userRecord.uid)
    console.log("🔑 Password:", adminPassword)
    console.log("\n🎉 You can now sign in to RushitaCare with these credentials!")

    process.exit(0)
  } catch (error) {
    console.error("❌ Error creating admin user:", error.message)

    if (error.code === "auth/email-already-exists") {
      console.log("💡 This email already exists. Try using a different email or sign in with existing credentials.")
    }

    process.exit(1)
  }
}

// Check if all required environment variables are present
const requiredEnvVars = [
  "FIREBASE_PROJECT_ID",
  "FIREBASE_PRIVATE_KEY_ID",
  "FIREBASE_PRIVATE_KEY",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_CLIENT_ID",
  "FIREBASE_CLIENT_CERT_URL",
]

const missingVars = requiredEnvVars.filter((varName) => !process.env[varName])

if (missingVars.length > 0) {
  console.error("❌ Missing required environment variables:")
  missingVars.forEach((varName) => console.error(`   - ${varName}`))
  console.log("\n💡 Please check your .env.local file and make sure all Firebase service account variables are set.")
  process.exit(1)
}

console.log("🚀 Creating admin user for RushitaCare...")
createAdminUser()
