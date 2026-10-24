import './style.css';
import { countLength } from './game/parse';
import { cast, currentScene, endingMessage, forget, MAX_HEARTS, maxHearts, newRun, regionName, TABOO_LIMIT, type RunState } from './game/run';
import { STAGE_COUNT } from './game/scenes';
import type { SceneObject } from './game/scene';
import { addRun, clearJourney, emptySave, loadJourney, loadSave, writeJourney, writeSave, type SaveData } from './game/save';
import { countsToHand, ELEMENT_INFO, HAND_LIMIT, wordById, wordColor, wordHint } from './game/words';

const app = document.getElementById('app')!;
let save: SaveData = loadSave();
let run: RunState | null = null;
let selectedObject: string | null = null;
let selectedCard: string | null = null;
let pendingWarning: { input: string; message: string } | null = null;
let showTaboos = false;
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
          <li>言葉のカードをタップすると、その言葉の手触りがわかる。言葉どうしを混ぜると、新しい言葉が生まれることも。</li>
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
    <div class="bubble" id="bubble" role="tooltip" hidden></div>
    <div id="modal"></div>`;
  const input = document.getElementById('spell') as HTMLInputElement;
  input.addEventListener('input', renderCounter);
  document.getElementById('form')!.addEventListener('submit', (e) => {
    e.preventDefault();
    doCast(input.value);
  });
  // 吹き出しの外をタップするか、カードの列を動かしたら吹き出しを閉じる
  document.getElementById('cards')!.addEventListener('scroll', closeBubble);
  app.addEventListener('click', (e) => {
    if (!(e.target as HTMLElement).closest('.card')) closeBubble();
  });
  renderGame();
}

function closeBubble() {
  if (!selectedCard) return;
  selectedCard = null;
  renderBubble();
}

function doCast(text: string) {
  if (!run) return;
  selectedCard = null;
  const before = run.phase;
  const taboosBefore = run.taboos.length;
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
  // 禁忌がついたら、その場で知らせる
  if (run.phase !== 'record' && run.taboos.length > taboosBefore) showTaboos = true;
  renderGame();
  glowCards(result.effective ?? []);
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

// 禁忌で失った上限の分は ✕ で表す
function hearts(n: number, max = MAX_HEARTS): string {
  return '♥'.repeat(n) + '♡'.repeat(Math.max(0, max - n)) + '✕'.repeat(Math.max(0, MAX_HEARTS - max));
}

function renderHud() {
  const r = run!;
  const scene = currentScene(r);
  document.getElementById('hud')!.innerHTML = `
    <span class="scene-name">${esc(scene.title)}</span>
    <span class="hearts" aria-label="ハート${r.hearts}つ">${hearts(r.hearts, maxHearts(r.taboos))}</span>
    ${r.taboos.length ? `<button type="button" class="taboo-mark" id="taboo-mark">禁忌 ${r.taboos.length}/${TABOO_LIMIT}</button>` : ''}
    <span>ステージ${r.stage + 1}/${STAGE_COUNT} ${esc(regionName(r))}${r.phase === 'fork' ? '' : ` ${Math.min(r.index + 1, r.sceneIds.length)}/${r.sceneIds.length}`}</span>
    <span>上限 ${r.charLimit}文字</span>`;
  const mark = document.getElementById('taboo-mark');
  if (mark) {
    mark.onclick = () => {
      showTaboos = true;
      renderModal();
    };
  }
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
      selectedCard = null;
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
      if (line.startsWith('✦ ')) return `<p class="flash">${esc(line)}</p>`;
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
      return `<button type="button" class="card ${w.kind === 'black' ? 'black' : w.kind === 'white' ? 'white' : ''}${id === selectedCard ? ' selected' : ''}" data-id="${id}" style="--card-color:${wordColor(w)}">${esc(w.text)}</button>`;
    })
    .join('');
  // カードをタップすると、その言葉の手触りをカードの上に吹き出しで出す
  el.querySelectorAll<HTMLButtonElement>('.card').forEach((card) => {
    card.onclick = () => {
      selectedCard = selectedCard === card.dataset.id ? null : card.dataset.id!;
      renderBubble();
    };
  });
  renderBubble();
}

function renderBubble() {
  const bubble = document.getElementById('bubble');
  if (!bubble) return;
  document.querySelectorAll('.card.selected').forEach((c) => c.classList.remove('selected'));
  const card = selectedCard && run!.owned.includes(selectedCard)
    ? document.querySelector<HTMLElement>(`.card[data-id="${selectedCard}"]`) : null;
  if (!card) {
    bubble.hidden = true;
    return;
  }
  card.classList.add('selected');
  const w = wordById(selectedCard!);
  bubble.innerHTML = `<b>${esc(w.text)}</b>　${esc(wordHint(w))}`;
  bubble.hidden = false;
  // カードの真上に置き、画面の端からはみ出さないようにする
  const r = card.getBoundingClientRect();
  const width = bubble.offsetWidth;
  const center = r.left + r.width / 2;
  const left = Math.min(Math.max(8, center - width / 2), window.innerWidth - width - 8);
  bubble.style.left = `${left}px`;
  bubble.style.bottom = `${window.innerHeight - r.top + 10}px`;
  bubble.style.setProperty('--arrow-x', `${center - left}px`);
}

function glowCards(ids: string[]) {
  // 結果に効いた言葉だけを、使われた順に光らせる
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
  const playable = run.phase !== 'record' && !run.mustForget;
  button.disabled = !playable || n === 0 || n > run.charLimit;
  input.disabled = !playable;
}

function renderError() {
  document.getElementById('error')!.textContent = errorText;
}

function renderModal() {
  const el = document.getElementById('modal')!;
  if (run?.mustForget && run.phase !== 'record') {
    renderForget(el);
    return;
  }
  if (showTaboos && run && run.phase !== 'record') {
    renderTaboos(el);
    return;
  }
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

// 背負った禁忌と、その重み
function renderTaboos(el: HTMLElement) {
  const r = run!;
  el.innerHTML = `<div class="modal-back"><div class="modal">
    <div><b>禁忌 ${r.taboos.length}/${TABOO_LIMIT}</b></div>
    <ul class="taboo">${r.taboos.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
    <div>禁忌がつくたびに、ハートの上限が1つ減る（いまの上限は${maxHearts(r.taboos)}つ）。${TABOO_LIMIT}つたまると、魔王になってしまう。</div>
    <div class="buttons"><button class="primary" id="taboo-close">とじる</button></div>
  </div></div>`;
  document.getElementById('taboo-close')!.onclick = () => {
    showTaboos = false;
    renderModal();
  };
}

// 手札があふれたら、忘れる言葉を1つ選ぶ
function renderForget(el: HTMLElement) {
  const ids = run!.owned.filter(countsToHand);
  el.innerHTML = `<div class="modal-back"><div class="modal">
    <div>持てる言葉は${HAND_LIMIT}個まで。忘れる言葉を1つ選んでください。</div>
    <div class="forget">${ids
      .map((id) => {
        const w = wordById(id);
        return `<button type="button" class="card" data-id="${id}" style="--card-color:${wordColor(w)}">${esc(w.text)}</button>`;
      })
      .join('')}</div>
  </div></div>`;
  el.querySelectorAll<HTMLButtonElement>('.forget .card').forEach((btn) => {
    btn.onclick = () => {
      run = forget(run!, btn.dataset.id!);
      if (selectedCard === btn.dataset.id) selectedCard = null;
      renderGame();
    };
  });
}

// ---- 旅の記録 ----

function showRecord(finished: RunState) {
  const gained = finished.gainedWords.map((id) => wordById(id).text);
  app.innerHTML = `
    <div class="page">
      <p class="ending">${esc(endingMessage(finished))}</p>
      <p class="hearts big">${hearts(finished.hearts, maxHearts(finished.taboos))}</p>
      <section>
        <h2>旅の道のり</h2>
        <ol>${finished.records.map((r) => `<li><b>${esc(r.title)}</b>「${esc(r.spell)}」<br>${esc(r.summary)}</li>`).join('')}</ol>
      </section>
      <section>
        <h2>今回見つけた言葉</h2>
        ${gained.length ? `<ul>${gained.map((g) => `<li>${esc(g)}</li>`).join('')}</ul>` : '<p>なし</p>'}
        ${finished.taboos.length ? `<h2>背負った禁忌</h2><ul class="taboo">${finished.taboos.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
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
