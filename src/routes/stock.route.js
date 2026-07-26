import express from "express";
const router = express.Router();
import { addStock,AllStocks,deleteStock } from "../controllers/stock.controller.js";
import { isLoggedIn } from "../middlewares/auth.middleware.js";
// stock add page 
router.get('/stock-add',isLoggedIn,(req,res)=>{
    res.render('stock_add',{
        error:null,
        message:null
    })
});

router.post('/stock/add',isLoggedIn,addStock);
// all stocks
router.get('/stock', isLoggedIn, AllStocks);
// stock delete
router.get("/stock/delete/:_id", isLoggedIn, deleteStock);
export default router;
