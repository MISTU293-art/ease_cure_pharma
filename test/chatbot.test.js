import test from 'node:test';
import assert from 'node:assert/strict';
import { buildChatbotReply } from '../src/controllers/customer.controller.js';

test('chatbot answers stock questions from medicine data', () => {
  const reply = buildChatbotReply('stock of paracetamol', {
    stocks: [
      { name: 'Paracetamol', quantity: 15, sellingPrice: 20, category: 'medicine' },
    ],
    bills: [],
  });

  assert.match(reply, /Paracetamol/);
  assert.match(reply, /Current stock: 15/);
});

test('chatbot answers sales questions from bill data', () => {
  const reply = buildChatbotReply('sales of amoxicillin', {
    stocks: [{ name: 'Amoxicillin', quantity: 5, sellingPrice: 35, category: 'medicine' }],
    bills: [
      {
        amountPaid: 70,
        products: [{ name: 'Amoxicillin', quantity: 2, total: 70 }],
      },
    ],
  });

  assert.match(reply, /Amoxicillin sold/);
  assert.match(reply, /2 units/);
});

test('chatbot understands natural price questions', () => {
  const reply = buildChatbotReply('how much is paracetamol?', {
    stocks: [{ name: 'Paracetamol', quantity: 15, sellingPrice: 20, category: 'medicine' }],
    bills: [],
  });

  assert.match(reply, /selling price/i);
  assert.match(reply, /20\.00/);
});
