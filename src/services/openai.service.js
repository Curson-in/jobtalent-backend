import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function enhanceResumeWithAI(extractedText) {
  if (!extractedText || extractedText.trim().length === 0) {
    throw new Error("No resume text provided to AI");
  }

const prompt = `
You are a SENIOR TECH RECRUITER, ATS SPECIALIST, and CAREER COACH
with experience reviewing 10,000+ software engineering resumes.

This is a PAID, PREMIUM resume enhancement feature.

GOAL:
Provide a DEEP, HIGH-VALUE, ACTIONABLE resume improvement report.
This is NOT a rewrite of the resume.
This IS a professional coaching document.

IMPORTANT RULES:
- DO NOT include the candidate's name
- DO NOT repeat the original resume text
- DO NOT rewrite the full resume
- DO NOT keep it short
- DO NOT be generic

ABSOLUTE OUTPUT RULES (MANDATORY):
- DO NOT use Markdown
- DO NOT use #, ##, ### anywhere
- DO NOT use quotation marks " "
- DO NOT wrap text in quotes
- Use plain professional report formatting only
- Section titles must be plain text (NO symbols)
- Use numbered sections like: 1. TITLE
- Use bullet points with dash (-) only


QUALITY BAR (VERY IMPORTANT):
- Output must feel like a detailed resume audit
- Each section must be MULTI-PARAGRAPH or MULTI-BULLET
- Provide concrete examples, explanations, and reasoning
- Assume the user is serious about job hunting

========================
OUTPUT FORMAT (STRICT)
========================

AI RESUME ENHANCEMENT REPORT

1. PROFESSIONAL SUMMARY – HOW TO IMPROVE
Explain:
- What a strong summary should communicate
- What is likely missing or weak
- Provide 2–3 HIGH-QUALITY example summaries (NOT copied from resume)

2. EXPERIENCE SECTION – BULLET POINT TRANSFORMATION
For EACH example:
- Show a weak/common bullet (generic example)
- Show a STRONG improved version
- Explain WHY the improved version is better
Provide at least 5–7 bullet transformations.

3. PROJECTS SECTION – DEPTH & IMPACT
Explain:
- How projects should be structured
- What recruiters look for in project descriptions
- How to quantify impact
Provide 3–4 example project bullets with metrics.

4. SKILLS SECTION – WHAT TO ADD / REMOVE / REORGANIZE
Explain:
- Missing technical skills based on the resume
- Skills that should be grouped or reordered
- ATS-friendly skill categorization
Provide a sample optimized skills layout.

5. ATS OPTIMIZATION – VERY IMPORTANT
Explain in detail:
- Keyword strategy
- Job title alignment
- Formatting rules ATS systems prefer
- Common ATS mistakes to avoid

6. FORMATTING & STRUCTURE REVIEW
Explain:
- Ideal resume length
- Section order for this profile
- Font, spacing, bullet consistency
- PDF vs DOCX considerations

7. RED FLAGS, GAPS & RISKS (IF ANY)
Explain:
- Any career risks visible
- Missing experience signals
- How to mitigate these risks strategically

8. FINAL RECRUITER ADVICE
Provide:
- Clear next steps
- How to customize resume per job
- How to stand out in interviews using this resume

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
