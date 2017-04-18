

var app = angular.module('myApp',[]);

//Парсер данных занятий в школах
app.factory('dataAboutCourses',function($http) {
    return $http.get('dataJson/dataSchool.json').success(function (data) {
        return  data;
    });
});

//Парсер данных о вместимости аудиторий
app.factory('dataAboutClass',function($http) {
    return $http.get('dataJson/dataClasses.json').success(function(data) {
      console.log(data);
      return data;
    });
});

app.controller('MainController', ['$scope','dataAboutCourses', 'dataAboutClass', 'orderByFilter', function($scope, dataAboutCourses, dataAboutClass, orderBy) {

  dataAboutCourses.success(function(data) {
      $scope.timetableCourses = data;
      console.log(data);
      for(var i=0; i<$scope.timetableCourses.length;i++) {
          for (var y = 0; y < $scope.timetableCourses[i].coursesData.length; y++) {
              $scope.timetableCourses[i].coursesData[y].date = new Date($scope.timetableCourses[i].coursesData[y].date);
          }
      };
  });

  dataAboutClass.success(function(data) {
      $scope.dataClasses = data;
  });

  $scope.minDate = new Date(1476748800000);
  $scope.maxDate = new Date(1482019200000);
  $scope.joinLecture = false;

  //Изменение названия школы
  $scope.updateName = function(index,newName){
    //Если входной параметр пустой, тогда выход
    if(newName == ""){
      return;
    }
    else{
      $scope.timetableCourses[index].name =newName;
    }
  }

  //Изменение названия лекции
  $scope.updateLectureTitle = function(parentIndex ,index,newName){
    //Если входной параметр пустой, тогда выход
    if(newName !== ""){
      $scope.timetableCourses[parentIndex].coursesData[index].lectureTitle=newName;
    }
    else{
      return;
    }
  }

  //Изменение ФИО лектора
  $scope.updateLecturerName= function(parentIndex,index,newName, joinLecture){
    //Проверка, есть ли у этого лектора лекция в это время

    //Если входной параметр пустой или его значение не меняется, тогда выход
    if($scope.timetableCourses[parentIndex].coursesData[index].lecturerName ==newName
    ||
    (newName == "")
    ){
      return;
    }
    //Иначе проверка на наличие лекции у леткора в определенный день
    else{
      $scope.countForName =0;
      for(var i=0; i<$scope.timetableCourses.length;i++){
        for(var y=0; y<$scope.timetableCourses[i].coursesData.length;y++){
          //Если даты совпадают и имена лекторов совпадают (при этом лекция не совместная), то ошибка
          if($scope.timetableCourses[i].coursesData[y].date.toLocaleString() == $scope.timetableCourses[parentIndex].coursesData[index].date.toLocaleString()
          &&
          $scope.timetableCourses[i].coursesData[y].lecturerName.toLowerCase() == newName.toLowerCase()
          && joinLecture == false
          ){
            alert('У этого лектора уже есть лекция в это время!');
            return
          }
          else{
            $scope.timetableCourses[parentIndex].coursesData[index].lecturerName=newName;
            return;
          }
        }
      }
    }
  }

  //Изменения даты и номера класса с проверкой на наличие уже существующих занятий в это время в этом кабинете
  $scope.updateValue = function(parentIndex, index,newValue, joinLecture){

    // joinLecture - проверка - совместная лекция или нет
    // но одна школа не может проводить сама с собой совместную лекцию

     //Проверка на отличие нового значения от старого

    //Если параметр пустой или значение не меняется, то выход
    if(($scope.timetableCourses[parentIndex].coursesData[index].date ==newValue)
    ||
    (newValue == $scope.timetableCourses[parentIndex].coursesData[index].classNum)
    || newValue == null
    ){
      return;
    }
    //Иначе пробег по массиву с проверкой на уже существующие значения даты / номера класса
    else{
      //Пробег по массиву с проверкой на уже существующие значения даты / номера класса
      for(var i=0; i<$scope.timetableCourses.length;i++){
        for(var y=0; y<$scope.timetableCourses[i].coursesData.length;y++){
          //Проверка на тип входного параметра (дата или номер класса)

          //Если входной параметр - строка (название аудитории)
          if(typeof newValue === "string"){
            //Проверка - в одном классе не может быть 2 лекции в одно время
            //Если даты и аудитории совпадают, при этом лекция не совместная, то ошибка
            if(joinLecture == false
            &&$scope.timetableCourses[i].coursesData[y].date.toLocaleString() == $scope.timetableCourses[parentIndex].coursesData[index].date.toLocaleString()
            &&
            $scope.timetableCourses[i].coursesData[y].classNum.toLowerCase()== newValue.toLowerCase() )
            {
              if(joinLecture == false || $scope.timetableCourses[parentIndex].name == $scope.timetableCourses[i].name ){
                  alert("Извините, но в этот день аудитория занята!");
                  return;
              }
            }

            // Проверка:
            // Если лекция совместная, проверяет сходство даты и номера класса
            // Провераяет на вместимомть аудитории
            if(joinLecture == true
            && $scope.timetableCourses[parentIndex].name !== $scope.timetableCourses[i].name
            && $scope.timetableCourses[i].coursesData[y].date.toLocaleString() == $scope.timetableCourses[parentIndex].coursesData[index].date.toLocaleString()
            && $scope.timetableCourses[i].coursesData[y].classNum.toLowerCase() == newValue.toLowerCase()
            ){
              for( var z in $scope.dataClasses){
                if(z.toLowerCase() == newValue.toLowerCase()){
                  if(
                   $scope.dataClasses[z] >= ($scope.timetableCourses[parentIndex].numberPersons+$scope.timetableCourses[i].numberPersons)
                  ){
                    $scope.timetableCourses[parentIndex].coursesData[index].classNum =newValue;
                  }
                  //Ошибка, если кол-во человек в школе больше чем вместимость аудитории
                  else{
                    alert('Извинине, но в этой аудитории не хватит мест для двух школ!');
                    return;
                  }
                }
              }
            }
          }
          //Если входной параметр - дата
          else{
            //Если даты совпадают и при этом лекция не совместная, то ошибка
            if(joinLecture == false
            &&$scope.timetableCourses[i].coursesData[y].date.toLocaleString() == newValue.toLocaleString()
            ){
              //Проверка - для одна школа не может проводить сама с собой совместную лекцию
              if((joinLecture == true && $scope.timetableCourses[parentIndex].name == $scope.timetableCourses[i].name)
              ||
              //Проверка - в одно время, в одной удитории не может быть 2 лекции (если это не совместная лекция)
              (joinLecture == false
              &&
              $scope.timetableCourses[i].coursesData[y].classNum.toLowerCase() == $scope.timetableCourses[parentIndex].coursesData[index].classNum.toLowerCase())
              ||
              //Проверка - один лектор не может вести 2 лекции одновременно (если это не совместная лекция)
              joinLecture == false
              &&
              ($scope.timetableCourses[i].coursesData[y].lecturerName.toLowerCase() == $scope.timetableCourses[parentIndex].coursesData[index].lecturerName.toLowerCase())
              ){
                alert("Извините, но это время уже занято!");
                return;
              }
            }

            // Проверка:
            // Если лекция совместная, проверяет сходство даты и номера класса
            // Провераяет на вместимомть аудитории
            if(joinLecture == true
            && $scope.timetableCourses[parentIndex].name !== $scope.timetableCourses[i].name
            && $scope.timetableCourses[i].coursesData[y].classNum.toLowerCase() == $scope.timetableCourses[parentIndex].coursesData[index].classNum.toLowerCase()
            && $scope.timetableCourses[i].coursesData[y].date.toLocaleString() == newValue.toLocaleString()){

              for( var z in $scope.dataClasses){
                if(z.toLowerCase() == $scope.timetableCourses[parentIndex].coursesData[index].classNum.toLowerCase()){
                  if(
                  $scope.dataClasses[z]>= ($scope.timetableCourses[parentIndex].numberPersons+$scope.timetableCourses[i].numberPersons)
                  ){
                    $scope.timetableCourses[parentIndex].coursesData[index].date =newValue;
                  }
                  //Ошибка, если кол-во человек в школе больше чем вместимость аудитории
                  else{
                    alert('Извинине, но в этой аудитории не хватит мест для двух школ!');
                    return;
                  }
                }
              }
            }
          }
        }
      }
    }

    //Если входной параметр - строка (название аудитории)
    if(typeof newValue === "string"){
      //Проверка на кол-во мест в аудитории и кол-во людей на курсе
      for( var z in $scope.dataClasses){
        if(z.toLowerCase() == newValue.toLowerCase()){
          if($scope.dataClasses[z]>= $scope.timetableCourses[parentIndex].numberPersons)
          {
            $scope.timetableCourses[parentIndex].coursesData[index].classNum =newValue;
          }
          //Ошибка, если кол-во человек в школе больше чем вместимость аудитории
          else{
            alert('Извинине, но в этой аудитории не хватит для всех мест!');
            return;
          }
        }
      }
    }
    else{
      $scope.timetableCourses[parentIndex].coursesData[index].date =newValue;
    }

    //Сортировка массива по дате
    $scope.StimetableCourses = orderBy($scope.timetableCourses[parentIndex].coursesData, 'date' );
    $scope.timetableCourses[parentIndex].coursesData = $scope.StimetableCourses;
  }

  //функции для для поиска занятый в интервал времени
  $scope.filterMinDate =  function(data) {
    if ($scope.minDate !== null){
      return data.date >= $scope.minDate;
    }
    else{
    return data.date ;
    }
  }
  $scope.filterMaxDate =  function(data) {
    if ($scope.maxDate !== null){
      return data.date <= $scope.maxDate;
    }
    else{
      return data.date;
    }
  }

}]);



