import * as blogService from "../services/blog.service.js";

export async function listBlogs(req, res) {
  try {
    const blogs = await blogService.getBlogs();
    res.json(blogs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function createBlog(req, res) {
  try {
    const blog = await blogService.createBlog(req.user.id, req.body);
    res.status(201).json(blog);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function vote(req, res) {
  try {
    const { blogId, vote } = req.body;
    await blogService.voteBlog(req.user.id, blogId, vote);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function addComment(req, res) {
  try {
    const comment = await blogService.addComment(
      req.user.id,
      req.body.blogId,
      req.body.comment,
      req.body.parentId // <--- CRITICAL: Passing parentId for threads
    );
    res.json(comment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function comments(req, res) {
  try {
    const rows = await blogService.getComments(req.params.blogId);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}