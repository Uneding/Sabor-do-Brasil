document.addEventListener("DOMContentLoaded", async () => {
  const loginButton = document.getElementById("loginButton"); // botão fora do modal (abre o modal)
  const loginSubmit = document.getElementById("loginSubmit"); // botão dentro do modal (envia o login)
  const logoutButton = document.getElementById("logoutButton");
  const loginForm = document.getElementById("loginForm");
  const loginError = document.getElementById("loginError");

  // Remove qualquer is-invalid ao abrir o modal de login
  const loginModal = document.getElementById('loginModal');
  if (loginModal) {
    loginModal.addEventListener('show.bs.modal', function () {
      loginForm.email.classList.remove("is-invalid");
      loginForm.password.classList.remove("is-invalid");
      loginError.classList.add('d-none');
    });
  }

  // Listeners para só mostrar vermelho se já tentou submit
  loginForm.email.addEventListener('input', function () {
    if (this.value.trim()) {
      this.classList.remove('is-invalid');
    }
  });
  loginForm.password.addEventListener('input', function () {
    if (this.value.trim()) {
      this.classList.remove('is-invalid');
    }
  });
  loginForm.email.addEventListener('blur', function () {
    if (!this.value.trim()) {
      this.classList.add('is-invalid');
    }
  });
  loginForm.password.addEventListener('blur', function () {
    if (!this.value.trim()) {
      this.classList.add('is-invalid');
    }
  });

  // Função para mostrar dados do usuário logado
  function mostrarUsuario(user) {
    document.getElementById('userName').textContent = user.nome;
    document.getElementById('userPhoto').src = user.foto;
    loginButton.classList.add("d-none");
    logoutButton.classList.remove("d-none");
    // Mostra contadores de likes/dislikes do perfil
    document.querySelector('.perfil .likes .col-6:nth-child(1) span').textContent = '0';
    document.querySelector('.perfil .likes .col-6:nth-child(2) span').textContent = '0';
    // Mostra o botão Nova Publicação
    const novaPublicacaoBtn = document.getElementById('novaPublicacaoBtn');
    if (novaPublicacaoBtn) novaPublicacaoBtn.classList.remove('d-none');
  }

  // Função para esconder dados do usuário logado
  function esconderUsuario() {
    document.getElementById('userName').textContent = "Sabor do Brasil";
    document.getElementById('userPhoto').src = "imagens/logo/logo_sabor_do_brasil.png";
    loginButton.classList.remove("d-none");
    logoutButton.classList.add("d-none");
    // Esconde o botão Nova Publicação
    const novaPublicacaoBtn = document.getElementById('novaPublicacaoBtn');
    if (novaPublicacaoBtn) novaPublicacaoBtn.classList.add('d-none');
    // Zera contadores de likes/dislikes do perfil
    document.querySelector('.perfil .likes .col-6:nth-child(1) span').textContent = '0';
    document.querySelector('.perfil .likes .col-6:nth-child(2) span').textContent = '0';
    // Remove destaque visual dos likes/dislikes dos cards
    document.querySelectorAll('.like-btn').forEach(btn => btn.classList.remove('liked'));
    document.querySelectorAll('.dislike-btn').forEach(btn => btn.classList.remove('liked'));
    // Remove botões de ação dos comentários se estiverem visíveis
    document.querySelectorAll('.editar-comentario, .excluir-comentario, .salvar-edicao').forEach(btn => btn.remove());
    // Fecha overlay de comentários e volta para a página principal
    const comentariosContainer = document.getElementById('comentarios-container');
    if (comentariosContainer) {
      comentariosContainer.classList.add('d-none');
      comentariosContainer.innerHTML = '';
      const publicacoesDiv = document.querySelector('.publicacoes .p-3');
      if (publicacoesDiv) {
        publicacoesDiv.querySelectorAll('.publicacao-card').forEach(card => card.classList.remove('d-none'));
      }
    }
  }

  // Verifica se já existe usuário logado no localStorage
  const usuarioSalvo = localStorage.getItem("usuarioLogado");
  if (usuarioSalvo) {
    mostrarUsuario(JSON.parse(usuarioSalvo));
  } else {
    esconderUsuario();
    await atualizarLikesEmpresa();
    setInterval(async () => {
      // Só atualiza se continuar sem usuário logado
      if (!localStorage.getItem("usuarioLogado")) {
        await atualizarLikesEmpresa();
      }
    }, 5000);
  }

  if (loginButton) {
    // Botão fora do modal: só abre o modal e limpa erros
    loginButton.addEventListener("click", () => {
      // Limpa campos e erros ao abrir o modal
      loginForm.email.value = '';
      loginForm.password.value = '';
      loginForm.email.classList.remove("is-invalid");
      loginForm.password.classList.remove("is-invalid");
      loginError.classList.add('d-none');
      const loginModalEl = document.getElementById('loginModal');
      let modal = bootstrap.Modal.getInstance(loginModalEl);
      if (!modal) {
        modal = new bootstrap.Modal(loginModalEl);
      }
      modal.show();
    });
  }

  // Controle para só mostrar vermelho após submit ou blur
  let tentouLogin = false;
  loginForm.email.addEventListener('blur', () => {
    if (tentouLogin && !loginForm.email.value.trim()) {
      loginForm.email.classList.add('is-invalid');
    }
  });
  loginForm.password.addEventListener('blur', () => {
    if (tentouLogin && !loginForm.password.value.trim()) {
      loginForm.password.classList.add('is-invalid');
    }
  });

  if (loginSubmit) {
    loginSubmit.addEventListener("click", async () => {
      tentouLogin = true;
      const email = loginForm.email.value.trim();
      const password = loginForm.password.value.trim();

      // Limpa o estado de erro antes de validar
      loginForm.email.classList.remove("is-invalid");
      loginForm.password.classList.remove("is-invalid");

      if (!email || !password) {
        loginError.classList.add('d-none');
        if (!email) {
          loginForm.email.classList.add("is-invalid");
        }
        if (!password) {
          loginForm.password.classList.add("is-invalid");
        }
        return;
      }

      const response = await fetch("/api/account/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const user = await response.json();
        localStorage.setItem("usuarioLogado", JSON.stringify(user));
        mostrarUsuario(user);
        // Remover o foco do botão antes de fechar o modal
        document.activeElement.blur();
        var modal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
        modal.hide();
        loginError.classList.add('d-none');
        loginForm.email.classList.remove("is-invalid");
        loginForm.password.classList.remove("is-invalid");
        tentouLogin = false;
        // Atualiza visual dos likes/dislikes dos cards para o usuário logado
        atualizarLikesDislikesPerfil(user.id);
        document.querySelectorAll('.like-btn').forEach(async btn => {
          const id = btn.id.replace('like-btn-', '');
          const likeCountSpan = btn.querySelector('.like-count');
          const dislikeBtn = document.getElementById(`dislike-btn-${id}`);
          const dislikeCountSpan = dislikeBtn?.querySelector('.dislike-count');
          if (likeCountSpan && dislikeBtn && dislikeCountSpan) {
            await atualizarEstadoCurtidas(Number(id), btn, dislikeBtn, likeCountSpan, dislikeCountSpan, user.id);
          }
        });
      } else {
        loginError.textContent = "Usuário ou senha incorreto";
        loginError.classList.remove('d-none');
        loginForm.email.classList.add("is-invalid");
        loginForm.password.classList.add("is-invalid");
      }
    });
  }

  if (logoutButton) {
    logoutButton.addEventListener("click", async () => {
      localStorage.removeItem("usuarioLogado");
      esconderUsuario();
      // Atualiza visual do perfil imediatamente ao deslogar
      document.getElementById('userName').textContent = "Sabor do Brasil";
      document.getElementById('userPhoto').src = "imagens/logo/logo_sabor_do_brasil.png";
      // Esconde botão de logout e mostra de login
      loginButton.classList.remove("d-none");
      logoutButton.classList.add("d-none");
      // Zera contadores de likes/dislikes do perfil
      document.querySelector('.perfil .likes .col-6:nth-child(1) span').textContent = '0';
      document.querySelector('.perfil .likes .col-6:nth-child(2) span').textContent = '0';
      // Atualiza likes/dislikes da empresa imediatamente
      await atualizarLikesEmpresa();
    });
  }

  const publicacoesContainer = document.querySelector('.publicacoes .p-3');
  if (!publicacoesContainer) return;

  // Busca as publicações do backend
  const resp = await fetch('/api/publicacao');
  if (!resp.ok) return;
  const publicacoes = await resp.json();

  publicacoesContainer.innerHTML = ""; // Limpa o conteúdo

  if (publicacoes.length === 0) {
    publicacoesContainer.innerHTML = `<div class='text-center text-muted py-5' style='font-size:1.2rem;'>Nenhuma publicação ainda</div>`;
  }

  publicacoes.forEach(pub => {
    const usuarioNome = pub.nome_usuario || '';
    publicacoesContainer.innerHTML += `
      <div class="card publicacao-card mb-2" style="width: 320px; min-height: 220px; margin: 0 auto; border: 1.5px solid #C2BEBE;">
        <div class="card-header bg-white border-bottom-0 py-2 px-3" style="font-size:0.95rem;font-weight:500;">${usuarioNome}</div>
        <img src="${pub.foto}" class="card-img-top" alt="${pub.nome_prato}" style="height: 180px; object-fit: cover;">
        <div class="card-body p-2">
          <h6 class="card-title mb-1" style="font-size: 1rem;">${pub.nome_prato}</h6>
          <div class="d-flex justify-content-between small">
            <span style="font-size: 0.9rem;">${pub.local}</span>
            <span style="font-size: 0.9rem;">${pub.cidade_estado}</span>
          </div>
          <div class="d-flex justify-content-between mt-2">
            <div>
              <button id="like-btn-${pub.id}" class="btn p-0 border-0 bg-transparent like-btn">
                <i class="bi bi-hand-thumbs-up"></i> <span class="like-count">0</span>
              </button>
              <button id="dislike-btn-${pub.id}" class="btn p-0 border-0 bg-transparent dislike-btn ms-2">
                <i class="bi bi-hand-thumbs-down"></i> <span class="dislike-count">0</span>
              </button>
            </div>
            <span style="font-size: 0.95rem; display: flex; align-items: center;">
              <button class="btn btn-link p-0 m-0 comentario-btn" data-id="${pub.id}" style="color: inherit; text-decoration: none;">
                <i class="bi bi-chat-dots"></i>
                <span class="comentario-count" id="comentario-count-${pub.id}" style="font-size:0.95rem; margin-left:4px;">0</span>
              </button>
            </span>
          </div>
        </div>
      </div>
    `;
  });

  // Após renderizar os cards, buscar a contagem de likes/dislikes para cada publicação
  publicacoes.forEach(pub => {
    fetch(`/api/curtidas/contagem/${pub.id}`)
      .then(resp => resp.ok ? resp.json() : { likes: 0, dislikes: 0 })
      .then(data => {
        const likeBtn = document.getElementById(`like-btn-${pub.id}`);
        const dislikeBtn = document.getElementById(`dislike-btn-${pub.id}`);
        if (likeBtn) likeBtn.querySelector('.like-count').textContent = data.likes;
        if (dislikeBtn) dislikeBtn.querySelector('.dislike-count').textContent = data.dislikes;
      });
    // Atualiza a contagem de comentários em tempo real
    fetch(`/api/comentarios/${pub.id}`)
      .then(resp => resp.ok ? resp.json() : [])
      .then(comentarios => {
        const countSpan = document.getElementById(`comentario-count-${pub.id}`);
        if (countSpan) countSpan.textContent = comentarios.length;
      });
  });

  // Aqui você pode chamar sua função para ativar os eventos de like/dislike nos botões criados

  for (let i = 1; i <= 3; i++) {
    const likeBtn = document.getElementById(`like-btn-${i}`);
    const dislikeBtn = document.getElementById(`dislike-btn-${i}`);

    if (likeBtn && dislikeBtn) {
      const likeCountSpan = likeBtn.querySelector('.like-count');
      const dislikeCountSpan = dislikeBtn.querySelector('.dislike-count');

      likeBtn.addEventListener("click", async function () {
        const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
        if (!usuario || !usuario.id) {
          abrirModalLogin();
          return;
        }
        const idPublicacao = i;

        await fetch("/api/curtidas/like", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idUsuario: usuario.id, idPublicacao }),
        });

        await atualizarEstadoCurtidas(idPublicacao, likeBtn, dislikeBtn, likeCountSpan, dislikeCountSpan, usuario.id);
        await atualizarLikesDislikesPerfil(usuario.id);
      });

      dislikeBtn.addEventListener("click", async function () {
        const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
        if (!usuario || !usuario.id) {
          abrirModalLogin();
          return;
        }
        const idPublicacao = i;

        await fetch("/api/curtidas/deslike", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idUsuario: usuario.id, idPublicacao }),
        });

        await atualizarEstadoCurtidas(idPublicacao, likeBtn, dislikeBtn, likeCountSpan, dislikeCountSpan, usuario.id);
        await atualizarLikesDislikesPerfil(usuario.id);
      });
    }
  }

  // Atualiza o estado visual dos botões e as contagens do card
  async function atualizarEstadoCurtidas(idPublicacao, likeBtn, dislikeBtn, likeCountSpan, dislikeCountSpan, idUsuario) {
    // Busca contagem atualizada do card
    const resp = await fetch(`/api/curtidas/contagem/${idPublicacao}`);
    if (resp.ok) {
      const data = await resp.json();
      likeCountSpan.textContent = data.likes;
      dislikeCountSpan.textContent = data.dislikes;
    }

    // Marca visualmente o botão correto
    const respMinhas = await fetch(`/api/curtidas/minhas-curtidas/${idUsuario}`);
    if (respMinhas.ok) {
      const idsCurtidas = await respMinhas.json();
      if (idsCurtidas.includes(idPublicacao)) {
        likeBtn.classList.add("liked");
        dislikeBtn.classList.remove("liked");
      } else {
        const respDeslikes = await fetch(`/api/curtidas/minhas-descurtidas/${idUsuario}`);
        if (respDeslikes.ok) {
          const idsDescurtidas = await respDeslikes.json();
          if (idsDescurtidas.includes(idPublicacao)) {
            dislikeBtn.classList.add("liked");
            likeBtn.classList.remove("liked");
          } else {
            likeBtn.classList.remove("liked");
            dislikeBtn.classList.remove("liked");
          }
        }
      }
    }
  }

  // Atualiza total de likes e dislikes do perfil
  async function atualizarLikesDislikesPerfil(idUsuario) {
    // Likes
    const respLikes = await fetch(`/api/curtidas/total-likes/${idUsuario}`);
    if (respLikes.ok) {
      const data = await respLikes.json();
      document.querySelector('.perfil .likes .col-6:nth-child(1) span').textContent = data.total;
    }
    // Dislikes
    const respDislikes = await fetch(`/api/curtidas/total-dislikes/${idUsuario}`);
    if (respDislikes.ok) {
      const data = await respDislikes.json();
      document.querySelector('.perfil .likes .col-6:nth-child(2) span').textContent = data.total;
    }
  }

  // Ao carregar a página/logar, chame:
  const usuario = JSON.parse(localStorage.getItem("usuarioLogado") || "null");
  if (usuario && usuario.id) {
    atualizarLikesDislikesPerfil(usuario.id);
    for (let i = 1; i <= 3; i++) {
      const likeBtn = document.getElementById(`like-btn-${i}`);
      const dislikeBtn = document.getElementById(`dislike-btn-${i}`);
      const likeCountSpan = likeBtn?.querySelector('.like-count');
      const dislikeCountSpan = dislikeBtn?.querySelector('.dislike-count');
      if (likeBtn && dislikeBtn && likeCountSpan && dislikeCountSpan) {
        atualizarEstadoCurtidas(i, likeBtn, dislikeBtn, likeCountSpan, dislikeCountSpan, usuario.id);
      }
    }
  }

  document.querySelectorAll('.comentario-btn').forEach(btn => {
    btn.addEventListener('click', async function () {
      const idPub = this.getAttribute('data-id');
      const comentariosContainer = document.getElementById('comentarios-container');
      const publicacoesDiv = document.querySelector('.publicacoes .p-3');
      const cards = publicacoesDiv.querySelectorAll('.publicacao-card');

      // Se já está aberto para esse id, volta ao normal
      if (comentariosContainer.dataset.open == idPub) {
        comentariosContainer.classList.add('d-none');
        comentariosContainer.innerHTML = '';
        cards.forEach(card => card.classList.remove('d-none'));
        comentariosContainer.dataset.open = '';
        return;
      }

      // Esconde todas as publicações, menos a selecionada
      cards.forEach(card => {
        if (card.querySelector(`.comentario-btn[data-id="${idPub}"]`)) {
          card.classList.remove('d-none');
          // Insere o container de comentários logo após o card selecionado
          card.after(comentariosContainer);
        } else {
          card.classList.add('d-none');
        }
      });

      comentariosContainer.classList.remove('d-none');
      comentariosContainer.dataset.open = idPub;

      // Busca comentários do backend
      async function carregarComentarios(idPub) {
        const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
        const resp = await fetch(`/api/comentarios/${idPub}`);
        const comentarios = resp.ok ? await resp.json() : [];
        const lista = document.getElementById('lista-comentarios');
        if (lista) {
          lista.innerHTML = comentarios.map(c => {
            let botoes = '';
            if (usuario && c.id_usuario == usuario.id) {
              botoes = `
                <button class="btn btn-sm btn-link text-primary p-0 me-2 editar-comentario" data-id="${c.id}" title="Editar"><i class="bi bi-pencil-square"></i></button>
                <button class="btn btn-sm btn-link text-danger p-0 excluir-comentario" data-id="${c.id}" title="Excluir"><i class="bi bi-trash3"></i></button>
              `;
            }
            return `
              <div class="mb-2" data-comentario-id="${c.id}">
                <img src="${c.foto_perfil}" alt="perfil" style="width:32px;height:32px;border-radius:50%;margin-right:8px;">
                <strong>${c.nome_usuario}</strong>: <span class="comentario-texto">${c.descricao}</span>
                ${botoes}
              </div>
            `;
          }).join('');

          // Atualiza a contagem dinâmica de comentários no card
          const countSpan = document.getElementById(`comentario-count-${idPub}`);
          if (countSpan) countSpan.textContent = comentarios.length;

          // Eventos de editar
          lista.querySelectorAll('.editar-comentario').forEach(btn => {
            btn.onclick = function () {
              // Bloqueia edição se não estiver logado
              const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
              if (!usuario || !usuario.id) {
                alert('Você precisa estar logado para editar comentários.');
                return;
              }
              const idComentario = this.dataset.id;
              const div = lista.querySelector(`[data-comentario-id='${idComentario}']`);
              const textoSpan = div.querySelector('.comentario-texto');
              const textoOriginal = textoSpan.textContent;
              textoSpan.outerHTML = `<textarea class='form-control form-control-sm comentario-editar-textarea' style='display:inline-block;width:60%;'>${textoOriginal}</textarea>`;
              this.classList.add('d-none');
              const salvarBtn = document.createElement('button');
              salvarBtn.className = 'btn btn-sm btn-success ms-2 salvar-edicao';
              salvarBtn.textContent = 'Salvar';
              div.appendChild(salvarBtn);
              salvarBtn.onclick = async function () {
                const novoTexto = div.querySelector('.comentario-editar-textarea').value.trim();
                if (!novoTexto) return;
                await fetch(`/api/comentarios/${idComentario}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ idUsuario: usuario.id, descricao: novoTexto })
                });
                await carregarComentarios(idPub);
              };
            };
          });

          // Eventos de excluir
          lista.querySelectorAll('.excluir-comentario').forEach(btn => {
            btn.onclick = async function () {
              // Bloqueia exclusão se não estiver logado
              const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
              if (!usuario || !usuario.id) {
                alert('Você precisa estar logado para excluir comentários.');
                return;
              }
              const idComentario = this.dataset.id;
              if (confirm('Tem certeza que deseja excluir este comentário?')) {
                await fetch(`/api/comentarios/${idComentario}?idUsuario=${usuario.id}`, { method: 'DELETE' });
                await carregarComentarios(idPub);
              }
            };
          });
        }
      }

      // Monta o HTML dos comentários
      let html = `
        <div class="card mb-2" style="width: 100%; border: 1.5px solid #C2BEBE;">
          <div class="card-body">
            <h6 class="mb-3">Comentários</h6>
            <div id="lista-comentarios"></div>
            <div class="mt-3">
              <textarea id="novoComentario" class="form-control mb-2" rows="2" placeholder="Escreva seu comentário..."></textarea>
              <div id="comentarioErro" class="text-danger small mb-2 d-none"></div>
              <button id="btnComentar" class="btn btn-warning text-white">Comentar</button>
              <button id="btnVoltar" class="btn btn-outline-secondary ms-2">Voltar</button>
            </div>
          </div>
        </div>
      `;
      comentariosContainer.innerHTML = html;
      await carregarComentarios(idPub);

      // Evento de comentar
      document.getElementById('btnComentar').onclick = async () => {
        const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
        const texto = document.getElementById('novoComentario').value.trim();
        if (!usuario || !usuario.id) {
          abrirModalLogin();
          return;
        }
        if (!texto) return;
        await fetch('/api/comentarios', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            idUsuario: usuario.id,
            idPublicacao: idPub,
            descricao: texto,
            fotoPerfil: usuario.foto
          })
        });
        // Limpa o campo
        document.getElementById('novoComentario').value = '';
        // Recarrega a lista de comentários (com os botões de editar/excluir)
        await carregarComentarios(idPub);
      };

      // Evento de voltar
      document.getElementById('btnVoltar').onclick = () => {
        comentariosContainer.classList.add('d-none');
        comentariosContainer.innerHTML = '';
        cards.forEach(card => card.classList.remove('d-none'));
        comentariosContainer.dataset.open = '';
      };
    });
  });

  // Remover este bloco duplicado para não sobrescrever o perfil do usuário logado
  // const respEmpresa = await fetch('/api/empresa/1');
  // if (respEmpresa.ok) {
  //   const empresa = await respEmpresa.json();
  //   document.getElementById('userName').textContent = empresa.nome;
  //   if (empresa.foto) {
  //     document.getElementById('userPhoto').src = empresa.foto;
  //   }
  //   // Exibe likes/deslikes da empresa no perfil
  //   document.querySelector('.perfil .likes .col-6:nth-child(1) span').textContent = empresa.curtidas || 0;
  //   document.querySelector('.perfil .likes .col-6:nth-child(2) span').textContent = empresa.deslikes || 0;
  // } else {
  //   document.getElementById('userName').textContent = 'Sabor do Brasil';
  //   document.getElementById('userPhoto').src = 'imagens/logo/logo_sabor_do_brasil.png';
  //   document.querySelector('.perfil .likes .col-6:nth-child(1) span').textContent = '0';
  //   document.querySelector('.perfil .likes .col-6:nth-child(2) span').textContent = '0';
  // }

  // Função para abrir o modal de login
  function abrirModalLogin() {
    var modal = new bootstrap.Modal(document.getElementById('loginModal'));
    modal.show();
  }

  // Função para atualizar likes/dislikes da empresa dinamicamente
  async function atualizarLikesEmpresa() {
    // Só atualiza se não houver usuário logado
    if (localStorage.getItem("usuarioLogado")) return;
    const respEmpresa = await fetch('/api/empresa/1');
    if (respEmpresa.ok) {
      const empresa = await respEmpresa.json();
      document.getElementById('userName').textContent = empresa.nome;
      document.getElementById('userPhoto').src = empresa.foto || 'imagens/logo/logo_sabor_do_brasil.png';
      document.querySelector('.perfil .likes .col-6:nth-child(1) span').textContent = empresa.curtidas || 0;
      document.querySelector('.perfil .likes .col-6:nth-child(2) span').textContent = empresa.deslikes || 0;
    }
  }

  // Cadastro de usuário
  const registerSubmit = document.getElementById('registerSubmit');
  if (registerSubmit) {
    registerSubmit.addEventListener('click', async () => {
      const nome = document.getElementById('registerNome').value.trim();
      const email = document.getElementById('registerEmail').value.trim();
      const senha = document.getElementById('registerSenha').value.trim();
      const foto = document.getElementById('registerFoto').value.trim();
      const registerError = document.getElementById('registerError');
      registerError.classList.add('d-none');
      if (!nome || !email || !senha || !foto) {
        registerError.textContent = 'Preencha todos os campos.';
        registerError.classList.remove('d-none');
        return;
      }
      const resp = await fetch('/api/account/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email, senha, foto })
      });
      if (resp.ok) {
        // Cadastro ok, fecha modal e faz login automático
        const user = await resp.json();
        localStorage.setItem('usuarioLogado', JSON.stringify(user));
        mostrarUsuario(user);
        var modal = bootstrap.Modal.getInstance(document.getElementById('registerModal'));
        modal.hide();
      } else {
        const erro = await resp.json();
        registerError.textContent = erro.message || 'Erro ao cadastrar usuário';
        registerError.classList.remove('d-none');
      }
    });
  }

  // Cadastro de nova publicação
  const novaPublicacaoSubmit = document.getElementById('novaPublicacaoSubmit');
  if (novaPublicacaoSubmit) {
    novaPublicacaoSubmit.addEventListener('click', async () => {
      const nome_prato = document.getElementById('nomePrato').value.trim();
      const foto = document.getElementById('fotoPrato').value.trim();
      const local = document.getElementById('localPrato').value.trim();
      const cidade_estado = document.getElementById('cidadeEstadoPrato').value.trim();
      const publicacaoError = document.getElementById('publicacaoError');
      publicacaoError.classList.add('d-none');
      const usuario = JSON.parse(localStorage.getItem('usuarioLogado'));
      if (!usuario || !usuario.id) {
        publicacaoError.textContent = 'Você precisa estar logado para publicar.';
        publicacaoError.classList.remove('d-none');
        return;
      }
      if (!nome_prato || !foto || !local || !cidade_estado) {
        publicacaoError.textContent = 'Preencha todos os campos.';
        publicacaoError.classList.remove('d-none');
        return;
      }
      const resp = await fetch('/api/publicacao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ IdUsuario: usuario.id, NomePrato: nome_prato, Foto: foto, Local: local, CidadeEstado: cidade_estado })
      });
      if (resp.ok) {
        // Sucesso, fecha modal e recarrega publicações
        var modal = bootstrap.Modal.getInstance(document.getElementById('novaPublicacaoModal'));
        modal.hide();
        window.location.reload();
      } else {
        publicacaoError.textContent = 'Erro ao cadastrar publicação';
        publicacaoError.classList.remove('d-none');
      }
    });
  }

  // Botão de nova publicação ao lado do título
  const novaPublicacaoBtn = document.getElementById('novaPublicacaoBtn');
  if (novaPublicacaoBtn) {
    novaPublicacaoBtn.addEventListener('click', function () {
      const usuario = JSON.parse(localStorage.getItem('usuarioLogado'));
      if (!usuario || !usuario.id) {
        abrirModalLogin();
      } else {
        var modal = new bootstrap.Modal(document.getElementById('novaPublicacaoModal'));
        modal.show();
      }
    });
  }
});