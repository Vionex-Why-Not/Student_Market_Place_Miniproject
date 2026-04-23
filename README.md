# StudXchange — MVC (MongoDB + Cloudinary + EJS)

## Project Structure
```
studxchange/
├── server.js                 ← Entry point
├── package.json
├── .env.example              ← Copy to .env and fill in values
│
├── config/
│   ├── db.js                 ← MongoDB Atlas connection
│   └── cloudinary.js         ← Cloudinary + Multer image upload
│
├── models/
│   ├── User.js               ← Student accounts (bcrypt passwords)
│   ├── Admin.js              ← Committee admins
│   ├── Product.js            ← Marketplace listings
│   ├── RentItem.js           ← Rental listings
│   ├── Commerce.js           ← Wishlist, ChatRequest, Message, RentRequest
│   └── Community.js          ← Committee, Events, Announcements, Notifications
│
├── controllers/
│   ├── authController.js     ← Register, login, admin login, update profile
│   ├── productController.js  ← CRUD for products
│   ├── rentController.js     ← CRUD for rent items
│   ├── chatController.js     ← Wishlist, chat requests, messages, rent requests
│   └── communityController.js← Committees, events, announcements, notifications
│
├── routes/
│   ├── pages.js              ← EJS page routes (GET /, /marketplace, etc.)
│   ├── auth.js               ← POST /api/auth/register, /login, /admin/login
│   ├── products.js           ← /api/products, /api/add-product, etc.
│   ├── chat.js               ← /api/wishlist, /api/send-chat-request, etc.
│   └── community.js          ← /api/committees, /api/committee-events, etc.
│
├── middleware/
│   ├── auth.js               ← JWT protect / adminOnly / optionalAuth
│   └── errorHandler.js       ← Central error handler (JSON + EJS)
│
└── views/
    ├── partials/
    │   ├── head.ejs           ← <html><head>...</head><body>
    │   └── foot.ejs           ← </body></html>
    └── pages/
        ├── index.ejs
        ├── marketplace.ejs
        ├── buy.ejs
        ├── sell.ejs
        ├── rent.ejs
        ├── rentpage.ejs
        ├── chat.ejs
        ├── committee.ejs
        ├── myprofile.ejs
        ├── login.ejs
        ├── admin.ejs
        ├── error.ejs
        └── 404.ejs
```

---

## STEP-BY-STEP SETUP

### 1. Install Node.js
Download from https://nodejs.org (LTS version 18 or 20).

---

### 2. Get MongoDB Atlas (free)
1. Go to https://cloud.mongodb.com and create a free account
2. Create a free **M0** cluster (takes ~2 minutes)
3. Click **Connect** → **Drivers** → copy the connection string
4. It looks like: `mongodb+srv://myuser:mypass@cluster0.abc12.mongodb.net/?retryWrites=true&w=majority`
5. Add your database name at the end: `.../studxchange?retryWrites...`

Also go to **Network Access** → Add IP address → **Allow from anywhere** (0.0.0.0/0) for development.

---

### 3. Get Cloudinary (free)
1. Go to https://cloudinary.com and create a free account
2. From the **Dashboard**, copy:
   - Cloud Name
   - API Key
   - API Secret

---

### 4. Create your .env file
Copy `.env.example` to `.env` and fill in:
```
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/studxchange?retryWrites=true&w=majority
JWT_SECRET=any_long_random_string_at_least_32_characters
JWT_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
SESSION_SECRET=another_long_random_string
ADMIN_SECRET_KEY=STUDXCHANGE_ADMIN_2026
ALLOWED_EMAIL_DOMAIN=vcet.edu.in
CLIENT_ORIGIN=http://localhost:5000
```

---

### 5. Install dependencies
```bash
npm install
```

---

### 6. Start the server
```bash
# Development (auto-restart on file changes)
npm run dev

# Production
npm start
```

You should see:
```
✅ MongoDB Connected: cluster0.abc12.mongodb.net
✅ Default committees seeded

🚀  StudXchange  →  http://localhost:5000
    ENV: development
```

---

### 7. Open in browser
**http://localhost:5000**

---

## ALL PAGES
| URL | Page |
|---|---|
| / | Home |
| /marketplace | Browse & buy items |
| /buy?id=... | Product detail |
| /sell | List item for sale |
| /rentpage | Browse rentals |
| /rent | List item for rent |
| /chat | Real-time messaging |
| /committee | Committee hub |
| /myprofile | Your profile |
| /login | Sign in / Register |
| /admin | Admin portal |

---

## ALL API ENDPOINTS
All endpoints are prefixed with `/api`.

### Auth — `/api/auth`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | /api/auth/register | — | Register student |
| POST | /api/auth/login | — | Login student |
| POST | /api/auth/admin/register | — | Register admin (needs secret key) |
| POST | /api/auth/admin/login | — | Login admin |
| PUT | /api/auth/profile | JWT | Update profile |

### Products — `/api`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | /api/products | — | Get all products |
| GET | /api/product/:id | — | Get single product |
| GET | /api/my-products/:user_id | — | Get user's products |
| POST | /api/add-product | JWT | Create product (image upload) |
| PUT | /api/update-product/:id | JWT | Update product |
| DELETE | /api/delete-product/:id | JWT | Delete product |
| GET | /api/rent-products | — | Get all rent items |
| GET | /api/rent-product/:id | — | Get single rent item |
| GET | /api/my-rent-items/:user_id | — | Get user's rent items |
| POST | /api/add-rent | JWT | Create rent item (image upload) |
| PUT | /api/update-rent/:id | JWT | Update rent item |
| DELETE | /api/delete-rent/:id | JWT | Delete rent item |

### Chat & Commerce — `/api`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | /api/my-listings/:user_id | — | Get all listings (products + rent) |
| POST | /api/wishlist | JWT | Add to wishlist |
| GET | /api/wishlist/:user_id | — | Get wishlist |
| DELETE | /api/wishlist | JWT | Remove from wishlist |
| POST | /api/send-chat-request | JWT | Send buy chat request |
| GET | /api/chat-status/:s/:r/:p | — | Check chat request status |
| GET | /api/get-requests/:seller_id | — | Get incoming requests |
| POST | /api/accept-chat | JWT | Accept chat request |
| POST | /api/reject-chat | JWT | Reject chat request |
| GET | /api/my-chats/:user_id | — | Get accepted chats |
| GET | /api/messages/:request_id | — | Get chat messages |
| POST | /api/send-rent-request | JWT | Send rent request |
| GET | /api/my-rent-requests/:owner_id | — | Get rent requests |
| POST | /api/accept-rent-request | JWT | Accept rent request |
| POST | /api/reject-rent-request | JWT | Reject rent request |

### Community — `/api`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | /api/committees | — | Get all committees |
| POST | /api/committees | Admin | Create committee |
| DELETE | /api/committees/:id | Admin | Delete committee |
| POST | /api/committees/:id/join | JWT | Request to join |
| GET | /api/committees/:id/membership/:uid | — | Check membership status |
| GET | /api/committees/:id/members | JWT | Get committee members |
| POST | /api/committees/:id/members/:uid/approve | Admin | Approve member |
| POST | /api/committees/:id/members/:uid/reject | Admin | Reject member |
| GET | /api/committee-requests/pending | Admin | Get all pending requests |
| GET | /api/my-committees/:user_id | — | Get my committees |
| GET | /api/committee-events | — | Get all events |
| POST | /api/committee-events | Admin | Create event |
| DELETE | /api/committee-events/:id | Admin | Delete event |
| POST | /api/committee-events/:id/rsvp | JWT | Register for event |
| GET | /api/committee-events/:id/rsvp/:uid | — | Check RSVP status |
| GET | /api/announcements | — | Get all announcements |
| POST | /api/announcements | Admin | Create announcement |
| DELETE | /api/announcements/:id | Admin | Delete announcement |
| GET | /api/committees/:id/messages | — | Get group messages |
| POST | /api/committees/:id/messages | JWT | Post group message |
| GET | /api/notifications/:user_id | — | Get notifications |
| POST | /api/notifications/read-all/:uid | JWT | Mark all as read |
| GET | /api/notifications/unread-count/:uid | — | Get unread count |

---

## COMMON ERRORS & FIXES

### ❌ MongoServerError: bad auth
**Fix:** Your MONGO_URI username or password is wrong. Re-copy from Atlas.

### ❌ ECONNREFUSED or connection timeout
**Fix:** Go to Atlas → Network Access → Add 0.0.0.0/0

### ❌ Cannot find module 'bcryptjs'
**Fix:** Run `npm install` again.

### ❌ Images not uploading
**Fix:** Check CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in .env

### ❌ Admin login fails
**Fix:** Go to /admin → Register Admin. Use key from ADMIN_SECRET_KEY in your .env

### ❌ "Only @vcet.edu.in email allowed"
**Fix:** Change ALLOWED_EMAIL_DOMAIN=vcet.edu.in to your actual domain in .env

---

## DEPLOY TO RENDER (free)
1. Push this folder to a GitHub repo
2. Go to https://render.com → New Web Service → Connect repo
3. Build command: `npm install`
4. Start command: `node server.js`
5. Add all .env variables in Render's Environment section
6. Change CLIENT_ORIGIN to your Render URL (e.g. https://studxchange.onrender.com)
7. Deploy!

## DEPLOY TO RAILWAY (free)
1. Push to GitHub
2. Go to https://railway.app → New Project → Deploy from GitHub
3. Add environment variables
4. Railway auto-detects Node.js and deploys

