import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { ChatMessages } from '../db/mongo.js';
import { askGeminiAssistant, buildStudentContext } from '../services/gemini.js';

export async function chatWithAI(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      res.status(400).json({ error: 'Please enter a valid question or study topic.' });
      return;
    }

    const cleanPrompt = prompt.trim();
    const user = req.user;

    // 1. Save user turn in database
    await ChatMessages.create({
      userId: user._id,
      role: 'user',
      message: cleanPrompt,
    });

    // 2. Fetch authenticated student context (enrolled subjects, scheduled exams, assignments, planner tasks)
    let academicContext = null;
    if (user.role === 'student') {
      academicContext = await buildStudentContext(user._id);
    }

    // 3. Query Gemini via @google/genai SDK
    let reply = '';
    try {
      reply = await askGeminiAssistant(cleanPrompt, user, academicContext);
    } catch (aiErr: any) {
      console.error('Gemini API invocation error:', aiErr);
      // Give a helpful message rather than generic obscure error
      if (!process.env.GEMINI_API_KEY) {
        reply = 'Academic Assistant is currently running without an active Gemini API key. Please configure GEMINI_API_KEY in the environment secrets to enable live generative AI responses.';
      } else {
        reply = `The AI Academic Assistant encountered a service issue: ${aiErr?.message || 'Gemini service is temporarily unavailable'}. Please try your question again in a moment.`;
      }
    }

    // 4. Save model turn in database
    const modelMessage = await ChatMessages.create({
      userId: user._id,
      role: 'model',
      message: reply,
    });

    res.json({
      reply,
      messageId: modelMessage._id,
      createdAt: modelMessage.createdAt,
    });
  } catch (err: any) {
    console.error('chatWithAI error:', err);
    res.status(500).json({ error: 'An unexpected error occurred while communicating with the AI Assistant.' });
  }
}

export async function getChatHistory(req: AuthRequest, res: Response): Promise<void> {
  try {
    const messages = await ChatMessages.find(
      { userId: req.user._id },
      { sort: { createdAt: 1 } }
    );
    res.json({ messages });
  } catch (err) {
    console.error('getChatHistory error:', err);
    res.status(500).json({ error: 'Failed to retrieve AI chat history.' });
  }
}

export async function clearChatHistory(req: AuthRequest, res: Response): Promise<void> {
  try {
    const deletedCount = await ChatMessages.deleteMany({ userId: req.user._id });
    res.json({
      success: true,
      message: 'Chat history cleared successfully.',
      deletedCount,
    });
  } catch (err) {
    console.error('clearChatHistory error:', err);
    res.status(500).json({ error: 'Failed to clear chat history.' });
  }
}
