window.onload = FetchAbsences();

async function FetchAbsences(){
    var response = await fetch('/content/fetchAbsences', {
        method: "POST",
        headers: {'Content-type': 'application/json'}
    });
    if(response.status == 200){
        var responseData = await response.json();
        console.log(responseData);
        var PeriodCancelledClasses = document.getElementsByClassName('period-cancelled-classes');
        for(var i=0; i<responseData.length; i++){
            for(var j=0; j<responseData[i].length; j++){
                if(responseData[i][j].UserHasClass){
                    PeriodCancelledClasses[i].innerHTML += `<p style="background-color: yellow" >${responseData[i][j].Class}</p>`;
                }else{
                    PeriodCancelledClasses[i].innerHTML += `<p>${responseData[i][j].Class}</p>`;
                }
            }
        }
    }else if(response.status == 204){
        document.getElementsByClassName('period-cancelled-classes')[4].innerHTML = `<p>No Absences</p>`;
    }
}