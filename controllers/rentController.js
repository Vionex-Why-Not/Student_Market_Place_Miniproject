const RentItem = require("../models/RentItem");
const { uploadToCloudinary, deleteFromCloudinary } = require("../config/cloudinary");

const norm = r => ({ ...r, id: r._id,
  rent_per_day: r.rentPerDay, is_available: r.isAvailable,
  seller_name: r.sellerName, seller_id: r.seller });

exports.getRentItems = async (req, res, next) => {
  try {
    const { search, category } = req.query;
    const filter = {};
    if (category && category !== "all") filter.category = category;
    if (search) filter.$text = { $search: search };
    const items = await RentItem.find(filter).sort({ createdAt: -1 }).lean();
    res.json(items.map(norm));
  } catch (err) { next(err); }
};

exports.getRentItem = async (req, res, next) => {
  try {
    const item = await RentItem.findById(req.params.id).lean();
    if (!item) return res.status(404).json({ success: false, error: "Item not found" });
    res.json(norm(item));
  } catch (err) { next(err); }
};

exports.getMyRentItems = async (req, res, next) => {
  try {
    const uid = req.params.user_id || req.user._id;
    const items = await RentItem.find({ seller: uid }).sort({ createdAt: -1 }).lean();
    res.json(items.map(i => ({ ...norm(i), item_type: "rent" })));
  } catch (err) { next(err); }
};

exports.createRentItem = async (req, res, next) => {
  try {
    const { title, category, description, contact, rent_per_day, deposit } = req.body;
    const data = {
      title, category, description, contact,
      rentPerDay:  Number(rent_per_day),
      deposit:     Number(deposit) || 0,
      seller:      req.user._id,
      sellerName:  req.user.name,
      sellerEmail: req.user.email,
    };
    if (req.file) {
      const { url, public_id } = await uploadToCloudinary(req.file.buffer);
      data.image = url; data.imagePublicId = public_id;
    }
    const item = await RentItem.create(data);
    res.status(201).json({ success: true, item });
  } catch (err) { next(err); }
};

exports.updateRentItem = async (req, res, next) => {
  try {
    const item = await RentItem.findOne({ _id: req.params.id, seller: req.user._id });
    if (!item) return res.status(404).json({ success: false, error: "Not found or not authorized" });

    const { title, category, description, contact, rent_per_day, deposit, image } = req.body;
    Object.assign(item, { title, category, description, contact,
      rentPerDay: Number(rent_per_day), deposit: Number(deposit) || 0 });

    if (req.file) {
      await deleteFromCloudinary(item.imagePublicId);
      const { url, public_id } = await uploadToCloudinary(req.file.buffer);
      item.image = url; item.imagePublicId = public_id;
    } else if (image) {
      item.image = image;
    }
    await item.save();
    res.json({ success: true, item });
  } catch (err) { next(err); }
};

exports.deleteRentItem = async (req, res, next) => {
  try {
    const item = await RentItem.findOneAndDelete({ _id: req.params.id, seller: req.user._id });
    if (!item) return res.status(404).json({ success: false, error: "Not found or not authorized" });
    await deleteFromCloudinary(item.imagePublicId);
    res.json({ success: true });
  } catch (err) { next(err); }
};
