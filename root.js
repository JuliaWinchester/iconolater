var app = angular.module('root', []);

app.service('Structure', ['$rootScope', function($rootScope) {
  var service = {
    structNum: 0,
    structures: [],
    structLabels: [],
    findDestroy: function (arrayOfObjs, ObjID) {
      var result = arrayOfObjs.filter(function(obj) {
        return obj.id == ObjID; })[0];
      var index = arrayOfObjs.indexOf(result);
      if (arrayOfObjs[index].labelPath) {
        arrayOfObjs[index].labelPath.group.remove();
      }
      if (index > -1) {
        arrayOfObjs.splice(index, 1);
      }
    },
    addStructure: function (structName) {
      service.structures.push({id: service.structNum, text: structName});
      service.structLabels.push({id: service.structNum, labelPath: new labelPath(structName, [100, 100], [200, 200])});
      $rootScope.$broadcast('structures.update');
      service.structNum += 1;
      view.draw();
    },
    deleteStructureArray: function (structs) {
      if (structs.length > 0) {
        for (var i = 0; i < structs.length; i++) {
          service.deleteStructure(structs[i]);
        }
        $rootScope.$broadcast('structures.update');
        view.draw();
      } 
    },
    deleteStructure: function (structID) {
      service.findDestroy(service.structures, structID);
      service.findDestroy(service.structLabels, structID);
    } 
  }
  return service;
}]);

app.service('Image', function() {
  var service = {
    raster: null,
    addImage: function(imageBlobURL) {
      if (service.raster) { service.raster.remove(); }
      service.raster = new Raster(imageBlobURL);
      view.draw();
    }
  }
  
  return service;
});

app.service('Canvas', ['Image', function(Image) {
  var service = {
    repositionImage: function(initHeight, newHeight) {
      var initRasterY = Image.raster.position.y;
      var initRelPos = initRasterY/initHeight;
      Image.raster.position.y = initRelPos*view.size.height;
    },
    resizeCanvasHeight: function(newHeight) {
      if (newHeight < 183) {
        newHeight = 183;
      }
      else {
        newHeight = Math.round(newHeight);
      }
      var initHeight = view.size.height;
      var ctx = document.getElementById("canvas").getContext("2d");
      ctx.canvas.height = newHeight;
      var toolbar = document.getElementById("nav");
      var toolHeight = newHeight - 183.0;
      toolbar.style.paddingBottom = (newHeight-183.0) + "px";
      view.viewSize = [ctx.canvas.width, newHeight];
      if (Image.raster) { service.repositionImage(initHeight, newHeight); }
    }
  }

  return service;
}]);

app.controller("MyCtrl", ["$scope", "Structure", function($scope, Structure) {
  $scope.$on('structures.update', function(event) {
    $scope.structures = Structure.structures;
    $scope.textvar = "";
    $scope.selectedStructures.splice(0, $scope.selectedStructures.length);
    $scope.$apply(); 
  });
	
  $scope.structures = Structure.structures;
  $scope.textvar;
  $scope.selectedStructures = [];
  $scope.cheight = 600;
}]);

app.directive('zoomImageIn', ['Image', 'Canvas', function (Image, Canvas) {
  return {
    restrict: 'A',
    link: function (scope, element, attrs) {
      function zoomIn () {
        if (Image.raster) {
          Image.raster.scale(1.1);
          Canvas.resizeCanvasHeight(Image.raster.bounds.height+100);
          view.draw();
        }
      }

      element.on('click', zoomIn);
    }
  }
}]);

app.directive('zoomImageOut', ['Image', 'Canvas', function (Image, Canvas) {
  return {
    restrict: 'A',
    link: function (scope, element, attrs) {
      function zoomOut () {
        if (Image.raster) {
          Image.raster.scale(0.9);
          Canvas.resizeCanvasHeight(Image.raster.bounds.height+100);
          view.draw();
        }
      }

      element.on('click', zoomOut);
    }
  }
}]);

app.directive('centerImage', ['Image', function (Image) {
  return {
    restrict: 'A',
    link: function (scope, element, attrs) {
      function centerImage () {
        if (Image.raster) {
          Image.raster.position = view.center;
          view.draw();
        }
      }

      element.on('click', centerImage);
    }
  }
}]);

app.directive('addImage', ['Image', 'Canvas', function (Image, Canvas) {
  return {
    restrict: 'A',
    link: function (scope, element, attrs) {
      function addImage () {
        var f = document.getElementById('file').files[0];
        Image.addImage(URL.createObjectURL(f));
         
        Image.raster.onLoad = function () {
          newHeight = Image.raster.height + 100;
          Canvas.resizeCanvasHeight(newHeight);
          Image.raster.position = view.center;
        }
        
      }

      element.on('click', addImage);
    }
  }
}]);

app.directive('addStructure', ['Structure', 'Image', function (Structure, Image) {
  return {
    restrict: 'A',
    link: function (scope, element, attrs) {
      function add () {
        if ((scope.textvar != "") && Image.raster) {
          Structure.addStructure(scope.textvar);
        }
      }

      if (element.prop('tagName') === 'BUTTON') {
        element.on('click', add);
      } else if (element.prop('tagName') === 'INPUT') {
        element.bind('keydown', function(event) {
          if (event.which === 13) { add(); }
        }); 
      }
    }
  }
}]);

app.directive('deleteOneStructure', ['Structure', function (Structure) {
  return {
    restrict: 'A',
    scope: {
      itemid: '='
    },
    link: function(scope, element, attrs) {
      function deleteOneStruct () {
        Structure.deleteStructureArray([scope.itemid]);
        console.log('baleeted');
      }
      element.on('click', deleteOneStruct);
    }
  }
}]);

app.directive('deleteStructure', ['Structure', function (Structure) {
  return {
    restrict: 'A',
    link: function (scope, element, attrs) {
      function deleteStruct () {
        if (scope.selectedStructures) {
          Structure.deleteStructureArray(scope.selectedStructures); 
        }
      }   
      element.on('click', deleteStruct);
    }
  }
}]);

app.directive('draw', [function () {
  return {
    restrict: 'A',
    link: function (scope, element, attrs) {
      function init() {
        paper.install(window);
        paper.setup(element[0]);
      }

      init();
      var tool = new Tool;
      uiDrag(tool);
      view.draw();
    }
  }
}]);

