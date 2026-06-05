"""
Claude UI 디자인 스타일 적용 버전
- 크림/베이지 배경
- 산호/오렌지 포인트 컬러
- 깔끔한 타이포그래피
"""
import base64, io
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.font_manager as fm
import numpy as np
from weasyprint import HTML

FONT_REG  = '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc'
FONT_BOLD = '/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc'
fm.fontManager.addfont(FONT_REG)
fm.fontManager.addfont(FONT_BOLD)

# ── 그래프 (배경 투명하게) ────────────────────────────────
fig, ax = plt.subplots(figsize=(3.0, 2.6), facecolor='#FAF9F6')
ax.set_xlim(-3.2, 2.6)
ax.set_ylim(-2.2, 8)
ax.set_facecolor('#FAF9F6')
for s in ax.spines.values():
    s.set_visible(False)
ax.set_xticks([])
ax.set_yticks([])

CURVE = '#2D2D2D'

ax.annotate('', xy=(2.6, 0),  xytext=(-3.2, 0),
            arrowprops=dict(arrowstyle='->', color=CURVE, lw=1.0))
ax.annotate('', xy=(0, 8),    xytext=(0, -2.2),
            arrowprops=dict(arrowstyle='->', color=CURVE, lw=1.0))
ax.text(2.42,  0.28, 'x', fontsize=9.5, color=CURVE)
ax.text(0.1,   7.55, 'y', fontsize=9.5, color=CURVE)
ax.text(0.12, -0.52, 'O', fontsize=8.5, color=CURVE)

k = 5.0
xp   = np.linspace(-3.5, 1.15, 500)
yp   = xp**2 + k*xp + k
mask = (yp >= -2.2) & (yp <= 8)
ax.plot(xp[mask], yp[mask], color=CURVE, lw=1.9)

ax_v, ay_v = -k/2, k - k**2/4
bx_v, by_v = 0.0, k
slope = (by_v - ay_v) / (bx_v - ax_v)
xl = np.linspace(-3.2, 2.0, 200)
yl = slope*(xl - bx_v) + by_v
ax.plot(xl, yl, color=CURVE, lw=1.2)

prop9 = fm.FontProperties(fname=FONT_REG, size=9)
ax.plot(ax_v, ay_v, 'o', color=CURVE, ms=4.5)
ax.text(ax_v-0.22, ay_v-0.5, 'A', fontsize=9.5, ha='center',
        fontproperties=prop9, color=CURVE)
ax.plot(bx_v, by_v, 'o', color=CURVE, ms=4.5)
ax.text(bx_v+0.18, by_v+0.25, 'B', fontsize=9.5,
        fontproperties=prop9, color=CURVE)
ax.text(-2.85, 6.7, 'y=f(x)', fontsize=8, style='italic', color='#555')
ax.text( 1.45, -1.65,'y=g(x)',fontsize=8, style='italic', color='#555')

plt.tight_layout(pad=0.15)
buf = io.BytesIO()
fig.savefig(buf, format='png', dpi=220, bbox_inches='tight',
            facecolor='#FAF9F6')
plt.close()
g64 = base64.b64encode(buf.getvalue()).decode()

# ── HTML ─────────────────────────────────────────────────
html = f"""<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<style>
* {{ margin:0; padding:0; box-sizing:border-box; }}

@page {{
  size: A4;
  margin: 24mm 22mm 22mm 22mm;
  background: #FAF9F6;
}}

body {{
  font-family: 'Noto Sans CJK KR', sans-serif;
  font-size: 11.5pt;
  color: #1A1A1A;
  background: #FAF9F6;
}}

/* ── 헤더 ── */
.header {{
  display: flex;
  align-items: flex-end;
  gap: 16px;
  margin-bottom: 4px;
}}

.num-wrap {{
  display: flex;
  align-items: baseline;
  gap: 10px;
}}

.problem-num {{
  font-size: 54pt;
  font-weight: 300;
  line-height: 1;
  color: #1A1A1A;
  letter-spacing: -2px;
}}

.level-badge {{
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: #EDEBE5;
  border-radius: 20px;
  padding: 3px 10px;
  font-size: 8.5pt;
  color: #555;
  margin-bottom: 8px;
  font-weight: 500;
}}
.dot {{
  width: 5px; height: 5px;
  border-radius: 50%;
  background: #C96A3A;
  display: inline-block;
}}

/* 포인트 컬러 구분선 */
.divider-wrap {{
  margin: 4px 0 18px 0;
  height: 2px;
  background: linear-gradient(to right, #C96A3A 60px, #E8E5DF 60px);
}}

/* ── 문제 영역 ── */
.problem-card {{
  background: white;
  border-radius: 10px;
  padding: 18px 20px;
  margin-bottom: 16px;
  border: 1px solid #E8E5DF;
}}

.problem-body {{
  display: flex;
  gap: 16px;
  align-items: flex-start;
}}

.problem-text {{
  flex: 1;
  line-height: 2.05;
  font-size: 11.5pt;
  word-break: keep-all;
}}

.mi {{ font-style: italic; }}

.problem-graph {{
  width: 185px;
  flex-shrink: 0;
  border-radius: 6px;
  overflow: hidden;
}}
.problem-graph img {{ width: 100%; display: block; }}

/* ── 풀이 공간 ── */
.section-header {{
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}}
.section-bar {{
  width: 3px;
  height: 14px;
  background: #C96A3A;
  border-radius: 2px;
  flex-shrink: 0;
}}
.section-title {{
  font-size: 10pt;
  font-weight: 700;
  color: #333;
  letter-spacing: 2px;
}}

.work-lines {{
  background: white;
  border-radius: 10px;
  border: 1px solid #E8E5DF;
  padding: 8px 16px;
  margin-bottom: 16px;
}}
.work-line {{
  border-bottom: 1px solid #ECEAE4;
  height: 34px;
}}
.work-line:last-child {{ border-bottom: none; }}

/* ── 정답란 ── */
.answer-box {{
  background: white;
  border-radius: 10px;
  border: 1.5px solid #C96A3A;
  padding: 12px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
}}
.answer-label {{
  font-size: 10.5pt;
  font-weight: 700;
  color: #C96A3A;
  letter-spacing: 3px;
  white-space: nowrap;
}}
.answer-line {{
  flex: 1;
  border-bottom: 1.5px solid #DDD;
  height: 20px;
  max-width: 280px;
}}
</style>
</head>
<body>

<div class="header">
  <div class="num-wrap">
    <div class="problem-num">0945</div>
    <div class="level-badge">
      <span class="dot"></span>
      중
      <span class="dot"></span>
    </div>
  </div>
</div>

<div class="divider-wrap"></div>

<div class="problem-card">
  <div class="problem-body">
    <div class="problem-text">
      오른쪽 그림과 같이 이차함수<br>
      <span class="mi">f</span>(<span class="mi">x</span>) =
      <span class="mi">x</span>² + <span class="mi">kx</span> +
      <span class="mi">k</span>의 그래프의 꼭짓점을 A라 하고,
      이 그래프와 <span class="mi">y</span>축과의 교점을 B라 하자.
      직선 <span class="mi">y</span> = <span class="mi">g</span>(<span class="mi">x</span>)가
      두 점 A, B를 지날 때, 부등식<br>
      <span class="mi">f</span>(<span class="mi">x</span>) &minus;
      <span class="mi">g</span>(<span class="mi">x</span>) &lt; 0을
      만족시키는 정수 <span class="mi">x</span>가 3개가 되도록 하는
      양수 <span class="mi">k</span>의 값의 범위를 구하시오.
    </div>
    <div class="problem-graph">
      <img src="data:image/png;base64,{g64}" alt="graph">
    </div>
  </div>
</div>

<div class="section-header">
  <div class="section-bar"></div>
  <div class="section-title">풀 이</div>
</div>

<div class="work-lines">
  {''.join('<div class="work-line"></div>' * 13)}
</div>

<div class="answer-box">
  <div class="answer-label">정 답</div>
  <div class="answer-line"></div>
</div>

</body>
</html>
"""

out_html = '/home/user/Cluade/0945_claude.html'
out_pdf  = '/home/user/Cluade/0945_claude.pdf'
with open(out_html, 'w', encoding='utf-8') as f:
    f.write(html)

HTML(filename=out_html).write_pdf(out_pdf)
print("완료:", out_pdf)
