require(['./requireConfig'], function (_) {
    require(['jquery'], function ($) {
        $(document).ready(function () {
            require(['../app/home']);
        });
    });
});
