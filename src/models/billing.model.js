import mongoose from "mongoose";

const BillingSchema = new mongoose.Schema(
  {
    customer_name: {
      type: String,
      required: true,
    },

    stocks: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "stocks",
    },
    mobile: {
      type: String,
    },
    address: {
      type: String,
    },
    billed_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
    },
    bill_id: {
      type: String,
      required: true,
    },
    amountPaid: {
      type: String,
      required: true,
    },
    paymentMode: {
      type: String,
      required: true,
    },
    quantity: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

const billingModel = mongoose.model("bills", BillingSchema);
export default billingModel;
