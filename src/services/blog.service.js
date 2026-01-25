import pool from "../config/database.js";

/* ================= BLOGS ================= */

export async function getBlogs() {
  // FIX 1: Added a subquery to count comments and aliased it as "commentCount"
  // FIX 2: Concatenated first_name + last_name as "author"
  const { rows } = await pool.query(`
    SELECT 
      b.*, 
      u.first_name || ' ' || u.last_name AS author,
      (SELECT COUNT(*) FROM blog_comments WHERE blog_id = b.id)::int AS "commentCount"
    FROM blogs b
    JOIN users u ON u.id = b.user_id
    ORDER BY b.created_at DESC
  `);
  return rows;
}

export async function createBlog(userId, { title, content, tags }) {
  const { rows } = await pool.query(
    `
    INSERT INTO blogs (user_id, title, content, tags)
    VALUES ($1, $2, $3, $4)
    RETURNING *
    `,
    [userId, title, content, tags]
  );
  
  // Fetch the author name for the UI immediately
  const userRes = await pool.query(`SELECT first_name, last_name FROM users WHERE id=$1`, [userId]);
  const authorName = userRes.rows[0].first_name + ' ' + userRes.rows[0].last_name;
  
  return { ...rows[0], author: authorName };
}

/* ================= VOTES ================= */

export async function voteBlog(userId, blogId, vote) {
  await pool.query(
    `
    INSERT INTO blog_votes (user_id, blog_id, vote)
    VALUES ($1, $2, $3)
    ON CONFLICT (user_id, blog_id)
    DO UPDATE SET vote = $3
    `,
    [userId, blogId, vote]
  );

  // Recalculate counts on the blog table
  await pool.query(
    `
    UPDATE blogs
    SET
      upvotes = (SELECT COUNT(*) FROM blog_votes WHERE blog_id=$1 AND vote=1),
      downvotes = (SELECT COUNT(*) FROM blog_votes WHERE blog_id=$1 AND vote=-1)
    WHERE id=$1
    `,
    [blogId]
  );
}

/* ================= COMMENTS ================= */

export async function addComment(userId, blogId, comment, parentId) {
  // FIX 3: Added parentId to the INSERT so threading works in DB
  const { rows } = await pool.query(
    `
    INSERT INTO blog_comments (blog_id, user_id, comment, parent_id)
    VALUES ($1, $2, $3, $4)
    RETURNING *
    `,
    [blogId, userId, comment, parentId]
  );

  const newComment = rows[0];

  // FIX 4: Fetch the user's name immediately so the UI shows "Shrawan" instead of "Anonymous"
  const userRes = await pool.query(`SELECT first_name, last_name FROM users WHERE id=$1`, [userId]);
  newComment.author = userRes.rows[0].first_name + ' ' + userRes.rows[0].last_name;

  return newComment;
}

export async function getComments(blogId) {
  // FIX 5: Format the name as "author" so the frontend can read it easily
  const { rows } = await pool.query(
    `
    SELECT c.*, u.first_name || ' ' || u.last_name AS author
    FROM blog_comments c
    JOIN users u ON u.id = c.user_id
    WHERE blog_id=$1
    ORDER BY c.created_at ASC
    `,
    [blogId]
  );
  return rows;
}