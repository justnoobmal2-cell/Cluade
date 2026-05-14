// ===== State =====
let filteredProblems = [...PROBLEMS];
let currentPage = 1;
const PER_PAGE = 9;

// ===== Init =====
document.addEventListener('DOMContentLoaded', () => {
  renderProblems(filteredProblems);
  setupNav();
  setupSearch();
});

// ===== Navigation =====
function setupNav() {
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      const section = link.dataset.section;
      if (section === 'problems' || section === 'exams') {
        document.getElementById(`section-${section}`).scrollIntoView({ behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  });
}

// ===== Search =====
function setupSearch() {
  document.getElementById('search-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') searchProblems();
  });
}

function searchProblems() {
  const q = document.getElementById('search-input').value.trim().toLowerCase();
  if (!q) {
    filteredProblems = [...PROBLEMS];
  } else {
    filteredProblems = PROBLEMS.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.preview.toLowerCase().includes(q) ||
      p.subject.toLowerCase().includes(q) ||
      p.type.toLowerCase().includes(q) ||
      String(p.year).includes(q)
    );
  }
  currentPage = 1;
  renderProblems(filteredProblems);
  document.getElementById('section-problems').scrollIntoView({ behavior: 'smooth' });
}

function filterByTag(tag) {
  document.getElementById('search-input').value = tag;
  const subjectMap = { '수학1': '수학1', '수학2': '수학2', '미적분': '미적분', '확률과통계': '확률과통계', '기하': '기하' };
  const typeMap = { '수능': '수능', '모의고사': '모의고사' };

  if (subjectMap[tag]) {
    document.getElementById('filter-subject').value = subjectMap[tag];
    document.getElementById('filter-type').value = '';
  } else if (typeMap[tag]) {
    document.getElementById('filter-type').value = typeMap[tag];
    document.getElementById('filter-subject').value = '';
  }
  applyFilters();
  document.getElementById('section-problems').scrollIntoView({ behavior: 'smooth' });
}

// ===== Filters =====
function applyFilters() {
  const subject = document.getElementById('filter-subject').value;
  const type = document.getElementById('filter-type').value;
  const year = document.getElementById('filter-year').value;
  const difficulty = document.getElementById('filter-difficulty').value;
  const q = document.getElementById('search-input').value.trim().toLowerCase();

  filteredProblems = PROBLEMS.filter(p => {
    if (subject && p.subject !== subject) return false;
    if (type && p.type !== type) return false;
    if (year && String(p.year) !== year) return false;
    if (difficulty && p.difficulty !== difficulty) return false;
    if (q && !p.title.toLowerCase().includes(q) && !p.preview.toLowerCase().includes(q) && !p.subject.toLowerCase().includes(q)) return false;
    return true;
  });
  currentPage = 1;
  renderProblems(filteredProblems);
}

// ===== Render =====
function renderProblems(list) {
  const container = document.getElementById('problems-list');
  const start = (currentPage - 1) * PER_PAGE;
  const paginated = list.slice(start, start + PER_PAGE);

  if (list.length === 0) {
    container.innerHTML = `
      <div class="no-results">
        <div class="emoji">🔍</div>
        <p>검색 결과가 없습니다. 다른 키워드나 필터를 사용해보세요.</p>
      </div>`;
    document.getElementById('pagination').innerHTML = '';
    return;
  }

  container.innerHTML = paginated.map(p => `
    <div class="problem-card" onclick="openProblem(${p.id})">
      <div class="problem-meta">
        <span class="badge badge-type-${p.type}">${p.type}</span>
        <span class="badge badge-subject">${p.subject}</span>
        <span class="badge badge-year">${p.year}</span>
        <span class="badge badge-diff-${p.difficulty}">${p.difficulty}</span>
      </div>
      <div class="problem-title">${p.number}번. ${p.title}</div>
      <div class="problem-preview">${p.preview}</div>
      <div class="problem-footer">
        <span class="problem-number">${p.source}</span>
        <span class="problem-action">풀어보기 →</span>
      </div>
    </div>
  `).join('');

  renderPagination(list.length);
}

function renderPagination(total) {
  const totalPages = Math.ceil(total / PER_PAGE);
  const pagination = document.getElementById('pagination');
  if (totalPages <= 1) { pagination.innerHTML = ''; return; }

  let html = '';
  if (currentPage > 1) html += `<button class="page-btn" onclick="goPage(${currentPage - 1})">‹</button>`;
  for (let i = 1; i <= totalPages; i++) {
    html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="goPage(${i})">${i}</button>`;
  }
  if (currentPage < totalPages) html += `<button class="page-btn" onclick="goPage(${currentPage + 1})">›</button>`;
  pagination.innerHTML = html;
}

function goPage(page) {
  currentPage = page;
  renderProblems(filteredProblems);
  document.getElementById('section-problems').scrollIntoView({ behavior: 'smooth' });
}

// ===== Exam Category Modal =====
function showExams(type) {
  const exams = [...new Set(PROBLEMS.filter(p => p.type === type).map(p => p.year))]
    .sort((a, b) => b - a);

  const typeLabels = { '수능': '대학수학능력시험', '모의고사': '전국연합학력평가 모의고사', '내신': '학교 내신 기출' };

  document.getElementById('modal-content').innerHTML = `
    <h2 class="modal-title">${typeLabels[type] || type} 기출 목록</h2>
    <ul class="exam-list">
      ${exams.map(year => {
        const cnt = PROBLEMS.filter(p => p.type === type && p.year === year).length;
        return `
          <li class="exam-item" onclick="filterByExam('${type}', ${year})">
            <div>
              <div class="exam-item-name">${year}년도 ${type}</div>
              <div class="exam-item-meta">수록 문제 ${cnt}개</div>
            </div>
            <span class="exam-item-arrow">→</span>
          </li>`;
      }).join('')}
    </ul>
  `;
  document.getElementById('exam-modal').classList.remove('hidden');
}

function filterByExam(type, year) {
  closeModal();
  document.getElementById('filter-type').value = type;
  document.getElementById('filter-year').value = String(year);
  document.getElementById('filter-subject').value = '';
  document.getElementById('filter-difficulty').value = '';
  document.getElementById('search-input').value = '';
  applyFilters();
  document.getElementById('section-problems').scrollIntoView({ behavior: 'smooth' });
}

function closeModal() {
  document.getElementById('exam-modal').classList.add('hidden');
}

// ===== Problem Detail Modal =====
function openProblem(id) {
  const p = PROBLEMS.find(x => x.id === id);
  if (!p) return;

  const bodyHtml = p.body.replace(/\n/g, '<br/>');
  const condHtml = p.conditions.map(c => `<li>${c}</li>`).join('');

  document.getElementById('problem-modal-content').innerHTML = `
    <div class="problem-detail-num">${p.source}</div>
    <div class="problem-detail-header">
      <span class="badge badge-type-${p.type}">${p.type}</span>
      <span class="badge badge-subject">${p.subject}</span>
      <span class="badge badge-year">${p.year}</span>
      <span class="badge badge-diff-${p.difficulty}">난이도: ${p.difficulty}</span>
    </div>
    <div class="problem-detail-title">${p.number}번. ${p.title}</div>
    <div class="problem-detail-body">${bodyHtml}</div>
    ${p.conditions.length ? `
    <div class="problem-conditions">
      <h4>핵심 개념</h4>
      <ul>${condHtml}</ul>
    </div>` : ''}
    <div class="answer-section">
      <button class="answer-toggle" onclick="toggleAnswer(this)">정답 보기</button>
      <div class="answer-box">
        <div class="answer-label">정답</div>
        <div class="answer-value">${p.answer}</div>
      </div>
    </div>
  `;
  document.getElementById('problem-modal').classList.remove('hidden');
}

function toggleAnswer(btn) {
  const box = btn.nextElementSibling;
  box.classList.toggle('show');
  btn.textContent = box.classList.contains('show') ? '정답 숨기기' : '정답 보기';
}

function closeProblemModal() {
  document.getElementById('problem-modal').classList.add('hidden');
}

// Close modal on Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeModal();
    closeProblemModal();
  }
});
