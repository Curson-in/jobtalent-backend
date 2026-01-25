import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function enhanceResumeWithAI(extractedText) {
  if (!extractedText || extractedText.trim().length === 0) {
    throw new Error("No resume text provided to AI");
  }

  // UPDATED PROMPT: Focused on Layout, Spacing, and readability
  const prompt = `
You are a SENIOR TECH RECRUITER and CAREER COACH.
This is a PAID PREMIUM REPORT. The output must be visually spacious and easy to read.

GOAL: Provide a deep, actionable resume audit.

FORMATTING RULES (STRICT):
1. SECTIONS: Start every main section with a Number (e.g., "1. PROFESSIONAL SUMMARY").
2. SPACING: You MUST put TWO empty lines between major sections.
3. SUB-POINTS: Use a simple dash "- " for bullet points.
4. PARAGRAPHS: Put ONE empty line between paragraphs for readability.
5. NO MARKDOWN: Do not use **, ##, or other symbols. Just plain text with good spacing.

STRUCTURE OF THE REPORT:

1. PROFESSIONAL SUMMARY – AUDIT & EXAMPLES
   - Critique the current summary.
   - Provide 2 HIGH-IMPACT example summaries.

2. EXPERIENCE SECTION – BEFORE VS AFTER
   - Select 3 weak bullet points from the resume.
   - Show the "Before" (Weak) version.
   - Show the "After" (Strong) version.
   - Explain the "Why".

3. PROJECT IMPACT ANALYSIS
   - How to better quantify these projects.
   - Provide 3 example bullet points with metrics (numbers/%).

4. SKILLS GAP ANALYSIS
   - What key tech stack keywords are missing?
   - How to group skills for ATS readability.

5. ATS COMPLIANCE CHECK
   - formatting risks found.
   - keyword stuffing advice.

6. FINAL RECRUITER VERDICT
   - One paragraph on immediate next steps.

RESUME TEXT TO ANALYZE:
${extractedText}
`;

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini", // Cost effective, high quality
    temperature: 0.5,           
    max_tokens: 1500,          
    messages: [
      {
        role: "system",
        content: "You are a professional resume writer. Output clean, spacious, plain text reports."
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