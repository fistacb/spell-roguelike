import './style.css';
import { countLength } from './game/parse';
import { cast, currentScene, endingMessage, MAX_HEARTS, newRun, regionName, type RunState } from './game/run';
import { STAGE_COUNT } from './game/scenes';
import type { SceneObject } from './game/scene';
import { addRun, clearJourney, emptySave, loadJourney, loadSave, writeJourney, writeSave, type SaveData } from './game/save';
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
  const saved = loadJourney<RunState>();
  app.innerHTML = `
    <div class="page">
      <h1>呪文ローグライク</h1>
      <p class="tagline">言葉と旅するローグライト（試作）</p>
      <section>
        <h2>遊び方</h2>
        <ul>
          <li>呪文は自由に入力する。辞書にある言葉だけが力を持つ。</li>
          <li>ひらがなはつなぎの言葉として読み飛ばされるが、文字数には数える。</li>
          <li>どの場面も詠唱は1回だけ。結果で旅の続きが変わる。</li>
          <li>例：「岩に雷槍」「小川に氷」「土壁」「あいつに炎雨」</li>
          <li>場面にあるものはタップで調べられる。見つけた反応も確認できる。</li>
          <li>旅は3つのステージ。ステージの終わりの宿で記録され、分かれ道で次の道を選ぶ。</li>
          <li>ハートがなくなると、旅はそこでおしまい。</li>
        </ul>
      </section>
      <section>
        <h2>これまでの旅</h2>
        <p>${save.runs.length}回旅立ち、${wins}回新しい旅へ。見つけた反応：${save.discoveries.length}個</p>
      </section>
      ${saved ? `<button class="primary" id="continue">旅の続き（ステージ${saved.stage + 1}の終わりの宿から）</button>` : ''}
      <button class="${saved ? '' : 'primary'}" id="start">${saved ? '新しく旅に出る' : '旅に出る'}</button>
      <button id="reset">記録を消す</button>
    </div>`;
  document.getElementById('start')!.onclick = startRun;
  if (saved) document.getElementById('continue')!.onclick = () => mountGame(saved);
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
  clearJourney();
  mountGame(newRun());
}

function mountGame(state: RunState) {
  run = state;
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
  const before = run.phase;
  const result = cast(run, text);
  errorText = result.error ?? '';
  run = result.run;
  if (result.warning) {
    pendingWarning = { input: text, message: result.warning };
    renderGame();
    return;
  }
  if (result.error) {
    renderError();
    return;
  }
  (document.getElementById('spell') as HTMLInputElement).value = '';
  selectedObject = null;
  renderGame();
  glowCards(result.spell?.usedWordIds ?? []);
  // 宿に着いたら、途中の旅を記録する
  if (run.phase === 'fork' && before === 'scene') writeJourney(run);
  if (run.phase === 'record') {
    clearJourney();
    save = addRun(save, {
      date: new Date().toISOString(),
      result: run.result === 'complete' ? 'win' : 'lose',
      spells: run.records.map((r) => r.spell),
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

function hearts(n: number): string {
  return '♥'.repeat(n) + '♡'.repeat(Math.max(0, MAX_HEARTS - n));
}

function renderHud() {
  const r = run!;
  const scene = currentScene(r);
  document.getElementById('hud')!.innerHTML = `
    <span class="scene-name">${esc(scene.title)}</span>
    <span class="hearts" aria-label="ハート${r.hearts}つ">${hearts(r.hearts)}</span>
    <span>ステージ${r.stage + 1}/${STAGE_COUNT} ${esc(regionName(r))}${r.phase === 'fork' ? '' : ` ${Math.min(r.index + 1, r.sceneIds.length)}/${r.sceneIds.length}`}</span>
    <span>上限 ${r.charLimit}文字</span>`;
}

function sceneObjects(): SceneObject[] {
  return currentScene(run!).objects(run!.flags);
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
  const intent = run!.phase === 'scene' ? run!.intent : null;
  if (!intent) {
    el.innerHTML = '';
    return;
  }
  const info = ELEMENT_INFO[intent.element];
  const scene = currentScene(run!);
  const who = scene.kind === 'battle' ? '次の行動' : '起こすと';
  el.innerHTML = `<div class="intent" style="border-color:${info.color}">
    ${who}：<b style="color:${info.color}">${info.label}</b> <b>${esc(intent.name)}</b>（${'♥'.repeat(intent.hearts)}）<br>
    <small>${esc(intent.description)}。${info.label}の色をまとっている。詠唱は1回だけ。</small></div>`;
}

function renderLog() {
  const el = document.getElementById('log')!;
  el.innerHTML = run!.log
    .map((line) => {
      if (line.startsWith('▶ ')) return `<p class="cast">${esc(line)}</p>`;
      if (line.startsWith('◆ ')) return `<p class="scene">${esc(line.slice(2))}</p>`;
      if (line.startsWith('■ ')) return `<p class="stage">${esc(line.slice(2))}</p>`;
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
  const playable = run.phase !== 'record';
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
      <p class="hearts big">${hearts(finished.hearts)}</p>
      <section>
        <h2>旅の道のり</h2>
        <ol>${finished.records.map((r) => `<li><b>${esc(r.title)}</b>「${esc(r.spell)}」<br>${esc(r.summary)}</li>`).join('')}</ol>
      </section>
      <section>
        <h2>今回見つけた言葉</h2>
        ${gained.length ? `<ul>${gained.map((g) => `<li>${esc(g)}</li>`).join('')}</ul>` : '<p>なし</p>'}
        ${finished.taboos.length ? `<ul class="taboo">${finished.taboos.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
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
