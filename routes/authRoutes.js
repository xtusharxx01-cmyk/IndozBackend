const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const router = express.Router();

// Basic helpers
const sanitizeUser = (user) => ({ id: user.id, name: user.name, email: user.email });

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) return res.status(400).json({ error: 'name, email and password are required' });
  if (typeof password !== 'string' || password.length < 6) return res.status(400).json({ error: 'password must be at least 6 characters' });

  try {
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hash });
    return res.status(201).json({ success: true, user: sanitizeUser(user) });
  } catch (err) {
    // handle unique constraint more clearly
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ success: false, message: 'Email already in use' });
    }
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password are required' });

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(400).json({ success: false, message: 'Invalid email or password' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ success: false, message: 'Invalid email or password' });

    return res.json({ success: true, user: sanitizeUser(user) });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/user/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, currentPassword, newPassword } = req.body;

  try {
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Always require current password for any profile changes
    if (!currentPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Current password is required to update profile' 
      });
    }

    // Verify current password
    const passwordMatch = await bcrypt.compare(currentPassword, user.password);
    if (!passwordMatch) {
      return res.status(400).json({ 
        success: false, 
        message: 'Current password is incorrect' 
      });
    }

    // Check if new email is already in use (if email is being changed)
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(409).json({ 
          success: false, 
          message: 'Email is already in use by another account' 
        });
      }
    }

    // Validate new password if provided
    if (newPassword) {
      if (newPassword.length < 6) {
        return res.status(400).json({ 
          success: false, 
          message: 'New password must be at least 6 characters long' 
        });
      }
      // Hash and update password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
    }

    // Update other fields
    if (name && name.trim()) {
      user.name = name.trim();
    }
    if (email && email.trim()) {
      user.email = email.trim().toLowerCase();
    }

    await user.save();
    
    return res.json({ 
      success: true, 
      message: 'Profile updated successfully',
      user: sanitizeUser(user) 
    });
  } catch (err) {
    console.error('Error updating user profile:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'An error occurred while updating your profile' 
    });
  }
});

router.get('/user/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.json({ success: true, user: sanitizeUser(user) });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
