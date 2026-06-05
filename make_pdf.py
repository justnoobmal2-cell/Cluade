import matplotlib.pyplot as plt
import matplotlib.font_manager as fm
import numpy as np

# ── 폰트 ──────────────────────────────────────────────────
FONT_REG  = '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc'
FONT_BOLD = '/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc'
fm.fontManager.addfont(FONT_REG)
fm.fontManager.addfont(FONT_BOLD)

def prop(size=11, bold=False):
    return fm.FontProperties(fname=FONT_BOLD if bold else FONT_REG, size=size)

# ── 페이지 설정 ─────────────────────────────────────────
fig = plt.figure(figsize=(8.27, 11.69), facecolor='white')

# 메인 캔버스: fig 좌표 기준 [left, bottom, width, height]
AX_L, AX_B, AX_W, AX_H = 0.06, 0.04, 0.88, 0.92
ax = fig.add_axes([AX_L, AX_B, AX_W, AX_H])
ax.set_xlim(0, 100)
ax.set_ylim(0, 140)
ax.axis('off')

def to_fig(ax_x, ax_y):
    """ax 좌표(0-100, 0-140)를 fig 비율 좌표로 변환"""
    fx = AX_L + (ax_x / 100) * AX_W
    fy = AX_B + (ax_y / 140) * AX_H
    return fx, fy

# ══════════════════════════════════════════════════════════
#  HEADER: 번호 + 구분선
# ══════════════════════════════════════════════════════════
ax.text(2, 138, '0945', fontsize=52, fontweight='ultralight',
        ha='left', va='top', color='black', fontfamily='DejaVu Sans')

# 난이도: 번호 오른쪽
ax.text(55, 133, '● 중 ●', fontsize=9, ha='left', va='center',
        fontproperties=prop(9), color='#555555')

# 구분선
ax.plot([0, 100], [123, 123], 'k-', linewidth=1.4)

# ══════════════════════════════════════════════════════════
#  문제 텍스트 (왼쪽 열, x: 0~56)
# ══════════════════════════════════════════════════════════
lines = [
    '오른쪽 그림과 같이 이차함수',
    'f (x) = x² + kx + k의 그래프의 꼭짓점을',
    'A라 하고, 이 그래프와 y축과의 교점을',
    'B라 하자. 직선 y = g(x)가 두 점 A, B를',
    '지날 때, 부등식 f (x) − g(x) < 0을',
    '만족시키는 정수 x가 3개가 되도록',
    '하는 양수 k의 값의 범위를 구하시오.',
]
y_cursor = 119.5
LINE_H = 7.8
for line in lines:
    ax.text(2, y_cursor, line, ha='left', va='top', fontproperties=prop(11.5))
    y_cursor -= LINE_H

# ══════════════════════════════════════════════════════════
#  그래프 인셋 (오른쪽 열, x: 57~100, y: 78~123)
# ══════════════════════════════════════════════════════════
# fig 좌표 계산
gx_l = AX_L + (57 / 100) * AX_W       # 0.06 + 0.57*0.88 ≈ 0.5616
gy_b = AX_B + (78 / 140) * AX_H       # 0.04 + 0.557*0.92 ≈ 0.5526
gx_w = (43 / 100) * AX_W              # 0.43*0.88 ≈ 0.3784
gy_h = (45 / 140) * AX_H              # 0.321*0.92 ≈ 0.2957

ax_g = fig.add_axes([gx_l, gy_b, gx_w, gy_h])
ax_g.set_xlim(-3.2, 2.6)
ax_g.set_ylim(-2.2, 8)
ax_g.set_facecolor('white')
for s in ax_g.spines.values():
    s.set_visible(False)
ax_g.set_xticks([])
ax_g.set_yticks([])

# 축 화살표
ax_g.annotate('', xy=(2.6, 0), xytext=(-3.2, 0),
              arrowprops=dict(arrowstyle='->', color='black', lw=1.0))
ax_g.annotate('', xy=(0, 8), xytext=(0, -2.2),
              arrowprops=dict(arrowstyle='->', color='black', lw=1.0))
ax_g.text(2.4,  0.35, 'x', fontsize=9)
ax_g.text(0.12, 7.5,  'y', fontsize=9)
ax_g.text(0.12, -0.45, 'O', fontsize=8)

# 포물선 k=5 → A=(-2.5, -1.25), B=(0,5)
k_ex  = 5.0
xp    = np.linspace(-3.5, 1.2, 400)
yp    = xp**2 + k_ex * xp + k_ex
mask  = (yp >= -2.2) & (yp <= 8)
ax_g.plot(xp[mask], yp[mask], 'k-', linewidth=1.7)

ax_val, ay_val = -k_ex / 2, k_ex - (k_ex**2) / 4  # -2.5, -1.25
bx_val, by_val = 0.0, k_ex                          #  0,   5

slope  = (by_val - ay_val) / (bx_val - ax_val)
xline  = np.linspace(-3.2, 2.0, 200)
yline  = slope * (xline - bx_val) + by_val
ax_g.plot(xline, yline, 'k-', linewidth=1.2)

# 점 A, B
ax_g.plot(ax_val, ay_val, 'ko', markersize=4.5)
ax_g.text(ax_val - 0.18, ay_val - 0.45, 'A', fontsize=9.5, ha='center')
ax_g.plot(bx_val, by_val, 'ko', markersize=4.5)
ax_g.text(bx_val + 0.18, by_val + 0.25, 'B', fontsize=9.5)

# 레이블 — 포물선 위 우측 분기 꼭대기 근처
ax_g.text(-2.8, 6.8,  'y=f (x)', fontsize=8.5, style='italic')
ax_g.text( 1.5, -1.7, 'y=g(x)', fontsize=8.5, style='italic')

# ══════════════════════════════════════════════════════════
#  풀이 공간
# ══════════════════════════════════════════════════════════
WORK_TOP = 62
WORK_BOT = 10

ax.plot([0, 100], [WORK_TOP, WORK_TOP], color='#777', lw=0.9, linestyle='--')
ax.text(2, WORK_TOP - 2, '풀  이', ha='left', va='top',
        fontproperties=prop(10.5, bold=True), color='#333')

# 쓰기 줄
for y in np.linspace(WORK_TOP - 8, WORK_BOT + 5, 9):
    ax.plot([2, 98], [y, y], color='#c8c8c8', lw=0.65)

# 정답란
ax.plot([0, 100], [WORK_BOT - 0.5, WORK_BOT - 0.5], 'k-', lw=1.1)
ax.text(2, WORK_BOT - 3, '정  답 :', ha='left', va='top',
        fontproperties=prop(11.5, bold=True))
ax.plot([20, 75], [WORK_BOT - 2.8, WORK_BOT - 2.8], 'k-', lw=0.9)

# ── 저장 ──────────────────────────────────────────────────
for ext in ('pdf', 'png'):
    plt.savefig(f'/home/user/Cluade/0945_reformatted.{ext}',
                dpi=200, bbox_inches='tight', facecolor='white')
print("완료!")
