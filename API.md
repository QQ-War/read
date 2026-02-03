# Read 后端 API 路由清单（从源码提取）

基础前缀: `/api/{v}`（即 /api/v1, /api/v2 等）

## HomeController (HomeController.kt)
- `/`
- `/forget`
- `/reg`
- `/regester`
- `/needcode`
- `/sendResetCode`
- `/resetPassword`
- `/ua`

## LocalBookController (LocalBookController.kt)
- `/searchlocalbook`
- `/searchlocalbook2`
- `/getlocalbookinfo`
- `/getlocalbookinfoChapterList`
- `/getlocalbookinfoContent`

## QApiController (QApiController.kt)
- `/qapi`
- `/check`
- `/getcode`
- `/login`
- `/changeSourcePermission`
- `/changePermission`
- `/regester`
- `/searchByEmail`

## BookSourceController (admin/BookSourceController.kt)
- `/admin`
- `/seachbookSource`
- `/uploadSource`
- `/delbookSource`
- `/delbookSources`
- `/stopbookSource`
- `/stopbookSourceExplore`
- `/topSource`

## CodeController (admin/CodeController.kt)
- `/admin`
- `/seachcode`
- `/addcode`
- `/delcode`
- `/delcodes`

## HomeController (admin/HomeController.kt)
- `/admin`

## LoginContorller (admin/LoginContorller.kt)
- `/admin`
- `/login`
- `/logout`

## RssSourceController (admin/RssSourceController.kt)
- `/admin`
- `/seachrssSource`
- `/delRssSource`
- `/delRssSources`
- `/stopRssSource`
- `/topRssSource`
- `/uploadRssSource`

## UserController (admin/UserController.kt)
- `/admin`
- `/adduser`
- `/getuser`
- `/seachusers`
- `/deluser`
- `/delusers`

## ApiWebSocket (api/ApiWebSocket.kt)
- `$routepath/ws`

## BookController (api/BookController.kt)
- `/api/{v}`
- `/searchBook`
- `/exploreBook`
- `/saveBookInfo`
- `/urlsaveBook`
- `/saveBook`
- `/saveBooks`
- `/refreshBook`
- `/getBookinfo`
- `/getBookinfo2`
- `/deleteBook`
- `/deleteBooks`
- `/updateuseReplaceRule`
- `/getcancache`
- `/getcancachelist`
- `/addCache`
- `/delCache`
- `/saveCookies`
- `/getCookies`
- `/savehtml`
- `/cleancookies`
- `/cleancaches`
- `/noCookies`

## BookGroupController (api/BookGroupController.kt)
- `/api/{v}`
- `/getgroup`
- `/addgroup`
- `/delgroup`
- `/editgroup`
- `/setgroup`
- `/setgroups`
- `/ordergroup`

## BookMarkController (api/BookMarkController.kt)
- `/api/{v}`
- `/addbookmark`
- `/getbookmark`
- `/delbookmark`

## BookshelfController (api/BookshelfController.kt)
- `/api/{v}`
- `/getBookshelfPage`
- `/getBookshelfNew`
- `/getgroupNew`
- `/addreadchapter`

## DebugWebSocket (api/DebugWebSocket.kt)
- `$routepath/debug`

## GroundController (api/GroundController.kt)
- `/api/{v}`
- `/getallgroundPage`
- `/getallgroundNew`
- `/addground`
- `/delground`
- `/getallground`
- `/importground`

## ItemController (api/ItemController.kt)
- `/api/{v}`
- `/getitem`
- `/setitem`

## LocalBookController (api/LocalBookController.kt)
- `/api/{v}`
- `/importBookPreview`
- `/uploadimage`

## ReadController (api/ReadController.kt)
- `/api/{v}`
- `/getChapterList`
- `/getBookContent`
- `/getBookContentNew`
- `/getChapterListNew`
- `/fetchBookContent`
- `/fetchBook`
- `/chapterPackage`
- `/saveBookProgress`
- `/getBookread`
- `/setBookSource`
- `/getBookshelf`
- `/getSourcesloginui`
- `/getBookSources`
- `/getBookSourcesExploreUrl`
- `/getopenurl`
- `/svgtopng`
- `/listen`
- `/getjson`
- `/imageDecode`
- `/getLoginInfo`
- `/getVariable`
- `/setVariable`
- `/getbookVariable`
- `/setbookVariable`
- `/putLoginInfo`
- `/action`
- `/payAction`
- `/payAction2`
- `/changebooktype`
- `/proxypng`
- `/pdfImage`

## ReplaceRuleController (api/ReplaceRuleController.kt)
- `/api/{v}`
- `/getdefaultrule`
- `/getReplaceRulesPage`
- `/getReplaceRulesNew`
- `/addReplaceRule`
- `/topReplaceRule`
- `/delReplaceRule`
- `/delReplaceRules`
- `/stopReplaceRules`
- `/stopReplaceRulesbyIds`
- `/startReplaceRulesbyIds`
- `/saverules`
- `/saverule`

## RssController (api/RssController.kt)
- `/api/{v}`
- `/getRssSourcessPage`
- `/getRssSourcessNew`
- `/getRssSourcess`
- `/rssshouldOverrideUrlLoading`
- `/getRssSources`
- `/editRssSources`
- `/topRssSource`
- `/bottomallrssSource`
- `/topallrssSource`
- `/bottomRssSource`
- `/editrsssourcegroup`
- `/delRssSource`
- `/stopRssSource`
- `/startRssSources`
- `/stopRssSources`
- `/delRssSources`
- `/getRssSourcejson`
- `/saveRssSources`
- `/getRssSourcesloginui`
- `/getRssType`
- `/getArticles`
- `/getRsssortUrls`
- `/getRssContent`
- `/getRssLoginInfo`
- `/putRssLoginInfo`
- `/rssaction`
- `/getRssVariable`
- `/setRssVariable`
- `/getRssContenthtml`

## RssDebugWebSocket (api/RssDebugWebSocket.kt)
- `$routepath/rssdebug`

## SourceCheckDebug (api/SourceCheckDebug.kt)
- `$routepath/checkdebug`

## SourceController (api/SourceController.kt)
- `/api/{v}`
- `/getBookSourcesPage`
- `/getBookSourcesNew`
- `/getcansource`
- `/saveBookSources`
- `/saveBookSourcesv2`
- `/saveBookSource`
- `/topSource`
- `/bottomSource`
- `/delbookSource`
- `/topallSource`
- `/bottomallSource`
- `/editsourcegroup`
- `/delbookSources`
- `/getbookSources`
- `/editbookSources`
- `/stopbookSource`
- `/stopbookSources`
- `/startbookSources`
- `/stopbookSourceExplores`
- `/startbookSourceExplores`
- `/getbookSourcejson`

## TTsController (api/TTsController.kt)
- `/api/{v}`
- `/getallttsPage`
- `/getallttsNew`
- `/getalltts`
- `/getdefaulttts`
- `/addtts`
- `/deltts`
- `/delttss`
- `/savettss`
- `/tts`
- `/getttsLoginInfo`
- `/putttsLoginInfo`
- `/ttsaction`
- `/upjson`

## UserController (api/UserController.kt)
- `/api/{v}`
- `/appversion`
- `/changeSourcePermission`
- `/login`
- `/getUserInfo`
- `/changepass`
- `/getalltocken`
