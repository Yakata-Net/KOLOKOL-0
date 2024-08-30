// コード部分(別途設定すること)
let CodeList = [];

let BT_ImgUrl = chrome.runtime.getURL("res/BT.png");
let FailedCodeRead = false;
let EnableZmode = true;
let ArrowListOnZmode = ["google.com", "google.co.jp", "bing.com"];

// 初期処理・設定・コード読み込み
chrome.storage.sync.get(['ZMode'], function(zMode)
{
  if(zMode != undefined)
  {
    console.log("ZMode Loading Complete:" + zMode.ZMode);
    EnableZmode = zMode.ZMode;
  }
});

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

// 処理メイン
function processMain()
{
  const currentDomain = window.location.hostname;
  const splittedDomain = currentDomain.split(".");
  console.log(currentDomain)

  // すべての要素を取得、処理実施
  const elements = document.querySelectorAll('*');
  
  elements.forEach(element =>
  {
    // 画像・テキスト処理
    //console.log(element.textContent);
    element.childNodes.forEach(childNode =>
    {
      imageProcess(childNode);
      hrefProcess(childNode);
      titleProcess(childNode);

      if(childNode.nodeType == Node.TEXT_NODE)
      {
        childNode.textContent = processText(childNode.textContent);
      }
    });

    //console.log(currentDomain);
    if(!EnableZmode)
    {
      console.log("Z Mode is Disable");
      return;
    }
    if(ArrowListOnZmode.some(x => currentDomain.lastIndexOf(x) != -1))
    {
      console.log("Z Mode is Enable But includes ArrowUrlList:" + currentDomain);
      return;
    }
    
    // リンク要素の場合
    if (element.tagName === 'A' && element.href) {
        const linkDomain = new URL(element.href).hostname;
        if (checkDomain(linkDomain, splittedDomain)) {
            console.log("removed href:"+ linkDomain);
            element.remove();
        }
    }
    // iframe要素の場合
    else if (element.tagName === 'IFRAME' && element.src) {
        const iframeDomain = new URL(element.src).hostname;
        if (checkDomain(iframeDomain, splittedDomain)) {
            console.log("removed IFRAME:"+ iframeDomain);
            element.remove();
        }
    }
    // 画像要素の場合
    else if (element.tagName === 'IMG' && element.src) {
        const imgDomain = new URL(element.src).hostname;
        if (checkDomain(imgDomain, splittedDomain)) {
            console.log("removed IMG:"+ imgDomain);
            element.remove();
        }
    }
    // その他の要素の場合
    else if (element.src) {
        const elementDomain = new URL(element.src).hostname;
        if (checkDomain(elementDomain, splittedDomain)) {
            console.log("removed OTHER:"+ elementDomain);
            element.remove();
        }
    }
  });
}

// 分割合致
function checkDomain(elementDomain, splittedCurrentDomain)
{
  let resultCnt = 0;
  //console.log(splittedCurrentDomain)
  splittedCurrentDomain.forEach(spl =>
  {
    if(elementDomain.includes(spl))
    {
      resultCnt++;
    }
  });
  return resultCnt != splittedCurrentDomain.length;
}

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
      console.log("processed text.");
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
      console.log("processed img.");
      childNode.src = BT_ImgUrl;
    }
  }
}
// リンク処理
function hrefProcess(childNode)
{
  if(childNode.href == null) {return};
  let beforeHref = "";
  try
  {
    beforeHref = decodeURI(childNode.href);
  }
  catch(e)
  {
    console.log("URL Decode ERROR:" + childNode.href);
  }

  for(let i = 0; i < CodeList.length; i++)
  {
    let c_Code = new RegExp(CodeList[i], 'g');
    if(c_Code.test(beforeHref))
    {
      console.log("processed link.");
      let afterHref  = processText(beforeHref);
      childNode.href = encodeURI(afterHref);
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
      console.log("processed title.");
      childNode.title = processText(childNode.title);
    }
  }
}

// 処理メイン
function pageProcessMain()
{
  // Observer
  const observer = new MutationObserver(records =>
  {
    processMain();
  });

  // 動的に追加された箇所も処理
  observer.observe(document.querySelector('html body'), {childList: true, subtree: true});

  // 最初に表示された部分の処理
  processMain();

  titleSetting(document);
}

// タイトル設定
function titleSetting(document)
{
  // Zモード追加により、統計処理を別途考える必要があるため、タイトルには処理数は表示しない(暫定)
  let failedString = (FailedCodeRead == true) ? "(E)" : "";
  document.title = failedString + (EnableZmode ? "(Zモード有効化中)" : "");
}