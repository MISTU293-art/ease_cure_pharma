import mongoose from "mongoose";
import dns from  'node:dns';
dns.setDefaultResultOrder('ipv4first');
dns.setServers(["8.8.8.8","1.1.1.1"]);
async function connectionDB() {
    try{
        await mongoose.connect(process.env.MONGO_URI);
        console.log("mongodb Connected");
    }
    catch(error){
        console.log(error);
    }
}

export default connectionDB