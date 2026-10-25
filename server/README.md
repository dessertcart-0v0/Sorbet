# 소르베 서버 모듈 (선택)

없어도 소르베는 그대로 돌아가요. 마리나라 서버에 깔면 두 가지가 더 돼요.

- **서버 저장 동기화** — 결과 · 양식 · 설정을 마리나라 서버에 저장해요. 브라우저 데이터를 지워도 남고, 다른 기기와 같이 써요.
- **백그라운드 생성** — 창을 닫거나 폰 화면을 꺼도 생성이 서버에서 계속 돌아요. 다시 열면 결과를 받아 와요.

왜 따로 깔아야 하나요?

- 마리나라가 확장에 주는 저장소는 확장 하나당 1MB까지라, 쌓이는 결과물을 담기엔 작아요. 결과물까지 서버에 함께 저장하려고 소르베 전용 저장소(마리나라 데이터 폴더의 `sorbet/`)를 따로 만들어요.
- 마리나라는 생성을 요청한 브라우저 창이 닫히면 생성을 멈춰요. 서버가 자기 자신에게 생성을 요청하게 하면 창을 닫아도 끝까지 써요.

## AI에게 맡기기

이 `server` 폴더를 통째로 AI 코딩 도우미에게 주고 이렇게 말하면 돼요.

> 이 폴더의 README 대로 내 마리나라 엔진에 소르베 서버 모듈을 깔아 줘. 마리나라는 ○○에 깔려 있어.

○○에는 마리나라가 깔린 곳(윈도우 폴더 경로, 도커, 안드로이드 Termux 등)을 적어요.

## 설치 방법

파일은 네 개예요.

| 파일 | 넣을 곳 |
|---|---|
| `routes/sorbet.routes.js` | `packages/server/dist/routes/` |
| `routes/sorbet-runs.routes.js` | `packages/server/dist/routes/` |
| `services/storage/sorbet.storage.js` | `packages/server/dist/services/storage/` |
| `services/storage/sorbet-runs.storage.js` | `packages/server/dist/services/storage/` |

`packages/server/dist` 는 마리나라 엔진 폴더 안에서 빌드된 서버가 들어 있는 곳이에요. 도커로 돌리면 컨테이너 안의 같은 자리예요.

1. 마리나라를 끄세요.
2. 위 표대로 네 파일을 복사해요.
3. `packages/server/dist/routes/index.js` 를 열어 두 군데를 고쳐요.
   - 맨 위 `import` 줄들 사이에 두 줄을 넣어요.
     ```js
     import { sorbetRoutes } from "./sorbet.routes.js";
     import { sorbetRunsRoutes } from "./sorbet-runs.routes.js";
     ```
   - `await app.register(…, { prefix: "/api/…" });` 줄들이 모인 곳에 두 줄을 넣어요.
     ```js
     await app.register(sorbetRoutes, { prefix: "/api/sorbet" });
     await app.register(sorbetRunsRoutes, { prefix: "/api/sorbet-runs" });
     ```
4. 마리나라를 켜요.
5. 브라우저에서 아래 두 주소를 열어 `"ok":true` 가 보이면 끝이에요.
   - `<마리나라 주소>/api/sorbet/health`
   - `<마리나라 주소>/api/sorbet-runs/health`
6. 소르베 **설정 → 저장** 에서 서버 동기화를 켜요. 백그라운드 생성은 모듈이 있으면 저절로 쓰여요.

## 알아 둘 점

- **엔진을 업데이트하거나 다시 빌드하면 `dist` 가 새로 만들어져 모듈이 빠져요.** 그때는 2~3번을 다시 해요.
- 저장 위치는 마리나라 데이터 폴더의 `sorbet/` 예요(`state.json`, `results/` 채팅별 결과, `runs/` 끝난 생성 24시간 보관). 마리나라 데이터를 백업할 때 이 폴더도 같이 챙겨요.
- 백그라운드 생성은 서버가 자기 자신에게 생성을 요청해요. 주소는 환경 변수 `PORT`(없으면 7860)로 정해요. 서버가 다른 포트에서 돌면 `PORT` 가 그 값인지 확인해요.
- 동시 생성은 기본 4개, 소르베 설정에서 1~16 사이로 바꿀 수 있어요.

확인한 엔진: Marinara Engine 2.5.0 (빌드된 서버에 넣는 방식)
