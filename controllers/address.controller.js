import Address from "../models/Address.js";

// @desc    Add new address
// @route   POST /api/customer/address
// @access  Private
export const addAddress = async (req, res) => {
  try {
    const { fullName, firstName, lastName, phone, addressLine1, line1, addressLine2, line2, city, state, pinCode, pincode, landmark, isDefault } = req.body;

    // Validate phone number format (must be standard phone number: 10-15 digits after cleaning)
    const cleanPhone = (phone || "").replace(/[\s\-()]/g, '');
    const phoneRegex = /^\+?[0-9]{10,15}$/;
    if (!phoneRegex.test(cleanPhone)) {
      return res.status(400).json({ message: "Invalid phone number format (must be 10-15 digits)" });
    }

    if (isDefault) {
      await Address.updateMany({ user: req.user._id }, { isDefault: false });
    }

    const computedFullName = fullName || `${firstName || ""} ${lastName || ""}`.trim();

    const address = new Address({
      user: req.user._id,
      fullName: computedFullName,
      firstName,
      lastName,
      phone,
      addressLine1: addressLine1 || line1,
      addressLine2: addressLine2 || line2,
      city,
      state,
      pinCode: pinCode || pincode,
      landmark,
      isDefault
    });

    const createdAddress = await address.save();
    res.status(201).json(createdAddress);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all addresses of user
// @route   GET /api/customer/address
// @access  Private
export const getAddresses = async (req, res) => {
  try {
    const addresses = await Address.find({ user: req.user._id });
    res.json(addresses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update address
// @route   PUT /api/customer/address/:id
// @access  Private
export const updateAddress = async (req, res) => {
  try {
    const { fullName, firstName, lastName, phone, addressLine1, line1, addressLine2, line2, city, state, pinCode, pincode, landmark, isDefault } = req.body;

    if (phone !== undefined) {
      const cleanPhone = phone.replace(/[\s\-()]/g, '');
      const phoneRegex = /^\+?[0-9]{10,15}$/;
      if (!phoneRegex.test(cleanPhone)) {
        return res.status(400).json({ message: "Invalid phone number format (must be 10-15 digits)" });
      }
    }

    const address = await Address.findById(req.params.id);

    if (address) {
      if (address.user.toString() !== req.user._id.toString()) {
        return res.status(401).json({ message: "Not authorized" });
      }

      if (isDefault) {
        await Address.updateMany({ user: req.user._id }, { isDefault: false });
      }

      if (firstName !== undefined) address.firstName = firstName;
      if (lastName !== undefined) address.lastName = lastName;

      const newFirstName = firstName !== undefined ? firstName : address.firstName;
      const newLastName = lastName !== undefined ? lastName : address.lastName;

      address.fullName = fullName || `${newFirstName || ""} ${newLastName || ""}`.trim() || address.fullName;
      if (phone !== undefined) address.phone = phone;
      address.addressLine1 = addressLine1 || line1 || address.addressLine1;
      address.addressLine2 = addressLine2 || line2 || address.addressLine2;
      address.city = city || address.city;
      address.state = state || address.state;
      address.pinCode = pinCode || pincode || address.pinCode;
      address.landmark = landmark || address.landmark;
      address.isDefault = isDefault !== undefined ? isDefault : address.isDefault;

      const updatedAddress = await address.save();
      res.json(updatedAddress);
    } else {
      res.status(404).json({ message: "Address not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete address
// @route   DELETE /api/customer/address/:id
// @access  Private
export const deleteAddress = async (req, res) => {
  try {
    const address = await Address.findById(req.params.id);

    if (address) {
      if (address.user.toString() !== req.user._id.toString()) {
        return res.status(401).json({ message: "Not authorized" });
      }

      await Address.findByIdAndDelete(req.params.id);
      res.json({ message: "Address removed" });
    } else {
      res.status(404).json({ message: "Address not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
