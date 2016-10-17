var pairs = {};
var srcLangs = [], dstLangs = [];
var curSrcLang, curDstLang;
var recentSrcLangs = [], recentDstLangs = [];
var droppedFile;
var textTranslateRequest;

var TEXTAREA_AUTO_RESIZE_MINIMUM_WIDTH = 768,
    UPLOAD_FILE_SIZE_LIMIT = 32E6,
    TRANSLATION_LIST_WIDTH = 650,
    TRANSLATION_LIST_ROWS = 8,
    TRANSLATION_LIST_COLUMNS = 4;

/* This horrible bodge is the only way so far to set the langauges */
var INIT_LANGUAGE_INDEX = 1

/* exported getPairs */

if(modeEnabled('translation')) {
    $(document).ready(function () {
        //synchronizeTextareaHeights();
/*
        $('#srcLanguages').on('click', '.languageName:not(.text-muted)', function () {
            curSrcLang = $(this).attr('data-code');
            handleNewCurrentLang(curSrcLang, recentSrcLangs, 'srcLang');

            autoSelectDstLang();
        });

        $('#dstLanguages').on('click', '.languageName:not(.text-muted)', function () {
            curDstLang = $(this).attr('data-code');
            handleNewCurrentLang(curDstLang, recentDstLangs, 'dstLang');
        });

        $('.srcLang').click(function () {
            curSrcLang = $(this).attr('data-code');
            $('.srcLang').removeClass('active');
            $(this).addClass('active');
            populateTranslationList();
            refreshLangList(true);
            muteLanguages();
            localizeInterface();
            translateText();

            autoSelectDstLang();
        });

        $('.dstLang').click(function () {
            curDstLang = $(this).attr('data-code');
            $('.dstLang').removeClass('active');
            $(this).addClass('active');
            refreshLangList();
            muteLanguages();
            localizeInterface();
            translateText();
        });
*/
        $('button#translate').click(function () {
            translate();
            //persistChoices('translator', true);
        });

        //$(window).resize(synchronizeTextareaHeights);
/*
        $('#originalText').blur(function () {
            persistChoices('translator', true);
        });

        $('#originalText').on('input propertychange', function () {
            persistChoices('translator');
        });
*/
        $('#originalText').submit(function () {
            translateText();
        });

        $('.clearButton').click(function () {
            $('#originalText, #translatedText').val('');
            $('#originalText').focus();
            //synchronizeTextareaHeights();
        });
/*
        $('.swapLangBtn').click(function () {
            var srcCode = $('.srcLang.active').attr('data-code'), dstCode = $('.dstLang.active').attr('data-code');
            curSrcLang = dstCode;
            curDstLang = srcCode;

            if(recentSrcLangs.indexOf(curSrcLang) !== -1) {
                $('.srcLang').removeClass('active');
                $('#srcLang' + (recentSrcLangs.indexOf(curSrcLang) + 1)).addClass('active');
                $('#srcLangSelect').val(curSrcLang);
            }
            else {
                recentSrcLangs[recentSrcLangs.indexOf(srcCode)] = curSrcLang;
            }

            if(recentDstLangs.indexOf(curDstLang) !== -1) {
                $('.dstLang').removeClass('active');
                $('#dstLang' + (recentDstLangs.indexOf(curDstLang) + 1)).addClass('active');
                $('#dstLangSelect').val(curDstLang);
            }
            else {
                recentDstLangs[recentDstLangs.indexOf(dstCode)] = curDstLang;
            }

            refreshLangList(true);
            muteLanguages();

            if($('.active > #detectedText')) {
                $('.srcLang').removeClass('active');
                $('#srcLang' + (recentSrcLangs.indexOf(curSrcLang) + 1)).addClass('active');
            }
        });

        $('#srcLangSelect').change(function () {
            var selectValue = $(this).val();
                handleNewCurrentLang(curSrcLang = $(this).val(), recentSrcLangs, 'srcLang', true);
        });

        $('#dstLangSelect').change(function () {
            handleNewCurrentLang(curDstLang = $(this).val(), recentDstLangs, 'dstLang', true);
        });
        */
    });
}

function getPairs() {
    var deferred = $.Deferred();

    if(config.PAIRS) {
        handlePairs(config.PAIRS.responseData);
        deferred.resolve();
    }
    else {
        var pairData = readCache('pairs', 'LIST_REQUEST');
        if(pairData) {
            handlePairs(pairData);
            deferred.resolve();
        }
        else {
            console.warn('Translation pairs cache ' + (pairs === null ? 'stale' : 'miss') + ', retrieving from server');
            $.jsonp({
                url: config.APY_URL + '/list?q=pairs',
                beforeSend: ajaxSend,
                success: function (data) {
                    handlePairs(data.responseData);
                    cache('pairs', data.responseData);
                },
                error: function () {
                    console.error('Failed to get available translation language pairs');
                    translationNotAvailable();
                },
                complete: function () {
                    ajaxComplete();
                    deferred.resolve();
                }
            });
        }
    }

    function handlePairs(pairData) {
        $.each(pairData, function (i, pair) {
            srcLangs.push(pair.sourceLanguage);
            dstLangs.push(pair.targetLanguage);

            if(pairs[pair.sourceLanguage]) {
                pairs[pair.sourceLanguage].push(pair.targetLanguage);
            }
            else {
                pairs[pair.sourceLanguage] = [pair.targetLanguage];
            }
        });
        srcLangs = filterLangList(srcLangs.filter(onlyUnique));
        dstLangs = filterLangList(dstLangs.filter(onlyUnique));

/* This horrible bodge is the only way so far to set the langauges */
        curSrcLang = srcLangs[INIT_LANGUAGE_INDEX];
        curDstLang = dstLangs[INIT_LANGUAGE_INDEX];
        for(var i = 0; i < 3; i++) {
            recentSrcLangs.push(i < srcLangs.length ? srcLangs[i] : undefined);
            recentDstLangs.push(i < dstLangs.length ? dstLangs[i] : undefined);
        }

        populateTranslationList();
        //restoreChoices('translator');
    }

    return deferred.promise();
}
/*
function handleNewCurrentLang(lang, recentLangs, langType, resetDetect) {
    $('.' + langType).removeClass('active');
    if(recentLangs.indexOf(lang) === -1) {
        recentLangs.unshift(lang);
        $('#' + langType + '1').addClass('active');
        refreshLangList(resetDetect);
    }
    else {
        $('#' + langType + (recentLangs.indexOf(lang) + 1)).addClass('active');
        //persistChoices('translator');
    }

    $('select#' + langType + 'Select').val(lang);
    if(resetDetect && recentLangs.indexOf(lang) !== -1) {
        refreshLangList(resetDetect);
    }

    populateTranslationList();
    muteLanguages();
    localizeInterface();
    translateText();
}
*/
/*
function refreshLangList(resetDetect) {
    recentSrcLangs = filterLangList(recentSrcLangs, srcLangs);
    recentDstLangs = filterLangList(recentDstLangs, dstLangs);

    //persistChoices('translator');

    for(var i = 0; i < 3; i++) {
        if(i < recentSrcLangs.length && recentSrcLangs[i]) {
            $('#srcLang' + (i + 1)).attr('data-code', recentSrcLangs[i]).text(getLangByCode(recentSrcLangs[i]));
        }
        if(i < recentDstLangs.length && recentDstLangs[i]) {
            $('#dstLang' + (i + 1)).attr('data-code', recentDstLangs[i]).text(getLangByCode(recentDstLangs[i]));
        }
    }

    if($('#detectedText').parent('.srcLang').attr('data-code')) {
        $('#detectedText')
            .text(getLangByCode($('#detectedText')
            .parent('.srcLang')
            .attr('data-code')) + ' - ' + dynamicLocalizations['detected']);
    }

    if(resetDetect) {
        $('#detectText').show();
        $('#detectedText').hide();
    }

    function filterLangList(recentLangs, allLangs) {
        recentLangs = recentLangs.filter(onlyUnique);
        if(recentLangs.length < 3) {
            for(var i = 0; i < allLangs.length; i++) {
                if(recentLangs.length < 3 && recentLangs.indexOf(allLangs[i]) === -1) {
                    recentLangs.push(allLangs[i]);
                }
            }
        }
        if(recentLangs.length > 3) {
            recentLangs = recentLangs.slice(0, 3);
        }
        return recentLangs;
    }
}
*/

function populateTranslationList() {
    sortTranslationList();
    $('.languageName').remove();
    $('.languageCol').show().removeClass('col-sm-3 col-sm-4 col-sm-6 col-sm-12');

    var numSrcCols = Math.ceil(srcLangs.length / TRANSLATION_LIST_ROWS) < (TRANSLATION_LIST_COLUMNS + 1)
            ? Math.ceil(srcLangs.length / TRANSLATION_LIST_ROWS)
            : TRANSLATION_LIST_COLUMNS,
        numDstCols = Math.ceil(dstLangs.length / TRANSLATION_LIST_ROWS) < (TRANSLATION_LIST_COLUMNS + 1)
            ? Math.ceil(dstLangs.length / TRANSLATION_LIST_ROWS)
            : TRANSLATION_LIST_COLUMNS;
    var srcLangsPerCol = Math.ceil(srcLangs.length / numSrcCols),
        dstLangsPerCol = Math.ceil(dstLangs.length / numDstCols);

    var BOOTSTRAP_MAX_COLUMNS = 12;

    $('#srcLanguages').css('min-width', Math.floor(TRANSLATION_LIST_WIDTH * (numSrcCols / TRANSLATION_LIST_COLUMNS)) + 'px');
    $('#srcLanguages .languageCol').addClass('col-sm-' + (BOOTSTRAP_MAX_COLUMNS / numSrcCols));
    $('#srcLanguages .languageCol:gt(' + (numSrcCols - 1) + ')').hide();

    $('#dstLanguages').css('min-width', Math.floor(TRANSLATION_LIST_WIDTH * (numDstCols / TRANSLATION_LIST_COLUMNS)) + 'px');
    $('#dstLanguages .languageCol').addClass('col-sm-' + (BOOTSTRAP_MAX_COLUMNS / numDstCols));
    $('#dstLanguages .languageCol:gt(' + (numDstCols - 1) + ')').hide();

    for(var i = 0; i < numSrcCols; i++) {
        var numSrcLang = Math.ceil(srcLangs.length / numSrcCols) * i;
        for(var j = numSrcLang; j < numSrcLang + srcLangsPerCol; j++) {
            if(numSrcLang < srcLangs.length) {
                var langCode = srcLangs[j], langName = getLangByCode(langCode);
                $('#srcLanguages .languageCol:eq(' + i + ')')
                    .append($('<div class="languageName"></div>')
                    .attr('data-code', langCode)
                    .text(langName));
            }
        }
    }

    for(i = 0; i < numDstCols; i++) {
        var numDstLang = Math.ceil(dstLangs.length / numDstCols) * i;
        for(j = numDstLang; j < numDstLang + dstLangsPerCol; j++) {
            if(numDstLang < dstLangs.length) {
                langCode = dstLangs[j], langName = getLangByCode(langCode);
                $('#dstLanguages .languageCol:eq(' + i + ')')
                    .append($('<div class="languageName"></div>')
                    .attr('data-code', langCode)
                    .text(langName));
            }
        }
    }

    $('.langSelect option[value!=detect]').remove();
    $.each(srcLangs, function () {
        $('#srcLangSelect').append($('<option></option>').prop('value', this).text(getLangByCode(this)));
    });
    $.each(dstLangs, function () {
        $('#dstLangSelect').append($('<option></option>').prop('value', this).text(getLangByCode(this)));
    });

    $('#srcLangSelect').val(curSrcLang);
    $('#dstLangSelect').val(curDstLang);

    //muteLanguages();

    function sortTranslationList() {
        var sortLocale = locale in iso639Codes ? iso639Codes[locale] : locale;
            if(srcLangs.length > 1) {
        srcLangs = srcLangs.sort(function (a, b) {
            return getLangByCode(a).localeCompare(getLangByCode(b), sortLocale);
        });
};

        dstLangs = dstLangs.sort(function (a, b) {
            var aPossible = pairs[curSrcLang] && pairs[curSrcLang].indexOf(a) !== -1,
                bPossible = pairs[curSrcLang] && pairs[curSrcLang].indexOf(b) !== -1;

            if((aPossible && bPossible) || (!aPossible && !bPossible)) {
                return getLangByCode(a).localeCompare(getLangByCode(b), sortLocale);
            }
            else if(aPossible && !bPossible) {
                return -1;
            }
            else {
                return 1;
            }
        });
    };
}

function translate() {
/*
    if($('div#translateText').is(':visible')) {
        translateText();
    }
    else {
        translateDoc();
    }
*/
        translateText();
}

function translateText() {
if( $('#originalText').val().length > 7000) {
translationTextTooLong();
}
else {
    if($('div#translateText').is(':visible')) {
        if(pairs[curSrcLang] && pairs[curSrcLang].indexOf(curDstLang) !== -1) {
            sendEvent('translator', 'translate', curSrcLang + '-' + curDstLang, $('#originalText').val().length);
            if(textTranslateRequest) {
                textTranslateRequest.abort();
            }
            textTranslateRequest = $.jsonp({
                url: config.APY_URL + '/translate',
                beforeSend: ajaxSend,
                complete: function () {
                    ajaxComplete();
                    textTranslateRequest = undefined;
                },
                data: {
                    'langpair': curSrcLang + '|' + curDstLang,
                    'q': $('#originalText').val(),
                    /*'markUnknown': $('#markUnknown').prop('checked') ? 'yes' : 'no'*/
                    'markUnknown': 'no'
                },
                success: function (data) {
                    if(data.responseStatus === HTTP_OK_CODE) {
                        $('#translatedText').html(data.responseData.translatedText);
                        $('#translatedText').removeClass('notAvailable text-danger');
                    }
                    else {
                        translationNotAvailable();
                    }
                },
                error: translationNotAvailable
            });
        }
        else {
            translationNotAvailable();
        }
    }
}
}

function translationTextTooLong() {
    $('#translatedText').text('*** text must be less than 7000 chars (is ' + $('#originalText').val().length +' chars) ***');
    $('#translatedText').addClass('notAvailable text-danger');
}

function translationNotAvailable() {
    $('#translatedText').text(dynamicLocalizations['Not_Available']);
    $('#translatedText').addClass('notAvailable text-danger');
}
/*
function muteLanguages() {
    $('.languageName.text-muted').removeClass('text-muted');
    $('.dstLang').removeClass('disabledLang').prop('disabled', false);

    $.each($('#dstLanguages .languageName'), function () {
        if(!pairs[curSrcLang] || pairs[curSrcLang].indexOf($(this).attr('data-code')) === -1) {
            $(this).addClass('text-muted');
        }
    });
    $.each($('.dstLang'), function () {
        if(!pairs[curSrcLang] || pairs[curSrcLang].indexOf($(this).attr('data-code')) === -1) {
            $(this).addClass('disabledLang').prop('disabled', true);
        }
    });

    $.each($('#dstLangSelect option'), function (i, element) {
        $(element).prop('disabled', !pairs[curSrcLang] || pairs[curSrcLang].indexOf($(element).val()) === -1);
    });
}
*/
/*
function autoSelectDstLang() {
    if(pairs[curSrcLang] && pairs[curSrcLang].indexOf(curDstLang) === -1) {
        var newDstLang;
        for(var i = 0; i < recentDstLangs.length; i++) {
            if(pairs[curSrcLang].indexOf(recentDstLangs[i]) !== -1) {
                newDstLang = recentDstLangs[i];
                break;
            }
        }
        if(!newDstLang) {
            newDstLang = pairs[curSrcLang][0];
        }

        if(recentDstLangs.indexOf(newDstLang) === -1) {
            handleNewCurrentLang(newDstLang, recentDstLangs, 'dstLang');
        }
        else {
            curDstLang = newDstLang;
            $('.dstLang').removeClass('active');
            refreshLangList();
            $('.dstLang[data-code=' + curDstLang + ']').addClass('active');
            muteLanguages();
            localizeInterface();
            translateText();
        }
    }
}
*/
//function synchronizeTextareaHeights() {
    //if($(window).width() < TEXTAREA_AUTO_RESIZE_MINIMUM_WIDTH) {
        //return;
    //}

    //$('#originalText').css({
        //'overflow-y': 'scroll',
        //'height': 'auto'
    //});
    //var originalTextScrollHeight = $('#originalText')[0].scrollHeight;
    //$('#originalText').css('height', originalTextScrollHeight + 'px');
    //$('#translatedText').css('height', originalTextScrollHeight + 'px');
//}
