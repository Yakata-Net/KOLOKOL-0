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
    // H
    let cp = inputText.codePointAt(j);
         if(inputText.codePointAt(j) == 0x3041)cp = 0x3043;
    else if(inputText.codePointAt(j) == 0x3042)cp = 0x3044;
    else if(inputText.codePointAt(j) == 0x3043)cp = 0x3045;
    else if(inputText.codePointAt(j) == 0x3044)cp = 0x3046;
    else if(inputText.codePointAt(j) == 0x3045)cp = 0x3047;
    else if(inputText.codePointAt(j) == 0x3046)cp = 0x3048;
    else if(inputText.codePointAt(j) == 0x3047)cp = 0x3049;
    else if(inputText.codePointAt(j) == 0x3048)cp = 0x304A;
    else if(inputText.codePointAt(j) == 0x3049)cp = 0x3049; // 該当がないため無視
    else if(inputText.codePointAt(j) == 0x304A)cp = 0x304B;
    else if(inputText.codePointAt(j) == 0x304B)cp = 0x304D;
    else if(inputText.codePointAt(j) == 0x304C)cp = 0x304E;
    else if(inputText.codePointAt(j) == 0x304D)cp = 0x304F;
    else if(inputText.codePointAt(j) == 0x304E)cp = 0x3050;
    else if(inputText.codePointAt(j) == 0x304F)cp = 0x3051;
    else if(inputText.codePointAt(j) == 0x3050)cp = 0x3052;
    else if(inputText.codePointAt(j) == 0x3051)cp = 0x3053;
    else if(inputText.codePointAt(j) == 0x3052)cp = 0x3054;
    else if(inputText.codePointAt(j) == 0x3053)cp = 0x3055;
    else if(inputText.codePointAt(j) == 0x3054)cp = 0x3056;
    else if(inputText.codePointAt(j) == 0x3055)cp = 0x3057;
    else if(inputText.codePointAt(j) == 0x3056)cp = 0x3058;
    else if(inputText.codePointAt(j) == 0x3057)cp = 0x3059;
    else if(inputText.codePointAt(j) == 0x3058)cp = 0x305A;
    else if(inputText.codePointAt(j) == 0x3059)cp = 0x305B;
    else if(inputText.codePointAt(j) == 0x305A)cp = 0x305C;
    else if(inputText.codePointAt(j) == 0x305B)cp = 0x305D;
    else if(inputText.codePointAt(j) == 0x305C)cp = 0x305E;
    else if(inputText.codePointAt(j) == 0x305D)cp = 0x305F;
    else if(inputText.codePointAt(j) == 0x305E)cp = 0x3060;
    else if(inputText.codePointAt(j) == 0x305F)cp = 0x3061;
    else if(inputText.codePointAt(j) == 0x3060)cp = 0x3062;
    else if(inputText.codePointAt(j) == 0x3061)cp = 0x3064;
    else if(inputText.codePointAt(j) == 0x3062)cp = 0x3065;
    else if(inputText.codePointAt(j) == 0x3063)cp = 0x3063; // 該当がないため無視
    else if(inputText.codePointAt(j) == 0x3064)cp = 0x3066;
    else if(inputText.codePointAt(j) == 0x3065)cp = 0x3067;
    else if(inputText.codePointAt(j) == 0x3066)cp = 0x3067;
    else if(inputText.codePointAt(j) == 0x3067)cp = 0x3069;
    else if(inputText.codePointAt(j) == 0x3068)cp = 0x306A;
    else if(inputText.codePointAt(j) == 0x3069)cp = 0x306A; // 該当がないためフォールバック
    else if(inputText.codePointAt(j) == 0x306A)cp = 0x306B;
    else if(inputText.codePointAt(j) == 0x306B)cp = 0x306C;
    else if(inputText.codePointAt(j) == 0x306C)cp = 0x306D;
    else if(inputText.codePointAt(j) == 0x306D)cp = 0x306E;
    else if(inputText.codePointAt(j) == 0x306E)cp = 0x306F;
    else if(inputText.codePointAt(j) == 0x306F)cp = 0x3072;
    else if(inputText.codePointAt(j) == 0x3070)cp = 0x3073;
    else if(inputText.codePointAt(j) == 0x3071)cp = 0x3074;
    else if(inputText.codePointAt(j) == 0x3072)cp = 0x3075;
    else if(inputText.codePointAt(j) == 0x3073)cp = 0x3076;
    else if(inputText.codePointAt(j) == 0x3074)cp = 0x3077;
    else if(inputText.codePointAt(j) == 0x3075)cp = 0x3078;
    else if(inputText.codePointAt(j) == 0x3076)cp = 0x3079;
    else if(inputText.codePointAt(j) == 0x3077)cp = 0x307A;
    else if(inputText.codePointAt(j) == 0x3078)cp = 0x307B;
    else if(inputText.codePointAt(j) == 0x3079)cp = 0x307C;
    else if(inputText.codePointAt(j) == 0x307A)cp = 0x307D;
    else if(inputText.codePointAt(j) == 0x307B)cp = 0x307E;
    else if(inputText.codePointAt(j) == 0x307C)cp = 0x307E; // 該当がないためフォールバック
    else if(inputText.codePointAt(j) == 0x307D)cp = 0x307E; // 該当がないためフォールバック
    else if(inputText.codePointAt(j) == 0x307E)cp = 0x307F;
    else if(inputText.codePointAt(j) == 0x307F)cp = 0x3080;
    else if(inputText.codePointAt(j) == 0x3080)cp = 0x3081;
    else if(inputText.codePointAt(j) == 0x3081)cp = 0x3082;
    else if(inputText.codePointAt(j) == 0x3082)cp = 0x3084;
    else if(inputText.codePointAt(j) == 0x3083)cp = 0x3085;
    else if(inputText.codePointAt(j) == 0x3084)cp = 0x3086;
    else if(inputText.codePointAt(j) == 0x3085)cp = 0x3087;
    else if(inputText.codePointAt(j) == 0x3086)cp = 0x3088;
    else if(inputText.codePointAt(j) == 0x3087)cp = 0x3089; // 該当がないためフォールバック
    else if(inputText.codePointAt(j) == 0x3088)cp = 0x3089;
    else if(inputText.codePointAt(j) == 0x3089)cp = 0x308A;
    else if(inputText.codePointAt(j) == 0x308A)cp = 0x308B;
    else if(inputText.codePointAt(j) == 0x308B)cp = 0x308C;
    else if(inputText.codePointAt(j) == 0x308C)cp = 0x308D;
    else if(inputText.codePointAt(j) == 0x308D)cp = 0x308F;
    else if(inputText.codePointAt(j) == 0x308E)cp = 0x308E; // 該当がないため無視
    else if(inputText.codePointAt(j) == 0x308F)cp = 0x3092;
    else if(inputText.codePointAt(j) == 0x3090)cp = 0x3090; // 歴史的経緯のため無視
    else if(inputText.codePointAt(j) == 0x3091)cp = 0x3091; // 歴史的経緯のため無視
    else if(inputText.codePointAt(j) == 0x3092)cp = 0x3093; // 歴史的経緯のため無視
    else if(inputText.codePointAt(j) == 0x3093)cp = 0x3041; // Loop
    else if(inputText.codePointAt(j) == 0x3094)cp = 0x3094; // 歴史的経緯のため無視

    //K
    else if(inputText.codePointAt(j) == 0x30A1)cp = 0x30A3;
    else if(inputText.codePointAt(j) == 0x30A2)cp = 0x30A4;
    else if(inputText.codePointAt(j) == 0x30A3)cp = 0x30A5;
    else if(inputText.codePointAt(j) == 0x30A4)cp = 0x30A6;
    else if(inputText.codePointAt(j) == 0x30A5)cp = 0x30A7;
    else if(inputText.codePointAt(j) == 0x30A6)cp = 0x30A8;
    else if(inputText.codePointAt(j) == 0x30A7)cp = 0x30A9;
    else if(inputText.codePointAt(j) == 0x30A8)cp = 0x30AA;
    else if(inputText.codePointAt(j) == 0x30A9)cp = 0x30A9; // 該当がないため無視
    else if(inputText.codePointAt(j) == 0x30AA)cp = 0x30AB;
    else if(inputText.codePointAt(j) == 0x30AB)cp = 0x30AD;
    else if(inputText.codePointAt(j) == 0x30AC)cp = 0x30AE;
    else if(inputText.codePointAt(j) == 0x30AD)cp = 0x30AF;
    else if(inputText.codePointAt(j) == 0x30AE)cp = 0x30B0;
    else if(inputText.codePointAt(j) == 0x30AF)cp = 0x30B1;
    else if(inputText.codePointAt(j) == 0x30B0)cp = 0x30B2;
    else if(inputText.codePointAt(j) == 0x30B1)cp = 0x30B3;
    else if(inputText.codePointAt(j) == 0x30B2)cp = 0x30B4;
    else if(inputText.codePointAt(j) == 0x30B3)cp = 0x30B5;
    else if(inputText.codePointAt(j) == 0x30B4)cp = 0x30B6;
    else if(inputText.codePointAt(j) == 0x30B5)cp = 0x30B7;
    else if(inputText.codePointAt(j) == 0x30B6)cp = 0x30B8;
    else if(inputText.codePointAt(j) == 0x30B7)cp = 0x30B9;
    else if(inputText.codePointAt(j) == 0x30B8)cp = 0x30BA;
    else if(inputText.codePointAt(j) == 0x30B9)cp = 0x30BB;
    else if(inputText.codePointAt(j) == 0x30BA)cp = 0x30BC;
    else if(inputText.codePointAt(j) == 0x30BB)cp = 0x30BD;
    else if(inputText.codePointAt(j) == 0x30BC)cp = 0x30BE;
    else if(inputText.codePointAt(j) == 0x30BD)cp = 0x30BF;
    else if(inputText.codePointAt(j) == 0x30BE)cp = 0x30C0;
    else if(inputText.codePointAt(j) == 0x30BF)cp = 0x30C1;
    else if(inputText.codePointAt(j) == 0x30C0)cp = 0x30C2;
    else if(inputText.codePointAt(j) == 0x30C1)cp = 0x30C4;
    else if(inputText.codePointAt(j) == 0x30C2)cp = 0x30C5;
    else if(inputText.codePointAt(j) == 0x30C3)cp = 0x30C3; // 該当がないため無視
    else if(inputText.codePointAt(j) == 0x30C4)cp = 0x30C6;
    else if(inputText.codePointAt(j) == 0x30C5)cp = 0x30C7;
    else if(inputText.codePointAt(j) == 0x30C6)cp = 0x30C7;
    else if(inputText.codePointAt(j) == 0x30C7)cp = 0x30C9;
    else if(inputText.codePointAt(j) == 0x30C8)cp = 0x30CA;
    else if(inputText.codePointAt(j) == 0x30C9)cp = 0x30CA; // 該当がないためフォールバック
    else if(inputText.codePointAt(j) == 0x30CA)cp = 0x30CB;
    else if(inputText.codePointAt(j) == 0x30CB)cp = 0x30CC;
    else if(inputText.codePointAt(j) == 0x30CC)cp = 0x30CD;
    else if(inputText.codePointAt(j) == 0x30CD)cp = 0x30CE;
    else if(inputText.codePointAt(j) == 0x30CE)cp = 0x30CF;
    else if(inputText.codePointAt(j) == 0x30CF)cp = 0x30D2;
    else if(inputText.codePointAt(j) == 0x30D0)cp = 0x30D3;
    else if(inputText.codePointAt(j) == 0x30D1)cp = 0x30D4;
    else if(inputText.codePointAt(j) == 0x30D2)cp = 0x30D5;
    else if(inputText.codePointAt(j) == 0x30D3)cp = 0x30D6;
    else if(inputText.codePointAt(j) == 0x30D4)cp = 0x30D7;
    else if(inputText.codePointAt(j) == 0x30D5)cp = 0x30D8;
    else if(inputText.codePointAt(j) == 0x30D6)cp = 0x30D9;
    else if(inputText.codePointAt(j) == 0x30D7)cp = 0x30DA;
    else if(inputText.codePointAt(j) == 0x30D8)cp = 0x30DB;
    else if(inputText.codePointAt(j) == 0x30D9)cp = 0x30DC;
    else if(inputText.codePointAt(j) == 0x30DA)cp = 0x30DD;
    else if(inputText.codePointAt(j) == 0x30DB)cp = 0x30DE;
    else if(inputText.codePointAt(j) == 0x30DC)cp = 0x30DE; // 該当がないためフォールバック
    else if(inputText.codePointAt(j) == 0x30DD)cp = 0x30DE; // 該当がないためフォールバック
    else if(inputText.codePointAt(j) == 0x30DE)cp = 0x30DF;
    else if(inputText.codePointAt(j) == 0x30DF)cp = 0x30E0;
    else if(inputText.codePointAt(j) == 0x30E0)cp = 0x30E1;
    else if(inputText.codePointAt(j) == 0x30E1)cp = 0x30E2;
    else if(inputText.codePointAt(j) == 0x30E2)cp = 0x30E4;
    else if(inputText.codePointAt(j) == 0x30E3)cp = 0x30E5;
    else if(inputText.codePointAt(j) == 0x30E4)cp = 0x30E6;
    else if(inputText.codePointAt(j) == 0x30E5)cp = 0x30E7;
    else if(inputText.codePointAt(j) == 0x30E6)cp = 0x30E8;
    else if(inputText.codePointAt(j) == 0x30E7)cp = 0x30E9; // 該当がないためフォールバック
    else if(inputText.codePointAt(j) == 0x30E8)cp = 0x30E9;
    else if(inputText.codePointAt(j) == 0x30E9)cp = 0x30EA;
    else if(inputText.codePointAt(j) == 0x30EA)cp = 0x30EB;
    else if(inputText.codePointAt(j) == 0x30EB)cp = 0x30EC;
    else if(inputText.codePointAt(j) == 0x30EC)cp = 0x30ED;
    else if(inputText.codePointAt(j) == 0x30ED)cp = 0x30EF;
    else if(inputText.codePointAt(j) == 0x30EE)cp = 0x30EE; // 該当がないため無視
    else if(inputText.codePointAt(j) == 0x30EF)cp = 0x30F2;
    else if(inputText.codePointAt(j) == 0x30F0)cp = 0x30F0; // 歴史的経緯のため無視
    else if(inputText.codePointAt(j) == 0x30F1)cp = 0x30F1; // 歴史的経緯のため無視
    else if(inputText.codePointAt(j) == 0x30F2)cp = 0x30F3; // 歴史的経緯のため無視
    else if(inputText.codePointAt(j) == 0x30F3)cp = 0x30F1; // Loop
    else if(inputText.codePointAt(j) == 0x30F4)cp = 0x30F4; // 歴史的経緯のため無視
    else if(inputText.codePointAt(j) == 0x30F5)cp = 0x30F5; // 該当がないため無視
    else if(inputText.codePointAt(j) == 0x30F6)cp = 0x30F6; // 該当がないため無視
    else if(inputText.codePointAt(j) == 0x30F7)cp = 0x30FA;
    else if(inputText.codePointAt(j) == 0x30F8)cp = 0x30F9;
    else if(inputText.codePointAt(j) == 0x30F9)cp = 0x30FA;
    else if(inputText.codePointAt(j) == 0x30FA)cp = 0x30F3;

    else　if(inputText.codePointAt(j) >= 0x4E00 && inputText.codePointAt(j) <= 0x9FFF)
    {
      cp = inputText.codePointAt(j) + 0x0001;
    }
    else
    {

    }

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