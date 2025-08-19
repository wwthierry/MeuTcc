// server.js
const express = require('express');
const { put, list } = require('@vercel/blob');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();
const app = express();

// Middleware para parsing de JSON
app.use(express.json());

// Simulação de banco de dados (em produção, use um banco real)
let posts = [];
let comments = {};
let likes = {};
let postIdCounter = 1;

// --- ROTAS PARA UPLOAD E ARQUIVOS ---

app.post('/api/upload', async (req, res) => {
  const filename = req.headers['x-vercel-filename'];
  
  if (!filename) {
    return res.status(400).json({ message: 'O nome do arquivo é obrigatório no cabeçalho x-vercel-filename.' });
  }
  
  try {
    const blob = await put(filename, req, {
      access: 'public',
    });
    
    res.status(200).json(blob);
  } catch (error) {
    console.error('Erro no upload:', error);
    res.status(500).json({ message: 'Erro ao fazer upload do arquivo.', error: error.message });
  }
});

app.get('/api/files', async (req, res) => {
  try {
    const { blobs } = await list();
    res.status(200).json(blobs);
  } catch (error) {
    console.error('Erro ao listar arquivos:', error);
    res.status(500).json({ message: 'Erro ao buscar a lista de arquivos.', error: error.message });
  }
});

// --- ROTAS PARA POSTS ---

// Criar um novo post
app.post('/api/posts', (req, res) => {
  const { title, description, imageUrl, author } = req.body;
  
  if (!title || !imageUrl) {
    return res.status(400).json({ message: 'Título e URL da imagem são obrigatórios.' });
  }
  
  const newPost = {
    id: postIdCounter++,
    title,
    description: description || '',
    imageUrl,
    author: author || 'Anônimo',
    createdAt: new Date().toISOString(),
    likesCount: 0,
    commentsCount: 0
  };
  
  posts.unshift(newPost); // Adiciona no início para mostrar os mais recentes primeiro
  likes[newPost.id] = [];
  comments[newPost.id] = [];
  
  res.status(201).json(newPost);
});

// Listar todos os posts
app.get('/api/posts', (req, res) => {
  const postsWithCounts = posts.map(post => ({
    ...post,
    likesCount: likes[post.id] ? likes[post.id].length : 0,
    commentsCount: comments[post.id] ? comments[post.id].length : 0
  }));
  
  res.json(postsWithCounts);
});

// Buscar um post específico
app.get('/api/posts/:id', (req, res) => {
  const postId = parseInt(req.params.id);
  const post = posts.find(p => p.id === postId);
  
  if (!post) {
    return res.status(404).json({ message: 'Post não encontrado.' });
  }
  
  const postWithDetails = {
    ...post,
    likesCount: likes[postId] ? likes[postId].length : 0,
    commentsCount: comments[postId] ? comments[postId].length : 0,
    comments: comments[postId] || [],
    likes: likes[postId] || []
  };
  
  res.json(postWithDetails);
});

// --- ROTAS PARA CURTIDAS ---

// Curtir/Descurtir um post
app.post('/api/posts/:id/like', (req, res) => {
  const postId = parseInt(req.params.id);
  const { userId } = req.body;
  
  if (!userId) {
    return res.status(400).json({ message: 'ID do usuário é obrigatório.' });
  }
  
  const post = posts.find(p => p.id === postId);
  if (!post) {
    return res.status(404).json({ message: 'Post não encontrado.' });
  }
  
  if (!likes[postId]) {
    likes[postId] = [];
  }
  
  const userLikeIndex = likes[postId].findIndex(like => like.userId === userId);
  
  if (userLikeIndex > -1) {
    // Remove a curtida
    likes[postId].splice(userLikeIndex, 1);
    res.json({ liked: false, likesCount: likes[postId].length });
  } else {
    // Adiciona a curtida
    likes[postId].push({
      userId,
      createdAt: new Date().toISOString()
    });
    res.json({ liked: true, likesCount: likes[postId].length });
  }
});

// Verificar se usuário curtiu um post
app.get('/api/posts/:id/like/:userId', (req, res) => {
  const postId = parseInt(req.params.id);
  const userId = req.params.userId;
  
  const userLiked = likes[postId] && likes[postId].some(like => like.userId === userId);
  const likesCount = likes[postId] ? likes[postId].length : 0;
  
  res.json({ liked: userLiked, likesCount });
});

// --- ROTAS PARA COMENTÁRIOS ---

// Adicionar comentário
app.post('/api/posts/:id/comments', (req, res) => {
  const postId = parseInt(req.params.id);
  const { text, author } = req.body;
  
  if (!text) {
    return res.status(400).json({ message: 'Texto do comentário é obrigatório.' });
  }
  
  const post = posts.find(p => p.id === postId);
  if (!post) {
    return res.status(404).json({ message: 'Post não encontrado.' });
  }
  
  if (!comments[postId]) {
    comments[postId] = [];
  }
  
  const newComment = {
    id: Date.now(),
    text,
    author: author || 'Anônimo',
    createdAt: new Date().toISOString()
  };
  
  comments[postId].push(newComment);
  
  res.status(201).json(newComment);
});

// Listar comentários de um post
app.get('/api/posts/:id/comments', (req, res) => {
  const postId = parseInt(req.params.id);
  const postComments = comments[postId] || [];
  
  res.json(postComments);
});

// --- SERVIR ARQUIVOS ESTÁTICOS ---
app.use(express.static(path.join(__dirname, 'public')));

// Rota catch-all para SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});