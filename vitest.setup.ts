// Load .env files
import 'dotenv/config'

// Tests must never touch development data: point Payload at the dedicated test database.
if (process.env.TEST_DATABASE_URI) {
  process.env.DATABASE_URI = process.env.TEST_DATABASE_URI
}
