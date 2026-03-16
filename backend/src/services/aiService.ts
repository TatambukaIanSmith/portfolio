import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';

export interface AiAnalysisResult {
  priority: 'High' | 'Medium' | 'Low';
  summary: string;
  category: string;
}

export class AiService {
  private genAI: GoogleGenerativeAI | null = null;

  constructor() {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
      logger.info('✅ Google Gemini AI service initialized');
    } else {
      logger.warn('⚠️  Google Gemini API key not provided. AI analysis will be disabled.');
    }
  }

  /**
   * Analyze a lead using Google Gemini AI
   */
  async analyzeLead(name: string, email: string, message: string, type: 'contact' | 'project' = 'contact'): Promise<AiAnalysisResult> {
    if (!this.genAI) {
      // Fallback analysis when AI is not available
      return this.getFallbackAnalysis(message, type);
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });

      const prompt = `
        Analyze this inquiry for Ian Smith (Elite Full-Stack Engineer). Provide a JSON analysis including priority (High, Medium, Low), a 1-sentence executive summary, and a category.
        
        Name: ${name}
        Email: ${email}
        Type: ${type}
        Message: ${message}
        
        Consider these factors for priority:
        - High: Mentions specific project needs, budget, timeline, or urgent requirements
        - Medium: General inquiries with some project details or business context
        - Low: Basic contact requests or vague inquiries
        
        Categories should be one of: Web Development, Mobile App, Consulting, Maintenance, Design, General Inquiry
        
        Respond with valid JSON only:
        {
          "priority": "High|Medium|Low",
          "summary": "One sentence executive summary",
          "category": "Category name"
        }
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse JSON response
      try {
        const analysis = JSON.parse(text);
        
        // Validate response structure
        if (!analysis.priority || !analysis.summary || !analysis.category) {
          throw new Error('Invalid AI response structure');
        }

        // Validate priority value
        if (!['High', 'Medium', 'Low'].includes(analysis.priority)) {
          analysis.priority = 'Medium'; // Default fallback
        }

        logger.info('AI analysis completed successfully', {
          priority: analysis.priority,
          category: analysis.category
        });

        return analysis;
      } catch (parseError) {
        logger.error('Failed to parse AI response:', parseError);
        return this.getFallbackAnalysis(message, type);
      }
    } catch (error) {
      logger.error('AI analysis failed:', error);
      return this.getFallbackAnalysis(message, type);
    }
  }

  /**
   * Fallback analysis when AI is not available or fails
   */
  private getFallbackAnalysis(message: string, type: 'contact' | 'project'): AiAnalysisResult {
    const messageLower = message.toLowerCase();
    
    // Simple keyword-based analysis
    let priority: 'High' | 'Medium' | 'Low' = 'Medium';
    let category = 'General Inquiry';

    // Priority detection
    const highPriorityKeywords = [
      'urgent', 'asap', 'immediately', 'deadline', 'budget', 'project', 
      'hire', 'need help', 'looking for', 'quote', 'estimate'
    ];
    
    const lowPriorityKeywords = [
      'just wondering', 'curious', 'maybe', 'thinking about', 'general question'
    ];

    if (highPriorityKeywords.some(keyword => messageLower.includes(keyword))) {
      priority = 'High';
    } else if (lowPriorityKeywords.some(keyword => messageLower.includes(keyword))) {
      priority = 'Low';
    }

    // Category detection
    if (messageLower.includes('web') || messageLower.includes('website')) {
      category = 'Web Development';
    } else if (messageLower.includes('mobile') || messageLower.includes('app')) {
      category = 'Mobile App';
    } else if (messageLower.includes('consult') || messageLower.includes('advice')) {
      category = 'Consulting';
    } else if (messageLower.includes('maintain') || messageLower.includes('fix')) {
      category = 'Maintenance';
    } else if (messageLower.includes('design') || messageLower.includes('ui')) {
      category = 'Design';
    } else if (type === 'project') {
      category = 'Web Development'; // Default for project type
    }

    const summary = `${type === 'project' ? 'Project' : 'Contact'} inquiry regarding ${category.toLowerCase()} with ${priority.toLowerCase()} priority.`;

    logger.info('Fallback analysis completed', { priority, category });

    return { priority, summary, category };
  }

  /**
   * Check if AI service is available
   */
  isAvailable(): boolean {
    return this.genAI !== null;
  }
}