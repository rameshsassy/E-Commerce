export const getCustomerProfile = async (req, res) => {
    try {
      res.json({
        message: "Customer profile fetched",
        user: req.user,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

export const updateCustomerEmailPreferences = async (req, res) => {
  try {
    const { emailNewProductAlerts, marketingEmailsEnabled } = req.body;
    const user = req.user;
    if (emailNewProductAlerts !== undefined) {
      user.emailNewProductAlerts = Boolean(emailNewProductAlerts);
    }
    if (marketingEmailsEnabled !== undefined) {
      user.marketingEmailsEnabled = Boolean(marketingEmailsEnabled);
    }
    await user.save();
    res.json({
      message: "Email preferences updated",
      emailNewProductAlerts: user.emailNewProductAlerts,
      marketingEmailsEnabled: user.marketingEmailsEnabled,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};