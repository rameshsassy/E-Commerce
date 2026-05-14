import Review from "../models/Review.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import { absoluteToWebPath } from "../utils/uploadPaths.js";

// @desc    Create new review
// @route   POST /api/products/:id/reviews
// @access  Private/Customer
export const createProductReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const productId = req.params.id;

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if user already reviewed
    const alreadyReviewed = await Review.findOne({
      user: req.user._id,
      product: productId,
    });

    if (alreadyReviewed) {
      return res.status(400).json({ message: "You have already reviewed this product" });
    }

    // Must have purchased and order delivered to review
    const orders = await Order.find({ 
      user: req.user._id, 
      "items.product": productId,
      orderStatus: "Delivered" 
    });

    if (orders.length === 0) {
      return res.status(403).json({ message: "You can only review products after they have been delivered to you." });
    }

    let images = [];
    if (req.files && req.files.length > 0) {
      images = req.files.map((file) => absoluteToWebPath(file.path));
    }

    const review = new Review({
      user: req.user._id,
      product: productId,
      rating: Number(rating),
      comment,
      images,
      isVerifiedPurchase: true,
    });

    await review.save();

    res.status(201).json({ message: "Review added successfully", review });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get product reviews with sorting and filtering
// @route   GET /api/products/:id/reviews
// @access  Public
export const getProductReviews = async (req, res) => {
  try {
    const { sort = 'newest', filter = 'all' } = req.query;
    let query = { product: req.params.id };

    if (filter === 'images') {
      query.images = { $exists: true, $not: { $size: 0 } };
    } else if (filter === '5star') {
      query.rating = 5;
    }

    let sortObj = { createdAt: -1 };
    if (sort === 'highest') sortObj = { rating: -1 };
    if (sort === 'lowest') sortObj = { rating: 1 };
    if (sort === 'helpful') sortObj = { helpfulVotes: -1 };

    const reviews = await Review.find(query)
      .populate("user", "firstName lastName")
      .sort(sortObj);

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark review as helpful
// @route   PUT /api/products/:id/reviews/:reviewId/helpful
// @access  Private
export const markReviewHelpful = async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    if (review.helpfulVotes.includes(req.user._id)) {
      // Toggle off if already voted
      review.helpfulVotes = review.helpfulVotes.filter(
        id => id.toString() !== req.user._id.toString()
      );
    } else {
      // Toggle on
      review.helpfulVotes.push(req.user._id);
    }

    await review.save();
    res.json({ message: "Helpful vote updated", helpfulCount: review.helpfulVotes.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
