# 노력하면 살이 빠질까? — 운동 vs 마운자로

정보디자인 과제용 인터랙션 웹게임. 같은 남성 두 명(25세, 105 kg, BMI 38)이 한쪽은 **운동**으로,
다른 한쪽은 **알바해서 번 돈으로 주사**를 맞으며 살아간다. 끝 화면도 결론 문구도 없다. 두 묘비만 남는다.

설계서: [`docs/design.md`](docs/design.md) — 데이터셋 13개, 조합 인사이트, 화면 구조, 체중 모델, 비주얼 규칙.

## 실행

**`index.html` 파일 하나를 더블클릭하면 된다.** CSS와 JS가 전부 안에 들어 있어 서버가 필요 없다.
전시용 PC에는 이 파일 하나만 가져가면 된다(글꼴 Pretendard만 CDN이라 오프라인이면 시스템 글꼴로 대체).

### 코드를 고칠 때

원본은 `src/` 에 ES module로 나뉘어 있다. 고친 뒤 아래 한 줄이면 `index.html`이 다시 만들어진다.

```bash
node tools/bundle.js
```

## 테스트

```bash
node tests/model.test.js
```

SURMOUNT-1 위약군 72주 −3.1 %(주 150분 운동), 15 mg 72주 −17.8 %p, SURMOUNT-4 중단 후 52주 +14 %를
`src/model.js`의 순수 함수로 재현하는지 검증한다. 파라미터 재보정은 `node tools/calibrate.js`.

## Vercel 배포

1. Vercel에서 이 저장소를 import
2. Framework Preset: **Other**
3. Build Command: 비움 · Output Directory: 루트(비움)
4. Deploy

## 구조

```
index.html          완성본 — 이 파일 하나로 실행 (tools/bundle.js 가 생성)
src/page.html       화면 골격 (원본)
src/style.css       비주얼 규칙 (크림 배경, 빨간 테이블, 왼쪽 주황·초록, 오른쪽 보라·자주)
src/data.js         모든 상수 + 출처 주석 ("추정" 표기 포함)
src/model.js        세트 포인트 체중 모델 — 순수 함수
src/characters.js   캐릭터·테이블·체중계·주사기·묘비 인라인 SVG
src/chart.js        체중 타임라인 차트
src/intro.js        25초 인트로 모션 (클릭으로 건너뛰기)
src/game.js         턴제 메인 게임과 렌더링
src/panel.js        ⓘ 데이터 패널
tests/model.test.js 모델 검증
tools/calibrate.js  파라미터 보정
tools/bundle.js     src/ → index.html 한 파일로 합치기
```
