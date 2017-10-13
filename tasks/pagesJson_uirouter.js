/**
 * grunt-pages-json-uirouter
 * https://github.com/Xen3r0/pagesJson_uirouter
 *
 * Copyright (c) 2016 xen3r0
 * Licensed under the MIT license.
 */

'use strict';

var merge = require('merge-recursive');

module.exports = function (grunt) {
    grunt.registerMultiTask('pagesJson_uirouter', 'Conversion d\'un fichier JSON de routage en fichier JS.', function () {
        // Merge task-specific and/or target-specific options with these defaults.
        var options = this.options({
            moduleName: 'winlassie'
        });
        var states = {};

        // Iterate over all specified file groups.
        this.files.forEach(function (f) {
            // Concat specified files.
            var files = f.src.filter(function (filepath) {
                // Warn on and remove invalid source files (if nonull was set).
                if (!grunt.file.exists(filepath)) {
                    grunt.log.warn('Source file "' + filepath + '" not found.');
                    return false;
                } else {
                    return true;
                }
            }).map(function (filepath) {
                // Read file source.
                return grunt.file.read(filepath);
            });

            // Write the destination file.
            var dest = [];
            var allPages = [];

            dest.push('(function () {');
            dest.push(getTabs(1) + 'angular.module(\'' + options.moduleName + '\').config([\'$stateProvider\', function ($stateProvider) {');

            files.forEach(function (content) {
                var src = JSON.parse(content);

                allPages = allPages.concat(src);
            });

            allPages = setRefs(allPages);

            setUpStates(allPages, 'winlassie');

            if (0 < Object.keys(states).length) {
                dest.push(getTabs(2) + '$stateProvider');

                Object.keys(states).forEach(function (key) {
                    dest.push(getTabs(3) + '.state(\'' + key + '\', {');
                    dest.push(objectToString(states[key], 4));
                    // dest.push("\t\t\t"+JSON.stringify(states[key]));
                    dest.push(getTabs(3) + '})');
                });

                dest.push(getTabs(2) + ';');
            }

            dest.push(getTabs(1) + '}]);');
            dest.push('})();'+"\n");

            grunt.file.write(f.dest, dest.join("\n"));

            // Print a success message.
            grunt.log.writeln('File "' + f.dest + '" created.');
        });

        /**
         * Transformer un objet en chaine
         * @param {Object} object
         * @param {Number} tabs
         */
        function objectToString(object, tabs) {
            var result = [];
            var keys = Object.keys(object);

            keys.forEach(function (key, keyIndex) {
                var line;
                var formatedKey;

                if (-1 < key.indexOf('@')) {
                    formatedKey = '\'' + key + '\'';
                } else {
                    formatedKey = key;
                }

                if (typeof object[key] === 'object') {
                    if (Array.isArray(object[key])) {
                        var newTabs = (tabs + 1);

                        line = getTabs(tabs) + '' + formatedKey + ': [';

                        object[key].forEach(function (item, itemIndex) {
                            if (typeof item === 'object') {
                                line += "\n" + getTabs(newTabs) + '{';
                                line += "\n" + objectToString(item, (newTabs + 1));
                                line += "\n" + getTabs(newTabs) + '}';
                            } else if (typeof item === 'string') {
                                line += "\n" + getTabs(newTabs) + '\'' + addslashes(item) + '\'';
                            } else if (typeof item === 'boolean') {
                                line += "\n" + getTabs(newTabs) + '' + item;
                            } else if (typeof item === 'number') {
                                line += "\n" + getTabs(newTabs) + '' + item;
                            }

                            if (itemIndex < (object[key].length - 1)) {
                                line += ',';
                            }
                        });

                        line += "\n" + getTabs(tabs) + ']';
                    } else {
                        line = getTabs(tabs) + '' + formatedKey + ': {' + "\n";
                        line += objectToString(object[key], (tabs + 1));
                        line += "\n" + getTabs(tabs) + '}';
                    }
                } else if (typeof object[key] === 'string') {
                    line = getTabs(tabs) + '' + formatedKey + ': \'' + addslashes(object[key]) + '\'';
                } else if (typeof object[key] === 'boolean') {
                    line = getTabs(tabs) + '' + formatedKey + ': ' + object[key];
                } else if (typeof object[key] === 'number') {
                    line = getTabs(tabs) + '' + formatedKey + ': ' + object[key];
                }

                if (keyIndex < (keys.length - 1)) {
                    line += ',';
                }

                result.push(line);
            });

            return result.join("\n");
        }

        /**
         * Récupérer un nombre de tabs
         * @param {Number} count
         */
        function getTabs(count) {
            var tabs = [];

            for (var i = 0; i < count; i++) {
                tabs.push("    ");
            }

            return tabs.join('');
        }

        /**
         * Setup states
         * @param {String[]} pages
         * @param {String} routeNameParent
         * @param {String=} parentDirectory
         */
        function setUpStates(pages, routeNameParent, parentDirectory) {
            pages.forEach(function (page) {
                if (!page.isBlock && (!page.isStateRef || page.stateRef)) {
                    var routeName = routeNameParent + '.' + page.name;
                    var dirState = routeName.replace('winlassie.', '').split('.');
                    var templateUrl = null;
                    var pageNameReplace = replaceAll(page.name, '_', '-');
                    var state = {url: '/' + pageNameReplace, data: {haveTemplate: false}};

                    // Page cachée ou pas
                    if (typeof page.hidden !== 'undefined') {
                        state.data.hidden = page.hidden;
                    } else {
                        state.data.hidden = false;
                    }

                    // C'est une route d'action (view, create, edit...)
                    if (page.niveauAction) {
                        dirState.pop();
                        state.data.action = page.niveauAction;
                    }

                    // C'est page contient un paramètre requireLogin pour définir si l'utilisateur doit être authentifié
                    if (page.requireLogin) {
                        state.data.requireLogin = page.requireLogin;
                    } else {
                        state.data.requireLogin = true;
                    }

                    // C'est page contient un paramètre requireLogin pour définir si l'utilisateur doit être authentifié
                    if (page.redirectTo) {
                        state.redirectTo = 'winlassie.' + page.redirectTo;
                        state.data.haveTemplate = true;
                    }

                    // Construction du répertoire
                    if (!parentDirectory || isEmpty(parentDirectory) || (page.stateRef && !isEmpty(page.stateRef))) {
                        // Soit on fait référence à une route différente, une sorte d'inclusion, soit on a un fonctionnement normal
                        if (page.stateRef && !isEmpty(page.stateRef)) {
                            dirState = page.stateRef;
                        } else {
                            dirState = dirState.join('/');
                        }
                    } else {
                        dirState = parentDirectory;

                        // Ce n'est pas un niveau, alors on peut concaténé le nom de la page
                        if (!page.niveauAction) {
                            dirState = dirState + '/' + page.name;
                        }
                    }

                    // Titre de la page
                    if (page.title) {
                        state.data.pageTitle = page.title;
                    }

                    // Données suplémentaire pour la route
                    if (page.data) {
                        state.data = Object.assign({}, state.data, page.data);
                    }

                    // Définition de la vue html
                    if (page.views && typeof page.views === 'object') {
                        // On fait référence à une vue qui est le dossier "common"
                        if (page.views.contentCommon) {
                            templateUrl = {templateUrl: 'views/w17_template/common/' + page.views.contentCommon};
                        } else {
                            if (page.views.content && typeof page.views.content === 'object') {
                                templateUrl = Object.assign({}, page.views.content);
                            } else if (typeof page.views.content === 'string') {
                                templateUrl = {templateUrl: 'views/w17_template/' + dirState + '/' + page.views.content};
                            }
                        }

                        // Définition de la vue dans la route pour le conteneur "content" de la route "winlassie"
                        state.views = {
                            'content@winlassie': templateUrl
                        };

                        state.data.haveTemplate = true;

                        // Paramètres de la vue
                        if (page.views.params && Array.isArray(page.views.params) && 0 < page.views.params.length) {
                            var paramsUrl = [];
                            var paramsSearch = [];

                            page.views.params.forEach(function (value) {
                                if (value.startsWith('?')) {
                                    paramsSearch.push(value.substring(1));
                                } else {
                                    paramsUrl.push(value);
                                }
                            });

                            if (0 < paramsUrl.length) {
                                state.url += '/:' + paramsUrl.join('/:');
                            }

                            if (0 < paramsSearch.length) {
                                state.url += '?' + paramsSearch.join('?')
                            }
                        }
                    }

                    states[routeName] = state;

                    if (Array.isArray(page.pages) && 0 < page.pages.length) {
                        setUpStates(page.pages, routeName, dirState);
                    }
                }
            });
        }

        /**
         * Définir les stateRef (routes par référence)
         * @param {Object[]} allPages
         * @param {Object[]=} pages
         */
        function setRefs(allPages, pages) {
            if (!pages) {
                pages = allPages;
            }

            for (var index = 0; index < pages.length; index++) {
                var stateRef;

                if (pages[index].stateRef) {
                    stateRef = stateRefSearch(allPages, pages[index].stateRef);

                    if (null !== stateRef) {
                        pages[index] = merge({}, stateRef, pages[index]);
                    }
                }

                if (pages[index].pages) {
                    pages[index].pages = setRefs(allPages, pages[index].pages);
                }
            }

            return pages;
        }

        /**
         * Chercher une state
         * @param {Object[]} pages
         * @param {String} stateName
         * @returns {null|Object}
         */
        function stateRefSearch(pages, stateName) {
            for (var i = 0; i < pages.length; i++) {
                if (pages[i].name === stateName) {
                    return pages[i];
                }
            }

            return null;
        }

        /**
         * Chaine vide ?
         * @param {*} str
         * @returns {Boolean}
         */
        function isEmpty(str) {
            if (null === str || typeof str === 'undefined') {
                return true;
            }

            if (typeof str === 'string') {
                return (0 === str.length);
            }

            if (typeof str === 'object' && Array.isArray(str)) {
                return (0 === str.length);
            }

            return false;
        }

        /**
         * Replace all occurences
         * @param {String} value
         * @param {String} target
         * @param {String} replacement
         * @returns {String}
         */
        function replaceAll(value, target, replacement) {
            return value.split(target).join(replacement);
        }

        /**
         * Add slashes
         * @param {String} str
         * @returns {String}
         */
        function addslashes(str) {
            //  discuss at: http://phpjs.org/functions/addslashes/
            // original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
            // improved by: Ates Goral (http://magnetiq.com)
            // improved by: marrtins
            // improved by: Nate
            // improved by: Onno Marsman
            // improved by: Brett Zamir (http://brett-zamir.me)
            // improved by: Oskar Larsson Högfeldt (http://oskar-lh.name/)
            //    input by: Denny Wardhana
            //   example 1: addslashes("kevin's birthday");
            //   returns 1: "kevin\\'s birthday"

            return (str + '')
                .replace(/[\\"']/g, '\\$&')
                .replace(/\u0000/g, '\\0');
        }
    });
};