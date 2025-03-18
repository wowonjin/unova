(function() {
  // 저장된 게시물과 카테고리 데이터 (전역 공유)
  let posts = JSON.parse(localStorage.getItem("posts")) || [];
  let categories = JSON.parse(localStorage.getItem("categories")) || [];
  // 현재 활성화된 카테고리 (없으면 null)
  let activeCategory = null;
  // 삭제 모드 여부
  let deleteMode = false;

  // 고유 ID 생성 함수
  function generateId() {
    return Date.now() + Math.floor(Math.random() * 1000);
  }

  // 메인 페이지 렌더링 (선택적으로 필터링된 게시물 배열 전달 가능)
  function renderMainPage(filteredPosts = null) {
    const postList = document.getElementById("post-list");
    if (!postList) return;
    postList.innerHTML = "";
    // filteredPosts가 없으면 activeCategory에 따라 posts를 필터링함
    const postsToRender = filteredPosts !== null 
      ? filteredPosts 
      : (activeCategory ? posts.filter(post => post.category === activeCategory) : posts);
    postsToRender.forEach((post, index) => {
      const div = document.createElement("div");
      div.className = "post";
      div.innerHTML = `
        <h2>${post.title}</h2>
        <p>${post.content.substring(0, 100)}...</p>
        <p>카테고리: ${post.category}</p>
        <p>글 번호: ${post.id} | 발행시간: ${new Date(post.lastModified).toLocaleString()}</p>
      `;
      div.addEventListener("click", () => {
        localStorage.setItem("currentPostIndex", index);
        window.location.href = "post.html";
      });
      // 삭제 모드일 경우 개별 삭제 버튼 추가
      if (deleteMode) {
        const delBtn = document.createElement("button");
        delBtn.textContent = "삭제하기";
        delBtn.className = "post-delete-btn";
        delBtn.addEventListener("click", (ev) => {
          ev.stopPropagation();
          if (confirm(`"${post.title}" 글을 삭제하시겠습니까?`)) {
            posts.splice(index, 1);
            localStorage.setItem("posts", JSON.stringify(posts));
            renderMainPage();
          }
        });
        div.appendChild(delBtn);
      }
      postList.appendChild(div);
    });
  }

  // 글 작성 페이지 렌더링 및 카테고리 셀렉트 업데이트
  function renderWritePage() {
    const categorySelect = document.getElementById("category");
    categorySelect.innerHTML = '<option value="">카테고리 선택</option>';
    categories.forEach(cat => {
      const option = document.createElement("option");
      option.value = cat;
      option.textContent = cat;
      categorySelect.appendChild(option);
    });
    
    const editPostIndex = localStorage.getItem("editPostIndex");
    if (editPostIndex !== null) {
      const post = posts[editPostIndex];
      document.getElementById("title").value = post.title;
      // Quill 에디터에 콘텐츠 설정
      quill.root.innerHTML = post.content;
      document.getElementById("category").value = post.category;
    }
    document.getElementById("write-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const title = document.getElementById("title").value;
      const content = quill.root.innerHTML;
      const category = document.getElementById("category").value;
      if (localStorage.getItem("editPostIndex") !== null) {
        posts[localStorage.getItem("editPostIndex")] = {
          ...posts[localStorage.getItem("editPostIndex")],
          title,
          content,
          category,
          lastModified: new Date().toISOString()
        };
      } else {
        posts.push({
          id: generateId(),
          title,
          content,
          category,
          lastModified: new Date().toISOString()
        });
      }
      localStorage.setItem("posts", JSON.stringify(posts));
      if (category && !categories.includes(category)) {
        categories.push(category);
        localStorage.setItem("categories", JSON.stringify(categories));
      }
      window.location.href = "main.html";
    });
  }

  // 글 상세 페이지 렌더링
  function renderPostDetail() {
    const postIndex = localStorage.getItem("currentPostIndex");
    if (postIndex === null) return;
    const post = posts[postIndex];
    const postDetail = document.getElementById("post-detail");
    if (!postDetail) return;
    postDetail.innerHTML = `
      <h2>${post.title}</h2>
      <p>${post.content}</p>
      <p>카테고리: ${post.category}</p>
      <p>발행시간: ${new Date(post.lastModified).toLocaleString()}</p>
    `;
    // 수정하기 버튼 클릭 시 write.html로 이동하여 해당 글 불러오기
    document.getElementById("edit-btn").addEventListener("click", () => {
      localStorage.setItem("editPostIndex", postIndex);
      window.location.href = "write.html";
    });
  }

  // 삭제 모드 관련 함수들
  function enterDeleteMode() {
    deleteMode = true;
    const deleteBtn = document.getElementById("delete-btn");
    const menuDeleteBtn = document.getElementById("menu-delete-btn");
    if (deleteBtn) deleteBtn.classList.add("active");
    if (menuDeleteBtn) menuDeleteBtn.classList.add("active");
    renderMainPage();
    document.addEventListener("click", exitDeleteModeHandler);
  }
  function exitDeleteMode() {
    deleteMode = false;
    const deleteBtn = document.getElementById("delete-btn");
    const menuDeleteBtn = document.getElementById("menu-delete-btn");
    if (deleteBtn) deleteBtn.classList.remove("active");
    if (menuDeleteBtn) menuDeleteBtn.classList.remove("active");
    renderMainPage();
    document.removeEventListener("click", exitDeleteModeHandler);
  }
  function exitDeleteModeHandler(e) {
    if (!e.target.closest(".post-delete-btn") &&
        e.target.id !== "delete-btn" &&
        e.target.id !== "menu-delete-btn") {
      exitDeleteMode();
    }
  }

  // 메뉴 편집 기능 및 카테고리 업데이트
  function initMenuEditor() {
    const menuToggle = document.getElementById("menu-toggle");
    const menuEditor = document.getElementById("menu-editor");
    const menuClose = document.getElementById("menu-close");
    const main = document.querySelector("main");
    if (menuToggle && menuEditor && menuClose && main) {
      function toggleMenuEditor() {
        menuEditor.classList.toggle("open");
        if (menuEditor.classList.contains("open")) {
          main.style.paddingLeft = "250px";
          menuToggle.style.visibility = "hidden";
        } else {
          main.style.paddingLeft = "0";
          menuToggle.style.visibility = "visible";
        }
      }
      menuToggle.addEventListener("click", toggleMenuEditor);
      menuClose.addEventListener("click", toggleMenuEditor);
    }
    const addCategoryButton = document.getElementById("add-category");
    const menuList = document.getElementById("menu-list");
    if (addCategoryButton && menuList) {
      addCategoryButton.addEventListener("click", () => {
        const newCat = prompt("카테고리 이름을 입력하세요:");
        if (newCat && !categories.includes(newCat)) {
          categories.push(newCat);
          localStorage.setItem("categories", JSON.stringify(categories));
          updateCategoryMenu();
        }
      });
      updateCategoryMenu();
    }
    function updateCategoryMenu() {
      menuList.innerHTML = "";
      categories.forEach((cat) => {
        const li = document.createElement("li");
        li.className = "menu-item";
        li.textContent = cat;
        // 클릭 시 해당 카테고리 활성화(필터 적용)
        li.addEventListener("click", () => {
          activeCategory = activeCategory === cat ? null : cat;
          updateCategoryMenu();
          renderMainPage();
        });
        // 우클릭 시 삭제 팝업 (해당 카테고리와 소속 게시물 삭제)
        li.addEventListener("contextmenu", (e) => {
          e.preventDefault();
          const existingMenu = document.querySelector(".context-menu");
          if (existingMenu) existingMenu.remove();
          const menu = document.createElement("div");
          menu.className = "context-menu";
          menu.style.left = e.pageX + "px";
          menu.style.top = e.pageY + "px";
          menu.innerHTML = '<button>삭제하기</button>';
          document.body.appendChild(menu);
          menu.querySelector("button").addEventListener("click", () => {
            if (confirm(`"${cat}" 카테고리를 삭제하시겠습니까? 이 카테고리에 속한 모든 글도 함께 삭제됩니다.`)) {
              categories = categories.filter(c => c !== cat);
              localStorage.setItem("categories", JSON.stringify(categories));
              posts = posts.filter(post => post.category !== cat);
              localStorage.setItem("posts", JSON.stringify(posts));
              if (activeCategory === cat) activeCategory = null;
              updateCategoryMenu();
              renderMainPage();
            }
            menu.remove();
          });
          document.addEventListener("click", function removeMenu(event) {
            if (!menu.contains(event.target)) {
              menu.remove();
              document.removeEventListener("click", removeMenu);
            }
          }, { once: true });
        });
        if (activeCategory === cat) {
          li.classList.add("active");
        }
        menuList.appendChild(li);
      });
    }
  }

  // DOMContentLoaded 이벤트: 각 페이지에 맞게 초기화
  document.addEventListener("DOMContentLoaded", () => {
    const path = window.location.pathname;

    // 공통: 로그인, 홈, 글작성 버튼 이벤트 등록
    const loginBtn = document.getElementById("login-btn");
    if (loginBtn) {
      loginBtn.addEventListener("click", () => {
        window.location.href = "login.html";
      });
    }
    const homeBtn = document.getElementById("home-btn");
    if (homeBtn) {
      homeBtn.addEventListener("click", () => {
        window.location.href = "main.html";
      });
    }
    const writeBtn = document.getElementById("write-btn");
    if (writeBtn) {
      writeBtn.addEventListener("click", () => {
        localStorage.removeItem("editPostIndex");
        window.location.href = "write.html";
      });
    }

    if (path.endsWith("main.html") || path.endsWith("index.html") || path === "/") {
      renderMainPage();
      initMenuEditor();
      const headerDeleteBtn = document.getElementById("delete-btn");
      const menuDeleteBtn = document.getElementById("menu-delete-btn");
      if (headerDeleteBtn) {
        headerDeleteBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          deleteMode ? exitDeleteMode() : enterDeleteMode();
        });
      }
      if (menuDeleteBtn) {
        menuDeleteBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          deleteMode ? exitDeleteMode() : enterDeleteMode();
        });
      }
      // 검색 입력 시, Enter키를 누르면 필터링된 게시물 배열을 renderMainPage에 전달
      const searchInput = document.getElementById("search-input");
      if (searchInput) {
        searchInput.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            const term = searchInput.value;
            const filtered = posts.filter(post =>
              post.title.toLowerCase().includes(term.toLowerCase()) ||
              post.content.toLowerCase().includes(term.toLowerCase()) ||
              (post.category && post.category.toLowerCase().includes(term.toLowerCase()))
            );
            renderMainPage(filtered);
          }
        });
      }
    } else if (path.endsWith("write.html")) {
      // write.html: Quill 초기화 후 글 작성 페이지 렌더링
      window.quill = new Quill('#editor', { theme: 'snow' });
      renderWritePage();
      initMenuEditor();
    } else if (path.endsWith("post.html")) {
      // post.html: 글 상세 페이지 렌더링
      renderPostDetail();
      initMenuEditor();
    }
  });

  // 외부에서 접근 가능하도록 myApp 객체 등록
  window.myApp = {
    renderMainPage,
    renderWritePage,
    renderPostDetail
  };
})();
