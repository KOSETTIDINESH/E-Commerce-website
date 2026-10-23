const { v4: uuidv4 } = require('uuid');
const db = require('../db');

// In-memory variant index for fast O(1) group lookup
let variantIndex = null;
let lastProductCache = null;
let lastProductCacheTime = 0;

function getVariantIndex() {
  if (variantIndex) return variantIndex;
  variantIndex = new Map();
  const allVariants = db.product_variants.data;
  for (let i = 0; i < allVariants.length; i++) {
    const v = allVariants[i];
    if (!variantIndex.has(v.product_id)) {
      variantIndex.set(v.product_id, []);
    }
    variantIndex.get(v.product_id).push(v);
  }
  return variantIndex;
}

function invalidateVariantIndex() {
  variantIndex = null;
  lastProductCache = null;
}

function attachVariantsToProduct(product) {
  const index = getVariantIndex();
  const variants = index.get(product.id) || [];
  
  let totalStock = 0;
  const sizesSet = new Set();
  const colors = [];
  const colorNamesSet = new Set();

  for (let i = 0; i < variants.length; i++) {
    const v = variants[i];
    totalStock += v.stock_quantity || 0;
    sizesSet.add(v.size);
    if (!colorNamesSet.has(v.color_name)) {
      colorNamesSet.add(v.color_name);
      colors.push({ name: v.color_name, code: v.color_code });
    }
  }

  return {
    ...product,
    total_stock: totalStock,
    is_in_stock: totalStock > 0,
    available_sizes: Array.from(sizesSet),
    available_colors: colors,
    variants
  };
}

exports.getAllProducts = async (req, res) => {
  try {
    const { category, gender, search, sort, featured, newArrivals, minPrice, maxPrice } = req.query;

    let products = db.products.find(p => p.is_active !== false);

    // Filter by category
    if (category && category !== 'all') {
      if (category === 'men') {
        products = products.filter(p => p.gender === 'men' || p.gender === 'unisex');
      } else if (category === 'women') {
        products = products.filter(p => p.gender === 'women' || p.gender === 'unisex');
      } else if (category === 'anime') {
        products = products.filter(p => p.category === 'anime');
      } else if (category === 'new-arrivals') {
        products = products.filter(p => p.is_new_arrival);
      } else {
        products = products.filter(p => p.category === category);
      }
    }

    if (gender) {
      products = products.filter(p => p.gender === gender || p.gender === 'unisex');
    }

    if (featured === 'true') {
      products = products.filter(p => p.is_featured);
    }

    if (newArrivals === 'true') {
      products = products.filter(p => p.is_new_arrival);
    }

    // Search query filter
    if (search) {
      const q = search.toLowerCase().trim();
      products = products.filter(p => 
        p.name.toLowerCase().includes(q) || 
        (p.description && p.description.toLowerCase().includes(q)) ||
        p.category.toLowerCase().includes(q)
      );
    }

    // Price range filter
    if (minPrice) {
      products = products.filter(p => p.price >= Number(minPrice));
    }
    if (maxPrice) {
      products = products.filter(p => p.price <= Number(maxPrice));
    }

    // Map variants using fast O(1) index
    let enriched = products.map(attachVariantsToProduct);

    // Sorting
    if (sort === 'price-low') {
      enriched.sort((a, b) => a.price - b.price);
    } else if (sort === 'price-high') {
      enriched.sort((a, b) => b.price - a.price);
    } else if (sort === 'rating') {
      enriched.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else {
      // Default: new arrivals / created date
      enriched.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    // Lightweight cache headers: cache-control for fast 304 or instant client retrieval
    res.setHeader('Cache-Control', 'public, max-age=5');

    return res.json({
      success: true,
      count: enriched.length,
      products: enriched
    });
  } catch (err) {
    console.error('Get products error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    let product = db.products.findById(id);
    if (!product) {
      product = db.products.findOne(p => p.slug === id);
    }

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const enriched = attachVariantsToProduct(product);
    return res.json({
      success: true,
      product: enriched
    });
  } catch (err) {
    console.error('Get product by ID error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const {
      name,
      category,
      gender,
      price,
      original_price,
      description,
      images,
      is_featured,
      is_new_arrival,
      variants
    } = req.body;

    if (!name || !price || !category) {
      return res.status(400).json({
        success: false,
        message: 'Product name, category, and price are required.'
      });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const productId = `prod-${uuidv4().substring(0, 8)}`;

    const newProduct = db.products.insert({
      id: productId,
      name,
      slug,
      category,
      gender: gender || 'unisex',
      price: Number(price),
      original_price: original_price ? Number(original_price) : Number(price) * 1.5,
      description: description || '',
      images: Array.isArray(images) && images.length > 0 ? images : [
        'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1000&auto=format&fit=crop'
      ],
      is_featured: Boolean(is_featured),
      is_new_arrival: Boolean(is_new_arrival),
      rating: 5.0,
      reviews_count: 1,
      is_active: true
    });

    // Create variants
    if (Array.isArray(variants) && variants.length > 0) {
      for (const v of variants) {
        db.product_variants.insert({
          id: `var-${uuidv4().substring(0, 8)}`,
          product_id: productId,
          size: v.size || 'M',
          color_name: v.color_name || 'Standard',
          color_code: v.color_code || '#000000',
          stock_quantity: Number(v.stock_quantity) || 10,
          sku: `SW-${category.toUpperCase()}-${v.size || 'M'}-${(v.color_name || 'STD').substring(0, 3).toUpperCase()}`
        });
      }
    } else {
      const defaultSizes = ['S', 'M', 'L', 'XL'];
      for (const size of defaultSizes) {
        db.product_variants.insert({
          id: `var-${uuidv4().substring(0, 8)}`,
          product_id: productId,
          size,
          color_name: 'Onyx Black',
          color_code: '#09090b',
          stock_quantity: 20,
          sku: `SW-${category.toUpperCase()}-${size}-BLK`
        });
      }
    }

    invalidateVariantIndex();

    // Log admin action
    db.admin_audit_logs.insert({
      id: `log-${uuidv4().substring(0, 8)}`,
      admin_id: req.user.id,
      admin_email: req.user.email,
      action: 'CREATE_PRODUCT',
      entity_type: 'product',
      entity_id: productId,
      details: { name, price, category },
      ip_address: req.ip || '127.0.0.1'
    });

    const enriched = attachVariantsToProduct(newProduct);
    return res.status(201).json({
      success: true,
      message: 'Product created successfully.',
      product: enriched
    });
  } catch (err) {
    console.error('Create product error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.products.findById(id);

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const {
      name,
      category,
      gender,
      price,
      original_price,
      description,
      images,
      is_featured,
      is_new_arrival,
      is_active,
      variants
    } = req.body;

    const updated = db.products.update(id, {
      ...(name && { name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') }),
      ...(category && { category }),
      ...(gender && { gender }),
      ...(price !== undefined && { price: Number(price) }),
      ...(original_price !== undefined && { original_price: Number(original_price) }),
      ...(description !== undefined && { description }),
      ...(images && { images }),
      ...(is_featured !== undefined && { is_featured: Boolean(is_featured) }),
      ...(is_new_arrival !== undefined && { is_new_arrival: Boolean(is_new_arrival) }),
      ...(is_active !== undefined && { is_active: Boolean(is_active) })
    });

    if (Array.isArray(variants)) {
      const currentVars = db.product_variants.find(v => v.product_id === id);
      for (const cv of currentVars) {
        db.product_variants.delete(cv.id);
      }
      for (const v of variants) {
        db.product_variants.insert({
          id: `var-${uuidv4().substring(0, 8)}`,
          product_id: id,
          size: v.size,
          color_name: v.color_name,
          color_code: v.color_code || '#000000',
          stock_quantity: Number(v.stock_quantity) || 0,
          sku: `SW-${(updated.category || 'GEN').toUpperCase()}-${v.size}-${(v.color_name || 'STD').substring(0, 3).toUpperCase()}`
        });
      }
    }

    invalidateVariantIndex();

    db.admin_audit_logs.insert({
      id: `log-${uuidv4().substring(0, 8)}`,
      admin_id: req.user.id,
      admin_email: req.user.email,
      action: 'UPDATE_PRODUCT',
      entity_type: 'product',
      entity_id: id,
      details: { updatedFields: Object.keys(req.body) },
      ip_address: req.ip || '127.0.0.1'
    });

    const enriched = attachVariantsToProduct(updated);
    return res.json({
      success: true,
      message: 'Product updated successfully.',
      product: enriched
    });
  } catch (err) {
    console.error('Update product error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.products.findById(id);

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    db.products.delete(id);

    const currentVars = db.product_variants.find(v => v.product_id === id);
    for (const v of currentVars) {
      db.product_variants.delete(v.id);
    }

    invalidateVariantIndex();

    db.admin_audit_logs.insert({
      id: `log-${uuidv4().substring(0, 8)}`,
      admin_id: req.user.id,
      admin_email: req.user.email,
      action: 'DELETE_PRODUCT',
      entity_type: 'product',
      entity_id: id,
      details: { deletedProductName: existing.name },
      ip_address: req.ip || '127.0.0.1'
    });

    return res.json({
      success: true,
      message: 'Product deleted successfully.'
    });
  } catch (err) {
    console.error('Delete product error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
