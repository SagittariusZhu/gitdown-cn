var MarkdownContents,
    Contents,
    _;

_ = require('lodash');
Contents = require('contents').default;
var diacritics = require('diacritics-map');
var querystring = require('querystring');

/**
 * @param {string} markdown
 */
MarkdownContents = function MarkdownContents (markdown) {
    var markdownContents;

    if (!(this instanceof MarkdownContents)) {
        return new MarkdownContents(markdown);
    }

    markdownContents = this;

    /**
     * Generate flat index of the headings.
     *
     * @return {Array}
     */
    markdownContents.articles = function () {
        var articles = [];

        markdown = markdown.replace(/^```[\s\S]*?\n```/mg, function (match) {
            return '';
        });

        markdown.replace(/^(#+)(.*$)/mg, function (match, level, name) {
            level = level.length;
            name = name.trim();
			id = MarkdownContents.slugify(name.toLowerCase());
			// id = _.trim(id.replace(/[^\w]+/g, '-'), '-');

            articles.push({
                level: level,
                id: id,
                name: name
            });
        });

        return articles;
    };

    /**
     * Generates hierarchical index of the headings from a flat index.
     *
     * @return {Array}
     */
    markdownContents.tree = function () {
        var articles,
            tree;

        articles = markdownContents.articles();
        tree = MarkdownContents.tree(articles, false);

        return tree;
    };

    /**
     * Generate markdown for the table of contents.
     *
     * @return {string}
     */
    markdownContents.markdown = function () {
        return MarkdownContents.treeToMarkdown(markdownContents.tree());
    };
};

/**
 * Generate markdown contents for an array of contents object definition.
 *
 * @param {Array} tree [{id: '', name: '', descendants: []}]
 * @return {string} markdown
 */
MarkdownContents.treeToMarkdown = function (tree, level) {
    var markdown = '',
        offset = '';

    level = level || 0;

    if (level) {
        offset = new Array(level * 4).join(' ') + ' ';
    }

    tree.forEach(function (article) {
        markdown += offset + '* [' + article.name + '](#' + article.id + ')\n';

        if (article.descendants) {
            markdown += MarkdownContents.treeToMarkdown(article.descendants, level + 1);
        }
    });

    return markdown;
};

/**
 * Makes hierarchical index of the articles from a flat index.
 *
 * @param {Array} articles Generated using Contents.articles.
 * @param {boolean} makeUniqueIDs
 * @param {Array} uniqueIDpool
 * @return {Array}
 */
MarkdownContents.tree = function (articles, makeUniqueIDs, uniqueIDpool) {
    return Contents.tree(articles, makeUniqueIDs, uniqueIDpool);
};

MarkdownContents.slugify = function(str) {

  str = getTitle(str);
  str = str.toLowerCase();

  // `.split()` is often (but not always) faster than `.replace()`
  str = str.split(' ').join('-');
  str = str.split(/\t/).join('--');
  str = str.split(/[|$&`~=\\\/@+*!?({[\]})<>=.,;:'"^]/).join('');
  str = str.split(/[。？！，、；：“”【】（）〔〕［］﹃﹄“ ”‘’﹁﹂—…－～《》〈〉「」]/).join('');
  str = replaceDiacritics(str);
  str = querystring.escape(str);
  
  return str;
};

function getTitle(str) {
  if (/^\[[^\]]+\]\(/.test(str)) {
    var m = /^\[([^\]]+)\]/.exec(str);
    if (m) return m[1];
  }
  return str;
};

function replaceDiacritics(str) {
  return str.replace(/[À-ž]/g, function(ch) {
    return diacritics[ch] || ch;
  });
}

module.exports = MarkdownContents;
