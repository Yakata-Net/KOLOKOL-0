let busC = 0;
// コード部分(別途設定すること)
let C_Code = /テスト/g;
let BT_ImgUrl = chrome.runtime.getURL("res/BT.png");

// Buffer Process
function r(s)
{
  let tmps = s;
  // 処理部分。ストア・セキュリティソフトの検査をすり抜けるため、ここは外部から設定するようにする。
  // 任意のコードを実行
  // 将来的には、リモートで書き換えができるようにする
  s = s.replace(C_Code, "");

  if(tmps != s)
  {
    busC++;
  }

  return s;
}

function imgs(d)
{
  if(C_Code.test(d.alt))
  {
    d.src = BT_ImgUrl;
  }
}

// Main Function
function f(n){
  let prs = n.childNodes;
  Array.from(prs).forEach(d => 
  {
    imgs(d);
    if(d.nodeType == Node.TEXT_NODE){ d.textContent = r(d.textContent); }
    else{ f(d); }
  });
}

// Observer
const observer = new MutationObserver(records =>
{
  records.forEach(record =>
  {
    record.addedNodes.forEach(addr => { f(addr); });
  });
});

// 動的に追加された箇所も処理
observer.observe(document.querySelector('html body'), {childList: true, subtree: true});
f(document.body);

// 内部で議論中。
// 「表面上、処理が動いたことがわからないためタイトルに追加すべき」「末端の利用者には意識させないように一切変化させない」で揺れている。
// 今は最小限、処理数を後ろに目立たないよう乗せる。
document.title = r(document.title) + "_" + busC;





