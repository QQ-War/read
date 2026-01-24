package book.webBook.localBook

import book.model.Book
import book.model.BookChapter
import book.util.MD5Utils
import org.apache.pdfbox.Loader
import org.apache.pdfbox.text.PDFTextStripper
import java.io.File

object PdfFile {

    fun getChapterList(book: Book): ArrayList<BookChapter> {
        val chapters = ArrayList<BookChapter>()
        val file = File(book.bookUrl)
        if (!file.exists()) return chapters

        Loader.loadPDF(file).use { document ->
            val pageCount = document.numberOfPages
            for (i in 0 until pageCount) {
                val chapter = BookChapter()
                chapter.index = i
                chapter.title = "第 ${i + 1} 页"
                chapter.bookUrl = book.bookUrl
                chapter.url = MD5Utils.md5Encode16(book.originName + i + chapter.title)
                chapter.start = i.toLong() // 借用 start 存储页码
                chapter.end = (i + 1).toLong()
                chapters.add(chapter)
            }
        }
        book.latestChapterTitle = "共 ${chapters.size} 页"
        book.totalChapterNum = chapters.size
        return chapters
    }

    fun getContent(book: Book, chapter: BookChapter): String? {
        val file = File(book.bookUrl)
        if (!file.exists()) return null

        Loader.loadPDF(file).use { document ->
            val stripper = PDFTextStripper()
            val pageNum = chapter.start?.toInt() ?: 0
            stripper.startPage = pageNum + 1
            stripper.endPage = pageNum + 1
            val text = stripper.getText(document)

            if (text.isNullOrBlank()) {
                // 如果没有文字，返回图片模式
                val absolutePath = File(book.bookUrl).absolutePath
                val encodedPath = java.net.URLEncoder.encode(absolutePath, "UTF-8").replace("+", "%20")
                return "<img src=\"@@baseUrl@@/pdfImage?path=$encodedPath&page=$pageNum\" style=\"width:100%\" />"
            }
            return text
        }
    }
}
