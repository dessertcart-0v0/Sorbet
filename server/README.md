# 소르베 서버 모듈 설치하기

소르베는 서버 모듈이 없어도 그대로 써요. 마리나라 서버에 모듈을 깔면 두 가지가 더 돼요.

- **서버 저장 · 기기 동기화** — 결과 · 양식 · 설정을 마리나라 서버에 저장해요. 브라우저 데이터를 지워도 남고, 폰 · PC가 같은 자료를 봐요.
- **백그라운드 생성** — 창을 닫거나 폰 화면을 꺼도 생성이 서버에서 끝까지 돌아요. 다시 열면 결과를 받아 와요.

설치 파일 하나로 깔아요. 마리나라 엔진이 어디서 돌아가는지에 따라 파일만 달라요.

| 마리나라가 도는 곳 | 쓸 파일 |
|---|---|
| 윈도 PC | `INSTALL_SORBET_SERVER.bat` |
| 안드로이드 폰(Termux) | `INSTALL_SORBET_SERVER_TERMUX.sh` |
| 리눅스 · 맥 서버 (엔진 폴더에서 `start.sh` 로 켬) | `INSTALL_SORBET_SERVER_LINUX.sh` |
| 도커 (`docker compose` · 공식 이미지) | `INSTALL_SORBET_SERVER_DOCKER.sh` |

VPS · 클라우드 서버 · 집 서버 어디든 위 넷 중 하나에 해당하면 깔려요.

확인한 엔진: Marinara Engine 2.5.2

## 윈도 PC

1. 마리나라를 완전히 꺼요. 검은 창(서버 창)까지 닫아요.
2. `INSTALL_SORBET_SERVER.bat` 을 마리나라 엔진 폴더 맨 위에 넣어요. `start.bat` 이 있는 폴더예요.
   ```text
   C:\Marinara-Engine\start.bat
   C:\Marinara-Engine\INSTALL_SORBET_SERVER.bat   ← 여기
   ```
3. `INSTALL_SORBET_SERVER.bat` 을 더블클릭해요.
4. `설치가 끝났습니다` 가 뜨면 마리나라가 저절로 다시 빌드되고 켜져요. 빌드는 몇 분 걸릴 수 있어요.

## 안드로이드 폰 (Termux)

1. Termux에서 돌던 마리나라를 `Ctrl+C` 로 꺼요.
2. `INSTALL_SORBET_SERVER_TERMUX.sh` 를 마리나라 엔진 폴더 맨 위에 넣어요. `start-termux.sh` 가 있는 폴더예요.
3. Termux에서 그 폴더로 가서 이렇게 쳐요.
   ```bash
   bash ./INSTALL_SORBET_SERVER_TERMUX.sh
   ```
4. `설치가 끝났습니다` 가 뜨면 마리나라가 저절로 다시 빌드되고 켜져요.

## 리눅스 · 맥 서버

엔진 폴더(`start.sh` 가 있는 곳)에서 마리나라를 돌릴 때예요.

1. `INSTALL_SORBET_SERVER_LINUX.sh` 를 엔진 폴더 맨 위에 넣어요.
2. 그 폴더에서 이렇게 쳐요.
   ```bash
   bash ./INSTALL_SORBET_SERVER_LINUX.sh
   ```
3. `설치가 끝났습니다` 가 뜨면 마리나라를 다시 켜요. 다시 빌드하지 않아도 돼요.
   - `start.sh`, `systemd`, `pm2` 등 평소 켜던 방법 그대로 다시 켜면 돼요.

## 도커

도커로 마리나라를 돌리는 서버에서 해요.

1. `INSTALL_SORBET_SERVER_DOCKER.sh` 를 서버 아무 곳에나 올려요.
2. 이렇게 쳐요. 돌아가는 마리나라 컨테이너를 알아서 찾아요.
   ```bash
   bash ./INSTALL_SORBET_SERVER_DOCKER.sh
   ```
   - 컨테이너를 못 찾거나 여러 개면 이름을 적어요. 이름은 `docker ps` 로 봐요.
     ```bash
     bash ./INSTALL_SORBET_SERVER_DOCKER.sh <컨테이너 이름>
     ```
3. 모듈을 넣고 컨테이너를 다시 시작해요. `설치가 끝났습니다` 가 뜨면 끝이에요.

- **이미지를 업데이트하면(컨테이너를 새로 만들면) 모듈이 빠져요.** 업데이트 뒤 같은 명령을 다시 실행해요. 저장된 자료는 데이터 볼륨에 있어서 그대로예요.

## 깔렸는지 확인

마리나라가 켜진 뒤 브라우저 주소창에 아래 두 주소를 열어요. 둘 다 `"ok":true` 가 보이면 됐어요.

```text
<마리나라 주소>/api/sorbet/health
<마리나라 주소>/api/sorbet-runs/health
```

예: 마리나라를 `http://localhost:7860` 으로 연다면 `http://localhost:7860/api/sorbet/health`

`404` 가 나오면 모듈이 안 붙은 거예요. 마리나라를 끄고 설치 파일을 한 번 더 실행해요.

## 소르베에서 켜기

1. 소르베 **설정 → 저장** 으로 가요.
2. **Marinara 서버를 소르베 원본 저장소로 사용** 을 켜고 저장해요.
3. `서버 동기화 완료` 알림이 뜨면 끝이에요.

- 처음 켤 때 이 브라우저 자료와 서버 자료를 합쳐요. 같은 항목은 서버 값이 우선해요. 브라우저에만 있던 자료는 서버에 올라가요.
- 다른 기기에서도 소르베를 깔고 같은 토글을 켜면 같은 자료를 봐요.
- 백그라운드 생성은 따로 켤 게 없어요. 모듈이 있으면 저절로 써요. 동시 생성은 기본 4개, **설정 → 생성** 에서 1~16개로 바꿔요.

## 알아 둘 점

- **마리나라를 업데이트하면 모듈이 빠질 수 있어요.** 업데이트 뒤 위 확인 주소가 `404` 면 설치 파일을 다시 실행해요. 저장된 자료는 그대로 있어요.
- 설치 파일은 여러 번 실행해도 괜찮아요. 이미 들어간 줄은 다시 넣지 않아요.
- 자료는 마리나라 데이터 폴더 안 `sorbet/` 에 쌓여요. 마리나라 프로필 백업에 같이 들어가요.
  - `state.json` — 양식 · 설정
  - `results/` — 채팅별 결과
  - `runs/` — 끝난 백그라운드 생성(24시간 뒤 지워짐)
- 마리나라가 7860이 아닌 포트에서 돌면, 환경 변수 `PORT` 가 그 포트인지 확인해요. 백그라운드 생성이 이 값으로 서버 자신을 불러요.

## 손으로 깔기 (설치 파일을 못 쓸 때)

설치 파일을 돌릴 수 없는 곳이면 빌드된 서버 자리(`dist`)에 직접 넣어요. 이 폴더의 `routes/` · `services/` 에 있는 네 파일을 써요.

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

이 방식은 엔진을 업데이트하거나 다시 빌드하면 `dist` 가 새로 만들어져 빠져요. 그때는 다시 넣어요.

## 지우기

1. 마리나라를 꺼요.
2. 엔진 폴더에서 이 네 파일을 지워요.
   ```text
   packages/server/src/routes/sorbet.routes.ts
   packages/server/src/routes/sorbet-runs.routes.ts
   packages/server/src/services/storage/sorbet.storage.ts
   packages/server/src/services/storage/sorbet-runs.storage.ts
   ```
3. `packages/server/src/routes/index.ts` 에서 `sorbetRoutes` · `sorbetRunsRoutes` 가 든 줄 네 개를 지워요.
4. `packages/server/src/routes/backup.routes.ts` 에서 `"sorbet",` 줄을 지워요.
5. `packages/server/dist` 폴더를 지우고 마리나라를 켜요. 다시 빌드돼요.

저장된 자료까지 지우려면 마리나라 데이터 폴더의 `sorbet/` 을 지워요. 지우기 전에 따로 복사해 두는 게 안전해요.
