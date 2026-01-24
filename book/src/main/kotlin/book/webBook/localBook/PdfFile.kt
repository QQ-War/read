package book.webBook.localBook

import book.model.Book
import book.model.BookChapter
import book.util.MD5Utils
import org.apache.pdfbox.Loader
import org.apache.pdfbox.text.PDFTextStripper
import java.io.File

object PdfFile {
    private fun pagesPerChapter(): Int {
        val raw = System.getProperty("READ_PDF_PAGES_PER_CHAPTER")
            ?: System.getenv("READ_PDF_PAGES_PER_CHAPTER")
            ?: System.getProperty("PDF_PAGES_PER_CHAPTER")
            ?: System.getenv("PDF_PAGES_PER_CHAPTER")
        val value = raw?.toIntOrNull() ?: 10
        return if (value < 1) 1 else value
    }

    fun getChapterList(book: Book): ArrayList<BookChapter> {
        val chapters = ArrayList<BookChapter>()
        val file = File(book.bookUrl)
        if (!file.exists()) return chapters

        Loader.loadPDF(file).use { document ->
            val pageCount = document.numberOfPages
            val step = pagesPerChapter()
            var i = 0
            while (i < pageCount) {
                val start = i
                val endExclusive = minOf(i + step, pageCount)
                val chapter = BookChapter()
                chapter.index = start
                chapter.title = if (endExclusive - start <= 1) {
                    "第 ${start + 1} 页"
                } else {
                    "第 ${start + 1}-${endExclusive} 页"
                }
                chapter.bookUrl = book.bookUrl
                chapter.url = MD5Utils.md5Encode16(book.originName + start + chapter.title)
                chapter.start = start.toLong() // 借用 start 存储页码
                chapter.end = endExclusive.toLong()
                chapters.add(chapter)
                i = endExclusive
            }
        }
        book.latestChapterTitle = "共 ${chapters.size} 章"
        book.totalChapterNum = chapters.size
        return chapters
    }

    fun getContent(book: Book, chapter: BookChapter): String? {
        val file = File(book.bookUrl)
        if (!file.exists()) return null

        Loader.loadPDF(file).use { document ->
            val stripper = PDFTextStripper()
            val pageStart = chapter.start?.toInt() ?: 0
            val pageEndExclusive = chapter.end?.toInt() ?: (pageStart + 1)
            stripper.startPage = pageStart + 1
            stripper.endPage = pageEndExclusive
            val text = stripper.getText(document)

            if (text.isNullOrBlank()) {
                // 如果没有文字，返回图片模式
                val absolutePath = File(book.bookUrl).absolutePath
                val encodedPath = java.net.URLEncoder.encode(absolutePath, "UTF-8").replace("+", "%20")
                val builder = StringBuilder()
                val end = minOf(pageEndExclusive, document.numberOfPages)
                for (page in pageStart until end) {
                    builder.append("<img src=\"@@baseUrl@@/pdfImage?path=$encodedPath&page=$page\" style=\"width:100%\" />")
                    builder.append("\n")
                }
                return builder.toString().trim()
            }
            return text
        }
    }
}
