let posts = JSON.parse(localStorage.getItem("posts")) || [];
let categories = JSON.parse(localStorage.getItem("categories")) || [];

// 고유 id 생성을 위한 함수 추가
function generateId() {
  return Date.now() + Math.floor(Math.random() * 1000);
}

function renderMainPage() {
  const postList = document.getElementById("post-list");
  const categoryList = document.getElementById("category-list");

  // 카테고리 렌더링
  categoryList.innerHTML = "";
  categories.forEach((category) => {
    const li = document.createElement("li");
    li.textContent = category;
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "삭제";
    deleteBtn.addEventListener("click", () => {
      categories = categories.filter((cat) => cat !== category);
      localStorage.setItem("categories", JSON.stringify(categories));
      renderMainPage();
    });
    li.appendChild(deleteBtn);
    categoryList.appendChild(li);
  });

  // 글 목록 렌더링 (글 번호와 발행시간 추가)
  postList.innerHTML = "";
  posts.forEach((post, index) => {
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
    postList.appendChild(div);
  });

  // 카테고리 추가
  document.getElementById("add-category-btn").addEventListener("click", () => {
    const newCategory = prompt("새 카테고리 이름:");
    if (newCategory && !categories.includes(newCategory)) {
      categories.push(newCategory);
      localStorage.setItem("categories", JSON.stringify(categories));
      renderMainPage();
    }
  });

  // 글 발행 버튼
  document.getElementById("write-btn").addEventListener("click", () => {
    localStorage.removeItem("editPostIndex");
    window.location.href = "write.html";
  });
}

function renderWritePage() {
  const editPostIndex = localStorage.getItem("editPostIndex");
  if (editPostIndex !== null) {
    const post = posts[editPostIndex];
    document.getElementById("title").value = post.title;
    document.getElementById("content").value = post.content;
    document.getElementById("category").value = post.category;
  }

  document.getElementById("write-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const title = document.getElementById("title").value;
    const content = document.getElementById("content").value;
    const category = document.getElementById("category").value;

    if (editPostIndex !== null) {
      // 기존 글 수정 시, 기존 id는 유지하고 lastModified를 업데이트
      posts[editPostIndex] = {
        ...posts[editPostIndex],
        title,
        content,
        category,
        lastModified: new Date().toISOString()
      };
    } else {
      // 새 글 작성 시 id와 lastModified 추가
      posts.push({
        id: generateId(),
        title,
        content,
        category,
        lastModified: new Date().toISOString()
      });
    }

    localStorage.setItem("posts", JSON.stringify(posts));
    if (!categories.includes(category)) {
      categories.push(category);
      localStorage.setItem("categories", JSON.stringify(categories));
    }

    window.location.href = "index.html";
  });
}

function renderPostDetail() {
  const postIndex = localStorage.getItem("currentPostIndex");
  const post = posts[postIndex];
  const postDetail = document.getElementById("post-detail");
  postDetail.innerHTML = `
        <h2>${post.title}</h2>
        <p>${post.content}</p>
        <p>카테고리: ${post.category}</p>
        <p>글 번호: ${post.id} | 발행시간: ${new Date(post.lastModified).toLocaleString()}</p>
    `;

  document.getElementById("edit-btn").addEventListener("click", () => {
    localStorage.setItem("editPostIndex", postIndex);
    window.location.href = "write.html";
  });
}

if (
  window.location.pathname.endsWith("index.html") ||
  window.location.pathname === "/"
) {
  renderMainPage();
} else if (window.location.pathname.endsWith("write.html")) {
  renderWritePage();
} else if (window.location.pathname.endsWith("post.html")) {
  renderPostDetail();
}
