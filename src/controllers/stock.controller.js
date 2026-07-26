import StockModel from "../models/stock.models.js";

async function addStock(req, res) {
  try {
    const {
      name,
      manufacturer,
      category,
      batchNumber,
      quantity,
      expiryDate,
      purchasePrice,
      sellingPrice,
      supplier,
      isAvailable = true,
    } = req.body;

    const medicine = await StockModel.create({
      name,
      manufacturer,
      category,
      batchNumber,
      quantity,
      expiryDate,
      purchasePrice,
      sellingPrice,
      supplier,
      isAvailable,
    });

    console.log(medicine);
    return res.redirect('/stock')
  } catch (error) {
    console.log(error);
    return res.render("stock_add", {
      error: "স্টক সংরক্ষণ করা যায়নি।",
      message: null,
    });
  }
}



async function AllStocks(req, res) {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = 10;

    const totalStocks = await StockModel.countDocuments();
    const totalPages = totalStocks === 0 ? 1 : Math.ceil(totalStocks / limit);
    const safePage = Math.min(page, totalPages);

    const stocks = await StockModel.find()
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * limit)
      .limit(limit);

    return res.render("stocks", {
      stocks,
      message: null,
      error: null,
      currentPage: safePage,
      totalPages,
      totalStocks,
      limit,
    });
  } catch (error) {
    console.log(error);
    return res.render("dashboard", {
      message: null,
      error: "স্টকের তালিকা লোড করা যায়নি।",
    });
  }
}



async function deleteStock(req, res) {
  try {
    const _id = req.params._id;
    await StockModel.findByIdAndDelete(_id);
    return res.redirect('/stock')
  } catch (error) {
    return res.render("stocks", {
      message: null,
      error: " ওষুধটি মুছে ফেলা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।",
   
    });
  }
}

export { addStock, AllStocks,deleteStock };
