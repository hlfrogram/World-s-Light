# 빛의 세계 - 텍스트 RPG 게임

온라인 멀티플레이 텍스트 기반 RPG 게임입니다. 회원가입 후 캐릭터를 만들고, 세계를 탐험하며 이야기를 진행할 수 있습니다.

## 🎮 게임 특징

- **7가지 클래스**: 검사, 버서커, 마법사, 성직자, 궁수, 도적, 강령술사
- **3단계 스토리**: 1차(마왕 격퇴) → 2차(진실 파악) → 3차(시스템에 대항)
- **히든 피스 시스템**: 3개의 히든 피스를 모아 진 엔딩 달성
- **클라우드 저장**: Supabase로 게임 진행 상태 저장/로드
- **다중 지역**: 세계수의 심장, 청풍협, 염화대지, 황혼령 등 다양한 지역

## 📋 필요한 것

- GitHub 계정
- Vercel 계정
- Supabase 계정 (무료)

---

## 🚀 배포 설정 방법

### 1️⃣ **Supabase 설정**

#### Step 1: Supabase 프로젝트 생성
1. [Supabase](https://supabase.com) 방문
2. **새 프로젝트** 생성
   - Project name: `light-world-rpg`
   - Database password: 안전한 비밀번호 설정
   - Region: 원하는 지역 선택 (권장: `ap-northeast-1` - 도쿄)

#### Step 2: 데이터베이스 테이블 생성

**SQL Editor**에서 다음 코드 실행:

```sql
-- 게임 저장 데이터 테이블
CREATE TABLE game_saves (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    game_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Row Level Security (RLS) 설정
ALTER TABLE game_saves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own game data"
    ON game_saves
    FOR ALL
    USING (auth.uid() = user_id);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX idx_game_saves_user_id ON game_saves(user_id);
```

#### Step 3: API 키 가져오기

1. **Settings** → **API** 이동
2. **Project URL** 복사 (예: `https://xxxxx.supabase.co`)
3. **anon public** 키 복사
4. 나중에 사용할 것

---

### 2️⃣ **GitHub에 업로드**

#### Step 1: 저장소 생성
1. [GitHub](https://github.com) 로그인
2. **새 저장소** 생성
   - Repository name: `light-world-rpg`
   - Public 선택
   - "Add a README file" 체크

#### Step 2: 파일 업로드

로컬에 폴더 생성:
```bash
mkdir light-world-rpg
cd light-world-rpg
```

다음 파일들을 폴더에 복사:
- `index.html` (로그인)
- `game.html` (게임)
- `style.css` (스타일)
- `game.js` (게임 로직)

GitHub에 푸시:
```bash
git init
git add .
git commit -m "Initial commit: Text RPG game"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/light-world-rpg.git
git push -u origin main
```

---

### 3️⃣ **Vercel에 배포**

#### Step 1: Vercel 연결
1. [Vercel](https://vercel.com) 방문
2. **GitHub로 로그인**
3. **새 프로젝트** → GitHub 저장소 선택 (`light-world-rpg`)

#### Step 2: 환경 변수 설정

**Settings** → **Environment Variables**에서:

```
SUPABASE_URL=YOUR_SUPABASE_URL
SUPABASE_KEY=YOUR_SUPABASE_ANON_KEY
```

(Step 1에서 가져온 값들 입력)

#### Step 3: 배포
- **Deploy** 클릭
- 배포 완료 후 주어진 URL 사용 가능

---

### 4️⃣ **게임 코드에 API 키 입력**

**game.js**와 **index.html** 수정:

```javascript
// game.js 약 1줄
const SUPABASE_URL = 'YOUR_SUPABASE_URL';  // 여기에 입력
const SUPABASE_KEY = 'YOUR_SUPABASE_ANON_KEY';  // 여기에 입력

// index.html 약 69줄
const SUPABASE_URL = 'YOUR_SUPABASE_URL';  // 여기에 입력
const SUPABASE_KEY = 'YOUR_SUPABASE_ANON_KEY';  // 여기에 입력
```

---

## 🎯 게임 진행 방법

### 캐릭터 생성
1. 게임 시작 시 캐릭터 이름 입력
2. 색상 선택으로 클래스 결정:
   - **빨강** → 버서커 (높은 공격력, 낮은 방어력)
   - **노랑** → 마법사 (높은 마나, 낮은 체력)
   - **연두** → 성직자 (회복 능력)
   - **초록** → 궁수 (높은 민첩)
   - **파랑** → 도적 (높은 치명타)
   - **보라** → 강령술사 (마나 기반)
   - **검정** → 검사 (균형잡힌 스탯)

### 1차: 마왕 격퇴
- 튜토리얼 여부 선택
- 여러 지역 탐험
- 적과 전투
- 마왕 네크로스 격퇴

### 2차: 진실 파악
- 루미나의 정체 파악
- 시스템의 진실 알기
- 루미나 도우리 결정

### 3차: 시스템에 대항
- 시스템(개발자)와 최종 대결
- **히든 피스 3개**를 모으면 진 엔딩 가능
- 그렇지 않으면 배드 엔딩

---

## 💾 저장/불러오기

게임 내 **세이브** 버튼으로 현재 진행 상태 저장:
- 어느 기기에서든 로그인 후 진행 상태 복구
- Supabase DB에 자동 저장

---

## 📂 파일 구조

```
light-world-rpg/
├── index.html      (로그인/회원가입)
├── game.html       (메인 게임)
├── style.css       (스타일시트)
├── game.js         (게임 로직)
└── README.md       (이 파일)
```

---

## 🔧 커스터마이징

### 클래스 능력치 수정
**game.js**의 `classData` 객체 수정:
```javascript
const classData = {
    '검사': {
        hp: 10,      // 체력
        mp: 4,       // 마나
        atk: 10,     // 공격력
        crit: 10,    // 치명타
        agi: 5,      // 민첩
        ...
    }
};
```

### 새 지역 추가
**game.js**의 `locations` 객체에 추가:
```javascript
const locations = {
    '새로운지역': {
        name: '새로운지역 (English Name)',
        desc: '지역 설명',
        type: 'field'
    }
};
```

### 스토리 수정
**game.js**에서 각 `displayStage*` 함수 수정

---

## 🐛 문제 해결

### "Supabase URL이 설정되지 않음" 에러
→ API 키 입력 확인: `game.js`, `index.html` 수정

### 저장이 안 됨
→ Supabase RLS 정책 확인
→ 로그인 상태 확인

### 게임이 로드 안 됨
→ 브라우저 개발자 도구 (F12) → Console에서 에러 확인
→ Vercel Deployment 로그 확인

---

## 📝 업데이트 방법

로컬에서 수정 후:
```bash
git add .
git commit -m "Update message"
git push origin main
```

Vercel이 자동으로 배포합니다.

---

## 📞 지원

문제가 생기면:
1. GitHub Issues에 등록
2. Vercel Logs 확인
3. 브라우저 Console 에러 메시지 확인

---

## 📜 라이선스

MIT License - 자유롭게 사용, 수정, 배포 가능

---

**게임을 즐겨주세요! 🎮✨**
