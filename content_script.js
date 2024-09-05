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
      targetelement.text =  makeMbStr([...targetelement.text].length);
    }
  }
  // iframe要素の場合
  else if (targetelement.tagName === 'IFRAME' && targetelement.src)
  {
    const iframeDomain = new URL(targetelement.src).hostname;
    if (checkDomain(iframeDomain, splittedCurrentDomain))
    {
      console.log("removed IFRAME:"+ iframeDomain);
      targetelement.replaceWith(makeIfd());
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
      targetelement.alt =  makeMbStr([...targetelement.alt].length);
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
        targetelement.text = makeMbStr([...targetelement.text].length);
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

function makeIfd()
{
  const ifdDiv = document.createElement('div');
  const ifdP = document.createElement('p');
  ifdP.textContent = "工事中";

  ifdDiv.style.margin = "5px";
  ifdDiv.style.zIndex = "9999";
  ifdDiv.style.display = "flex";
  ifdDiv.style.border = "solid";
  ifdDiv.style.borderRadius = "2px";
  ifdDiv.style.background = "#A0A00060";

  ifdDiv.appendChild(ifdP);

  return ifdDiv;
}

function makeStatusPanel()
{
  const panelDiv = document.createElement('div');
  const statusP = document.createElement('p');
  const allDisableButton = document.createElement('button');

  statusP.style.margin = "5px";
  statusP.textContent = "Zモード:" + (EnableZmode ? "有効" : "無効");

  allDisableButton.style.margin = "5px";
  allDisableButton.textContent = "一時的に全機能無効化・更新";
  allDisableButton.addEventListener('click', () =>
  {
    if(!confirm("一時的に無効化したうえで再読込を行います"))
    {
      return;
    }

    chrome.storage.sync.set({tmpDisabled: true }, function()
    {
      console.log("Temp. Disabled");
      location.reload();
    });
  });

  panelDiv.style.width = "100%";
  panelDiv.style.margin = "5px";
  panelDiv.style.zIndex = "9999";
  panelDiv.style.display = "flex";
  panelDiv.style.border = "solid";
  panelDiv.style.borderRadius = "2px";
  panelDiv.style.background = (EnableZmode ? "#FF808080" : "#FFFF8060");
  panelDiv.appendChild(statusP);
  panelDiv.appendChild(allDisableButton);

  let body = document.getElementsByTagName('body');
  body[0].prepend(panelDiv);
}

function makeMbStr(maxlen)
{
  let tmpStr = "";
  for(let j = 0; j < maxlen; j++)
  {
    let cp = 0x13000 + Math.floor(Math.random() * 0x00042F);
    tmpStr += String.fromCodePoint(cp);
  }
  return tmpStr;
}

// 処理メイン
function pageProcessMain()
{
  CurrentDomain = window.location.hostname;
  let splittedDomain = CurrentDomain.split(".");
  SplittedDomain = splittedDomain.filter(x => x != "www");
  console.log(CurrentDomain);
  console.log(SplittedDomain);

  makeStatusPanel();

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
  const observer = new MutationObserver((records, observer) =>
  {
    observer.disconnect();
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
    console.log(elementList);
    */

    processMain(elements, zMode);
    observer.observe(document.querySelector('html body'), {childList: true, subtree: true});
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