'use strict';

// ─── 1. Setup Mocks ──────────────────────────────────────────────────────────
const mockEmbedCreate = jest.fn();
const mockChatCreate = jest.fn();

// Mock the OpenAI constructor
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    embeddings: { create: mockEmbedCreate },
    chat: { completions: { create: mockChatCreate } }
  }));
});

jest.mock('../models/MassageShop');
jest.mock('../models/MassageService');

const MassageShop = require('../models/MassageShop');
const MassageService = require('../models/MassageService');
const { chat, buildVectorStore, resetVectorStore } = require('../utils/chatbot');

// ─── 2. Mock Data ────────────────────────────────────────────────────────────
const SHOP_ID = '663000000000000000000001';
const SERVICE_ID = '663000000000000000000002';

const mockShop = {
  _id: { toString: () => SHOP_ID },
  name: 'Dungeon Spa',
  location: 'Siam',
  address: '123 Siam Square',
  searchArea: 'Siam',
  openTime: '10:00',
  closeTime: '22:00',
  priceRangeMin: 500,
  priceRangeMax: 1500,
  tiktokLinks: [],
  // ADDED: These bypass the GPT translation call so tests don't crash
  nameTh: 'ดันเจี้ยนสปา',
  locationTh: 'สยาม',
  searchAreaTh: 'สยาม'
};

const mockService = {
  _id: { toString: () => SERVICE_ID },
  shop: { toString: () => SHOP_ID },
  name: 'Thai Massage',
  area: 'Massage',
  duration: 60,
  price: 500,
  description: 'Traditional deep tissue massage.',
  // ADDED: These bypass the GPT translation call
  nameTh: 'นวดแผนไทย',
  areaTh: 'นวด'
};

// Create a dummy 1536-dimensional array for text-embedding-3-small
const dummyEmbedding = Array(1536).fill(0.1);

// ─── 3. Test Suite ───────────────────────────────────────────────────────────
describe('Chatbot AI Utility', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    resetVectorStore();
    
    // Default DB Mock Returns
    MassageShop.find = jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue([mockShop])
    });
    MassageService.find = jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue([mockService])
    });

    // CRITICAL FIX: Dynamic OpenAI Embedding Mock
    // Checks how many chunks the app wants to embed, and returns exactly that many dummy arrays.
    mockEmbedCreate.mockImplementation((params) => {
      const inputCount = Array.isArray(params.input) ? params.input.length : 1;
      const data = Array(inputCount).fill({ embedding: dummyEmbedding });
      return Promise.resolve({ data });
    });
  });

  it('TC-CB1: Should build the vector store successfully (Story 3: KB Currency)', async () => {
    await buildVectorStore();

    expect(MassageShop.find).toHaveBeenCalled();
    expect(MassageService.find).toHaveBeenCalled();
    expect(mockEmbedCreate).toHaveBeenCalled();
  });

  it('TC-CB2: Should process a chat message and return LLM response (Story 1: Recommendations)', async () => {
    const mockReply = "I recommend Dungeon Spa in Siam! Would you like to book the Thai Massage?";
    mockChatCreate.mockResolvedValue({
      choices: [{ message: { content: mockReply } }]
    });

    const response = await chat("I need a massage near Siam", [], null, null);

    expect(mockEmbedCreate).toHaveBeenCalled(); 
    expect(mockChatCreate).toHaveBeenCalled();
    expect(response).toBe(mockReply);
  });

  it('TC-CB3: Should inject user reservation status into context (Preventing overlaps)', async () => {
    mockChatCreate.mockResolvedValue({
      choices: [{ message: { content: "You already have bookings." } }]
    });

    const userContext = {
      activeCount: 1,
      slotsRemaining: 2,
      reservations: [{
        id: 'resv_123', shop: 'Dungeon Spa', service: 'Thai Massage',
        duration: 60, price: 500, date: '2026-04-20', endTime: '2026-04-20',
        status: 'pending', hoursUntil: 48, canModify: true
      }]
    };

    await chat("Can I book another session?", [], userContext, null);

    const openAICallArgs = mockChatCreate.mock.calls[0][0];
    const systemPrompt = openAICallArgs.messages[0].content;
    
    expect(systemPrompt).toContain('USER RESERVATION STATUS');
    expect(systemPrompt).toContain('resv_123');
  });

  it('TC-CB4: Should pin a specific shop if mentioned in history (Story 4: ID Accuracy)', async () => {
    MassageShop.findById = jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue(mockShop)
    });
    
    MassageShop.find = jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue([mockShop])
    });

    mockChatCreate.mockResolvedValue({
      choices: [{ message: { content: `[[BOOK:{"shopId":"${SHOP_ID}","serviceId":"${SERVICE_ID}"}]]` } }]
    });

    const history = [
      { role: 'assistant', content: 'Here is the shop: /shop/' + SHOP_ID }
    ];

    const response = await chat("Book a thai massage here", history, null, null);

    expect(response).toContain('[[BOOK:');
    
    const openAICallArgs = mockChatCreate.mock.calls[0][0];
    const systemPrompt = openAICallArgs.messages[0].content;
    expect(systemPrompt).toContain('--- PINNED SHOP');
    expect(systemPrompt).toContain(SHOP_ID);
  });
});