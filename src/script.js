document.addEventListener('DOMContentLoaded', () => {
  // define constants
  const formatArea = document.getElementById('formatArea');
  const downloadArea = document.getElementById('downloadArea');

  // main process
  uploadButton.addEventListener('change', function () {
    const uploadFile = document.getElementById('uploadButton');
    const file = uploadFile.files[0];    
    
    // clear the format and download Area whenever upload button's input is changed
    removeAllChildren(formatArea);
    removeAllChildren(downloadArea);

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
      const logDocument = parser.parseFromString(originalLog, 'text/html');

      // extract data
      extractedData = extractDataFromLog(logDocument)
      // console.log(extractedData)
      const statements = extractedData[0];
      const characterColorList = extractedData[1];
      const tabNameList = extractedData[2];

      // create a tab setting area
      createTabSettingArea(tabNameList);

      // create a character setting area

      // create a format button 
      const formatButton = document.createElement('button');
      formatButton.innerHTML = '整形！';
      formatArea.appendChild(formatButton);

      // when format button is clicked
      formatButton.addEventListener('click', function () {
        //reader.onloadが非同期処理なので、ちょっとだけ遅延させる
        setTimeout(function () {
          // change statements, characterColorList, tabNameList, etc.
          const deleted = deleteTab(statements, tabNameList);
          const deletedStatements = deleted[0];
          const deletedTabNameList = deleted[1];
          changeTabName(deletedStatements, deletedTabNameList);
          const tabColorList = getTabColorList(deletedTabNameList);

          // format the log
          formatLog(logDocument, deletedStatements, characterColorList, deletedTabNameList, tabColorList);

          // convert the log to a text file
          const serializer = new XMLSerializer();
          const formattedLog = serializer.serializeToString(logDocument);
          
          // clear the download Area and create a download button whenever format button is clicked
          removeAllChildren(downloadArea);
          const downloadButton = document.createElement('a');
          downloadButton.innerHTML = 'ダウンロード';
          downloadButton.download = 'formatted.html';
          downloadButton.href = 'data:text/html;charset=utf-8,' + encodeURIComponent(formattedLog);
          downloadArea.appendChild(downloadButton);
        }, 1000);
      })
    }
  })
})

// remove all childern from a parent element
function removeAllChildren(parent){
  while (parent.firstChild) {
    parent.removeChild(parent.firstChild);
  }
  return;
}

// extract statements, characterColorList, and tabNameList from uploaded log
function extractDataFromLog(logDocument) {
  const statements = [];
  const characterColorStringSet = new Set();
  const tabNameSet = new Set();

  // extract data per <p> tag
  const paragraphElements = logDocument.querySelectorAll('p');
  paragraphElements.forEach( (paragraph) => {
    const statement = {};

    // extract color
    const style = paragraph.getAttribute('style');
    const colorMatch = /color:\s*([^;]+);/.exec(style);
    if (colorMatch) {
        statement.color = colorMatch[1];
    }
    // extract tab name
    let tabName = paragraph.children[0].innerHTML;
    tabName = tabName.replace(' [', '');
    tabName = tabName.replace(']', '');
    statement.tabName = tabName;
    // extract character name
    statement.characterName = paragraph.children[1].innerHTML;
    // extract text
    statement.content = paragraph.children[2].innerHTML;

    statements.push(statement);

    // get a combination of character and color (as text temporary)
    const characterColorPairString = JSON.stringify({ characterName: statement.characterName, color: statement.color });
    characterColorStringSet.add(characterColorPairString);

    tabNameSet.add(statement.tabName);
  });

  const characterColorList = Array.from(characterColorStringSet).map(JSON.parse); // text -> dictionary
  const tabNameList = Array.from(tabNameSet)

  return [statements, characterColorList, tabNameList];
}

function formatLog(logDocument, statements, characterColorList, tabNameList, tabColorList) {
  // add <style> to <head>
  const style = logDocument.createElement('style');
  const styleContent = setStyleContent(characterColorList, tabNameList, tabColorList);
  style.innerHTML = styleContent
  logDocument.head.appendChild(style);

  // clear body
  removeAllChildren(logDocument.body);

  // relocate statements
  statements.forEach( (statement, index, statements) => {
    // output statements in the same tab together
    if (index===0 || (index>0 && statement.tabName !== statements[index-1].tabName)){
      tab = logDocument.createElement('div');
      tab.className = `tab t${tabNameList.indexOf(statement.tabName)}`
      logDocument.body.appendChild(tab)

      tabTitle = logDocument.createElement('div');
      tabTitle.className = 'tabtitle';
      tabTitle.innerHTML = statement.tabName;
      tab.appendChild(tabTitle);
    }

    formattedStatement = logDocument.createElement('p');
    formattedStatement.className = `character c${characterColorList.findIndex((characterColor) => 
      characterColor.characterName === statement.characterName && characterColor.color === statement.color)}`;
    formattedStatement.innerHTML = `<b>${statement.characterName}</b>${statement.content}`;
    tab.appendChild(formattedStatement);
    
  })

}

function setStyleContent (characterColorList, tabNameList, tabColorList){
  // set the basic style
  let styleContent = `
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
    .character {
      margin: 0;
      padding: 0 .5rem;
      padding-left: 10.5rem;
      border-bottom: 1px dotted transparent;
      border-color: inherit;
      position: relative;
    }
    .character:last-child {
      border-bottom: 0;
    }
    .character b {
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
    .tabtitle + .character {
      padding-top: .7rem;
    }
    .tabtitle + .character b {
      padding-top: .7rem;
      height: calc(100% - .7rem);
    }
    .diceroll {
      padding: 0 .5em;
      color: #ffffff;
    }
  `;

  // set tab style
  tabNameList.forEach ( (tab, index) => {
    const checkReduceFontSize = document.getElementById(`reduceFontSize${index}`).checked;
    const fontSize = checkReduceFontSize ? '0.6rem' : '0.8rem';
    const tabTitleFontSize = checkReduceFontSize ? '0.7rem' : '1rem';

    tabStyle = `

      /* [${tab}] タブ */
      .t${index} {
        background-color: ${tabColorList[index]};
        border-color: #999999;
        color: #000000;
        font-size: ${fontSize};
      }
      .t${index} .tabtitle {
        font-size: ${tabTitleFontSize};
      }
    `
    styleContent += tabStyle;
  })

  // set character style
  characterColorList.forEach ( (character, index) => {
    characterStyle = `

      /* 発言者：${character.characterName} */
      .c${index} { color: ${character.color}; }
      .c${index} .diceroll { background-color: ${character.color}; }
    `
    styleContent += characterStyle;
  })

  return styleContent;
}

function createTabSettingArea(tabNameList){
  const tabSettingArea = document.createElement('div');
  formatArea.appendChild(tabSettingArea);

  // テーブルを作成
  const table = document.createElement('table');
  table.style.width = '100%';
  table.style.borderCollapse = 'collapse';
  tabSettingArea.appendChild(table);

  // テーブルヘッダー行を作成
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');

  const headerCells = ['表示タブ', 'タブ名', 'タブ色', 'タブ名変更', '文字を小さくする'];
  headerCells.forEach(headerText => {
    const th = document.createElement('th');
    th.textContent = headerText;
    th.style.border = '1px solid #000';
    th.style.padding = '8px';
    headerRow.appendChild(th);
  });

  thead.appendChild(headerRow);
  table.appendChild(thead);

  // テーブルボディを作成
  const tbody = document.createElement('tbody');
  table.appendChild(tbody);

  tabNameList.forEach((tabName, index) => {
    //const tabSetting = document.createElement('div');
    // tabSetting.style.display = 'flex'; // 横並びにするためのスタイル
    // tabSetting.style.alignItems = 'center'; // 中央揃えにするためのスタイル
    // tabSetting.style.marginBottom = '10px'; // 各行の間にスペースを追加
    //tabSettingArea.appendChild(tabSetting);


    const row = document.createElement('tr');
    row.style.border = '1px solid #000';

    const checkTabCell = document.createElement('td');
    const checkTab = document.createElement('input');
    checkTab.type = 'checkbox';
    checkTab.id = `checkTab${index}`;
    checkTab.value = 'isChecked';
    checkTab.checked = true;
    checkTabCell.appendChild(checkTab);
    checkTabCell.style.border = '1px solid #000';
    checkTabCell.style.padding = '8px';
    row.appendChild(checkTabCell);

    const tabNameCell = document.createElement('td');
    const tabNameLabel = document.createElement('label');
    tabNameLabel.innerHTML = `${tabName}`;
    tabNameCell.appendChild(tabNameLabel);
    tabNameCell.style.border = '1px solid #000';
    tabNameCell.style.padding = '8px';
    row.appendChild(tabNameCell);

    const colorPickerCell = document.createElement('td');
    const colorPickerInput = document.createElement('input');
    colorPickerInput.type = 'color';
    colorPickerInput.id = `tabColorPicker${index}`;
    colorPickerInput.value = '#FFFFFF';
    colorPickerInput.style.width = '30px'; // 正方形にするための幅
    colorPickerInput.style.height = '30px'; // 正方形にするための高さ
    colorPickerCell.appendChild(colorPickerInput);
    colorPickerCell.style.border = '1px solid #000';
    colorPickerCell.style.padding = '8px';
    row.appendChild(colorPickerCell);

    const tabNameInputCell = document.createElement('td');
    const tabNameInput = document.createElement('input');
    tabNameInput.type = 'text';
    tabNameInput.id = `changedTabName${index}`;
    tabNameInput.placeholder = 'タブ名を変更';
    tabNameInputCell.appendChild(tabNameInput);
    tabNameInputCell.style.border = '1px solid #000';
    tabNameInputCell.style.padding = '8px';
    row.appendChild(tabNameInputCell);

    const reduceFontSizeCell = document.createElement('td');
    const reduceFontSize = document.createElement('input');
    reduceFontSize.type = 'checkbox';
    reduceFontSize.id = `reduceFontSize${index}`;
    reduceFontSize.value = 'isChecked';
    reduceFontSize.checked = false;
    reduceFontSizeCell.appendChild(reduceFontSize);
    reduceFontSizeCell.style.border = '1px solid #000';
    reduceFontSizeCell.style.padding = '8px';
    row.appendChild(reduceFontSizeCell);

    tbody.appendChild(row);
  })
}

function getTabColorList(tabNameList){
  const tabColorList = [];

  tabNameList.forEach((tabName, index) => {
    const colorPicker = document.getElementById(`tabColorPicker${index}`);
    const tabColor = colorPicker.value;
    tabColorList.push(tabColor);
  })

  return tabColorList;
}

function deleteTab(statements, tabNameList){
  let deletedStatements = statements
  let deletedTabNameList = tabNameList
  for (let i=0; i<tabNameList.length; i++){
    const checkTabInput = document.getElementById(`checkTab${i}`);
    console.log(checkTabInput.checked)
    if (checkTabInput.checked === false){
      console.log('in');
      deletedStatements = deletedStatements.filter((statement) => {
        return statement.tabName !== tabNameList[i];
      });
      deletedTabNameList = deletedTabNameList.filter((tabName) => {
        return tabName !== tabNameList[i];
      });
    }
  }
  console.log(deletedTabNameList);
  console.log(deletedStatements);
  return [deletedStatements, deletedTabNameList];
}

function changeTabName(statements, tabNameList){
  for (let i=0; i<tabNameList.length; i++){
    const changedTabInput = document.getElementById(`changedTabName${i}`);
    const changedTabName = changedTabInput.value;

    if (changedTabName !== ""){
      statements.forEach((statement, index) => {
        if (statement.tabName === tabNameList[i]) {
            statement.tabName = changedTabName;
        }
      });
      tabNameList[i] = changedTabName;
    }
  }
}