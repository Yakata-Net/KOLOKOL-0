// コード部分(別途設定すること)
let CodeList = [];

let BT_ImgUrl = chrome.runtime.getURL("res/BT.png");
let FailedCodeRead = false;
let EnableZmode = true;
let CurrentDomain = "";
let SplittedDomain = [];

const LocalAddresses = ["127.0.0", "localhost"]; 
const Fl = "blur(30px) sepia(100%) saturate(500%) hue-rotate(305deg)";
const Flw = "blur(0.5px) sepia(100%) saturate(500%) hue-rotate(305deg)"
let ArrowListOnZmode = [];

Main();

function Main()
{
  // 初期処理・設定・コード読み込み
  chrome.storage.sync.get(['ZMode'], function(zMode)
  {
    if(zMode != undefined)
    {
      console.log("ZMode Loading Complete:" + zMode.ZMode);
      EnableZmode = zMode.ZMode;
    }
  });

  chrome.storage.sync.get(['ArrowListOnZmode'], function(storageData)
  {
    if(storageData?.ArrowListOnZmode != null)
    {
      console.log("ArrowListOnZmode Loading Complete(Count:" + storageData.ArrowListOnZmode.length + ")");
      ArrowListOnZmode = storageData.ArrowListOnZmode;
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
        pageProcessMain();  // Entry
      }
      chrome.storage.sync.set({tmpDisabled: false }, function(){});
    });
  });
}

function pageProcessMain()
{
  CurrentDomain = window.location.hostname;
  let splittedDomain = CurrentDomain.split(".");
  SplittedDomain = splittedDomain.filter(x => x != "www");
  console.log(CurrentDomain);
  console.log(SplittedDomain);

  makeZModeStatusPanel();

  let zMode = EnableZmode;
  if(!EnableZmode) { console.log("Z Mode is Disable"); }

  if(EnableZmode && ArrowListOnZmode.some(x => CurrentDomain.lastIndexOf(x) != -1))
  {
    console.log("Z Mode is Enable But includes ArrowUrlList:" + CurrentDomain);
    zMode = false;
  }
  if(EnableZmode && LocalAddresses.some(x => CurrentDomain.includes(x)))
  {
    console.log("Z Mode is Enable But LocalAddress:" + CurrentDomain);
    zMode = false;
  }

  // Observer
  const observer = new MutationObserver((records, observer) =>
  {
    observer.disconnect();
    let elements = [];

    for(const record of records)
    {
      if(record.type == "attributes")
      {
        elements.push(record.target);
      }
      else if(record.type == "characterData")
      {
        elements.push(record.target);
      }
      for(const addedNode of record.addedNodes)
      {
        elements.push(addedNode);
      }
    }

    elements.forEach(element =>
    {
      processElement(element, SplittedDomain, zMode);
    });

    observer.observe(document.querySelector('*'), {attributes:true, childList: true, subtree: true});
  });

  // 動的に追加された箇所も処理
  observer.observe(document.querySelector('*'), {attributes:true, childList: true, subtree: true});

  // 最初に表示された部分の処理
  // すべての要素を取得、処理実施
  const elements = document.querySelectorAll('*');
  elements.forEach(element =>
  {
    processElement(element, SplittedDomain, zMode);
  });
  pageTitleSetting(document);
}

// 分割メイン処理
function processElement(targetelement, splittedCurrentDomain, zMode)
{
  // 画像・テキスト処理
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
  if (targetelement.tagName === 'A' && targetelement.href && !targetelement.href.includes("javascript:"))
  {
    if(!URL?.canParse(targetelement.href))
    {
      console.log("removed href, CANNOT PARSE URL:"+ targetelement.href);
      removeParentDiv(targetelement);
    }
    else
    {
      const linkDomain = new URL(targetelement.href).hostname;
      if (checkDomain(linkDomain, splittedCurrentDomain))
      {
        console.log("removed href:"+ linkDomain);
        targetelement.style.filter = Flw;
        targetelement.text = makeMbStr(targetelement.text);
        //removeParentDiv(targetelement);
      }
    }
  }
  // iframe要素の場合
  else if (targetelement.tagName === 'IFRAME')
  {
    if(!targetelement.src)
    {
      console.log("removed unknown domain IFRAME");
      targetelement.style.filter = Fl;
      targetelement.width = "32px";
      targetelement.height = "32px";
      removeParentDiv(targetelement);
    }
    else if(!URL?.canParse(targetelement.src))
    {
      console.log("removed IFRAME, CANNOT PARSE URL:" + targetelement.src);
    }
    else
    {
      const iframeDomain = new URL(targetelement.src).hostname;
      if (checkDomain(iframeDomain, splittedCurrentDomain))
      {
        console.log("removed IFRAME:"+ iframeDomain);
        targetelement.style.filter = Fl;
        targetelement.width = "32px";
        targetelement.height = "32px";
        removeParentDiv(targetelement);
      }
    }
  }
  // 画像要素の場合
  else if(targetelement.tagName === 'IMG')
  {
    // いったん何もしない(ここまで処理すると発覚の恐れあり)
  }
  // 動画要素の場合
  else if(targetelement.tagName === 'VIDEO')
  {
    // いったん何もしない(ここまで処理すると発覚の恐れあり)
  }
  // その他の要素の場合
  else if (targetelement.src)
  {
    if(!URL?.canParse(targetelement.src))
    {
      console.log("removed " + targetelement.tagName + ", CANNOT PARSE URL:"+ targetelement.src);
      removeParentDiv(targetelement);
    }
    else
    {
      const elementDomain = new URL(targetelement.src).hostname;
      if (checkDomain(elementDomain, splittedCurrentDomain))
      {
        console.log("removed OTHER:"+ elementDomain);
        if(targetelement.text)
        {
          targetelement.text = makeMbStr(targetelement.text);
          targetelement.style.filter = Fl;
          targetelement.width = "32px";
          targetelement.height = "32px";
        }
        removeParentDiv(targetelement);
      }
    }
  }
}

// 分割合致
function checkDomain(elementDomain, splittedCurrentDomain)
{
  let resultCnt = 0;

  splittedCurrentDomain.forEach(spl =>
  {
    if(elementDomain.includes(spl))
    {
      resultCnt++;
    }
  });
  return resultCnt != splittedCurrentDomain.length;
}

// 親要素の削除
function removeParentDiv(element)
{
  /*
  if(element?.parentElement !== null && element.parentElement?.tagName === 'DIV')
  {
    element.parentElement.remove();
    for(const child of element.parentElement.children)
    {
      console.log("removed child:"+ element.parentElement.tagName);
      child.remove();
    }
  }
  */
  element.remove();
}

// 処理関数
function processText(text)
{
  // 処理部分。ストア・セキュリティソフトの検査をすり抜けるため、ここは外部から設定するようにする。
  // 将来的には、リモートで書き換え・任意コード実行ができるようにする
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
  if(childNode.href == null) return;

  let beforeHref = "";
  try { beforeHref = decodeURI(childNode.href); }
  catch(e) { console.log("URL Decode ERROR:" + childNode.href); }

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
  if(childNode.title == null) return;

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

function makeProcessedPanel()
{
  const ifdDiv = document.createElement('div');
  const ifdP = document.createElement('p');
  ifdP.textContent = "工事中";

  ifdDiv.style.margin = "5px";
  ifdDiv.style.zIndex = "9999";
  ifdDiv.style.display = "flex";
  ifdDiv.style.borderRadius = "1px";
  ifdDiv.style.background = "#A0A00040";

  ifdDiv.appendChild(ifdP);

  return ifdDiv;
}

function makeZModeStatusPanel()
{
  const panelDiv = document.createElement('div');
  const statusP = document.createElement('p');
  const allDisableButton = document.createElement('button');
  const disableZModeArrowButton = document.createElement('button');

  statusP.style.margin = "auto";
  let buttonText = "";
  let colorText = "";
  let EnableZModeThisSite = false;
  if(!EnableZmode)
  {
    EnableZModeThisSite = false;
    colorText = "#FFFF8060";
    buttonText = "Zモード:無効";
  }
  else
  {
    EnableZModeThisSite = true;
    colorText = "#FF808080";
    buttonText = "Zモード:有効";
    if(ArrowListOnZmode.some(x => x === CurrentDomain))
    {
      EnableZModeThisSite = false;
      colorText = "#00808060";
      buttonText = "Zモード:有効(このサイトでは無効)";
    }
  }
  statusP.textContent = buttonText;

  allDisableButton.style.margin = "auto";
  allDisableButton.textContent = "一時的に全機能無効化・更新";
  allDisableButton.addEventListener('click', () =>
  {
    if(!confirm("一時的に全機能を無効化したうえで再読込を行います")) return;

    chrome.storage.sync.set({tmpDisabled: true }, function()
    {
      console.log("Temp. Disabled");
      location.reload();
    });
  });

  disableZModeArrowButton.style.margin = "auto";
  disableZModeArrowButton.textContent = EnableZModeThisSite ? "このサイトではZモードを無効化" : "このサイトでZモードを再度有効化" ;
  disableZModeArrowButton.addEventListener('click', () =>
  {
    let dialogText = EnableZModeThisSite ? "このサイトではZモードを無効化し、再読込します(通常処理は無効化されません)" :
    "このサイトでZモードを有効化し、再読込します";
    if(!confirm(dialogText)) return;

    if(EnableZModeThisSite)
    {
      ArrowListOnZmode.push(CurrentDomain);
    }
    else
    {
      ArrowListOnZmode = ArrowListOnZmode.filter(x => x !== CurrentDomain);
    }

    chrome.storage.sync.set({ArrowListOnZmode: ArrowListOnZmode }, function()
    {
      console.log("ZModeDisableArrow:" + CurrentDomain);
      location.reload();
    });
  });

  panelDiv.style.margin = "5px";
  panelDiv.style.zIndex = "9999";
  panelDiv.style.display = "flex";
  panelDiv.style.border = "solid";
  panelDiv.style.borderRadius = "2px";
  panelDiv.style.background = colorText;
  panelDiv.appendChild(statusP);
  panelDiv.appendChild(allDisableButton);
  panelDiv.appendChild(disableZModeArrowButton);

  let body = document.getElementsByTagName('body');
  body[0].prepend(panelDiv);
}

function makeMbStr(inputText)
{
  let tmpStr = "";
  for(let j = 0; j < inputText.length; j++)
  {
    let cp = inputText.codePointAt(j) + 0x0002;
    tmpStr += String.fromCodePoint(cp);
  }
  return tmpStr;
}

// タイトル設定
function pageTitleSetting(document)
{
  // Zモード追加により、統計処理を別途考える必要があるため、タイトルには処理数は表示しない(暫定)
  let failedString = (FailedCodeRead == true) ? "(E)" : "";
  document.title = failedString + document.title + (EnableZmode ? "(Z)" : "");
}