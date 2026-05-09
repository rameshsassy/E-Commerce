import Address from "../models/Address.js";

// @desc    Add new address
// @route   POST /api/customer/address
// @access  Private
export const addAddress = async (req, res) => {
  try {
    const { fullName, phone, addressLine1, addressLine2, city, state, pinCode, landmark, isDefault } = req.body;

    if (isDefault) {
      await Address.updateMany({ user: req.user._id }, { isDefault: false });
    }

    const address = new Address({
      user: req.user._id,
      fullName,
      phone,
      addressLine1,
      addressLine2,
      city,
      state,
      pinCode,
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
    const { fullName, phone, addressLine1, addressLine2, city, state, pinCode, landmark, isDefault } = req.body;

    const address = await Address.findById(req.params.id);

    if (address) {
      if (address.user.toString() !== req.user._id.toString()) {
        return res.status(401).json({ message: "Not authorized" });
      }

      if (isDefault) {
        await Address.updateMany({ user: req.user._id }, { isDefault: false });
      }

      address.fullName = fullName || address.fullName;
      address.phone = phone || address.phone;
      address.addressLine1 = addressLine1 || address.addressLine1;
      address.addressLine2 = addressLine2 || address.addressLine2;
      address.city = city || address.city;
      address.state = state || address.state;
      address.pinCode = pinCode || address.pinCode;
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
