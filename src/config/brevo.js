import dotenv from "dotenv";

dotenv.config();

if (!process.env.BREVO_API_KEY) {
  console.warn("⚠️ BREVO_API_KEY is missing in environment variables");
}

const brevoConfig = {
  apiKey: process.env.BREVO_API_KEY,
  sender: {
    name: process.env.BREVO_SENDER_NAME || "Curson",
    email: process.env.BREVO_SENDER_EMAIL || "curson.app@gmail.com"
  },
  baseUrl: "https://api.brevo.com/v3"
};

export default brevoConfig;
