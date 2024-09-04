// コード部分(別途設定すること)
let CodeList = [];

let BT_ImgUrl = chrome.runtime.getURL("res/BT.png");
let FailedCodeRead = false;
let EnableZmode = true;
let CurrentDomain = "";
let SplittedDomain = [];

const ZModeMbProcessHref = 0;
const ZModeMbProcessImg = 1;
const ZModeMbProcessIframe = 2;
const ZModeMbProcessOther = 3;
const ArrowListOnZmode = ["google.com", "google.co.jp", "bing.com"];
const LocalAddresses = ["127.0.0", "localhost"]; 
const Mos = "▒";
let MbStr = [];

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
function processMain(elementList, zMode)
{
  elementList.forEach(element =>
  {
    processElement(element, SplittedDomain, zMode);
  });
}

// 分割メイン処理
function processElement(targetelement, splittedCurrentDomain, zMode)
{
  // 画像・テキスト処理
  //console.log(element.textContent);
  targetelement.childNodes.forEach(childNode =>
  {
    imageProcess(childNode);
    hrefProcess(childNode);
    titleProcess(childNode);

    if(childNode.nodeType == Node.TEXT_NODE)
    {
      childNode.textContent = processText(childNode.textContent);
    }
  });
    
  if(!zMode) return;

  // リンク要素の場合
  if (targetelement.tagName === 'A' && targetelement.href)
  {
    const linkDomain = new URL(targetelement.href).hostname;
    if (checkDomain(linkDomain, splittedCurrentDomain))
    {
      console.log("removed href:"+ linkDomain);
      targetelement.text =  MbStr[ZModeMbProcessHref];
    }
  }
  // iframe要素の場合
  else if (targetelement.tagName === 'IFRAME' && targetelement.src)
  {
    const iframeDomain = new URL(targetelement.src).hostname;
    if (checkDomain(iframeDomain, splittedCurrentDomain))
    {
      console.log("removed IFRAME:"+ iframeDomain);
      if(targetelement.srcdoc)
      {
        targetelement.srcdoc =  MbStr[ZModeMbProcessIframe];
      }
      else
      {
        console.log("removed IFRAME but src is None:"+ iframeDomain);
        targetelement.remove();
      }
    }
  }
  // 画像要素の場合
  else if (targetelement.tagName === 'IMG' && targetelement.src)
  {
    const imgDomain = new URL(targetelement.src).hostname;
    if (checkDomain(imgDomain, splittedCurrentDomain))
    {
      console.log("removed IMG:"+ imgDomain);
      targetelement.src = BT_ImgUrl;
      targetelement.alt =  MbStr[ZModeMbProcessImg];
    }
  }
  // その他の要素の場合
  else if (targetelement.src)
  {
    const elementDomain = new URL(targetelement.src).hostname;
    if (checkDomain(elementDomain, splittedCurrentDomain))
    {
      console.log("removed OTHER:"+ elementDomain);
      if(targetelement.text)
      {
        targetelement.text = MbStr[ZModeMbProcessOther];
      }
      else
      {
        // fail safe
        console.log("removed OTHER but text is None"+ elementDomain);
        targetelement.remove();
      }
    }
  }
}

// 分割合致
function checkDomain(elementDomain, splittedCurrentDomain)
{
  let resultCnt = 0;
  if(elementDomain.includes("img.") || elementDomain.includes("image.") ||
     elementDomain.includes("javascript:"))
  {
    return false;
  }

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

function makeDisableButton()
{
  const allDisableButton = document.createElement('button');
  allDisableButton.textContent = "一時的に無効化して更新";
  allDisableButton.addEventListener('click', () =>
  {
    chrome.storage.sync.set({tmpDisabled: true }, function()
    {
      alert("一時的に無効化したうえで再読込を行います");
      console.log("Temp. Disabled");
      location.reload();
    });
  });
  let body = document.getElementsByTagName('body');
  body[0].prepend(allDisableButton);
}

function makeMbStr()
{
  const MbStrMakeCount = 8;
  const MbStrMakeMinimumLength = 3;
  const MbStrMakePlusLength = 10;

  for(let i = 0; i < MbStrMakeCount; i++)
    {
      let length = MbStrMakeMinimumLength + Math.floor(Math.random() * MbStrMakePlusLength);
      let tmpStr = "";
      for(let j = 0; j < length; j++)
      {
        let cp = Math.floor(Math.random() * 0x1F) + 0x2580;
        tmpStr += String.fromCharCode(cp);
      }
      MbStr.push(tmpStr);
    }
    console.log(MbStr)
}

// 処理メイン
function pageProcessMain()
{
  CurrentDomain = window.location.hostname;
  let splittedDomain = CurrentDomain.split(".");
  SplittedDomain = splittedDomain.filter(x => x != "www");
  console.log(CurrentDomain);
  console.log(SplittedDomain);

  makeDisableButton();
  makeMbStr();

  let zMode = EnableZmode;
  if(!EnableZmode)
  {
    console.log("Z Mode is Disable");
  }
  if(ArrowListOnZmode.some(x => CurrentDomain.lastIndexOf(x) != -1))
  {
    console.log("Z Mode is Enable But includes ArrowUrlList:" + currentDomain);
    zMode = false;
  }
  if(LocalAddresses.some(x => CurrentDomain.includes(x)))
  {
    console.log("Z Mode is Enable But LocalAddress:" + CurrentDomain);
    zMode = false;
  }

  // Observer
  const observer = new MutationObserver(records =>
  {
    let elements = document.querySelectorAll('*');
    /*
    // (秋子へ)暫定。下記コードだと必要な隠ぺい処理が不可能。解決策見つかるまで↑コードで全部処理させる
    let elementList = [];
    for(const record of records)
    {
      elementList.push(record.target);
      for(const addedNode of record.addedNodes)
      {
        elementList.push(addedNode);
      }
    }
    */
    //console.log(elementList);

    processMain(elements, zMode);
  });

  // 動的に追加された箇所も処理
  observer.observe(document.querySelector('html body'), {childList: true, subtree: true});

  // 最初に表示された部分の処理
  // すべての要素を取得、処理実施
  const elements = document.querySelectorAll('*');

  processMain(elements, zMode);

  titleSetting(document);
}

// タイトル設定
function titleSetting(document)
{
  // Zモード追加により、統計処理を別途考える必要があるため、タイトルには処理数は表示しない(暫定)
  let failedString = (FailedCodeRead == true) ? "(E)" : "";
  document.title = failedString + document.title + (EnableZmode ? "(Z)" : "");
}