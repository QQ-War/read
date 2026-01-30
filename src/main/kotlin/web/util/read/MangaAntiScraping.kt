package web.util.read

import java.net.URL

data class MangaAntiScrapingProfile(
    val key: String,
    val name: String,
    val hostSuffixes: List<String>,
    val referer: String? = null,
    val userAgent: String? = null,
    val extraHeaders: Map<String, String> = emptyMap()
) {
    fun matches(host: String): Boolean {
        val target = host.lowercase()
        for (suffix in hostSuffixes) {
            val s = suffix.lowercase()
            if (target == s || target.endsWith(".$s")) {
                return true
            }
        }
        return false
    }
}

object MangaAntiScraping {
    val profiles = listOf(
        MangaAntiScrapingProfile("acg456", "acg456", listOf("acg456.com", "www.acg456.com"), "http://www.acg456.com/"),
        MangaAntiScrapingProfile("baozimh", "baozimh", listOf("baozimh.com", "www.baozimh.com", "bzcdn.net"), "https://www.baozimh.com/"),
        MangaAntiScrapingProfile("bilibili", "bilibili", listOf("manga.bilibili.com"), "https://manga.bilibili.com/"),
        MangaAntiScrapingProfile("boodo", "boodo", listOf("boodo.qq.com"), "https://boodo.qq.com/"),
        MangaAntiScrapingProfile("boylove", "boylove", listOf("boylove.cc"), "https://boylove.cc/"),
        MangaAntiScrapingProfile("177pic", "177pic", listOf("177pic.info", "www.177pic.info"), "http://www.177pic.info/"),
        MangaAntiScrapingProfile("18comic", "18comic", listOf("18comic.vip"), "https://18comic.vip/"),
        MangaAntiScrapingProfile("18hmmcg", "18hmmcg", listOf("18h.mm-cg.com"), "https://18h.mm-cg.com/"),
        MangaAntiScrapingProfile("2animx", "2animx", listOf("2animx.com", "www.2animx.com"), "https://www.2animx.com/"),
        MangaAntiScrapingProfile("2feimh", "2feimh", listOf("2feimh.com", "www.2feimh.com"), "https://www.2feimh.com/"),
        MangaAntiScrapingProfile("3250mh", "3250mh", listOf("3250mh.com", "www.3250mh.com"), "https://www.3250mh.com/"),
        MangaAntiScrapingProfile("36mh", "36mh", listOf("36mh.com", "www.36mh.com"), "https://www.36mh.com/"),
        MangaAntiScrapingProfile("55comic", "55comic", listOf("55comic.com", "www.55comic.com"), "https://www.55comic.com/"),
        MangaAntiScrapingProfile("77mh", "77mh", listOf("77mh.cc", "www.77mh.cc"), "https://www.77mh.cc/"),
        MangaAntiScrapingProfile("copymanga", "copymanga", listOf("copymanga.tv"), "https://copymanga.tv/"),
        MangaAntiScrapingProfile("dm5", "dm5", listOf("dm5.com", "www.dm5.com", "cdndm5.com"), "https://www.dm5.com/"),
        MangaAntiScrapingProfile("dmzj", "dmzj", listOf("dmzj.com", "www.dmzj.com"), "https://www.dmzj.com/"),
        MangaAntiScrapingProfile("gufengmh", "gufengmh", listOf("gufengmh9.com", "www.gufengmh9.com"), "https://www.gufengmh9.com/"),
        MangaAntiScrapingProfile("iqiyi", "iqiyi", listOf("bud.iqiyi.com"), "https://bud.iqiyi.com/"),
        MangaAntiScrapingProfile("jmzj", "jmzj", listOf("jmzj.xyz"), "http://jmzj.xyz/"),
        MangaAntiScrapingProfile("kanman", "kanman", listOf("kanman.com", "www.kanman.com"), "https://www.kanman.com/"),
        MangaAntiScrapingProfile("kuaikan", "kuaikan", listOf("kuaikanmanhua.com", "www.kuaikanmanhua.com", "kkmh.com", "tn1.kkmh.com"), "https://www.kuaikanmanhua.com/", extraHeaders = mapOf("Origin" to "https://www.kuaikanmanhua.com")),
        MangaAntiScrapingProfile("kuimh", "kuimh", listOf("kuimh.com", "www.kuimh.com"), "https://www.kuimh.com/"),
        MangaAntiScrapingProfile("laimanhua", "laimanhua", listOf("laimanhua.net", "www.laimanhua.net"), "https://www.laimanhua.net/"),
        MangaAntiScrapingProfile("manhuadb", "manhuadb", listOf("manhuadb.com", "www.manhuadb.com"), "https://www.manhuadb.com/"),
        MangaAntiScrapingProfile("manhuafei", "manhuafei", listOf("manhuafei.com", "www.manhuafei.com"), "https://www.manhuafei.com/"),
        MangaAntiScrapingProfile("manhuagui", "manhuagui", listOf("manhuagui.com", "www.manhuagui.com"), "https://www.manhuagui.com/"),
        MangaAntiScrapingProfile("manhuatai", "manhuatai", listOf("manhuatai.com", "www.manhuatai.com"), "https://www.manhuatai.com/"),
        MangaAntiScrapingProfile("manwa", "manwa", listOf("manwa.site"), "https://manwa.site/"),
        MangaAntiScrapingProfile("mh1234", "mh1234", listOf("mh1234.com", "www.mh1234.com"), "https://www.mh1234.com/"),
        MangaAntiScrapingProfile("mh160", "mh160", listOf("mh160.cc"), "https://mh160.cc/"),
        MangaAntiScrapingProfile("mmkk", "mmkk", listOf("mmkk.me", "www.mmkk.me"), "https://www.mmkk.me/"),
        MangaAntiScrapingProfile("myfcomic", "myfcomic", listOf("myfcomic.com", "www.myfcomic.com"), "http://www.myfcomic.com/"),
        MangaAntiScrapingProfile("nhentai", "nhentai", listOf("nhentai.net"), "https://nhentai.net/"),
        MangaAntiScrapingProfile("nsfwpicx", "nsfwpicx", listOf("picxx.icu"), "http://picxx.icu/"),
        MangaAntiScrapingProfile("pufei8", "pufei8", listOf("pufei8.com", "www.pufei8.com"), "http://www.pufei8.com/"),
        MangaAntiScrapingProfile("qiman6", "qiman6", listOf("qiman6.com", "www.qiman6.com"), "http://www.qiman6.com/"),
        MangaAntiScrapingProfile("qimiaomh", "qimiaomh", listOf("qimiaomh.com", "www.qimiaomh.com"), "https://www.qimiaomh.com/"),
        MangaAntiScrapingProfile("qootoon", "qootoon", listOf("qootoon.net", "www.qootoon.net"), "https://www.qootoon.net/"),
        MangaAntiScrapingProfile("qq", "qq", listOf("ac.qq.com"), "https://ac.qq.com/"),
        MangaAntiScrapingProfile("sixmh6", "sixmh6", listOf("sixmh6.com", "www.sixmh6.com"), "http://www.sixmh6.com/"),
        MangaAntiScrapingProfile("tuhao456", "tuhao456", listOf("tuhao456.com", "www.tuhao456.com"), "https://www.tuhao456.com/"),
        MangaAntiScrapingProfile("twhentai", "twhentai", listOf("twhentai.com"), "http://twhentai.com/"),
        MangaAntiScrapingProfile("u17", "u17", listOf("u17.com", "www.u17.com"), "https://www.u17.com/"),
        MangaAntiScrapingProfile("webtoons", "webtoons", listOf("webtoons.com", "www.webtoons.com"), "https://www.webtoons.com/"),
        MangaAntiScrapingProfile("wnacg", "wnacg", listOf("wnacg.org", "www.wnacg.org"), "http://www.wnacg.org/"),
        MangaAntiScrapingProfile("xiuren", "xiuren", listOf("xiuren.org", "www.xiuren.org"), "http://www.xiuren.org/"),
        MangaAntiScrapingProfile("ykmh", "ykmh", listOf("ykmh.com", "www.ykmh.com"), "https://www.ykmh.com/"),
        MangaAntiScrapingProfile("yymh889", "yymh889", listOf("yymh889.com"), "http://yymh889.com/"),
        MangaAntiScrapingProfile("godamanga", "godamanga", listOf("godamanga.com", "g-mh.org", "godamanga.online"), "https://godamanga.com/")
    )

    fun resolveProfile(imageURL: String): MangaAntiScrapingProfile? {
        val host = runCatching { URL(imageURL).host }.getOrNull() ?: return null
        return profiles.find { it.matches(host) }
    }
}
