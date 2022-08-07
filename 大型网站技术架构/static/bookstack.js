"use strict"

function ilazyload() {
    $("img.lazy").lazyload({
        effect: "fadeIn", // 载入使用何种效果
        threshold: 200, // 提前开始加载
        container: $(".manual-right"),  // 对某容器中的图片实现效果
        failurelimit: 0, // 图片排序混乱时
        skip_invisible: false,
        appear: function (ele, settings) {
            $(this).attr("src", $(this).attr("data-original"))
        },
    });
}

function show_copy_btn() {
    var btn = "<button class='btn btn-danger btn-sm btn-copy'><i class='fa fa-copy'></i> 复制代码</button>";
    if (!$(".article-body pre").hasClass("btn-copy")) {
        $(".article-body pre").prepend(btn);
    }
}

function load_doc(url, wd, without_history) {
    NProgress.start();
    $(".manual-right").scrollTop(0)
    $.get(url, function (res) {
        $("#page-content").html(res);
        NProgress.done();
        active_readed_menu(url);
        pre_and_next_link();
    })
}

function initHighlighting() {

}

function initLinkWithImage() {
    $(".markdown-body a img").each(function () {
        $(this).after("<span class='btn btn-default btn-ilink btn-xs'><i class='fa fa-link'></i> 访问链接</span>")
    })
}

function initPDFPreview() {
    var prevStyle = $(".attach-list").attr("data-preview")
    if (prevStyle == "pdf") {
        pdfPrevPDF()
    } else if (prevStyle == "svg") {
        pdfPrevSVG()
    }
}

function pdfPrevPDF() {
    var pdfjs = $("article").attr("data-iframe")
    var lists = $(".attach-list>ul>li")
    $.each(lists, function () {
        var file = $(this).find("a").attr("href")
        if (file.endsWith(".pdf")) {
            $(this).append('<iframe src="' + pdfjs + encodeURIComponent(file) + '" width="100%" height="800px" frameborder="0"></iframe>')
        }
    })
}

function pdfPrevSVG() {
    var lists = $(".attach-list>ul>li")
    $.each(lists, function (idx) {
        var svgNum = $(this).attr("data-svg")
        console.log(svgNum)
        if (svgNum > 0) {
            var file = $(this).find("a").attr("href")
            if (file.endsWith(".pdf")) {
                var base_dir = file.substring(0, file.length - 4)
                var cls = "svg" + idx
                $(this).append('<div class="' + cls + '"><div class="page-svg"><img src="' + base_dir + '/1.gzip.svg"/></div><div class="page zxf_pagediv"></div></div>')
                $("." + cls + " .page").createPage({
                    pageNum: svgNum,
                    current: 1,
                    backfun: function (e) {
                        $('.' + cls + " img").attr("src", "")
                        $('.' + cls + " img").attr("src", base_dir + '/' + e.current + '.gzip.svg')
                    }
                });
            }
        }

    })
}

var events = $("body");

function change_url_state(url, title) {
    history.pushState({}, title, url);
}

function active_readed_menu(url) {
    var links = $(".article-menu-detail a");
    var href = "";
    $.each(links, function () {
        href = $(this).attr("href");
        if (href == url) {
            $(this).addClass("jstree-clicked");
            $(this).parents().removeClass("collapse-hide")
            $(this).parent().addClass("readed");
        } else {
            $(this).removeClass("jstree-clicked");
        }
    });
    var offset_top = $(".article-menu-detail a.jstree-clicked").offset().top;
    var scroll_top = $('.article-menu').scrollTop();
    $('.article-menu').animate({scrollTop: scroll_top + offset_top - 180}, 300);
}

function pre_and_next_link() {
    //上一篇和下一篇的链接
    var links = $(".article-menu a"), link_active = $(".article-menu .jstree-clicked").attr('href'), l = links.length;
    for (var i = 0; i < l; i++) {
        if (encodeURI($(links[i]).attr("href")) == link_active) {
            $(".hung-read-link .col-xs-12").hide();
            var link_pre = $(links[i - 1]), link_next = $(links[i + 1]);
            if (link_pre && link_pre.text()) {
                $(".hung-pre a").attr("href", link_pre.attr("href"));
                $(".hung-pre a").text(link_pre.text());
                $(".hung-pre").show();
            }
            if (link_next && link_next.text()) {
                $(".hung-next a").attr("href", link_next.attr("href"));
                $(".hung-next a").text(link_next.text());
                $(".hung-next").show();
            }
            i = l;
        }
    }
}

function disableRightClick() {
    $('body').on('contextmenu', 'audio,video', function (e) {
        e.preventDefault();
    });
}

$(function () {
    disableRightClick();
    ilazyload()
    $(".article-menu-detail>ul>li a").tooltip({placement: 'bottom'})
    $(".view-backtop").on("click", function () {
        $('.manual-right').animate({scrollTop: '0px'}, 200);
    });

    $(".markdown-body").on("click", "img", function () {
        var src = $(this).attr("src")
        var nHeight = $(this)[0].naturalHeight
        var nWidth = $(this)[0].naturalWidth
        var winHeight = $(window).height()
        var winWidth = $(window).width()
        var displayWidth = nWidth
        var displayHeight = nHeight
        if (src.toLowerCase().endsWith(".svg")) {
            displayWidth = $(this)[0].clientWidth
            displayHeight = $(this)[0].clientHeight
        }
        if (displayWidth >= winWidth * 0.95) {
            displayWidth = winWidth * 0.95
            displayHeight = nHeight * (displayWidth / nWidth)
        }
        console.log(nWidth, nHeight, displayWidth, displayHeight, winWidth, winHeight)
        var style = "margin-top: 30px;"
        var bv = $(".bookstack-viewer")
        var img = bv.find("img")
        if (winHeight > displayHeight) {
            var mt = (winHeight - displayHeight - 30) / 2
            if (mt <= 30) mt = 30
            style = "margin-top: " + mt + "px"
        }
        console.log('winheight', winWidth, 'displayHeight', displayHeight)
        if (img.length > 0) {
            img.attr("src", src)
            img.attr("style", style)
        } else {
            bv.append('<img style="' + style + '" src="' + src + '"/>')
        }
        bv.fadeIn();
        $(".bookstack-viewer").scrollTop(0)
    });

    $(".bookstack-viewer").click(function () {
        $(this).fadeOut()
    });

    $(".manual-right").scroll(function () {
        var top = $(".manual-right").scrollTop();
        if (top > 100) {
            $(".view-backtop").addClass("active");
        } else {
            $(".view-backtop").removeClass("active");
        }

        var links = $(".reference-link"), l = links.length, find = false;
        for (var i = 0; i < l && find == false; i++) {
            if ($(links[i]).offset().top > 0) {
                $(".markdown-toc a").removeClass("active");
                $(".markdown-toc a[href='#" + $(links[i]).attr("name") + "']").addClass("active");
                find = true;
            }
        }
    });

    $(".manual-left").on("click", "a", function () {
        if ($(".manual-mode-view").hasClass("manual-mobile-show-left")) {
            $(".manual-mask").trigger("click");
        }
    });

    initHighlighting();

    $("#slidebar").on("click", function () {
        $(".m-manual").addClass('manual-mobile-show-left');
    });
    $(".manual-mask").on("click", function () {
        $(".m-manual").removeClass('manual-mobile-show-left');
    });

    /**
     * 关闭侧边栏
     */
    $(".manual-fullscreen-switch").on("click", function () {
        if (!$(".m-manual").hasClass("manual-fullscreen-active")) {
            $(".m-manual").addClass('manual-fullscreen-active');
        } else {
            $(".m-manual").removeClass('manual-fullscreen-active');
        }
    });

    //处理打开事件
    events.on('article.open', function (event, $param) {
        if ('pushState' in history) {
            if ($param.$init === false) {
                window.history.replaceState($param, $param.$id, $param.$url);
            } else {
                window.history.pushState($param, $param.$id, $param.$url);
            }
        } else {
            window.location.hash = $param.$url;
        }
        initHighlighting();
        $(".manual-right").scrollTop(0);
    });

    //展开右下角菜单
    $(".bars-menu-toggle").click(function () {
        if ($(".bars-menu-toggle .fa-minus-circle").hasClass("hide")) {
            $(".bars-menu").removeClass("bars-menu-hide");
            $(".bars-menu-toggle .fa-minus-circle").removeClass("hide");
            $(".bars-menu-toggle .fa-plus-circle").addClass("hide");
        } else {
            $(".bars-menu").addClass("bars-menu-hide");
            $(".bars-menu-toggle .fa-minus-circle").addClass("hide");
            $(".bars-menu-toggle .fa-plus-circle").removeClass("hide");
        }
    });


    //添加或者移除书签
    $(".bookmark-action").click(function (e) {
        e.preventDefault();
        var _this = $(this), doc_id = _this.attr("data-docid"), href = _this.attr("href") + doc_id;
        $.get(href, function (res) {
            if (res.errcode == 0) {
                alertTips("success", res.message, 3000, "");
            } else {
                alertTips("danger", res.message, 3000, "");
            }
            if (res.data) {//新增书签成功
                $(".bookmark-action").find(".bookmark-add").addClass("hide");
                $(".bookmark-action").find(".bookmark-remove").removeClass("hide");
            } else {
                $(".bookmark-action").find(".bookmark-add").removeClass("hide");
                $(".bookmark-action").find(".bookmark-remove").addClass("hide");
            }
            console.log(res);
        });
    });

    $(".navg-item[data-mode]").on("click", function () {
        var mode = $(this).data('mode');
        $(this).siblings().removeClass('active').end().addClass('active');
        $(".m-manual").removeClass("manual-mode-view manual-mode-collect manual-mode-search").addClass("manual-mode-" + mode);
    });

    //显示书签列表
    $(".showModalBookmark").click(function (e) {
        e.preventDefault();
        $.get($(this).attr("href"), function (res) {
            if (res.errcode == 0) {
                if (res.data.count > 0) {
                    var arr = new Array();
                    for (var i = 0; i < res.data.count; i++) {
                        var item = res.data.list[i];
                        arr.push('<li><a href="' + item.url + '"><span class="text-muted">[ ' + item.time + ' ]</span> ' + item.title + '</a> <i title="移除" data-url="' + item.del + '" data-docid="' + item.doc_id + '" class="fa fa-remove tooltips"></i> </li>')
                    }
                    $("#ModalBookmark .modal-body ul").html(arr.join(""));
                } else {
                    $("#ModalBookmark .modal-body ul").html('<li><div class="help-block">您当前还没有添加书签...</div></li>');
                }

                $("#ModalBookmark").modal("show");
            } else {
                alertTips("danger", res.message, 3000, "");
            }

        });
    });

    //显示阅读记录
    $(".showModalHistory").click(function (e) {
        e.preventDefault();
        var _this = $(this), href = _this.attr("href");
        $.get(href, function (res) {
            if (res.errcode == 0) {
                $("#ModalHistory .modal-body .help-block .text-success").text(res.data.progress.percent);
                $("#ModalHistory .modal-body .help-block .text-muted").text(res.data.progress.cnt + " / " + res.data.progress.total);
                $("#ModalHistory .progress-bar-success").css({"width": res.data.progress.percent});
                $("#ModalHistory .reset-history").attr("href", res.data.clear);
                var items = res.data.lists;
                var lists = new Array();
                for (var i = 0; i < res.data.count; i++) {
                    lists.push('<li><a href="' + items[i].url + '"><span class="text-muted">[ ' + items[i].time + ' ]</span> ' + items[i].title + '</a><i title="移除" data-url="' + items[i].del + '" class="fa fa-remove tooltips"></i></li>');
                }
                $("#ModalHistory .modal-body ul").html(lists.join(""));
                $("#ModalHistory").modal("show");
            } else {
                alertTips("danger", res.message, 3000, "");
            }
        })
    });

    pre_and_next_link();
    $(".article-menu-detail a").click(function (e) {
        e.preventDefault();
        $(".tooltip").remove();
        load_doc($(this).attr("href"), "");
    });
    $(".hung-read-link").on("click", "a", function (e) {
        e.preventDefault();
        load_doc($(this).attr("href"), "");
    });

    //重置阅读记录
    $(".reset-history").click(function (e) {
        e.preventDefault();
        var _this = $(this), href = _this.attr("href");
        if (confirm("重置阅读进度，会清空所有阅读记录，您确定要执行该操作吗？")) {
            $.get(href, function (res) {
                $("#ModalHistory").modal("hide");
                alertTips("success", "重置阅读进度成功", 1500, location.href);
            });
        }
    });

    //删除书签
    $("#ModalBookmark").on("click", ".modal-body .fa-remove", function () {
        var _this = $(this), docid = _this.attr("data-docid"), _url = _this.attr("data-url");
        $.get(_url, function () {//不管删除成功与否，移除记录
            _this.parent().remove();
            var markdocid = $(".bookmark-action").attr("data-docid");
            if (markdocid == docid) {
                $(".bookmark-action .bookmark-add").removeClass("hide");
                $(".bookmark-action .bookmark-remove").addClass("hide");
            }
        });
    });

    $(".article-search .pull-right").click(function () {
        var bookId = $(".article-search").attr("data-bookid");
        if ($(".manual-left").hasClass("manual-left-toggle")) {
            $(".manual-left").removeClass("manual-left-toggle");
            $(".manual-right").removeClass("manual-right-toggle");
            $("header").removeClass("manual-left-toggle");
            closeMenu(false);
        } else {
            $(".manual-left").addClass("manual-left-toggle");
            $("header").addClass("manual-left-toggle");
            $(".manual-right").addClass("manual-right-toggle");
            closeMenu(true);
        }
    });

    //删除阅读记录
    $("#ModalHistory").on("click", ".modal-body .fa-remove", function () {
        var _this = $(this), _url = _this.attr("data-url");
        $.get(_url, function () {//不管删除成功与否，移除记录
            _this.parent().remove();
        });
    });

    function closeMenu(close) {
        var key = 'close_menu';
        document.cookie = key + "=" + close;
    }

    function toggle_btn_clear(show) {
        if (show) {
            $(".article-search .input-group-addon-clear").css({"display": "table-cell"});
            $(".hung-read-link div").addClass("hidden");
        } else {
            $(".article-search .input-group-addon-clear").attr("style", "");
            $(".hung-read-link div").removeClass("hidden");
            $(".article-menu-detail").show()
            $(".search-result").hide()
        }
    }

    $("#searchForm [name=keyword]").keyup(function () {
        toggle_btn_clear($.trim($(this).val()));
    });

    $(".input-group-addon-clear").click(function () {
        $("#searchForm [name=keyword]").val("");
        $(".search-result").hide();
        $(".article-menu-detail").show();
        $(this).attr("")
        toggle_btn_clear(false);
    });

    $("#searchForm [type=submit]").click(function (e) {
        NProgress.start();
        e.preventDefault();
        var form = $("#searchForm");
        var wd = $.trim(form.find("[name=keyword]").val());
        $.post(form.attr("action"), {"keyword": wd}, function (res) {
            var html = "";
            wd = wd.replace(/"/g, "");
            if (res.errcode === 0) {
                for (var i in res.data) {
                    var item = res.data[i];
                    html += '<li><a data-wd="' + res.message + '" href="javascript:;" title="' + item.doc_name + '" data-id="' + item.identify + '"> ' + item.doc_name + ' </a></li>';
                }
            }
            $("#searchList").html(html);
            if (html) {
                $(".article-menu-detail").hide();
                $(".search-result").show();
                $(".search-empty").hide();
            } else {
                $(".article-menu-detail").hide();
                $(".search-result").show();
                $(".search-empty").show();
            }
            NProgress.done();
        })
    });


    // $('.article-menu').animate({scrollTop:$('.article-menu a.jstree-clicked').offset().top-180}, 300);
    window.onpopstate = function (e) {
        if (location.href.indexOf("#") < 0) {
            load_doc(location.pathname, "", true);
        }
    }

    $("body").on("change", ".video-playbackrate select", function (e) {
        var _this = $(this), val = _this.val(), video = _this.parents(".video-main").find("video");
        if (video.length > 0) video[0].playbackRate = val
    })
    initPDFPreview()
});