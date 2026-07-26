import userModel from "../models/user.models.js";
import StockModel from "../models/stock.models.js";
import billingModel from "../models/billing.model.js";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function showBillingPage(req, res) {
  try {
    const stocks = await StockModel.find().sort({ createdAt: -1 });
    return res.render("billing", {
      stocks,
      message: null,
      error: null,
    });
  } catch (error) {
    console.error(error);
    return res.render("billing", {
      stocks: [],
      message: null,
      error: "Unable to load billing page.",
    });
  }
}

async function generateBill(req, res) {
  try {
    const { customer_name, mobile, address, paymentMode, stockId, quantity } = req.body;

    if (!customer_name || !stockId || !quantity) {
      return res.render("billing", {
        stocks: await StockModel.find().sort({ createdAt: -1 }),
        message: null,
        error: "Please fill the required fields.",
      });
    }

    const stock = await StockModel.findById(stockId);

    if (!stock) {
      return res.render("billing", {
        stocks: await StockModel.find().sort({ createdAt: -1 }),
        message: null,
        error: "Selected medicine not found.",
      });
    }

    const qty = Number(quantity);
    const currentQty = Number(stock.quantity);

    if (qty > currentQty) {
      return res.render("billing", {
        stocks: await StockModel.find().sort({ createdAt: -1 }),
        message: null,
        error: "Requested quantity exceeds available stock.",
      });
    }

    const unitPrice = Number(stock.sellingPrice);
    const amountPaid = String(unitPrice * qty);
    const bill_id = `BILL-${Date.now()}`;
    const sellerName = req.user?.name || "Ease Cure Pharma";
    const sellerRole = req.user?.role || "Pharmacist";

    const bill = await billingModel.create({
      customer_name,
      stocks: stock._id,
      mobile,
      address,
      billed_by: req.user?._id || null,
      bill_id,
      amountPaid,
      paymentMode,
      quantity: String(qty),
    });

    stock.quantity = String(currentQty - qty);
    await stock.save();

    const pdfDir = path.join(__dirname, "../public/bills");
    fs.mkdirSync(pdfDir, { recursive: true });

    const pdfPath = path.join(pdfDir, `${bill_id}.pdf`);
    const doc = new PDFDocument({ margin: 40, size: "A5" });
    doc.pipe(fs.createWriteStream(pdfPath));

    doc.rect(35, 35, 500, 700).stroke("#2563EB");
    doc.fillColor("#2563EB").fontSize(22).text("Ease Cure Pharma", 80, 60, { align: "center" });
    doc.fillColor("#1f2937").fontSize(11).text("Pharmacy • Medical Store • Billing Receipt", 80, 90, { align: "center" });
    doc.moveDown(2);

    doc.fontSize(12).text(`Bill ID: ${bill.bill_id}`, 60, 125);
    doc.text(`Date: ${new Date().toLocaleString()}`, 60, 145);
    doc.text(`Payment Mode: ${paymentMode}`, 60, 165);

    doc.moveTo(60, 190).lineTo(520, 190).strokeColor("#dbeafe").stroke();

    doc.fontSize(12).text("Buyer Details", 60, 205, { underline: true });
    doc.text(`Name: ${customer_name}`, 60, 225);
    doc.text(`Mobile: ${mobile || "N/A"}`, 60, 245);
    doc.text(`Address: ${address || "N/A"}`, 60, 265);

    doc.fontSize(12).text("Seller Details", 320, 205, { underline: true });
    doc.text(`Name: ${sellerName}`, 320, 225);
    doc.text(`Role: ${sellerRole}`, 320, 245);
    doc.text(`Shop: Ease Cure Pharma`, 320, 265);

    doc.moveTo(60, 295).lineTo(520, 295).strokeColor("#dbeafe").stroke();

    doc.fontSize(12).text("Purchase Details", 60, 310, { underline: true });
    doc.text(`Medicine: ${stock.name}`, 60, 330);
    doc.text(`Manufacturer: ${stock.manufacturer || "N/A"}`, 60, 350);
    doc.text(`Category: ${stock.category || "N/A"}`, 60, 370);
    doc.text(`Unit Price: ₹ ${stock.sellingPrice}`, 60, 390);
    doc.text(`Quantity: ${qty}`, 60, 410);

    doc.moveTo(60, 430).lineTo(520, 430).strokeColor("#dbeafe").stroke();

    doc.fillColor("#0f766e").fontSize(14).text(`Total Amount: ₹ ${amountPaid}`, 60, 450);
    doc.fillColor("#6b7280").fontSize(10).text("Thank you for shopping with Ease Cure Pharma", 60, 490);
    doc.text("Please keep this receipt for your records.", 60, 506);
    doc.end();

    return res.render("billing", {
      stocks: await StockModel.find().sort({ createdAt: -1 }),
      message: `Bill generated successfully. Bill ID: ${bill.bill_id} | PDF ready to download`,
      error: null,
      lastBill: {
        bill_id,
        customer_name,
        medicine: stock.name,
        quantity: qty,
        unitPrice,
        total: Number(amountPaid),
      },
    });
  } catch (error) {
    console.error(error);
    return res.render("billing", {
      stocks: await StockModel.find().sort({ createdAt: -1 }),
      message: null,
      error: "Failed to generate bill.",
    });
  }
}

async function AllCustomer(req, res) {
  try {
    const bills = await billingModel.find().sort({ createdAt: -1 });

    const customers = await Promise.all(
      bills.map(async (bill) => {
        let stockInfo = null;
        let sellerInfo = null;

        try {
          stockInfo = await StockModel.findById(bill.stocks).lean();
        } catch (stockError) {
          console.error(stockError);
        }

        try {
          sellerInfo = await userModel.findById(bill.billed_by).lean();
        } catch (sellerError) {
          console.error(sellerError);
        }

        return {
          customer_name: bill.customer_name || "N/A",
          mobile: bill.mobile || "N/A",
          address: bill.address || "N/A",
          lastPurchase: bill.createdAt ? new Date(bill.createdAt).toLocaleDateString() : "N/A",
          status: "Active",
          bill_id: bill.bill_id || "N/A",
          medicine: stockInfo?.name || "N/A",
          quantity: bill.quantity || "0",
          amount: bill.amountPaid || "0",
          paymentMode: bill.paymentMode || "N/A",
          seller: sellerInfo?.name || "Ease Cure Pharma",
        };
      })
    );

    return res.render("customer", {
      customers,
      message: null,
      error: null,
    });
  } catch (error) {
    console.error(error);
    return res.render("customer", {
      customers: [],
      message: null,
      error: "Unable to load customer records.",
    });
  }
}

export { showBillingPage, generateBill, AllCustomer };