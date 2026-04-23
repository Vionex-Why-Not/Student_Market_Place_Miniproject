const Product  = require("../models/Product");
const { uploadToCloudinary, deleteFromCloudinary } = require("../config/cloudinary");

const norm = p => ({ ...p, id: p._id,
  condition_type: p.conditionType, seller_name: p.sellerName,
  seller_email: p.sellerEmail, seller_id: p.seller });

exports.getProducts = async (req, res, next) => {
  try {
    const { search, category } = req.query;
    const filter = {};
    if (category && category !== "all") filter.category = category;
    if (search) filter.$text = { $search: search };
    const products = await Product.find(filter).sort({ createdAt: -1 }).lean();
    res.json(products.map(p => norm(p)));
  } catch (err) { next(err); }
};

exports.getProduct = async (req, res, next) => {
  try {
    const p = await Product.findById(req.params.id).lean();
    if (!p) return res.status(404).json({ success: false, error: "Product not found" });
    res.json(norm(p));
  } catch (err) { next(err); }
};

exports.getMyProducts = async (req, res, next) => {
  try {
    const uid = req.params.user_id || req.user._id;
    const products = await Product.find({ seller: uid }).sort({ createdAt: -1 }).lean();
    res.json(products.map(p => ({ ...norm(p), item_type: "product" })));
  } catch (err) { next(err); }
};

exports.createProduct = async (req, res, next) => {
  try {
    const { title, price, category, condition_type, description, contact } = req.body;
    const data = {
      title, price, category,
      conditionType: condition_type,
      description, contact,
      seller:      req.user._id,
      sellerName:  req.user.name,
      sellerEmail: req.user.email,
    };
    if (req.file) {
      const { url, public_id } = await uploadToCloudinary(req.file.buffer);
      data.image         = url;
      data.imagePublicId = public_id;
    }
    const product = await Product.create(data);
    res.status(201).json({ success: true, product });
  } catch (err) { next(err); }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, seller: req.user._id });
    if (!product) return res.status(404).json({ success: false, error: "Not found or not authorized" });

    const { title, price, category, condition_type, description, contact, image } = req.body;
    Object.assign(product, { title, price, category, conditionType: condition_type, description, contact });

    if (req.file) {
      await deleteFromCloudinary(product.imagePublicId);
      const { url, public_id } = await uploadToCloudinary(req.file.buffer);
      product.image = url; product.imagePublicId = public_id;
    } else if (image) {
      product.image = image;
    }
    await product.save();
    res.json({ success: true, product });
  } catch (err) { next(err); }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findOneAndDelete({ _id: req.params.id, seller: req.user._id });
    if (!product) return res.status(404).json({ success: false, error: "Not found or not authorized" });
    await deleteFromCloudinary(product.imagePublicId);
    res.json({ success: true });
  } catch (err) { next(err); }
};
