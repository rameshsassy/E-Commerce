import Counter from "../models/Counter.js";

export const getNextSequenceValue = async (counterName) => {
  let counter = await Counter.findOne({ name: counterName });
  if (!counter) {
    try {
      await Counter.create({ name: counterName, sequenceValue: 1000 });
    } catch (err) {
      // ignore duplicate key error in case of concurrency
    }
  }
  const result = await Counter.findOneAndUpdate(
    { name: counterName },
    { $inc: { sequenceValue: 1 } },
    { new: true }
  );
  return result.sequenceValue;
};

export const generateCustomerId = async () => {
  const seq = await getNextSequenceValue("customerCounter");
  return `C${seq}`;
};

export const generateSellerId = async () => {
  const seq = await getNextSequenceValue("sellerCounter");
  return `S${seq}`;
};
