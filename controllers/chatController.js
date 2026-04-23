const { Wishlist, ChatRequest, Message, RentRequest } = require("../models/Commerce");
const { Notification } = require("../models/Community");
const Product  = require("../models/Product");
const RentItem = require("../models/RentItem");
const User     = require("../models/User");
const mongoose = require("mongoose");

// Guard — return 400 if id is missing or not a valid ObjectId
function validId(id) {
  return id && id !== "undefined" && id !== "null" && mongoose.Types.ObjectId.isValid(id);
}

// ── MY LISTINGS ───────────────────────────────────────────────────────────────
exports.getMyListings = async (req, res, next) => {
  try {
    const uid = req.params.user_id;
    if (!validId(uid)) return res.status(400).json({ success: false, error: "Invalid user id" });
    const [products, rentItems] = await Promise.all([
      Product.find({ seller: uid }).sort({ createdAt: -1 }).lean(),
      RentItem.find({ seller: uid }).sort({ createdAt: -1 }).lean(),
    ]);
    const all = [
      ...products.map(p  => ({ ...p, id: p._id, item_type:"product", condition_type:p.conditionType, seller_name:p.sellerName, seller_id:p.seller })),
      ...rentItems.map(r => ({ ...r, id: r._id, item_type:"rent",    rent_per_day:r.rentPerDay,       seller_name:r.sellerName, seller_id:r.seller })),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(all);
  } catch (err) { next(err); }
};

// ── WISHLIST ──────────────────────────────────────────────────────────────────
exports.addToWishlist = async (req, res, next) => {
  try {
    const { item_id, item_type } = req.body;
    if (!validId(item_id)) return res.status(400).json({ success: false, error: "Invalid item id" });
    await Wishlist.create({
      user: req.user._id,
      itemId: item_id,
      itemType: item_type === "rent" ? "rent" : "product",
    });
    res.json({ success: true, inserted: true });
  } catch (err) {
    if (err.code === 11000) return res.json({ success: true, inserted: false });
    next(err);
  }
};

exports.getWishlist = async (req, res, next) => {
  try {
    const uid = req.params.user_id;
    if (!validId(uid)) return res.status(400).json({ success: false, error: "Invalid user id" });
    const entries  = await Wishlist.find({ user: uid }).lean();
    const pIds     = entries.filter(e => e.itemType === "product").map(e => e.itemId);
    const rIds     = entries.filter(e => e.itemType === "rent").map(e => e.itemId);
    const [ps, rs] = await Promise.all([
      Product.find({ _id: { $in: pIds } }).lean(),
      RentItem.find({ _id: { $in: rIds } }).lean(),
    ]);
    res.json([
      ...ps.map(p  => ({ ...p, id:p._id, item_type:"product", item_id:p._id, seller_name:p.sellerName })),
      ...rs.map(r  => ({ ...r, id:r._id, item_type:"rent",    item_id:r._id, seller_name:r.sellerName, rent_per_day:r.rentPerDay })),
    ]);
  } catch (err) { next(err); }
};

exports.removeFromWishlist = async (req, res, next) => {
  try {
    const { item_id, item_type } = req.body;
    await Wishlist.deleteOne({ user: req.user._id, itemId: item_id, itemType: item_type || "product" });
    res.json({ success: true });
  } catch (err) { next(err); }
};

// ── CHAT REQUESTS ─────────────────────────────────────────────────────────────
exports.sendChatRequest = async (req, res, next) => {
  try {
    const { sender_id, receiver_id, product_id } = req.body;
    const existing = await ChatRequest.findOne({ sender: sender_id, receiver: receiver_id, product: product_id, requestType: "buy" });
    if (existing) return res.json({ success: false, error: "Request already sent" });
    await ChatRequest.create({ sender: sender_id, receiver: receiver_id, product: product_id, requestType: "buy" });
    res.json({ success: true });
  } catch (err) { next(err); }
};

exports.getChatStatus = async (req, res, next) => {
  try {
    const { sender, receiver, product } = req.params;
    if (!validId(sender) || !validId(receiver) || !validId(product))
      return res.json({ status: "none" });
    const r = await ChatRequest.findOne({ sender, receiver, product, requestType: "buy" });
    res.json(r ? { status: r.status, request_id: r._id } : { status: "none" });
  } catch (err) { next(err); }
};

exports.getRequests = async (req, res, next) => {
  try {
    const sid = req.params.seller_id;
    if (!validId(sid)) return res.json([]);
    const reqs = await ChatRequest.find({ receiver: sid })
      .populate("sender", "name email")
      .populate("product")
      .populate({ path: "rentRequest", populate: { path: "rentItem", model: "RentItem" } })
      .sort({ createdAt: -1 }).lean();

    res.json(reqs.map(r => ({
      ...r, id: r._id,
      sender_id:     r.sender?._id,
      receiver_id:   r.receiver,
      product_id:    r.product?._id,
      buyer_name:    r.sender?.name,
      buyer_email:   r.sender?.email,
      product_title: r.product?.title || r.rentRequest?.rentItem?.title || "Item",
      product_image: r.product?.image || r.rentRequest?.rentItem?.image || "",
      product_price: r.product?.price || r.rentRequest?.rentItem?.rentPerDay,
      request_type:  r.requestType,
      start_date:    r.rentRequest?.startDate,
      end_date:      r.rentRequest?.endDate,
      total_cost:    r.rentRequest?.totalCost,
      rent_message:  r.rentRequest?.message,
      rent_per_day:  r.rentRequest?.rentItem?.rentPerDay,
      chat_request_id: r._id,
    })));
  } catch (err) { next(err); }
};

exports.acceptChat = async (req, res, next) => {
  try {
    await ChatRequest.findByIdAndUpdate(req.body.request_id, { status: "accepted" });
    res.json({ success: true });
  } catch (err) { next(err); }
};

exports.rejectChat = async (req, res, next) => {
  try {
    await ChatRequest.findByIdAndUpdate(req.body.request_id, { status: "rejected" });
    res.json({ success: true });
  } catch (err) { next(err); }
};

exports.getMyChats = async (req, res, next) => {
  try {
    const uid = req.params.user_id;
    if (!validId(uid)) return res.json([]);
    const chats = await ChatRequest.find({ status: "accepted", $or: [{ sender: uid }, { receiver: uid }] })
      .populate("sender",   "name _id")
      .populate("receiver", "name _id")
      .populate("product")
      .populate({ path: "rentRequest", populate: { path: "rentItem", model: "RentItem" } })
      .sort({ createdAt: -1 }).lean();

    res.json(chats.map(c => ({
      ...c, id: c._id,
      sender_id:     c.sender._id,   receiver_id:  c.receiver._id,
      buyer_name:    c.sender.name,  seller_name:  c.receiver.name,
      product_title: c.product?.title || c.rentRequest?.rentItem?.title || "Item",
      product_image: c.product?.image || c.rentRequest?.rentItem?.image || "",
      product_price: c.product?.price || c.rentRequest?.rentItem?.rentPerDay,
      request_type:  c.requestType,
    })));
  } catch (err) { next(err); }
};

exports.getMessages = async (req, res, next) => {
  try {
    const msgs = await Message.find({ chatRequest: req.params.request_id })
      .sort({ createdAt: 1 }).lean();
    res.json(msgs.map(m => ({ ...m, id: m._id, sender_name: m.senderName })));
  } catch (err) { next(err); }
};

// ── RENT REQUESTS ─────────────────────────────────────────────────────────────
exports.sendRentRequest = async (req, res, next) => {
  try {
    const { renter_id, owner_id, product_id, start_date, end_date, total_cost, message } = req.body;
    if (!validId(renter_id) || !validId(owner_id) || !validId(product_id))
      return res.status(400).json({ success: false, error: "Invalid IDs" });

    const existing = await RentRequest.findOne({ renter: renter_id, rentItem: product_id, status: "pending" });
    if (existing) return res.json({ success: false, error: "You already have a pending request for this item" });

    const rentReq = await RentRequest.create({
      renter: renter_id, owner: owner_id, rentItem: product_id,
      startDate: start_date, endDate: end_date,
      totalCost: total_cost || 0, message: message || "",
    });
    const chatReq = await ChatRequest.create({
      sender: renter_id, receiver: owner_id, product: product_id,
      status: "pending", requestType: "rent", rentRequest: rentReq._id,
    });
    rentReq.chatRequest = chatReq._id;
    await rentReq.save();

    const [item, renter] = await Promise.all([
      RentItem.findById(product_id).lean(),
      User.findById(renter_id).lean(),
    ]);
    await Notification.create({
      user: owner_id, icon: "🔄", title: "New Rent Request!",
      body: `${renter?.name} wants to rent "${item?.title}" (${start_date} → ${end_date}). Total: ₹${total_cost}`,
    });
    res.json({ success: true });
  } catch (err) { next(err); }
};

exports.getMyRentRequests = async (req, res, next) => {
  try {
    const oid = req.params.owner_id;
    if (!validId(oid)) return res.json([]);
    const reqs = await RentRequest.find({ owner: oid })
      .populate("renter", "name email")
      .populate("rentItem")
      .sort({ createdAt: -1 }).lean();
    res.json(reqs.map(r => ({
      ...r, id: r._id,
      renter_name:  r.renter?.name,    renter_email: r.renter?.email,
      item_title:   r.rentItem?.title,  item_image:   r.rentItem?.image,
      rent_per_day: r.rentItem?.rentPerDay,
      start_date:   r.startDate,        end_date:     r.endDate,
      total_cost:   r.totalCost,
    })));
  } catch (err) { next(err); }
};

exports.getRentRequestStatus = async (req, res, next) => {
  try {
    const { renter_id, product_id } = req.params;
    if (!validId(renter_id) || !validId(product_id)) return res.json({ status: "none" });
    const rr = await RentRequest.findOne({ renter: renter_id, rentItem: product_id }).sort({ createdAt: -1 });
    res.json(rr ? { status: rr.status, request: rr } : { status: "none" });
  } catch (err) { next(err); }
};

exports.acceptRentRequest = async (req, res, next) => {
  try {
    const rr = await RentRequest.findById(req.body.rent_request_id).populate("rentItem");
    if (!rr) return res.status(404).json({ success: false, error: "Request not found" });
    rr.status = "accepted";
    if (rr.chatRequest) await ChatRequest.findByIdAndUpdate(rr.chatRequest, { status: "accepted" });
    await rr.save();
    await Notification.create({
      user: rr.renter, icon: "✅", title: "Rent Request Accepted! 🎉",
      body: `Your request for "${rr.rentItem?.title}" was accepted!`,
    });
    res.json({ success: true, chat_request_id: rr.chatRequest });
  } catch (err) { next(err); }
};

exports.rejectRentRequest = async (req, res, next) => {
  try {
    const rr = await RentRequest.findById(req.body.rent_request_id).populate("rentItem");
    if (!rr) return res.status(404).json({ success: false, error: "Request not found" });
    rr.status = "rejected";
    if (rr.chatRequest) await ChatRequest.findByIdAndUpdate(rr.chatRequest, { status: "rejected" });
    await rr.save();
    await Notification.create({
      user: rr.renter, icon: "❌", title: "Rent Request Rejected",
      body: `Your request for "${rr.rentItem?.title}" was not approved.`,
    });
    res.json({ success: true });
  } catch (err) { next(err); }
};
