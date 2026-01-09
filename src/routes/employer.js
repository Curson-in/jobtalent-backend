import { getTalentProfilesForEmployer } from "../controllers/talentBrowseController.js";
import { authMiddleware } from "../middleware/auth.js";

router.get("/talents", authMiddleware, getTalentProfilesForEmployer);