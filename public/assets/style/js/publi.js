const postForm = document.getElementById('postForm');
const submitBtn = document.getElementById('submitBtn');
const previewImg = document.getElementById('previewImg');
const imageFileInput = document.getElementById('imageFile');

imageFileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  previewImg.src = file ? URL.createObjectURL(file) : "https://placehold.co/64x64/png?text=Image+Icon";
});

postForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  await createPost();
});

async function createPost() {
  const title = document.getElementById('postTitle').value;
  const description = document.getElementById('postDescription').value;
  const author = document.getElementById('authorName').value;
  const imageFile = imageFileInput.files[0];

  if (!title || !imageFile) {
    alert('Título e imagem são obrigatórios!');
    return;
  }

  submitBtn.disabled = true;
  submitBtn.innerHTML = 'Enviando... <i class="fas fa-spinner fa-spin"></i>';

  try {
    // 1. Upload da imagem
    const timestamp = Date.now();
    const filename = `${timestamp}_${imageFile.name}`;

    const uploadResponse = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'x-vercel-filename': filename },
      body: imageFile
    });

    if (!uploadResponse.ok) throw new Error('Erro no upload da imagem');
    const uploadResult = await uploadResponse.json();

    // 2. Criar o post
    const postResponse = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        description,
        author: author || 'Anônimo',
        imageUrl: uploadResult.url
      })
    });

    if (!postResponse.ok) throw new Error('Erro ao criar post');

    postForm.reset();
    previewImg.src = "https://placehold.co/64x64/png?text=Image+Icon";
    // Redireciona para a página da galeria após a publicação
    window.location.href = "menu.html";
  } catch (error) {
    console.error('Erro:', error);
    alert('Erro ao criar post. Tente novamente.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = 'Publicar <i class="fas fa-paper-plane"></i>';
  }
}