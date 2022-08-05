import html.parser as htmlparser
import os
import re
import shutil
import tempfile
import urllib.parse
import zipfile
from os.path import dirname, basename, join, splitext, abspath
from pathlib import Path

from lxml import etree

parser = htmlparser.HTMLParser()


class Epub2Html():
    def __init__(self, epubpath, outputdir):
        self.epubpath = epubpath

        script_dir = dirname(abspath(__file__))
        template_path = join(script_dir, "template.html")

        self.template = Path(template_path).read_text(encoding='utf-8')
        (epub_name_without_ext, _) = splitext(basename(self.epubpath))
        self.epub_name_without_ext = epub_name_without_ext
        self.outputdir = outputdir
        self.root_a_path = join(outputdir, epub_name_without_ext)

        self.unzip()

        opf_r_root_path = self.get_opf_r_root_path()
        self.index_a_path = join(self.root_a_path, "index.html")
        self.opf_a_path = join(self.root_a_path, opf_r_root_path)
        self.opf_a_dir = dirname(join(self.root_a_path, opf_r_root_path))

        self.ncx_r_opf_path, self.css_r_opf_path, self.cover_r_opf_path = self.paths_from_opf()
        self.is_gen = (self.opf_a_dir == self.root_a_path)
        if not self.is_gen:
            self.cover_r_opf_path = self.opf_a_dir.replace(self.root_a_path + '/', '') + '/' + self.cover_r_opf_path

        self.ncx_a_path = join(self.opf_a_dir, self.ncx_r_opf_path)

        if self.css_r_opf_path:
            self.css_a_path = join(self.opf_a_dir, self.css_r_opf_path)

        # save the only name html that alredy parsed
        self.alread_gen_html = set()

        print("self.ncx_a_path", self.ncx_a_path)

    def get_xml_root(self, path):
        contents = Path(path).read_text(encoding='utf-8')
        contents = re.sub(' xmlns="[^"]+"', '', contents, count=1)
        contents = contents.encode('utf-8')
        root = etree.fromstring(contents)
        return root

    def get_opf_r_root_path(self):
        meta_a_path = (join(self.root_a_path, "META-INF/container.xml"))
        root = self.get_xml_root(meta_a_path)

        for item in root.findall(".//rootfiles/"):
            return item.attrib["full-path"]

    def read_xml(self, path):
        pass

    def paths_from_opf(self):

        ncx_r_opf_path = None
        css_r_opf_path = None
        cover_r_opf_path = None
        root = self.get_xml_root(self.opf_a_path)

        for item in root.findall(".//manifest/"):
            href = item.attrib["href"]

            if "ncx" in item.attrib["media-type"]:
                ncx_r_opf_path = href

            if "css" in item.attrib["media-type"]:
                css_r_opf_path = href

        for item in root.findall(".//metadata/meta"):
            name = item.attrib.get('name')
            if name == 'cover':
                content = item.attrib.get('content')
                find_cover = root.findall(f".//manifest/item[@id='{content}']")
                if len(find_cover) != 0:
                    cover_r_opf_path = find_cover[0].attrib.get('href')

        return ncx_r_opf_path, css_r_opf_path, cover_r_opf_path

    def getIndexLoc(self):
        return self.index_a_path

    def _gen_menu_content(self, node, menus, contents, depth=0):
        for cc in node.findall("."):
            name = cc.find("./navLabel/text").text.strip()
            link = cc.find("./content")
            src = urllib.parse.unquote(link.attrib["src"])
            no_hash_name = src


            if not self.is_gen:
                unified_src = self.opf_a_dir.replace(self.root_a_path + '/', '') + '/' + no_hash_name
            else:
                unified_src = no_hash_name

            menus.append(f"<li><a href=\"#\" onClick=\"showDiv('{unified_src}')\">{name}</a></li>")

            # if no_hash_name in self.alread_gen_html:
            #     continue

            if src.find('#') != -1:
                no_hash_name = src[:src.find("#")]
            washed_content = self.gen_content(join(dirname(self.ncx_a_path), no_hash_name))

            contents.append(washed_content)

            subs = cc.findall("./navPoint")
            if len(subs) > 0:
                for d in subs:
                    menus.append("<ul>")
                    self._gen_menu_content(d, menus, contents, depth + 1)
                    menus.append("</ul>")

    def gen_menu_content(self):
        menus = []
        contents = []
        root = self.get_xml_root(self.ncx_a_path)

        menus.append("<ul class=\"nav nav-sidebar \">")

        for c in root.findall("./navMap/navPoint"):
            self._gen_menu_content(c, menus, contents, 0)

        menus.append("</ul>")

        return "\n".join(menus), contents[0]

    def unzip(self):
        with zipfile.ZipFile(self.epubpath, 'r') as zip_ref:
            zip_ref.extractall(self.root_a_path)

    def gen_content(self, path):
        print("==>", path)
        raw_text_content = Path(path).read_bytes()
        raw_text_content = raw_text_content.decode('utf-8')
        raw_text_content = "\n".join(raw_text_content.split("\n")[1:])
        raw_content_dom = etree.HTML(raw_text_content)
        content = etree.tostring(raw_content_dom.xpath("//body")[0], method='html').decode('utf-8')
        washed_content = self.wash_body(content)
        washed_content = self.wash_img_link(path, washed_content)
        open(path, 'w').write(washed_content)
        return washed_content

    def wash_body(self, sub_content):
        tmp = sub_content.replace("<body", "<div")
        tmp = tmp.replace("</body>", "</div>")
        return tmp

    def wash_img_link(self, content_path, content):
        if content_path in self.alread_gen_html:
            return content
        content = re.sub("(?<=src=\")(.*)(?=\")",
                         lambda match: os.path.relpath(join(dirname(content_path), match.group(1)), self.root_a_path),
                         content)
        self.alread_gen_html.add(content_path)
        return content

    def hash(self, s):
        import base64
        tag = base64.b64encode(s.encode('ascii'))
        tag = tag.decode("ascii")
        return tag.rstrip('=')

    def gen_r_css(self):
        try:
            css_r_path = os.path.relpath(self.css_a_path, self.root_a_path)
            return f'<link rel="stylesheet" href="{css_r_path}" />'
        except Exception as e:
            return f'<link rel="stylesheet" href="" />'

    def gen(self):
        menu, full_content = self.gen_menu_content()
        self.template = self.template.replace("${menu}$", menu)
        self.template = self.template.replace("${title}$", self.epub_name_without_ext)
        self.template = self.template.replace("${content}$", full_content)
        self.template = self.template.replace("${css}$", self.gen_r_css())
        Path(join(self.outputdir, self.epub_name_without_ext, "./index.html")).write_text(self.template,
                                                                                          encoding='utf-8')
        self.gen_jquery_js()
        return self.epub_name_without_ext, self.cover_r_opf_path

    def gen_jquery_js(self):
        script_dir = dirname(abspath(__file__))
        shutil.copy(join(script_dir, "jquery.min.js"), self.root_a_path)
        shutil.copy(join(script_dir, "leader-line.min.js"), self.root_a_path)


def main(filepath, outputdir):
    if filepath[0] != "." and filepath[0] != "/":
        filepath = "./" + filepath
    filepath = abspath(filepath)

    if outputdir:
        outputdir = abspath(outputdir)
    else:
        outputdir = tempfile.gettempdir()

    e = Epub2Html(filepath, outputdir)
    r, cover = e.gen()
    print("converted! " + e.getIndexLoc())
    return r, cover


def parse_dir(dir, out_path):
    epub_list = os.walk(dir)
    book_list = []

    for path, dir_list, file_list in epub_list:
        for file_name in file_list:
            epub_path = os.path.join(path, file_name)
            r, cover = main(epub_path, out_path)

            book_list.append(
                f"<a class='card' href=\"{r}\"><img src=\"{r}/{cover}\" /><div class='title'><p>{r}</p></div></a>")

    script_dir = dirname(abspath(__file__))
    template_path = join(script_dir, "index.html")
    template = Path(template_path).read_text(encoding='utf-8')
    template = template.replace("${booklist}$", "".join(book_list))
    Path(out_path + './index.html').write_text(template)


if __name__ == '__main__':
    PROJECT_ABSOLUTE_PATH = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    print(PROJECT_ABSOLUTE_PATH)
    parse_dir(PROJECT_ABSOLUTE_PATH + '/book', PROJECT_ABSOLUTE_PATH + '/docs/')
    # main(PROJECT_ABSOLUTE_PATH + '/book/大型网站技术架构.epub', PROJECT_ABSOLUTE_PATH + '/docs/')
