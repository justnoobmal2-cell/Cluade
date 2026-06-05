"""
HTML/CSS 기반으로 깔끔한 수학 문제 PDF 생성
"""
import subprocess, sys, base64
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.font_manager as fm
import numpy as np
import io

# ── 그래프를 PNG base64로 만들기 ──────────────────────────
FONT_REG = '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc'
fm.fontManager.addfont(FONT_REG)

fig, ax = plt.subplots(figsize=(3.2, 2.8), facecolor='white')
ax.set_xlim(-3.2, 2.6)
ax.set_ylim(-2.2, 8)
ax.set_facecolor('white')
for s in ax.spines.values():
    s.set_visible(False)
ax.set_xticks([])
ax.set_yticks([])

# 축
ax.annotate('', xy=(2.6,0),  xytext=(-3.2,0),
            arrowprops=dict(arrowstyle='->', color='#222', lw=1.1))
ax.annotate('', xy=(0,8),    xytext=(0,-2.2),
            arrowprops=dict(arrowstyle='->', color='#222', lw=1.1))
ax.text(2.45, 0.3,  'x', fontsize=10, color='#222')
ax.text(0.1,  7.55, 'y', fontsize=10, color='#222')
ax.text(0.12,-0.55, 'O', fontsize=9,  color='#222')

# 포물선 k=5  →  A=(-2.5, -1.25),  B=(0, 5)
k = 5.0
xp = np.linspace(-3.5, 1.15, 500)
yp = xp**2 + k*xp + k
mask = (yp >= -2.2) & (yp <= 8)
ax.plot(xp[mask], yp[mask], color='#111', lw=1.8)

ax_v, ay_v = -k/2, k - k**2/4   # vertex A
bx_v, by_v = 0.0, k              # B

slope  = (by_v - ay_v) / (bx_v - ax_v)
xl     = np.linspace(-3.2, 2.0, 200)
yl     = slope*(xl - bx_v) + by_v
ax.plot(xl, yl, color='#111', lw=1.3)

ax.plot(ax_v, ay_v, 'o', color='#111', ms=4.5)
ax.text(ax_v-0.22, ay_v-0.5, 'A', fontsize=10, ha='center',
        fontproperties=fm.FontProperties(fname=FONT_REG, size=10))
ax.plot(bx_v, by_v, 'o', color='#111', ms=4.5)
ax.text(bx_v+0.18, by_v+0.25, 'B', fontsize=10,
        fontproperties=fm.FontProperties(fname=FONT_REG, size=10))

ax.text(-2.9, 6.8, 'y=f(x)', fontsize=8.5, style='italic', color='#333')
ax.text( 1.5, -1.7,'y=g(x)', fontsize=8.5, style='italic', color='#333')

plt.tight_layout(pad=0.2)
buf = io.BytesIO()
fig.savefig(buf, format='png', dpi=200, bbox_inches='tight',
            facecolor='white')
plt.close()
graph_b64 = base64.b64encode(buf.getvalue()).decode()

# ── HTML 템플릿 ────────────────────────────────────────────
html = f"""<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<style>
  @import url('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc');

  * {{ margin:0; padding:0; box-sizing:border-box; }}

  @page {{
    size: A4;
    margin: 22mm 20mm 20mm 20mm;
  }}

  body {{
    font-family: 'Noto Sans CJK KR', 'NotoSansCJK', sans-serif;
    font-size: 12pt;
    color: #111;
    background: white;
  }}

  /* ── 헤더 영역 ── */
  .header {{
    display: flex;
    align-items: flex-end;
    gap: 14px;
    margin-bottom: 6px;
  }}
  .problem-num {{
    font-size: 52pt;
    font-weight: 200;
    line-height: 1;
    letter-spacing: -1px;
    color: #111;
  }}
  .badge {{
    display: inline-flex;
    align-items: center;
    gap: 5px;
    margin-bottom: 10px;
    font-size: 9pt;
    color: #555;
  }}
  .dot {{
    width: 7px; height: 7px;
    border-radius: 50%;
    background: #555;
    display: inline-block;
  }}
  .divider {{
    border: none;
    border-top: 1.5px solid #222;
    margin: 0 0 16px 0;
  }}

  /* ── 문제 본문 ── */
  .problem-body {{
    display: flex;
    gap: 0;
    align-items: flex-start;
    margin-bottom: 18px;
  }}
  .problem-text {{
    flex: 1;
    font-size: 12pt;
    line-height: 2.0;
    padding-right: 10px;
    word-break: keep-all;
  }}
  .math {{
    font-style: italic;
  }}
  .problem-graph {{
    width: 195px;
    flex-shrink: 0;
  }}
  .problem-graph img {{
    width: 100%;
    display: block;
  }}

  /* ── 풀이 공간 ── */
  .section-label {{
    font-size: 10.5pt;
    font-weight: 700;
    color: #333;
    margin-bottom: 6px;
    padding-bottom: 4px;
    border-bottom: 1px solid #bbb;
  }}
  .work-area {{
    margin-top: 6px;
  }}
  .work-line {{
    border-bottom: 1px solid #ddd;
    height: 32px;
  }}

  /* ── 정답란 ── */
  .answer-box {{
    margin-top: 18px;
    padding-top: 10px;
    border-top: 1.5px solid #333;
    display: flex;
    align-items: center;
    gap: 12px;
  }}
  .answer-label {{
    font-size: 12pt;
    font-weight: 700;
    white-space: nowrap;
  }}
  .answer-line {{
    flex: 1;
    border-bottom: 1px solid #444;
    height: 22px;
    max-width: 260px;
  }}
</style>
</head>
<body>

<div class="header">
  <div class="problem-num">0945</div>
  <div class="badge">
    <span class="dot"></span>
    중
    <span class="dot"></span>
  </div>
</div>

<hr class="divider">

<div class="problem-body">
  <div class="problem-text">
    오른쪽 그림과 같이 이차함수<br>
    <span class="math">f</span>(<span class="math">x</span>) = <span class="math">x</span>² + <span class="math">kx</span> + <span class="math">k</span>의 그래프의 꼭짓점을 A라 하고,
    이 그래프와 <span class="math">y</span>축과의 교점을 B라 하자.
    직선 <span class="math">y</span> = <span class="math">g</span>(<span class="math">x</span>)가 두 점 A, B를 지날 때,
    부등식 <span class="math">f</span>(<span class="math">x</span>) &minus; <span class="math">g</span>(<span class="math">x</span>) &lt; 0을 만족시키는
    정수 <span class="math">x</span>가 3개가 되도록 하는
    양수 <span class="math">k</span>의 값의 범위를 구하시오.
  </div>
  <div class="problem-graph">
    <img src="data:image/png;base64,{graph_b64}" alt="graph">
  </div>
</div>

<div class="work-area">
  <div class="section-label">풀&nbsp;&nbsp;이</div>
  {''.join('<div class="work-line"></div>' * 12)}
</div>

<div class="answer-box">
  <div class="answer-label">정&nbsp;&nbsp;답</div>
  <div class="answer-line"></div>
</div>

</body>
</html>
"""

out_html = '/home/user/Cluade/0945_v2.html'
out_pdf  = '/home/user/Cluade/0945_v2.pdf'

with open(out_html, 'w', encoding='utf-8') as f:
    f.write(html)

from weasyprint import HTML
HTML(filename=out_html).write_pdf(out_pdf)
print("완료:", out_pdf)
