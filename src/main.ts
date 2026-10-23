import './style.css';
import { currentIntent, IMP_MAX_HP, PLAYER_MAX_HP } from './game/battle';
import { countLength } from './game/parse';
import { cast, endingMessage, newRun, type RunState } from './game/run';
import { addRun, emptySave, loadSave, writeSave, type SaveData } from './game/save';
import { ELEMENT_INFO, wordById, wordColor } from './game/words';

const app = document.getElementById('app')!;
let save: SaveData = loadSave();
let run: RunState | null = null;
let selectedObject: string | null = null;
let pendingWarning: { input: string; message: string } | null = null;
let errorText = '';

// スマホのキーボードが出ても入力欄が隠れないよう、見えている高さに合わせる
function fitViewport() {
  const h = window.visualViewport?.height ?? window.innerHeight;
  document.documentElement.style.setProperty('--app-height', `${h}px`);
}
window.visualViewport?.addEventListener('resize', fitViewport);
window.addEventListener('resize', fitViewport);
fitViewport();

function esc(text: string): string {
  return text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

// ---- タイトル ----

function showTitle() {
  run = null;
  const wins = save.runs.filter((r) => r.result === 'win').length;
  app.innerHTML = `
    <div class="page">
      <h1>呪文ローグライク</h1>
      <p class="tagline">言葉と旅するローグライト（試作）</p>
      <section>
        <h2>遊び方</h2>
        <ul>
          <li>呪文は自由に入力する。辞書にある言葉だけが力を持つ。</li>
          <li>ひらがなはつなぎの言葉として読み飛ばされるが、文字数には数える。</li>
          <li>例：「岩に雷槍」「小川に氷」「土壁」</li>
          <li>場面のもの（岩・女の子・枯れ木・小川）はタップで調べられる。</li>
        </ul>
      </section>
      <section>
        <h2>これまでの旅</h2>
        <p>${save.runs.length}回旅立ち、${wins}回新しい旅へ。見つけた反応：${save.discoveries.length}個</p>
      </section>
      <button class="primary" id="start">旅に出る</button>
      <button id="reset">記録を消す</button>
    </div>`;
  document.getElementById('start')!.onclick = startRun;
  // confirm() が使えない環境があるので、2回押しで確定する
  const reset = document.getElementById('reset') as HTMLButtonElement;
  reset.onclick = () => {
    if (reset.dataset.armed !== 'yes') {
      reset.dataset.armed = 'yes';
      reset.textContent = 'もう一度押すと記録を消します';
      return;
    }
    save = emptySave();
    writeSave(save);
    showTitle();
  };
}

// ---- ゲーム画面 ----

function startRun() {
  run = newRun();
  selectedObject = null;
  pendingWarning = null;
  errorText = '';
  app.innerHTML = `
    <div class="hud" id="hud"></div>
    <div class="objects" id="objects"></div>
    <div id="info"></div>
    <div id="intent"></div>
    <div class="log" id="log"></div>
    <div class="error" id="error"></div>
    <div class="cards" id="cards"></div>
    <form class="input-row" id="form">
      <input id="spell" autocomplete="off" autocapitalize="off" enterkeyhint="send" placeholder="呪文を唱える" />
      <span class="counter" id="counter"></span>
      <button class="primary" id="cast">詠唱</button>
    </form>
    <div id="modal"></div>`;
  const input = document.getElementById('spell') as HTMLInputElement;
  input.addEventListener('input', renderCounter);
  document.getElementById('form')!.addEventListener('submit', (e) => {
    e.preventDefault();
    doCast(input.value);
  });
  renderGame();
}

function doCast(text: string) {
  if (!run) return;
  const result = cast(run, text);
  errorText = result.error ?? '';
  run = result.run;
  if (result.warning) {
    pendingWarning = { input: text, message: result.warning };
    renderGame();
    return;
  }
  if (!result.error) {
    (document.getElementById('spell') as HTMLInputElement).value = '';
    renderGame();
    glowCards(result.spell?.usedWordIds ?? []);
  } else {
    renderError();
  }
  if (run.phase === 'record') {
    save = addRun(save, {
      date: new Date().toISOString(),
      result: run.battle?.result === 'win' ? 'win' : 'lose',
      spells: run.spells,
      gainedWords: run.gainedWords,
      discoveries: run.discoveries,
    });
    writeSave(save);
    // 最後の演出を見せてから記録画面へ
    const finished = run;
    setTimeout(() => showRecord(finished), 2200);
  }
}

function renderGame() {
  if (!run) return;
  renderHud();
  renderObjects();
  renderInfo();
  renderIntent();
  renderLog();
  renderCards();
  renderCounter();
  renderError();
  renderModal();
}

function renderHud() {
  const r = run!;
  const hud = document.getElementById('hud')!;
  const scene = r.phase === 'sceneA' ? '崖下の小道' : 'いたずら小鬼';
  const b = r.battle;
  const hp = r.phase !== 'sceneA' && b
    ? `<span class="hp">あなた ${Math.max(0, b.playerHp)}/${PLAYER_MAX_HP}</span><span class="hp">小鬼 ${Math.max(0, b.impHp)}/${IMP_MAX_HP}</span>`
    : '<span>詠唱は1回だけ</span>';
  hud.innerHTML = `<span class="scene-name">${scene}</span>${hp}<span>上限 ${r.charLimit}文字</span>`;
}

interface SceneObject { id: string; label: string; keyword: string; desc: string; color: string }

function sceneObjects(): SceneObject[] {
  const r = run!;
  const b = r.battle;
  const inBattle = r.phase !== 'sceneA';
  const list: SceneObject[] = [
    inBattle
      ? { id: 'rock', label: '🪨 転がった岩', keyword: '岩', desc: '地面に転がっている。', color: '#c9b9a0' }
      : { id: 'rock', label: '🪨 落ちてくる岩', keyword: '岩', desc: '女の子の真上に落ちてくる！', color: '#c9b9a0' },
    { id: 'girl', label: `👧 女の子${girlLabel()}`, keyword: '女の子', desc: '近くの村の子どもらしい。', color: '#f3c6c6' },
    b?.treeBurned
      ? { id: 'tree', label: '🔥 燃えた枯れ木', keyword: '枯れ木', desc: 'もくもくと煙を上げている。', color: '#f0b08a' }
      : { id: 'tree', label: '🌳 枯れ木', keyword: '枯れ木', desc: 'からからに乾いている。', color: '#cfe0b8' },
    b?.streamFrozen || r.sceneA?.streamFrozen
      ? { id: 'stream', label: '🧊 凍った小川', keyword: '小川', desc: 'つるつるに凍っている。', color: '#cdeaf5' }
      : { id: 'stream', label: '🏞️ 小川', keyword: '小川', desc: '浅い小川が流れている。', color: '#bfe0f0' },
  ];
  if (inBattle) list.push({ id: 'imp', label: '👺 小鬼', keyword: '小鬼', desc: '岩を落とした犯人。', color: '#d9c2e8' });
  return list;
}

function girlLabel(): string {
  const girl = run!.battle?.girl;
  if (!girl) return '';
  return ({ grateful: '（加勢）', powered: '（強化）', overcharged: '（暴走）', walled: '（壁の陰）', escaped: '（避難）', dazed: '（たんこぶ）', angry: '（帰った）', hurt: '（負傷）' } as const)[girl];
}

function renderObjects() {
  const el = document.getElementById('objects')!;
  el.innerHTML = sceneObjects()
    .map((o) => `<button class="object" data-id="${o.id}" style="background:${o.color};color:var(--object-ink);border-color:${o.color}">${esc(o.label)}</button>`)
    .join('');
  el.querySelectorAll<HTMLButtonElement>('.object').forEach((btn) => {
    btn.onclick = () => {
      selectedObject = selectedObject === btn.dataset.id ? null : btn.dataset.id!;
      renderInfo();
    };
  });
}

function renderInfo() {
  const el = document.getElementById('info')!;
  const obj = sceneObjects().find((o) => o.id === selectedObject);
  if (!obj) {
    el.innerHTML = '';
    return;
  }
  // これまでの旅で見つけた反応を表示する
  const known = save.discoveries.concat(run!.discoveries).filter((d, i, a) => a.indexOf(d) === i && d.includes(obj.keyword));
  el.innerHTML = `<div class="info"><b>${esc(obj.label)}</b>：${esc(obj.desc)}${
    known.length ? `<ul>${known.map((k) => `<li>${esc(k)}</li>`).join('')}</ul>` : '<br>まだ何も試していない。'
  }</div>`;
}

function renderIntent() {
  const el = document.getElementById('intent')!;
  const b = run!.battle;
  if (run!.phase !== 'battle' || !b) {
    el.innerHTML = '';
    return;
  }
  const intent = currentIntent(b);
  const info = ELEMENT_INFO[intent.element];
  el.innerHTML = `<div class="intent" style="border-color:${info.color}">
    次の行動：<b style="color:${info.color}">${info.label}</b> <b>${esc(intent.name)}</b>（${intent.power}）<br>
    <small>小鬼は${esc(intent.description)}。${info.label}の色をまとっている。</small></div>`;
}

function renderLog() {
  const el = document.getElementById('log')!;
  el.innerHTML = run!.log
    .map((line) => {
      if (line.startsWith('▶ ')) return `<p class="cast">${esc(line)}</p>`;
      if (line === '──') return '<p class="sep">──</p>';
      return `<p>${esc(line)}</p>`;
    })
    .join('');
  el.scrollTop = el.scrollHeight;
}

function renderCards() {
  const el = document.getElementById('cards')!;
  el.innerHTML = run!.owned
    .map((id) => {
      const w = wordById(id);
      return `<div class="card ${w.kind === 'black' ? 'black' : ''}" data-id="${id}" style="--card-color:${wordColor(w)}">${esc(w.text)}</div>`;
    })
    .join('');
}

function glowCards(ids: string[]) {
  // 使われた順にカードを光らせる
  ids.forEach((id, i) => {
    const card = document.querySelector<HTMLElement>(`.card[data-id="${id}"]`);
    if (!card) return;
    setTimeout(() => {
      card.classList.remove('glow');
      void card.offsetWidth;
      card.classList.add('glow');
    }, i * 250);
  });
}

function renderCounter() {
  if (!run) return;
  const input = document.getElementById('spell') as HTMLInputElement | null;
  const counter = document.getElementById('counter');
  const button = document.getElementById('cast') as HTMLButtonElement | null;
  if (!input || !counter || !button) return;
  const n = countLength(input.value);
  counter.textContent = `${n}/${run.charLimit}`;
  counter.classList.toggle('over', n > run.charLimit);
  const playable = run.phase === 'sceneA' || run.phase === 'battle';
  button.disabled = !playable || n === 0 || n > run.charLimit;
  input.disabled = !playable;
}

function renderError() {
  document.getElementById('error')!.textContent = errorText;
}

function renderModal() {
  const el = document.getElementById('modal')!;
  if (!pendingWarning) {
    el.innerHTML = '';
    return;
  }
  el.innerHTML = `<div class="modal-back"><div class="modal">
    <div>${esc(pendingWarning.message)}</div>
    <div class="buttons"><button id="cancel">やめる</button><button class="primary" id="confirm">唱える</button></div>
  </div></div>`;
  document.getElementById('cancel')!.onclick = () => {
    pendingWarning = null;
    renderModal();
  };
  document.getElementById('confirm')!.onclick = () => {
    const text = pendingWarning!.input;
    pendingWarning = null;
    renderModal();
    doCast(text);
  };
}

// ---- 旅の記録 ----

function showRecord(finished: RunState) {
  const gained = finished.gainedWords.map((id) => wordById(id).text);
  app.innerHTML = `
    <div class="page">
      <p class="ending">${esc(endingMessage(finished))}</p>
      <section>
        <h2>今回見つけた言葉</h2>
        ${gained.length ? `<ul>${gained.map((g) => `<li>${esc(g)}</li>`).join('')}</ul>` : '<p>なし</p>'}
      </section>
      <section>
        <h2>今回使った魔法</h2>
        <ul>${finished.spells.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
      </section>
      <section>
        <h2>新しい発見</h2>
        ${finished.discoveries.length ? `<ul>${finished.discoveries.map((d) => `<li>${esc(d)}</li>`).join('')}</ul>` : '<p>なし</p>'}
        <p><small>これまでに見つけた反応：${save.discoveries.length}個</small></p>
      </section>
      <button class="primary" id="again">もう一度旅に出る</button>
      <button id="title">タイトルへ</button>
    </div>`;
  document.getElementById('again')!.onclick = startRun;
  document.getElementById('title')!.onclick = showTitle;
}

showTitle();
