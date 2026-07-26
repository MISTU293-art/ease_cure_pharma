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
    const billId = req.query.billId;
    let lastBill = null;
    let message = req.query.message ? decodeURIComponent(req.query.message) : null;
    let error = req.query.error ? decodeURIComponent(req.query.error) : null;

    if (billId) {
      const bill = await billingModel.findOne({ bill_id: billId }).lean();

      if (bill) {
        const items = Array.isArray(bill.products) && bill.products.length
          ? bill.products.map((item) => ({
              name: item.name,
              quantity: item.quantity,
              total: item.total,
            }))
          : [];

        lastBill = {
          bill_id: bill.bill_id,
          customer_name: bill.customer_name,
          items,
          quantity: bill.quantity || items.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
          total: Number(bill.amountPaid || 0),
        };
      }
    }

    return res.render("billing", {
      stocks,
      message,
      error,
      lastBill,
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
    const { customer_name, mobile, address, paymentMode, totalAmount } = req.body;
    const stockIds = Array.isArray(req.body.stockId) ? req.body.stockId : [req.body.stockId].filter(Boolean);
    const quantities = Array.isArray(req.body.quantity) ? req.body.quantity : [req.body.quantity].filter(Boolean);

    if (!customer_name || stockIds.length === 0 || quantities.length === 0) {
      const errorMessage = encodeURIComponent("Please fill the required fields.");
      return res.redirect(`/billing?error=${errorMessage}`);
    }

    const selectedItems = [];
    let totalQty = 0;
    let totalAmountValue = 0;

    for (let index = 0; index < stockIds.length; index += 1) {
      const stockId = stockIds[index];
      const qtyInput = quantities[index];

      if (!stockId || !qtyInput) {
        continue;
      }

      const stock = await StockModel.findById(stockId);

      if (!stock) {
        const errorMessage = encodeURIComponent("One or more selected medicines were not found.");
        return res.redirect(`/billing?error=${errorMessage}`);
      }

      const qty = Number(qtyInput);
      const currentQty = Number(stock.quantity);

      if (!Number.isFinite(qty) || qty < 1) {
        const errorMessage = encodeURIComponent("Please enter a valid quantity for each product.");
        return res.redirect(`/billing?error=${errorMessage}`);
      }

      if (qty > currentQty) {
        const errorMessage = encodeURIComponent(`Requested quantity for ${stock.name} exceeds available stock.`);
        return res.redirect(`/billing?error=${errorMessage}`);
      }

      const unitPrice = Number(stock.sellingPrice);
      const lineTotal = unitPrice * qty;
      selectedItems.push({
        stockId: stock._id,
        name: stock.name,
        manufacturer: stock.manufacturer || "N/A",
        category: stock.category || "N/A",
        quantity: qty,
        unitPrice,
        total: lineTotal,
      });
      totalQty += qty;
      totalAmountValue += lineTotal;
    }

    if (selectedItems.length === 0) {
      const errorMessage = encodeURIComponent("Please select at least one product.");
      return res.redirect(`/billing?error=${errorMessage}`);
    }

    const submittedAmount = Number(totalAmount);
    const amountPaid = String(Number.isFinite(submittedAmount) && submittedAmount > 0 ? submittedAmount : totalAmountValue);
    const bill_id = `BILL-${Date.now()}`;
    const sellerName = req.user?.name || "Ease Cure Pharma";
    const sellerRole = req.user?.role || "Pharmacist";

    const bill = await billingModel.create({
      customer_name,
      stocks: selectedItems[0].stockId,
      mobile,
      address,
      billed_by: req.user?._id || null,
      bill_id,
      amountPaid,
      paymentMode,
      quantity: String(totalQty),
      products: selectedItems,
    });

    for (const item of selectedItems) {
      const stock = await StockModel.findById(item.stockId);
      if (stock) {
        const currentQty = Number(stock.quantity);
        stock.quantity = String(currentQty - item.quantity);
        await stock.save();
      }
    }

    const pdfDir = path.join(__dirname, "../public/bills");
    fs.mkdirSync(pdfDir, { recursive: true });

    const pdfPath = path.join(pdfDir, `${bill_id}.pdf`);
    const doc = new PDFDocument({ margin: 40, size: "A5" });
    const stream = fs.createWriteStream(pdfPath);
    doc.pipe(stream);

    doc.rect(35, 35, 500, 700).stroke("#2563EB");
    doc.fillColor("#2563EB").fontSize(20).text("Ease Cure Pharma", 80, 60, { align: "center" });
    doc.fillColor("#4b5563").fontSize(9).text("Pharmacy • Medical Store • Billing Receipt", 80, 86, { align: "center" });

    doc.moveTo(60, 110).lineTo(520, 110).strokeColor("#dbeafe").stroke();

    doc.fontSize(10).fillColor("#111827");
    doc.text(`Bill ID: ${bill.bill_id}`, 60, 122);
    doc.text(`Date: ${new Date().toLocaleString()}`, 60, 138);
    doc.text(`Payment Mode: ${paymentMode}`, 60, 154);
    doc.text(`Customer: ${customer_name}`, 300, 122);
    doc.text(`Mobile: ${mobile || "N/A"}`, 300, 138);
    doc.text(`Address: ${address || "N/A"}`, 300, 154);

    doc.moveTo(60, 176).lineTo(520, 176).strokeColor("#dbeafe").stroke();

    doc.fontSize(11).fillColor("#111827").text("Items Purchased", 60, 188, { underline: true });

    let yPosition = 210;
    doc.fontSize(9).fillColor("#374151");
    doc.text("Item", 60, yPosition);
    doc.text("Qty", 240, yPosition);
    doc.text("Rate", 300, yPosition);
    doc.text("Amount", 390, yPosition);
    doc.moveTo(60, yPosition + 12).lineTo(520, yPosition + 12).strokeColor("#cbd5e1").stroke();

    yPosition += 20;
    selectedItems.forEach((item) => {
      doc.text(item.name, 60, yPosition, { width: 160, ellipsis: true });
      doc.text(String(item.quantity), 240, yPosition);
      doc.text(`₹ ${item.unitPrice}`, 300, yPosition);
      doc.text(`₹ ${item.total}`, 390, yPosition);
      yPosition += 16;
    });

    doc.moveTo(60, yPosition + 8).lineTo(520, yPosition + 8).strokeColor("#cbd5e1").stroke();
    doc.fontSize(10).fillColor("#111827").text("Total", 330, yPosition + 20);
    doc.text(`₹ ${Number(amountPaid).toFixed(2)}`, 390, yPosition + 20);

    doc.moveTo(60, yPosition + 42).lineTo(520, yPosition + 42).strokeColor("#dbeafe").stroke();
    doc.fontSize(12).fillColor("#0f766e").text(`Total Amount: ₹ ${Number(amountPaid).toFixed(2)}`, 60, yPosition + 56);
    doc.fontSize(8).fillColor("#6b7280").text("Thank you for shopping with Ease Cure Pharma", 60, yPosition + 80);
    doc.text("Please keep this receipt for your records.", 60, yPosition + 94);
    doc.text(`Prepared by: ${sellerName}`, 60, yPosition + 108);

    doc.end();
    await new Promise((resolve, reject) => {
      stream.on("finish", resolve);
      stream.on("error", reject);
    });

    const successMessage = encodeURIComponent(`Bill generated successfully. Bill ID: ${bill.bill_id} | PDF ready to download`);
    return res.redirect(`/customer?billId=${encodeURIComponent(bill.bill_id)}&message=${successMessage}`);
  } catch (error) {
    console.error(error);
    const errorMessage = encodeURIComponent("Failed to generate bill.");
    return res.redirect(`/billing?error=${errorMessage}`);
  }
}

async function getChatbotReply(message = "") {
  const text = String(message || "").toLowerCase().trim();

  const [allStocks, allBills] = await Promise.all([
    StockModel.find().lean(),
    billingModel.find().sort({ createdAt: -1 }).lean(),
  ]);

  const stockCount = allStocks.length;
  const lowStockItems = allStocks.filter((item) => Number(item.quantity || 0) <= 10);
  const billCount = allBills.length;
  const totalRevenue = allBills.reduce((sum, bill) => sum + Number(bill.amountPaid || 0), 0);
  const latestBill = allBills[0];
  const customerCount = new Set(allBills.map((bill) => bill.customer_name)).size;

  if (!text) {
    return `Hello! I can help with your pharmacy data.\nCurrent stock items: ${stockCount}\nBills created: ${billCount}\nTotal revenue: ₹ ${totalRevenue.toFixed(2)}\nআপনি আপনার ফার্মেসির তথ্য নিয়ে প্রশ্ন করতে পারেন।`;
  }

  if (/(low stock|below 10|need restock|restock|stock alert)/.test(text)) {
    if (lowStockItems.length === 0) {
      return "There are no low-stock medicines right now.\nএখন কোনো কম স্টক ওষুধ নেই।";
    }

    const list = lowStockItems.map((item) => `${item.name} (${item.quantity} left)`).join("\n");
    return `Low-stock medicines:\n${list}\n\nThese items need attention soon.\nএই ওষুধগুলো শীঘ্রই রি-স্টক করার দরকার।`;
  }

  if (/(bill|invoice|receipt|payment|pay|sales|revenue|income)/.test(text)) {
    return `There are ${billCount} bills in the system.\nTotal revenue: ₹ ${totalRevenue.toFixed(2)}.\nLatest bill: ${latestBill?.bill_id || "N/A"}.\n\nসিস্টেমে ${billCount}টি বিল আছে।\nমোট আয়: ₹ ${totalRevenue.toFixed(2)}।\nসর্বশেষ বিল: ${latestBill?.bill_id || "N/A"}।`;
  }

  if (/(stock|medicine|inventory|quantity|item)/.test(text)) {
    return `There are ${stockCount} medicines in stock.\nLow-stock items: ${lowStockItems.length}.\n\nসিস্টেমে ${stockCount}টি ওষুধ আছে।\nকম স্টক ওষুধ: ${lowStockItems.length}টি।`;
  }

  if (/(customer|customers|client|buyer|people)/.test(text)) {
    return `Customer records available: ${customerCount}.\n\nগ্রাহকের রেকর্ড সংখ্যা: ${customerCount}টি।`;
  }

  if (/(staff|employee|worker|register)/.test(text)) {
    return "Staff details can be managed from the Staff section.\nকর্মী তথ্য Staff সেকশনে পরিচালনা করা যায়।";
  }

  if (/(hello|hi|hey|help|what can you do)/.test(text)) {
    return "Hello! I can help with billing, stock, customers, and staff. Try asking about bills, low stock, revenue, or customer count.\nনমস্কার! আমি বিলিং, স্টক, গ্রাহক ও কর্মী নিয়ে সাহায্য করতে পারি।";
  }

  return `I can answer using current pharmacy data.\nTry: “show low stock”, “how many bills”, “show revenue”, or “customer count”.\nআমি বর্তমান ডেটা ব্যবহার করে উত্তর দিতে পারি।`;
}

async function chatbotMessage(req, res) {
  try {
    const { message } = req.body;
    return res.json({ reply: await getChatbotReply(message) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ reply: "Sorry, I could not answer right now.\nদুঃখিত, আমি এই মুহূর্তে উত্তর দিতে পারছিনা।" });
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

export { showBillingPage, generateBill, AllCustomer, chatbotMessage };