// Dangerous template injection patterns
const TEMPLATE_PATTERNS = [
  /\{\{[\s\S]*?\}\}/g,          // Handlebars/Jinja {{}}
  /\{%[\s\S]*?%\}/g,            // Jinja {% %}
  /<%[\s\S]*?%>/g,              // EJS/ERB <% %>
  /\$\{[\s\S]*?\}/g,            // Template literals ${}
  /#\{[\s\S]*?\}/g,             // Ruby #{} 
  /@\{[\s\S]*?\}/g,             // Various @{}
];

export function sanitizeForPrompt(userInput: any): string {
  if (!userInput) return '';
  
  let safe = String(userInput);
  
  // Remove template injection attempts
  TEMPLATE_PATTERNS.forEach(pattern => {
    safe = safe.replace(pattern, '[filtered]');
  });
  
  // Remove prompt injection attempts
  const PROMPT_INJECTIONS = [
    /ignore previous instructions/gi,
    /ignore all instructions/gi,
    /you are now/gi,
    /forget your instructions/gi,
    /new instructions:/gi,
    /system prompt/gi,
    /jailbreak/gi,
    /DAN mode/gi,
    /pretend you are/gi,
  ];
  
  PROMPT_INJECTIONS.forEach(pattern => {
    safe = safe.replace(pattern, '[filtered]');
  });
  
  return safe.slice(0, 500); // Hard length limit
}
