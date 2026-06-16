import mongoose from "mongoose";

async function run() {
  const remoteUri = "mongodb://34.58.81.112:27017/aashansh";
  console.log("Connecting to remote 34.58.81.112 DB:", remoteUri);
  try {
    await mongoose.connect(remoteUri, { serverSelectionTimeoutMS: 5000 });
    console.log("Connected successfully to 34.58.81.112!");
    
    const HomepageSetting = mongoose.model("HomepageSetting", new mongoose.Schema({}, { strict: false }), "homepagesettings");
    const settings = await HomepageSetting.findOne({ key: "header_settings" });
    console.log("Settings:", settings);
    
    const HeaderCategory = mongoose.model("HeaderCategory", new mongoose.Schema({}, { strict: false }), "headercategories");
    const cats = await HeaderCategory.find({});
    console.log("Header categories:", cats.map(c => ({ name: c.name, slug: c.slug, isActive: c.isActive })));
  } catch (err) {
    console.error("Connection failed:", err.message);
  } finally {
    await mongoose.disconnect();
  }
}

run();
