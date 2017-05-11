(function () {
    angular.module('winlassie').config(['$stateProvider', function ($stateProvider) {
        $stateProvider
            .state('winlassie.403', {
                url: '/403',
                data: {
                    haveTemplate: true,
                    requireLogin: true,
                    pageTitle: 'Accès refusé'
                },
                views: {
                    'content@winlassie': {
                        templateUrl: 'views/w17_template/common/403.html'
                    }
                }
            })
            .state('winlassie.analyses_donnees', {
                url: '/analyses-donnees',
                data: {
                    haveTemplate: true,
                    requireLogin: true,
                    pageTitle: 'Analyses de données'
                },
                views: {
                    'content@winlassie': {
                        templateUrl: 'views/w17_template/analyses_donnees/analyses_donnees.html'
                    }
                }
            })
            .state('winlassie.analyses_donnees.view', {
                url: '/view/:id',
                data: {
                    haveTemplate: true,
                    action: 'view',
                    requireLogin: true,
                    pageTitle: 'Visualisation d\'une analyse de données'
                },
                views: {
                    'content@winlassie': {
                        templateUrl: 'views/w17_template/analyses_donnees/analyses_donnees_view.html'
                    }
                }
            })
            .state('winlassie.analyses_donnees.create', {
                url: '/create',
                data: {
                    haveTemplate: true,
                    action: 'create',
                    requireLogin: true,
                    pageTitle: 'Création d\'une analyse de données'
                },
                views: {
                    'content@winlassie': {
                        templateUrl: 'views/w17_template/analyses_donnees/analyses_donnees_edit.html'
                    }
                }
            })
            .state('winlassie.analyses_donnees.edit', {
                url: '/edit/:id',
                data: {
                    haveTemplate: true,
                    action: 'edit',
                    requireLogin: true,
                    pageTitle: 'Modification d\'une analyse de données'
                },
                views: {
                    'content@winlassie': {
                        templateUrl: 'views/w17_template/analyses_donnees/analyses_donnees_edit.html'
                    }
                }
            })
            .state('winlassie.analyses_donnees.delete', {
                url: '/delete/:id',
                data: {
                    haveTemplate: true,
                    action: 'delete',
                    requireLogin: true,
                    pageTitle: 'Suppression d\'une analyse de données'
                },
                views: {
                    'content@winlassie': {
                        templateUrl: 'views/w17_template/analyses_donnees/analyses_donnees_view.html'
                    }
                }
            })
        ;
    }]);
})();
