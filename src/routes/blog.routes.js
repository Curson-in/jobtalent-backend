import express from "express";
import pool from "../config/database.js";
import { authMiddleware, optionalAuth } from "../middleware/auth.js";
import { isContentSafe } from "../services/moderationService.js";

const router = express.Router();

/* =======================
   GET ALL BLOGS (LIST)
======================= */
router.get("/blogs", optionalAuth, async (req, res) => {
  const { rows } = await pool.query(`
    SELECT 
      b.id, b.title,
      LEFT(b.content, 300) AS excerpt,
      b.tags, b.upvotes, b.downvotes,
      b.created_at,
      u.first_name AS author,  -- CHANGED: Only fetching first_name
      (SELECT COUNT(*) FROM blog_comments WHERE blog_id = b.id)::int AS "commentCount"
    FROM blogs b
    JOIN users u ON u.id = b.user_id
    ORDER BY b.created_at DESC
  `);

  res.json(rows);
});

router.get("/blogs/mine", authMiddleware, async (req, res) => {
  const { rows } = await pool.query(`
    SELECT id, title, created_at, upvotes 
    FROM blogs
    WHERE user_id = $1
    ORDER BY created_at DESC
  `, [req.user.id]);
  res.json(rows);
});

/* =======================
   GET SINGLE BLOG
======================= */
router.get("/blogs/:id", optionalAuth, async (req, res) => {
  const { id } = req.params;

  const { rows } = await pool.query(`
    SELECT b.*, u.first_name AS author -- CHANGED: Only fetching first_name
    FROM blogs b
    JOIN users u ON u.id = b.user_id
    WHERE b.id = $1
  `, [id]);

  res.json(rows[0]);
});



/* =======================
   CREATE BLOG
======================= */
router.post("/blogs", authMiddleware, async (req, res) => {
  const { title, content, tags } = req.body;

  // 1. COMBINE TEXT TO CHECK
  const textToCheck = `${title}\n${content}`;

  // 2. RUN AI SAFETY CHECK
  const isSafe = await isContentSafe(textToCheck);

  if (!isSafe) {
    return res.status(400).json({ 
      error: "Your post contains content that violates our Community Guidelines (Hate speech, harassment, or inappropriate language)." 
    });
  }

  // 3. IF SAFE, PROCEED TO DATABASE
  try {
    const { rows } = await pool.query(`
      INSERT INTO blogs (user_id, title, content, tags)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [req.user.id, title, content, tags]);
    
    // Fetch author name...
    const userRes = await pool.query(`SELECT first_name FROM users WHERE id=$1`, [req.user.id]);
    
    res.json({ ...rows[0], author: userRes.rows[0].first_name });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =======================
   VOTE BLOG
======================= */
router.post("/blogs/:id/vote", authMiddleware, async (req, res) => {
  const { vote } = req.body; 
  const blogId = req.params.id;

  await pool.query(`
    INSERT INTO blog_votes (user_id, blog_id, vote)
    VALUES ($1, $2, $3)
    ON CONFLICT (user_id, blog_id)
    DO UPDATE SET vote = EXCLUDED.vote
  `, [req.user.id, blogId, vote]);

  await pool.query(`
    UPDATE blogs
    SET upvotes = (SELECT COUNT(*) FROM blog_votes WHERE blog_id=$1 AND vote=1),
        downvotes = (SELECT COUNT(*) FROM blog_votes WHERE blog_id=$1 AND vote=-1)
    WHERE id=$1
  `, [blogId]);

  res.json({ success: true });
});

/* =======================
   COMMENTS (WITH REPLIES)
======================= */
router.get("/blogs/:id/comments", async (req, res) => {
  const { rows } = await pool.query(`
    SELECT c.*, u.first_name AS author -- CHANGED: Only fetching first_name
    FROM blog_comments c
    JOIN users u ON u.id = c.user_id
    WHERE c.blog_id = $1
    ORDER BY c.created_at ASC
  `, [req.params.id]);

  res.json(rows);
});

router.post("/blogs/:id/comments", authMiddleware, async (req, res) => {
  const { comment, parent_id, parentId } = req.body;

  const { rows } = await pool.query(`
    INSERT INTO blog_comments (blog_id, user_id, comment, parent_id)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `, [req.params.id, req.user.id, comment, parent_id || parentId || null]);

  // Fetch just the first name immediately
  const userRes = await pool.query(`SELECT first_name FROM users WHERE id=$1`, [req.user.id]);
  
  res.json({ ...rows[0], author: userRes.rows[0].first_name });
});

/* =======================
   GET MY BLOGS (HISTORY)
======================= */


/* =======================
   DELETE BLOG
======================= */
/* =======================
   DELETE BLOG
======================= */
router.delete("/blogs/:id", authMiddleware, async (req, res) => {
  const blogId = req.params.id;
  const userId = req.user.id;

  try {
    // 1. Delete all comments associated with this blog
    await pool.query(`DELETE FROM blog_comments WHERE blog_id = $1`, [blogId]);

    // 2. Delete all votes associated with this blog
    await pool.query(`DELETE FROM blog_votes WHERE blog_id = $1`, [blogId]);

    // 3. Finally, delete the blog itself (only if it belongs to the user)
    const { rowCount } = await pool.query(`
      DELETE FROM blogs
      WHERE id = $1 AND user_id = $2
    `, [blogId, userId]);

    if (rowCount === 0) {
      return res.status(403).json({ error: "Unauthorized or not found" });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: "Failed to delete blog" });
  }
});

export default router;