import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    salary: {
      type: String,
    },
    password: {
      type: String,
      required: true,
    },
    role:{
        type:String,
        enum:["admin","pharmacist","cashier","staff"],
        default:"staff"
    },
    refreshToken:{
        type:String
    }
  },

  {
    timestamps: true,
  },
);

const userModel = mongoose.model("user", userSchema);
export default userModel;
