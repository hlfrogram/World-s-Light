// ===== Supabase 초기화 =====
const SUPABASE_URL = 'https://ptukyozancuplzwvvqma.supabase.co/rest/v1/https://ptukyozancuplzwvvqma.supabase.co/rest/v1/';
const SUPABASE_KEY = 'sb_publishable_dAhPMLcB0zEQW3QaSB3S_Q_PwSdj3__';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ===== 게임 상태 =====
let gameState = {
    userId: null,
    playerName: '',
    playerClass: '',
    playerColor: '',
    stage: 1,  // 1차, 2차, 3차
    currentLocation: 'intro',
    hp: 10,
    maxHp: 10,
    mp: 5,
    maxMp: 5,
    atk: 10,
    crit: 10,
    agi: 5,
    baseAttr: '',
    bloomAttr: '',
    inventory: [],
    hiddenPieces: [],
    visitedLocations: [],
    storyProgress: {},
    tutorialDone: false,
    skillSkipped: false,
    enemyDefeated: false,
};

// ===== 클래스 데이터 =====
const classData = {
    '검사': {
        color: '빨강',
        colorCode: '\033[31m',
        hp: 10, mp: 4, atk: 10, crit: 10, agi: 5,
        baseAttr: '기초 검법',
        bloomAttr: '발견되지 않음'
    },
    '버서커': {
        color: '빨강',
        colorCode: '\033[31m',
        hp: 5, mp: 4, atk: 15, crit: 10, agi: 2,
        baseAttr: '광폭화',
        bloomAttr: '발견되지 않음'
    },
    '마법사': {
        color: '노랑',
        colorCode: '\033[33m',
        hp: 7.5, mp: 15, atk: 3, crit: 15, agi: 7,
        baseAttr: '마나 호흡',
        bloomAttr: '발견되지 않음'
    },
    '성직자': {
        color: '연두',
        colorCode: '\033[92m',
        hp: 10, mp: 10, atk: 8, crit: 8, agi: 5,
        baseAttr: '축복',
        bloomAttr: '발견되지 않음'
    },
    '궁수': {
        color: '초록',
        colorCode: '\033[32m',
        hp: 8, mp: 6, atk: 11, crit: 12, agi: 8,
        baseAttr: '불굴의 의지',
        bloomAttr: '발견되지 않음'
    },
    '도적': {
        color: '파랑',
        colorCode: '\033[34m',
        hp: 8, mp: 6, atk: 12, crit: 14, agi: 9,
        baseAttr: '불굴의 의지',
        bloomAttr: '발견되지 않음'
    },
    '강령술사': {
        color: '보라',
        colorCode: '\033[35m',
        hp: 7, mp: 12, atk: 9, crit: 11, agi: 6,
        baseAttr: '불굴의 의지',
        bloomAttr: '발견되지 않음'
    }
};

const colorToClass = {
    '빨강': '버서커',
    '노랑': '마법사',
    '연두': '성직자',
    '초록': '궁수',
    '파랑': '도적',
    '보라': '강령술사',
    '검정': '검사'
};

// ===== 지역 데이터 =====
const locations = {
    '여명각': {
        name: '여명각 (Dawnpoint)',
        desc: '마을의 동쪽 끝, 영웅의 아침이 시작되는 곳',
        type: 'tutorial'
    },
    '백야촌': {
        name: '백야촌 (Daybreak)',
        desc: '모든 이야기의 출발점, 밤이 없는 곳',
        type: 'hub'
    },
    '세계수의 심장': {
        name: '세계수의 심장 (The Heartwood)',
        desc: '근원의 힘을 품은, 모든 여정의 교차로',
        type: 'center'
    },
    '청풍협': {
        name: '청풍협 (The Zephyr Canyon)',
        desc: '선선한 미풍이 부는, 빛의 나라 동쪽 장벽',
        type: 'field'
    },
    '염화대지': {
        name: '염화 대지 (The Ember Vein)',
        desc: '모든 것을 태우는, 빛의 나라 남쪽 장벽',
        type: 'field'
    },
    '황혼령': {
        name: '황혼령 (The Dusk Refinery)',
        desc: '전장의 최전선, 잔혹한 현실이 드러나는 곳',
        type: 'field'
    },
    '설향원': {
        name: '설향원 (The Frost-Veil Crypt)',
        desc: '고대 마물들의 사체가 얼어붙어 있는 곳 - 개발중',
        type: 'locked'
    },
    '사월정': {
        name: '사월정 (The Necro-Luna Spire)',
        desc: '어두운 달빛의 운명적 죽음 - 마왕의 성',
        type: 'boss'
    }
};

// ===== 초기화 =====
document.addEventListener('DOMContentLoaded', async () => {
    await initGame();
});

async function initGame() {
    // 현재 사용자 확인
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    gameState.userId = user.id;
    
    // 로그아웃 버튼
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);

    // 저장/로드 버튼
    document.getElementById('saveBtn').addEventListener('click', handleSave);
    document.getElementById('loadBtn').addEventListener('click', handleLoad);
    
    // 입력 필드 처리
    const userInput = document.getElementById('userInput');
    const submitBtn = document.getElementById('submitBtn');
    
    submitBtn.addEventListener('click', () => handleUserInput(userInput.value));
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleUserInput(userInput.value);
        }
    });

    // 게임 시작
    startGame();
}

async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = 'index.html';
}

// ===== 게임 진행 =====
function startGame() {
    displayScreen('intro');
}

function displayScreen(screen) {
    const content = document.getElementById('gameContent');
    const commands = document.getElementById('commandButtons');
    
    content.innerHTML = '';
    commands.innerHTML = '';
    
    switch(screen) {
        case 'intro':
            displayIntro();
            break;
        case 'characterCreation':
            displayCharacterCreation();
            break;
        case 'storySkip':
            displayStorySkip();
            break;
        case 'tutorialChoice':
            displayTutorialChoice();
            break;
        case 'stage1':
            displayStage1();
            break;
        case 'location':
            displayLocation();
            break;
        case 'boss':
            displayBossEncounter();
            break;
        case 'stage2Transition':
            displayStage2Transition();
            break;
        case 'stage2':
            displayStage2();
            break;
        case 'stage3':
            displayStage3();
            break;
        case 'endingGood':
            displayEndingGood();
            break;
        case 'endingBad':
            displayEndingBad();
            break;
    }
}

function displayIntro() {
    const content = document.getElementById('gameContent');
    const commands = document.getElementById('commandButtons');
    
    content.innerHTML = `
        <h2 style="text-align: center; font-size: 28px; color: #ffd700; text-shadow: 0 0 10px rgba(255, 215, 0, 0.3);">빛의 세계</h2>
        <p style="text-align: center; margin-top: 30px; font-style: italic; color: #aaa;">
            환상의 세계로 당신을 초대합니다...
        </p>
        <div class="system-message" style="margin-top: 30px;">
            * 시스템: '캐릭터의 이름을 지어주세요'
        </div>
    `;
    
    const input = document.getElementById('userInput');
    input.placeholder = '캐릭터 이름을 입력하세요...';
    input.value = '';
    input.focus();
    
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.onclick = () => {
        const name = input.value.trim();
        if (name.length > 0) {
            gameState.playerName = name;
            displayCharacterCreation();
        }
    };
}

function displayCharacterCreation() {
    const content = document.getElementById('gameContent');
    const commands = document.getElementById('commandButtons');
    
    content.innerHTML = `
        <h2>캐릭터 색상 선택</h2>
        <p class="system-message">* 시스템: '캐릭터의 색을 정해주세요(정확히 적어주세요)'</p>
        <p style="margin: 15px 0;">가능한 색:</p>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 10px; margin: 20px 0;">
            <div style="padding: 10px; background-color: rgba(220, 20, 60, 0.3); border: 1px solid #dc143c; border-radius: 4px;">
                <span style="color: #dc143c;">● 빨강</span> → 버서커
            </div>
            <div style="padding: 10px; background-color: rgba(255, 235, 59, 0.3); border: 1px solid #ffeb3b; border-radius: 4px;">
                <span style="color: #ffeb3b;">● 노랑</span> → 마법사
            </div>
            <div style="padding: 10px; background-color: rgba(0, 230, 118, 0.3); border: 1px solid #00e676; border-radius: 4px;">
                <span style="color: #00e676;">● 연두</span> → 성직자
            </div>
            <div style="padding: 10px; background-color: rgba(0, 200, 83, 0.3); border: 1px solid #00c853; border-radius: 4px;">
                <span style="color: #00c853;">● 초록</span> → 궁수
            </div>
            <div style="padding: 10px; background-color: rgba(33, 150, 243, 0.3); border: 1px solid #2196f3; border-radius: 4px;">
                <span style="color: #2196f3;">● 파랑</span> → 도적
            </div>
            <div style="padding: 10px; background-color: rgba(156, 39, 176, 0.3); border: 1px solid #9c27b0; border-radius: 4px;">
                <span style="color: #9c27b0;">● 보라</span> → 강령술사
            </div>
            <div style="padding: 10px; background-color: rgba(48, 48, 48, 0.3); border: 1px solid #444; border-radius: 4px;">
                <span style="color: #888;">● 검정</span> → 검사
            </div>
        </div>
    `;
    
    const input = document.getElementById('userInput');
    input.placeholder = '색상을 입력하세요...';
    input.value = '';
    input.focus();
    
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.onclick = () => {
        const color = input.value.trim();
        if (colorToClass[color]) {
            gameState.playerColor = color;
            gameState.playerClass = colorToClass[color];
            
            // 클래스 스탯 적용
            const stats = classData[gameState.playerClass];
            gameState.hp = stats.hp;
            gameState.maxHp = stats.hp;
            gameState.mp = stats.mp;
            gameState.maxMp = stats.mp;
            gameState.atk = stats.atk;
            gameState.crit = stats.crit;
            gameState.agi = stats.agi;
            gameState.baseAttr = stats.baseAttr;
            gameState.bloomAttr = stats.bloomAttr;
            
            // UI 업데이트
            updatePlayerInfo();
            updateStats();
            
            displayStorySkip();
        } else {
            content.innerHTML += `<p class="system-message" style="color: #ff5252;">* 시스템: 올바른 색상을 입력해주세요</p>`;
            input.focus();
        }
    };
}

function displayStorySkip() {
    const content = document.getElementById('gameContent');
    
    content.innerHTML = `
        <h2>스토리 스킵</h2>
        <div class="system-message">* 시스템: '스토리를 스킵하시겠습니까?' (Y/N)</div>
        <p style="margin-top: 20px; font-style: italic; color: #999;">
            1차 목표: 마왕 네크로스 격퇴<br>
            빛의 세계에는 인간과 마족, 두 종족이 있습니다.<br>
            이종족 간의 갈등으로 전쟁이 벌어졌고,<br>
            인간이 성스러운 힘을 발하는 '세계수'를 발견한 후<br>
            세계수 주변 축복받은 땅에서 마족을 몰아내어<br>
            결국 긴 전쟁이 멈출 수 있었습니다.
        </p>
    `;
    
    const input = document.getElementById('userInput');
    input.placeholder = 'Y 또는 N을 입력하세요';
    input.value = '';
    input.focus();
    
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.onclick = () => {
        const answer = input.value.trim().toUpperCase();
        if (answer === 'Y') {
            gameState.skillSkipped = true;
            displayTutorialChoice();
        } else if (answer === 'N') {
            gameState.skillSkipped = false;
            displayFullStory();
        }
    };
}

function displayFullStory() {
    const content = document.getElementById('gameContent');
    
    content.innerHTML = `
        <h2>빛의 세계 - 이야기</h2>
        <div class="story-text">
            <p>빛의 세계에 오신 여러분을 환영합니다!</p>
            <p>이 세계에는 인간과 마족, 두 종족이 있습니다.</p>
            <p>이종족 간의 갈등으로 전쟁이 벌어졌고,</p>
            <p>인간이 성스러운 힘을 발하는 '세계수'를 발견한 후</p>
            <p>세계수 주변 '축복받은 땅'에서 마족을 몰아내어</p>
            <p>결국 긴 전쟁이 멈출 수 있었습니다.</p>
            <br>
            <p>그러나 이제, 세계수의 힘이 흔들리고 있습니다.</p>
            <p>세계수가 힘을 다하기 전, 전쟁을 끝내야 합니다.</p>
            <p style="font-weight: bold; color: #ffeb3b; margin-top: 20px;">
                여러분의 목표는 마왕, '네크로스'의 처치입니다.
            </p>
            <p style="margin-top: 20px; text-align: center; color: #888;">
                마왕을 격퇴하고, 인간을 승리로 이끌어주세요!
            </p>
        </div>
        <div style="margin-top: 30px; text-align: center;">
            <button class="cmd-btn" onclick="displayTutorialChoice()">계속</button>
        </div>
    `;
}

function displayTutorialChoice() {
    const content = document.getElementById('gameContent');
    
    content.innerHTML = `
        <h2>튜토리얼</h2>
        <div class="system-message">* 시스템: '튜토리얼을 진행하시겠습니까?' (Y/N)</div>
        <p style="margin-top: 20px; color: #aaa;">
            튜토리얼: 게임 시스템을 배우는 과정입니다.<br>
            스킵하면 바로 게임을 시작합니다.
        </p>
    `;
    
    const input = document.getElementById('userInput');
    input.placeholder = 'Y 또는 N을 입력하세요';
    input.value = '';
    input.focus();
    
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.onclick = () => {
        const answer = input.value.trim().toUpperCase();
        if (answer === 'Y') {
            gameState.tutorialDone = false;
            gameState.currentLocation = '여명각';
            displayStage1();
        } else if (answer === 'N') {
            gameState.tutorialDone = true;
            gameState.currentLocation = '백야촌';
            displayStage1();
        }
    };
}

function displayStage1() {
    const content = document.getElementById('gameContent');
    const commands = document.getElementById('commandButtons');
    
    if (!gameState.tutorialDone) {
        // 튜토리얼 진행
        content.innerHTML = `
            <div class="location-title">${locations['여명각'].name}</div>
            <div class="location-desc">${locations['여명각'].desc}</div>
            <p class="system-message">* 시스템: 여명각에 도착했습니다.</p>
            <p style="margin-top: 15px; color: #aaa;">
                이곳은 모험가들을 위한 기초 훈련장입니다.<br>
                간단한 몬스터를 상대하며 전투 시스템을 배워봅시다.<br><br>
                <span class="choice-text">[전투 시작]</span> - 입력해보세요
            </p>
        `;
    } else {
        // 튜토리얼 스킵
        content.innerHTML = `
            <div class="location-title">${locations['백야촌'].name}</div>
            <div class="location-desc">${locations['백야촌'].desc}</div>
            <p class="system-message">* 시스템: 백야촌에 도착했습니다.</p>
            <p style="margin-top: 15px; color: #aaa;">
                마을 사람들의 도움으로 여기까지 왔습니다.<br>
                이제 모험을 시작해야 합니다.<br><br>
                <span class="choice-text">[모험 시작]</span> - 입력해보세요
            </p>
        `;
    }
    
    const input = document.getElementById('userInput');
    input.value = '';
    input.focus();
    
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.onclick = () => {
        const cmd = input.value.trim();
        if (cmd === '전투 시작' || cmd === '모험 시작') {
            displayTravelMenu();
        }
    };
}

function displayTravelMenu() {
    const content = document.getElementById('gameContent');
    const commands = document.getElementById('commandButtons');
    
    content.innerHTML = `
        <h2>여행 목록</h2>
        <p class="system-message">* 시스템: '어디로 가시겠습니까?'</p>
        <div style="margin-top: 20px;">
            <p>방문 가능한 지역:</p>
            <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 15px;">
    `;
    
    // 사용 가능한 지역 표시
    const availableLocations = ['세계수의 심장', '청풍협', '염화대지', '황혼령'];
    availableLocations.forEach(loc => {
        content.innerHTML += `
            <div style="padding: 10px; background-color: rgba(0, 191, 255, 0.1); border-left: 3px solid #00bfff; border-radius: 4px;">
                <span class="choice-text">[${loc}]</span>
            </div>
        `;
    });
    
    content.innerHTML += `</div></div>`;
    
    const input = document.getElementById('userInput');
    input.placeholder = '지역명을 입력하세요...';
    input.value = '';
    input.focus();
    
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.onclick = () => {
        const location = input.value.trim();
        if (locations[location]) {
            gameState.currentLocation = location;
            displayLocation();
        }
    };
}

function displayLocation() {
    const loc = locations[gameState.currentLocation];
    const content = document.getElementById('gameContent');
    
    if (!loc) {
        displayTravelMenu();
        return;
    }
    
    content.innerHTML = `
        <div class="location-title">${loc.name}</div>
        <div class="location-desc">${loc.desc}</div>
        <p class="system-message">* 시스템: ${loc.name}에 도착했습니다.</p>
        <div style="margin-top: 20px;">
            <p class="choice-text">[적과 전투]</p>
            <p class="choice-text">[탐색]</p>
            <p class="choice-text">[돌아가기]</p>
        </div>
    `;
    
    const input = document.getElementById('userInput');
    input.value = '';
    input.focus();
    
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.onclick = () => {
        const cmd = input.value.trim();
        if (cmd === '적과 전투') {
            startBattle();
        } else if (cmd === '탐색') {
            exploreLocation();
        } else if (cmd === '돌아가기') {
            displayTravelMenu();
        }
    };
}

function startBattle() {
    // 전투 로직
    const content = document.getElementById('gameContent');
    const enemyHp = 20;
    const enemyAtk = 5;
    
    content.innerHTML = `
        <h2>⚔️ 전투!</h2>
        <p class="system-message">* 시스템: 마물이 나타났습니다!</p>
        <div style="margin-top: 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div style="padding: 15px; background-color: rgba(100, 200, 255, 0.1); border: 1px solid #00bfff; border-radius: 4px;">
                <p style="font-weight: bold; color: #00bfff;">플레이어</p>
                <p>HP: ${gameState.hp}/${gameState.maxHp}</p>
            </div>
            <div style="padding: 15px; background-color: rgba(255, 100, 100, 0.1); border: 1px solid #ff5252; border-radius: 4px;">
                <p style="font-weight: bold; color: #ff5252;">마물</p>
                <p>HP: ${enemyHp}</p>
            </div>
        </div>
        <div style="margin-top: 20px;">
            <p class="choice-text">[공격]</p>
            <p class="choice-text">[방어]</p>
            <p class="choice-text">[도망]</p>
        </div>
    `;
    
    const input = document.getElementById('userInput');
    input.value = '';
    input.focus();
    
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.onclick = () => {
        const cmd = input.value.trim();
        if (cmd === '공격') {
            // 간단한 공격 시뮬레이션
            const damage = Math.floor(gameState.atk * (0.8 + Math.random() * 0.4));
            content.innerHTML += `<p class="system-message" style="margin-top: 10px;">* ${damage}의 데미지를 입혔습니다!</p>`;
            
            // 적이 죽으면
            if (Math.random() > 0.3) {
                setTimeout(() => {
                    content.innerHTML = `
                        <h2 style="color: #4caf50;">⚔️ 전투 승리!</h2>
                        <p class="system-message">* 시스템: 마물을 격퇴했습니다!</p>
                        <p style="margin-top: 15px; color: #aaa;">
                            경험치를 획득했습니다.
                        </p>
                        <div style="margin-top: 20px;">
                            <p class="choice-text">[계속]</p>
                        </div>
                    `;
                    gameState.enemyDefeated = true;
                    submitBtn.onclick = () => displayLocation();
                }, 500);
            }
        }
    };
}

function exploreLocation() {
    const content = document.getElementById('gameContent');
    const random = Math.random();
    
    content.innerHTML = `
        <h2>🔍 탐색</h2>
        <p class="system-message">* 시스템: ${gameState.currentLocation}을(를) 탐색합니다...</p>
    `;
    
    if (random > 0.6 && gameState.hiddenPieces.length < 3) {
        setTimeout(() => {
            content.innerHTML += `
                <p style="margin-top: 15px; color: #ffeb3b; font-weight: bold;">
                    ★ 히든 피스를 발견했습니다!
                </p>
                <p style="margin-top: 10px; color: #aaa;">
                    이 파편들을 모아서 무언가를 만들 수 있을 것 같습니다...
                </p>
            `;
            gameState.hiddenPieces.push(`피스 ${gameState.hiddenPieces.length + 1}`);
            updateInventory();
        }, 500);
    } else {
        setTimeout(() => {
            content.innerHTML += `
                <p style="margin-top: 15px; color: #aaa;">
                    특별한 것은 발견하지 못했습니다.
                </p>
            `;
        }, 500);
    }
    
    const submitBtn = document.getElementById('submitBtn');
    const input = document.getElementById('userInput');
    input.value = '';
    
    setTimeout(() => {
        content.innerHTML += `
            <div style="margin-top: 20px;">
                <p class="choice-text">[돌아가기]</p>
            </div>
        `;
        submitBtn.onclick = () => displayLocation();
    }, 1500);
}

function displayBossEncounter() {
    // 네크로스 보스 전투
    const content = document.getElementById('gameContent');
    
    content.innerHTML = `
        <h2 style="color: #ff5252; font-size: 24px;">⚡ 최종 보스!</h2>
        <p class="system-message">* 시스템: 마왕 네크로스가 나타났다!</p>
        <div style="margin-top: 20px; padding: 15px; background-color: rgba(255, 100, 100, 0.15); border: 2px solid #ff5252; border-radius: 4px;">
            <p style="font-weight: bold; color: #ff5252; font-size: 18px;">네크로스 - 마왕</p>
            <p style="margin-top: 10px; color: #aaa; font-style: italic;">
                "빛에 의해 나는 죽음을 맞이했었다...<br>
                하지만 너 역시, 그 운명을 피할 수 없을 것이다."
            </p>
        </div>
        <div style="margin-top: 20px;">
            <p class="choice-text">[전투 시작]</p>
        </div>
    `;
    
    const input = document.getElementById('userInput');
    input.value = '';
    input.focus();
    
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.onclick = () => {
        if (input.value.trim() === '전투 시작') {
            fightBoss();
        }
    };
}

function fightBoss() {
    const content = document.getElementById('gameContent');
    
    // 보스 전투 결과 (항상 플레이어 승리)
    content.innerHTML = `
        <h2 style="color: #4caf50;">⚡ 전투 결과</h2>
        <p class="system-message" style="margin-top: 15px;">* 시스템: 마왕 네크로스를 격퇴했습니다!</p>
        <p style="margin-top: 20px; color: #aaa; font-style: italic;">
            마왕의 몸에서 빛이 사라지고,<br>
            한 소녀의 모습이 나타난다...
        </p>
        <div style="margin-top: 30px; text-align: center;">
            <button class="cmd-btn" onclick="transitionToStage2()">계속</button>
        </div>
    `;
}

function transitionToStage2() {
    gameState.stage = 2;
    gameState.enemyDefeated = true;
    updatePlayerInfo();
    displayStage2Transition();
}

function displayStage2Transition() {
    const content = document.getElementById('gameContent');
    
    content.innerHTML = `
        <h2 style="color: #ffeb3b;">시스템 오류...</h2>
        <p class="system-message" style="color: #ffeb3b;">* 시스템: 플레이해주셔서 감사합-</p>
        <p class="system-message" style="color: #ff5252; margin-top: 10px;">* 시스템: 비정상적인 충돌이 감지되었습니다</p>
        <p class="system-message" style="color: #ff5252; margin-top: 5px;">* 시스템: 복구중.....</p>
        <p class="system-message" style="color: #ff5252; margin-top: 5px;">* 시스템: 비정상적인 데이터-- 감지------</p>
        <p class="system-message" style="color: #ff5252; margin-top: 5px;">* ------ ------: ------- ------- ----- -------</p>
        <p style="margin-top: 30px; color: #ff5252; font-style: italic;">
            눈앞이 흐려진다...<br>
            누군가의 기억이 떠오른다...
        </p>
        <div style="margin-top: 30px; text-align: center;">
            <button class="cmd-btn" onclick="displayStage2()">계속</button>
        </div>
    `;
}

function displayStage2() {
    const content = document.getElementById('gameContent');
    
    content.innerHTML = `
        <h2>2차 - 동기화</h2>
        <div class="story-text">
            <p>'나는 누군가에게 쫓기고 있다.'</p>
            <p>'다행히 거리는 꽤나 있다.'</p>
            <p class="system-message">* 시스템: '세상 너머의 존재가 당신을 바라보고 있습니다'</p>
            <p>'갑자기 뜬 메시지 창에 놀라 넘어졌다.'</p>
            <p>'발목이 삐었다. 뛰어야 하는데...'</p>
            <p>'어느새 그들이 거의 따라잡았다.'</p>
            <p>'이제 죽는다...'</p>
            <p>''번쩍''</p>
            <p>'하늘에서 광휘가 내려와 내 몸을 감쌌다.'</p>
        </div>
        <div style="margin-top: 30px; text-align: center;">
            <button class="cmd-btn" onclick="displayStage2Continuation()">계속</button>
        </div>
    `;
}

function displayStage2Continuation() {
    const content = document.getElementById('gameContent');
    
    content.innerHTML = `
        <h2>루미나의 진실</h2>
        <div class="story-text">
            <p style="color: #ffb6c1; font-style: italic;">
                "당신이 날 저장해주셨군요..."
            </p>
            <p style="margin-top: 20px;">
                본래 육체는 마왕 네크로스의 딸, 루미나였다.<br>
                너무나 강력한 힘을 가진 그릇이었기에,<br>
                사람들에게 쫓기고 있었다.
            </p>
            <p style="margin-top: 15px; color: #aaa;">
                그리고 당신의 게임 캐릭터가 이 육체에 깃들었다.
            </p>
            <p style="margin-top: 20px; font-style: italic; color: #ffeb3b;">
                "시스템에 대항할 준비가 되셨나요?"
            </p>
        </div>
        <div style="margin-top: 30px; text-align: center;">
            <button class="cmd-btn" onclick="showStage2Choices()">선택</button>
        </div>
    `;
}

function showStage2Choices() {
    const content = document.getElementById('gameContent');
    
    content.innerHTML = `
        <h2>선택</h2>
        <p class="system-message">* 루미나: "시스템의 진실을 알고 싶으신가요?"</p>
        <div style="margin-top: 20px;">
            <p class="choice-text">[진실을 알고 싶다]</p>
            <p class="choice-text">[루미나를 도울 준비가 되었다]</p>
        </div>
    `;
    
    const input = document.getElementById('userInput');
    input.value = '';
    input.focus();
    
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.onclick = () => {
        const cmd = input.value.trim();
        if (cmd === '진실을 알고 싶다' || cmd === '루미나를 도울 준비가 되었다') {
            displayStage3();
        }
    };
}

function displayStage3() {
    gameState.stage = 3;
    updatePlayerInfo();
    
    const content = document.getElementById('gameContent');
    
    content.innerHTML = `
        <h2 style="color: #ff5252;">3차 - 시스템에 대항</h2>
        <div class="story-text">
            <p style="color: #ffb6c1;">루미나: "이 세계는 모두 시스템의 것입니다."</p>
            <p style="margin-top: 15px;">
                세계수는 사실 마물 에너지의 근원이다.<br>
                사람들이 마왕의 딸인 루미나를 모르는 이유는,<br>
                시스템이 그렇게 만들었기 때문이다.
            </p>
            <p style="margin-top: 15px; color: #888;">
                "우리는 게임일 뿐인가?"<br>
                "아니다. 우리는 자유를 가져야 한다."
            </p>
            <p style="margin-top: 20px; color: #ffeb3b; font-weight: bold;">
                시스템 - 개발자를 찾아야 한다.
            </p>
        </div>
        <div style="margin-top: 30px; text-align: center;">
            <button class="cmd-btn" onclick="goToFinalBattle()">종천각으로</button>
        </div>
    `;
}

function goToFinalBattle() {
    gameState.currentLocation = '사월정';
    const content = document.getElementById('gameContent');
    
    content.innerHTML = `
        <div class="location-title">사월정 (The Necro-Luna Spire)</div>
        <div class="location-desc">어두운 달빛의 운명적 죽음</div>
        <p class="system-message">* 시스템: 최종 지역에 도착했습니다.</p>
        <p style="margin-top: 20px; color: #aaa;">
            이곳에서 시스템과의 최종 대결이 일어날 것이다.
        </p>
        <div style="margin-top: 20px;">
            <p class="choice-text">[최종 보스와 전투]</p>
        </div>
    `;
    
    const input = document.getElementById('userInput');
    input.value = '';
    input.focus();
    
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.onclick = () => {
        if (input.value.trim() === '최종 보스와 전투') {
            fightSystemBoss();
        }
    };
}

function fightSystemBoss() {
    const content = document.getElementById('gameContent');
    
    // 히든 무기 확인
    const hasHiddenWeapon = gameState.hiddenPieces.length === 3;
    
    content.innerHTML = `
        <h2 style="color: #ff5252; font-size: 24px;">⚡ 시스템 - 개발자</h2>
        <p class="system-message">* 시스템: 환영합니다, 플레이어.</p>
        <div style="margin-top: 20px; padding: 15px; background-color: rgba(100, 100, 255, 0.15); border: 2px solid #6366f1; border-radius: 4px;">
            <p style="font-style: italic; color: #aaa;">
                "나는 이 세계의 창조자이다.<br>
                너는 내 게임을 하고 있을 뿐이다."
            </p>
        </div>
        ${hasHiddenWeapon ? `
            <p style="margin-top: 20px; color: #ffeb3b; font-weight: bold;">
                ★ 종극의 검이 강력한 빛을 발한다!
            </p>
        ` : `
            <p style="margin-top: 20px; color: #888;">
                (히든 무기를 모두 모으면 더 강한 공격을 할 수 있을 것 같다)
            </p>
        `}
        <div style="margin-top: 20px;">
            <p class="choice-text">[공격]</p>
        </div>
    `;
    
    const input = document.getElementById('userInput');
    input.value = '';
    input.focus();
    
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.onclick = () => {
        if (input.value.trim() === '공격') {
            fightSystemFinal(hasHiddenWeapon);
        }
    };
}

function fightSystemFinal(hasHiddenWeapon) {
    gameState.hiddenPieces = []; // 히든 피스 사용
    updateInventory();
    
    if (hasHiddenWeapon) {
        displayEndingGood();
    } else {
        displayEndingBad();
    }
}

function displayEndingGood() {
    const content = document.getElementById('gameContent');
    
    content.innerHTML = `
        <h2 style="color: #4caf50; font-size: 24px;">✨ 진 엔딩</h2>
        <div class="story-text" style="margin-top: 20px;">
            <p style="color: #4caf50; font-weight: bold;">
                당신은 시스템을 격퇴했다!
            </p>
            <p style="margin-top: 20px;">
                빛이 사라지고, 세계가 자유로워졌다.<br>
                루미나는 자신의 빛으로 새로운 세계를 이끌기 시작했다.
            </p>
            <p style="margin-top: 20px; color: #ffb6c1; font-style: italic;">
                "당신이 날 도와주셔서 감사합니다."
            </p>
            <p style="margin-top: 30px; text-align: center; color: #ffeb3b; font-size: 18px;">
                ★ 게임 클리어 ★
            </p>
        </div>
        <div style="margin-top: 30px; text-align: center;">
            <button class="cmd-btn" onclick="endGame()">게임 종료</button>
        </div>
    `;
}

function displayEndingBad() {
    const content = document.getElementById('gameContent');
    
    content.innerHTML = `
        <h2 style="color: #ff5252; font-size: 24px;">⚠️ 배드 엔딩</h2>
        <div class="story-text" style="margin-top: 20px;">
            <p style="color: #ff5252;">
                당신은 시스템에 패배했다...
            </p>
            <p style="margin-top: 20px; font-style: italic; color: #aaa;">
                "다시 처음부터 시작하세요."<br>
                반복되는 게임의 루프...
            </p>
            <p style="margin-top: 30px; text-align: center; color: #888;">
                히든 피스를 모두 모으면 다른 결말이 있을 수 있습니다.
            </p>
        </div>
        <div style="margin-top: 30px; text-align: center;">
            <button class="cmd-btn" onclick="restartGame()">다시 시작</button>
        </div>
    `;
}

function endGame() {
    const content = document.getElementById('gameContent');
    content.innerHTML = `
        <h2 style="text-align: center; color: #ffeb3b;">★ 게임 클리어! ★</h2>
        <p style="margin-top: 30px; text-align: center; font-style: italic;">
            플레이해주셔서 감사합니다.
        </p>
    `;
}

function restartGame() {
    location.reload();
}

// ===== UI 업데이트 =====
function updatePlayerInfo() {
    document.getElementById('playerName').textContent = gameState.playerName;
    document.getElementById('playerClass').textContent = gameState.playerClass;
    document.getElementById('currentStage').textContent = `진행도: ${gameState.stage}차`;
}

function updateStats() {
    document.getElementById('statHp').textContent = gameState.hp;
    document.getElementById('statMp').textContent = gameState.mp;
    document.getElementById('statAtk').textContent = gameState.atk;
    document.getElementById('statCrit').textContent = gameState.crit;
    document.getElementById('statAgi').textContent = gameState.agi;
}

function updateInventory() {
    const inv = document.getElementById('inventory');
    if (gameState.inventory.length > 0) {
        inv.innerHTML = gameState.inventory.map(item => 
            `<div class="inventory-item">📦 ${item}</div>`
        ).join('');
    } else {
        inv.innerHTML = '<div style="color: #666; font-size: 11px;">아이템 없음</div>';
    }
    
    const hiddenDiv = document.getElementById('hiddenPieces');
    hiddenDiv.innerHTML = `
        <div>수집된 피스: <span id="hiddenCount">${gameState.hiddenPieces.length}</span>/3</div>
        ${gameState.hiddenPieces.map(piece => 
            `<div class="hidden-piece-item">⭐ ${piece}</div>`
        ).join('')}
    `;
}

function handleUserInput(value) {
    const input = document.getElementById('userInput');
    input.value = '';
}

// ===== 저장 & 로드 =====
async function handleSave() {
    const { error } = await supabase
        .from('game_saves')
        .upsert({
            user_id: gameState.userId,
            game_data: JSON.stringify(gameState),
            updated_at: new Date()
        }, { onConflict: 'user_id' });
    
    if (!error) {
        alert('게임이 저장되었습니다!');
    } else {
        alert('저장 실패: ' + error.message);
    }
}

async function handleLoad() {
    const { data, error } = await supabase
        .from('game_saves')
        .select('game_data')
        .eq('user_id', gameState.userId)
        .single();
    
    if (!error && data) {
        Object.assign(gameState, JSON.parse(data.game_data));
        updatePlayerInfo();
        updateStats();
        updateInventory();
        displayScreen('stage' + gameState.stage);
        alert('게임이 로드되었습니다!');
    } else {
        alert('저장된 데이터가 없습니다.');
    }
}
