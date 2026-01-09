import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function enhanceResumeWithAI(extractedText) {
  if (!extractedText || extractedText.trim().length === 0) {
    throw new Error("No resume text provided to AI");
  }

const prompt = `
You are an expert technical recruiter and resume reviewer.

TASK:
Analyze the resume below and provide HIGH-QUALITY, ACTIONABLE
resume enhancement feedback.

IMPORTANT:
- Do NOT rewrite the full resume
- Do NOT repeat the original resume content
- Do NOT restate projects or experience verbatim
- Focus ONLY on improvements and guidance

WHAT TO DO:
- Suggest improved bullet examples (rewrite 2–3 bullets only as examples)
- Identify missing or weak skills
- Point out ATS optimization issues
- Highlight red flags or gaps
- Give clear, concrete improvement advice

OUTPUT FORMAT (STRICT):

1. Bullet Point Improvements (with examples)
2. Skills to Add or Strengthen
3. ATS Optimization Suggestions
4. Formatting & Structure Issues
5. Red Flags / Risks (if any)

RULES:
- Be specific
- Be concise
- Be practical
- No generic advice
- No filler text

RESUME:
${extractedText}
`;



  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.4,          
    max_tokens: 1200,          // allows full rewrite
    messages: [
      {
        role: "system",
        content: "You are a world-class  writer for tech professionals."
      },
      {
        role: "user",
        content: prompt
      }
    ]
  });

  return {
    success: true,
    enhancedText: response.choices[0].message.content.trim()
  };
}
