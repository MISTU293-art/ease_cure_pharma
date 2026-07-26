import mongoose from "mongoose";

const loginLoggerSchema = new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"user"
    },
    ip:{
        type:String
    },

    logged_at:{
        type:Date,
        default:Date.now()
    }
},{
    timestamps:true
});
const loggerModel = mongoose.model("logger",loginLoggerSchema);
export default loggerModel;