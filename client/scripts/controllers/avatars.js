angular.module('spoons')
  .controller('AvatarsCtrl', function ($scope, $location, GameService) {
    $scope.selectAvatar = function (slide) {
      console.log("User picked", slide);
    };

    $scope.selectFromList = function(slideIndex) {
      console.log('selectFromList', slideIndex);
      $scope.slides[slideIndex].active = true;
      console.log($slides);
    };

    $scope.slides = [
      {
        image: "/images/beaver.png",
        active: true,
      },
      {
        image: "/images/bee.png",
        active: false,
      },
      {
        image: "/images/chicken.png",
        active: false,
      },
      {
        image: "/images/cow.png",
        active: false,
      },
      {
        image: "/images/dog.png",
        active: false,
      },
      {
        image: "/images/elephant.png",
        active: false,
      },
      {
        image: "/images/giraffe.png",
        active: false,
      },
      {
        image: "/images/goat.png",
        active: false,
      },
      {
        image: "/images/hippo.png",
        active: false,
      },
      {
        image: "/images/bear.png",
        active: false,
      },
      {
        image: "/images/owl.png",
        active: false,
      },
      {
        image: "/images/penguin.png",
        active: false,
      },
      {
        image: "/images/pig.png",
        active: false,
      },
      {
        image: "/images/sheep.png",
        active: false,
      },
      {
        image: "/images/turkey.png",
        active: false,
      },
      {
        image: "/images/zebra.png",
        active: false,
      },
    ];
});