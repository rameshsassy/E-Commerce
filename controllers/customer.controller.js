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