require("dotenv").config();
const express       = require("express");
const http          = require("http");
const path          = require("path");
const cors          = require("cors");
const helmet        = require("helmet");
const morgan        = require("morgan");
const cookieParser  = require("cookie-parser");
const session       = require("express-session");
const flash         = require("connect-flash");
const rateLimit     = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const { Server }    = require("socket.io");

const connectDB    = require("./config/db");
const { Message }  = require("./models/Commerce");
const { GroupMessage } = require("./models/Community");
const { ChatRequest }  = require("./models/Commerce");

// ── Connect DB ────────────────────────────────────────────────────────────────
connectDB();

// ── Seed default committees once DB is ready ──────────────────────────────────
setTimeout(async () => {
  try {
    const { Committee } = require("./models/Community");
    const count = await Committee.countDocuments();
    if (count === 0) {
      await Committee.insertMany([
        { name: "Coding Club",           description: "Hackathons, coding contests, and workshops.",       category: "Technical",      icon: "💻" },
        { name: "Cultural Committee",    description: "Festivals, dance, music, and drama events.",        category: "Cultural",       icon: "🎭" },
        { name: "NSS",                   description: "Community development and volunteer work.",         category: "Social Service", icon: "🌿" },
        { name: "Sports Club",           description: "Inter-college tournaments and fitness challenges.", category: "Sports",         icon: "⚽" },
        { name: "Photography Club",      description: "Photo walks, editing workshops, exhibitions.",      category: "Arts",           icon: "📷" },
        { name: "Entrepreneurship Cell", description: "Mentoring, funding guidance, pitch competitions.", category: "Technical",      icon: "🚀" },
      ]);
      console.log("✅ Default committees seeded");
    }
  } catch (e) { console.error("Seed error:", e.message); }
}, 3000);

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

// ── View engine ───────────────────────────────────────────────────────────────
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views/pages"));

// ── Security middleware ───────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: "*", credentials: true }));
app.use(mongoSanitize());

// ── Body parsers ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(cookieParser());

// ── Session + Flash ───────────────────────────────────────────────────────────
app.use(session({
  secret:            process.env.SESSION_SECRET || "studxchange_secret",
  resave:            false,
  saveUninitialized: false,
  cookie:            { maxAge: 7 * 24 * 60 * 60 * 1000 },
}));
app.use(flash());

// ── Logger ────────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== "production") app.use(morgan("dev"));

// ── Rate limiting on auth endpoints only ─────────────────────────────────────
app.use(["/api/register", "/api/login", "/admin/login", "/admin/register"],
  rateLimit({ windowMs: 15 * 60 * 1000, max: 50,
    message: { success: false, error: "Too many requests — slow down." } }));

// ── Static files ──────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, "public")));

// ── Global EJS template vars ──────────────────────────────────────────────────
app.use((req, res, next) => {
  res.locals.flash_success = req.flash("success");
  res.locals.flash_error   = req.flash("error");
  next();
});

// ─────────────────────────────────────────────────────────────────────────────
//  ROUTES
//
//  The frontend JS calls these exact paths (no /api prefix for most):
//    /api/register   /api/login      → student auth
//    /admin/login    /admin/register → admin auth
//    /products       /add-product    → marketplace
//    /rent-products  /add-rent       → rentals
//    /committees     /announcements  → committee hub
//    /my-chats/:id   /messages/:id   → chat
//    /wishlist       /send-chat-request etc.
//
//  All routes are mounted at "/" so the paths above work exactly as-is.
// ─────────────────────────────────────────────────────────────────────────────
app.use("/", require("./routes/pages"));       // EJS page renders
app.use("/", require("./routes/auth"));        // /api/register, /api/login, /admin/login
app.use("/", require("./routes/products"));    // /products, /add-product, /rent-products etc.
app.use("/", require("./routes/chat"));        // /wishlist, /my-chats, /messages etc.
app.use("/", require("./routes/community"));   // /committees, /announcements, /notifications etc.

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  if (req.xhr || req.path.startsWith("/api") || req.path.includes("."))
    return res.status(404).json({ success: false, error: "Not found" });
  res.status(404).render("404", { title: "Page Not Found" });
});

// ── Central error handler ─────────────────────────────────────────────────────
app.use(require("./middleware/errorHandler"));

// ─────────────────────────────────────────────────────────────────────────────
//  SOCKET.IO — real-time chat
// ─────────────────────────────────────────────────────────────────────────────
io.on("connection", socket => {

  // ── 1-to-1 chat ──────────────────────────────────────────────────────────
  socket.on("join_room",  id => socket.join(`room_${id}`));
  socket.on("leave_room", id => socket.leave(`room_${id}`));

  socket.on("send_message", async data => {
    const { request_id, sender_id, sender_name, message } = data;
    try {
      const chatReq = await ChatRequest.findById(request_id);
      if (!chatReq) return;
      const receiver_id = String(chatReq.sender) === String(sender_id)
        ? chatReq.receiver : chatReq.sender;
      const msg = await Message.create({
        chatRequest: request_id, sender: sender_id,
        senderName:  sender_name, receiver: receiver_id, message,
      });
      io.to(`room_${request_id}`).emit("receive_message", {
        id: msg._id, request_id, sender_id, sender_name, message,
        time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }),
        created_at: msg.createdAt,
      });
    } catch (e) { console.error("Socket msg error:", e.message); }
  });

  // Typing events — only emitted to OTHER people in room (not the sender)
  socket.on("typing",      d => socket.to(`room_${d.request_id}`).emit("typing", d));
  socket.on("stop_typing", d => socket.to(`room_${d.request_id}`).emit("stop_typing"));

  // ── Committee group chat ──────────────────────────────────────────────────
  socket.on("join_group",  id => socket.join(`group_${id}`));
  socket.on("leave_group", id => socket.leave(`group_${id}`));

  socket.on("send_group_msg", async data => {
    const { committee_id, sender_id, sender_name, message } = data;
    try {
      const msg = await GroupMessage.create({
        committee: committee_id, sender: sender_id, senderName: sender_name, message,
      });
      io.to(`group_${committee_id}`).emit("group_message", {
        id: msg._id, committee_id, sender_id, sender_name, message, sent_at: msg.createdAt,
      });
    } catch (e) { console.error("Socket group msg:", e.message); }
  });
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🚀  StudXchange  →  http://localhost:${PORT}`);
  console.log(`    ENV: ${process.env.NODE_ENV || "development"}\n`);
});
