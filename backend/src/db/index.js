const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const config = require('../config/env');

const DATA_DIR = path.resolve(__dirname, '../../data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

class JsonCollection {
  constructor(name) {
    this.name = name;
    this.filePath = path.join(DATA_DIR, `${name}.json`);
    this.data = [];
    this.idMap = new Map();
    this.isDirty = false;
    this.saveTimeout = null;
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        this.data = JSON.parse(raw);
      } else {
        this.data = [];
        this.saveSync();
      }
      this.rebuildIndex();
    } catch (err) {
      console.error(`Error loading collection ${this.name}:`, err.message);
      this.data = [];
      this.rebuildIndex();
    }
  }

  rebuildIndex() {
    this.idMap.clear();
    for (let i = 0; i < this.data.length; i++) {
      const item = this.data[i];
      if (item && item.id) {
        this.idMap.set(item.id, item);
      }
    }
  }

  // Non-blocking debounced asynchronous save
  scheduleSave() {
    this.isDirty = true;
    if (this.saveTimeout) return;

    this.saveTimeout = setTimeout(async () => {
      this.saveTimeout = null;
      if (!this.isDirty) return;
      this.isDirty = false;
      try {
        const tempPath = `${this.filePath}.tmp`;
        const jsonStr = JSON.stringify(this.data);
        await fs.promises.writeFile(tempPath, jsonStr, 'utf-8');
        await fs.promises.rename(tempPath, this.filePath);
      } catch (err) {
        // Fallback direct write if atomic rename is busy on Windows
        try {
          await fs.promises.writeFile(this.filePath, JSON.stringify(this.data), 'utf-8');
        } catch (innerErr) {
          console.error(`Error saving collection ${this.name}:`, innerErr.message);
        }
      }
    }, 25); // Batches all consecutive writes within 25ms
  }

  saveSync() {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.data), 'utf-8');
      this.isDirty = false;
    } catch (err) {
      console.error(`Sync save error on ${this.name}:`, err.message);
    }
  }

  find(filterFn = () => true) {
    return this.data.filter(filterFn);
  }

  findOne(filterFn) {
    return this.data.find(filterFn) || null;
  }

  findById(id) {
    return this.idMap.get(id) || null;
  }

  insert(doc) {
    const item = {
      id: doc.id || uuidv4(),
      created_at: doc.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...doc
    };
    this.data.push(item);
    this.idMap.set(item.id, item);
    this.scheduleSave();
    return item;
  }

  update(id, updateData) {
    const item = this.idMap.get(id);
    if (!item) return null;

    Object.assign(item, updateData, { updated_at: new Date().toISOString() });
    this.scheduleSave();
    return item;
  }

  delete(id) {
    const item = this.idMap.get(id);
    if (!item) return false;

    this.idMap.delete(id);
    const index = this.data.indexOf(item);
    if (index > -1) {
      this.data.splice(index, 1);
    }
    this.scheduleSave();
    return true;
  }

  count(filterFn = () => true) {
    return this.data.filter(filterFn).length;
  }
}

// Collections required by spec
const db = {
  users: new JsonCollection('users'),
  products: new JsonCollection('products'),
  product_variants: new JsonCollection('product_variants'),
  carts: new JsonCollection('carts'),
  orders: new JsonCollection('orders'),
  order_items: new JsonCollection('order_items'),
  payment_attempts: new JsonCollection('payment_attempts'),
  notifications: new JsonCollection('notifications'),
  admin_audit_logs: new JsonCollection('admin_audit_logs')
};

// Ensure all dirty data is flushed on process termination
process.on('beforeExit', () => {
  Object.values(db).forEach((col) => {
    if (col.isDirty) col.saveSync();
  });
});

// Seed initial data if tables are empty
async function seedDatabase() {
  // 1. Seed users if not exists
  if (db.users.count() === 0) {
    // Round 8 for optimal security and 4x faster hashing
    const salt = bcrypt.genSaltSync(8);
    const adminPass = bcrypt.hashSync(config.ADMIN_PASSWORD, salt);
    const userPass = bcrypt.hashSync('Customer@123', salt);

    db.users.insert({
      id: 'usr-admin-01',
      name: 'Six Wings Head Administrator',
      email: config.ADMIN_EMAIL,
      password_hash: adminPass,
      role: 'admin',
      phone: '+91 98765 43210'
    });

    db.users.insert({
      id: 'usr-demo-02',
      name: 'Alex Turner',
      email: 'alex@example.com',
      password_hash: userPass,
      role: 'customer',
      phone: '+91 91234 56789'
    });

    console.log('✅ Seeded users (Admin & Demo Customer)');
  }

  // 2. Seed products and variants if not exists
  if (db.products.count() === 0) {
    const initialProducts = [
      {
        id: 'prod-001',
        name: 'Six Wings Signature Heavyweight Oversized Tee',
        slug: 'six-wings-signature-heavyweight-oversized-tee',
        category: 'oversized',
        gender: 'unisex',
        price: 799,
        original_price: 1499,
        description: 'Crafted from 280 GSM premium French terry cotton. Features dropped shoulders, reinforced double-needle ribbed collar, and signature tonal Six Wings wing embroidery at chest.',
        images: [
          'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1000&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=1000&auto=format&fit=crop'
        ],
        is_featured: true,
        is_new_arrival: true,
        rating: 4.9,
        reviews_count: 128,
        is_active: true,
        variants: [
          { size: 'S', color_name: 'Onyx Black', color_code: '#09090b', stock_quantity: 25 },
          { size: 'M', color_name: 'Onyx Black', color_code: '#09090b', stock_quantity: 40 },
          { size: 'L', color_name: 'Onyx Black', color_code: '#09090b', stock_quantity: 35 },
          { size: 'XL', color_name: 'Onyx Black', color_code: '#09090b', stock_quantity: 20 },
          { size: 'XXL', color_name: 'Onyx Black', color_code: '#09090b', stock_quantity: 15 },
          { size: 'M', color_name: 'Vintage Off-White', color_code: '#f4f4f5', stock_quantity: 30 },
          { size: 'L', color_name: 'Vintage Off-White', color_code: '#f4f4f5', stock_quantity: 25 },
          { size: 'L', color_name: 'Charcoal Acid Wash', color_code: '#3f3f46', stock_quantity: 18 }
        ]
      },
      {
        id: 'prod-002',
        name: 'Wings of Freedom Anime Oversized Graphic Tee',
        slug: 'wings-of-freedom-anime-oversized-graphic-tee',
        category: 'anime',
        gender: 'unisex',
        price: 899,
        original_price: 1699,
        description: 'High-density silk-screened neo-Tokyo graphic on 240 GSM combed ring-spun cotton. Distressed edges and Japanese typography on back and sleeve.',
        images: [
          'https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=1000&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=1000&auto=format&fit=crop'
        ],
        is_featured: true,
        is_new_arrival: true,
        rating: 4.8,
        reviews_count: 94,
        is_active: true,
        variants: [
          { size: 'S', color_name: 'Midnight Black', color_code: '#18181b', stock_quantity: 20 },
          { size: 'M', color_name: 'Midnight Black', color_code: '#18181b', stock_quantity: 35 },
          { size: 'L', color_name: 'Midnight Black', color_code: '#18181b', stock_quantity: 30 },
          { size: 'XL', color_name: 'Midnight Black', color_code: '#18181b', stock_quantity: 15 },
          { size: 'M', color_name: 'Chalk White', color_code: '#fafafa', stock_quantity: 20 }
        ]
      },
      {
        id: 'prod-003',
        name: 'Shadow Blade Cyber Anime Boxy Tee',
        slug: 'shadow-blade-cyber-anime-boxy-tee',
        category: 'anime',
        gender: 'unisex',
        price: 849,
        original_price: 1599,
        description: 'Cyberpunk anime aesthetic tee with manga frame artwork, tonal dark violet accents, and an ultra-relaxed boxy cut.',
        images: [
          'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?q=80&w=1000&auto=format&fit=crop'
        ],
        is_featured: true,
        is_new_arrival: false,
        rating: 4.7,
        reviews_count: 62,
        is_active: true,
        variants: [
          { size: 'S', color_name: 'Washed Charcoal', color_code: '#27272a', stock_quantity: 15 },
          { size: 'M', color_name: 'Washed Charcoal', color_code: '#27272a', stock_quantity: 25 },
          { size: 'L', color_name: 'Washed Charcoal', color_code: '#27272a', stock_quantity: 20 },
          { size: 'XL', color_name: 'Washed Charcoal', color_code: '#27272a', stock_quantity: 10 }
        ]
      },
      {
        id: 'prod-004',
        name: 'Archangel 400 GSM Heavyweight Fleece Hoodie',
        slug: 'archangel-400-gsm-heavyweight-fleece-hoodie',
        category: 'hoodies',
        gender: 'unisex',
        price: 1999,
        original_price: 3499,
        description: 'Unapologetically thick 400 GSM brushed fleece. Double-ply hood without drawstrings for a clean architectural silhouette. Hidden device pocket inside kangaroo pouch.',
        images: [
          'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=1000&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?q=80&w=1000&auto=format&fit=crop'
        ],
        is_featured: true,
        is_new_arrival: true,
        rating: 5.0,
        reviews_count: 180,
        is_active: true,
        variants: [
          { size: 'S', color_name: 'Pitch Black', color_code: '#09090b', stock_quantity: 15 },
          { size: 'M', color_name: 'Pitch Black', color_code: '#09090b', stock_quantity: 30 },
          { size: 'L', color_name: 'Pitch Black', color_code: '#09090b', stock_quantity: 25 },
          { size: 'XL', color_name: 'Pitch Black', color_code: '#09090b', stock_quantity: 20 },
          { size: 'M', color_name: 'Ash Heather Gray', color_code: '#a1a1aa', stock_quantity: 20 },
          { size: 'L', color_name: 'Ash Heather Gray', color_code: '#a1a1aa', stock_quantity: 15 }
        ]
      },
      {
        id: 'prod-005',
        name: 'Relaxed Cuban Camp Collar Linen Shirt',
        slug: 'relaxed-cuban-camp-collar-linen-shirt',
        category: 'shirts',
        gender: 'men',
        price: 1299,
        original_price: 2299,
        description: 'Airy European flax linen blend tailored with a retro notched collar, relaxed straight hem, and natural shell buttons.',
        images: [
          'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=1000&auto=format&fit=crop'
        ],
        is_featured: false,
        is_new_arrival: false,
        rating: 4.6,
        reviews_count: 45,
        is_active: true,
        variants: [
          { size: 'M', color_name: 'Sand Dune', color_code: '#e4d5b7', stock_quantity: 20 },
          { size: 'L', color_name: 'Sand Dune', color_code: '#e4d5b7', stock_quantity: 18 },
          { size: 'XL', color_name: 'Sand Dune', color_code: '#e4d5b7', stock_quantity: 12 },
          { size: 'M', color_name: 'Optic White', color_code: '#ffffff', stock_quantity: 22 }
        ]
      },
      {
        id: 'prod-006',
        name: 'Vintage Flannel Overshirt — Slate Tartan',
        slug: 'vintage-flannel-overshirt-slate-tartan',
        category: 'shirts',
        gender: 'unisex',
        price: 1499,
        original_price: 2599,
        description: 'Heavyweight double-brushed cotton flannel. Features chest flap pockets with button closures and adjustable cuffs. Built for effortless layering.',
        images: [
          'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=1000&auto=format&fit=crop'
        ],
        is_featured: false,
        is_new_arrival: true,
        rating: 4.8,
        reviews_count: 53,
        is_active: true,
        variants: [
          { size: 'S', color_name: 'Slate Plaid', color_code: '#27272a', stock_quantity: 10 },
          { size: 'M', color_name: 'Slate Plaid', color_code: '#27272a', stock_quantity: 20 },
          { size: 'L', color_name: 'Slate Plaid', color_code: '#27272a', stock_quantity: 15 },
          { size: 'XL', color_name: 'Slate Plaid', color_code: '#27272a', stock_quantity: 8 }
        ]
      },
      {
        id: 'prod-007',
        name: 'Wide-Leg Washed Carpenter Denim Jeans',
        slug: 'wide-leg-washed-carpenter-denim-jeans',
        category: 'jeans',
        gender: 'unisex',
        price: 1899,
        original_price: 3299,
        description: 'Authentic 13.5 oz non-stretch cotton denim in a classic vintage stonewash. Features utilitarian side hammer loop, double-layer pockets, and a modern wide drape.',
        images: [
          'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=1000&auto=format&fit=crop'
        ],
        is_featured: true,
        is_new_arrival: false,
        rating: 4.9,
        reviews_count: 110,
        is_active: true,
        variants: [
          { size: '30', color_name: 'Vintage Stonewash', color_code: '#3b5168', stock_quantity: 15 },
          { size: '32', color_name: 'Vintage Stonewash', color_code: '#3b5168', stock_quantity: 25 },
          { size: '34', color_name: 'Vintage Stonewash', color_code: '#3b5168', stock_quantity: 20 },
          { size: '36', color_name: 'Vintage Stonewash', color_code: '#3b5168', stock_quantity: 10 }
        ]
      },
      {
        id: 'prod-008',
        name: 'Wings Tactical Flight Bomber Jacket',
        slug: 'wings-tactical-flight-bomber-jacket',
        category: 'jackets',
        gender: 'unisex',
        price: 2899,
        original_price: 4999,
        description: 'Water-repellent satin flight nylon with diamond-quilted thermal insulation. Finished with heavy-duty metal zips, utility sleeve pocket, and ribbed wool collar.',
        images: [
          'https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=1000&auto=format&fit=crop'
        ],
        is_featured: true,
        is_new_arrival: true,
        rating: 4.9,
        reviews_count: 88,
        is_active: true,
        variants: [
          { size: 'S', color_name: 'Matte Stealth Black', color_code: '#09090b', stock_quantity: 12 },
          { size: 'M', color_name: 'Matte Stealth Black', color_code: '#09090b', stock_quantity: 20 },
          { size: 'L', color_name: 'Matte Stealth Black', color_code: '#09090b', stock_quantity: 18 },
          { size: 'XL', color_name: 'Matte Stealth Black', color_code: '#09090b', stock_quantity: 10 }
        ]
      },
      {
        id: 'prod-009',
        name: 'Monochrome Minimalist Cropped Baby Tee',
        slug: 'monochrome-minimalist-cropped-baby-tee',
        category: 'women',
        gender: 'women',
        price: 699,
        original_price: 1299,
        description: 'Super-soft 210 GSM stretch cotton rib. Subtle cropped length with lettuce edge hem and tonal wings logo print.',
        images: [
          'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=1000&auto=format&fit=crop'
        ],
        is_featured: false,
        is_new_arrival: true,
        rating: 4.7,
        reviews_count: 39,
        is_active: true,
        variants: [
          { size: 'XS', color_name: 'Cloud White', color_code: '#f4f4f5', stock_quantity: 15 },
          { size: 'S', color_name: 'Cloud White', color_code: '#f4f4f5', stock_quantity: 25 },
          { size: 'M', color_name: 'Cloud White', color_code: '#f4f4f5', stock_quantity: 20 },
          { size: 'S', color_name: 'Onyx Black', color_code: '#09090b', stock_quantity: 20 }
        ]
      },
      {
        id: 'prod-010',
        name: 'Tokyo Cyberpunk Embroidered Souvenir Jacket',
        slug: 'tokyo-cyberpunk-embroidered-souvenir-jacket',
        category: 'anime',
        gender: 'unisex',
        price: 3299,
        original_price: 5999,
        description: 'Collector edition reversible Sukajan jacket. 120,000 stitches of high-definition anime winged dragon embroidery on Japanese satin.',
        images: [
          'https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=1000&auto=format&fit=crop'
        ],
        is_featured: true,
        is_new_arrival: false,
        rating: 5.0,
        reviews_count: 76,
        is_active: true,
        variants: [
          { size: 'M', color_name: 'Midnight Black / Silver', color_code: '#18181b', stock_quantity: 10 },
          { size: 'L', color_name: 'Midnight Black / Silver', color_code: '#18181b', stock_quantity: 12 },
          { size: 'XL', color_name: 'Midnight Black / Silver', color_code: '#18181b', stock_quantity: 8 }
        ]
      }
    ];

    for (const p of initialProducts) {
      const { variants, ...prodData } = p;
      db.products.insert(prodData);

      for (const v of variants) {
        db.product_variants.insert({
          id: `var-${uuidv4().substring(0, 8)}`,
          product_id: p.id,
          size: v.size,
          color_name: v.color_name,
          color_code: v.color_code,
          stock_quantity: v.stock_quantity,
          sku: `SW-${p.category.toUpperCase()}-${v.size}-${v.color_name.substring(0, 3).toUpperCase()}`
        });
      }
    }

    // Force flush seeds
    Object.values(db).forEach((col) => col.saveSync());
    console.log(`✅ Seeded ${initialProducts.length} products and their variants`);
  }
}

// Run initial seed
seedDatabase().catch(console.error);

module.exports = db;
