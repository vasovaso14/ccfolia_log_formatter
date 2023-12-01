document.addEventListener('DOMContentLoaded', () => {
  // define constants
  const formatErea = document.getElementById('formatErea');
  const downloadErea = document.getElementById('downloadErea');

  // main process
  uploadButton.addEventListener('change', function () {
    const uploadFile = document.getElementById('uploadButton');
    const file = uploadFile.files[0];    
    
    // clear the format and download erea whenever upload button's input is changed
    removeAllChildren(formatErea);
    removeAllChildren(downloadErea);

    // when no file is uploaded
    if (!file){
      alert('ファイルを選択してください。');
      return;
    }
    // when uploaded file is not .html
    if (file.type !== 'text/html') {
      alert('HTMLファイルを選択してください。');
      return;
    }

    // when uploaded file is html, read it
    const reader = new FileReader();    
    reader.readAsText(file);
    reader.onload = function (e) {
      const originalLog = e.target.result;
      // analyze HTML (-> DOM node)
      const parser = new DOMParser();
      const doc = parser.parseFromString(originalLog, 'text/html');

      const extractedEntries = extractDataFromHTML(doc)[0]; // extract data
      const playerColorList = extractDataFromHTML(doc)[1];
      const tabNameList = extractDataFromHTML(doc)[2];
      console.log(playerColorList);
      console.log(tabNameList);
      //const formattedLog = formatLog(originalLog);  // format uploaded log

      setCSS(doc, extractedEntries, playerColorList, tabNameList);

      const serializer = new XMLSerializer();
      const formattedLog = serializer.serializeToString(doc);

      // create a format button 
      const formatButton = document.createElement('button');
      formatButton.textContent = '整形！';
      formatErea.appendChild(formatButton);

      // when format button is clicked
      formatButton.addEventListener('click', function () {
        //reader.onloadが非同期処理なので、ちょっとだけ遅延させる
        setTimeout(function () {
          // clear the download erea and create a download button whenever format button is clicked
          removeAllChildren(downloadErea);
          const downloadButton = document.createElement('a');
          downloadButton.textContent = 'ダウンロード';
          downloadButton.download = 'formatted.html';
          downloadButton.href = 'data:text/html;charset=utf-8,' + encodeURIComponent(formattedLog);
          downloadErea.appendChild(downloadButton);
        }, 1000);
      })
    }
  })
})

// format log func
function formatLog(originalLog){
  const formattedLog = originalLog;
  return formattedLog;
}

// remove all childern from a parent element
function removeAllChildren(parent){
  while (parent.firstChild) {
    parent.removeChild(parent.firstChild);
  }
  return;
}

function extractDataFromHTML(doc) {
  const entries = [];
  const playerColorStringSet = new Set();
  const tabNameSet = new Set();

  // extract data per <p> tag
  const paragraphElements = doc.querySelectorAll('p');
  paragraphElements.forEach( (paragraph) => {
      const entry = {};

      // extract color
      const style = paragraph.getAttribute('style');
      const colorMatch = /color:\s*([^;]+);/.exec(style);
      if (colorMatch) {
          entry.color = colorMatch[1];
      }
      // extract tab name
      tabElement = paragraph.children[0].innerHTML;
      tabElement = tabElement.replace(' [', '');
      tabElement = tabElement.replace(']', '');
      entry.tabName = tabElement;
      // extract player name
      entry.playerName = paragraph.children[1].innerHTML;
      // extract text
      entry.content = paragraph.children[2].innerHTML;

      entries.push(entry);

      const playerColorPairString = JSON.stringify({ playerName: entry.playerName, color: entry.color });
      playerColorStringSet.add(playerColorPairString);

      tabNameSet.add(entry.tabName);
  });
  const playerColorList = Array.from(playerColorStringSet).map(JSON.parse);
  const tabNameList = Array.from(tabNameSet)

  return [entries, playerColorList, tabNameList];
}

function analyzeExtractedData(extractedEntries){

}

function setCSS(doc, extractedEntries, playerColorList, tabNameList) {

  const styleElement = doc.createElement('style');
  // スタイルシートの内容を設定
  styleElement.textContent = `
    html {
      font-size: 14px;
    }
    body {
      -webkit-text-size-adjust: 100%;
      background-color: #ffffff;
    }
    h1 {
      font-size: 20px;
      margin: 1rem 1rem 0;
      color: #000000;
    }
    .tab {
      border: 1px solid #999;
      margin: 2rem 1rem 1rem;
      line-height: 1.5;
      position: relative;
    }
    .tabtitle {
      border: 1px solid transparent;
      border-color: inherit;
      background-color: inherit;
      position: absolute;
      top: -.8rem;
      left: 1rem;
      min-width: 7rem;
      padding: 0 .5rem;
      text-align: center;
      font-size: 1rem;
      z-index: 9999;
      line-height: 1.4rem;
    }
    .player {
      margin: 0;
      padding: 0 .5rem;
      padding-left: 10.5rem;
      border-bottom: 1px dotted transparent;
      border-color: inherit;
      position: relative;
    }
    .player:last-child {
      border-bottom: 0;
    }
    .player b {
      display: block;
      height: 100%;
      width: 9rem;
      padding: 0 .5rem;
      border-right: 1px solid transparent;
      border-color: inherit;
      position: absolute;
      top: 0;
      left: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .tabtitle + .player {
      padding-top: .7rem;
    }
    .tabtitle + .player b {
      padding-top: .7rem;
      height: calc(100% - .7rem);
    }
    .diceroll {
      padding: 0 .5em;
      color: #ffffff;
    }
  `;
  
  // define player settings
  playerColorList.forEach ( (player, index) => {
    playerSettings = `

      /* 発言者：${player.playerName} */
      .p${index} { color: ${player.color}; }
      .p${index} .diceroll { background-color: ${player.color}; }
    `
    styleElement.textContent += playerSettings;

  })
  
  // define tab settings
  tabNameList.forEach ( (tab, index) => {
    tabSettings = `

      /* [${tab}] タブ */
      .t${index} {
        background-color: #cccccc;
        border-color: #999999;
        color: #000000;
        font-size: .8rem;
      }
    `
    styleElement.textContent += tabSettings;
  })
  console.log(styleElement.textContent)

  // <style>要素を<head>要素に追加
  doc.head.appendChild(styleElement);

  // clear body
  body = doc.querySelector('body');
  removeAllChildren(body);

  // format
  extractedEntries.forEach( (entry, index, entries) => {
    if (index===0 || (index>0 && entry.tabName !== entries[index-1].tabName)){
    tab = doc.createElement('div');
    tab.className = `tab t${tabNameList.indexOf(entry.tabName)}`
    body.appendChild(tab)

    tabTitle = doc.createElement('div');
    tabTitle.className = 'tabtitle';
    tabTitle.innerHTML = entry.tabName;
    tab.appendChild(tabTitle);
    }

    statement = doc.createElement('p');
    statement.className = `player p${playerColorList.findIndex((playerColor) => 
      playerColor.playerName === entry.playerName && playerColor.color === entry.color)}`;
    statement.innerHTML = `<b>${entry.playerName}</b>${entry.content}`;
    tab.appendChild(statement);
    
  })

}