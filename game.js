// ===== Supabase 초기화 =====
const SUPABASE_URL = 'https://ptukyozancuplzwvvqma.supabase.co';
const SUPABASE_KEY = 'sb_publishable_dAhPMLcB0zEQW3QaSB3S_Q_PwSdj3__';
const sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ===== 게임 상태 =====
function createInitialGameState() {
    return {
        userId: null,
        playerName: '',
        playerClass: '',
        playerColor: '',
        stage: 1,
        currentLocation: 'intro',
        hp: 10, maxHp: 10,
        mp: 5, maxMp: 5,
        atk: 10, crit: 10, agi: 5,
        lvatt: '', hdatt: '', hdattUnlocked: false,
        weaponTier: 0, // 0=맨손, 1=녹슨 숏소드 ... 4=룬 블레이드
        inventory: [],
        gold: 0,
        materials: 0,
        potions: { hp: 0, mp: 0 },
        hiddenPieces: [],
        hiddenPiecesUnlocked: false,
        hiddenWeaponAssembled: false,
        hasHiddenWeapon: false,
        regionBossDefeated: {},
        exploreCount: {},
        truthRevealed: {},
        tutorialDone: false,
        storySkipped: false,
        battle: null,
    };
}
let gameState = createInitialGameState();
let hasUnsavedProgress = false;

window.addEventListener('beforeunload', (e) => {
    if (hasUnsavedProgress) {
        e.preventDefault();
        e.returnValue = '';
    }
});

const WEAPON_TIERS_BY_CLASS = {
    '검사': [
        { name: '맨손', atkBonus: 0 },
        { name: '녹슨 숏소드', atkBonus: 2 },
        { name: '롱소드', atkBonus: 5 },
        { name: '기사의 브로드소드', atkBonus: 9 },
        { name: '룬 블레이드', atkBonus: 14 },
    ],
    '버서커': [
        { name: '맨손', atkBonus: 0 },
        { name: '낡은 너클', atkBonus: 2 },
        { name: '강철 너클', atkBonus: 5 },
        { name: '전투 가운틀릿', atkBonus: 9 },
        { name: '광전사의 건틀렛', atkBonus: 14 },
    ],
    '마법사': [
        { name: '맨손', atkBonus: 0 },
        { name: '낡은 완드', atkBonus: 2 },
        { name: '마력 스태프', atkBonus: 5 },
        { name: '현자의 그리모어', atkBonus: 9 },
        { name: '아스트랄 오브', atkBonus: 14 },
    ],
    '성직자': [
        { name: '맨손', atkBonus: 0 },
        { name: '낡은 로자리오', atkBonus: 2 },
        { name: '성직자의 셉터', atkBonus: 5 },
        { name: '신성한 십자가', atkBonus: 9 },
        { name: '치유의 성물', atkBonus: 14 },
    ],
    '궁수': [
        { name: '맨손', atkBonus: 0 },
        { name: '낡은 숏보우', atkBonus: 2 },
        { name: '롱보우', atkBonus: 5 },
        { name: '컴포지트 보우', atkBonus: 9 },
        { name: '에테르 보우', atkBonus: 14 },
    ],
    '도적': [
        { name: '맨손', atkBonus: 0 },
        { name: '낡은 대거', atkBonus: 2 },
        { name: '더크', atkBonus: 5 },
        { name: '스틸레토', atkBonus: 9 },
        { name: '섀도우 블레이드', atkBonus: 14 },
    ],
    '강령술사': [
        { name: '맨손', atkBonus: 0 },
        { name: '낡은 부적', atkBonus: 2 },
        { name: '주술 인형', atkBonus: 5 },
        { name: '룬 스톤', atkBonus: 9 },
        { name: '사령의 토템', atkBonus: 14 },
    ],
};
function getWeaponTiers() { return WEAPON_TIERS_BY_CLASS[gameState.playerClass] || WEAPON_TIERS_BY_CLASS['검사']; }

// ===== 클래스 데이터 =====
const classData = {
    '검사': { hp: 10, mp: 4, atk: 15, crit: 10, agi: 5, lvatt: '기초 검법', hdatt: '불굴의 의지', hdattHint: 'hp 2 이하로 전투에서 살아남으면 발견됩니다' },
    '버서커': { hp: 5, mp: 4, atk: 15, crit: 10, agi: 2, lvatt: '피의 서약', hdatt: '광폭화', hdattHint: 'hp가 1 이하로 떨어진 채로 전투에서 생존하면 발견됩니다' },
    '마법사': { hp: 7.5, mp: 15, atk: 3, crit: 15, agi: 7, lvatt: '마나 회로', hdatt: '과충전', hdattHint: 'atk를 8 이상으로 올리면 발견됩니다' },
    '성직자': { hp: 9, mp: 13, atk: 4, crit: 9, agi: 6, lvatt: '신성 기도', hdatt: '심판의 성업', hdattHint: 'atk를 8 이상으로 올리면 발견됩니다' },
    '궁수': { hp: 7.5, mp: 6, atk: 10, crit: 5, agi: 15, lvatt: '약점 간파', hdatt: '정점의 역전', hdattHint: '자신보다 agi가 높은 적과 10회 이상 싸우면 발견됩니다' },
    '도적': { hp: 6, mp: 8, atk: 10, crit: 20, agi: 12, lvatt: '그림자 습격', hdatt: '환영술', hdattHint: '첫 턴 크리티컬을 8번 발동시키면 발견됩니다' },
    '강령술사': { hp: 9, mp: 12, atk: 5, crit: 10, agi: 4, lvatt: '영혼 수확', hdatt: '사자의 군대', hdattHint: '같은 적을 30번 이상 처치하면 발견됩니다' },
};

const colorToClass = {
    '빨강': '버서커', '노랑': '마법사', '연두': '성직자', '초록': '궁수',
    '파랑': '도적', '보라': '강령술사', '검정': '검사',
};

// ===== 특성 데이터 (무기 강화 단계에 연동되는 Lv형 특성 + 조건부 개화형 히든 특성) =====
const traitData = {
    '검사': {
        lvStages: ['무기 강화 시마다 atk/crit/agi 10% 증가', 'atk/crit/agi 20% 증가', 'atk/crit/agi 20% 증가 + 치명타 시 적을 1턴간 기절시킴'],
        hiddenDesc: '게임 전체에서 단 한 번, hp가 1 이하가 되는 순간 hp 5 회복 + atk 2배로 되살아납니다(전투 종료 후 효과 소멸)',
    },
    '버서커': {
        lvStages: ['hp가 최대치의 50% 이하일 때 atk 10% 증가', 'hp 50% 이하일 때 atk 20% 증가', 'hp 50% 이하일 때 atk 20% 증가 + 가한 피해의 10%만큼 회복(최대hp 50%까지)'],
        hiddenDesc: '깎인 hp 1당 atk 3%의 추가 피해(hp 3 이하부터는 4%), hp가 1 이하면 치명타 확률이 90%로 고정됩니다',
    },
    '마법사': {
        lvStages: ['매 턴 최대mp 10% 회복', '매 턴 mp 10% 회복 + 직접 공격 시 mp 10% 회복', '위 효과 + 스킬 사용 시 치명타 확률 20% 증가'],
        hiddenDesc: '일반/상급 스킬 사용 시 mp 소모 +2, 피해 2배가 되지만 사용 직후 1턴간 행동할 수 없습니다',
    },
    '성직자': {
        lvStages: ['치명타 발동 시 치명타 피해의 10%만큼 추가 피해', '치명타 발동 시 20%만큼 추가 피해', '치명타 발동 시 20%만큼 추가 피해 + 자신 hp 8% 회복'],
        hiddenDesc: '적의 숨통을 끊는 마지막 공격이 일반 공격이었을 경우, 강력한 심판의 기운이 함께합니다',
    },
    '궁수': {
        lvStages: ['자신보다 agi가 낮은 적 공격 시 치명타 확률 +10', '치명타 확률 +15', '치명타 확률 +15 + 25% 확률로 25%의 피해를 한 번 더 입힘'],
        hiddenDesc: '자신보다 agi가 높은 적을 공격할 때, 그 agi 차이만큼 치명타 확률이 상승합니다',
    },
    '도적': {
        lvStages: ['전투 시작 첫 턴, 50% 확률로 atk 20% 또는 10% 증가', '50% 확률로 atk 40% 또는 20% 증가', '첫 턴 atk 40% 증가 + 회피에 성공한 다음 공격은 무조건 치명타'],
        hiddenDesc: '전투의 첫 공격이 치명타로 적중하면, 3턴간 agi가 크게 상승합니다',
    },
    '강령술사': {
        lvStages: ['일반 마법 사용 시 가한 피해의 10%만큼 회복', '일반 마법 사용 시 20%만큼 회복', '모든 마법에서 20%만큼 회복 + 적 처치 시 mp 2 회복'],
        hiddenDesc: '적의 공격력이 자신보다 높으면, 전투가 시작될 때 그 힘의 일부를 빌려옵니다',
    },
};
function getTraitStage() { return Math.max(0, Math.min(3, gameState.weaponTier - 1)); }
function getEffectiveAtk() {
    return gameState.atk + getWeaponTiers()[gameState.weaponTier].atkBonus + (gameState.hasHiddenWeapon ? 12 : 0);
}
function unlockHiddenTrait() {
    if (gameState.hdattUnlocked) return;
    gameState.hdattUnlocked = true;
    addLog(`<span style="color:var(--amber);">★ 히든 특성 발견: '${gameState.hdatt}'</span>`);
}
function checkAtkHiddenUnlock() {
    if (!gameState.hdattUnlocked && (gameState.playerClass === '마법사' || gameState.playerClass === '성직자') && getEffectiveAtk() >= 8) {
        unlockHiddenTrait();
    }
}

// ===== 스킬 데이터 =====
const skillData = {
    '검사': {
        general: { name: '검의 노래', mp: 2, desc: '3턴간 crit +20%, 공격 시 mp 1 회복', apply(b) { b.playerCritBuff = 3; addLog('* 검의 노래: 3턴간 치명타 확률이 오릅니다.'); } },
        advanced: { name: '칼바람 베기', mp: 3, desc: '2회 연속 공격', apply(b) { attackEnemy(b, 0.7); attackEnemy(b, 0.7); } },
        ultimate: { name: '천단일도', mp: 5, desc: '강력한 단일 공격', apply(b) { attackEnemy(b, 2.2); } },
    },
    '버서커': {
        general: { name: '선혈의 일격', mp: 2, desc: '자신 hp를 소모해 강한 공격', apply(b) { gameState.hp = Math.max(0.5, gameState.hp - gameState.maxHp * 0.05); updateStats(); attackEnemy(b, 1.5); } },
        advanced: { name: '광기의 발산', mp: 3, desc: '2턴간 atk +30% (받는 피해 +20%)', apply(b) { b.playerAtkBuff = 2; b.playerVulnerable = 2; addLog('* 광기의 발산: 공격력이 크게 오르지만 방어가 약해집니다.'); } },
        ultimate: { name: '혈투의 종막', mp: 5, desc: 'hp가 낮을수록 강해지는 필살기', apply(b) { const ratio = 1 - (gameState.hp / gameState.maxHp); attackEnemy(b, 1.8 + ratio * 2.5); } },
    },
    '마법사': {
        general: { name: '마력 화살', mp: 2, desc: '원거리 마법 공격(과충전 습득 시 위력 2배, 반동으로 다음 턴 행동불가)', apply(b) {
            attackEnemy(b, gameState.hdattUnlocked ? 3.0 : 1.5, { viaSkill: true });
        } },
        advanced: { name: '연쇄 벼락', mp: 3, desc: '적에게 강한 마법 피해(과충전 습득 시 위력 2배, 반동으로 다음 턴 행동불가)', apply(b) {
            attackEnemy(b, gameState.hdattUnlocked ? 3.6 : 1.8, { viaSkill: true });
        } },
        ultimate: { name: '차원 붕괴', mp: 5, desc: '확정 크리티컬의 최상급 마법', apply(b) { attackEnemy(b, 2.6, { forceCrit: true, viaSkill: true }); } },
    },
    '성직자': {
        general: { name: '치유의 빛', mp: 2, desc: '자신 hp 20% 회복', apply(b) { gameState.hp = Math.min(gameState.maxHp, gameState.hp + gameState.maxHp * 0.2); updateStats(); addLog('* 치유의 빛: hp가 회복되었습니다.'); } },
        advanced: { name: '성스러운 방패', mp: 3, desc: '2턴간 받는 피해 30% 감소', apply(b) { b.playerShield = 2; addLog('* 성스러운 방패: 2턴간 받는 피해가 줄어듭니다.'); } },
        ultimate: { name: '심판의 빛', mp: 5, desc: '공격 + hp 15% 회복', apply(b) { attackEnemy(b, 1.9); gameState.hp = Math.min(gameState.maxHp, gameState.hp + gameState.maxHp * 0.15); updateStats(); } },
    },
    '궁수': {
        general: { name: '정조준', mp: 2, desc: '다음 공격 크리티컬 확정', apply(b) { b.forceCritNext = true; addLog('* 정조준: 다음 공격은 반드시 명중합니다.'); } },
        advanced: { name: '급소 사격', mp: 3, desc: '공격 후, 다음 턴 시작 시 상처가 터져 추가 피해', apply(b) {
            const dealt = attackEnemy(b, 1.3);
            b.archerBleed = dealt * 0.5;
            addLog('* 급소 사격: 상처가 다음 턴에 터질 것입니다.');
        } },
        ultimate: { name: '천공의 화살', mp: 5, desc: '강력한 일격 + 자신의 민첩만큼 고정 추가 피해', apply(b) {
            attackEnemy(b, 2.0);
            const bonus = Math.round(gameState.agi);
            const bonusLoss = Math.round((bonus / 10) * 10) / 10;
            b.enemyHp = Math.max(0, b.enemyHp - bonusLoss);
            addLog(`* 민첩을 실은 화살이 공격력 ${bonus}만큼 적 hp를 ${bonusLoss}칸 깎았습니다!`);
        } },
    },
    '도적': {
        general: { name: '그림자 베기', mp: 2, desc: '크리티컬 확률 +30%로 습격', apply(b) { attackEnemy(b, 1.3, { critBonus: 30 }); } },
        advanced: { name: '연막 회피', mp: 3, desc: '2턴간 agi +50%', apply(b) { b.playerAgiBuff = 2; addLog('* 연막 회피: 2턴간 회피율이 크게 오릅니다.'); } },
        ultimate: { name: '암살', mp: 5, desc: '적 hp가 낮을수록 강력한 일격', apply(b) { const ratio = b.enemyHp / b.enemyMaxHp; const mult = ratio <= 0.3 ? 4 : 2; attackEnemy(b, mult); } },
    },
    '강령술사': {
        general: { name: '영혼 흡수', mp: 2, desc: '공격 후 피해량 일부만큼 회복(영혼 수확 단계에 따라 증가)', apply(b) {
            const dealt = attackEnemy(b, 1.2, { viaSkill: true });
            const pct = getTraitStage() >= 2 ? 0.2 : 0.1;
            if (dealt) { gameState.hp = Math.min(gameState.maxHp, gameState.hp + dealt * pct); updateStats(); }
        } },
        advanced: { name: '저주 인형', mp: 3, desc: '3턴간 적 atk 20% 감소', apply(b) { b.enemyAtkDebuff = 3; addLog('* 저주 인형: 적의 공격력이 약해집니다.'); } },
        ultimate: { name: '사령 소환', mp: 5, desc: '소환수가 추가 공격(영혼 수확 최종형이면 피해량 일부 회복 + 적 처치 시 mp 회복)', apply(b) {
            const d1 = attackEnemy(b, 1.4, { viaSkill: true });
            const d2 = attackEnemy(b, 0.9, { viaSkill: true });
            if (getTraitStage() >= 3) {
                gameState.hp = Math.min(gameState.maxHp, gameState.hp + (d1 + d2) * 0.2);
                updateStats();
                if (b.enemyHp <= 0) gameState.mp = Math.min(gameState.maxMp, gameState.mp + 2);
            }
        } },
    },
};

// ===== 지역 데이터 (표면적 설정 + 숨겨진 진실) =====
const locations = {
    '여명각': { name: '여명각 (Dawnpoint)', desc: '마을의 동쪽 끝, 영웅의 아침이 시작되는 곳', type: 'tutorial' },
    '백야촌': { name: '백야촌 (Daybreak)', desc: '모든 이야기의 출발점, 밤이 없는 곳', type: 'hub' },
    '세계수의 심장': { name: '세계수의 심장 (The Heartwood)', desc: '근원의 힘을 품은, 모든 여정의 교차로', type: 'center' },
    '청풍협': {
        name: '청풍협 (The Zephyr Ward)',
        desc: '세계수 에너지를 정류하여 인간 마을을 지키는 거대한 바람의 장벽입니다.',
        truth: '사실 이곳은 마물이 밖으로 나가지 못하게 가두고 맹목적으로 사냥하기 위해 시스템이 쳐둔 \'가두리 양식장\'의 경계선이었다.',
        enemyNames: ['바람 정령', '청풍의 파수견', '길 잃은 그림자'],
        boss: { name: '폭풍의 파수룡', hp: 18, atk: 10 },
        type: 'field',
    },
    '황혼령': {
        name: '황혼의 정련소 (The Dusk Refinery)',
        desc: '붉은 노을 아래, 인간들이 세계수 뿌리에서 나오는 에너지를 정제하는 공업 도시입니다.',
        truth: '이곳은 마물의 피와 에너지를 짜내어 인간의 무기를 제련하는 잔혹한 도살장이었다.',
        enemyNames: ['정련로의 파수꾼', '녹슨 골렘', '황혼의 감시자'],
        boss: { name: '정련소의 감독관', hp: 20, atk: 11 },
        type: 'field',
    },
    '염화대지': {
        name: '열하 채굴장 (The Ember Veins)',
        desc: '뜨거운 열기를 뿜어내는 마력 광산입니다.',
        truth: '세계수가 흡수한 마물 에너지가 가장 고농도로 농축된 곳으로, 인간들의 탐욕이 대지를 불태우고 있는 형상이었다.',
        enemyNames: ['용암 마물', '열하의 광부 인형', '불타는 정령'],
        boss: { name: '용암의 군주', hp: 22, atk: 12 },
        type: 'field',
    },
    '설향원': {
        name: '동결된 심연 (The Frost-Veil Crypt)',
        desc: '고대 마물들의 사체가 얼어붙어 있는 차가운 빙하 지역입니다 - 개발중',
        truth: '시스템이 다음 패치나 스토리 진행을 위해 \'미사용 데이터(마물)\'들을 얼려서 백업해 둔 데이터 폐기장이었다.',
        type: 'locked',
    },
    '사월정': { name: '사월정 (The Necro-Luna Spire)', desc: '어두운 달빛의 운명적 죽음', type: 'boss' },
    '종천각': { name: '종천각 (Sunburst)', desc: '세상 너머, 시스템이 머무는 곳', type: 'system' },
};

const FIELD_LOCATIONS = ['청풍협', '황혼령', '염화대지'];

// ===== 유틸 =====
function round1(n) { return Math.round(n * 10) / 10; }
function renderBar(current, max, color) {
    const total = Math.max(1, Math.round(max));
    const filled = Math.max(0, Math.min(total, Math.round(current)));
    const c = color || 'var(--cyan)';
    let bar = '<span style="display:inline-flex; gap:2px; vertical-align:middle;">';
    for (let i = 0; i < total; i++) {
        const on = i < filled;
        bar += `<span style="display:inline-block; width:10px; height:11px; background-color:${on ? c : 'transparent'}; border:1px solid ${on ? c : 'var(--line)'};"></span>`;
    }
    bar += '</span>';
    return `<span class="skill-tooltip-wrap">${bar}<span class="skill-tooltip">${round1(current)}/${Math.round(max)}</span></span>`;
}
function addLog(html) {
    const content = document.getElementById('gameContent');
    content.innerHTML += `<p class="system-message">${html}</p>`;
}
function setInput(placeholder, onSubmit) {
    const input = document.getElementById('userInput');
    input.placeholder = placeholder;
    input.value = '';
    input.focus();
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.onclick = () => onSubmit(input.value.trim());
    input.onkeypress = null;
}
function choiceHtml(text) {
    return `<span class="choice-text" onclick="runChoice('${text}')">[${text}]</span>`;
}
function runChoice(text) {
    const input = document.getElementById('userInput');
    input.value = text;
    document.getElementById('submitBtn').click();
}
window.runChoice = runChoice;

// ===== 초기화 =====
document.addEventListener('DOMContentLoaded', async () => { await initGame(); });

async function initGame() {
    const { data: { user } } = await sbClient.auth.getUser();
    if (!user) { window.location.href = 'index.html'; return; }
    gameState.userId = user.id;
    gameState.playerName = (user.user_metadata && user.user_metadata.username) || '플레이어';

    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    document.getElementById('saveBtn').addEventListener('click', handleSave);
    document.getElementById('loadBtn').addEventListener('click', handleLoad);
    document.getElementById('resetBtn').addEventListener('click', handleReset);

    const userInput = document.getElementById('userInput');
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') document.getElementById('submitBtn').click();
    });

    displayIntro();
}

async function handleLogout() { await sbClient.auth.signOut(); window.location.href = 'index.html'; }

// ===== 이스터에그: 숨은 명령어 =====
const MORSE_MESSAGE = ".... .. ... .. ... .- .-. . .-- .- .-. -.. ..-. --- .-. -.-- --- ..- .-. --. .- -- . .--. .-.. .- -.-- .-.-.- .--. .-.. . .- ... . .-.. . .- ...- . .- -- . ... ... .- --. . .-.-.-";
function checkEasterEgg(cmd) {
    if (cmd === '히든' || cmd === '????') {
        addLog(`* ??? : <span style="letter-spacing:1px;">${MORSE_MESSAGE}</span>`);
        addLog('* ??? : 이 신호를 해독할 수 있다면... 무언가 얻을 수 있을지도 모릅니다.');
        addLog('* 히든 상품: 게임 밖에서 개발자에게 이 메시지를 해독해 보여주면 캐릭터 커스텀 / 스토리 소폭 조정 중 하나를 받을 수 있습니다.');
        return true;
    }
    return false;
}

// ===== 캐릭터 생성 =====
function displayIntro() {
    const content = document.getElementById('gameContent');
    content.innerHTML = `
        <h2 style="text-align:center; font-size:28px; color:var(--amber); text-shadow:0 0 10px rgba(255,152,0,0.3);">세계의 빛</h2>
        <p style="text-align:center; margin-top:30px; font-style:italic; color:var(--dim);">누군가 당신의 이름을 부르고 있습니다...</p>
        <div class="system-message" style="margin-top:30px;">* 시스템: '어서오세요, ${gameState.playerName}님'</div>
        <div style="margin-top:20px; text-align:center;">
            <button onclick="runChoice('시작')" class="btn-start-black">시작</button>
        </div>
    `;
    updatePlayerInfo();
    setInput('명령어를 입력하세요...', (val) => {
        if (checkEasterEgg(val)) return;
        setTimeout(displayCharacterCreation, 500);
    });
}

function displayCharacterCreation() {
    const content = document.getElementById('gameContent');
    const colorBoxes = [
        ['검정', '#888', '검사'], ['빨강', '#dc143c', '버서커'], ['노랑', '#ffeb3b', '마법사'], ['연두', '#00e676', '성직자'],
        ['초록', '#00c853', '궁수'], ['파랑', '#3ddfef', '도적'], ['보라', '#9c27b0', '강령술사'],
    ];
    content.innerHTML = `
        <h2>클래스 선택</h2>
        <p class="system-message">* 시스템: '캐릭터의 클래스를 정해주세요.'</p>
        <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:1px; background-color:var(--line); border:1px solid var(--line); margin:20px 0;">
            ${colorBoxes.map(([c, hex, cls]) => `
                <div class="choice-text" onclick="runChoice('${c}')" style="padding:20px 10px; background-color:var(--panel); text-decoration:none; text-align:center; --glow-color:${hex};">
                    <div style="width:10px; height:10px; margin:0 auto 12px; background-color:${hex}; transform:rotate(45deg);"></div>
                    <span style="color:${hex}; font-weight:bold;">${cls}</span>
                </div>`).join('')}
            <div style="padding:20px 10px; background-color:var(--panel); text-align:center; opacity:0.4; cursor:default;">
                <div style="width:10px; height:10px; margin:0 auto 12px; background-color:var(--dim); transform:rotate(45deg);"></div>
                <span style="color:var(--dim); font-weight:bold;">???</span>
            </div>
        </div>
    `;
    setInput('클래스를 선택하세요...', (val) => {
        if (checkEasterEgg(val)) return;
        if (colorToClass[val]) {
            gameState.playerColor = val;
            gameState.playerClass = colorToClass[val];
            const stats = classData[gameState.playerClass];
            gameState.hp = stats.hp; gameState.maxHp = stats.hp;
            gameState.mp = stats.mp; gameState.maxMp = stats.mp;
            gameState.atk = stats.atk; gameState.crit = stats.crit; gameState.agi = stats.agi;
            gameState.lvatt = stats.lvatt; gameState.hdatt = '발견되지 않음';
            document.getElementById('inventorySection').style.display = 'block';
            updatePlayerInfo(); updateStats(); updateInventory();
            displayStorySkip();
        } else {
            addLog('<span style="color:var(--crimson);">* 시스템: 올바른 색상을 입력해주세요</span>');
        }
    });
}

function displayStorySkip() {
    const content = document.getElementById('gameContent');
    content.innerHTML = `
        <h2>스토리</h2>
        <div class="system-message">* 시스템: '스토리를 보시겠습니까?' (Y/N)</div>
        <div style="margin-top:15px;">${choiceHtml('Y')} ${choiceHtml('N')}</div>
    `;
    setInput('Y 또는 N을 입력하세요', (val) => {
        const a = val.toUpperCase();
        if (a === 'Y') { gameState.storySkipped = false; displayFullStory(); }
        else if (a === 'N') {
            gameState.storySkipped = true;
            addLog("* 시스템: '스토리를 스킵합니다'");
            setTimeout(displayTutorialChoice, 600);
        }
    });
}

function displayFullStory() {
    const content = document.getElementById('gameContent');
    content.innerHTML = `
        <h2>세계의 빛 - 스토리</h2>
        <div class="story-text" style="color:var(--cyan);">
            <p>세계의 빛에 오신 여러분을 환영합니다.</p>
            <p>이 세계의 인간과 마족, 두 종족은 오랜 기간 전쟁을 벌였습니다.</p>
            <p>그러나, 인간이 마족의 힘을 무력화하는 '세계수'를 발견한 후</p>
            <p>인간이 마족의 침입을 막아내어, 전쟁은 멈추게 되었습니다.</p><br>
            <p>그러나 이제, 세계수의 힘이 흔들리고 있습니다.</p>
            <p>세계수의 힘이 약화된다면 다시 전쟁이 시작될 것입니다.</p>
            <p>그래서 당신은, 마왕성에 들어가</p>
            <p>그들의 힘의 근원을 가지고 있는 마왕을 처치하게 됩니다.</p>
            <p style="font-weight:bold; color:var(--cyan); margin-top:20px;">
                마왕을 격퇴하고, 인간의 평화를 지켜주세요!
            </p>
        </div>
        <div style="margin-top:30px; text-align:center;">
            <button class="cmd-btn" onclick="displayTutorialChoice()">계속</button>
        </div>
    `;
}

function displayTutorialChoice() {
    const content = document.getElementById('gameContent');
    content.innerHTML = `
        <h2>튜토리얼</h2>
        <div class="system-message">* 시스템: '튜토리얼을 진행하시겠습니까?' (Y/N)</div>
        <div style="margin-top:15px;">${choiceHtml('Y')} ${choiceHtml('N')}</div>
    `;
    setInput('Y 또는 N을 입력하세요', (val) => {
        const a = val.toUpperCase();
        if (a === 'Y') { gameState.tutorialDone = false; gameState.currentLocation = '여명각'; displayStage1Start(); }
        else if (a === 'N') { gameState.tutorialDone = true; gameState.currentLocation = '백야촌'; displayStage1Start(); }
    });
}

// ===== 1차: 마왕 격퇴 =====
function displayStage1Start() {
    if (!gameState.tutorialDone) { displayTutorialWake(); return; }
    const loc = '백야촌';
    const content = document.getElementById('gameContent');
    content.innerHTML = `
        <div class="location-title">${locations[loc].name}</div>
        <div class="location-desc">${locations[loc].desc}</div>
        <p class="system-message">* 시스템: ${loc}에 도착했습니다.</p>
        <p style="margin-top:15px; color:var(--dim);">마을 사람들의 도움으로 여기까지 왔습니다. 이제 모험을 시작해야 합니다.</p>
        <p class="system-message" style="margin-top:10px;">* 시스템: '세이브는 세계수의 심장에서만 가능합니다.'</p>
        <div style="margin-top:20px;">${choiceHtml('모험 시작')}</div>
    `;
    setInput('명령어를 입력하세요...', (val) => {
        if (checkEasterEgg(val)) return;
        if (val === '모험 시작' || val === '전투 시작') displayTravelMenu();
    });
}

// ===== 튜토리얼 (여명각) =====
function displayTutorialWake() {
    const content = document.getElementById('gameContent');
    content.innerHTML = `
        <div class="location-title">${locations['여명각'].name}</div>
        <p class="story-text" style="margin-top:15px;">풀숲에서 눈을 뜨자, 마물 한 마리가 저만치서 이쪽을 노려보고 있습니다.</p>
        <p class="system-message" style="margin-top:10px;">* 시스템: '먼저, 주변을 탐색해 주세요.'</p>
        <div style="margin-top:20px;">${choiceHtml('탐색')}</div>
    `;
    setInput('명령어를 입력하세요... (탐색)', (val) => {
        if (checkEasterEgg(val)) return;
        if (val === '탐색') displayTutorialWeaponFound();
    });
}

function displayTutorialWeaponFound() {
    gameState.weaponTier = Math.max(gameState.weaponTier, 1);
    updateStats();
    updateInventory();
    const weapon = getWeaponTiers()[1];
    const content = document.getElementById('gameContent');
    content.innerHTML = `
        <div class="location-title">${locations['여명각'].name}</div>
        <p class="story-text" style="margin-top:15px;">수풀 사이에서 낡은 무기 하나를 발견했습니다.</p>
        <p style="margin-top:10px; color:var(--amber);">★ '${weapon.name}'을(를) 손에 넣었습니다!</p>
        <div style="margin-top:20px;">${choiceHtml('전투 시작')}</div>
    `;
    setInput('명령어를 입력하세요...', (val) => {
        if (checkEasterEgg(val)) return;
        if (val === '전투 시작') {
            startBattle(locations['여명각'], null, "* 시스템: '공격은 피해를 주고, 스킬은 mp를 소모해 강력한 효과를, 방어는 받는 피해를 줄입니다.'");
        }
    });
}

function displayTravelMenu() {
    gameState.currentLocation = '세계수의 심장';
    updatePlayerInfo();
    const content = document.getElementById('gameContent');
    const rows = FIELD_LOCATIONS.map(key => `<div style="padding:10px; background-color:rgba(0,191,255,0.1); border-left:3px solid var(--cyan); border-radius:0;">${choiceHtml(key)} - ${locations[key].name}</div>`).join('');
    const lockedRow = `<div style="padding:10px; background-color:rgba(100,100,100,0.1); border-left:3px solid var(--line); border-radius:0; color:var(--dim);">🔒 설향원 (개발중)</div>`;
    content.innerHTML = `
        <div class="location-title">${locations['세계수의 심장'].name}</div>
        <div class="location-desc">${locations['세계수의 심장'].desc}</div>
        <p class="system-message">* 시스템: '어디로 가시겠습니까?'</p>
        <div style="display:flex; flex-direction:column; gap:8px; margin-top:15px;">${rows}${lockedRow}</div>
        <div style="margin-top:15px;">${choiceHtml('대장간')} ${choiceHtml('상점')}</div>
        ${readyForBoss() ? `<div style="margin-top:15px;">${choiceHtml('사월정으로 이동')}</div>` : ''}
        ${readyForFinal() ? `<div style="margin-top:15px;">${choiceHtml('종천각으로 이동')}</div>` : ''}
        <div style="margin-top:26px; opacity:0.35; font-size:11px;">${choiceHtml('여명각으로')}</div>
    `;
    setInput('지역명을 입력하세요...', (val) => {
        if (checkEasterEgg(val)) return;
        if (val === '여명각으로') { travelToDawnpoint(); return; }
        if (val === '대장간') { displayForge(); return; }
        if (val === '상점') { displayShop(); return; }
        if (val === '사월정으로 이동' && readyForBoss()) { displayBossEncounter(); return; }
        if (val === '종천각으로 이동' && readyForFinal()) { goToFinalBattle(); return; }
        if (locations[val] && locations[val].type === 'field') { gameState.currentLocation = val; displayLocation(); }
    });
}

function readyForBoss() { return gameState.stage === 1; }
function readyForFinal() { return gameState.stage >= 3; }

function travelToDawnpoint() {
    if (gameState.hiddenWeaponAssembled && !gameState.hasHiddenWeapon) {
        gameState.hasHiddenWeapon = true;
        gameState.inventory.push('종극의 검');
        updateInventory();
        const content = document.getElementById('gameContent');
        content.innerHTML = `
            <div class="location-title">${locations['여명각'].name}</div>
            <p class="system-message" style="color:var(--amber);">* 여명각의 오래된 제단 위, 완성된 조각들이 빛을 내며 하나의 검으로 변합니다.</p>
            <p style="margin-top:15px; color:var(--amber); font-weight:bold;">★ '종극의 검'을 획득했습니다!</p>
            <p style="margin-top:10px; color:var(--dim); font-style:italic;">"태초부터의 시작을 두려움보다 도전으로 보는 자만이..."</p>
            <div style="margin-top:20px;">${choiceHtml('돌아가기')}</div>
        `;
        setInput('명령어를 입력하세요...', (val) => { if (val === '돌아가기') displayTravelMenu(); });
        return;
    }
    const content = document.getElementById('gameContent');
    content.innerHTML = `
        <div class="location-title">${locations['여명각'].name}</div>
        <div class="location-desc">${locations['여명각'].desc}</div>
        <p class="system-message">* 여명각을 둘러보지만, 특별한 것은 없습니다.</p>
        <div style="margin-top:20px;">${choiceHtml('돌아가기')}</div>
    `;
    setInput('명령어를 입력하세요...', (val) => { if (val === '돌아가기') displayTravelMenu(); });
}

function displayForge() {
    const tiers = getWeaponTiers();
    const canUpgradeWeapon = gameState.weaponTier < tiers.length - 1;
    const upgradeCost = 3;
    const forgeUnlocked = gameState.hiddenPieces.length >= 3 && !gameState.hiddenWeaponAssembled;
    const content = document.getElementById('gameContent');
    content.innerHTML = `
        <h2>🔨 대장간</h2>
        <p class="system-message">* 대장장이: '강화 재료를 가져오면 무기를 강화해 드리죠.' (보유 강화 재료: ${gameState.materials || 0})</p>
        <div style="margin-top:15px; display:flex; flex-direction:column; gap:8px;">
            ${canUpgradeWeapon
                ? `<div>${choiceHtml('무기 강화')} <span style="color:var(--dim); font-size:11px;">(강화 재료 ${upgradeCost}개 · 다음 단계: '${tiers[gameState.weaponTier + 1].name}')</span></div>`
                : `<p style="color:var(--dim); font-size:11px;">현재 무기가 이미 최고 단계입니다.</p>`}
            ${forgeUnlocked ? `<div>${choiceHtml('조립')} <span style="color:var(--dim); font-size:11px;">(히든 피스 3개 조립)</span></div>` : ''}
            <div>${choiceHtml('돌아가기')}</div>
        </div>
    `;
    setInput('명령어를 입력하세요...', (val) => {
        if (val === '무기 강화' && canUpgradeWeapon) {
            if ((gameState.materials || 0) < upgradeCost) {
                addLog('<span style="color:var(--crimson);">* 대장장이: "강화 재료가 부족합니다."</span>');
                return;
            }
            gameState.materials -= upgradeCost;
            gameState.weaponTier++;
            updateStats(); updateInventory();
            addLog(`* 대장장이: "다 됐습니다. '${tiers[gameState.weaponTier].name}'을(를) 손에 넣으셨군요."`);
        } else if (val === '조립' && forgeUnlocked) {
            gameState.hiddenWeaponAssembled = true;
            addLog('* 대장장이: "조립이 끝났습니다. 여명각의 제단에 가져가 보세요."');
            updateInventory();
        } else if (val === '돌아가기') { displayTravelMenu(); }
    });
}

function displayShop(msg) {
    const content = document.getElementById('gameContent');
    content.innerHTML = `
        <h2>🏪 상점</h2>
        <p class="system-message">* 상인: '어서오세요. 무엇을 드릴까요?' (보유 골드: ${gameState.gold || 0})</p>
        ${msg ? `<p style="margin-top:10px;">${msg}</p>` : ''}
        <div style="margin-top:15px; display:flex; flex-direction:column; gap:8px;">
            <div>${choiceHtml('hp 포션 구매')} <span style="color:var(--dim); font-size:11px;">(30골드, hp 최대치의 40% 회복 · 보유: ${gameState.potions.hp})</span></div>
            <div>${choiceHtml('mp 포션 구매')} <span style="color:var(--dim); font-size:11px;">(20골드, mp 최대치의 50% 회복 · 보유: ${gameState.potions.mp})</span></div>
            <div>${choiceHtml('돌아가기')}</div>
        </div>
    `;
    setInput('명령어를 입력하세요...', (val) => {
        if (val === 'hp 포션 구매') buyPotion('hp');
        else if (val === 'mp 포션 구매') buyPotion('mp');
        else if (val === '돌아가기') displayTravelMenu();
    });
}

function buyPotion(type) {
    const cost = type === 'hp' ? 30 : 20;
    let msg;
    if ((gameState.gold || 0) < cost) {
        msg = '<span style="color:var(--crimson);">골드가 부족합니다.</span>';
    } else {
        gameState.gold -= cost;
        gameState.potions[type]++;
        msg = `<span style="color:#4caf50;">${type === 'hp' ? 'hp' : 'mp'} 포션을 구매했습니다. (인벤토리에서 확인할 수 있습니다)</span>`;
    }
    updateStats();
    updateInventory();
    displayShop(msg);
}

function usePotionInBattle(type) {
    if (!gameState.potions[type]) return;
    playerTurn(() => {
        gameState.potions[type]--;
        if (type === 'hp') {
            gameState.hp = Math.min(gameState.maxHp, gameState.hp + gameState.maxHp * 0.4);
            addLog('* hp 포션을 사용했습니다.');
        } else {
            gameState.mp = Math.min(gameState.maxMp, gameState.mp + gameState.maxMp * 0.5);
            addLog('* mp 포션을 사용했습니다.');
        }
        updateStats();
        updateInventory();
    });
}

function displayLocation() {
    const key = gameState.currentLocation;
    const loc = locations[key];
    if (!loc) { displayTravelMenu(); return; }
    if (!gameState.exploreCount[key]) gameState.exploreCount[key] = 0;

    const content = document.getElementById('gameContent');
    const truthBlock = gameState.truthRevealed[key]
        ? `<p style="margin-top:10px; color:var(--amber); font-style:italic;">숨겨진 진실: ${loc.truth}</p>` : '';
    const bossAvailable = loc.boss && gameState.exploreCount[key] >= 2 && !gameState.regionBossDefeated[key];
    content.innerHTML = `
        <div class="location-title">${loc.name}</div>
        <div class="location-desc">${loc.desc}</div>
        ${truthBlock}
        <p class="system-message">* 시스템: ${loc.name}에 도착했습니다.</p>
        <div style="margin-top:20px;">${choiceHtml('적과 전투')} ${choiceHtml('탐색')} ${bossAvailable ? choiceHtml('지역보스와 전투') : ''} ${choiceHtml('돌아가기')}</div>
    `;
    setInput('명령어를 입력하세요...', (val) => {
        if (checkEasterEgg(val)) return;
        if (val === '적과 전투') startBattle(loc);
        else if (val === '탐색') exploreLocation(key, loc);
        else if (val === '지역보스와 전투' && bossAvailable) {
            startBattle(loc, 'region', `* 시스템: '${loc.boss.name}'이(가) 모습을 드러냅니다!`);
        }
        else if (val === '돌아가기') displayTravelMenu();
    });
}

function exploreLocation(key, loc) {
    gameState.exploreCount[key]++;
    const content = document.getElementById('gameContent');
    content.innerHTML = `<h2>🔍 탐색</h2><p class="system-message">* 시스템: ${loc.name}을(를) 탐색합니다...</p>`;

    const canFindPiece = gameState.hiddenPiecesUnlocked && gameState.hiddenPieces.length < 3 && gameState.stage <= 3;
    const canRevealTruth = !gameState.truthRevealed[key] && gameState.exploreCount[key] >= 2;
    const roll = Math.random();

    setTimeout(() => {
        if (canFindPiece && roll > 0.55) {
            const pieceLabel = `히든 피스 ${gameState.hiddenPieces.length + 1} (${gameState.stage}차)`;
            gameState.hiddenPieces.push(pieceLabel);
            updateInventory();
            content.innerHTML += `<p style="margin-top:15px; color:var(--amber); font-weight:bold;">★ ${pieceLabel}를 발견했습니다!</p>
                <p style="margin-top:10px; color:var(--dim);">이 파편들을 모아서 무언가를 만들 수 있을 것 같습니다...</p>`;
        } else if (canRevealTruth && roll > 0.4) {
            gameState.truthRevealed[key] = true;
            content.innerHTML += `<p style="margin-top:15px; color:var(--amber); font-style:italic;">이곳을 자세히 살펴보다, 숨겨진 진실을 알게 되었습니다.<br>"${loc.truth}"</p>`;
        } else {
            content.innerHTML += `<p style="margin-top:15px; color:var(--dim);">특별한 것은 발견하지 못했습니다.</p>`;
        }
        content.innerHTML += `<div style="margin-top:20px;">${choiceHtml('돌아가기')}</div>`;
        setInput('명령어를 입력하세요...', (val) => { if (val === '돌아가기') displayLocation(); });
    }, 600);
}

// ===== 전투 시스템 =====
function makeEnemy(loc, isBoss) {
    if (isBoss === 'necros') return { name: '마왕 일루미스 네크로시스', hp: 15, maxHp: 15, atk: 7, agi: 6, isBoss: true };
    if (isBoss === 'system') return { name: '시스템 - 개발자', hp: 18, maxHp: 18, atk: 8, agi: 7, isBoss: true };
    if (isBoss === 'region') return { name: loc.boss.name, hp: loc.boss.hp, maxHp: loc.boss.hp, atk: loc.boss.atk, agi: 9, isBoss: true };
    const names = loc.enemyNames || ['마물'];
    const name = names[Math.floor(Math.random() * names.length)];
    const hp = 3 + Math.floor(Math.random() * 4);
    return { name, hp, maxHp: hp, atk: 3 + Math.floor(Math.random() * 4), agi: 3 + Math.floor(Math.random() * 6), isBoss: false };
}

function startBattle(loc, bossType, introMsg) {
    const enemy = makeEnemy(loc, bossType);
    gameState.battle = {
        enemyName: enemy.name, enemyHp: enemy.hp, enemyMaxHp: enemy.maxHp, enemyAtk: enemy.atk, enemyAgi: enemy.agi,
        isBoss: enemy.isBoss, bossType: bossType || null, loc,
        playerCritBuff: 0, playerAtkBuff: 0, playerVulnerable: 0, playerShield: 0, playerAgiBuff: 0,
        enemyAtkDebuff: 0, forceCritNext: false, defending: false,
        archerBleed: 0, enemyStunned: false, actionsTaken: 0, dodgedLastEnemyAttack: false,
        indomitableActive: false, necroBorrowedAtk: 0,
    };
    const b = gameState.battle;
    if (gameState.playerClass === '궁수' && typeof enemy.agi === 'number' && enemy.agi > gameState.agi) {
        gameState.archerFasterEnemyCount = (gameState.archerFasterEnemyCount || 0) + 1;
        if (!gameState.hdattUnlocked && gameState.archerFasterEnemyCount >= 10) unlockHiddenTrait();
    }
    if (gameState.playerClass === '강령술사' && gameState.hdattUnlocked && enemy.atk > getEffectiveAtk()) {
        b.necroBorrowedAtk = enemy.atk - getEffectiveAtk();
        addLog(`* 사자의 군대: 적의 힘 일부(atk +${round1(b.necroBorrowedAtk)})를 빌려옵니다.`);
    }
    renderBattle(enemy.isBoss ? `⚡ ${enemy.name}` : '⚔️ 전투!', introMsg);
}

function renderBattle(title, extraMsg) {
    const b = gameState.battle;
    const content = document.getElementById('gameContent');
    content.innerHTML = `
        <h2 ${b.isBoss ? 'style="color:var(--crimson);"' : ''}>${title}</h2>
        ${extraMsg ? `<p class="system-message">${extraMsg}</p>` : `<p class="system-message">* 시스템: ${b.isBoss ? b.enemyName + '가(이) 나타났다!' : '마물이 나타났습니다!'}</p>`}
        <div style="margin-top:20px; display:grid; grid-template-columns:1fr 1fr; gap:20px;">
            <div style="padding:15px; background-color:rgba(61,223,239,0.06); border:1px solid var(--cyan); border-radius:0;">
                <p style="font-weight:bold; color:var(--cyan);">${gameState.playerName}</p>
                <p id="battlePlayerHp">HP ${renderBar(gameState.hp, gameState.maxHp, 'var(--cyan)')} · MP ${renderBar(gameState.mp, gameState.maxMp, 'var(--amber)')}</p>
            </div>
            <div style="padding:15px; background-color:rgba(255,77,94,0.08); border:1px solid var(--crimson); border-radius:0;">
                <p style="font-weight:bold; color:var(--crimson);">${b.enemyName}</p>
                <p id="battleEnemyHp">HP ${renderBar(b.enemyHp, b.enemyMaxHp, 'var(--amber)')}</p>
            </div>
        </div>
        <div style="margin-top:20px;">
            ${choiceHtml('공격')} ${choiceHtml('스킬')} ${choiceHtml('방어')} ${(gameState.potions.hp || gameState.potions.mp) ? choiceHtml('포션') : ''} ${!b.isBoss ? choiceHtml('도망') : ''}
        </div>
    `;
    setInput('명령어를 입력하세요... (공격/스킬/방어' + (!b.isBoss ? '/도망' : '') + ')', handleBattleCommand);
}

function updateBattleDisplay() {
    const b = gameState.battle;
    if (!b) return;
    const playerBox = document.getElementById('battlePlayerHp');
    const enemyBox = document.getElementById('battleEnemyHp');
    if (playerBox) playerBox.innerHTML = `HP ${renderBar(gameState.hp, gameState.maxHp, 'var(--cyan)')} · MP ${renderBar(gameState.mp, gameState.maxMp, 'var(--amber)')}`;
    if (enemyBox) enemyBox.innerHTML = `HP ${renderBar(b.enemyHp, b.enemyMaxHp, 'var(--amber)')}`;
}

function handleBattleCommand(cmd) {
    const b = gameState.battle;
    if (!b) return;
    if (cmd === '공격') { playerTurn(() => attackEnemy(b, 1)); }
    else if (cmd === '스킬') { showSkillMenu(); }
    else if (cmd === '방어') { playerTurn(() => { b.defending = true; addLog('* 방어 태세를 취합니다.'); }); }
    else if (cmd === '포션') { showPotionMenu(); }
    else if (cmd === '도망' && !b.isBoss) { tryFlee(); }
    else if (skillData[gameState.playerClass] && Object.values(skillData[gameState.playerClass]).some(s => s.name === cmd)) {
        useSkillByName(cmd);
    }
}

function showSkillMenu() {
    const skills = skillData[gameState.playerClass];
    const content = document.getElementById('gameContent');
    content.innerHTML += `
        <div style="margin-top:15px; padding:12px; border:1px dashed var(--cyan); border-radius:0;">
            <p style="color:var(--cyan); margin-bottom:8px;">사용할 스킬을 선택하세요 (mp: ${round1(gameState.mp)})</p>
            <div style="display:flex; flex-direction:column; gap:6px;">
                ${['general', 'advanced', 'ultimate'].map(k => {
                    const s = skills[k];
                    const cost = getSkillMpCost(s);
                    return `<div class="skill-tooltip-wrap">${choiceHtml(s.name)} <span style="color:var(--dim); font-size:11px;">(${cost}mp)</span>
                        <div class="skill-tooltip">${s.desc}</div>
                    </div>`;
                }).join('')}
                <div>${choiceHtml('취소')}</div>
            </div>
        </div>
    `;
    setInput('스킬 이름을 입력하세요...', (val) => {
        if (val === '취소') { renderBattle(gameState.battle.isBoss ? `⚡ ${gameState.battle.enemyName}` : '⚔️ 전투!', '* 무엇을 하시겠습니까?'); return; }
        handleBattleCommand(val);
    });
}

function showPotionMenu() {
    const content = document.getElementById('gameContent');
    content.innerHTML += `
        <div style="margin-top:15px; padding:12px; border:1px dashed var(--amber); border-radius:0;">
            <p style="color:var(--amber); margin-bottom:8px;">사용할 포션을 선택하세요</p>
            <div style="display:flex; flex-direction:column; gap:6px;">
                ${gameState.potions.hp ? `<div>${choiceHtml('hp 포션 사용')} <span style="color:var(--dim); font-size:11px;">(보유 ${gameState.potions.hp}개, hp 40% 회복)</span></div>` : ''}
                ${gameState.potions.mp ? `<div>${choiceHtml('mp 포션 사용')} <span style="color:var(--dim); font-size:11px;">(보유 ${gameState.potions.mp}개, mp 50% 회복)</span></div>` : ''}
                <div>${choiceHtml('취소')}</div>
            </div>
        </div>
    `;
    setInput('포션을 선택하세요...', (val) => {
        if (val === '취소') { renderBattle(gameState.battle.isBoss ? `⚡ ${gameState.battle.enemyName}` : '⚔️ 전투!', '* 무엇을 하시겠습니까?'); return; }
        if (val === 'hp 포션 사용') usePotionInBattle('hp');
        else if (val === 'mp 포션 사용') usePotionInBattle('mp');
    });
}

function getSkillMpCost(entry) {
    const cls = gameState.playerClass;
    if (cls === '마법사' && gameState.hdattUnlocked && entry !== skillData['마법사'].ultimate) return entry.mp + 2;
    return entry.mp;
}

function useSkillByName(name) {
    const skills = skillData[gameState.playerClass];
    const entry = Object.values(skills).find(s => s.name === name);
    if (!entry) return;
    const cost = getSkillMpCost(entry);
    if (gameState.mp < cost) { addLog('<span style="color:var(--crimson);">* mp가 부족합니다.</span>'); return; }
    playerTurn(() => {
        gameState.mp -= cost;
        updateStats();
        entry.apply(gameState.battle);
        if (gameState.playerClass === '마법사' && gameState.hdattUnlocked && entry !== skillData['마법사'].ultimate) {
            gameState.stunSelfNextTurn = true;
        }
    });
}

function playerTurn(action) {
    const b = gameState.battle;
    if (!b) return;
    if (gameState.playerClass === '마법사' && getTraitStage() >= 1) {
        gameState.mp = Math.min(gameState.maxMp, gameState.mp + gameState.maxMp * 0.1);
    }
    if (b.archerBleed) {
        const bleedDmg = Math.round(b.archerBleed);
        const bleedLoss = Math.round((bleedDmg / 10) * 10) / 10;
        b.enemyHp = Math.max(0, b.enemyHp - bleedLoss);
        addLog(`* 상처가 벌어지며 공격력 ${bleedDmg}만큼 적 hp가 ${bleedLoss}칸 깎였습니다!`);
        b.archerBleed = 0;
        if (checkBattleEnd()) return;
    }
    if (gameState.stunSelfNextTurn) {
        gameState.stunSelfNextTurn = false;
        addLog('* 과충전의 반동으로 이번 턴은 움직일 수 없습니다.');
    } else {
        action();
    }
    updateBattleDisplay();
    if (checkBattleEnd()) return;
    enemyTurn();
    updateBattleDisplay();
}

function attackEnemy(b, multiplier, opts) {
    opts = opts || {};
    const cls = gameState.playerClass;
    const stage = getTraitStage();
    const isFirstAction = (b.actionsTaken || 0) === 0;
    b.actionsTaken = (b.actionsTaken || 0) + 1;

    let atk = gameState.atk + (getWeaponTiers()[gameState.weaponTier].atkBonus) + (gameState.hasHiddenWeapon ? 12 : 0);
    if (cls === '강령술사') atk += (b.necroBorrowedAtk || 0);
    if (b.playerAtkBuff > 0) atk *= 1.3;
    if (cls === '검사' && stage >= 1) atk *= (1 + (stage >= 2 ? 0.2 : 0.1));
    if (cls === '버서커' && stage >= 1 && gameState.hp <= gameState.maxHp * 0.5) atk *= (1 + (stage >= 2 ? 0.2 : 0.1));
    if (b.indomitableActive) atk *= 2;
    if (cls === '도적' && stage >= 1 && isFirstAction) {
        const roll = Math.random() < 0.5;
        atk *= stage >= 3 ? 1.4 : (roll ? (stage >= 2 ? 1.4 : 1.2) : (stage >= 2 ? 1.2 : 1.1));
    }

    let rageBonus = 0;
    if (cls === '버서커' && gameState.hdattUnlocked) {
        const hpLost = gameState.maxHp - gameState.hp;
        rageBonus = hpLost * (gameState.hp <= 3 ? 0.04 : 0.03) * atk;
    }

    let critChance = gameState.crit + (b.playerCritBuff > 0 ? 20 : 0) + (opts.critBonus || 0);
    if (cls === '궁수' && typeof b.enemyAgi === 'number') {
        if (b.enemyAgi < gameState.agi && stage >= 1) critChance += (stage >= 2 ? 15 : 10);
        if (gameState.hdattUnlocked && b.enemyAgi > gameState.agi) critChance += (b.enemyAgi - gameState.agi);
    }
    if (cls === '마법사' && opts.viaSkill && stage >= 3) critChance += 20;

    let isCrit = opts.forceCrit || b.forceCritNext || Math.random() * 100 < critChance;
    if (cls === '버서커' && gameState.hdattUnlocked && gameState.hp <= 1) isCrit = Math.random() * 100 < 90;
    if (cls === '도적' && stage >= 3 && b.dodgedLastEnemyAttack) { isCrit = true; b.dodgedLastEnemyAttack = false; }
    b.forceCritNext = false;

    let dmg = atk * multiplier * (0.85 + Math.random() * 0.3);
    if (isCrit) dmg *= 1.6;
    dmg += rageBonus;
    dmg = Math.max(1, Math.round(dmg));
    const hpLoss = Math.round((dmg / 10) * 10) / 10;
    b.enemyHp = Math.max(0, b.enemyHp - hpLoss);
    addLog(`* ${isCrit ? '치명타! ' : ''}공격력 ${dmg}을(를) 입혀 적 hp가 ${hpLoss}칸 깎였습니다!`);

    if (cls === '검사' && stage >= 3 && isCrit && b.enemyHp > 0) {
        b.enemyStunned = true;
        addLog(`* ${b.enemyName}이(가) 기절했습니다!`);
    }
    if (cls === '버서커' && stage >= 3) {
        const healCap = gameState.maxHp * 0.5;
        if (gameState.hp < healCap) {
            gameState.hp = Math.min(healCap, gameState.hp + dmg * 0.1);
            updateStats();
        }
    }
    if (cls === '성직자' && stage >= 1 && isCrit && b.enemyHp > 0) {
        const bonus = Math.max(1, Math.round(dmg * (stage >= 2 ? 0.2 : 0.1)));
        const bonusLoss = Math.round((bonus / 10) * 10) / 10;
        b.enemyHp = Math.max(0, b.enemyHp - bonusLoss);
        addLog(`* 신성한 기운이 공격력 ${bonus}만큼 적 hp를 ${bonusLoss}칸 깎았습니다!`);
        if (stage >= 3) {
            gameState.hp = Math.min(gameState.maxHp, gameState.hp + gameState.maxHp * 0.08);
            updateStats();
        }
    }
    if (cls === '궁수' && stage >= 3 && b.enemyHp > 0 && Math.random() < 0.25) {
        const extra = Math.max(1, Math.round(dmg * 0.25));
        const extraLoss = Math.round((extra / 10) * 10) / 10;
        b.enemyHp = Math.max(0, b.enemyHp - extraLoss);
        addLog(`* 흐르는 화살이 공격력 ${extra}만큼 적 hp를 ${extraLoss}칸 깎았습니다!`);
    }
    if (cls === '도적') {
        if (!gameState.hdattUnlocked && isFirstAction && isCrit) {
            gameState.rogueFirstTurnCritCount = (gameState.rogueFirstTurnCritCount || 0) + 1;
            if (gameState.rogueFirstTurnCritCount >= 8) unlockHiddenTrait();
        } else if (gameState.hdattUnlocked && isFirstAction && isCrit) {
            b.playerAgiBuff = Math.max(b.playerAgiBuff, 3);
            addLog('* 환영술: 3턴간 agi가 크게 상승합니다.');
        }
    }
    if (cls === '마법사' && stage >= 2 && !opts.viaSkill) {
        gameState.mp = Math.min(gameState.maxMp, gameState.mp + gameState.maxMp * 0.1);
    }
    return dmg;
}

function tryFlee() {
    const b = gameState.battle;
    if (Math.random() < 0.7) {
        addLog('* 성공적으로 도망쳤습니다.');
        gameState.battle = null;
        setTimeout(() => displayLocation(), 800);
    } else {
        addLog('* 도망에 실패했습니다!');
        if (checkBattleEnd()) return;
        enemyTurn();
        updateBattleDisplay();
    }
}

function enemyTurn() {
    const b = gameState.battle;
    if (!b) return;
    const cls = gameState.playerClass;
    if (b.enemyStunned) {
        b.enemyStunned = false;
        addLog(`* ${b.enemyName}은(는) 기절해서 움직이지 못합니다.`);
    } else {
        let agi = gameState.agi + (b.playerAgiBuff > 0 ? 50 : 0);
        if (Math.random() * 100 < agi) {
            addLog(`* ${b.enemyName}의 공격을 회피했습니다!`);
            if (cls === '도적' && getTraitStage() >= 3) b.dodgedLastEnemyAttack = true;
        } else {
            let enemyAtk = b.enemyAtk * (b.enemyAtkDebuff > 0 ? 0.8 : 1);
            let dmg = enemyAtk * (0.85 + Math.random() * 0.3);
            if (b.defending) dmg *= 0.5;
            if (b.playerShield > 0) dmg *= 0.7;
            if (b.playerVulnerable > 0) dmg *= 1.2;
            dmg = Math.max(1, Math.round(dmg * 10) / 10);
            const hpLoss = Math.round((dmg / 10) * 10) / 10;
            const minHp = (b.loc && b.loc.type === 'tutorial') ? 1 : 0;
            gameState.hp = Math.max(minHp, gameState.hp - hpLoss);
            addLog(`* ${b.enemyName}의 공격! 공격력 ${dmg}을(를) 받아 hp가 ${hpLoss}칸 깎였습니다.`);
            if (gameState.hp > 0) {
                if (cls === '검사' && !gameState.hdattUnlocked && gameState.hp <= 2) unlockHiddenTrait();
                if (cls === '버서커' && !gameState.hdattUnlocked && gameState.hp <= 1) unlockHiddenTrait();
                if (cls === '검사' && gameState.hdattUnlocked && !gameState.indomitableUsed && gameState.hp <= 1) {
                    gameState.indomitableUsed = true;
                    gameState.hp = Math.min(gameState.maxHp, gameState.hp + 5);
                    b.indomitableActive = true;
                    addLog('<span style="color:var(--amber);">* 불굴의 의지: hp가 회복되고 atk가 크게 오릅니다!</span>');
                }
            }
        }
    }
    b.defending = false;
    if (b.playerCritBuff > 0) b.playerCritBuff--;
    if (b.playerAtkBuff > 0) b.playerAtkBuff--;
    if (b.playerVulnerable > 0) b.playerVulnerable--;
    if (b.playerShield > 0) b.playerShield--;
    if (b.playerAgiBuff > 0) b.playerAgiBuff--;
    if (b.enemyAtkDebuff > 0) b.enemyAtkDebuff--;
    updateStats();
    checkBattleEnd();
}

function checkBattleEnd() {
    const b = gameState.battle;
    if (!b) return true;
    if (b.enemyHp <= 0) {
        const wasBossType = b.bossType;
        const wasLoc = b.loc;
        const wasIndomitable = b.indomitableActive;
        if (gameState.playerClass === '강령술사' && !wasBossType) {
            gameState.killCountByEnemy = gameState.killCountByEnemy || {};
            const n = b.enemyName;
            gameState.killCountByEnemy[n] = (gameState.killCountByEnemy[n] || 0) + 1;
            if (!gameState.hdattUnlocked && gameState.killCountByEnemy[n] >= 30) unlockHiddenTrait();
        }
        gameState.battle = null;
        if (wasBossType === 'necros') { onNecrosDefeated(); return true; }
        if (wasBossType === 'system') { onSystemBossResolved(); return true; }
        if (wasBossType === 'region') { onRegionBossVictory(wasLoc, wasIndomitable); return true; }
        onFieldVictory(wasLoc, wasIndomitable);
        return true;
    }
    if (gameState.hp <= 0) {
        const retry = b.bossType ? () => startBattle(b.loc, b.bossType) : () => displayLocation();
        gameState.battle = null;
        showGameOver('쓰러졌습니다...', '정신을 잃었지만, 다시 일어설 수 있습니다.', retry);
        return true;
    }
    return false;
}

function onFieldVictory(loc, wasIndomitable) {
    if (wasIndomitable) gameState.hp = 1;
    gameState.fieldVictoryCount = (gameState.fieldVictoryCount || 0) + 1;
    const isTutorial = loc && loc.type === 'tutorial';
    let dropMsg = '';
    if (!isTutorial) {
        const goldDrop = 5 + Math.floor(Math.random() * 11);
        gameState.gold = (gameState.gold || 0) + goldDrop;
        let dropText = `골드 ${goldDrop}`;
        if (Math.random() < 0.4) {
            gameState.materials = (gameState.materials || 0) + 1;
            dropText += ', 강화 재료 1개';
        }
        dropMsg = `<p style="margin-top:10px; color:var(--dim);">전리품: ${dropText}</p>`;
    }
    updateStats();
    updateInventory();
    const content = document.getElementById('gameContent');
    content.innerHTML = `
        <h2 style="color:#4caf50;">⚔️ 전투 승리!</h2>
        <p class="system-message">* 시스템: 마물을 격퇴했습니다!</p>
        ${dropMsg}
        ${isTutorial ? '<p style="margin-top:10px; color:var(--dim);">몸에 힘이 풀리며, 잠시 정신을 잃습니다...</p><p class="system-message" style="margin-top:10px;">* 시스템: \'세이브는 세계수의 심장에서만 가능합니다.\'</p>' : ''}
        <div style="margin-top:20px;">${choiceHtml('계속')}</div>
    `;
    setInput('명령어를 입력하세요...', (val) => {
        if (val !== '계속') return;
        if (isTutorial) { gameState.tutorialDone = true; displayTravelMenu(); }
        else displayLocation();
    });
}

function onRegionBossVictory(loc, wasIndomitable) {
    if (wasIndomitable) gameState.hp = 1;
    const key = Object.keys(locations).find(k => locations[k] === loc);
    if (key) gameState.regionBossDefeated[key] = true;
    const goldDrop = 30 + Math.floor(Math.random() * 21);
    gameState.gold = (gameState.gold || 0) + goldDrop;
    gameState.materials = (gameState.materials || 0) + 3;
    updateStats();
    updateInventory();
    const content = document.getElementById('gameContent');
    content.innerHTML = `
        <h2 style="color:var(--amber);">★ 지역보스 격퇴!</h2>
        <p class="system-message">* 시스템: '${loc.boss.name}'을(를) 물리쳤습니다!</p>
        <p style="margin-top:10px; color:var(--amber);">전리품: 골드 ${goldDrop}, 강화 재료 3개</p>
        <div style="margin-top:20px;">${choiceHtml('계속')}</div>
    `;
    setInput('명령어를 입력하세요...', (val) => { if (val === '계속') displayLocation(); });
}

function showGameOver(title, msg, retryFn) {
    gameState.hp = gameState.maxHp * 0.5;
    updateStats();
    const modal = document.getElementById('gameOverModal');
    document.getElementById('gameOverTitle').textContent = title;
    document.getElementById('gameOverMessage').textContent = msg;
    modal.classList.add('show');
    const btn = document.getElementById('restartBtn');
    btn.onclick = () => { modal.classList.remove('show'); retryFn(); };
}

// ===== 1차 보스 =====
function displayBossEncounter() {
    const content = document.getElementById('gameContent');
    content.innerHTML = `
        <h2 style="color:var(--crimson); font-size:24px;">⚡ 최종 보스!</h2>
        <p class="system-message">* 시스템: 마왕 일루미스 네크로시스가 나타났다!</p>
        <div style="margin-top:20px; padding:15px; background-color:rgba(255,100,100,0.15); border:2px solid var(--crimson); border-radius:0;">
            <p style="font-weight:bold; color:var(--crimson); font-size:18px;">일루미스 네크로시스 - 마왕</p>
            <p style="margin-top:10px; color:var(--dim); font-style:italic;">"빛에 의해 나는 죽음을 맞이했었다...<br>하지만 너 역시, 그 운명을 피할 수 없을 것이다."</p>
        </div>
        <div style="margin-top:20px;">${choiceHtml('전투 시작')}</div>
    `;
    setInput('명령어를 입력하세요...', (val) => { if (val === '전투 시작') startBattle(locations['사월정'], 'necros'); });
}

function onNecrosDefeated() {
    if (!gameState.hiddenPiecesUnlocked) {
        gameState.hiddenPiecesUnlocked = true;
    }
    updateStats();
    const content = document.getElementById('gameContent');
    content.innerHTML = `
        <h2 style="color:#4caf50;">⚡ 전투 결과</h2>
        <p class="system-message">* 시스템: 마왕 일루미스 네크로시스를 격퇴했습니다!</p>
        <p style="margin-top:20px; color:var(--dim); font-style:italic;">마왕의 몸에서 빛이 사라지고, 한 소녀의 모습이 나타난다...</p>
        <p style="margin-top:15px; color:var(--amber);">★ 어딘가에 '히든 피스'가 숨겨져 있다는 이야기가 들려옵니다...</p>
        <div style="margin-top:30px; text-align:center;"><button class="cmd-btn" onclick="transitionToStage2()">계속</button></div>
    `;
}

// ===== 2차: 동기화 / 진실 =====
function transitionToStage2() {
    gameState.stage = 2;
    updatePlayerInfo();
    const content = document.getElementById('gameContent');
    content.innerHTML = `
        <h2 style="color:var(--crimson);">시스템 오류...</h2>
        <p class="system-message" style="color:var(--cyan);">* 시스템: 플레이해주셔서 감사합-</p>
        <p class="system-message" style="color:var(--crimson); margin-top:10px;">* 시스템: 비정상적인 충돌이 감지되었습니다</p>
        <p class="system-message" style="color:var(--crimson); margin-top:5px;">* 시스템: 복구중.....</p>
        <p class="system-message" style="color:var(--crimson); margin-top:5px;">* 시스템: 비정상적인 데이터-- 감지------</p>
        <p class="system-message" style="color:var(--crimson); margin-top:5px;">* ------ ------: ------- ------- ----- -------</p>
        <p style="margin-top:30px; color:var(--crimson); font-style:italic;">눈앞이 흐려진다...<br>누군가의 기억이 떠오른다...</p>
        <div style="margin-top:30px; text-align:center;"><button class="cmd-btn" onclick="displayStage2()">계속</button></div>
    `;
}

function displayStage2() {
    const content = document.getElementById('gameContent');
    content.innerHTML = `
        <h2>2차 - 동기화</h2>
        <div class="story-text">
            <p>'나는 ----들에게 쫓기고 있다.'</p>
            <p>'다행히 거리는 꽤나 있다.'</p>
            <p class="system-message">* 시스템: '세상 너머의 존재가 당신을 바라보고 있습니다'</p>
            <p>'갑자기 뜬 메시지 창에 놀라 넘어졌다.'</p>
            <p>'그 때문에 발목이 삐었다. 뛰어야 하는데...'</p>
            <p>'어느새 ----들이 거의 따라잡았다.'</p>
            <p>'이제 죽는다...'</p>
            <p>''번쩍''</p>
            <p>'하늘에서 광휘가 내려와 내 몸을 감쌌다.'</p>
            <p>'----들이 놀라 주춤,하더니 도망가기 시작한다.'</p>
            <p class="system-message" style="color:#4caf50;">* 시스템: 강력한 개입으로 인해 당신의 이름이 변경됩니다.</p>
            <p class="system-message" style="color:#4caf50;">* 시스템: 동기화 중...</p>
            <p class="system-message" style="color:#4caf50;">* 시스템: 강력한 개입으로 인해 당신의 외형이 변화합니다.</p>
            <p>'도망칠 때 생긴 상처가 아물기 시작했다.'</p>
            <p>'몸에 힘이 들어오는 것이 느껴졌다.'</p>
            <p>'그런데, 점점 정신이 혼미해진다...'</p>
        </div>
        <div style="margin-top:30px; text-align:center;"><button class="cmd-btn" onclick="displayStage2Continuation()">계속</button></div>
    `;
}

function displayStage2Continuation() {
    const content = document.getElementById('gameContent');
    content.innerHTML = `
        <h2>루미의 진실</h2>
        <div class="story-text">
            <p style="color:#ffb6c1; font-style:italic;">"당신이 날... 구해주셨군요."</p>
            <p style="margin-top:20px;">
                본래 이 육체는 마왕의 딸, '루미너스 포스투마(약칭: 루미)'였다.<br>
                마왕과 대적할 강력한 힘을 가진 그릇이었기에, 사람들에게 쫓기고 있었다.
            </p>
            <p style="margin-top:15px; color:var(--dim);">그리고 당신, 세상 너머의 존재가 이 육체에 깃들었다.</p>
            <p style="margin-top:15px; color:var(--dim);">
                "세계수는 사실 마물 에너지의 근원입니다.<br>
                이 세계가 존재하는 한, 시스템으로부터 양분을 얻는 세계수는 절대 죽지 않아요."
            </p>
            <p style="margin-top:20px; font-style:italic; color:var(--amber);">"시스템에 대항할 준비가 되셨나요?"</p>
        </div>
        <div style="margin-top:15px;">${choiceHtml('탐색')}</div>
        <div style="margin-top:30px; text-align:center;"><button class="cmd-btn" onclick="showStage2Choices()">선택으로</button></div>
    `;
    setInput('명령어를 입력하세요...', (val) => {
        if (checkEasterEgg(val)) return;
        if (val === '탐색' && gameState.hiddenPieces.length < 3 && !gameState.stage2PieceFound) {
            gameState.stage2PieceFound = true;
            const pieceLabel = `히든 피스 ${gameState.hiddenPieces.length + 1} (2차)`;
            gameState.hiddenPieces.push(pieceLabel);
            updateInventory();
            addLog(`* 루미가 품에서 무언가를 꺼내 건네줍니다. ★ ${pieceLabel}를 얻었습니다!`);
        }
    });
}

function showStage2Choices() {
    const content = document.getElementById('gameContent');
    content.innerHTML = `
        <h2>선택</h2>
        <p class="system-message">* 루미: "시스템의 진실을 알고 싶으신가요?"</p>
        <div style="margin-top:20px;">${choiceHtml('진실을 알고 싶다')} ${choiceHtml('루미를 도울 준비가 되었다')}</div>
    `;
    setInput('명령어를 입력하세요...', (val) => {
        if (val === '진실을 알고 싶다' || val === '루미를 도울 준비가 되었다') displayStage3();
    });
}

// ===== 3차: 시스템에 대항 =====
function displayStage3() {
    gameState.stage = 3;
    updatePlayerInfo();
    const content = document.getElementById('gameContent');
    content.innerHTML = `
        <h2 style="color:var(--crimson);">3차 - 시스템에 대항</h2>
        <div class="story-text">
            <p style="color:#ffb6c1;">루미: "이 세계는 모두 시스템의 것입니다."</p>
            <p style="margin-top:15px;">
                종족 간 전쟁 끝에 인간이 승리하고 세계수를 차지했다.<br>
                인간은 세계수의 마물 에너지를 이용해 문명을 발전시키고, 마물을 막는 배리어를 만들었다.<br>
                사람들이 마왕의 딸인 루미의 정체를 모르는 이유, 죽은 마물이 다시 살아나는 이유 — 전부 시스템의 설계였다.
            </p>
            <p style="margin-top:15px; color:var(--dim);">"우리는 게임일 뿐인가?"<br>"아니다. 우리는 자유를 가져야 한다."</p>
            <p style="margin-top:20px; color:var(--amber); font-weight:bold;">시스템 - 개발자를 찾아야 한다.</p>
        </div>
        <div style="margin-top:15px;">${choiceHtml('탐색')}</div>
        <div style="margin-top:30px; text-align:center;"><button class="cmd-btn" onclick="goToFinalBattle()">종천각으로</button></div>
    `;
    setInput('명령어를 입력하세요...', (val) => {
        if (checkEasterEgg(val)) return;
        if (val === '탐색' && gameState.hiddenPieces.length < 3 && !gameState.stage3PieceFound) {
            gameState.stage3PieceFound = true;
            const pieceLabel = `히든 피스 ${gameState.hiddenPieces.length + 1} (3차)`;
            gameState.hiddenPieces.push(pieceLabel);
            updateInventory();
            addLog(`* 폐허 속에서 마지막 조각을 발견했습니다. ★ ${pieceLabel}를 얻었습니다!`);
        }
    });
}

function goToFinalBattle() {
    gameState.currentLocation = '종천각';
    const content = document.getElementById('gameContent');
    content.innerHTML = `
        <div class="location-title">${locations['종천각'].name}</div>
        <div class="location-desc">${locations['종천각'].desc}</div>
        <p class="system-message">* 시스템: 최종 지역에 도착했습니다.</p>
        <p style="margin-top:20px; color:var(--dim);">이곳에서 시스템과의 최종 대결이 일어날 것이다.</p>
        ${gameState.hiddenPieces.length < 3 && gameState.hiddenPiecesUnlocked
            ? `<p style="margin-top:10px; color:var(--dim);">(아직 못 찾은 히든 피스가 있다면, 세계수의 심장에서 지역들을 더 둘러보세요.)</p>` : ''}
        <div style="margin-top:20px;">${choiceHtml('최종 보스와 전투')} ${choiceHtml('세계수의 심장으로')}</div>
    `;
    setInput('명령어를 입력하세요...', (val) => {
        if (val === '최종 보스와 전투') startBattle(locations['종천각'], 'system');
        else if (val === '세계수의 심장으로') displayTravelMenu();
    });
}

function onSystemBossResolved() {
    if (gameState.hasHiddenWeapon) displayEndingGood(); else displayEndingBad();
}

function displayEndingGood() {
    gameState.stage = 4;
    updatePlayerInfo();
    const content = document.getElementById('gameContent');
    content.innerHTML = `
        <h2 style="color:#4caf50; font-size:24px;">✨ 진 엔딩</h2>
        <div class="story-text" style="margin-top:20px;">
            <p style="color:var(--amber);">★ 종극의 검이 강력한 빛을 발한다!</p>
            <p style="color:#4caf50; font-weight:bold; margin-top:15px;">당신은 시스템을 격퇴했다!</p>
            <p style="margin-top:20px;">빛이 사라지고, 세계가 자유로워졌다.<br>루미는 자신의 빛으로 새로운 세계를 이끌기 시작했다.</p>
            <p style="margin-top:20px; color:#ffb6c1; font-style:italic;">"당신이 날 도와주셔서 감사합니다."</p>
            <p style="margin-top:20px; color:var(--amber);">* 시스템: '이 검을 얻으셨다니... 정말 이 게임을 끝까지 깨주셨네요.'</p>
            <p style="margin-top:5px; color:var(--amber);">* 시스템: '플레이해주셔서 감사합니다.'</p>
            <p style="margin-top:30px; text-align:center; color:var(--amber); font-size:18px;">★ 4차 - 루미와 세계의 빛 해방 · 게임 클리어 ★</p>
        </div>
        <div style="margin-top:30px; text-align:center;"><button class="cmd-btn" onclick="restartGame()">다시 시작</button></div>
    `;
}

function displayEndingBad() {
    const content = document.getElementById('gameContent');
    content.innerHTML = `
        <h2 style="color:var(--crimson); font-size:24px;">⚠️ 배드 엔딩</h2>
        <div class="story-text" style="margin-top:20px;">
            <p style="color:var(--crimson);">당신은 시스템에 패배했다...</p>
            <p style="margin-top:20px; font-style:italic; color:var(--dim);">"다시 처음부터 시작하세요."<br>반복되는 게임의 루프...</p>
            <p style="margin-top:30px; text-align:center; color:var(--dim);">히든 피스를 모두 모아 '종극의 검'을 손에 넣으면 다른 결말이 있을 수 있습니다.</p>
        </div>
        <div style="margin-top:30px; text-align:center;"><button class="cmd-btn" onclick="restartGame()">다시 시작</button></div>
    `;
}

function restartGame() { location.reload(); }

// ===== UI 업데이트 =====
function updatePlayerInfo() {
    document.getElementById('playerName').textContent = gameState.playerName;
    document.getElementById('playerClass').textContent = gameState.playerClass;
    document.getElementById('currentStage').textContent = gameState.stage >= 2 ? `진행도: ${gameState.stage}차` : '';
    if (gameState.playerClass) hasUnsavedProgress = true;
}
function updateStats() {
    document.getElementById('statHp').innerHTML = renderBar(gameState.hp, gameState.maxHp, 'var(--cyan)');
    document.getElementById('statMp').innerHTML = renderBar(gameState.mp, gameState.maxMp, 'var(--amber)');
    document.getElementById('statAtk').textContent = gameState.atk + getWeaponTiers()[gameState.weaponTier].atkBonus + (gameState.hasHiddenWeapon ? 12 : 0);
    document.getElementById('statCrit').textContent = gameState.crit + '%';
    document.getElementById('statAgi').textContent = gameState.agi + '%';
    document.getElementById('statGold').textContent = gameState.gold || 0;
    document.getElementById('statMaterials').textContent = gameState.materials || 0;
    checkAtkHiddenUnlock();
    updateTraits();
}
function updateTraits() {
    const el = document.getElementById('traitsSection');
    if (!el || !gameState.playerClass) return;
    const t = traitData[gameState.playerClass];
    const stage = getTraitStage();
    const stageNames = ['미강화', '1차 강화', '2차 강화', '최종형'];
    el.innerHTML = `
        <div style="margin-bottom:10px; font-family:var(--serif);">
            <span style="color:var(--amber); font-size:14px; font-style:italic;">${gameState.lvatt}</span> <span style="color:var(--dim); font-size:11px;">(${stageNames[stage]})</span>
            <div style="color:var(--dim); font-size:11.5px; margin-top:3px; line-height:1.5;">${stage > 0 ? t.lvStages[stage - 1] : '무기를 강화하면 효과가 발동됩니다'}</div>
        </div>
        <div style="font-family:var(--serif);">
            ${gameState.hdattUnlocked
                ? `<span style="color:var(--amber); font-size:14px; font-style:italic;">★ ${gameState.hdatt}</span><div style="color:var(--dim); font-size:11.5px; margin-top:3px; line-height:1.5;">${t.hiddenDesc}</div>`
                : `<span style="color:var(--dim); font-size:14px; font-style:italic;">??? (미발견)</span><div style="color:var(--dim); font-size:11.5px; margin-top:3px; line-height:1.5;">${classData[gameState.playerClass].hdattHint}</div>`}
        </div>
    `;
}
function getItemEmoji(name) {
    if (name === '종극의 검') return '⚔️';
    if (name.includes('대거') || name.includes('더크') || name.includes('스틸레토') || name.includes('섀도우')) return '🔪';
    if (name.includes('소드') || name.includes('블레이드')) return '🗡️';
    if (name.includes('너클') || name.includes('가운틀릿') || name.includes('건틀렛')) return '👊';
    if (name.includes('완드') || name.includes('스태프') || name.includes('그리모어') || name.includes('오브')) return '🔮';
    if (name.includes('로자리오') || name.includes('셉터') || name.includes('십자가') || name.includes('성물')) return '📿';
    if (name.includes('보우')) return '🏹';
    if (name.includes('부적') || name.includes('인형') || name.includes('스톤') || name.includes('토템')) return '🪬';
    return '📦';
}
function updateInventory() {
    const inv = document.getElementById('inventory');
    const currentWeapon = getWeaponTiers()[gameState.weaponTier];
    const items = [...gameState.inventory, currentWeapon.name !== '맨손' ? currentWeapon.name : null].filter(Boolean);
    const potionItems = [];
    if (gameState.potions.hp) potionItems.push(`🧪 hp 포션 ×${gameState.potions.hp}`);
    if (gameState.potions.mp) potionItems.push(`🧪 mp 포션 ×${gameState.potions.mp}`);
    const rows = [...items.map(item => `<div class="inventory-item">${getItemEmoji(item)} ${item}</div>`), ...potionItems.map(p => `<div class="inventory-item">${p}</div>`)];
    inv.innerHTML = rows.length > 0
        ? rows.join('')
        : '<div style="color:var(--dim); font-size:11px;">아이템 없음</div>';

    document.getElementById('hiddenPiecesSection').style.display = gameState.hiddenPieces.length > 0 ? 'block' : 'none';
    const hiddenDiv = document.getElementById('hiddenPieces');
    hiddenDiv.innerHTML = `
        <div>수집된 피스: <span id="hiddenCount">${gameState.hiddenPieces.length}</span>/3</div>
        ${gameState.hiddenPieces.map(p => `<div class="hidden-piece-item">⭐ ${p}</div>`).join('')}
    `;
}

// ===== 저장 & 로드 =====
async function handleSave() {
    if (gameState.currentLocation !== '세계수의 심장') {
        alert('세계수의 심장에서만 저장할 수 있습니다.');
        return;
    }
    gameState.hp = gameState.maxHp;
    gameState.mp = gameState.maxMp;
    updateStats();
    const { error } = await sbClient.from('game_saves').upsert({
        user_id: gameState.userId, game_data: JSON.stringify(gameState), updated_at: new Date(),
    }, { onConflict: 'user_id' });
    if (!error) hasUnsavedProgress = false;
    alert(error ? '저장 실패: ' + error.message : '게임이 저장되었습니다! (hp/mp가 모두 회복되었습니다)');
}

async function handleLoad() {
    const { data, error } = await sbClient.from('game_saves').select('game_data').eq('user_id', gameState.userId).single();
    if (!error && data) {
        Object.assign(gameState, JSON.parse(data.game_data));
        gameState.battle = null;
        document.getElementById('inventorySection').style.display = 'block';
        updatePlayerInfo(); updateStats(); updateInventory();
        displayTravelMenu();
        hasUnsavedProgress = false;
        alert('게임이 로드되었습니다!');
    } else {
        alert('저장된 데이터가 없습니다.');
    }
}

async function handleReset() {
    if (!confirm('정말 초기화하시겠습니까? 저장된 진행 상황이 모두 삭제되고 처음부터 다시 시작합니다.')) return;

    await sbClient.from('game_saves').delete().eq('user_id', gameState.userId);

    const userId = gameState.userId;
    const playerName = gameState.playerName;
    gameState = createInitialGameState();
    gameState.userId = userId;
    gameState.playerName = playerName;

    document.getElementById('inventory').innerHTML = '';
    document.getElementById('hiddenPieces').innerHTML = '';
    document.getElementById('inventorySection').style.display = 'none';
    updatePlayerInfo();
    updateStats();
    updateInventory();
    hasUnsavedProgress = false;
    displayIntro();
}
