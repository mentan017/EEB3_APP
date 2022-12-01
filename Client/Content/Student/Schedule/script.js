document.getElementById('save-btn').addEventListener('click', async function(e){
    e.stopImmediatePropagation();
    var SubjectsInputs = document.getElementsByClassName('subject-input');
    var ClassroomsInputs = document.getElementsByClassName('classroom-input');
    var ClassesLength = (document.getElementsByClassName('class')).length;
    var DaysLength = (document.getElementsByClassName('day-container')).length;
    var Days = [];
    for(var i=0; i<DaysLength; i++){
        var Classes = [];
        for(var j=0; j<(ClassesLength/DaysLength); j++){
            var Class = {
                Class: (SubjectsInputs[(i*(ClassesLength/DaysLength))+j].value).toUpperCase(),
                Classroom: (ClassroomsInputs[(i*(ClassesLength/DaysLength))+j].value).toUpperCase(),
                TimePeriod: j+1
            };
            Classes.push(Class);
        }
        Days.push(Classes);
    }
    //Do the request to the server
    var response = await fetch('/content/uploadSchedule', {
        method: "PUT",
        headers: {'Content-type': 'application/json'},
        body: JSON.stringify({Schedule: Days})
    });
    console.log(response.status);
});