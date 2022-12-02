window.onload = FillSchedule();

async function FillSchedule(){
    //Do a request to the server to fetch the user schedule
    var response = await fetch('/content/schedule', {
        method: "POST",
        headers: {'Content-type': 'application/json'},
        body: JSON.stringify({}) //check if really needed
    });
    if(response.status == 200){
        var Schedule = await response.json();
        var SubjectsInputs = document.getElementsByClassName('subject-input');
        var ClassroomsInputs = document.getElementsByClassName('classroom-input');
        for(var i=0; i<Schedule.length; i++){
            for(var j=0; j<Schedule[i].Classes.length; j++){
                SubjectsInputs[(i*Schedule[i].Classes.length)+j].value = Schedule[i].Classes[j].Subject;
                ClassroomsInputs[(i*Schedule[i].Classes.length)+j].value = Schedule[i].Classes[j].Classroom;
            }
        }
    }else if(response.status == 401){
        window.location.href = "/auth/login"
    }else if(response.status == 500){
        window.alert("An error occured in the servers. Please try again later.");
    }
}

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
                Subject: (SubjectsInputs[(i*(ClassesLength/DaysLength))+j].value).toUpperCase(),
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
    if(response.status == 200){
        window.alert("Schedule updated successfully!");
    }else if(response.status == 401){
        window.location.href = "/auth/login";
    }else if(response.status == 500){
        window.alert("An error occured in the servers. Please try again later.");
    }
});