angular.module('spoons')
  .controller('AvatarsCtrl', function ($scope, $location, GameService) {
    $scope.selectAvatar = function (slide) {
      console.log("User picked", slide);
    };

    $scope.slides = [
      {
        image: "/images/beaver.png",
      },
      {
        image: "/images/bee.png",
      },
      {
        image: "/images/chicken.png",
      },
      {
        image: "/images/cow.png",
      },
      {
        image: "/images/dog.png",
      },
      {
        image: "/images/elephant.png",
      },
      {
        image: "/images/giraffe.png",
      },
      {
        image: "/images/goat.png",
      },
      {
        image: "/images/hippo.png",
      },
      {
        image: "/images/bear.png",
      },
      {
        image: "/images/owl.png",
      },
      {
        image: "/images/penguin.png",
      },
      {
        image: "/images/pig.png",
      },
      {
        image: "/images/sheep.png",
      },
      {
        image: "/images/turkey.png",
      },
      {
        image: "/images/zebra.png",
      },
    ];
});