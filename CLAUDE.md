# 세계의 빛 (World's Light)

텍스트 RPG 게임. 순수 HTML/CSS/JS(프레임워크 없음) + Supabase(로그인/DB) + Vercel(배포) + GitHub(`hlfrogram/World-s-Light`, main 브랜치). 사용자는 코딩 초보.

## 파일 구조
- `index.html` — 로그인/회원가입 화면
- `game.html` + `game.js` — 실제 게임 (캐릭터 생성, 전투, 스토리, 세이브/로드/리셋)
- `style.css` — 공통 스타일
- `README.md`, `게임 설명.txt`, `로드맵.txt`, `스토리.txt`, `이스터에그.txt` — 유저가 만든 기획 문서. 스킬/스탯 등 일부는 문서 자체에 빈칸·모순이 있어 임의로 채운 부분 있음(성직자 스탯, 도적 특성명 등, game.js에 반영).

## 배포
- git 원격 연결 완료: `git push origin main` → Vercel 자동 재배포 (`https://world-s-light.vercel.app`)
- git 사용자 설정은 이 저장소 로컬 config만 사용 중 (name: hlfrogram, email: hlfrogram@gmail.com). 글로벌 설정 아님.

## 인증 방식 (여러 번 갈아엎었음 — 아래가 최종본)
- **회원가입**: 아이디 + 이메일 + 비밀번호. `profiles` 테이블(id, username unique, email)에 등록하고, Supabase `user_metadata.username`에도 저장 → 게임 내 캐릭터 이름으로 재사용.
- **로그인**: 아이디 + 비밀번호만 입력. `profiles` 테이블에서 아이디로 이메일 조회 → 그 이메일로 `signInWithPassword` 호출.
- Supabase 프로젝트의 "Confirm email"은 꺼놓은 상태 (안 그러면 가입 후 로그인 막힘 + 이메일 레이트리밋 잘 걸림).
- `profiles` 테이블 RLS는 SELECT/INSERT 둘 다 `USING (true)` / `WITH CHECK (true)`로 완전 공개 (조회 전용 매핑 테이블이라 실제 보안은 Supabase Auth 비밀번호 검증이 담당).
- Supabase client 변수명은 `supabase`가 아니라 **`sbClient`**로 통일되어 있음. 이유: 브라우저 확장 프로그램이 전역에 `supabase`를 주입해서 `Identifier 'supabase' has already been declared` SyntaxError가 나 스크립트 전체가 죽었던 적 있음 — 변수명 다시 `supabase`로 되돌리지 말 것.

## game.js 구조 요약
- `gameState`는 `createInitialGameState()`로 생성 (리셋 시 재사용).
- 클래스 7종, 클래스별 스킬(일반/상급/최상급), 클래스별 무기 강화 라인(전투 3승마다 자동 승급) 구현됨.
- 스토리 1~4차 전체 구현, 지역별 "표면 설정 vs 숨겨진 진실" 탐색 시스템, 히든 피스 3개 수집→히든 무기 시스템, 모스부호 이스터에그(`히든` 입력) 있음.
- 세이브/로드는 Supabase `game_saves` 테이블(user_id, game_data JSON) 사용. 자동저장은 없음 — `hasUnsavedProgress` 플래그로 저장 안 하고 새로고침/닫기 시 브라우저 기본 경고창(`beforeunload`) 뜨게 되어 있음.
- 리셋 버튼: `game_saves` 행 삭제 + `gameState` 초기화 + 인트로로 복귀.

## 아직 안 한 것 (스코프 아웃, 필요시 참고)
- 개화형 히든 특성 6종(불굴의 의지, 광폭화 등) — 데이터만 있고 발동 로직 미구현.
- 무기 105종 중 클래스별 4단계 강화 라인만 구현, 나머지 미구현.

## 작업 스타일 메모
- 이 세션에서 로컬 Node/Python이 사실상 없어서(WindowsApps 스텁만 있음) JS를 실제로 실행해 테스트 못 함 — 브레이스/괄호 카운트 + 수동 코드 리뷰 + 실배포 후 사용자가 직접 콘솔(F12) 확인하는 방식으로 디버깅함. 앞으로도 같은 제약일 가능성 높음.
- 사용자가 코딩을 전혀 몰라서, git/Supabase 대시보드 조작 등은 클릭 위치까지 아주 구체적으로 안내해야 함.
- **git push는 매번 확인받지 말고 바로 진행할 것** (2026-07-13 사용자 승인). 커밋 후 바로 `git push origin main`까지 실행.
