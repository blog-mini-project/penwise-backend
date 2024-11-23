import express from 'express'
import slugify from 'slugify'
import Article from '../models/Article.js'
import { auth } from '../middleware/auth.js'

const router = express.Router()

router.post('/', auth, async (req, res) => {
  try {
    const { title, content, excerpt, tags, coverImage } = req.body

    if (coverImage && !coverImage.startsWith('data:image/')) {
      return res.status(400).json({ message: 'Invalid image format' })
    }

    const slug = slugify(title, { lower: true })

    const article = new Article({
      title,
      content,
      excerpt,
      slug,
      author: req.user.userId,
      tags: JSON.parse(tags),
      coverImage
    })

    await article.save()
    await article.populate('author', 'username avatar')
    res.status(201).json(article)
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
})

router.get('/', async (req, res) => {
  try {
    const articles = await Article.find()
      .populate('author', 'username avatar')
      .sort({ createdAt: -1 })
    res.json(articles)
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
})

router.get('/:slug', async (req, res) => {
  try {
    const article = await Article.findOne({ slug: req.params.slug })
      .populate('author', 'username avatar bio')
      .populate('comments.user', 'username avatar')
    
    if (!article) {
      return res.status(404).json({ message: 'Article not found' })
    }
    
    res.json(article)
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
})

router.put('/:id', auth, async (req, res) => {
  try {
    const article = await Article.findById(req.params.id)
    
    if (!article) {
      return res.status(404).json({ message: 'Article not found' })
    }
    
    if (article.author.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized' })
    }

    const { title, content, excerpt, tags } = req.body
    const slug = slugify(title, { lower: true })

    article.title = title
    article.content = content
    article.excerpt = excerpt
    article.slug = slug
    article.tags = tags

    await article.save()
    await article.populate('author', 'username avatar')
    res.json(article)
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
})

router.post('/:id/like', auth, async (req, res) => {
  try {
    const article = await Article.findById(req.params.id)
    
    if (!article) {
      return res.status(404).json({ message: 'Article not found' })
    }

    const likeIndex = article.likes.indexOf(req.user.userId)
    
    if (likeIndex > -1) {
      article.likes.splice(likeIndex, 1)
    } else {
      article.likes.push(req.user.userId)
    }

    await article.save()
    res.json({ likes: article.likes })
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
})

router.post('/:id/comments', auth, async (req, res) => {
  try {
    const article = await Article.findById(req.params.id)
    
    if (!article) {
      return res.status(404).json({ message: 'Article not found' })
    }

    article.comments.push({
      user: req.user.userId,
      content: req.body.content,
    })

    await article.save()
    await article.populate('comments.user', 'username avatar')
    res.json(article.comments)
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
})

export default router