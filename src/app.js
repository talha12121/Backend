// Express framework import kar rahe hain (server banane ke liye)
import express from "express";

// Cookies read / write karne ke liye
import cookieParser from "cookie-parser";

// CORS handle karne ke liye (frontend se request allow karna)
import cors from "cors";

// Express app create kar rahe hain
const app = express();

// JSON data allow kar rahe hain (request body)
// limit: large data (images, etc) ke liye
app.use(
  express.json({
    limit: "50mb",
  })
);

// URL encoded data allow kar rahe hain (forms ke liye)
app.use(
  express.urlencoded({
    limit: "50mb",
    extended: true, // nested objects allow karta hai
  })
);

// Cookies ko easily access karne ke liye
app.use(cookieParser());

// "public" folder ke static files serve karne ke liye
// (images, css, uploads etc)
app.use(express.static("public"));

// CORS enable kar rahe hain
// origin: "*" ka matlab → sab origins se request allow
app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);

export default app;
