export const LIMITS = {
  taskTitle: 200,         // chars
  taskContext: 1000,      // chars
  chatMessage: 500,       // chars
  subtaskTitle: 150,      // chars
  habitName: 50,          // chars
  totalTasksPerUser: 100, // max tasks in Firestore
  subtasksPerTask: 20,    // max subtasks
  chatHistoryLength: 20,  // max messages kept
  geminiMaxTokens: 1000,  // max output tokens
  fileUploadSize: 0,      // no file uploads allowed
};

// Before any Firestore write:
export function validatePayloadSize(data: any): boolean {
  try {
    const json = JSON.stringify(data);
    // Max 50KB per document
    if (json.length > 50000) {
      throw new Error('Payload too large');
    }
  } catch (e) {
    // If circular structure or other serialization error occurs, block it as unsafe
    throw new Error('Payload validation failed');
  }
  return true;
}

// Before Gemini API call:
export function truncateForGemini(text: string, maxChars = 2000): string {
  if (typeof text !== 'string') return '';
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars) + '... [truncated]';
}
