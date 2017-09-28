(function () {
    angular.module('winlassie').config(['$stateProvider', function ($stateProvider) {
        $stateProvider
            .state('winlassie.403', {
                url: '/403',
                data: {
                    haveTemplate: true,
                    hidden: true,
                    requireLogin: true,
                    pageTitle: 'Accès refusé'
                },
                views: {
                    'content@winlassie': {
                        templateUrl: 'views/w17_template/common/403.html'
                    }
                }
            })
        ;
    }]);
})();
