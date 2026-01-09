// backend/src/services/jobMatchService.js

function stableJobVariance(jobId, max = 6) {
  let hash = 0;
  const str = jobId.toString();
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash % max); // 0 → max-1
}

export function calculateJobMatch({ job, jobSkills, profile }) {
  const WEIGHTS = {
    skills: 50,
    experience: 25,
    location: 10,
    profile: 15
  };

  let score = 0;

  /* =====================
     SKILLS MATCH (50%)
  ===================== */
  const userSkills = (profile.skills || []).map(s => s.toLowerCase());
  const requiredSkills = (jobSkills || []).map(s => s.toLowerCase());

  const matchedSkills = requiredSkills.filter(s =>
    userSkills.includes(s)
  );

  const missingSkills = requiredSkills.filter(
    s => !matchedSkills.includes(s)
  );

  const matchedSkillWeight = matchedSkills.length * 1.15; // reward overlap

  const skillsScore =
    requiredSkills.length > 0
      ? (matchedSkillWeight / requiredSkills.length) * WEIGHTS.skills
      : WEIGHTS.skills;

  score += skillsScore;

  /* =====================
     EXPERIENCE (25%)
  ===================== */
  if (job.min_experience && profile.experience) {
    if (profile.experience >= job.min_experience) {
      score += WEIGHTS.experience;
    } else {
      score +=
        (profile.experience / job.min_experience) *
        WEIGHTS.experience;
    }
  }

  /* =====================
     LOCATION (10%)
  ===================== */
  if (
    profile.city &&
    job.location &&
    job.location.toLowerCase().includes(profile.city.toLowerCase())
  ) {
    score += WEIGHTS.location;
  } else if (job.location?.toLowerCase().includes('remote')) {
    score += 7;
  }

  /* =====================
     PROFILE COMPLETENESS (15%)
  ===================== */
  const fields = [
    profile.skills?.length,
    profile.resume,
    profile.summary,
    profile.experience,
    profile.education
  ];

  const filled = fields.filter(Boolean).length;
  score += (filled / fields.length) * WEIGHTS.profile;

  /* =====================
     PENALTIES
  ===================== */
  const missingPenalty = Math.min(missingSkills.length * 2, 10);
  score -= missingPenalty;

  /* =====================
     FINAL SCORE
  ===================== */
  const variance = stableJobVariance(job.id); // 0–5
  let finalScore = Math.round(score + variance);

  // Clamp for realism
  finalScore = Math.max(30, Math.min(95, finalScore));

  let probability = 'Weak';
  if (finalScore >= 70) probability = 'Strong';
  else if (finalScore >= 50) probability = 'Medium';

  return {
    matchScore: finalScore,
    probability,
    missingSkills
  };
}
