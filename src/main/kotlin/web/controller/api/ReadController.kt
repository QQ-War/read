package web.controller.api

import book.app.App
import book.appCtx
import book.model.Book
import book.model.BookChapter
import book.model.BookSource
import book.util.*
import book.webBook.WBook
import book.webBook.analyzeRule.AnalyzeRule
import book.webBook.analyzeRule.AnalyzeUrl
import book.webBook.exception.RegexTimeoutException
import book.webBook.localBook.LocalBook
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withContext
import java.util.Collections
import org.noear.solon.annotation.*
import org.noear.solon.core.handle.Context
import org.noear.solon.core.util.DataThrowable
import org.noear.solon.data.annotation.CacheRemove
import org.noear.solon.data.cache.CacheService
import org.noear.solon.web.cors.annotation.CrossOrigin
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import web.mapper.BookCacheMapper
import web.mapper.BooklistMapper
import web.mapper.ReplaceRuleMapper
import web.mapper.SgreadMapper
import web.model.BaseSource
import web.model.ReplaceRule
import web.model.Sgread
import web.model.Users
import web.notification.Read
import web.response.*
import web.util.BigDataHelp
import web.util.SslUtils
import web.util.hash.md5
import web.util.read.BookContent
import web.util.read.BookInfo
import web.util.read.getlist
import web.util.read.MangaAntiScraping
import web.util.svg.svg2PNG
import org.apache.pdfbox.Loader
import org.apache.pdfbox.rendering.PDFRenderer
import java.io.ByteArrayOutputStream
import java.io.File
import java.net.HttpURLConnection
import java.net.URI
import java.net.URL
import kotlin.coroutines.cancellation.CancellationException



@Controller
@Mapping(routepath)
@CrossOrigin(origins = "*")
open class ReadController : BaseController() {

    
    @Inject
    lateinit var booklistMapper: BooklistMapper

    @Inject
    lateinit var bookCacheMapper: BookCacheMapper

    @Inject
    lateinit var cacheService: CacheService

   
    @Inject
    lateinit var replaceRuleMapper: ReplaceRuleMapper

    @Inject
    lateinit var sgreadMapper: SgreadMapper


    companion object {
        private val logger: Logger = LoggerFactory.getLogger(BaseController::class.java)

        fun getChapterListbycache(url: String,userid:String): Pair<List<BookChapter>?, Boolean> {
            val re: List<BookChapter>? = BigDataHelp.getChapterList(url,userid)
            var istimeout=false
            if (!re.isNullOrEmpty()) {
                logger.info("检测到目录缓存：${url}")
                val lastCheckTime= re[0].lastCheckTime?:0
                if(System.currentTimeMillis() - lastCheckTime > 24*60*60*1000){
                    logger.info("目录缓存过期：${url}")
                    istimeout=true
                }
            }
            return Pair(re,istimeout)
        }

        fun removeChapterListbycache(url: String,userid:String) {
            BigDataHelp.putChapterList(url,userid,null)
        }

        fun setChapterListbycache(url: String, re: List<BookChapter>,userid:String) {
            if (re.isNotEmpty()) {
                re[0].lastCheckTime= System.currentTimeMillis()
                BigDataHelp.putChapterList(url,userid,re)
            }
        }

        fun getBookContentbycache(url: String, index: Int,userid:String): String? {
            return BigDataHelp.getBookContent(url,userid,index)
        }

        fun setBookContentbycache(url: String, re: String, index: Int,userid:String) {
            val key = "getBookContent:${url},index:${index}"
            if (re.length > 50) {
                logger.info("添加缓存${key}")
                BigDataHelp.putBookContent(url,userid,index,re)
            }
        }

        fun removeBookContentbycache(url: String, index: Int,userid:String) {
            val key = "getBookContent:${url},index:${index}"
            logger.info("删除缓存${key}")
            BigDataHelp.putBookContent(url,userid,index,null)
        }

        fun removeallBookContentbycache(url: String,userid:String) {
            BigDataHelp.removeAllBookContent(url,userid)
        }

        fun removeBookcache(url: String,userid:String) {
            BigDataHelp.putBookInfo(url,userid,null)
        }


        fun getBookbycache(url: String,userid:String): Book? {
            val re: Book? = BigDataHelp.getBookInfo(url,userid)
            if (re != null) {
                logger.info("检测到书本缓存：${url}")
            }
            return re
        }

        fun setBookbycache(url: String, book: Book,userid:String) {
            BigDataHelp.putBookInfo(url,userid,book)
        }
    }

    private  fun getChapterList(accessToken: String?, bookSourceUrl: String?, url: String,user: Users) = runBlocking {
        val (old,istimeout)=getChapterListbycache(url,user.id!!)
        if(!istimeout && !old.isNullOrEmpty()){
            logger.info("目录缓存使用成功")
            return@runBlocking old
        }
        logger.info("书本：${url}，查询目录")
        var chapters:List<BookChapter>?=null
        runCatching {
            when {
                bookSourceUrl == "loc_book" -> getlist(url).let {
                    setChapterListbycache(url, it,user.id!!)
                    chapters=it
                }

                else -> {
                    val source = getsource(user ,bookSourceUrl)
                    getlist(url, source, user, accessToken ?: "").let {
                        runCatching {
                            val book = booklistMapper.getbook(user.id!!, url)
                            if(book != null) {
                                val lastCheckTime=System.currentTimeMillis()
                                val lastCheckCount=it.size
                                if (it.size != book.totalChapterNum ){
                                    val totalChapterNum=it.size
                                    val latestChapterTitle=it[it.size-1].title
                                    val latestChapterTime=System.currentTimeMillis()
                                    booklistMapper.updatetime(book.id!!,latestChapterTitle,latestChapterTime,lastCheckTime,lastCheckCount, totalChapterNum )
                                    bookCacheMapper.getCache(book.userid!!,book.id!!).let {it1->
                                        if(it1!=null){
                                            bookCacheMapper.updatetime(it1.id!!,totalChapterNum)
                                        }
                                    }
                                }else{
                                    booklistMapper.updatetimefail(book.id!!,lastCheckTime,lastCheckCount)
                                }
                                web.notification.Book.sendNotification(user)
                            }
                        }
                        chapters=it
                    }
                }
            }
        }.getOrElse {
            App.log("目录加载出错:"+it.message,accessToken!!)
            if(!old.isNullOrEmpty()){
                return@runBlocking old
            }
            throw DataThrowable().data(JsonResponse(false, it.message?:"目录加载出错"))
        }
        chapters
    }

    @Mapping("/getChapterList")
    fun getChapterList(accessToken: String?, bookSourceUrl: String?, url: String?) = runBlocking {
        if (url == null) throw DataThrowable().data(JsonResponse(false, NOT_BANK))
        val user = getuserbytocken(accessToken)
        JsonResponse(true).Data(getChapterList(accessToken,bookSourceUrl,url,user))
    }

    private   fun getBookContent(
        accessToken: String?, bookSourceUrl: String?, url: String, index: Int?, type: Int?,user: Users
    ) = runBlocking {
        if (type != 1) {
            val txt = getBookContentbycache(url, index ?: 0,user.id!!)
            if (!txt.isNullOrEmpty()) {
                logger.info("正文缓存使用成功")
                return@runBlocking txt
            }
        }
        logger.info("书本：${url}，查询：${index}")
        when {
            bookSourceUrl == "loc_book" -> {
                var (chapterlist,_) = getChapterListbycache(url,user.id!!)
                if (chapterlist == null) {
                    chapterlist = getlist(url).also {
                        setChapterListbycache(url, it,user.id!!)
                    }
                }
                if (chapterlist.isEmpty()) {
                    throw DataThrowable().data(JsonResponse(false, "目录为空"))
                }
                val safeIndex = (index ?: 0).coerceIn(0, chapterlist.size - 1)
                if (safeIndex != (index ?: 0)) {
                    logger.warn("章节索引越界，已自动修正: index=${index} size=${chapterlist.size} -> $safeIndex")
                }
                val book = Book.initLocalBook(url, url, "")
                val rawContent = LocalBook.getContent(book, chapterlist[safeIndex]).toString()
                val content = normalizeLocalAssetUrls(rawContent)
                if (content.contains("pdfImage")) {
                    val booklist = booklistMapper.getbook(user.id!!, url)
                    if (booklist != null && booklist.type != 2) {
                        booklistMapper.changetype(booklist.id!!, 2)
                    }
                }
                content.let {
                    setBookContentbycache(url, it, index ?: 0,user.id!!)
                    it
                }
            }

            else -> {
                val source = getsource(accessToken, bookSourceUrl)
                val re = BookContent.getbookcontent(accessToken ?: "", user, source, url, index ?: 0, type ?: 0)
                re
            }
        }
    }


    @Mapping("/getBookContent")
    fun getBookContent(
        ctx: Context, accessToken: String?, bookSourceUrl: String?, url: String?, index: Int?, type: Int?
    ) = runBlocking {
        if (url == null) throw DataThrowable().data(JsonResponse(false, NOT_BANK))
        val user = getuserbytocken(accessToken)
        val content = getBookContent(accessToken,bookSourceUrl,url,index,type,user)
        val baseUrl = ctx.url().substringBefore("/api")
        val processedContent = content.replace("@@baseUrl@@", "$baseUrl/api/v$apiversion")
        if (processedContent.contains("pdfImage")) {
            logger.info("PDF图片模式输出内容: $processedContent")
        }
        JsonResponse(true).Data(processedContent)
    }

    @Mapping("/getBookContentNew")
    fun getBookContentNew(
        ctx: Context, accessToken: String?, bookSourceUrl: String?, url: String?, index: Int?, type: Int?, bookname: String?,useReplaceRule:Int?
    ) = runBlocking {
        if (url == null) throw DataThrowable().data(JsonResponse(false, NOT_BANK))
        val user = getuserbytocken(accessToken)
        var re=getBookContent(accessToken,bookSourceUrl,url,index,type,user)
        val  effectiveReplaceRules:MutableList<ReplaceRule> = mutableListOf()
        if(type == 0 && !bookname.isNullOrBlank() && useReplaceRule == 1 ){
            val rules=replaceRuleMapper.getrulebybookname(user.id!!,"%$bookname%",bookSourceUrl?:"").filter {
                it.scopeContent && (it.excludeScope == null || it.excludeScope == "" || (!it.excludeScope!!.contains(bookname) &&  !it.excludeScope!!.contains(bookSourceUrl?:"111")))
            }
            logger.info("获取到${rules.size}条规则")
            re = re.lines().joinToString("\n") { it.trim() }
            rules.forEach {item ->
                if (item.pattern.isEmpty()) {
                    return@forEach
                }
                try {
                    val tmp = if (item.isRegex) {
                        re.replace(
                            item.pattern,
                            item.replacement,
                            item.getValidTimeoutMillisecond()
                        )
                    } else {
                        re.replace(item.pattern, item.replacement)
                    }
                    if (re != tmp) {
                        effectiveReplaceRules.add(item)
                        re = tmp
                    }
                } catch (e: RegexTimeoutException) {
                    replaceRuleMapper.changeEnabled(item.id!!,false)
                    logger.info(e.message)
                    App.log("替换净化:"+e.message,accessToken!!)
                } catch (_: CancellationException) {
                    logger.info("取消了")
                } catch (e: Exception) {
                    App.log("替换净化: 规则 ${item.name}替换出错.",accessToken!!)
                    logger.info("替换净化: 规则 ${item.name}替换出错.\n", e)
                }
            }
            logger.info("生效${effectiveReplaceRules.size}条规则")
        }
        val baseUrl = ctx.url().substringBefore("/api")
        val processedRe = re.replace("@@baseUrl@@", "$baseUrl/api/v$apiversion")
        if (processedRe.contains("pdfImage")) {
            logger.info("PDF图片模式(New)输出内容: $processedRe")
        }
        JsonResponse(true).Data(mapOf("rules" to effectiveReplaceRules,"text" to processedRe))
    }

    @Mapping("/getChapterListNew")
    fun getChapterListNew(accessToken: String?, bookSourceUrl: String?, url: String?, bookname: String?,useReplaceRule:Int?,needRefresh:Int?) = runBlocking {
        if (url == null) throw DataThrowable().data(JsonResponse(false, NOT_BANK))
        val user = getuserbytocken(accessToken)
        if (needRefresh == 1) {
            removeChapterListbycache(url,user.id!!)
        }
        val chapters=getChapterList(accessToken,bookSourceUrl,url,user)
        if(!bookname.isNullOrBlank() && useReplaceRule == 1){
            val rules=replaceRuleMapper.getrulebybookname(user.id!!,"%$bookname%",bookSourceUrl?:"").filter {
                it.scopeTitle && (it.excludeScope == null || it.excludeScope == "" || (!it.excludeScope!!.contains(bookname) &&  !it.excludeScope!!.contains(bookSourceUrl?:"111")))
            }
            if(rules.isNotEmpty()){
                chapters?.forEach{
                    rules.forEach {item ->
                        if (item.pattern.isNotEmpty()) {
                            try {
                                val tmp = if (item.isRegex) {
                                    it.title.replace(
                                        item.pattern,
                                        item.replacement,
                                        item.getValidTimeoutMillisecond()
                                    )
                                } else {
                                    it.title.replace(item.pattern, item.replacement)
                                }
                                if (it.title != tmp) {
                                    it.title = tmp
                                }
                            } catch (e: RegexTimeoutException) {
                                replaceRuleMapper.changeEnabled(item.id!!,false)
                                logger.info(e.message)
                                App.log("替换净化:"+e.message,accessToken!!)
                            } catch (_: CancellationException) {
                                logger.info("取消了")
                            } catch (e: Exception) {
                                App.log("替换净化: 规则 ${item.name}替换出错.",accessToken!!)
                                logger.info("替换净化: 规则 ${item.name}替换出错.\n", e)
                            }
                        }
                    }
                }
            }
        }
        JsonResponse(true).Data(chapters)
    }

    @Mapping("/fetchBookContent")
    fun fetchBookContent(accessToken: String?,url: String?, index: Int?) = runBlocking {
        if (url == null) throw DataThrowable().data(JsonResponse(false, NOT_BANK))
        val user = getuserbytocken(accessToken)
        removeBookContentbycache(url, index ?: 0,user.id!!)
       // removeChapterListbycache(url, user.id!!)
        JsonResponse(true)
    }

    @Mapping("/fetchBook")
    fun fetchBook(accessToken: String?,url: String?) = runBlocking {
        if (url == null) throw DataThrowable().data(JsonResponse(false, NOT_BANK))
        val user = getuserbytocken(accessToken)

        removeBookcache(url,user.id!!)
        removeChapterListbycache(url,user.id!!)
        removeallBookContentbycache(url,user.id!!)
        val booktolist=booklistMapper.getbook(user.id!!,url)
        if(booktolist != null){
            bookCacheMapper.getCache(user.id!!,booktolist.id!!).also {
                if(it != null){
                    bookCacheMapper.deleteById(it.id)
                }
            }
        }
        JsonResponse(true)
    }

    @Mapping("/chapterPackage")
    open fun chapterPackage(ctx: Context, accessToken: String?, bookSourceUrl: String?, url: String?, index: Int?, type: Int?) = runBlocking {
        if (url == null || index == null) throw DataThrowable().data(JsonResponse(false, NOT_BANK))
        val user = getuserbytocken(accessToken)
        
        logger.info("开始打包章节图片: book=$url, index=$index")
        
        // 1. 获取章节内容
        val content = getBookContent(accessToken, bookSourceUrl, url, index, type, user)
        
        // 2. 提取图片 URL (严格按优先级提取)
        val imageUrls = extractImageUrlsByPriority(content)
        
        if (imageUrls.isEmpty()) {
            logger.warn("该章节未发现图片内容")
            throw DataThrowable().data(JsonResponse(false, "No images found in this chapter"))
        }

        // 3. 准备临时目录
        val timestamp = System.currentTimeMillis()
        val tempDir = File(appCtx.externalFiles, "temp/package/$timestamp")
        tempDir.mkdirs()
        
        val baseUrl = ctx.url().substringBefore("/api")
        val apiBase = "$baseUrl/api/v$apiversion"
        
        val files = Collections.synchronizedList(mutableListOf<File>())
        
        try {
            // 4. 并发下载图片 (限制最大并发数为 5)
            val dispatcher = Dispatchers.IO.limitedParallelism(5)
            withContext(dispatcher) {
                imageUrls.mapIndexed { i, imgUrl ->
                    async {
                        val fileName = String.format("%03d.png", i + 1)
                        val file = File(tempDir, fileName)
                        
                        runCatching {
                            val imageData = fetchImageDataInternal(ctx, accessToken, bookSourceUrl, imgUrl, apiBase)
                            if (imageData != null && imageData.isNotEmpty()) {
                                file.writeBytes(imageData)
                                files.add(file)
                            }
                        }.onFailure {
                            logger.error("图片下载失败 ($i): $imgUrl - ${it.message}")
                        }
                    }
                }.awaitAll()
            }
            
            if (files.isEmpty()) {
                throw DataThrowable().data(JsonResponse(false, "Failed to download any images"))
            }
            
            // 5. 打包 ZIP
            val zipFile = File(tempDir, "chapter_${index}_${timestamp}.zip")
            files.sortBy { it.name } 
            book.util.ZipUtils.zipFiles(files, zipFile)
            
            // 6. 返回 ZIP 文件
            ctx.contentType("application/zip")
            ctx.headerSet("Content-Disposition", "attachment; filename=\"chapter_${index}.zip\"")
            zipFile.inputStream().use { input ->
                input.copyTo(ctx.outputStream())
            }
        } finally {
            // 延迟清理临时文件，确保流传输完成（避免阻塞当前请求）
            CoroutineScope(Dispatchers.IO).launch {
                delay(60000)
                tempDir.deleteRecursively()
            }
        }
    }

    private fun extractImageUrlsByPriority(content: String): List<String> {
        val imgTags = """<img[^>]+>""".toRegex(RegexOption.IGNORE_CASE).findAll(content)
        return imgTags.map { tagMatch ->
            val tag = tagMatch.value
            // 优先级: data-src > src > data-original
            extractAttr(tag, "data-src") 
                ?: extractAttr(tag, "src") 
                ?: extractAttr(tag, "data-original")
        }.filterNotNull().distinct().toList()
    }

    private fun extractAttr(tag: String, attr: String): String? {
        val regex = """$attr\s*=\s*['"]([^'"]+)['"]""".toRegex(RegexOption.IGNORE_CASE)
        return regex.find(tag)?.groupValues?.get(1)
    }

    private suspend fun fetchImageDataInternal(ctx: Context, accessToken: String?, bookSourceUrl: String?, imgUrl: String, apiBase: String): ByteArray? {
        val resolvedImgUrl = imgUrl.replace("@@baseUrl@@", apiBase)
        
        // 安全边界：严格校验 http:// 或 https://
        if (!resolvedImgUrl.startsWith("http://", ignoreCase = true) && 
            !resolvedImgUrl.startsWith("https://", ignoreCase = true) && 
            !resolvedImgUrl.startsWith("/")) {
             return null
        }

        if (resolvedImgUrl.startsWith(apiBase)) {
            val uri = URI(resolvedImgUrl)
            val queryParams = uri.query?.split("&")?.associate {
                val parts = it.split("=", limit = 2)
                parts[0] to (if (parts.size > 1) java.net.URLDecoder.decode(parts[1], "UTF-8") else "")
            } ?: emptyMap()

            return when {
                uri.path.contains("/imageDecode") -> {
                    fetchImageDecodeInternal(accessToken, bookSourceUrl, queryParams["book"], queryParams["url"], queryParams["header"])
                }
                uri.path.contains("/proxypng") -> {
                    fetchProxyPngInternal(queryParams["url"])
                }
                uri.path.contains("/pdfImage") -> {
                    fetchPdfImageInternal(queryParams["path"], queryParams["page"]?.toIntOrNull())
                }
                else -> null
            }
        }

        val user = runCatching { getuserbytocken(accessToken) }.getOrNull()
        val userKey = user?.id?.toString() ?: "guest"
        // 直接外部 URL 缓存（带用户维度）
        val sign = "direct_${userKey}_${resolvedImgUrl.md5()}"
        val valueFile = File(pngDir, sign)
        if (valueFile.exists()) {
            return valueFile.readBytes()
        }
        
        return runCatching {
            val url = URL(resolvedImgUrl)
            
            // SSRF 防御: 过滤内网 IP
            if (isInternalAddress(url.host)) {
                logger.warn("阻止内网访问: ${url.host}")
                return null
            }

            val connection = url.openConnection() as HttpURLConnection
            connection.requestMethod = "GET"
            connection.setRequestProperty("User-Agent", "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Mobile/15E148 Safari/604.1")
            connection.connectTimeout = 10000
            connection.readTimeout = 15000
            if (connection.responseCode == HttpURLConnection.HTTP_OK) {
                val data = connection.inputStream.readBytes()
                if (data.isNotEmpty()) {
                    valueFile.writeBytes(data)
                }
                data
            } else null
        }.getOrNull()
    }

    private fun isInternalAddress(host: String): Boolean {
        return try {
            val addr = java.net.InetAddress.getByName(host)
            addr.isSiteLocalAddress || addr.isLoopbackAddress || addr.isLinkLocalAddress
        } catch (e: Exception) {
            false
        }
    }

    private suspend fun fetchImageDecodeInternal(accessToken: String?, bookSourceUrl: String?, ibook: String?, url: String?, header: String?): ByteArray? {
        if (url.isNullOrBlank()) return null
        val (user, source) = getsourceuser(accessToken, bookSourceUrl)
        if (user.AllowImg != true) return null

        val sign = "decode_${user.id}_${(bookSourceUrl ?: "").md5()}_${url.md5()}"
        val valueFile = File(pngDir, sign)
        if (valueFile.exists()) {
            return valueFile.readBytes()
        }
        
        val geturl = URI(url).toURL()
        // SSRF 防御: 过滤内网 IP
        if (isInternalAddress(geturl.host)) {
            logger.warn("阻止内网访问: ${geturl.host}")
            return null
        }
        val connection = geturl.openConnection() as HttpURLConnection
        connection.requestMethod = "GET"
        runCatching {
            val json = Gson().fromJson<Map<String, String>>(header, Map::class.java)
            json.forEach { (k, v) -> connection.setRequestProperty(k, v) }
        }
        connection.connectTimeout = 20 * 1000
        connection.readTimeout = 20 * 1000
        
        if (connection.responseCode == HttpURLConnection.HTTP_OK) {
            val s = BookSource.fromJson(source.json).getOrNull() ?: return null
            s.usertocken = accessToken
            s.userid = user.id
            val data = if (s.hasimageDecode()) {
                var book: Book? = null
                if (!ibook.isNullOrBlank()) {
                    runCatching { book = GSON.fromJson(ibook, Book::class.java) }
                }
                runCatching { s.DeimageDecode(src = url, inputStream = connection.inputStream, book = book) }.getOrElse {
                    connection.inputStream.readBytes()
                }
            } else {
                connection.inputStream.readBytes()
            }

            if (data != null && data.isNotEmpty()) {
                valueFile.writeBytes(data)
            }
            return data
        }
        return null
    }

    private fun fetchProxyPngInternal(url: String?): ByteArray? {
        if (url.isNullOrBlank()) return null
        val normalizedUrl = normalizeImageUrl(url)
        val sign = normalizedUrl.md5()
        val valueFile = FileUtils.getFile(pngDir, sign)
        if (valueFile.exists()) {
            return valueFile.readBytes()
        }
        
        return runCatching {
            val (nurl, headers) = geturlandheader(url)
            val finalUrl = normalizeImageUrl(nurl)
            val requestUrl = URL(finalUrl)
            
            // SSRF 防御: 过滤内网 IP
            if (isInternalAddress(requestUrl.host)) {
                logger.warn("阻止内网访问: ${requestUrl.host}")
                return null
            }

            val connection = requestUrl.openConnection() as HttpURLConnection
            connection.requestMethod = "GET"
            connection.setRequestProperty("User-Agent", "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Mobile/15E148 Safari/604.1")
            headers.forEach { (k, v) -> connection.setRequestProperty(k, "$v") }
            
            val profile = MangaAntiScraping.resolveProfile(finalUrl)
            profile?.let { p ->
                p.referer?.let { connection.setRequestProperty("Referer", it) }
                p.userAgent?.let { connection.setRequestProperty("User-Agent", it) }
                p.extraHeaders.forEach { (k, v) -> connection.setRequestProperty(k, v) }
            }
            
            if (connection.getRequestProperty("Referer") == null) {
                requestUrl.host?.let { connection.setRequestProperty("Referer", "https://$it/") }
            }

            connection.connectTimeout = 15000
            connection.readTimeout = 20000
            
            if (connection.responseCode == HttpURLConnection.HTTP_OK) {
                val data = connection.inputStream.readBytes()
                valueFile.writeBytes(data)
                data
            } else null
        }.getOrNull()
    }

    private fun fetchPdfImageInternal(path: String?, page: Int?): ByteArray? {
        if (path.isNullOrBlank() || page == null) return null
        val decodedPath = kotlin.runCatching { java.net.URLDecoder.decode(path, "UTF-8") }.getOrDefault(path)
        var file = File(decodedPath)
        if (!file.exists()) {
            val idx = decodedPath.indexOf("/local/")
            if (idx >= 0) {
                val alt = File(appCtx.externalFiles, "local/${decodedPath.substring(idx + 7)}")
                if (alt.exists()) file = alt
            }
        }
        if (!file.exists()) return null

        return runCatching {
            Loader.loadPDF(file).use { document ->
                val renderer = PDFRenderer(document)
                val image = renderer.renderImageWithDPI(page, 200f)
                val bos = ByteArrayOutputStream()
                javax.imageio.ImageIO.write(image, "PNG", bos)
                bos.toByteArray()
            }
        }.getOrNull()
    }


    @Mapping("/saveBookProgress")
    open fun saveBookProgress(accessToken: String?, pos: Double?, url: String?, title: String?, index: Int?, isnew: String?) = runBlocking {
        val user = getuserbytocken(accessToken)
        val book = booklistMapper.getbook(user.id!!, url?:throw DataThrowable().data(JsonResponse(false, NOT_BANK))).also {
            if (it == null) {
                //println("添加阅读进度到内存${url}")
                cacheService.store("indexuerid:${user.id},bookurl:${url}",index,10*30)
                if(isnew == "1"){
                    val sgread= Sgread().create(user.id!!,url);
                    sgreadMapper.insertOrUpdate(sgread)
                }
                throw DataThrowable().data(JsonResponse(true))
            }
        }!!
        var read = book.readchapter ?: ""
        val s = read.split(",").toMutableSet()
        s.add((index ?: 0).toString())
        read = s.joinToString(",")
        if (book.origin == "loc_book") {
            val list: List<BookChapter> = getChapterListbycache(url!!,user.id!!).let {
                if (it.first == null){
                    getlist(url)
                }else{
                    it.first!!
                }
            }
            booklistMapper.updatepos(
                book.id!!,
                list[index ?: 0].title,
                index ?: 0,
                pos ?: 0.0,
                System.currentTimeMillis(),
                read
            )
        } else {
            val source = getsource(book.origin!!,user)
            var t=title
            if(t.isNullOrBlank()){
                val list: List<BookChapter> = getChapterListbycache(url!!,user.id!!).let {
                    if (it.first == null){
                        getlist(url, source!!, user, accessToken ?: "")
                    } else {
                        it.first!!
                    }
                }
                t=list[index ?: 0].title
            }
            booklistMapper.updatepos(
                book.id!!,
                t,
                index ?: 0,
                pos ?: 0.0,
                System.currentTimeMillis(),
                read
            )
        }
       // Companion.logger.info("read push")
        if (!accessToken.isNullOrBlank() && !url.isNullOrBlank()) {
            Read.sendNotification(user, accessToken, url)
        }
        JsonResponse(true).Data(read)
    }


    @Mapping("/getBookread")
    fun getBookread(accessToken: String?, url: String?) = runBlocking {
        val user = getuserbytocken(accessToken)
        val book = booklistMapper.getbook(user.id!!, url.also {
            if (it == null) throw DataThrowable().data(JsonResponse(false, NOT_BANK))
        }!!).also {
            if (it == null) throw DataThrowable().data(JsonResponse(false, NO_BOOK))
        }!!
        val read = book.readchapter ?: ""
        val s = read.split(",").toMutableSet()
        val list: MutableSet<Any> = mutableSetOf()
        s.forEach {
            if (it != "") {
                list.add(it)
            }
        }
        JsonResponse(true).Data(list.joinToString(","))
    }


    @Mapping("/setBookSource")
    open fun setBookSource(
        accessToken: String?, bookUrl: String?, newUrl: String?, bookSourceUrl: String?
    ) = runBlocking {
        if (newUrl.isNullOrBlank()) throw DataThrowable().data(JsonResponse(false, NOT_BANK))
        val user = getuserbytocken(accessToken)
        val book = booklistMapper.getbook(user.id!!, bookUrl.also {
            if (it == null) throw DataThrowable().data(JsonResponse(false, NOT_BANK))
        }!!).also {
            if (it == null) throw DataThrowable().data(JsonResponse(false, NO_BOOK))
        }!!
        val source = getsource(bookSourceUrl?:"",user)?: throw DataThrowable().data(JsonResponse(false, NOT_SOURCE))
        var new: Book? = null
        runCatching {
            new = BookInfo.getbookinfo(accessToken!!,user,source,newUrl)
        }.onFailure {
            val webBook = WBook(source.json , user.id!!, accessToken, false)
            webBook.searchBook(book.name ?: " ", 1).forEach {
                if (it.bookUrl == newUrl) {
                    new = it.toBook()
                }
            }
            if (new != null) {
                booklistMapper.updateById(book.bookto(new,false))
            } else {
                throw DataThrowable().data(JsonResponse(false, NO_BOOK))
            }
        }.onSuccess {
            booklistMapper.updateById(book.bookto(new!!,false))
        }
        web.notification.Book.sendNotification(user)
        bookCacheMapper.getCache(user.id!!,book.id!!).also {
            if(it != null){
                bookCacheMapper.deleteById(it.id)
            }
        }
        JsonResponse(true).Data(book)
    }

   // @Cache(key = "getBookshelf:\${accessToken}", tags = "getBookshelf", seconds = 20)
    @Mapping("/getBookshelf")
    open fun getBookshelf(accessToken: String?,version:String?,name:String?,@Path v:String?) = run {
       val reqVersion = parseApiVersion(v) ?: throw DataThrowable().data(JsonResponse(false,NEED_LOGIN))
       if(reqVersion < apiversion){
           throw DataThrowable().data(JsonResponse(false,NEED_LOGIN))
       }else  if(reqVersion > apiversion){
           throw DataThrowable().data(JsonResponse(false,NEED_LOGIN))
       }
        val user = getuserbytocken(accessToken)
        val book = if (!name.isNullOrBlank()) booklistMapper.getbooklistbyuseridandname(user.id!!,name) else booklistMapper.getbooklistbyuserid(user.id!!)
        book?.forEach {
            if (it.customCoverUrl != null && it.customCoverUrl!!.isNotBlank()) {
                it.coverUrl = it.customCoverUrl
            }
            if (it.customIntro != null && it.customIntro!!.isNotBlank()) {
                it.intro = it.customIntro
            }
            if (it.customIntro != null && it.customIntro!!.isNotBlank()) {
                it.intro = it.customIntro
            }
            if (it.durChapterPos == null) {
                it.durChapterPos = 0.0
            }
            if (it.coverUrl.isNullOrBlank() && !it.bookUrl.isNullOrBlank() && it.bookUrl!!.lowercase().endsWith(".pdf")) {
                val encodedPath = java.net.URLEncoder.encode(it.bookUrl, "UTF-8").replace("+", "%20")
                it.coverUrl = "/api/v$apiversion/pdfImage?path=$encodedPath&page=0&accessToken=${accessToken ?: ""}"
            }
        }
       JsonResponse(true,if (appversion ==version) "ok" else appversion).Data(book)
    }

    @Mapping("/getSourcesloginui")
    fun  getSourcesloginui(accessToken: String?, url: String) = run {
        val user = getuserbytocken(accessToken)
        val source :BaseSource =if(user.source == 2){
            user.id?.let {  userBookSourceMapper.getBookSource(url,it) }?.toBaseSource()
        }else{
            bookSourceMapper.getBookSource(url)?.toBaseSource()
        }?: throw DataThrowable().data(JsonResponse(false, NOT_SOURCE))
        val s=BookSource.fromJson(source.json).getOrNull()
        s?.usertocken=accessToken
        s?.userid=user.id
        var loginUi=s?.loginUi
        if(!loginUi.isNullOrEmpty()){
            runCatching {
                if ( loginUi!!.startsWith("@js:") ||  loginUi.startsWith("<js>")){
                    loginUi=s?.getloginUi()
                    val r=GSON.fromJsonArray<Any>(loginUi).getOrNull()
                    loginUi= GSON.toJson(r)
                    cacheService.store("loginUi:${accessToken}${user.source}${s?.bookSourceUrl}",loginUi,60*5)
                }else{
                    val r=GSON.fromJsonArray<Any>(loginUi).getOrNull()
                    loginUi= GSON.toJson(r)
                }
            }
        }
        JsonResponse(true).Data(loginUi)
    }

    //@Cache(key = "getBookSources", tags = "getBookSources", seconds = 600)
    @Mapping("/getBookSources")
    open fun getBookSources(accessToken: String?,isall: String?,@Path v:String? ) = run {
        val reqVersion = parseApiVersion(v) ?: throw DataThrowable().data(JsonResponse(false,NEED_LOGIN))
        if(reqVersion < apiversion){
            throw DataThrowable().data(JsonResponse(false,NEED_LOGIN))
        }else  if(reqVersion > apiversion){
            throw DataThrowable().data(JsonResponse(false,NEED_LOGIN))
        }
        val user = getuserbytocken(accessToken)
        val source: List<BaseSource> = if(isall != null && isall == "1" && user.source != 0){
            getallBookSourcelist(user)
        }else{
            getBookSourcelist(true,user)
        }
        val list: MutableList<Map<String, Any?>> = mutableListOf()
        source.forEach {
            val s=BookSource.fromJson(it.json).getOrNull()
            s?.usertocken=accessToken
            s?.userid=user.id
            var loginUi=s?.loginUi
            if(!loginUi.isNullOrEmpty()){
                runCatching {
                    val r=GSON.fromJsonArray<Any>(loginUi).getOrNull()
                    loginUi= GSON.toJson(r)
                }
            }

            list.add(
                mapOf(
                    "checkKeyWord" to s?.ruleSearch?.checkKeyWord,
                    "variableComment" to s?.variableComment,
                    "bookSourceGroup" to it.bookSourceGroup,
                    "loginUrl" to s?.loginUrl,
                    "loginUi" to loginUi,
                    "bookSourceName" to it.bookSourceName,
                    "bookSourceUrl" to it.bookSourceUrl,
                    "enabledExplore" to it.enabledExplore,
                    "enabled" to it.enabled
                )
            )
        }
        JsonResponse(true,(if(user.source == 0) "no" else "ok")).Data(list)
    }


    @Mapping("/getBookSourcesExploreUrl")
    open fun getBookSourcesExploreUrl(accessToken: String?, bookSourceUrl: String?,need: String?) = runBlocking {
        val (user,source)=getsourceuser(accessToken,bookSourceUrl)
        val booksource = BookSource.fromJson(source.json ).getOrNull()
        booksource?.userid=user.id
        booksource?.usertocken=accessToken
        JsonResponse(true).Data(mapOf("checkKeyWord" to booksource?.ruleSearch?.checkKeyWord,"found" to booksource?.exploreKinds((need == "1")), "loginUrl" to booksource?.loginUrl, "loginUi" to booksource?.loginUi))
    }

    @Mapping("/getopenurl")
    fun  getopenurl(accessToken: String?, bookSourceUrl: String?, url: String?) = run{
        val (user,source)=getsourceuser(accessToken,bookSourceUrl)
        val s= BookSource.fromJson(source.json).getOrNull()!!
        s.usertocken=accessToken
        s.userid=user.id
        val analyzeUrl = AnalyzeUrl(
            url?:"", source = s,
            debugLog = null
        )
        JsonResponse(true).Data(analyzeUrl.url)
    }

    @Mapping("/svgtopng")
    open fun svgtopng(ctx: Context, accessToken: String?, svg: String?){
        getuserbytocken(accessToken)
        if (svg.isNullOrBlank()) throw DataThrowable().data(JsonResponse(false, NOT_BANK))
        svg2PNG(svg,ctx.outputStream())
        ctx.close()
    }


    @Mapping("/listen")
    open fun listen(ctx: Context, accessToken: String?,url: String?, header: String?) = runBlocking {
        getuserbytocken(accessToken)
        if (url.isNullOrBlank()) throw DataThrowable().data(JsonResponse(false, NOT_BANK))
        val geturl = URI(url).toURL()
        
        // SSRF 防御: 过滤内网 IP
        if (isInternalAddress(geturl.host)) {
            logger.warn("阻止内网访问: ${geturl.host}")
            throw DataThrowable().data(JsonResponse(false, "禁止访问内网资源"))
        }

        val connection = geturl.openConnection() as HttpURLConnection
        connection.requestMethod = "GET"
        runCatching {
            val json= Gson().fromJson<Map<String, String>>(header, Map::class.java)
            json.forEach{(k,v)->
                connection.setRequestProperty(k,v)
            }
        }
        connection.connectTimeout = 20*1000
        connection.readTimeout = 20*1000
        val responseCode = connection.responseCode
        //  读取响应
        if (responseCode == HttpURLConnection.HTTP_OK) {
            connection.inputStream.use { i->
                val b = ByteArray(4096)
                var len: Int
                while ((i.read(b).also { it -> len = it }) != -1) {
                    ctx.outputStream().write(b, 0, len)
                }
                ctx.flush();
                ctx.close();
            }
        }else {
            logger.info("GET请求失败")
            JsonResponse(isSuccess = false,errorMsg ="GET请求失败")
        }
    }

    @Mapping("/getjson")
    open fun getjson(ctx: Context, accessToken: String?,url: String?) = runBlocking {
        getuserbytocken(accessToken)
        if (url.isNullOrBlank()) throw DataThrowable().data(JsonResponse(false, NOT_BANK))
        val geturl = URI(url).toURL()
        
        // SSRF 防御: 过滤内网 IP
        if (isInternalAddress(geturl.host)) {
            logger.warn("阻止内网访问: ${geturl.host}")
            throw DataThrowable().data(JsonResponse(false, "禁止访问内网资源"))
        }

        val connection = geturl.openConnection() as HttpURLConnection
        connection.requestMethod = "GET"
        connection.connectTimeout = 20*1000
        connection.readTimeout = 20*1000
        val responseCode = connection.responseCode
        //  读取响应
        if (responseCode == HttpURLConnection.HTTP_OK) {
            connection.inputStream.use { i->
                val b = ByteArray(4096)
                var len: Int
                while ((i.read(b).also { it -> len = it }) != -1) {
                    ctx.outputStream().write(b, 0, len)
                }
                ctx.flush();
                ctx.close();
            }
        }else {
            logger.info("GET请求失败")
            JsonResponse(isSuccess = false,errorMsg ="GET请求失败")
        }
    }


    @Mapping("/imageDecode")
    open fun imageDecode(ctx: Context, accessToken: String?, bookSourceUrl: String?, @Param("book")  ibook: String?, url: String?, header: String?) = runBlocking {
        logger.info("imageDecode:$url")
        val (user, _) = getsourceuser(accessToken, bookSourceUrl)
        if (user.AllowImg != true) {
            App.toast("没有权限进行图片解密", accessToken ?: "")
            throw DataThrowable().data(JsonResponse(false, CAN_NOT))
        }
        if (url.isNullOrBlank()) throw DataThrowable().data(JsonResponse(false, NOT_BANK))

        val bytes = fetchImageDecodeInternal(accessToken, bookSourceUrl, ibook, url, header)
        if (bytes != null && bytes.isNotEmpty()) {
            if (bytes.size > 4) {
                val hex = bytes.sliceArray(0..3).joinToString("") { "%02x".format(it) }
                when {
                    hex.startsWith("89504e47") -> ctx.contentType("image/png")
                    hex.startsWith("ffd8ff") -> ctx.contentType("image/jpeg")
                    hex.startsWith("47494638") -> ctx.contentType("image/gif")
                    hex.startsWith("52494646") -> ctx.contentType("image/webp")
                    else -> ctx.contentType("application/octet-stream")
                }
            } else {
                ctx.contentType("application/octet-stream")
            }
            ctx.outputStream().write(bytes)
            ctx.flush()
        } else {
            logger.info("imageDecode 失败")
            throw DataThrowable().data(JsonResponse(false, "图片加载或解密失败"))
        }
    }

    @Mapping("/getLoginInfo")
    open fun getLoginInfo(accessToken: String?, bookSourceUrl: String?) = run {
        val (user,source)=getsourceuser(accessToken,bookSourceUrl)
        val bookSource = BookSource.fromJson(source.json ).getOrNull()!!
        bookSource.userid = user.id
        bookSource.usertocken = accessToken
        var info = bookSource.getLoginInfo()
        if (info.isNullOrBlank()) {
            info = "{}"
        }
        JsonResponse(true).Data(info)
    }

    @Mapping("/getVariable")
    open fun getVariable(accessToken: String?, bookSourceUrl: String?) = run {
        val (user,source)=getsourceuser(accessToken,bookSourceUrl)
        val bookSource = BookSource.fromJson(source.json ).getOrNull()!!
        bookSource.userid = user.id
        bookSource.usertocken = accessToken
        val info = bookSource.getVariable()
        JsonResponse(true).Data(info)
    }

     @CacheRemove(tags = "search\${accessToken}")
    @Mapping("/setVariable")
    open fun setVariable(accessToken: String?, bookSourceUrl: String?, info: String?) = run {
        val (user,source)=getsourceuser(accessToken,bookSourceUrl)
        val bookSource = BookSource.fromJson(source.json ).getOrNull()!!
        bookSource.userid = user.id
        bookSource.usertocken = accessToken
        bookSource.setVariable(info)
        JsonResponse(true)
    }

    @Mapping("/getbookVariable")
    open fun getbookVariable(accessToken: String?, bookurl: String?) = run {
        val user = getuserbytocken(accessToken)
        val book =Book(bookUrl  =bookurl?:"")
        book.userid = user.id?:""
        val info = book.getCustomVariable()
        JsonResponse(true).Data(info)
    }

    @CacheRemove(tags = "search\${accessToken}")
    @Mapping("/setbookVariable")
    open fun setbookVariable(accessToken: String?, bookurl: String?, info: String?) = run {
        val user = getuserbytocken(accessToken)
        val book =Book(bookUrl  =bookurl?:"")
        book.userid = user.id?:""
        book.putCustomVariable(info?:"")
        JsonResponse(true)
    }

     @CacheRemove(tags = "search\${accessToken}")
    @Mapping("/putLoginInfo")
    open fun putLoginInfo(accessToken: String?, bookSourceUrl: String?, info: String?) = run {
        val (user,source)=getsourceuser(accessToken,bookSourceUrl)
        val bookSource = BookSource.fromJson(source.json ).getOrNull()!!
        bookSource.userid = user.id
        bookSource.usertocken = accessToken
        bookSource.putLoginInfo(info ?: "{}")
         runCatching { bookSource.login() }
        JsonResponse(true)
    }

    @CacheRemove(tags = "search\${accessToken}")
    @Mapping("/action")
    open fun action(accessToken: String?, bookSourceUrl: String?, action: String?, info: String?) = runBlocking {
        val (user,source)=getsourceuser(accessToken,bookSourceUrl)
        if(action == null) throw DataThrowable().data(JsonResponse(false, NOT_BANK))
        val bookSource = BookSource.fromJson(source.json).getOrNull()!!
        bookSource.userid = user.id
        bookSource.usertocken = accessToken
        if(!info.isNullOrBlank()){
            bookSource.putLoginInfo(info)
        }
        runCatching {
            bookSource.runaction(action)
        }.onFailure { e ->
           logger.info("$action JavaScript error", e)
        }
        JsonResponse(true)
    }

    @Mapping("/payAction")
    open fun  payAction(accessToken: String?, url: String?, index: Int) = runBlocking {
        val user = getuserbytocken(accessToken)
        val book=booklistMapper.getbook(user.id!!,url?:throw DataThrowable().data(JsonResponse(false, NOT_BANK)))?:
        throw DataThrowable().data(JsonResponse(false, NO_BOOK))
        if(book.origin ==  "loc_book") return@runBlocking JsonResponse(true)
        val source=getsource(book.origin!!,user)?:throw DataThrowable().data(JsonResponse(false, NOT_SOURCE))
        val bookSource = BookSource.fromJson(source.json).getOrNull()!!
        bookSource.userid = user.id
        bookSource.usertocken = accessToken
        val payAction = bookSource.getContentRule().payAction
        if (payAction.isNullOrBlank()) {
            throw DataThrowable().data(JsonResponse(false, NO_PAY))
        }
        val chapters=getChapterList(accessToken,book.origin,book.bookUrl!!,user)!!
        val b= getBookbycache(url,user.id!!)?: BookInfo.getbookinfo(accessToken!!,user,source,url)!!
        val analyzeRule = AnalyzeRule(
            ruleData = b, source = bookSource,
            debugLog = null
        )
        analyzeRule.setBaseUrl(chapters[index].url)
        analyzeRule.chapter = chapters[index]
        val re=analyzeRule.evalJS(payAction).toString()
        if (re.isAbsUrl()) {
            analyzeRule.startBrowser(re,"购买")
        }
        JsonResponse(true)
    }


    @Mapping("/payAction2")
    open fun  payAction2(accessToken: String?, bookSourceUrl:String?, url: String?, index: Int) = runBlocking {
        val user = getuserbytocken(accessToken)
        if(bookSourceUrl.isNullOrBlank() || url.isNullOrBlank()) throw DataThrowable().data(JsonResponse(false, NOT_BANK))
        val source=getsource(bookSourceUrl,user)?:throw DataThrowable().data(JsonResponse(false, NOT_SOURCE))
        val bookSource = BookSource.fromJson(source.json).getOrNull()!!
        bookSource.userid = user.id
        bookSource.usertocken = accessToken
        val payAction = bookSource.getContentRule().payAction
        if (payAction.isNullOrBlank()) {
            throw DataThrowable().data(JsonResponse(false, NO_PAY))
        }
        val chapters=getChapterList(accessToken,bookSourceUrl,url,user)!!
        val b= getBookbycache(url,user.id!!)?: BookInfo.getbookinfo(accessToken!!,user,source,url)!!
        val analyzeRule = AnalyzeRule(
            ruleData = b, source = bookSource,
            debugLog = null
        )
        analyzeRule.setBaseUrl(chapters[index].url)
        analyzeRule.chapter = chapters[index]
        val re=analyzeRule.evalJS(payAction).toString()
        if (re.isAbsUrl()) {
            analyzeRule.startBrowser(re,"购买")
        }
        JsonResponse(true)
    }


    @Mapping("/changebooktype")
    open fun changebooktype(accessToken: String?, bookUrl: String?, type: Int?) = runBlocking {
        val user = getuserbytocken(accessToken)
        val book = booklistMapper.getbook(user.id!!, bookUrl.also {
            if (it == null) throw DataThrowable().data(JsonResponse(false, NOT_BANK))
        }!!).also {
            if (it == null) throw DataThrowable().data(JsonResponse(false, NO_BOOK))
        }!!
        var type1: Int = type ?: 0
        if (type1 != 0 && type1 != 1 && type1 != 2) {
            type1 = 0
        }
        booklistMapper.changetype(book.id!!,type1)
        web.notification.Book.sendNotification(user)
        JsonResponse(true)
    }

    private val pngDir = FileUtils.createFolderIfNotExist(appCtx.externalFiles, "assets","proxy")

    private fun normalizeLocalAssetUrls(content: String): String {
        var output = content
        val patterns = listOf(
            "http//assets/" to "/assets/",
            "https//assets/" to "/assets/",
            "http:/assets/" to "/assets/",
            "https:/assets/" to "/assets/",
            "http://assets/" to "/assets/",
            "https://assets/" to "/assets/"
        )
        patterns.forEach { (old, new) ->
            output = output.replace(old, new, ignoreCase = true)
        }
        return output
    }

    private fun normalizeImageUrl(url: String): String {
        // 1. 剥离 Legado 附加配置后缀 (如 ,{...} 或 ,%7B...)
        var cleanUrl = url.split(",{")[0].split(",%7B")[0]
        if (cleanUrl.contains(",")) {
            val lastCommaIndex = cleanUrl.lastIndexOf(',')
            if (lastCommaIndex > cleanUrl.lastIndexOf('/')) {
                cleanUrl = cleanUrl.substring(0, lastCommaIndex)
            }
        }

        // 2. 域名纠错 (Normalization)
        if (cleanUrl.contains("bzmh.net")) {
            cleanUrl = cleanUrl.replace("bzmh.net", "bzcdn.net")
        }
        if (cleanUrl.contains("godamanga.com")) {
            cleanUrl = cleanUrl.replace("godamanga.com", "cncover.godamanga.online")
        }
        if (cleanUrl.contains("g-mh.org")) {
            cleanUrl = cleanUrl.replace("g-mh.org", "cncover.godamanga.online")
        }
        
        return cleanUrl.trim()
    }

    @Mapping("/proxypng")
    open fun proxypng(ctx: Context, url: String?, accessToken: String?) = run {
        if (url.isNullOrBlank()) throw DataThrowable().data(JsonResponse(false, NOT_BANK))
        getuserbytocken(accessToken)
        
        val normalizedUrl = normalizeImageUrl(url)
        logger.info("proxypng normalized: $normalizedUrl")

        if (normalizedUrl.startsWith("/assets/")) {
            val storageRoot = File("storage").canonicalFile
            val localFile = File("storage${normalizedUrl}").canonicalFile
            if (!localFile.path.startsWith(storageRoot.path)) {
                throw DataThrowable().data(JsonResponse(false, NOT_BANK))
            }
            if (localFile.exists() && localFile.isFile) {
                val ext = localFile.extension.lowercase()
                val contentType = when (ext) {
                    "jpg", "jpeg" -> "image/jpeg"
                    "png" -> "image/png"
                    "webp" -> "image/webp"
                    "gif" -> "image/gif"
                    else -> "application/octet-stream"
                }
                ctx.contentType(contentType)
                localFile.inputStream().use { i ->
                    val b = ByteArray(4096)
                    var len: Int
                    while ((i.read(b).also { len = it }) != -1) {
                        ctx.outputStream().write(b, 0, len)
                    }
                }
                ctx.flush()
                return@run
            }
        }
        
        val sign = normalizedUrl.md5()
        val valueFile = FileUtils.getFile(pngDir,sign)
        if(valueFile.exists()) {
            valueFile.inputStream().use { i ->
                val b = ByteArray(4096)
                var len: Int
                while ((i.read(b).also { len = it }) != -1) {
                    ctx.outputStream().write(b, 0, len)
                }
            }
            ctx.flush()
        }else{
            val (nurl , headers)=geturlandheader(url)
            val finalUrl = normalizeImageUrl(nurl)
            val requestUrl = URL(finalUrl)
            
            // SSRF 防御: 过滤内网 IP
            if (isInternalAddress(requestUrl.host)) {
                logger.warn("阻止内网访问: ${requestUrl.host}")
                throw DataThrowable().data(JsonResponse(false, "禁止访问内网资源"))
            }

            val connection = requestUrl.openConnection() as HttpURLConnection
            connection.requestMethod = "GET"
            
            // 注入移动端浏览器指纹
            connection.setRequestProperty("User-Agent", "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Mobile/15E148 Safari/604.1")
            connection.setRequestProperty("Accept", "image/webp,image/avif,image/apng,image/svg+xml,image/*,*/*;q=0.8")
            connection.setRequestProperty("Accept-Language", "zh-CN,zh;q=0.9,en;q=0.8")
            connection.setRequestProperty("Sec-Fetch-Mode", "no-cors")
            connection.setRequestProperty("Sec-Fetch-Dest", "image")
            connection.setRequestProperty("Sec-Fetch-Site", "cross-site")

            headers.forEach{(k,v)->
                connection.setRequestProperty(k,"$v");
            }
            
            // 应用站点特定的反爬规则（优先级高于书源 headers）
            val profile = MangaAntiScraping.resolveProfile(finalUrl)
            profile?.let { p ->
                p.referer?.let { connection.setRequestProperty("Referer", it) }
                p.userAgent?.let { connection.setRequestProperty("User-Agent", it) }
                p.extraHeaders.forEach { (k, v) ->
                    connection.setRequestProperty(k, v)
                }
            }
            
            if (connection.getRequestProperty("Referer") == null) {
                val host = requestUrl.host
                if (!host.isNullOrBlank()) {
                    connection.setRequestProperty("Referer", "https://$host/")
                }
            }

            connection.connectTimeout = 15000
            connection.readTimeout = 20000
            
            val responseCode = connection.getResponseCode();
            if (responseCode == HttpURLConnection.HTTP_OK) {
                val bos = ByteArrayOutputStream()
                connection.getInputStream().use {  i ->
                    val b = ByteArray(4096)
                    var len: Int
                    while ((i.read(b).also { len = it }) != -1) {
                        bos.write(b, 0, len)
                        ctx.outputStream().write(b, 0, len)
                    }
                }
                valueFile.writeBytes(bos.toByteArray())
                ctx.flush()
            } else {
                logger.info("GET请求失败: $responseCode for $finalUrl")
                JsonResponse(isSuccess = false,errorMsg ="GET请求失败")
            }
        }
    }

    @Mapping("/assets")
    open fun assets(ctx: Context, path: String?, accessToken: String?) = run {
        if (path.isNullOrBlank()) throw DataThrowable().data(JsonResponse(false, NOT_BANK))
        getuserbytocken(accessToken)

        val decodedPath = kotlin.runCatching { java.net.URLDecoder.decode(path, "UTF-8") }.getOrDefault(path)
        val normalizedPath = if (decodedPath.startsWith("/assets/")) decodedPath else "/assets/" + decodedPath.removePrefix("/")
        val storageRoot = File("storage").canonicalFile
        val localFile = File("storage${normalizedPath}").canonicalFile
        if (!localFile.path.startsWith(storageRoot.path)) {
            throw DataThrowable().data(JsonResponse(false, NOT_BANK))
        }
        if (localFile.exists() && localFile.isFile) {
            val ext = localFile.extension.lowercase()
            val contentType = when (ext) {
                "jpg", "jpeg" -> "image/jpeg"
                "png" -> "image/png"
                "webp" -> "image/webp"
                "gif" -> "image/gif"
                else -> "application/octet-stream"
            }
            ctx.contentType(contentType)
            localFile.inputStream().use { i ->
                val b = ByteArray(4096)
                var len: Int
                while ((i.read(b).also { len = it }) != -1) {
                    ctx.outputStream().write(b, 0, len)
                }
            }
            ctx.flush()
            return@run
        }
        throw DataThrowable().data(JsonResponse(false, "资源不存在"))
    }


    @Mapping("/pdfImage")
    open fun pdfImage(ctx: Context, path: String?, page: Int?, accessToken: String?) = run {
        if (path.isNullOrBlank() || page == null) throw DataThrowable().data(JsonResponse(false, NOT_BANK))
        getuserbytocken(accessToken)
        
        // 尝试解码路径
        val decodedPath = kotlin.runCatching { java.net.URLDecoder.decode(path, "UTF-8") }.getOrDefault(path)
        logger.info("请求PDF图片: $decodedPath, 页码: $page")
        
        // 安全校验: 限制文件路径，防止读取任意系统文件
        val storageRoot = File(appCtx.externalFiles, "local").canonicalFile
        var normalizedPath = when {
            decodedPath.startsWith("/storage/local/") -> decodedPath.removePrefix("/storage/local/")
            decodedPath.startsWith("storage/local/") -> decodedPath.removePrefix("storage/local/")
            decodedPath.startsWith("/local/") -> decodedPath.removePrefix("/local/")
            decodedPath.startsWith("local/") -> decodedPath.removePrefix("local/")
            else -> decodedPath
        }
        // 兼容重复前缀（如 storage/local/storage/local/...）
        while (normalizedPath.startsWith("storage/local/")) {
            normalizedPath = normalizedPath.removePrefix("storage/local/")
        }
        var file = if (normalizedPath.startsWith("/")) {
             File(normalizedPath).canonicalFile
        } else {
             File(storageRoot, normalizedPath).canonicalFile
        }

        if (!file.path.startsWith(storageRoot.path)) {
            // 如果不在 local 目录下，尝试检查是否在 externalFiles 根目录下，但仍需谨慎
            val externalRoot = appCtx.externalFiles.canonicalFile
            if (!file.path.startsWith(externalRoot.path)) {
                 logger.warn("拒绝访问非法路径: ${file.path}")
                 throw DataThrowable().data(JsonResponse(false, "非法的文件路径"))
            }
        }

        if (!file.exists()) {
            logger.error("PDF文件不存在 (绝对路径): ${file.absolutePath}")
            throw DataThrowable().data(JsonResponse(false, "文件不存在: $decodedPath"))
        }

        runCatching {
            Loader.loadPDF(file).use { document ->
                val renderer = PDFRenderer(document)
                val image = renderer.renderImageWithDPI(page, 200f)
                ctx.contentType("image/png")
                javax.imageio.ImageIO.write(image, "PNG", ctx.outputStream())
            }
        }.onFailure {
            logger.error("PDF渲染失败: $decodedPath", it)
            throw DataThrowable().data(JsonResponse(false, "渲染失败: ${it.message}"))
        }
    }


    fun  geturlandheader(url: String): Pair<String, Map<String, Any>> = run {
        if (!url.contains(',') || !url.contains('{')  || !url.contains('}')) {
            return Pair(url,mapOf())
        }
        runCatching {
            val firstCommaIndex = url.indexOf(',')
            val nurl = url.substring(0, firstCommaIndex)
            val headersStr = url.substring(firstCommaIndex + 1)
            //println(nurl)
           // println(headersStr)
            var  headers:Map<String, Any> = mapOf()
            runCatching {
                headers =GSON.fromJson(headersStr, object : TypeToken<Map<String, Any>>() {
                }.getType())
            }.onFailure { it.printStackTrace() }
            return Pair(nurl,headers)
        }
        return Pair(url,mapOf())
    }


}
