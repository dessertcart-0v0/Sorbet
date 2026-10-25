# 소르베 커스텀 CSS 가이드

소르베의 모양을 자유롭게 바꿀 수 있습니다. **설정 → 스킨 탭 → 커스텀 CSS**에 입력하고 저장하면 즉시 적용됩니다.

---

## 1. 시작하기

가장 간단한 예시부터:

```css
/* 결과 내용 영역을 더 크게 */
#srb-panel { --srb-result-h: 500px; }

/* 보관함·픽업 카드 배경 밝게 */
.srb-ar-card { background: rgba(255,255,255,.06); }

/* 결과 본문과 Markdown 제목 1~4를 함께 키우기 */
#srb-panel { --srb-content-size: 17px; }
```

---

## 1.5 적용 범위: 커스텀 CSS vs 스킨 프리셋

소르베의 모양은 두 가지로 바꿉니다.

| 방법 | 위치 | 적용 범위 |
|------|------|-----------|
| **커스텀 CSS** | 설정 → 스킨 탭 → 커스텀 CSS | 모든 채팅에 공통 적용 |
| **스킨 프리셋** | 설정 → 스킨 탭 → 스킨 프리셋 | 미리 만들어진 색 조합을 커스텀 CSS 칸에 한 번에 채움 |

채팅 백업에 그 채팅만의 CSS가 들어 있으면, 가져올 때 그 채팅에만 따로 적용됩니다(커스텀 CSS 위에 덮어씀).

**기본값**: 커스텀 CSS를 **비우면 기본 디자인**이 적용됩니다. 스킨 탭의 **기본값**을 누르면 기본 CSS가 편집창에 들어와, 그걸 시작점으로 수정할 수 있습니다.

**스킨 프리셋**: 드롭다운에서 고르면 그 색 조합이 CSS 편집창에 **즉시** 채워집니다. 그대로 저장하거나, 더 수정해서 쓰면 됩니다. 기본 제공 스킨: 핑크 로맨스, 다크 골드 판타지, 모던 폰, 네온 터미널, 전술 HUD(골드), SF HUD(블루), 픽셀 일기장(세피아). 모든 내장 스킨은 드롭다운·스크롤바·토글 색까지 함께 지정되어 있어 전체 UI가 일관되게 바뀝니다.

**설정창도 스킨 적용**: 커스텀 CSS 는 문서 전체에 들어가므로 `.srb-modal`, `.srb-help-note` 처럼 **클래스로 직접 적으면 설정창에도 그대로 먹습니다**. 다만 스킨이 흔히 쓰는 `#srb-panel { --primary: … }` 꼴의 변수 지정은 설정창이 패널 **바깥**에 있어 닿지 않습니다. **설정 → 스킨 탭 → 창 스킨 → "설정창·편집기 창도 윈도우 CSS 따라가기"** 를 켜면 그 변수 블록을 설정·편집 모달에도 복사해 줍니다.

---

## 2. 소르베 전용 CSS 변수

`#srb-panel`에 지정하면 패널 전체에 적용됩니다.

| 변수 | 의미 | 기본값 |
|------|------|--------|
| `--srb-w` | 패널 너비 | `420px` (설정 슬라이더로도 조절) |
| `--srb-result-h` | 결과 내용 최대 높이 (이 높이 넘으면 스크롤) | `320px` |
| `--srb-content-size` | 결과 본문 글자 크기 | `15px` |
| `--srb-content-h1-size` ~ `--srb-content-h4-size` | Markdown 제목 1~4 크기 | 본문 크기에서 자동 계산 |

```css
#srb-panel {
  --srb-w: 480px;
  --srb-result-h: 600px;
  --srb-content-size: 17px;
}
```

본문 글자 크기는 **설정 → 화면 → 결과 본문 글자 크기** 슬라이더로 조절하는 것이
기본입니다. 슬라이더는 12~22px 정수 단위이며 Markdown 제목 1~4도 같은 비율로 함께
계산합니다. CSS로 제목만 따로 조절해야 할 때만 `--srb-content-h1-size` 등을 지정하세요.

### 2.5 상태·뱃지·토스트 변수

아래 변수도 `#srb-panel`에 넣어 조절합니다. 기존 내장 스킨에도 자동으로 보완됩니다.

| 변수 | 의미 | 기본값 |
|------|------|--------|
| `--srb-color-generating` | 생성 중 표시·중단 관련 색 | 주황 `#f59e0b` |
| `--srb-color-danger` | 삭제·중단 등 위험 동작 색 | 빨강 `#ef4444` |
| `--srb-badge-bg` / `--srb-badge-border` / `--srb-badge-text` | 일반 결과 수·정보 뱃지 | 강조색 기반 |
| `--srb-badge-accent-bg` / `--srb-badge-accent-border` / `--srb-badge-accent-text` | 모드·갈래 등 강조 뱃지 | 강조색 기반 |
| `--srb-toast-info` / `--srb-toast-success` / `--srb-toast-warning` / `--srb-toast-error` | 알림 팝업 배경색 | 보라·초록·주황·빨강 |
| `--srb-toast-text` | 알림 팝업 글자색 | `#fff` |

```css
#srb-panel {
  --srb-color-generating: #fb923c;
  --srb-color-danger: #e11d48;
  --srb-badge-bg: color-mix(in srgb, #38bdf8 14%, transparent);
  --srb-badge-border: color-mix(in srgb, #38bdf8 34%, transparent);
  --srb-badge-text: #7dd3fc;
  --srb-toast-success: #16a34a;
}
```

---

## 3. 마리나라 테마 변수

마리나라가 제공하는 색상 변수를 그대로 쓰면 다크/라이트 테마에 자동으로 어울립니다.

| 변수 | 의미 |
|------|------|
| `--primary` | 강조색 (보라) |
| `--primary-dark` | 진한 강조색 |
| `--primary-foreground` | 강조 버튼(⚡생성 등) 글자색 — 기본 `#fff`. 라이트 스킨에서 어두운 글자가 필요할 때 지정 |
| `--background` | 앱 배경 |
| `--foreground` | 기본 글자색 |
| `--card` | 카드 배경 |
| `--border` | 테두리 |
| `--muted-foreground` | 보조 글자색 (흐린 텍스트) |
| `--color-error` | 빨강 (경고·삭제) |
| `--color-success` | 초록 (성공) |
| `--font-family` | 앱 기본 폰트 |

> `--primary`는 강조 버튼뿐 아니라 **아이콘(SVG)·스크롤바·모드 배지(RP/VN)·자동 감지 표시·드래그 삽입선**의 색까지 함께 결정합니다. `--primary` 하나만 바꿔도 패널 전체의 강조 색이 일관되게 따라옵니다. 아이콘은 글자색(`currentColor`)을 따르는 SVG라 배경색과 항상 잘 어울립니다.

```css
/* 강조색을 직접 지정하지 않고 마리나라 변수 재사용 */
.srb-badge { background: var(--primary); color: #fff; }
```

> **테마 반응 범위**: 드롭다운 배경(`.srb-set-select`, `.srb-mini-select`), 검색창(`.srb-search`), 텍스트에어리어(`.srb-mta`, `.srb-css-ta`), 채팅바 배경(`.srb-chatbar`), 스크롤바 색, 토글 트랙 등 대부분의 UI 요소가 위 변수를 따라 자동으로 바뀝니다. 별도로 지정하지 않아도 `--background`·`--card`·`--border`만 설정하면 전체 배색이 자연스럽게 맞춰집니다.

---

## 4. 주요 CSS 클래스

화면 구조별로 손볼 수 있는 클래스 목록입니다. (모든 클래스는 `srb-` 접두사)

### 패널 골격
| 선택자 | 영역 |
|--------|------|
| `#srb-panel` | 패널 전체 (루트) |
| `#srb-tab` | 우측 런처 탭 (흰 바탕, 아이콘은 평소 흑백 → 올리면 컬러) |
| `.srb-hd` | 상단 헤더 (제목·설정·닫기) |
| `.srb-chatbar` | 채팅 정보 바 (채팅명·턴 수) |
| `.srb-bd` | 본문 스크롤 영역 |
| `.srb-modal` | 설정·편집 모달 창 (윈도우 CSS 토글 시) |
| `.srb-ov` | 모달 뒷배경(오버레이) |
| `.srb-set-select` | 설정 드롭다운 |
| `.srb-mini-select` | 작은 드롭다운 (양식 관리 정렬 등) |
| `.srb-mode-badge` | 채팅 모드 배지 (RP/VN 등, `--primary` 색을 따름) |
| `.srb-toggle-track` / `.srb-toggle-thumb` | 설정 토글 스위치 |
| `.srb-mini-toggle` / `.srb-mini-track` | 원문/번역 전환 토글 |
| `.srb-range` | 슬라이더 (패널 너비 등) |

### 설정창
| 선택자 | 영역 |
|--------|------|
| `.srb-set-row` | 설정 토글 한 줄 (라벨 + `?` + 스위치) |
| `.srb-help-btn` | 설명을 펼치는 `?` 버튼 |
| `.srb-help-note` | 펼쳐진 설명 상자 (배경·여백만 있고 테두리 없음) |
| `.srb-set-fold` | 접히는 토글 묶음 (`생성`·`안전`) |
| `.srb-fold-count` | 접힌 묶음 제목 옆의 `· 켜짐 2` |
| `.srb-prompt-ta` | 제목 지시문 입력칸 (높이 고정, 안쪽에서만 스크롤) |
| `.srb-adv` | 접기(`<details>`) 공통 — 지시문·선택지 등 |

### 갈래 옮기기 · 제목 검토
| 선택자 | 영역 |
|--------|------|
| `.srb-move-row` | 옮길 자리 한 줄 |
| `.srb-move-dest` | 왼쪽의 **옮긴 뒤 타래 번호** 배지 |
| `.srb-move-group` | 결과가 여럿일 때의 묶음 머리 |
| `.srb-btr-row` | 제목 검토의 한 줄 |
| `.srb-btr-from` | 검토 줄의 `지금 제목` |
| `.srb-btr-off` | 적용하지 않기로 꺼 둔 줄 |

### 결과 · 알림
보관함·픽업의 카드와 결과창은 아래 **탭 · 주방 · 보관함 · 결과창** 표에 있습니다.

| 선택자 | 영역 |
|--------|------|
| `.srb-result-content` | 결과창 본문 |
| `.srb-badge` | 정보 뱃지 (#번호, 번역 등) |
| `.srb-continue-progress` | 이어쓰기 생성 중 상태·중단 영역 |
| `.srb-ts` | 날짜 텍스트 |
| `.srb-toast` | 알림 팝업 (번역 완료, 생성 완료 등) |
| `.srb-toast-success` | 성공 알림 |
| `.srb-toast-warning` | 경고·생성 중단 알림 |
| `.srb-toast-error` | 오류 알림 |
| `.srb-mini-toggle` | 원문/번역 전환 토글 |
| `.srb-code` | 코드블록 박스 |

### 버튼
| 선택자 | 영역 |
|--------|------|
| `.srb-btn` | 모든 버튼 공통 |
| `.srb-btn-primary` | 강조 버튼 (⚡생성 등) |
| `.srb-btn-ghost` | 외곽선 버튼 |
| `.srb-btn-icon` | 아이콘 버튼 (검색·수정·재생성·삭제 등, SVG 아이콘) |
| `.srb-btn-icon svg` | 아이콘 자체 — 크기는 `width`/`height`, 색은 `currentColor` |
| `.srb-btn-danger` | 빨강 버튼 |
| `#srb-us-read` | 설정 → 저장 → 저장 용량 창의 `저장 읽어오기` 버튼 (`.srb-btn-ghost`도 함께 적용) |

`저장 읽어오기`는 저장 용량 모달 안에 있으므로, 패널에만 적용되는 커스텀 CSS에서 모달까지 같은
색을 쓰려면 **설정 → 스킨 → 설정창·편집기 창도 윈도우 CSS 따라가기**를 켜세요. 버튼의
ID는 기능 바인딩에도 쓰이므로 HTML/JavaScript에서 이름을 바꾸지 말고 CSS 선택자로만 사용합니다.

---

## 5. 자주 쓰는 예시 모음

```css
/* ① 패널을 둥글고 부드럽게 */
#srb-panel {
  border-left: none;
  border-radius: 16px 0 0 16px;
}

/* ② 보관함 카드를 카드답게 — 그림자 + 둥근 모서리 */
.srb-ar-card {
  border-radius: 14px;
  box-shadow: 0 2px 12px rgba(0,0,0,.2);
}

/* ③ 결과 글자를 읽기 편하게 — 제목도 함께 커짐 */
#srb-panel { --srb-content-size: 17px; }
.srb-result-content { line-height: 1.85; }

/* ④ 강조색 전체 변경 (예: 핑크) */
#srb-panel { --primary: #ec4899; --primary-dark: #db2777; }

/* ⑤ 이어쓰기 입력칸만 색 다르게 */
.srb-cbar { background: color-mix(in srgb, #38bdf8 10%, transparent); }

/* ⑥ 코드블록 폰트 키우기 */
.srb-code code { font-size: 13px; }

/* ⑦ 뱃지를 알약 모양으로 */
.srb-badge { border-radius: 999px; padding: 2px 9px; }

/* ⑧ 드롭다운 펼친 목록 색 대비 (배경 어둡게 / 글자 밝게) */
.srb-set-select option, .srb-mini-select option { background: #1a1a26; color: #e2e8f0; }

/* ⑨ 알림·생성 중·삭제 색과 모양 바꾸기 */
#srb-panel {
  --srb-color-generating: #f97316;
  --srb-color-danger: #e11d48;
  --srb-toast-success: #16a34a;
  --srb-toast-error: #e11d48;
}
.srb-toast { border-radius: 999px; font-size: 12px; }

/* ⑩ 드롭다운·토글 꾸미기 */
.srb-set-select, .srb-mini-select { border-radius: 10px; }
.srb-toggle-track { height: 22px; }          /* 토글 크기 */
.srb-mini-track { background: #444; }         /* 번역 토글 트랙 */

/* ⑪ 스크롤바 색 바꾸기 (기본은 --primary 색을 따름) */
.srb-bd::-webkit-scrollbar-thumb,
.srb-result-content::-webkit-scrollbar-thumb { background: #888; }

/* ⑫ 아이콘 크기 키우기 (아이콘은 글자색을 따르는 SVG) */
.srb-btn-icon svg { width: 17px; height: 17px; }

/* ⑬ 저장 읽어오기 버튼만 강조 */
#srb-us-read {
  border-color: var(--primary);
  color: var(--primary);
  font-weight: 700;
}

/* ⚠️ 토스트는 패널 바깥에 뜨지만, --srb-toast-* 같은 소르베 전용 변수는
   자동 복사되므로 #srb-panel에서 지정해도 적용됩니다.
   단, --primary·--background 같은 일반 테마 변수만 바꾼 경우에는 토스트에
   자동 상속되지 않을 수 있으니 필요하면 --srb-toast-*도 함께 지정하세요. */
```

---

## 6. JSON 파일로 만드는 방법

커스텀 CSS는 JSON 파일로 저장해두면 다른 기기에서도 **스킨 탭 → 커스텀 CSS → 불러오기**로 바로 적용할 수 있습니다.

### 형식

```json
{
  "_type": "srb-css",
  "_version": 1,
  "css": "#srb-panel { --srb-result-h: 500px; }\n.srb-ar-card { border-radius: 14px; }"
}
```

- `css` 키 안에 CSS 전체를 **한 줄 문자열**로 넣습니다.
- 줄바꿈은 `\n`으로 표기합니다.
- `_type`, `_version`은 없어도 동작하지만, 넣으면 파일을 알아보기 쉽습니다.
- `css` 키만 있는 `{"css": "..."}` 형태나, 그냥 CSS 평문 파일도 불러올 수 있습니다(파일 고르기 창에서 '모든 파일'로 바꿔 고르세요).

> **간단한 방법**: 스킨 탭에서 CSS를 다 작성한 뒤 **내보내기**를 누르면 위 형식의 파일이 자동으로 만들어집니다. 그 파일을 보관했다가 다른 기기에서 불러오면 됩니다.

---

### 스킨 프리셋 파일

스킨 프리셋 관리(스킨 프리셋 옆 톱니)의 **추출**은 아래 형식으로 저장하고, **JSON 가져오기**로 다시 불러옵니다.
가져오면 프리셋 목록에 이름 그대로 추가되고, 고르면 커스텀 CSS 칸에 채워집니다.

```json
{
  "_type": "srb-skin",
  "_version": 1,
  "name": "스킨 이름",
  "css": "#srb-panel { --primary: #e58fa6; }"
}
```

---

## 7. AI에게 CSS를 만들어 달라고 요청하는 법

챗GPT · 제미나이 같은 AI에게 아래처럼 요청하면 바로 쓸 수 있는 JSON을 받을 수 있습니다.

### 프롬프트 예시 (복사해서 사용)

```
마리나라 "소르베" 확장의 커스텀 CSS를 만들어줘.
아래 JSON 형식으로, css 키 안에 CSS 전체를 한 줄 문자열(줄바꿈은 \n)로 넣어서 출력해.

{
  "_type": "srb-css",
  "_version": 1,
  "css": "여기에 CSS"
}

사용 가능한 선택자:
- #srb-panel (패널 전체, --srb-w 너비 / --srb-result-h 결과높이 / --srb-content-size 본문 크기)
- .srb-ar-card (보관함·픽업 카드), .srb-st-order (주방 주문서)
- .srb-viewer-inline (결과창), .srb-result-content (결과 본문), .srb-cbar (이어쓰기 입력칸)
- .srb-badge (뱃지), .srb-nav-tab (위쪽 탭)
- .srb-btn-primary (강조 버튼), .srb-btn-icon (아이콘 버튼)
- .srb-chatbar (채팅 정보 바)
마리나라 테마 변수(--primary, --primary-foreground, --background, --foreground, --border, --card,
--muted-foreground, --color-error, --color-success)와 소르베 전용 변수(--srb-color-generating,
--srb-color-danger, --srb-badge-bg, --srb-toast-success 등)를 활용해.

원하는 분위기: [여기에 원하는 스타일 적기 — 예: "파스텔 핑크에 둥근 모서리, 부드러운 그림자"]
```

마지막 줄의 `[원하는 분위기]`만 바꿔서 요청하면 됩니다. 받은 JSON을 파일로 저장한 뒤, 스킨 탭에서 **불러오기 → 저장**하면 적용됩니다.

### 분위기 예시
- `"다크 모드에 네온 보라 강조, 글래스모피즘(반투명 흐림) 느낌"`
- `"미니멀 화이트, 얇은 테두리, 산세리프, 여백 넉넉하게"`
- `"빈티지 종이 질감에 세리프 폰트, 따뜻한 베이지 톤"`
- `"터미널 느낌 — 검정 배경에 초록 모노스페이스 글꼴"`

---

## 8. 문제 해결

- **적용이 안 돼요** → CSS 입력 후 반드시 **저장** 버튼을 누르세요.
- **너무 많이 바꿔서 망가졌어요** → 스킨 탭의 커스텀 CSS 칸을 비우고 **저장**하면 기본값으로 돌아갑니다.
- **특정 부분만 안 바뀌어요** → 마리나라 기본 스타일이 우선할 수 있습니다. 해당 선택자 뒤에 `!important`를 붙여보세요. 예: `.srb-ar-card { background: pink !important; }`
- **글자 크기·글꼴만 안 바뀌어요** → 패널은 호스트 앱에 밀리지 않으려고 글자 크기·글꼴을
  `#srb-panel …` / `#srb-ov-active …` + `!important` 로 못박아 둡니다. 클래스만 쓴 규칙은
  `!important` 를 붙여도 **집니다**. ID 까지 같이 적으세요.
  ```css
  .srb-set-input { font-size: 20px !important; }                 /* ✗ 안 먹음 */
  #srb-ov-active .srb-set-input { font-size: 20px !important; } /* ✓ 설정창 */
  #srb-panel .srb-result-content { font-size: 19px !important; }/* ✓ 결과 본문 */
  ```
  색·배경·테두리처럼 `!important` 가 걸려 있지 않은 속성은 클래스만으로 바뀝니다.
- **선택자를 모르겠어요** → 브라우저에서 F12(개발자 도구) → 요소 선택 도구로 해당 부분을 클릭하면 `srb-` 클래스명을 확인할 수 있습니다.
- **저장 용량에 `원문 없는 과거 결과`가 보여요** → QR 원문은 없지만 생성 결과 레코드가 IndexedDB에 남아 있다는 뜻입니다. 빈 QR 카드는 만들지 않으며, 표시 행은 `.srb-usage-row`, 보조 설명은 `.srb-ctx-note` 스타일을 사용합니다.


---

## 소르베에서 새로 생긴 선택자 · 변수

QR 패널에서 가져온 CSS 는 백업 가져오기·CSS 불러오기 때 `#mqrp-` → `#srb-` 로 자동 변환됩니다.
아래는 소르베에서 새로 생긴 것들입니다.

### 화면 모드

소르베 창에는 늘 `data-ui="window"` 가 붙습니다(예전의 패널형은 없어졌습니다).

```css
/* 팝업형 창에만 */
#srb-panel[data-ui="window"] { border-radius: 20px; }

/* 팝업형 런처(오른쪽 아래 둥근 버튼)에만 */
#srb-tab[data-ui="window"] { background: #365b48; }

/* 창 최대 폭 (기본 1100px) */
:root { --srb-win-w: 1280px; }
```

> 팝업형 규칙은 `id + 속성` 이라 `#srb-panel { width: … }` 같은 일반 규칙보다 구체성이 높습니다.
> 스킨이 폭을 지정해도 창이 찌그러지지 않는 이유입니다. 창 모드 폭을 바꾸려면 위처럼
> `--srb-win-w` 를 쓰거나 `[data-ui="window"]` 까지 붙여서 쓰세요.

### 읽기 설정 변수

`설정 → 화면 → 읽기` 슬라이더가 이 변수를 겁니다. **기본값이면 변수를 아예 걸지 않습니다.**

| 변수 | 적용 위치 | 기본값(변수 없을 때) |
|---|---|---|
| `--srb-content-spacing` | 카드 결과 · 크게보기 자간 | `0` |
| `--srb-content-line` | 카드 결과 · 크게보기 행간 | 카드 `1.7` / 크게보기 `1.75` |
| `--srb-content-width` | 크게보기 읽기 폭 (%, 숫자만) | `100` |

커스텀 CSS 에서 이 변수를 직접 지정하면 슬라이더보다 우선합니다(같은 `:root` 라면 나중 규칙이 이김).

### 양식 배지

카드 제목·라이브러리 목록의 `분석` `스토리` `HTML` `직접선택` 배지는 인라인 스타일입니다.
`currentColor` 테두리를 쓰므로 제목 색을 바꾸면 배지도 따라 바뀝니다. 양식 이름과 같은 배지는 붙지 않습니다.

### 탭 · 주방 · 보관함 · 결과창

| 선택자 | 영역 |
|---|---|
| `.srb-nav-tab` | 위쪽 탭(주방 · 보관함 · 픽업 · 양식). 지금 탭은 `[aria-pressed="true"]` |
| `#srb-panel[data-page="studio"]` 등 | 지금 탭 — `studio`(주방) · `library`(보관함) · `fresh`(픽업) · `manage`(양식) |
| `.srb-st-order` | 주방 주문서(영수증 전체). 아래 톱니 가장자리는 `mask`, 깊이는 `--srb-zz` |
| `.srb-st-stub` | 주문서 머리줄(`주문서 · No.NNNN`) |
| `.srb-st-modes` | 양식 격자(기본 양식 · 프리셋 · `＋`) |
| `.srb-st-chip-main` | 격자의 양식 버튼. 고른 것은 `[aria-pressed="true"]` |
| `.srb-st-more` | 토핑 접기(`<details>`) · `.srb-st-more-sum` 은 접힌 머리줄의 값 요약 |
| `.srb-st-picks` / `.srb-st-pick` | 토핑 안 분량 · 출력 언어 · 참고 방식 한 줄 |
| `.srb-st-input` | 주문칸 |
| `.srb-img-bar` | `이미지 첨부 · 붙여넣기` 바. 파일을 끌어다 올리면 `.srb-img-over` |
| `.srb-st-ref` | 참고 · 컨텍스트 · 연결 줄 |
| `.srb-st-gen` | 생성 버튼(한 줄 전체) |
| `.srb-st-barcode` | 주문서 끝의 장식 바코드(`display:none` 으로 끌 수 있음) |
| `.srb-ar-card` | 보관함·픽업 카드 · 픽업의 생성 중 카드는 `.srb-fr-running` |
| `.srb-ar-list` / `.srb-ar-row` | 보관함 목록형 — 격자 / 한 줄 카드. 줄 끝의 채팅·날짜는 `.srb-ar-row-chat` · `.srb-ar-row-date` |
| `.srb-ar-view` | 검색칸 옆 `카드형 · 목록형` 전환 버튼 묶음 |
| `.srb-ar-chats` / `.srb-ar-fold` | 보관함 채팅방 칩 줄 / 그 줄 접기 버튼 |
| `.srb-ar-reader` / `.srb-ar-reader-hd` | 보관함·픽업의 결과 보기 / 그 머리(← · 제목 · 양식 태그) |
| `.srb-viewer-inline` | 자리에 그린 결과창(보관함 · 픽업 공통) |
| `.srb-vflow-mode` | 번호 줄 끝의 `이어 보기 | 한 편씩` |
| `.srb-vask` | 한 편씩 볼 때 본문 위 `주문` / `이어쓰기 지시` 칸 |
| `.srb-vturn-ask` | 이어 보기의 주문·지시 말풍선 |
| `.srb-cbar` | 결과창 아래 이어쓰기 입력칸. 접힌 상태는 `[data-folded="true"]` |
| `.srb-cbar-ta` | 이어쓰기 입력칸의 글 칸 |
| `.srb-cp-search` / `.srb-cp-star` | 채팅 선택 창의 검색칸 / 즐겨찾기 별 |
| `.srb-manage2` / `.srb-mg-tab` / `.srb-mg-pane` | 양식 2열 / 왼쪽 목록 버튼 / 오른쪽 칸 |
| `.srb-set-screen` / `.srb-set-slot` | 설정 화면 / 설정·하위 화면이 겹쳐 쌓이는 칸 |
| `.srb-pane-host` | 본문 칸에 그린 창(양식·설정). 목록 화면은 `[data-list]` |
| `.srb-pop` | 버튼 옆 팝오버(채팅 선택 · 참고 캐릭터 · 프리셋 모두 보기) |
| `.srb-cbar-opts` | 이어쓰기 입력칸 위 분량 · 연결 · 컨텍스트 줄 |
| `#srb-totop` | 보관함·픽업 목록의 맨 위로 버튼. 보일 때 `[data-show="true"]` |

```css
/* 주문서를 밝은 종이처럼 */
#srb-panel .srb-st-order { background: #f6f1e7; color: #2b2620; }

/* 톱니를 더 크게 */
#srb-panel .srb-st-order { --srb-zz: 9px; }

/* 런처 아이콘을 늘 컬러로 */
#srb-tab > svg { filter: none; }
```
