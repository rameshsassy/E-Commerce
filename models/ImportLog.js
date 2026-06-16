import mongoose from "mongoose";

const importLogSchema = new mongoose.Schema(
  {
    importType: {
      type: String,
      enum: ["customers", "sellers", "products", "orders"],
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    totalRows: {
      type: Number,
      default: 0,
    },
    importedRows: {
      type: Number,
      default: 0,
    },
    skippedRows: {
      type: Number,
      default: 0,
    },
    failedRows: {
      type: Number,
      default: 0,
    },
    importedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    importedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
    },
    importMode: {
      type: String,
      enum: ["skip_duplicates", "update_existing", "import_new_only"],
      default: "skip_duplicates",
    },
    errors: [
      {
        row: Number,
        field: String,
        message: String,
        data: mongoose.Schema.Types.Mixed,
      },
    ],
    reportUrl: {
      type: String,
      default: null,
    },
    summary: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

const ImportLog = mongoose.model("ImportLog", importLogSchema);
export default ImportLog;
