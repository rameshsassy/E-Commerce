import Subscriber from "../models/Subscriber.js";
import User from "../models/User.js";

export const subscribeToNewsletter = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Please enter a valid email address." });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if already subscribed
    const existing = await Subscriber.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(200).json({
        message: "You are already subscribed to our newsletter!",
        alreadySubscribed: true,
      });
    }

    // Create new subscriber
    const newSubscriber = new Subscriber({ email: normalizedEmail });
    await newSubscriber.save();

    // If an associated user profile exists, update their marketing preferences too
    const user = await User.findOne({ email: normalizedEmail });
    if (user) {
      user.marketingEmailsEnabled = true;
      await user.save();
    }

    return res.status(201).json({
      message: "Successfully subscribed to our newsletter!",
      alreadySubscribed: false,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
