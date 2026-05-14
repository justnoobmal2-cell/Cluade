// ===== 수학 기출 데이터 =====

const PROBLEMS = [
  // 수능 2025
  {
    id: 1, year: 2025, type: '수능', subject: '수학2', difficulty: '상',
    number: 29, title: '함수의 연속과 미분가능성',
    preview: 'f(x)가 x=a에서 연속이지만 미분가능하지 않은 경우를 조건으로 주어진 함수 g(x)에 대해...',
    body: `실수 전체의 집합에서 정의된 함수 f(x)가 다음 조건을 만족시킨다.\n\n(가) x < 1일 때, f(x) = x² - 2x + k\n(나) x ≥ 1일 때, f(x) = ax + b\n\nf(x)가 x = 1에서 연속이고 x = 1에서 미분가능하지 않을 때, 상수 a + b + k의 값을 구하시오.`,
    conditions: ['함수 f(x)는 실수 전체에서 정의', 'x = 1에서 연속', 'x = 1에서 미분불가능'],
    answer: '7', source: '2025 수능 수학영역 29번'
  },
  {
    id: 2, year: 2025, type: '수능', subject: '수학1', difficulty: '중',
    number: 8, title: '등차수열과 등비수열',
    preview: '등차수열 {aₙ}과 등비수열 {bₙ}이 주어진 조건을 만족할 때 a₁₀ + b₁₀의 값은?',
    body: `등차수열 {aₙ}과 등비수열 {bₙ}이 다음 조건을 만족시킨다.\n\na₁ = b₁, a₂ = b₂, a₁ + a₂ = 10\n\na₁₀ + b₁₀의 값은?`,
    conditions: ['등차수열 {aₙ}: 공차 d', '등비수열 {bₙ}: 공비 r', 'a₁ = b₁, a₂ = b₂'],
    answer: '① 256+19 = 275',
    source: '2025 수능 수학영역 8번'
  },
  {
    id: 3, year: 2025, type: '수능', subject: '미적분', difficulty: '상',
    number: 30, title: '정적분과 역함수',
    preview: '연속함수 f(x)의 역함수 g(x)가 존재하고, 정적분 조건을 만족할 때 f(3)의 값을 구하시오.',
    body: `최고차항의 계수가 1인 삼차함수 f(x)에 대하여 함수 g(x) = ∫₀ˣ f(t)dt가 있다.\n\ng(x)가 x = -1, x = 2에서 극값을 가질 때, f(5)의 값을 구하시오.`,
    conditions: ['삼차함수 f(x), 최고차항 계수 = 1', 'g(x) = ∫₀ˣ f(t)dt', 'g(x)가 x=-1, x=2에서 극값'],
    answer: '96', source: '2025 수능 수학영역 30번'
  },

  // 수능 2024
  {
    id: 4, year: 2024, type: '수능', subject: '수학1', difficulty: '하',
    number: 3, title: '지수법칙 기본',
    preview: '2³ × 4의 값은?',
    body: `다음 식을 계산하시오.\n\n(2³ × 4) ÷ 2`,
    conditions: ['지수법칙 활용'],
    answer: '16', source: '2024 수능 수학영역 3번'
  },
  {
    id: 5, year: 2024, type: '수능', subject: '수학2', difficulty: '중',
    number: 14, title: '합성함수의 미분',
    preview: 'f(x) = (x² + 1)³ 일 때 f′(1)의 값은?',
    body: `f(x) = (x² + 1)³일 때, f′(1)의 값은?\n\n① 20  ② 24  ③ 28  ④ 32  ⑤ 36`,
    conditions: ['합성함수 미분 (연쇄법칙)'],
    answer: '④ 24', source: '2024 수능 수학영역 14번'
  },
  {
    id: 6, year: 2024, type: '수능', subject: '확률과통계', difficulty: '중',
    number: 26, title: '이항분포와 정규분포',
    preview: '확률변수 X가 B(n, 0.5)를 따를 때, P(X ≥ 7)의 값을 구하시오.',
    body: `확률변수 X가 이항분포 B(12, 1/2)를 따를 때,\nP(X ≥ 8)의 값을 구하시오. (단, Z는 표준정규분포를 따른다.)`,
    conditions: ['이항분포 B(12, 1/2)', '정규근사 사용'],
    answer: '0.0726', source: '2024 수능 수학영역 26번'
  },

  // 수능 2023
  {
    id: 7, year: 2023, type: '수능', subject: '수학1', difficulty: '중',
    number: 10, title: '삼각함수의 최대최소',
    preview: '0 ≤ x < 2π에서 sin x + cos x의 최댓값은?',
    body: `0 ≤ x < 2π에서 함수 f(x) = sin x + cos x의 최댓값을 M, 최솟값을 m이라 할 때, M - m의 값은?`,
    conditions: ['sin x + cos x = √2 sin(x + π/4) 변환 활용'],
    answer: '2√2', source: '2023 수능 수학영역 10번'
  },
  {
    id: 8, year: 2023, type: '수능', subject: '미적분', difficulty: '상',
    number: 28, title: '매개변수 미분',
    preview: 'x = t², y = t³ - 3t로 정의된 곡선에서 dy/dx를 구하시오.',
    body: `매개변수 t로 나타낸 곡선 x = t², y = t³ - 3t에 대하여 t = 2일 때 dy/dx의 값은?`,
    conditions: ['dy/dx = (dy/dt) ÷ (dx/dt)'],
    answer: '9/4', source: '2023 수능 수학영역 28번'
  },
  {
    id: 9, year: 2023, type: '수능', subject: '기하', difficulty: '중',
    number: 25, title: '포물선의 초점',
    preview: '포물선 y² = 8x의 초점과 준선 사이의 거리는?',
    body: `포물선 y² = 8x의 초점 F와 준선 위의 점 P에 대하여, P에서 포물선 위의 점 Q까지의 거리와 FQ의 거리의 합의 최솟값은?`,
    conditions: ['포물선 y² = 4px, 초점 F(p,0)', '포물선의 정의(초점-준선 등거리) 활용'],
    answer: '4', source: '2023 수능 수학영역 25번'
  },

  // 모의고사 2025
  {
    id: 10, year: 2025, type: '모의고사', subject: '수학1', difficulty: '하',
    number: 2, title: '로그의 계산',
    preview: 'log₂32 + log₂4의 값을 구하시오.',
    body: `다음을 계산하시오.\n\nlog₂ 32 + log₂ 4`,
    conditions: ['로그의 덧셈법칙: log a + log b = log(ab)'],
    answer: '7', source: '2025년 3월 고3 모의고사 2번'
  },
  {
    id: 11, year: 2025, type: '모의고사', subject: '수학2', difficulty: '중',
    number: 19, title: '정적분의 계산',
    preview: '∫₀² (3x² - 2x + 1) dx의 값은?',
    body: `다음 정적분의 값을 구하시오.\n\n∫₀² (3x² - 2x + 1) dx`,
    conditions: ['다항함수의 적분', '정적분의 기본 공식'],
    answer: '6', source: '2025년 3월 고3 모의고사 19번'
  },
  {
    id: 12, year: 2025, type: '모의고사', subject: '확률과통계', difficulty: '중',
    number: 27, title: '경우의 수와 조합',
    preview: '서로 다른 6권의 책을 2권, 2권, 2권으로 나누는 경우의 수는?',
    body: `서로 다른 6권의 책을 세 사람 A, B, C에게 2권씩 나누어 주는 경우의 수를 구하시오.`,
    conditions: ['조합 C(n,r) = n! / (r!(n-r)!)'],
    answer: '90', source: '2025년 4월 고3 모의고사 27번'
  },
  {
    id: 13, year: 2024, type: '모의고사', subject: '미적분', difficulty: '상',
    number: 30, title: '수열의 극한과 급수',
    preview: '급수 Σ(1/n(n+1))의 합을 구하시오.',
    body: `다음 급수의 합을 구하시오.\n\nΣ (n=1 to ∞) 1/[n(n+1)]`,
    conditions: ['부분분수 분해: 1/n(n+1) = 1/n - 1/(n+1)', '급수의 합 (망원급수)'],
    answer: '1', source: '2024년 6월 고3 모의고사 30번'
  },
  {
    id: 14, year: 2024, type: '모의고사', subject: '수학1', difficulty: '중',
    number: 15, title: '등비수열의 합',
    preview: '첫째항이 3, 공비가 2인 등비수열의 첫 10항의 합은?',
    body: `첫째항이 3, 공비가 2인 등비수열 {aₙ}에 대하여 S₁₀의 값은?`,
    conditions: ['등비수열의 합: Sₙ = a(rⁿ-1)/(r-1)'],
    answer: '3069', source: '2024년 9월 고3 모의고사 15번'
  },
  {
    id: 15, year: 2024, type: '모의고사', subject: '수학2', difficulty: '하',
    number: 5, title: '함수의 극한',
    preview: 'lim(x→2) (x²-4)/(x-2)의 값은?',
    body: `다음 극한값을 구하시오.\n\nlim(x→2) (x² - 4) / (x - 2)`,
    conditions: ['0/0 부정형 극한', '인수분해 또는 로피탈 정리'],
    answer: '4', source: '2024년 9월 고3 모의고사 5번'
  },

  // 내신
  {
    id: 16, year: 2024, type: '내신', subject: '수학1', difficulty: '중',
    number: 7, title: '삼각함수 그래프의 변환',
    preview: 'y = 2sin(2x - π/3) + 1의 주기와 최댓값을 구하시오.',
    body: `함수 y = 2 sin(2x - π/3) + 1에 대하여 주기와 최댓값을 구하시오.`,
    conditions: ['y = A sin(Bx + C) + D', '주기 = 2π/|B|', '최댓값 = |A| + D'],
    answer: '주기: π, 최댓값: 3', source: '2024 고2 수학Ⅰ 중간고사'
  },
  {
    id: 17, year: 2024, type: '내신', subject: '수학2', difficulty: '상',
    number: 20, title: '도함수의 활용 - 극값',
    preview: 'f(x) = x³ - 3x² + k가 극솟값이 0이 될 때 k의 값을 구하시오.',
    body: `f(x) = x³ - 3x² + k (k는 상수)가 x = 2에서 극솟값을 가질 때, 극솟값이 0이 되도록 하는 k의 값을 구하시오.`,
    conditions: ['극값 조건: f\'(x) = 0인 점에서 극값', '삼차함수의 극값 계산'],
    answer: '4', source: '2024 고2 수학Ⅱ 기말고사'
  },
  {
    id: 18, year: 2023, type: '내신', subject: '수학1', difficulty: '하',
    number: 3, title: '지수함수와 로그함수',
    preview: '2ˣ = 8일 때 x의 값은?',
    body: `2ˣ = 8일 때 x의 값과, log₃ 81의 값을 각각 구하시오.`,
    conditions: ['지수방정식, 로그 계산'],
    answer: 'x = 3, log₃81 = 4', source: '2023 고1 수학 중간고사'
  },

  // 수능 2022
  {
    id: 19, year: 2022, type: '수능', subject: '미적분', difficulty: '상',
    number: 30, title: '넓이와 적분 (킬러문제)',
    preview: '두 곡선으로 둘러싸인 넓이를 정적분으로 구하는 복합 문제',
    body: `함수 f(x) = x³ - 6x² + 9x와 g(x) = x에 대하여 두 곡선 y = f(x)와 y = g(x)로 둘러싸인 도형의 넓이를 구하시오.`,
    conditions: ['두 곡선의 교점 계산', '넓이 = ∫|f(x) - g(x)|dx'],
    answer: '8', source: '2022 수능 수학영역 30번'
  },
  {
    id: 20, year: 2022, type: '수능', subject: '확률과통계', difficulty: '중',
    number: 25, title: '조건부 확률',
    preview: '두 사건 A, B에 대해 P(A) = 0.4, P(B|A) = 0.3일 때 P(A∩B)는?',
    body: `두 사건 A, B에 대하여 P(A) = 0.4, P(B|A) = 0.3일 때, P(A∩B)의 값은?\n\n① 0.10  ② 0.12  ③ 0.14  ④ 0.16  ⑤ 0.18`,
    conditions: ['조건부 확률: P(B|A) = P(A∩B)/P(A)'],
    answer: '② 0.12', source: '2022 수능 수학영역 25번'
  },
  {
    id: 21, year: 2021, type: '수능', subject: '수학2', difficulty: '중',
    number: 11, title: '미분의 활용 - 접선',
    preview: 'y = x³에서 점 (2, 8)에서의 접선의 방정식을 구하시오.',
    body: `곡선 y = x³ 위의 점 (2, 8)에서의 접선의 방정식을 구하시오.`,
    conditions: ['접선의 기울기 = f\'(2)', '점-기울기 공식'],
    answer: 'y = 12x - 16', source: '2021 수능 수학영역 11번'
  },
  {
    id: 22, year: 2020, type: '수능', subject: '수학1', difficulty: '하',
    number: 6, title: '수열의 합 공식',
    preview: 'Σ(k=1 to 10) k의 값은?',
    body: `Σ(k=1 to 10) k 의 값을 구하시오.`,
    conditions: ['Σk = n(n+1)/2'],
    answer: '55', source: '2020 수능 수학영역 6번'
  },
  {
    id: 23, year: 2025, type: '모의고사', subject: '기하', difficulty: '중',
    number: 28, title: '타원의 방정식',
    preview: '두 초점이 F(3,0), F\'(-3,0)이고 장축의 길이가 10인 타원의 방정식을 구하시오.',
    body: `두 초점이 F(3, 0), F'(-3, 0)이고 장축의 길이가 10인 타원의 방정식을 구하시오.`,
    conditions: ['타원: x²/a² + y²/b² = 1 (a > b)', 'c² = a² - b²', '장축 2a = 10'],
    answer: 'x²/25 + y²/16 = 1', source: '2025년 7월 고3 모의고사 28번'
  },
  {
    id: 24, year: 2024, type: '모의고사', subject: '확률과통계', difficulty: '상',
    number: 29, title: '확률분포표와 기댓값',
    preview: '확률변수 X의 확률분포가 주어질 때 E(X)와 V(X)를 구하시오.',
    body: `확률변수 X의 확률분포가 다음과 같을 때, E(3X+2)의 값을 구하시오.\n\nX: 1, 2, 3\nP: 1/6, 1/2, 1/3`,
    conditions: ['E(X) = Σ x·P(X=x)', 'E(aX+b) = aE(X) + b'],
    answer: 'E(X) = 7/3, E(3X+2) = 9', source: '2024년 10월 고3 모의고사 29번'
  },
];
