let textProcessedCount = 0;
let titleProcessedCount = 0;
let hrefProcessedCount = 0;
let imageProcessedCount = 0;

// コード部分(別途設定すること)
let CodeList = [];

let BT_ImgUrl = chrome.runtime.getURL("res/BT.png");
let FailedCodeRead = false;

// 初期処理・コード読み込み
chrome.storage.sync.get(['SettingCodeList'], function(storageData)
{
  if(storageData?.SettingCodeList != null)
  {
    console.log("Code Loading Complete(Count:" + storageData.SettingCodeList.length + ")");
    CodeList = storageData.SettingCodeList;
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
  // 処理部分。ストア・セキュリティソフトの検査をすり抜けるため、ここは外部から設定するようにする。
  // 任意のコードを実行
  // 将来的には、リモートで書き換えができるようにする
  for(let i = 0; i < CodeList.length; i++)
  {
    let preProcessString = text;

    let c_Code = new RegExp(CodeList[i], 'g');
    text = text.replace(c_Code, "");
    if(preProcessString != text)
    {
      textProcessedCount++;
    }
  }

  return text;
}

// 画像処理
function imageProcess(childNode)
{
  for(let i = 0; i < CodeList.length; i++)
  {
    let c_Code = new RegExp(CodeList[i], 'g');
    if(c_Code.test(childNode.alt))
    {
      childNode.src = BT_ImgUrl;
      imageProcessedCount++;
    }
  }
}
// リンク処理
function hrefProcess(childNode)
{
  if(childNode.href == null) {return};

  let beforeHref = decodeURI(childNode.href)
  for(let i = 0; i < CodeList.length; i++)
  {
    let c_Code = new RegExp(CodeList[i], 'g');
    if(c_Code.test(beforeHref))
    {
      let afterHref  = processText(beforeHref);
      childNode.href = encodeURI(afterHref);
      hrefProcessedCount++;
    }
  }
}
// タイトル文処理
function titleProcess(childNode)
{
  if(childNode.title == null) {return};

  for(let i = 0; i < CodeList.length; i++)
  {
    let c_Code = new RegExp(CodeList[i], 'g');
    if(c_Code.test(childNode.title))
    {
      childNode.title = processText(childNode.title);
      titleProcessedCount++;
    }
  }
}

// Main Function
function documentRecursiveScan(Node){
  Array.from(Node.childNodes).forEach(childNode => 
  {
    imageProcess(childNode);
    hrefProcess(childNode);
    titleProcess(childNode);
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

  document.title = failedString + processText(document.title) + "_Tx" + textProcessedCount +
                                                                "_Ti" + titleProcessedCount + 
                                                                "_Hf" + hrefProcessedCount +
                                                                "_Im" + imageProcessedCount;
}