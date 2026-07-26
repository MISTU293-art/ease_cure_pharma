import mongoose from "mongoose";

const stockSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    manufacturer: {
      type: String,
      trim: true,
    },

    category: {
      type: String,
      enum: ["medicine", "food", "utility"],
      default: "medicine",
    },

    batchNumber: {
      type: String
      
    },

    quantity: {
      type:String,
      required: true,
      min: 0,
    },

    expiryDate: {
      type: Date,
      required: true,
    },

    purchasePrice: {
      type:String,
      required: true,
      min: 0,
    },

    sellingPrice: {
      type:String,
      required: true,
      min: 0,
    },

    supplier: {
      type: String,
    },
    isAvailable:{
        type:Boolean,
        default:true
    }
  },
  {
    timestamps: true,
  },
);

const StockModel = mongoose.model("stocks",stockSchema);
export default StockModel;
