let processedCount = 0;
// コード部分(別途設定すること)
let C_Code    = new RegExp();
let BT_ImgUrl = chrome.runtime.getURL("res/BT.png");
let FailedCodeRead = false;

// コード読み込み
chrome.storage.sync.get(['SettingCode'], function(storageData)
{
  if(storageData?.SettingCode != null)
  {
    C_Code = new RegExp(storageData.SettingCode, 'g');
    console.log("Code Loading Complete:" + storageData.SettingCode);
  }
  else
  {
    FailedCodeRead = true;
  }

  chrome.storage.sync.get(['tmpDisabled'], function(storageDataForTmpDisabled)
  {
    if(storageDataForTmpDisabled?.tmpDisabled == null || !storageDataForTmpDisabled.tmpDisabled)
    {
      pageProcessMain();
    }
    chrome.storage.sync.set({tmpDisabled: false }, function(){});
  });
});

// 処理関数
function processText(text)
{
  let preProcessString = text;
  // 処理部分。ストア・セキュリティソフトの検査をすり抜けるため、ここは外部から設定するようにする。
  // 任意のコードを実行
  // 将来的には、リモートで書き換えができるようにする
  text = text.replace(C_Code, "");

  if(preProcessString != text)
  {
    processedCount++;
  }

  return text;
}

// 画像処理
function imageProcess(childNode)
{
  if(C_Code.test(childNode.alt))
  {
    childNode.src = BT_ImgUrl;
    processedCount++;
  }
}

// Main Function
function documentRecursiveScan(Node){
  Array.from(Node.childNodes).forEach(childNode => 
  {
    imageProcess(childNode);
    if(childNode.nodeType == Node.TEXT_NODE){ childNode.textContent = processText(childNode.textContent); }
    else{ documentRecursiveScan(childNode); }
  });
}

// 処理メイン
function pageProcessMain()
{
  // Observer
  const observer = new MutationObserver(records =>
  {
    records.forEach(record =>
    {
      record.addedNodes.forEach(addedNode => { documentRecursiveScan(addedNode); });
    });
  });

  // 動的に追加された箇所も処理
  observer.observe(document.querySelector('html body'), {childList: true, subtree: true});
  documentRecursiveScan(document.body);

  titleSetting(document);
}

// タイトル設定
function titleSetting(document)
{
  // 内部で議論中。
  // 「表面上、処理が動いたことがわからないためタイトルに追加すべき」「末端の利用者には意識させないように一切変化させない」で揺れている。
  // 今は最小限、処理数を後ろに目立たないよう乗せる。
  let failedString = (FailedCodeRead == true) ? "(E)" : "";

  document.title = failedString + processText(document.title) + "_" + processedCount;
}


