// ==UserScript==
// @name         네이버 스마트 에디터 플러그인
// @version      0.2
// @description  네이버 스마트 에디터 HTML 소스 삽입, 텍스트 에디터 단축키 기능 추가
// @author       윤정도(Jungdo Yun)
// @match        https://blog.naver.com/*editor=4*
// @icon         https://www.google.com/s2/favicons?domain=naver.com
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @grant        GM_getResourceURL
// @require      https://code.jquery.com/jquery-3.6.0.slim.js
// @require      https://cdn.jsdelivr.net/npm/bootstrap@5.0.1/dist/js/bootstrap.bundle.min.js
// @resource     Css_Button https://raw.githubusercontent.com/necolas/css3-github-buttons/master/gh-buttons.css
// @resource     Css_Bootstrap5 https://cdn.jsdelivr.net/npm/bootstrap@5.0.1/dist/css/bootstrap.min.css
// @resource     Iconset_GithubButton https://raw.githubusercontent.com/necolas/css3-github-buttons/master/gh-icons.png
// @updateURL	 file://C:\Users\jungdo\Desktop\smart-editor-plugin\src\main.js
// @downloadURL	 file://C:\Users\jungdo\Desktop\smart-editor-plugin\src\main.js
// @connect      hilite.me
// ==/UserScript==
// @test-match	 https://blog.naver.com/*editor=4*
// @test-match	 *://*/*

/* ============================================================================
 * 스크립트 옵션
 * ============================================================================ */

var gb_Debug = false;		// 디버그 모드

/* ============================================================================
 * 전역 변수
 * ============================================================================ */

const gc_HiliteMeUrl = "http://hilite.me/";
const gc_HiliteMeApiUrl = "http://hilite.me/api";

const gc_Get = "GET";
const gc_Post = "POST";


/* ============================================================================
 * 이 스크립트의 시작 지점입니다.
 * ============================================================================ */

callMainIfElementIsLoaded(main);

/**
 * DOM이 로딩된 이후 메인을 호출해주는 함수
 * @param {CallBack} mainFunction
 * @param {...any} args
 */
async function callMainIfElementIsLoaded(mainFunction, element, ...args) {

	// 블로그 글쓰기 웹페이지의 document에서는 보안상의 이유로 iframe의 document에 접근할 수가 없다.
    // 따라서 글쓰기 웹페이지의 로딩할 때 이 스크립트를 호출해도 의미가 없다.
    // iframe의 src의 페이지에 로딩할 때 이 스크립트를 호출해야 iframe의 document를 사용할 수 있다.
    // 참고 : @https://stackoverflow.com/questions/10666258/chrome-userscript-error-unsafe-javascript-attempt-to-access-frame

	if (!gb_Debug && window.top === window.self) {
        // 여기는 무시 글쓰기 웹페이지에서 들어옴
        return;
    }

    if (element && element.length > 0) {
        mainFunction(args);
    } else {
        setTimeout(callMainIfElementIsLoaded, 1000, mainFunction, $('.layer_popup__1DbVn'), args); // 로딩이 아직 안된 경우 1초 뒤에 다시
    }
}


/**
 * 메인 함수
 */
async function main(...args) {

    if (!initializeStyles()) {
        console.log("initializeStyles() Failed!");
        return;
    }

    if (!initializeGUI()) {
        console.log("initializeGUI() Failed!");
        return;
    }

	if (!initializeEvents()) {
        console.log("initializeEvents() Failed!");
        return;
    }

}

/**
 * Css Link 엘리먼트를 생성합니다.
 * @param {string} url - Css 링크주소
 * @returns 
 */
function createCssElement(url) {
    var link = document.createElement("link");
    link.href = url;
    link.rel = "stylesheet";
    link.type = "text/css";
    return link;
}

/**
 * 웹사이트에 삽입할 GUI의 스타일을 초기화합니다.
 */
function initializeStyles() {
    try {
        // 라이브러리 CSS를 인젝션합니다.
        document.head.appendChild(createCssElement(GM_getResourceURL("Css_Button")));
        document.head.appendChild(createCssElement(GM_getResourceURL("Css_Bootstrap5")));
        document.head.appendChild(createCssElement(GM_getResourceURL("Iconset_GithubButton")));

        // 사용자지정 CSS를 인젝션합니다.
        GM_addStyle(`
		#hilite-tab-textrea-html-floating {
			margin-top: 10px;
			max-width: 100%;
			max-height: 100%;
		}
		
		.float-button {
			float:right;
			margin-top: 10px;
			margin-bottom: 40px;
			border-color: darkgray;
		}`);

        return true;
    } catch (exception) {
        console.log(exception);
        return false;
    }
}

/**
 * 웹사이트에 GUI를 삽입합니다.
 * @returns {Boolean} - 삽입 성공 유무
 */
async function initializeGUI() {
    try {
        var pluginButtonHtml = `
		<button type="button" class="btn btn-primary" style="margin-top:5px;" data-bs-toggle="modal" data-bs-target="#exampleModal">윤정도 플러그인</button>
		`;

        var pluginModalDialogHtml = `
         <div class="modal fade" id="exampleModal" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <nav>
                            <div class="nav nav-tabs" id="nav-tab" role="tablist">
                                <button class="nav-link active" id="nav-hilite-tab" data-bs-toggle="tab" data-bs-target="#nav-hilite" type="button" role="tab" aria-controls="nav-hilite" aria-selected="true">HTML 변환기</button>
                                <button class="nav-link" id="nav-html-inserter-tab" data-bs-toggle="tab" data-bs-target="#nav-html-inserter" type="button" role="tab" aria-controls="nav-html-inserter" aria-selected="false">HTML 삽입기</button>
                                <button class="nav-link" id="nav-settings-tab" data-bs-toggle="tab" data-bs-target="#nav-settings" type="button" role="tab" aria-controls="nav-settings" aria-selected="false">설정</button>
                            </div>
                        </nav>
                        <div class="tab-content" id="nav-tabContent">
                            <div class="tab-pane fade show active" id="nav-hilite" role="tabpanel" aria-labelledby="nav-hilite-tab">
                                <div class="form-floating">
                                    <textarea class="form-control" placeholder="Leave a comment here" id="hilite-tab-textrea-html-floating" style="height: 100px"></textarea>
                                    <label for="hilite-tab-textrea-html-floating" style="opacity: 70%">HTML로 변환할 소스코드 입력</label>
                                </div>

                                <div class="btn-group dropdown" style="margin-top: 10px">
                                    <button type="button" class="btn btn-secondary dropdown-toggle" id="hilite-tab-language-dropdown-menu-button" data-bs-toggle="dropdown" aria-expanded="false">언어 선택</button>
                                    <ul class="dropdown-menu" id="hilite-tab-language-dropdown-menu-itmes">
                                        <li><a class="dropdown-item" href="#" value="c">C</a></li>
                                        <li><a class="dropdown-item" href="#" value="cpp">C++</a></li>
										<li><a class="dropdown-item" href="#" value="csharp">C#</a></li>
										<li><a class="dropdown-item" href="#" value="java">Java</a></li>
										<li><a class="dropdown-item" href="#" value="js">JavaScript</a></li>
										<li><a class="dropdown-item" href="#" value="html">HTML</a></li>
										<li><a class="dropdown-item" href="#" value="php">PHP</a></li>
										<li><a class="dropdown-item" href="#" value="python">Python</a></li>
                                    </ul>

									<button type="button" class="btn btn-secondary dropdown-toggle" id="hilite-tab-style-dropdown-menu-button" style="margin-left:5px" data-bs-toggle="dropdown" aria-expanded="false">스타일 선택</button>
                                    <ul class="dropdown-menu" id="hilite-tab-style-dropdown-menu-itmes">
                                        <li><a class="dropdown-item" href="#" value="default">Default</a></li>
										<li><a class="dropdown-item" href="#" value="colorful">Colorful</a></li>
										<li><a class="dropdown-item" href="#" value="autumn">Autumn</a></li>
                                        <li><a class="dropdown-item" href="#" value="borland">Borland</a></li>
										<li><a class="dropdown-item" href="#" value="bw">BW</a></li>
										<li><a class="dropdown-item" href="#" value="emacs">Emacs</a></li>
										<li><a class="dropdown-item" href="#" value="friendly">Friendly</a></li>
										<li><a class="dropdown-item" href="#" value="manni">Manni</a></li>
										<li><a class="dropdown-item" href="#" value="native">Native</a></li>
										<li><a class="dropdown-item" href="#" value="tango">Tango</a></li>
										<li><a class="dropdown-item" href="#" value="trac">Trac</a></li>
										<li><a class="dropdown-item" href="#" value="vim">Vim</a></li>
                                    </ul>

                                    <div class="form-check" style="margin-left: 10px; margin-top: 5px">
                                        <input class="form-check-input" type="checkbox" value="" id="hilite-tab-lineos-checkbox" />
                                        <label class="form-check-label" for="hilite-tab-lineos-checkbox">줄번호</label>
                                    </div>
                                </div>

                                <button type="button" class="btn btn-outline-dark float-button" id="hilite-tab-button-convert-to-html">변환</button>
                            </div>
                            <div class="tab-pane fade" id="nav-html-inserter" role="tabpanel" aria-labelledby="nav-html-inserter-tab">
								<textarea name="user-message" id="html-inserter-tab-textarea" class="form-control"  placeholder="삽입하고자 하는 HTML 소스입력" style="margin-top: 10px; max-width: 100%; height: 300px;"></textarea>

								<div class="btn-group dropdown" style="margin-top: 10px">
									<input class="form-check-input" type="checkbox" value="" id="html-inserter-tab-insert-first-checkbox" />
									<label class="form-check-label" for="html-inserter-tab-insert-first-checkbox" style="margin-left: 5px;">맨 앞에 삽입</label>
								</div>

								<button type="button" class="btn btn-outline-dark float-button" id="html-inserter-tab-insert-button">삽입</button>
							</div>
                            <div class="tab-pane fade" id="nav-settings" role="tabpanel" aria-labelledby="nav-settings-tab"></div>
                        </div>

                        <!-- <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                            <button type="button" class="btn btn-primary">Save changes</button>
                        </div> -->
                    </div>
                </div>
            </div>
        </div>
		`;

        var pluginModalDialogNode = $('<div id="mega-punch"></div>')
		var pluginButtonNode = $('<div></div>');

        pluginModalDialogNode.html(pluginModalDialogHtml);
		pluginButtonNode.html(pluginButtonHtml);

		var targetNode = $('.layer_popup__1DbVn');

		pluginModalDialogNode.insertAfter(targetNode);
		pluginButtonNode.insertAfter(targetNode);
		
		

        return true;
    } catch (exception) {
        return false;
    }
}

function initializeEvents()
{
	try {
		
		document.getElementById('hilite-tab-button-convert-to-html').onclick = onClickConvertSourceCodeToHtmlButton;
		document.getElementById('html-inserter-tab-insert-button').onclick = onClickInsertHtmlButton;

		// 드랍다운 아이템 변경 이벤트
		$("#hilite-tab-language-dropdown-menu-itmes li a").on('click', function() {
			$('#hilite-tab-language-dropdown-menu-button').text($(this).text());
			$('#hilite-tab-language-dropdown-menu-button').attr('value', $(this).attr('value'));
		});

		$("#hilite-tab-style-dropdown-menu-itmes li a").on('click', function() {
			$('#hilite-tab-style-dropdown-menu-button').text($(this).text());
			$('#hilite-tab-style-dropdown-menu-button').attr('value', $(this).attr('value'));
		});


		return true;
	} catch(exception) {
		return false;
	}
}

/**
 * 웹페이지의 소스를 다운로드 합니다.
 * @param {string} url - 다운받고자 하는 웹사이트 주소
 */
 function downloadWebStringAsync(url) {
	return new Promise(function(resolve, reject) {

		GM_xmlhttpRequest({
			method		:	gc_Get,
			url			: 	gc_HiliteMeUrl,
			onload		:	function (response) {
				
				if (response.status == 200) {
					resolve(response.responseText);
				} else {
					reject(response.status);
				}
			}
		});
	})
}

/**
 * hilite.me API를 호출합니다.
 * 
 * @param {string} code 		- HTML로 변환할 소스코드
 * @param {string} language 	- 꾸미는 언어 형식
 * @param {string} style 		- 효과
 * @param {integer} lineos 		- 줄 번호 표시 여부 (1, 0)
 */
function requestConvertSourceCodeToHtml(code, language, style, lineos)
{
	var postData = "code=" + code + "&lexer=" + language + "&style=" + style + "&linenos=" + lineos;

	GM_xmlhttpRequest({
		method		:	gc_Post,
		url			: 	gc_HiliteMeApiUrl,
		onload		:	responseConvertSourceCodeToHtml,
		data		:	postData,
		headers:    {
			"Content-Type": "application/x-www-form-urlencoded"
		}
	});
}

/**
 * 클립보드에 텍스트를 복사합니다.
 * @param {string} text - 클립보드에 복사할 문자열
 */

 function copyToClipboardText(text) {
    var $temp = $("<input>");
    $('#hilite-tab-lineos-checkbox').append($temp);
    $temp.val(text).select();
    document.execCommand("copy");
    $temp.remove();
}

/**
 * [이벤트]
 * hilite.me API 호출 결과를 처리합니다.
 * @param {*} response - API 호출 결과
 */
function responseConvertSourceCodeToHtml(response)
{
	if (response.status != 200) {
		alert('변환에 실패하였습니다. (' + response.status + ')');
		return;
	}

	$('#html-inserter-tab-textarea').val(response.responseText);
}

/**
 * [이벤트]
 * 소스코드 -> HTML 변환 버튼 클릭에 대한 이벤트를 처리합니다.
 */
function onClickConvertSourceCodeToHtmlButton()
{
	var sourceCode = $('#hilite-tab-textrea-html-floating').val();
	var selectedLanguage = $('#hilite-tab-language-dropdown-menu-button').attr('value');
	var selectedStyle = $('#hilite-tab-style-dropdown-menu-button').attr('value');
	var lineos = $('#hilite-tab-lineos-checkbox').is(":checked") ? 1 : 0;

	if (sourceCode.length == 0) {
		alert('소스코드가 입력되지 않았습니다.');
		return;
	}

	if (!selectedLanguage) {
		alert('언어가 선택되지 않았습니다.');
		return;
	}

	if (!selectedStyle) {
		alert('스타일이 선택되지 않았습니다.');
		return;
	}

	requestConvertSourceCodeToHtml(sourceCode, selectedLanguage, selectedStyle, lineos);
}


/**
 * [이벤트]
 * HTML 삽입 버튼의 클릭에 대한 이벤트를 처리합니다.
 */
function onClickInsertHtmlButton()
{
	var sourceCodeHTML = $('#html-inserter-tab-textarea').val();
	var isInsertFirst = $('#html-inserter-tab-insert-first-checkbox').is(":checked") ? true : false;
	var editorParagraphNodes = $('.se-text-paragraph-align-left');

	if (sourceCodeHTML.length == 0) {
		alert('삽입할 HTML 텍스트를 입력해주세요.');
		return;
	}
	
	if (editorParagraphNodes.length <= 1) {
		alert('Paragraph 노드가 이상합니다. HTML을 삽입할 수 없습니다.');
		return;
	}

	var insertPositionElement = editorParagraphNodes.get(isInsertFirst ? 1 : -1);
	var insertElement =	$('<iframe></iframe>')

	var iFrameDoc = insertElement[0].contentDocument || insertElement[0].contentWindow.document;
	iFrameDoc.write('<p>Some useful html</p>');
	iFrameDoc.close();

	alert(iFrameDoc);

	// insertElement.setAttribute('id', "a-b-c-d-e-f");
	// var tElem = insertElement.getElementsByTagName('body');

	// tElem[0].innerHTML = sourceCodeHTML;


	<iframe>
		<head>
		</head>
		<body><p>ffff</p></body>
		
	</iframe>

	insertPositionElement.innerHTML = "";
	insertPositionElement.appendChild(insertElement[0]);

	alert('complete');
}