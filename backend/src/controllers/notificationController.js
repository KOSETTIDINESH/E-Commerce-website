const db = require('../db');

exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const isAdmin = req.user && req.user.role === 'admin';

    let notifs = [];
    if (isAdmin) {
      notifs = db.notifications.find(n => n.user_id === 'admin' || n.user_id === 'all' || (userId && n.user_id === userId));
    } else if (userId) {
      notifs = db.notifications.find(n => n.user_id === userId || n.user_id === 'all');
    } else {
      // Guest by email or header
      const guestEmail = req.query.email;
      if (guestEmail) {
        const guestOrders = db.orders.find(o => o.customer_email.toLowerCase() === guestEmail.toLowerCase());
        const orderIds = guestOrders.map(o => o.id);
        notifs = db.notifications.find(n => orderIds.includes(n.order_id));
      }
    }

    notifs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return res.json({
      success: true,
      count: notifs.length,
      unread_count: notifs.filter(n => !n.is_read).length,
      notifications: notifs
    });
  } catch (err) {
    console.error('Get notifications error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notif = db.notifications.findById(id);
    if (!notif) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    const updated = db.notifications.update(id, { is_read: true });
    return res.json({ success: true, notification: updated });
  } catch (err) {
    console.error('Mark read error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const isAdmin = req.user && req.user.role === 'admin';

    const notifs = db.notifications.find(n => {
      if (isAdmin) return n.user_id === 'admin' || n.user_id === 'all' || (userId && n.user_id === userId);
      if (userId) return n.user_id === userId || n.user_id === 'all';
      return false;
    });

    for (const n of notifs) {
      db.notifications.update(n.id, { is_read: true });
    }

    return res.json({ success: true, message: 'All marked as read' });
  } catch (err) {
    console.error('Mark all read error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
