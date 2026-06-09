const express = require("express");
const router = require("express").Router();
const axios = require("axios");
const dotenv = require("dotenv");
const { generateJWT } = require("./auth");

dotenv.config();

const CATEGORIES = {
  food:          ["restaurant", "cafe", "coffee", "pizza", "burger", "sushi", "grocery", "supermarket", "lidl", "aldi", "k-market", "s-market"],
  transport:     ["uber", "bolt", "taxi", "bus", "train", "metro", "fuel", "petrol", "parking", "vr", "hsl"],
  shopping:      ["amazon", "zalando", "h&m", "primark", "ikea", "stadium", "verkkokauppa"],
  utilities:     ["electricity", "water", "internet", "phone", "elisa", "dna", "telia", "helen"],
  health:        ["pharmacy", "doctor", "hospital", "gym", "fitness", "apteekki"],
  travel:        ["hotel", "airbnb", "flight", "finnair", "booking"],
  entertainment: ["netflix", "spotify", "steam", "cinema", "hbo", "disney"],
  income:        ["salary", "palkka", "freelance", "invoice", "refund"],
};

const CO2_FACTORS = {
  food: 0.005, transport: 0.021, shopping: 0.008,
  utilities: 0.003, health: 0.002, travel: 0.035,
  entertainment: 0.001, income: 0, other: 0.004,
};

function extractDescription(tx) {
  const ri = tx.remittance_information;
  if (Array.isArray(ri) && ri.length > 0) return ri[0];
  if (ri && typeof ri === "object") return ri.unstructured || null;
  if (typeof ri === "string" && ri.trim()) return ri.trim();
  return tx.note || tx.entry_reference || null;
}

function categorise(description) {
  if (!description) return "other";
  const text = description.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORIES)) {
    if (keywords.some(k => text.includes(k))) return category;
  }
  return "other";
}

function calculateCO2(amount, category) {
  const factor = CO2_FACTORS[category] || CO2_FACTORS.other;
  return parseFloat((Math.abs(parseFloat(amount) || 0) * factor).toFixed(3));
}

function getType(tx, amount) {
  if (tx.credit_debit_indicator === "DBIT") return "debit";
  if (tx.credit_debit_indicator === "CRDT") return "credit";
  if (tx.creditDebitIndicator === "DBIT") return "debit";
  if (tx.creditDebitIndicator === "CRDT") return "credit";
  return parseFloat(amount) >= 0 ? "credit" : "debit";
}

router.get("/:account_uid", async (req, res) => {
  try {
    const { account_uid } = req.params;
    const { date_from, date_to } = req.query;
    const token = generateJWT();
    const params = {};
    if (date_from) params.date_from = date_from;
    if (date_to) params.date_to = date_to;

    const response = await axios.get(
      process.env.ENABLE_BANKING_API + "/accounts/" + account_uid + "/transactions",
      { headers: { Authorization: "Bearer " + token }, params }
    );

    const raw = response.data;
    const txList = raw.transactions || raw.booked || [];
    const pending = raw.pending || [];
    const allTx = [...txList, ...pending];

    const enriched = allTx.map(tx => {
      const amount = tx.transaction_amount?.amount || "0";
      const type = getType(tx, amount);
      const description = extractDescription(tx);
      const category = categorise(description);
      const co2 = calculateCO2(amount, category);
      const finalAmount = type === "debit" ? -Math.abs(parseFloat(amount)) : Math.abs(parseFloat(amount));
      return {
        id: tx.transaction_id || tx.internal_transaction_id || tx.entry_reference || Math.random().toString(36),
        date: tx.booking_date || tx.value_date,
        amount: finalAmount,
        currency: tx.transaction_amount?.currency || "EUR",
        description: description || "Transaction",
        creditor: tx.creditor?.name || null,
        debtor: tx.debtor?.name || null,
        category,
        co2_kg: co2,
        type,
      };
    });

    const debits = enriched.filter(t => t.type === "debit");
    const credits = enriched.filter(t => t.type === "credit");
    const totalSpent = debits.reduce((s, t) => s + Math.abs(t.amount), 0);
    const totalIncome = credits.reduce((s, t) => s + t.amount, 0);
    const totalCO2 = enriched.reduce((s, t) => s + t.co2_kg, 0);
    const byCategory = {};
    for (const tx of debits) {
      byCategory[tx.category] = (byCategory[tx.category] || 0) + Math.abs(tx.amount);
    }

    res.json({
      transactions: enriched,
      summary: {
        total_transactions: enriched.length,
        total_spent: parseFloat(totalSpent.toFixed(2)),
        total_income: parseFloat(totalIncome.toFixed(2)),
        total_co2_kg: parseFloat(totalCO2.toFixed(3)),
        by_category: byCategory,
      }
    });

  } catch (error) {
    console.error("Transactions error:", JSON.stringify(error.response?.data) || error.message);
    res.status(500).json({ error: "Failed to fetch transactions", detail: error.response?.data || error.message });
  }
});

module.exports = router;
